import { z } from "zod";

export const createLeaseSchema = z.object({
  start_date: z.date(),
  end_date: z.date(),
  monthly_rent: z.number("Monthly rent is required").positive(),
  payment_due_day: z.number("payment due day is required").gte(1).lte(28),
  late_fee_after_days: z.number().positive(),
  late_fee_amount: z.number().positive(),
  security_deposit: z.number("Security deposit is required").positive(),
  deposit_deadline: z.date("Deposit deadline is required"),
  document_url: z.string().url().or(z.literal("")),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
