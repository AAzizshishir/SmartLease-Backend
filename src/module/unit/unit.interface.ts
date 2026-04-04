import { FurnishingStatus, UnitType } from "../../generated/prisma/enums";

export interface CreateUnitPayload {
  unit_number: string;
  floor: number;
  type: UnitType;
  furnishing_status: FurnishingStatus;
  area_sqft?: number;
  bedrooms: number;
  bathrooms: number;
  balconies?: number;
  monthly_rent: number;
  security_deposit_months?: number; // default 2
  has_parking?: boolean;
  has_ac?: boolean;
  has_lift?: boolean;
  has_gas?: boolean;
  has_generator?: boolean;
  has_water_supply?: boolean;
  is_pet_friendly?: boolean;
  available_from?: Date;
}

export interface UpdateUnitInput {
  unit_number?: string;
  floor?: number;
  type?: UnitType;
  furnishing_status?: FurnishingStatus;
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  monthly_rent?: number;
  security_deposit_months?: number; // default 2
  has_parking?: boolean;
  has_ac?: boolean;
  has_lift?: boolean;
  has_gas?: boolean;
  has_generator?: boolean;
  has_water_supply?: boolean;
  is_pet_friendly?: boolean;
  available_from?: Date;
}
