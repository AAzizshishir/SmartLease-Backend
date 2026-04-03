import { v2 as cloudinary } from "cloudinary";
import { envVariables } from "./env";
import AppError from "../utils/AppError";
import { StatusCodes } from "http-status-codes";

cloudinary.config({
  cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUDE_NAME,
  api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
});

export const deleteFileFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;

    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];

      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      console.log(`File ${publicId} deleted from cloudinary`);
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete file from Cloudinary",
    );
  }
};

export const cloudinaryUpload = cloudinary;
