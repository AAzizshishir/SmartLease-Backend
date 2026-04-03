import { Request, Response, NextFunction } from "express";
import { propertyService } from "./property.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

// Create Property
const createProperty = catchAsync(async (req: Request, res: Response) => {
  const landlord_id = req?.user?.id;
  const payload = {
    ...req.body,
    image: req.file?.path,
  };

  const property = await propertyService.createProperty(
    landlord_id as string,
    payload,
  );

  sendResponse(res, {
    httpStatusCode: StatusCodes.CREATED,
    success: true,
    message: "Property created successfully",
    data: property,
  });
});

// get all properties
const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const properties = await propertyService.getAllProperties();

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Properties fetched successfully",
    data: properties,
  });
});

// get my properties (landlord properties)
const getMyProperties = catchAsync(async (req: Request, res: Response) => {
  const landlord_id = req?.user?.id;
  const properties = await propertyService.getMyProperties(
    landlord_id as string,
  );

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Properties fetched successfully",
    data: properties,
  });
});

// get property by id
const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const landlord_id = req?.user?.id;
  console.log("from controller landlord id", landlord_id);
  const { id } = req.params;
  const property = await propertyService.getPropertyById(
    id as string,
    landlord_id as string,
  );

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Property fetched successfully",
    data: property,
  });
});

// update property
const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const landlord_id = req?.user?.id;
  const { id } = req.params;
  const payload = {
    ...req.body,
  };
  console.log(payload);
  const property = await propertyService.updateProperty(
    id as string,
    landlord_id as string,
    payload,
  );

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Property updated successfully",
    data: property,
  });
});

// delete property
const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const landlord_id = req?.user?.id;
  const { id } = req.params;
  const result = await propertyService.deleteProperty(
    id as string,
    landlord_id as string,
  );

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const restoreProperty = catchAsync(async (req: Request, res: Response) => {
  const landlord_id = req?.user?.id;
  const { id } = req.params;

  const property = await propertyService.restoreProperty(
    id as string,
    landlord_id as string,
  );

  sendResponse(res, {
    httpStatusCode: StatusCodes.OK,
    success: true,
    message: "Property restored successfully",
    data: property,
  });
});

export const propertyController = {
  createProperty,
  getAllProperties,
  getMyProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  restoreProperty,
};
