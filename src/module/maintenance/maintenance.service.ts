import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import {
  AssignTicketInput,
  CreateTicketInput,
  ResolveTicketInput,
  UpdateTicketInput,
} from "./maintenance.validation";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { MaintenanceTicket, Prisma } from "../../generated/prisma/client";
import {
  deleteFromCloudinary,
  uploadManyToCloudinary,
} from "../../utils/cloudinary.utils";

// Tenant — ticket submit
const createTicket = async (tenant_id: string, payload: CreateTicketInput) => {
  const lease = await prisma.lease.findFirst({
    where: {
      tenant_id,
      unit_id: payload.unit_id,
      status: "active",
    },
    select: { id: true },
  });

  if (!lease) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You do not have an active lease for this unit",
    );
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      ...payload,
      tenant_id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      preferred_date: true,
      created_at: true,
      unit: {
        select: {
          unit_number: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  return ticket;
};

// Tenant — see tickets
const getMyTickets = async (tenant_id: string, query: IQueryParams) => {
  const result = await new QueryBuilder<
    MaintenanceTicket,
    Prisma.MaintenanceTicketWhereInput,
    Prisma.MaintenanceTicketInclude
  >(prisma.maintenanceTicket, query, {
    searchableFields: ["title", "description"],
    filterableFields: ["status", "category", "priority"],
    defaultSortBy: "created_at",
  } as any)
    .search()
    .filter()
    .where({ tenant_id } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Tenant — single ticket
const getTicketById = async (id: string, tenant_id: string) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, tenant_id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      preferred_date: true,
      is_assigned: true,
      assigned_to_name: true,
      assigned_to_phone: true,
      assigned_at: true,
      resolution_note: true,
      resolved_at: true,
      created_at: true,
      images: {
        select: { id: true, url: true, created_at: true },
      },
      unit: {
        select: {
          unit_number: true,
          property: {
            select: {
              name: true,
              landlord: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  return ticket;
};

// Tenant — ticket update
const updateTicket = async (
  id: string,
  tenant_id: string,
  payload: UpdateTicketInput,
) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, tenant_id },
    select: { id: true, status: true },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  if (ticket.status !== "open") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only open tickets can be updated",
    );
  }

  return prisma.maintenanceTicket.update({
    where: { id },
    data: { ...payload },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      updated_at: true,
    },
  });
};

// Tenant — ticket cancel
const cancelTicket = async (id: string, tenant_id: string) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, tenant_id },
    select: { id: true, status: true },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  if (!["open", "assigned"].includes(ticket.status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This ticket cannot be cancelled",
    );
  }

  return prisma.maintenanceTicket.update({
    where: { id },
    data: { status: "cancelled" },
    select: { id: true, status: true },
  });
};

// Landlord — all property ticket
const getPropertyTickets = async (landlord_id: string, query: IQueryParams) => {
  const result = await new QueryBuilder<
    MaintenanceTicket,
    Prisma.MaintenanceTicketWhereInput,
    Prisma.MaintenanceTicketInclude
  >(prisma.maintenanceTicket, query, {
    searchableFields: ["title"],
    filterableFields: ["status", "category", "priority"],
    defaultSortBy: "created_at",
  } as any)
    .search()
    .filter()
    .where({
      unit: {
        property: { landlord_id },
      },
    } as any)
    .sort()
    .paginate()
    .execute();

  return result;
};

