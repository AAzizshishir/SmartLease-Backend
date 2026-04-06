import { StatusCodes } from "http-status-codes";
import { Payment, Prisma } from "../../generated/prisma/client";
import { IQueryParams } from "../../interface/query.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ManualPaymentInput, RefundDepositInput } from "./payment.validate";

// Tenant — payment
const getMyPayments = async (tenant_id: string, query: IQueryParams) => {
  const result = await new QueryBuilder<
    Payment,
    Prisma.PaymentWhereInput,
    Prisma.PaymentInclude
  >(prisma.payment, query, {
    filterableFields: ["status", "type", "billing_month"],
    defaultSortBy: "due_date",
  } as any)
    .filter()
    .where({ tenant_id } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Tenant — current month payment
const getCurrentPayment = async (tenant_id: string) => {
  const now = new Date();
  const billingMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const payment = await prisma.payment.findFirst({
    where: {
      tenant_id,
      billing_month: billingMonth,
      type: "rent",
    },
    select: {
      id: true,
      type: true,
      amount: true,
      late_fee: true,
      total_amount: true,
      billing_month: true,
      due_date: true,
      paid_at: true,
      status: true,
      is_manual: true,
      lease: {
        select: {
          monthly_rent: true,
          late_fee_amount: true,
          unit: {
            select: {
              unit_number: true,
              property: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return payment;
};

// Tenant — deposit payment
const getDepositPayment = async (tenant_id: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      tenant_id,
      type: "security_deposit",
      status: { in: ["pending", "late"] },
    },
    select: {
      id: true,
      type: true,
      amount: true,
      total_amount: true,
      due_date: true,
      status: true,
      lease: {
        select: {
          deposit_deadline: true,
          security_deposit: true,
        },
      },
    },
  });

  return payment;
};

// Tenant — pay via Stripe (manual option removed)
const payNow = async (id: string, tenant_id: string) => {
  const payment = await prisma.payment.findFirst({
    where: { id, tenant_id },
    select: {
      id: true,
      status: true,
      type: true,
      total_amount: true,
      lease_id: true,
    },
  });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status === "paid") {
    throw new AppError(StatusCodes.BAD_REQUEST, "This payment is already paid");
  }

  if (payment.status === "waived") {
    throw new AppError(StatusCodes.BAD_REQUEST, "This payment has been waived");
  }

  // TODO: Stripe integration
  // const session = await stripe.checkout.sessions.create({...})
  // return { url: session.url }

  // For now, simulate Stripe success
  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paid_at: new Date(),
      },
      select: {
        id: true,
        status: true,
        type: true,
        amount: true,
        total_amount: true,
        paid_at: true,
        billing_month: true,
      },
    });

    // deposit হলে lease update হবে
    if (payment.type === "security_deposit") {
      await tx.lease.update({
        where: { id: payment.lease_id },
        data: { deposit_status: "paid", deposit_paid_at: new Date() },
      });
    }

    return updatedPayment;
  });

  return updated;
};

// Landlord — manually mark as paid (cash/cheque)
const markAsPaid = async (
  id: string,
  landlord_id: string,
  payload: ManualPaymentInput,
) => {
  const payment = await prisma.payment.findFirst({
    where: { id },
    select: {
      id: true,
      status: true,
      type: true,
      lease_id: true,
      lease: {
        select: { landlord_id: true },
      },
    },
  });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.lease.landlord_id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  if (payment.status === "paid") {
    throw new AppError(StatusCodes.BAD_REQUEST, "This payment is already paid");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        paid_at: new Date(),
        is_manual: true,
        manual_note: payload.manual_note,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        paid_at: true,
        is_manual: true,
        manual_note: true,
      },
    });

    // lease update - deposit
    if (payment.type === "security_deposit") {
      await tx.lease.update({
        where: { id: payment.lease_id },
        data: { deposit_status: "paid", deposit_paid_at: new Date() },
      });
    }

    return updatedPayment;
  });

  return updated;
};

// Landlord — lease-এর সব payment দেখো
const getLeasePayments = async (
  lease_id: string,
  landlord_id: string,
  query: IQueryParams,
) => {
  const lease = await prisma.lease.findFirst({
    where: { id: lease_id, landlord_id },
    select: { id: true },
  });

  if (!lease) {
    throw new AppError(StatusCodes.NOT_FOUND, "Lease not found");
  }

  const result = await new QueryBuilder<
    Payment,
    Prisma.PaymentWhereInput,
    Prisma.PaymentInclude
  >(prisma.payment, query, {
    filterableFields: ["status", "type"],
    defaultSortBy: "due_date",
  } as any)
    .filter()
    .where({ lease_id } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Landlord — payment summary
const getPaymentSummary = async (landlord_id: string) => {
  const now = new Date();
  const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [collected, pending, late] = await Promise.all([
    // paid
    prisma.payment.aggregate({
      where: {
        lease: { landlord_id },
        billing_month: billingMonth,
        status: "paid",
        type: "rent",
      },
      _sum: { total_amount: true },
      _count: true,
    }),

    // pending
    prisma.payment.aggregate({
      where: {
        lease: { landlord_id },
        billing_month: billingMonth,
        status: "pending",
        type: "rent",
      },
      _sum: { total_amount: true },
      _count: true,
    }),

    // late
    prisma.payment.aggregate({
      where: {
        lease: { landlord_id },
        billing_month: billingMonth,
        status: "late",
        type: "rent",
      },
      _sum: { total_amount: true },
      _count: true,
    }),
  ]);

  return {
    month: billingMonth,
    collected: {
      amount: collected._sum.total_amount ?? 0,
      count: collected._count,
    },
    pending: {
      amount: pending._sum.total_amount ?? 0,
      count: pending._count,
    },
    late: {
      amount: late._sum.total_amount ?? 0,
      count: late._count,
    },
  };
};

// Landlord — deposit refund
// Todo- deduction table
// const refundDeposit = async (
//   lease_id: string,
//   landlord_id: string,
//   payload: RefundDepositInput
// ) => {
//   const lease = await prisma.lease.findFirst({
//     where: {
//       id: lease_id,
//       landlord_id,
//       status: { in: ["expired", "terminated"] },
//       deposit_status: "paid",
//     },
//     select: {
//       id: true,
//       security_deposit: true,
//       deposit_status: true,
//     },
//   });

//   if (!lease) {
//     throw new AppError(
//       StatusCodes.NOT_FOUND,
//       "Lease not found or deposit cannot be refunded"
//     );
//   }

//   const refundAmount =
//     Number(lease.security_deposit) - (payload.deposit_deduction ?? 0);

//   if (refundAmount < 0) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       "Deduction cannot exceed deposit amount"
//     );
//   }

//   const updated = await prisma.lease.update({
//     where: { id: lease_id },
//     data: {
//       deposit_status:
//         payload.deposit_deduction && payload.deposit_deduction > 0
//           ? "partially_refunded"
//           : "refunded",
//       deposit_deduction: payload.deposit_deduction,
//       deposit_deduction_reason: payload.deposit_deduction_reason,
//       deposit_refunded_at: new Date(),
//     },
//     select: {
//       id: true,
//       security_deposit: true,
//       deposit_status: true,
//       deposit_deduction: true,
//       deposit_deduction_reason: true,
//       deposit_refunded_at: true,
//     },
//   });

//   return {
//     ...updated,
//     refund_amount: refundAmount,
//   };
// };

export const paymentService = {
  getMyPayments,
  getCurrentPayment,
  getDepositPayment,
  payNow,
  markAsPaid,
  getLeasePayments,
  getPaymentSummary,
};
