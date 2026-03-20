import "dotenv/config";
import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import YAML from "yaml";

import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { productsRouter } from "./routes/products.routes";
import { ordersRouter } from "./routes/orders.routes";
import { auditRouter } from "./routes/audit.routes";
import { webhooksRouter } from "./routes/webhooks.routes";
import { productImagesRouter } from "./routes/product-images.routes";

import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
//import { httpLogger } from "./httpLogger";
import { cartRouter } from "./routes/cart.routes";
import { adminRouter } from "./routes/admin.routes";

const openapiText = fs.readFileSync(
  path.resolve(__dirname, "../openapi.yaml"),
  "utf8",
);
const openapiDoc = YAML.parse(openapiText);

export const app = express();

app.use(requestIdMiddleware);
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(helmet());
//app.use(httpLogger);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/products", productImagesRouter);
app.use("/orders", ordersRouter);
app.use("/audit", auditRouter);
app.use("/webhooks", webhooksRouter);
app.use("/cart", cartRouter);
app.use("/admin", adminRouter);

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    name: "SmartCart API",
    endpoints: [
      "/health/live",
      "/health/ready",
      "/products",
      "/orders",
      "/docs",
    ],
  });
});

app.use(notFoundHandler);
app.use(errorHandler);
