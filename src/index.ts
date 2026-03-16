import "dotenv/config";
import { logger } from "./lib/logger";
import { redis } from "./lib/redis";
import { app } from "./server";

const PORT = Number(process.env.PORT ?? 3000);

async function start() {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }

    app.listen(PORT, () => {
      logger.info({ port: PORT }, "server started");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  start();
}

export { app };

//export { app };
//app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
