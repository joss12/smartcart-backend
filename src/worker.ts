import { Worker } from "bullmq";
import { sendMail } from "./lib/mailer";
import sharp from "sharp";
import path from "path";

import { URL } from "url";

const rawUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const parsed = new URL(rawUrl);

const connection = {
  host: parsed.hostname,
  port: Number(parsed.port),
  password: parsed.password || undefined,
  tls: parsed.protocol === "rediss:" ? {} : undefined,
};

const worker = new Worker(
  "orders",
  async (job) => {
    console.log("Processing job:", job.name, job.data);

    if (job.name === "order-confirmation") {
      const { orderId, userEmail, totalCents, currency } = job.data;
      await sendMail({
        to: userEmail,
        subject: "Your SmartCart order is confirmed",
        html: `
      <h2>Order Confirmed!</h2>
      <p>Your order <strong>${orderId}</strong> has been placed successfully.</p>
      <p>Total: <strong>${currency} ${(totalCents / 100).toFixed(2)}</strong></p>
      <p>We'll notify you when payment is received.</p>
    `,
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
      const { orderId, userEmail, totalCents, currency } = job.data;
      await sendMail({
        to: userEmail,
        subject: "Payment received for your SmartCart order",
        html: `
      <h2>Payment Received!</h2>
      <p>We've received your payment for order <strong>${orderId}</strong>.</p>
      <p>Total paid: <strong>${currency} ${(totalCents / 100).toFixed(2)}</strong></p>
      <p>Thank you for shopping with SmartCart!</p>
    `,
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
