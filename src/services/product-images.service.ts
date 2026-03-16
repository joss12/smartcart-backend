import { orderQueue } from "../lib/queue";
import { insertProductImage } from "../repositories/product-images.repository";
import { logAuditEvent } from "./audit.service";

export async function saveProductImage(input: {
  actorUserId?: string | null;
  productId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const image = await insertProductImage({
    productId: input.productId,
    filename: input.filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });

  await orderQueue.add(
    "image-process",
    {
      imageId: image.id,
      productId: input.productId,
      filename: input.filename,
      originalPath: `uploads/products/${input.filename}`,
    },
    {
      attempts: 3,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  await logAuditEvent({
    eventType: "product.image_uploaded",
    actorUserId: input.actorUserId ?? null,
    entityType: "product",
    entityId: input.productId,
    metadata: {
      imageId: image.id,
      filename: input.filename,
    },
  });

  return image;
}
