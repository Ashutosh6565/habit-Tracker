import multer from "multer";
import path from "path";
import { AppError } from "../utils/AppError";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), "uploads", "avatars"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user?.id || "anonymous"}-${Date.now()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      return cb(new AppError("Only PNG, JPEG, and WebP images are allowed", 400, "INVALID_FILE"));
    }
    cb(null, true);
  },
});
