import { Worker } from "bullmq";
import sharp from "sharp";
import path from "path";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

const worker = new Worker(
  "orders",
  async (job) => {
    console.log("Processing job:", job.name, job.data);

    if (job.name === "order-confirmation") {
      const { orderId, userId, totalCents } = job.data;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Order confirmation processed", {
        orderId,
        userId,
        totalCents,
      });
      return;
    }

    if (job.name === "low-stock-alert") {
      const { productId, productName, remainingStock } = job.data;

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Low stock alert", {
        productId,
        productName,
        remainingStock,
      });
      return;
    }

    if (job.name === "payment-received") {
      const { orderId, userId, totalCents, currency } = job.data;

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Payment received", {
        orderId,
        userId,
        totalCents,
        currency,
      });
      return;
    }

    if (job.name === "image-process") {
      const { filename, originalPath } = job.data;

      const thumbPath = path.join("uploads", "products", "thumb", filename);
      const smallPath = path.join("uploads", "products", "small", filename);

      await sharp(originalPath)
        .resize(150, 150, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);

      await sharp(originalPath)
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(smallPath);

      console.log("Image processed", {
        filename,
        thumbPath,
        smallPath,
      });

      return;
    }
    throw new Error(`Unknown job type: ${job.name}`);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job failed: ${job?.id}`, err);
});
