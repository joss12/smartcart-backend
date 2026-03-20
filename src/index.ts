import "dotenv/config";
import { logger } from "./lib/logger";
import { redis } from "./lib/redis";
import { app } from "./server";
import { pool } from "./lib/db";

const PORT = Number(process.env.PORT ?? 3000);

let server: ReturnType<typeof app.listen>;

async function start() {
  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "server started");
  });

  try {
    if (!redis.isOpen) {
      await redis.connect();
      logger.info("Redis connected");
    }
  } catch (err) {
    logger.error({ err }, "Redis connection failed");
  }
}

if (process.env.NODE_ENV !== "test") {
  start();
}

async function shutdown(signal: string) {
  logger.info({ signal }, "shutdown signal received");

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      await redis.quit();
      logger.info("Redis disconnected");
    } catch (err) {
      logger.error({ err }, "Redis disconnect error");
    }

    try {
      await pool.end();
      logger.info("DB pool closed");
    } catch (err) {
      logger.error({ err }, "DB pool close error");
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 15000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { app };
