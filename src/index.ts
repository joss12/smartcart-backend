import { logger } from "./logger";
import { app } from "./server";
import "dotenv/config";

const PORT = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, ">Server is running");
  });
}
