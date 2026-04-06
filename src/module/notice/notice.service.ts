import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { CreateNoticeInput, UpdateNoticeInput } from "./notice.validation";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Notice, Prisma } from "../../generated/prisma/client";

// Landlord create notice
const createNotice = async (
  landlord_id: string,
  payload: CreateNoticeInput,
) => {
  const property = await prisma.property.findFirst({
    where: { id: payload.property_id, landlord_id, is_deleted: false },
    select: { id: true },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (payload.target === "specific_unit" && !payload.unit_id) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Unit ID is required for specific unit notice",
    );
  }

  // unit এই property-র কিনা check
  if (payload.unit_id) {
    const unit = await prisma.unit.findFirst({
      where: {
        id: payload.unit_id,
        property_id: payload.property_id,
        is_deleted: false,
      },
      select: { id: true },
    });

    if (!unit) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Unit not found in this property",
      );
    }
  }

  const notice = await prisma.notice.create({
    data: {
      ...payload,
      landlord_id,
    },
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      target: true,
      effective_from: true,
      created_at: true,
      property: {
        select: { name: true, city: true },
      },
      unit: {
        select: { unit_number: true },
      },
    },
  });

  return notice;
};

// Landlord — all notice
const getLandlordNotices = async (landlord_id: string, query: IQueryParams) => {
  const result = await new QueryBuilder<
    Notice,
    Prisma.NoticeWhereInput,
    Prisma.NoticeInclude
  >(prisma.notice, query, {
    searchableFields: ["title", "body"],
    filterableFields: ["type", "target"],
    defaultSortBy: "created_at",
  } as any)
    .search()
    .filter()
    .where({ landlord_id } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Landlord — single notice
const getLandlordNoticeById = async (id: string, landlord_id: string) => {
  const notice = await prisma.notice.findFirst({
    where: { id, landlord_id },
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      target: true,
      effective_from: true,
      created_at: true,
      property: {
        select: { name: true, city: true },
      },
      unit: {
        select: { unit_number: true },
      },

      reads: {
        select: {
          tenant: { select: { name: true } },
          read_at: true,
        },
      },
    },
  });

  if (!notice) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  return {
    ...notice,
    read_count: notice.reads.length,
  };
};

// Landlord — notice update
const updateNotice = async (
  id: string,
  landlord_id: string,
  payload: UpdateNoticeInput,
) => {
  const notice = await prisma.notice.findFirst({
    where: { id, landlord_id },
    select: { id: true },
  });

  if (!notice) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  return prisma.notice.update({
    where: { id },
    data: { ...payload },
    select: {
      id: true,
      title: true,
      type: true,
      updated_at: true,
    },
  });
};

// Landlord — notice delete
const deleteNotice = async (id: string, landlord_id: string) => {
  const notice = await prisma.notice.findFirst({
    where: { id, landlord_id },
    select: { id: true },
  });

  if (!notice) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  await prisma.notice.delete({ where: { id } });

  return { message: "Notice deleted successfully" };
};

// Tenant - Notices
const getMyNotices = async (tenant_id: string, query: IQueryParams) => {
  // unit id and property id
  const lease = await prisma.lease.findFirst({
    where: {
      tenant_id,
      status: "active",
    },
    select: {
      unit_id: true,
      unit: {
        select: { property_id: true },
      },
    },
  });

  if (!lease) {
    throw new AppError(StatusCodes.NOT_FOUND, "No active lease found");
  }

  // tenant's notices — property all notices and own unit notice
  const result = await new QueryBuilder<
    Notice,
    Prisma.NoticeWhereInput,
    Prisma.NoticeInclude
  >(prisma.notice, query, {
    searchableFields: ["title", "body"],
    filterableFields: ["type"],
    defaultSortBy: "created_at",
  } as any)
    .search()
    .filter()
    .where({
      property_id: lease.unit.property_id,
      OR: [
        { target: "all_tenants" },
        { target: "specific_unit", unit_id: lease.unit_id },
      ],
    } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Tenant — single notice
const getNoticeById = async (id: string, tenant_id: string) => {
  const lease = await prisma.lease.findFirst({
    where: { tenant_id, status: "active" },
    select: {
      unit_id: true,
      unit: { select: { property_id: true } },
    },
  });

  if (!lease) {
    throw new AppError(StatusCodes.NOT_FOUND, "No active lease found");
  }

  const notice = await prisma.notice.findFirst({
    where: {
      id,
      property_id: lease.unit.property_id,
    },
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      target: true,
      effective_from: true,
      created_at: true,
    },
  });

  if (!notice) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  return notice;
};

// Tenant — notice read mark
const markAsRead = async (id: string, tenant_id: string) => {
  const existing = await prisma.noticeRead.findUnique({
    where: {
      notice_id_tenant_id: {
        notice_id: id,
        tenant_id,
      },
    },
  });

  if (existing) {
    return { message: "Already read" };
  }

  await prisma.noticeRead.create({
    data: {
      notice_id: id,
      tenant_id,
    },
  });

  return { message: "Marked as read" };
};

// Tenant — unread count
const getUnreadCount = async (tenant_id: string) => {
  const lease = await prisma.lease.findFirst({
    where: { tenant_id, status: "active" },
    select: {
      unit_id: true,
      unit: { select: { property_id: true } },
    },
  });

  if (!lease) return { unread_count: 0 };

  const totalNotices = await prisma.notice.count({
    where: {
      property_id: lease.unit.property_id,
      OR: [
        { target: "all_tenants" },
        { target: "specific_unit", unit_id: lease.unit_id },
      ],
    },
  });

  // read notices
  const readNotices = await prisma.noticeRead.count({
    where: { tenant_id },
  });

  return { unread_count: totalNotices - readNotices };
};

export const noticeService = {
  createNotice,
  getLandlordNotices,
  getLandlordNoticeById,
  updateNotice,
  deleteNotice,
  getMyNotices,
  getNoticeById,
  markAsRead,
  getUnreadCount,
};
