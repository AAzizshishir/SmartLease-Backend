import { z } from "zod";

export const createLeaseApplicationSchema = z.object({
  unit_id: z.string(),
  preferred_move_in: z.coerce.date({
    message: "Please select a move-in date",
  }),
  profession: z.string().min(2, "Profession must be at least 2 characters"),
  monthly_income: z.number().positive("Monthly income must be greater than 0"),
  work_place_address: z.string().optional(),
  num_occupants: z.number().int().positive().default(1),
  has_pets: z.boolean().default(false),
  nid_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  income_proof_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  message: z
    .string()
    .max(500, "Message cannot exceed 500 characters")
    .optional(),
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
