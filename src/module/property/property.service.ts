import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import {
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from "./property.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interface/query.interface";

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
      StatusCodes.CONFLICT,
      "You already have a property with this name in this city",
    );
  }

  // deleted property check
  const existingDeleted = await prisma.property.findFirst({
    where: {
      landlord_id,
      name: payload.name,
      city: payload.city,
      is_deleted: true,
      __includeDeleted: true,
    } as any,
  });

  if (existingDeleted) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A deleted property with this name exists. Please restore it instead",
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
const getAllProperties = async (query: Record<string, any>) => {
  const builder = new QueryBuilder(query)
    .search(["name", "address", "description", "city"])
    .filter()
    .rangeFilter("monthly_rent", "minRent", "maxRent")
    .softDelete()
    .sort()
    .paginate();

  const args = builder.build();

  const [properties, meta] = await Promise.all([
    prisma.property.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
    }),

    builder.getMeta(() => prisma.property.count({ where: args.where })),
  ]);

  return { properties, meta };
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
    include: {
      units: {
        where: { is_deleted: false },
      },
    },
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

// property.service.ts

const restoreProperty = async (id: string, landlord_id: string) => {
  const property = await prisma.property.findFirst({
    where: {
      id,
      landlord_id,
      is_deleted: true,
      __includeDeleted: true,
    } as any,
    select: {
      id: true,
      is_deleted: true,
      landlord_id: true,
    },
  });
  console.log(property);

  if (!property) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Property not found or already active",
    );
  }

  if (property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to restore this property",
    );
  }

  const restored = await prisma.property.update({
    where: { id },
    data: {
      is_deleted: false,
      deleted_at: null,
    },
  });

  return restored;
};

export const propertyService = {
  createProperty,
  getAllProperties,
  getMyProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  restoreProperty,
};
