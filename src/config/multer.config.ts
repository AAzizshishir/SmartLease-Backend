import multer from "multer";
import AppError from "../utils/AppError";
import { StatusCodes } from "http-status-codes";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError(
          StatusCodes.BAD_REQUEST,
          "Only JPEG, PNG and WEBP images are allowed",
        ) as any,
      );
    }
    cb(null, true);
  },
});
