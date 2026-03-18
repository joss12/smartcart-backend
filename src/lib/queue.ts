import { Queue } from "bullmq";
import { URL } from "url";

const rawUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const parsed = new URL(rawUrl);

const connection = {
  host: parsed.hostname,
  port: Number(parsed.port),
  password: parsed.password || undefined,
  tls: parsed.protocol === "rediss:" ? {} : undefined,
};

export const orderQueue = new Queue("orders", { connection });
