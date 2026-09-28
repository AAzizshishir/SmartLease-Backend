import z from "zod";
import { Facility, NearbyPlaceType } from "../../generated/prisma/enums";

const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === "string" ? JSON.parse(v) : v),
    z.array(schema),
  );

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

  facilities: jsonArray(z.enum(Facility)).default([]),

  nearby_places: jsonArray(
    z.object({
      type: z.enum(NearbyPlaceType),
      name: z.string().min(1),
      distance_km: z.coerce.number().min(0),
    }),
  ).default([]),
});

// update property validation schema
export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
