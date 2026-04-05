import { z } from "zod";

export const createLeaseSchema = z.object({
  start_date: z.coerce.date("Start date is required"),
  end_date: z.coerce.date("End date is required"),
  monthly_rent: z.number("Monthly rent is required").positive(),
  payment_due_day: z.number().int().min(1).max(28).default(5),
  late_fee_after_days: z.number().int().positive().default(5),
  late_fee_amount: z.number().default(0),
  security_deposit: z.number("Security deposit is required").positive(),
  deposit_deadline: z.coerce.date("Deposit deadline is required"),
  document_url: z.string().url().optional(),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
