import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getMyPayments(
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payments fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getCurrentPayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getCurrentPayment(req.user!.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Current payment fetched successfully",
    data: payment,
  });
});

const getDepositPayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getDepositPayment(req.user!.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Deposit payment fetched successfully",
    data: payment,
  });
});

const payNow = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.payNow(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment successful",
    data: payment,
  });
});

const markAsPaid = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.markAsPaid(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment marked as paid",
    data: payment,
  });
});

const getLeasePayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getLeasePayments(
    req.params.lease_id as string,
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payments fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPaymentSummary = catchAsync(async (req: Request, res: Response) => {
  const summary = await paymentService.getPaymentSummary(req.user!.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment summary fetched successfully",
    data: summary,
  });
});

// const refundDeposit = catchAsync(async (req: Request, res: Response) => {
//   const result = await paymentService.refundDeposit(
//     req.params.lease_id,
//     req.user!.id,
//     req.body
//   );
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Deposit refunded successfully",
//     data: result,
//   });
// });

export const paymentController = {
  getMyPayments,
  getCurrentPayment,
  getDepositPayment,
  payNow,
  markAsPaid,
  getLeasePayments,
  getPaymentSummary,
  //   refundDeposit,
};
