import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interface/query.interface";
import { Prisma, Property } from "../../generated/prisma/client";
import { filterableFields, searcableFields } from "./property.constant";
import { CreatePropertyInput, UpdatePropertyInput } from "./property.validate";
import {
  deleteFromCloudinary,
  uploadManyToCloudinary,
} from "../../utils/cloudinary.utils";

// Create Property
const createProperty = async (
  landlord_id: string,
  payload: CreatePropertyInput,
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
const getAllProperties = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Property,
    Prisma.PropertyWhereInput,
    Prisma.PropertyInclude
  >(prisma.property, query, {
    searchableFields: searcableFields,
    filterableFields: filterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({ is_deleted: false })
    .paginate()
    .sort()
    .fields()
    .include({
      units: {
        where: { is_deleted: false },
      },
    })
    .execute();

  return result;
};

// get my properties (landlord properties)
const getMyProperties = async (landlord_id: string, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Property,
    Prisma.PropertyWhereInput,
    Prisma.PropertyInclude
  >(prisma.property, query, {
    searchableFields: searcableFields,
    filterableFields: filterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({ landlord_id, is_deleted: false })
    .paginate()
    .sort()
    .fields()
    .include({
      units: true,
      images: true,
    })
    .execute();

  return result;
};

// get property by id
const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id, is_deleted: false },
    include: { units: { where: { is_deleted: false } } },
  });
  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  return property;
};

// update property
const updateProperty = async (
  id: string,
  landlord_id: string,
  payload: UpdatePropertyInput,
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

// restore property
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

// ---- Images ---- //

const uploadPropertyImages = async (
  property_id: string,
  landlord_id: string,
  files: Express.Multer.File[],
) => {
  const property = await prisma.property.findFirst({
    where: { id: property_id, is_deleted: false },
    select: {
      id: true,
      landlord_id: true,
      _count: { select: { images: true } },
    },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.landlord_id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  if (property._count.images + files.length > 10) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot upload more than 10 images. Current: ${property._count.images}`,
    );
  }

  // upload to Cloudinary
  const uploaded = await uploadManyToCloudinary(files, "properties");

  const isFirstUpload = property._count.images === 0;

  try {
    // Save in DB
    const images = await prisma.$transaction(
      uploaded.map((result, index) =>
        prisma.propertyImage.create({
          data: {
            property_id,
            url: result.url,
            public_id: result.public_id,
            is_primary: isFirstUpload && index === 0,
            order: property._count.images + index,
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

// Delete property image
const deletePropertyImage = async (image_id: string, landlord_id: string) => {
  const image = await prisma.propertyImage.findFirst({
    where: { id: image_id },
    select: {
      id: true,
      public_id: true,
      is_primary: true,
      property_id: true,
      property: { select: { id: true } },
    },
  });

  if (!image) {
    throw new AppError(StatusCodes.NOT_FOUND, "Image not found");
  }

  if (image.property.id !== landlord_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(image.public_id);

  //  Delete from DB
  await prisma.unitImage.delete({ where: { id: image_id } });

  if (image.is_primary) {
    const nextImage = await prisma.propertyImage.findFirst({
      where: { property_id: image.property_id },
      orderBy: { order: "asc" },
    });

    if (nextImage) {
      await prisma.propertyImage.update({
        where: { id: nextImage.id },
        data: { is_primary: true },
      });
    }
  }

  return { message: "Image deleted successfully" };
};

const getPropertyImages = async (property_id: string) => {
  return prisma.propertyImage.findMany({
    where: { property_id },
    select: {
      id: true,
      url: true,
      is_primary: true,
      order: true,
    },
    orderBy: { order: "asc" },
  });
};

export const propertyService = {
  createProperty,
  getAllProperties,
  getMyProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  restoreProperty,
  uploadPropertyImages,
  getPropertyImages,
  deletePropertyImage,
};
