import { z } from "zod";

export const createUnitSchema = z.object({
  unit_number: z
    .string("Unit number is required")
    .min(1, "Unit number is required")
    .max(10, "Unit number too long"),

  floor: z
    .number("Floor is required")
    .int("Must be a whole number")
    .min(0, "Floor cannot be negative"),

  type: z.enum(
    ["studio", "one_bed", "two_bed", "three_bed", "four_bed", "penthouse"],
    {
      error:
        "Type must be studio, one_bed, two_bed, three_bed, four_bed or penthouse",
    },
  ),

  furnishing_status: z
    .enum(["unfurnished", "semi_furnished", "fully_furnished"], {
      error:
        "Furnishing status must be unfurnished, semi_furnished or fully_furnished",
    })
    .optional()
    .default("unfurnished"),

  area_sqft: z
    .number()
    .positive("Area must be greater than 0")
    .max(10000, "Area seems too large")
    .optional(),

  bedrooms: z
    .number("Bedrooms is required")
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(10, "Cannot exceed 10 bedrooms"),

  bathrooms: z
    .number("Bathrooms is required")
    .int("Must be a whole number")
    .min(1, "Must have at least 1 bathroom")
    .max(10, "Cannot exceed 10 bathrooms"),

  balconies: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(5, "Cannot exceed 5 balconies")
    .optional()
    .default(0),

  monthly_rent: z
    .number("Monthly rent is required")
    .positive("Rent must be greater than 0")
    .max(1000000, "Rent seems too high"),

  security_deposit_months: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1 month")
    .max(6, "Cannot exceed 6 months")
    .optional()
    .default(2),

  // amenities
  has_parking: z.boolean().optional().default(false),
  has_ac: z.boolean().optional().default(false),
  has_lift: z.boolean().optional().default(false),
  has_gas: z.boolean().optional().default(false),
  has_generator: z.boolean().optional().default(false),
  has_water_supply: z.boolean().optional().default(true),
  is_pet_friendly: z.boolean().optional().default(false),

  available_from: z.coerce
    .date()
    .min(new Date(), "Available date cannot be in the past")
    .optional(),
});

export const updateUnitSchema = createUnitSchema.partial();

// export type CreateUnitInput = z.infer<typeof createUnitSchema>;
// export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
