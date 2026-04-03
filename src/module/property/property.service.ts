import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import {
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from "./property.interface";

// Create Property
const createProperty = async (
  landlord_id: string,
  payload: CreatePropertyPayload,
) => {
  const existingProperty = await prisma.property.findFirst({
    where: {
      landlord_id,
      name: payload.name,
      city: payload.city,
    },
  });

  if (existingProperty) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You already have a property with this name in this city",
    );
  }

  const property = await prisma.property.create({
    data: {
      ...payload,
      landlord_id,
    },
  });

  return property;
};

// get all properties
const getAllProperties = async () => {
  const properties = await prisma.property.findMany({
    where: { is_deleted: false },
    orderBy: { created_at: "desc" },
  });

  if (properties.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "No properties found");
  }
  return properties;
};

// get my properties (landlord properties)
const getMyProperties = async (landlord_id: string) => {
  const properties = await prisma.property.findMany({
    where: { landlord_id, is_deleted: false },

    orderBy: { created_at: "desc" },
  });

  // response shape
  return properties;
};

// get property by id
const getPropertyById = async (id: string, landlord_id: string) => {
  const property = await prisma.property.findUnique({
    where: { id, is_deleted: false },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }
  console.log("property landlord_id", property.landlord_id);
  console.log("propertyid", landlord_id);

  // অন্য landlord-এর property access করতে পারবে না
  if (property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to view this property",
    );
  }

  return property;
};

// update property
const updateProperty = async (
  id: string,
  landlord_id: string,
  payload: UpdatePropertyPayload,
) => {
  const property = await prisma.property.findUnique({
    where: { id, is_deleted: false },
    select: { id: true, landlord_id: true },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this property",
    );
  }

  const updated = await prisma.property.update({
    where: { id },
    data: {
      ...payload,
    },
  });

  return updated;
};

// delete property
const deleteProperty = async (id: string, landlord_id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      landlord_id: true,
      units: {
        where: {
          leases: {
            some: {
              status: { in: ["active", "pending_tenant"] },
            },
          },
        },
        select: { id: true },
      },
    },
  });

  if (!property) {
    throw new AppError(404, "Property not found");
  }

  if (property.landlord_id !== landlord_id) {
    throw new AppError(403, "You are not authorized to delete this property");
  }

  if (property.units.length > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete property with active leases. Please terminate all leases first.",
    );
  }

  await prisma.property.update({
    where: { id },
    data: { is_deleted: true },
  });

  return { message: "Property deleted successfully" };
};

export const propertyService = {
  createProperty,
  getAllProperties,
  getMyProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};
