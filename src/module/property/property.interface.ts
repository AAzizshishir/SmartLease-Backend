import { PropertyType } from "../../generated/prisma/enums";

export interface CreatePropertyPayload {
  name: string;
  address: string;
  city: string;
  type: PropertyType;
  total_units: number;
  description?: string;
  images?: string;
}

export interface UpdatePropertyPayload {
  name?: string;
  address?: string;
  city?: string;
  type?: PropertyType;
  total_units?: number;
  description?: string;
  images?: string;
}
