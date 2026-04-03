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

  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .max(10, "Cannot upload more than 10 images")
    .optional(),
});

// update property validation schema
export const updatePropertySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  type: z.enum(["apartment", "house", "commercial"]).optional(),
  total_units: z.number().int().positive().max(500).optional(),
  description: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export const propertyParamsSchema = z.object({
  params: z.object({
    id: z.string("Property ID is required").uuid("Invalid property ID format"),
  }),
});
