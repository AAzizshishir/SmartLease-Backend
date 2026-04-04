import { Response } from "express";

interface IresponseData<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  responseData: IresponseData<T>,
) => {
  const { statusCode, success, message, data, meta } = responseData;
  res.status(statusCode).json({
    success,
    message,
    data,
    meta,
  });
};
