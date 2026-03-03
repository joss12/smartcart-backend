import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "./db";

async function main() {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log("migrations:", files);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`\nRunning ${file}...`);
    await pool.query(sql);
    console.log(`Done ${file}`);
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
