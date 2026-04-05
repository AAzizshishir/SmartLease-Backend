import { z } from "zod";

export const createLeaseApplicationSchema = z.object({
  unit_id: z.string("Unit ID is required"),
  preferred_move_in: z.coerce.date("Preferred move-in date is required"),
  profession: z.string("Profession is required").min(2),
  monthly_income: z
    .number("Monthly income is required and must be number")
    .positive("Must be greater than 0"),
  work_place_address: z.string().optional(),
  num_occupants: z.number().int().positive().default(1),
  has_pets: z.boolean().default(false),
  nid_url: z.string().url("Invalid NID URL").optional(),
  income_proof_url: z.string().url("Invalid URL").optional(),
  message: z.string().max(500).optional(),
});

export const rejectApplicationSchema = z.object({
  rejection_reason: z
    .string("Rejection reason is required")
    .min(5, "Please provide a reason"),
});

export type CreateLeaseApplicationInput = z.infer<
  typeof createLeaseApplicationSchema
>;
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
