// notice/notice.validation.ts
import { z } from "zod";

export const createNoticeSchema = z.object({
  property_id: z.string("Property ID is required"),
  unit_id: z.string().optional(),
  title: z
    .string("Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title too long"),
  body: z
    .string("Body is required")
    .min(10, "Body must be at least 10 characters"),
  type: z
    .enum(
      [
        "general",
        "maintenance",
        "rent_increase",
        "inspection",
        "lease_reminder",
        "emergency",
      ],
      { error: "Invalid notice type" },
    )
    .default("general"),
  target: z
    .enum(["all_tenants", "specific_unit"], { error: "Invalid target" })
    .default("all_tenants"),
  effective_from: z.coerce.date().optional(),
});

export const updateNoticeSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  body: z.string().min(10).optional(),
  type: z
    .enum([
      "general",
      "maintenance",
      "rent_increase",
      "inspection",
      "lease_reminder",
      "emergency",
    ])
    .optional(),
  effective_from: z.coerce.date().optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
