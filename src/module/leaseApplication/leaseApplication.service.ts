import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import {
  CreateLeaseApplicationInput,
  RejectApplicationInput,
} from "./leaseApplication.validate";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { LeaseApplication, Prisma } from "../../generated/prisma/client";

const applyForUnit = async (
  tenant_id: string,
  payload: CreateLeaseApplicationInput,
) => {
  // check available and vacant
  const unit = await prisma.unit.findFirst({
    where: { id: payload.unit_id, is_deleted: false },
    select: { id: true, status: true, property_id: true },
  });

  if (!unit) {
    throw new AppError(StatusCodes.NOT_FOUND, "Unit not found");
  }

  if (unit.status !== "vacant") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This unit is not available for application",
    );
  }

  // 2. check already pending application
  const existingApplication = await prisma.leaseApplication.findFirst({
    where: {
      unit_id: payload.unit_id,
      tenant_id,
      status: { in: ["pending", "approved"] },
    },
  });

  if (existingApplication) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You already have an active application for this unit",
    );
  }

  // 3. auto-expire after 7 days
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const application = await prisma.leaseApplication.create({
    data: {
      ...payload,
      tenant_id,
      expires_at,
    },
    select: {
      id: true,
      status: true,
      preferred_move_in: true,
      profession: true,
      monthly_income: true,
      num_occupants: true,
      has_pets: true,
      message: true,
      expires_at: true,
      created_at: true,
      unit: {
        select: {
          id: true,
          unit_number: true,
          monthly_rent: true,
          property: {
            select: { name: true, address: true, city: true },
          },
        },
      },
    },
  });

  return application;
};

// Tenant — নিজের applications দেখো
const getTenantApplications = async (
  tenant_id: string,
  query: IQueryParams,
) => {
  const result = await new QueryBuilder<
    LeaseApplication,
    Prisma.LeaseApplicationWhereInput,
    Prisma.LeaseApplicationInclude
  >(prisma.leaseApplication, query, {
    filterableFields: ["status"],
    defaultSortBy: "created_at",
  } as any)
    .filter()
    .where({ tenant_id } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Tenant — application cancel করো
const cancelApplication = async (id: string, tenant_id: string) => {
  const application = await prisma.leaseApplication.findFirst({
    where: { id, tenant_id },
    select: { id: true, status: true },
  });

  if (!application) {
    throw new AppError(StatusCodes.NOT_FOUND, "Application not found");
  }

  if (application.status !== "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only pending applications can be cancelled",
    );
  }

  const updated = await prisma.leaseApplication.update({
    where: { id },
    data: { status: "cancelled" },
    select: { id: true, status: true },
  });

  return updated;
};

// Landlord — property-র applications দেখো
const getLandlordApplications = async (
  landlord_id: string,
  query: IQueryParams,
) => {
  const result = await new QueryBuilder<
    LeaseApplication,
    Prisma.LeaseApplicationWhereInput,
    Prisma.LeaseApplicationInclude
  >(prisma.leaseApplication, query, {
    filterableFields: ["status"],
    defaultSortBy: "created_at",
  })
    .filter()
    .where({
      status: { not: "cancelled" },
      unit: {
        property: {
          landlord_id: landlord_id,
        },
      },
      ...(query.unit_id ? { unit_id: query.unit_id } : {}),
    })
    .sort()
    .include({
      unit: {
        select: {
          unit_number: true,
          floor: true,
          property: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
      tenant: {
        select: {
          name: true,
          email: true,
        },
      },
    })
    .paginate()
    .execute();

  return result;
};

const getApplicationDetails = async (id: string) => {
  const application = await prisma.leaseApplication.findUnique({
    where: { id },
    include: {
      unit: {
        select: {
          unit_number: true,
          floor: true,
          property: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
      tenant: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return application;
};

// Shared validation For Approve and reject
const getAndValidateApplication = async (id: string, landlord_id: string) => {
  const application = await prisma.leaseApplication.findFirst({
    where: { id },
    select: {
      id: true,
      status: true,
      unit_id: true,
      tenant_id: true,
      unit: {
        select: {
          status: true,
          property: { select: { landlord_id: true } },
        },
      },
    },
  });

  if (!application)
    throw new AppError(StatusCodes.NOT_FOUND, "Application not found");
  if (application.unit.property.landlord_id !== landlord_id)
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  if (application.status !== "pending")
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only pending applications can be processed",
    );

  return application;
};

// Landlord - approved application
const approveApplication = async (id: string, landlord_id: string) => {
  const application = await getAndValidateApplication(id, landlord_id);
  if (application.unit.status !== "vacant")
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This unit is no longer available",
    );

  await prisma.$transaction(async (tx) => {
    await tx.leaseApplication.update({
      where: { id },
      data: { status: "approved", reviewed_at: new Date() },
    });

    await tx.leaseApplication.updateMany({
      where: {
        unit_id: application.unit_id,
        id: { not: id },
        status: "pending",
      },
      data: {
        status: "rejected",
        rejection_reason: "Another applicant was selected",
        reviewed_at: new Date(),
      },
    });

    await tx.unit.update({
      where: { id: application.unit_id },
      data: { status: "reserved" },
    });

    // 🔹 Optional: create lease record immediately
    // await tx.lease.create({ data: { unit_id: application.unit_id, tenant_id: application.tenant_id } });
  });

  return { message: "Application approved successfully" };
};

// Reject
const rejectApplication = async (
  id: string,
  landlord_id: string,
  payload: RejectApplicationInput,
) => {
  const application = await getAndValidateApplication(id, landlord_id);
  if (application.unit.status !== "vacant")
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This unit is no longer available",
    );

  return prisma.$transaction(async (tx) => {
    return tx.leaseApplication.update({
      where: { id },
      data: {
        status: "rejected",
        rejection_reason: payload.rejection_reason,
        reviewed_at: new Date(),
      },
      select: { id: true, status: true, rejection_reason: true },
    });
  });
};

export const leaseApplicationService = {
  applyForUnit,
  getTenantApplications,
  cancelApplication,
  getLandlordApplications,
  getApplicationDetails,
  approveApplication,
  rejectApplication,
};
