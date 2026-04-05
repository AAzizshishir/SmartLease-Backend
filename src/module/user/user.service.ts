import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { UpdateUserInput } from "./user.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interface/query.interface";
import { Prisma, User } from "../../generated/prisma/client";

// profile
const getMe = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, is_deleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

// profile update
const updateMe = async (id: string, payload: UpdateUserInput) => {
  const user = await prisma.user.findFirst({
    where: { id, is_deleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { ...payload },
  });

  return updated;
};

// avatar update
// const updateAvatar = async (id: string, imageUrl: string) => {
//   const updated = await prisma.user.update({
//     where: { id },
//     data: { image: imageUrl },
//   });

//   return updated;
// };

// account delete — soft delete

const deleteMe = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      role: true,
      tenant_leases: {
        where: {
          status: { in: ["active", "pending_tenant"] },
        },
        select: { id: true },
      },
      properties: {
        where: { is_deleted: false },
        select: {
          id: true,
          units: {
            where: { is_deleted: false },
            select: {
              id: true,
              leases: {
                where: {
                  status: { in: ["active", "pending_tenant"] },
                },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // tenant active lease check
  if (user.tenant_leases.length > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete account with active lease. Please terminate your lease first",
    );
  }

  // landlord active lease check
  const hasActiveLease = user.properties.some((property) =>
    property.units.some((unit) => unit.leases.length > 0),
  );

  if (hasActiveLease) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete account with active tenants. Please terminate all leases first",
    );
  }

  const propertyIds = user.properties.map((p) => p.id);
  const unitIds = user.properties.flatMap((p) => p.units.map((u) => u.id));

  await prisma.$transaction(async (tx) => {
    if (unitIds.length > 0) {
      await tx.unit.updateMany({
        where: { id: { in: unitIds } },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
        },
      });
    }

    if (propertyIds.length > 0) {
      await tx.property.updateMany({
        where: { id: { in: propertyIds } },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
        },
      });
    }

    await tx.user.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        email: `deleted_${id}@deleted.com`,
      },
    });
  });

  return { message: "Account and all properties deleted successfully" };
};

// ---- Admin only ---- //

const getAllUsers = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    User,
    Prisma.UserWhereInput,
    Prisma.UserInclude
  >(prisma.user, query, {
    searchableFields: ["name", "email"],
    filterableFields: ["role", "status"],
    defaultSortBy: "createdAt",
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({ is_deleted: false })
    .sort()
    .paginate()
    .execute();

  return result;
};

// single user
const getUserById = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, is_deleted: false },
    select: {
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          properties: true,
          tenant_leases: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

// block user
const blockUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, is_deleted: false },
    select: { id: true, status: true, role: true },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.role === "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Cannot block an admin");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is already blocked");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "BLOCKED" },
  });

  return updated;
};

// unblock user
const unblockUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, is_deleted: false },
    select: { id: true, status: true },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.status === "ACTIVE") {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is already active");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  return updated;
};

// admin delete user
const adminDeleteUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.role === "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Cannot delete an admin");
  }

  await prisma.user.update({
    where: { id },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      email: `deleted_${id}@deleted.com`,
    },
  });

  return { message: "User deleted successfully" };
};

export const userService = {
  getMe,
  updateMe,
  //   updateAvatar,
  deleteMe,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  adminDeleteUser,
};
