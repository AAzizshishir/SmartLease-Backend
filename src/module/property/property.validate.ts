import z from "zod";

// create property validation schema
export const createPropertySchema = z.object({
  name: z
    .string("Property name is required and must be string")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name too long"),

  address: z
    .string("Address is required and must be string")
    .min(5, "Address must be at least 5 characters"),

  city: z
    .string("City is required and must be string")
    .min(2, "City must be at least 2 characters"),

  total_units: z
    .number("Total units is required and must be number")
    .int("Must be a whole number")
    .positive("Must be greater than 0")
    .max(500, "Cannot exceed 500 units"),

  description: z.string().max(500, "Description too long").optional(),
});

// update property validation schema
export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
