import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/auth.types";
import { saveProductImage } from "../services/product-images.service";

export async function uploadProductImageHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    //const productId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ ok: false, error: "IMAGE_REQUIRED" });
    }

    const image = await saveProductImage({
      actorUserId: req.user?.id ?? null,
      productId: req.params.productId as string,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    return res.status(201).json({
      ok: true,
      image,
      url: `/uploads/products/${req.file.filename}`,
      thumbUrl: `/uploads/products/thumb/${req.file.filename}`,
      smallUrl: `/uploads/products/small/${req.file.filename}`,
    });
  } catch (err) {
    next(err);
  }
}
