// maintenance/maintenance.validation.ts
import { z } from "zod";

export const createTicketSchema = z.object({
  unit_id: z.string("Unit ID is required"),
  title: z
    .string("Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title too long"),
  description: z
    .string("Description is required")
    .min(10, "Description must be at least 10 characters"),
  category: z.enum(
    [
      "plumbing",
      "electrical",
      "structural",
      "appliance",
      "pest_control",
      "cleaning",
      "other",
    ],
    { error: "Invalid category" },
  ),
  priority: z
    .enum(["low", "medium", "high", "urgent"], { error: "Invalid priority" })
    .default("medium"),
  preferred_date: z.coerce.date().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).optional(),
  category: z
    .enum([
      "plumbing",
      "electrical",
      "structural",
      "appliance",
      "pest_control",
      "cleaning",
      "other",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  preferred_date: z.coerce.date().optional(),
});

export const assignTicketSchema = z.object({
  assigned_to_name: z
    .string("Worker name is required")
    .min(2, "Name too short"),
  assigned_to_phone: z
    .string("Worker phone is required")
    .min(11, "Invalid phone number"),
});

export const resolveTicketSchema = z.object({
  resolution_note: z
    .string("Resolution note is required")
    .min(5, "Please describe what was done"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type ResolveTicketInput = z.infer<typeof resolveTicketSchema>;
