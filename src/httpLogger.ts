import pinoHttp from "pino-http";
import { logger } from "./lib/logger";

export const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: req.headers["x-request-id"] ?? null,
  }),
});
