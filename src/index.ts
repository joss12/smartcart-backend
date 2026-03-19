import "dotenv/config";
import { logger } from "./lib/logger";
import { redis } from "./lib/redis";
import { app } from "./server";

const PORT = Number(process.env.PORT ?? 3000);

async function start() {
  app.listen(PORT, () => {
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

export { app };
