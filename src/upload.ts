import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/products");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, randomUUID() + ext);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("ONLY_IMAGES_ALLOWED"));
    }
    cb(null, true);
  },
});
