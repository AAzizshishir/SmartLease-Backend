import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Request, Response } from "express";
import { unitService } from "./unit.service";
import { IQueryParams } from "../../interface/query.interface";

// add unit in property
const addUnitInProperty = catchAsync(async (req: Request, res: Response) => {
  const { property_id } = req.params;
  const { id } = req.user!;
  const payload = req.body;
  const unit = await unitService.addUnitInProperty(
    property_id as string,
    id,
    payload,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Unit added successfully",
    data: unit,
  });
});

const getAllVacantUnits = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const units = await unitService.getAllVacantUnits(query as IQueryParams);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Vacant units fetched successfully",
    data: units.data,
    meta: units.meta,
  });
});

// get unit by id
const getUnitById = catchAsync(async (req: Request, res: Response) => {
  const { unit_id, property_id } = req.params;
  const unit = await unitService.getUnitById(
    unit_id as string,
    property_id as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unit fetched successfully",
    data: unit,
  });
});

const updateUnit = catchAsync(async (req: Request, res: Response) => {
  const { unit_id, property_id } = req.params;
  const { id } = req.user!;
  const payload = req.body;
  const unit = await unitService.updateUnit(
    unit_id as string,
    property_id as string,
    id,
    payload,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unit updated successfully",
    data: unit,
  });
});

// delete unit
const deleteUnit = catchAsync(async (req: Request, res: Response) => {
  const { unit_id, property_id } = req.params;
  const { id } = req.user!;
  const result = await unitService.deleteUnit(
    unit_id as string,
    property_id as string,
    id,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
  });
});

const restoreUnit = catchAsync(async (req: Request, res: Response) => {
  const { unit_id, property_id } = req.params;
  const { id } = req.user!;
  const unit = await unitService.restoreUnit(
    unit_id as string,
    property_id as string,
    id,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unit restored successfully",
    data: unit,
  });
});

// ---- Images ---- //

const uploadUnitImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "No images provided",
      data: null,
    });
  }

  const images = await unitService.uploadUnitImages(
    req.params.unit_id as string,
    req.user!.id,
    files,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Images uploaded successfully",
    data: images,
  });
});

const deleteUnitImage = catchAsync(async (req: Request, res: Response) => {
  await unitService.deleteUnitImage(
    req.params.image_id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Image deleted successfully",
    data: null,
  });
});

const setPrimaryImage = catchAsync(async (req: Request, res: Response) => {
  const result = await unitService.setPrimaryImage(
    req.params.image_id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const getUnitImages = catchAsync(async (req: Request, res: Response) => {
  const images = await unitService.getUnitImages(req.params.unit_id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Images fetched successfully",
    data: images,
  });
});

export const unitController = {
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
