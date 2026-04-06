// payment/payment.validation.ts
import { z } from "zod";

export const manualPaymentSchema = z.object({
  manual_note: z.string().optional(),
});

export const refundDepositSchema = z.object({
  deposit_deduction: z.number().min(0).default(0),
  deposit_deduction_reason: z.string().optional(),
});

export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;
export type RefundDepositInput = z.infer<typeof refundDepositSchema>;
