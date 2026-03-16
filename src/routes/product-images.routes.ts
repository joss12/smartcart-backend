import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { uploadProductImage } from "../upload";
import { uploadProductImageHandler } from "../controllers/product-images.controller";

export const productImagesRouter = Router();

productImagesRouter.post(
  "/:id/image",
  requireAuth,
  requireAdmin,
  uploadProductImage.single("image"),
  uploadProductImageHandler,
);
