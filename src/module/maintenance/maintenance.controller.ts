import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { maintenanceService } from "./maintenance.service";
import { StatusCodes } from "http-status-codes";

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.createTicket(req.user!.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Ticket submitted successfully",
    data: ticket,
  });
});

const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await maintenanceService.getMyTickets(
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tickets fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getTicketById = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.getTicketById(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket fetched successfully",
    data: ticket,
  });
});

const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.updateTicket(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket updated successfully",
    data: ticket,
  });
});

const cancelTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await maintenanceService.cancelTicket(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket cancelled successfully",
    data: result,
  });
});

// const uploadTicketImages = catchAsync(async (req: Request, res: Response) => {
//   const files = req.files as Express.Multer.File[];

//   if (!files || files.length === 0) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.BAD_REQUEST,
//       success: false,
//       message: "No images provided",
//       data: null,
//     });
//   }

//   // images upload করো
//   const imageUrls = await Promise.all(
//     files.map((file) => uploadToCloudinary(file, "tickets"))
//   );

//   // DB-তে save করো
//   const images = await Promise.all(
//     imageUrls.map((url) =>
//       prisma.ticketImage.create({
//         data: {
//           ticket_id: req.params.id,
//           url,
//         },
//         select: { id: true, url: true },
//       })
//     )
//   );

//   sendResponse(res, {
//     statusCode: StatusCodes.CREATED,
//     success: true,
//     message: "Images uploaded successfully",
//     data: images,
//   });
// });

const getPropertyTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await maintenanceService.getPropertyTickets(
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tickets fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getLandlordTicketById = catchAsync(
  async (req: Request, res: Response) => {
    const ticket = await maintenanceService.getLandlordTicketById(
      req.params.id as string,
      req.user!.id,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Ticket fetched successfully",
      data: ticket,
    });
  },
);

const assignTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.assignTicket(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket assigned successfully",
    data: ticket,
  });
});

const startTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.startTicket(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket marked as in progress",
    data: ticket,
  });
});

const resolveTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.resolveTicket(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket resolved successfully",
    data: ticket,
  });
});

const closeTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await maintenanceService.closeTicket(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket closed successfully",
    data: ticket,
  });
});

export const maintenanceController = {
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
};
