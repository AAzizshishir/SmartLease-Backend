import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { CreateUnitPayload, UpdateUnitInput } from "./unit.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { filterableFields, searcableFields } from "./unit.constant";
import { Prisma, Unit } from "../../generated/prisma/client";
import {
  deleteFromCloudinary,
  uploadManyToCloudinary,
} from "../../utils/cloudinary.utils";

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
    .include({
      images: true,
    })
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
    include: { images: true },
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

// upload image to cloudinary
const uploadUnitImages = async (
  unit_id: string,
  landlord_id: string,
  files: Express.Multer.File[],
) => {
  const unit = await prisma.unit.findFirst({
    where: { id: unit_id, is_deleted: false },
    select: {
      id: true,
      property: { select: { landlord_id: true } },
      _count: { select: { images: true } },
    },
  });

  if (!unit) {
    throw new AppError(StatusCodes.NOT_FOUND, "Unit not found");
  }

  if (unit.property.landlord_id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  if (unit._count.images + files.length > 10) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot upload more than 10 images. Current: ${unit._count.images}`,
    );
  }

  // upload to Cloudinary
  const uploaded = await uploadManyToCloudinary(files, "units");

  const isFirstUpload = unit._count.images === 0;

  try {
    // Save in DB
    const images = await prisma.$transaction(
      uploaded.map((result, index) =>
        prisma.unitImage.create({
          data: {
            unit_id,
            url: result.url,
            public_id: result.public_id,
            is_primary: isFirstUpload && index === 0,
            order: unit._count.images + index,
          },
          select: {
            id: true,
            url: true,
            public_id: true,
            is_primary: true,
            order: true,
          },
        }),
      ),
    );

    return images;
  } catch (error) {
    // delete from cloudinary if DB fails
    await Promise.all(
      uploaded.map((result) => deleteFromCloudinary(result.public_id)),
    );
    throw error;
  }
};

// Delete unit image
const deleteUnitImage = async (image_id: string, landlord_id: string) => {
  const image = await prisma.unitImage.findFirst({
    where: { id: image_id },
    select: {
      id: true,
      public_id: true,
      is_primary: true,
      unit_id: true,
      unit: {
        select: {
          property: { select: { landlord_id: true } },
        },
      },
    },
  });

  if (!image) {
    throw new AppError(StatusCodes.NOT_FOUND, "Image not found");
  }

  if (image.unit.property.landlord_id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(image.public_id);

  //  Delete from DB
  await prisma.unitImage.delete({ where: { id: image_id } });

  if (image.is_primary) {
    const nextImage = await prisma.unitImage.findFirst({
      where: { unit_id: image.unit_id },
      orderBy: { order: "asc" },
    });

    if (nextImage) {
      await prisma.unitImage.update({
        where: { id: nextImage.id },
        data: { is_primary: true },
      });
    }
  }

  return { message: "Image deleted successfully" };
};

const setPrimaryImage = async (image_id: string, landlord_id: string) => {
  const image = await prisma.unitImage.findFirst({
    where: { id: image_id },
    select: {
      id: true,
      unit_id: true,
      unit: {
        select: {
          property: { select: { landlord_id: true } },
        },
      },
    },
  });

  if (!image) {
    throw new AppError(StatusCodes.NOT_FOUND, "Image not found");
  }

  if (image.unit.property.landlord_id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  await prisma.$transaction(async (tx) => {
    await tx.unitImage.updateMany({
      where: { unit_id: image.unit_id, is_primary: true },
      data: { is_primary: false },
    });

    await tx.unitImage.update({
      where: { id: image_id },
      data: { is_primary: true },
    });
  });

  return { message: "Primary image updated" };
};

const getUnitImages = async (unit_id: string) => {
  return prisma.unitImage.findMany({
    where: { unit_id },
    select: {
      id: true,
      url: true,
      is_primary: true,
      order: true,
    },
    orderBy: { order: "asc" },
  });
};

export const unitService = {
  addUnitInProperty,
  getAllVacantUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  restoreUnit,
  uploadUnitImages,
  setPrimaryImage,
  getUnitImages,
  deleteUnitImage,
};
