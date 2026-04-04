import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { CreateUnitPayload, UpdateUnitInput } from "./unit.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { filterableFields, searcableFields } from "./unit.constant";
import { Prisma, Unit } from "../../generated/prisma/client";

// Add Unit
const addUnitInProperty = async (
  property_id: string,
  landlord_id: string,
  payload: CreateUnitPayload,
) => {
  const property = await prisma.property.findUnique({
    where: { id: property_id },
    // select: { id: true, landlord_id: true, total_units: true },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to add unit in this property",
    );
  }

  // 2. Has same unit_number in the same property ?
  const existingUnit = await prisma.unit.findUnique({
    where: {
      property_id_unit_number: {
        property_id,
        unit_number: payload.unit_number,
      },
    },
  });

  if (existingUnit) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `Unit ${payload.unit_number} already exists in this property`,
    );
  }

  // 3. create unit
  const unit = await prisma.unit.create({
    data: {
      property_id,
      ...payload,
    },
  });

  return unit;
};

const getAllVacantUnits = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder<
    Unit,
    Prisma.UnitWhereInput,
    Prisma.UnitInclude
  >(prisma.unit, query, {
    searchableFields: searcableFields,
    filterableFields: filterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({ status: "vacant", is_deleted: false })
    .paginate()
    .sort()
    .fields()
    .execute();

  return result;
};

// get unit by id
const getUnitById = async (id: string, property_id: string) => {
  const unit = await prisma.unit.findFirst({
    where: {
      id,
      property_id,
      is_deleted: false,
    },
  });

  if (!unit) {
    throw new AppError(StatusCodes.NOT_FOUND, "Unit not found");
  }

  return unit;
};

// update unit
const updateUnit = async (
  id: string,
  property_id: string,
  landlord_id: string,
  payload: UpdateUnitInput,
) => {
  // is unit exist and landlord owns the property of this unit
  const unit = await prisma.unit.findFirst({
    where: { id, property_id },
    select: {
      id: true,
      status: true,
      property: {
        select: { landlord_id: true },
      },
    },
  });

  if (!unit) {
    throw new AppError(StatusCodes.NOT_FOUND, "Unit not found");
  }

  if (unit.property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this unit",
    );
  }

  // occupied unit-এর rent বা type change করা যাবে না
  if (unit.status === "occupied") {
    const restrictedFields = ["monthly_rent", "type", "bedrooms", "bathrooms"];
    const hasRestricted = restrictedFields.some(
      (field) => payload[field as keyof UpdateUnitInput] !== undefined,
    );

    if (hasRestricted) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Cannot update rent or room details while unit is occupied",
      );
    }
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: { ...payload },
  });

  return updated;
};

// delete unit (soft delete)
const deleteUnit = async (
  id: string,
  property_id: string,
  landlord_id: string,
) => {
  const unit = await prisma.unit.findFirst({
    where: { id, property_id },
    select: {
      id: true,
      status: true,
      property: {
        select: { landlord_id: true },
      },
    },
  });

  if (!unit) {
    throw new AppError(StatusCodes.NOT_FOUND, "Unit not found");
  }

  if (unit.property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this unit",
    );
  }

  // occupied unit delete করা যাবে না
  if (unit.status === "occupied") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete an occupied unit. Please terminate the lease first",
    );
  }

  // soft delete
  await prisma.unit.update({
    where: { id },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
    },
  });

  return { message: "Unit deleted successfully" };
};

// restore unit
const restoreUnit = async (
  id: string,
  property_id: string,
  landlord_id: string,
) => {
  const unit = await prisma.unit.findFirst({
    where: {
      id,
      property_id,
      is_deleted: true,
      __includeDeleted: true,
    } as any,
    select: {
      id: true,
      property: {
        select: { landlord_id: true },
      },
    },
  });

  if (!unit) {
    throw new AppError(StatusCodes.NOT_FOUND, "Deleted unit not found");
  }

  if (unit.property.landlord_id !== landlord_id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to restore this unit",
    );
  }

  const restored = await prisma.unit.update({
    where: { id },
    data: {
      is_deleted: false,
      deleted_at: null,
    },
  });

  return restored;
};

export const unitService = {
  addUnitInProperty,
  getAllVacantUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  restoreUnit,
};
