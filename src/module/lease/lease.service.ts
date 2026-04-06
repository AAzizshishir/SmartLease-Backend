import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { CreateLeaseInput } from "./lease.validate";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Lease, Prisma } from "../../generated/prisma/client";

// Landlord — create lease
const createLease = async (
  application_id: string,
  landlord_id: string,
  payload: CreateLeaseInput,
) => {
  const application = await prisma.leaseApplication.findFirst({
    where: { id: application_id, status: "approved" },
    select: {
      id: true,
      tenant_id: true,
      unit_id: true,
      lease_id: true,
      unit: {
        select: {
          property: { select: { landlord_id: true } },
        },
      },
    },
  });

  if (!application) {
    throw new AppError(StatusCodes.NOT_FOUND, "Approved application not found");
  }

  if (application.unit.property.landlord_id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  // create lease already?
  if (application.lease_id) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Lease already created for this application",
    );
  }

  // start date end date validate
  if (payload.start_date >= payload.end_date) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "End date must be after start date",
    );
  }

  const lease = await prisma.$transaction(async (tx) => {
    const newLease = await tx.lease.create({
      data: {
        unit_id: application.unit_id,
        tenant_id: application.tenant_id,
        landlord_id,
        ...payload,
        status: "pending_tenant",
      },
      select: {
        id: true,
        status: true,
        start_date: true,
        end_date: true,
        monthly_rent: true,
        security_deposit: true,
        deposit_status: true,
        deposit_deadline: true,
        payment_due_day: true,
        late_fee_after_days: true,
        late_fee_amount: true,
        created_at: true,
        tenant: {
          select: { id: true, name: true, email: true },
        },
        unit: {
          select: {
            unit_number: true,
            property: { select: { name: true, address: true } },
          },
        },
      },
    });

    // lease_id update in application
    await tx.leaseApplication.update({
      where: { id: application_id },
      data: { lease_id: newLease.id },
    });

    return newLease;
  });

  return lease;
};

// Tenant — active lease
const getMyLease = async (tenant_id: string) => {
  const lease = await prisma.lease.findFirst({
    where: {
      tenant_id,
      status: { in: ["pending_tenant", "active"] },
    },
    select: {
      id: true,
      status: true,
      start_date: true,
      end_date: true,
      monthly_rent: true,
      security_deposit: true,
      deposit_status: true,
      deposit_deadline: true,
      payment_due_day: true,
      late_fee_after_days: true,
      late_fee_amount: true,
      document_url: true,
      confirmed_at: true,
      unit: {
        select: {
          unit_number: true,
          floor: true,
          type: true,
          property: {
            select: {
              name: true,
              address: true,
              city: true,
              landlord: {
                select: { name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!lease) {
    throw new AppError(StatusCodes.NOT_FOUND, "No active lease found");
  }

  return lease;
};

const generateMonthlyPayments = (lease: {
  id: string;
  tenant_id: string;
  start_date: Date;
  end_date: Date;
  monthly_rent: any;
  payment_due_day: number;
}) => {
  const payments = [];
  const current = new Date(lease.start_date);
  const end = new Date(lease.end_date);

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const dueDate = new Date(year, month, lease.payment_due_day);
    const bilingMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

    payments.push({
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      type: "rent" as const,
      amount: lease.monthly_rent,
      total_amount: lease.monthly_rent,
      billing_month: bilingMonth,
      due_date: dueDate,
      status: "pending" as const,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return payments;
};

// Tenant — lease confirm
const confirmLease = async (id: string, tenant_id: string) => {
  const lease = await prisma.lease.findFirst({
    where: { id, tenant_id, status: "pending_tenant" },
    select: {
      id: true,
      start_date: true,
      end_date: true,
      monthly_rent: true,
      payment_due_day: true,
      unit_id: true,
      tenant_id: true,
      security_deposit: true,
      deposit_deadline: true,
    },
  });

  if (!lease) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Lease not found or already confirmed",
    );
  }

  await prisma.$transaction(async (tx) => {
    // lease active
    await tx.lease.update({
      where: { id },
      data: { status: "active", confirmed_at: new Date() },
    });

    // unit occupied
    await tx.unit.update({
      where: { id: lease.unit_id },
      data: { status: "occupied" },
    });

    // deposit payment create
    await tx.payment.create({
      data: {
        lease_id: lease.id,
        tenant_id: lease.tenant_id,
        type: "security_deposit",
        amount: lease.security_deposit,
        total_amount: lease.security_deposit,
        due_date: lease.deposit_deadline,
        status: "pending",
      },
    });

    // payment rows generate
    const payments = generateMonthlyPayments(lease);
    await tx.payment.createMany({ data: payments });
  });

  return { message: "Lease confirmed successfully" };
};

// Landlord — see all lease
const getLandlordLeases = async (landlord_id: string, query: IQueryParams) => {
  const result = await new QueryBuilder<
    Lease,
    Prisma.LeaseWhereInput,
    Prisma.LeaseInclude
  >(prisma.lease, query, {
    filterableFields: ["status"],
    defaultSortBy: "created_at",
  } as any)
    .filter()
    .where({ landlord_id } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Landlord — lease terminate করো
const terminateLease = async (
  id: string,
  landlord_id: string,
  reason: string,
) => {
  const lease = await prisma.lease.findFirst({
    where: { id, landlord_id, status: "active" },
    select: { id: true, unit_id: true },
  });

  if (!lease) {
    throw new AppError(StatusCodes.NOT_FOUND, "Active lease not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lease.update({
      where: { id },
      data: {
        status: "terminated",
        terminated_at: new Date(),
        termination_reason: reason,
      },
    });

    // unit vacant again
    await tx.unit.update({
      where: { id: lease.unit_id },
      data: { status: "vacant" },
    });

    // pending payments waived
    await tx.payment.updateMany({
      where: { lease_id: id, status: "pending" },
      data: { status: "waived" },
    });
  });

  return { message: "Lease terminated successfully" };
};

export const leaseService = {
  createLease,
  getMyLease,
  confirmLease,
  getLandlordLeases,
  terminateLease,
};