// Landlord — single ticket
const getLandlordTicketById = async (id: string, landlord_id: string) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: {
      id,
      unit: {
        property: { landlord_id },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      preferred_date: true,
      is_assigned: true,
      assigned_to_name: true,
      assigned_to_phone: true,
      assigned_at: true,
      resolution_note: true,
      resolved_at: true,
      created_at: true,
      images: {
        select: { id: true, url: true },
      },
      tenant: {
        select: { name: true, email: true },
      },
      unit: {
        select: {
          unit_number: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  return ticket;
};

// Landlord — worker assign
const assignTicket = async (
  id: string,
  landlord_id: string,
  payload: AssignTicketInput,
) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: {
      id,
      unit: { property: { landlord_id } },
    },
    select: { id: true, status: true },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  if (!["open", "assigned"].includes(ticket.status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This ticket cannot be assigned",
    );
  }

  return prisma.maintenanceTicket.update({
    where: { id },
    data: {
      is_assigned: true,
      assigned_to_name: payload.assigned_to_name,
      assigned_to_phone: payload.assigned_to_phone,
      assigned_at: new Date(),
      status: "assigned",
    },
    select: {
      id: true,
      status: true,
      is_assigned: true,
      assigned_to_name: true,
      assigned_to_phone: true,
      assigned_at: true,
    },
  });
};

// Landlord — in progress
const startTicket = async (id: string, landlord_id: string) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: {
      id,
      unit: { property: { landlord_id } },
      status: "assigned",
    },
    select: { id: true },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Assigned ticket not found");
  }

  return prisma.maintenanceTicket.update({
    where: { id },
    data: {
      status: "in_progress",
      started_at: new Date(),
    },
    select: { id: true, status: true, started_at: true },
  });
};

// Landlord — resolve
const resolveTicket = async (
  id: string,
  landlord_id: string,
  payload: ResolveTicketInput,
) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: {
      id,
      unit: { property: { landlord_id } },
      status: "in_progress",
    },
    select: { id: true },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "In-progress ticket not found");
  }

  return prisma.maintenanceTicket.update({
    where: { id },
    data: {
      status: "resolved",
      resolution_note: payload.resolution_note,
      resolved_at: new Date(),
    },
    select: {
      id: true,
      status: true,
      resolution_note: true,
      resolved_at: true,
    },
  });
};

// Tenant — close ticket after satisfied
const closeTicket = async (id: string, tenant_id: string) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, tenant_id, status: "resolved" },
    select: { id: true },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "Resolved ticket not found");
  }

  return prisma.maintenanceTicket.update({
    where: { id },
    data: { status: "closed" },
    select: { id: true, status: true },
  });
};

// ---- Images ---- //

const uploadTicketImages = async (
  ticket_id: string,
  tenant_id: string,
  files: Express.Multer.File[],
) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticket_id },
    select: {
      id: true,
      tenant_id: true,
      _count: { select: { images: true } },
    },
  });

  if (!ticket) {
    throw new AppError(StatusCodes.NOT_FOUND, "maintenance ticket not found");
  }

  if (ticket.tenant_id !== tenant_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  if (ticket._count.images + files.length > 10) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot upload more than 10 images. Current: ${ticket._count.images}`,
    );
  }

  // upload to Cloudinary
  const uploaded = await uploadManyToCloudinary(files, "tickets");

  try {
    // Save in DB
    const images = await prisma.$transaction(
      uploaded.map((result, index) =>
        prisma.ticketImage.create({
          data: {
            ticket_id,
            url: result.url,
            public_id: result.public_id,
          },
          select: {
            id: true,
            url: true,
            public_id: true,
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

const deleteTicketImage = async (image_id: string, tenant_id: string) => {
  const image = await prisma.ticketImage.findFirst({
    where: { id: image_id },
    select: {
      id: true,
      public_id: true,
      ticket_id: true,
      ticket: { select: { tenant_id: true } },
    },
  });

  if (!image) {
    throw new AppError(StatusCodes.NOT_FOUND, "Image not found");
  }

  if (image.ticket.tenant_id !== tenant_id) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not authorized");
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(image.public_id);

  //  Delete from DB
  await prisma.ticketImage.delete({ where: { id: image_id } });

  return { message: "Image deleted successfully" };
};

const getTicketImages = async (ticket_id: string) => {
  return prisma.ticketImage.findMany({
    where: { ticket_id },
    select: {
      id: true,
      url: true,
    },
  });
};

export const maintenanceService = {
  createTicket,
  getMyTickets,
  getTicketById,
  updateTicket,
  cancelTicket,
  getPropertyTickets,
  getLandlordTicketById,
  assignTicket,
  startTicket,
  resolveTicket,
  closeTicket,
  uploadTicketImages,
  getTicketImages,
  deleteTicketImage,
};
