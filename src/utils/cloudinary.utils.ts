import { randomUUID } from "crypto";
import cloudinary from "../config/cloudinary.config";
import AppError from "./AppError";
import { StatusCodes } from "http-status-codes";

type UploadFolder =
  | "properties"
  | "units"
  | "tickets"
  | "avatars"
  | "documents";

export interface UploadResult {
  url: string;
  public_id: string;
}

// single file upload

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: UploadFolder,
): Promise<UploadResult> => {
  const cleanName = file.originalname
    .split(".")[0]
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const public_id = `smart-lease/${folder}/${randomUUID()}-${cleanName}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id,
          resource_type: "image",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new AppError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to upload image",
              ),
            );
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        },
      )
      .end(file.buffer);
  });
};

// multiple files upload
export const uploadManyToCloudinary = async (
  files: Express.Multer.File[],
  folder: UploadFolder,
): Promise<UploadResult[]> => {
  return Promise.all(files.map((file) => uploadToCloudinary(file, folder)));
};

// delete from cloudinary with public id
export const deleteFromCloudinary = async (
  public_id: string,
): Promise<void> => {
  await cloudinary.uploader.destroy(public_id, {
    resource_type: "image",
  });
};
