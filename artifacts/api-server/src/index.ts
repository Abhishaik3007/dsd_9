import path from "node:path";
import fs from "node:fs";

// Load .env.local and .env from workspace root if present
if (typeof process.loadEnvFile === "function") {
  const rootDir = process.cwd();
  const envLocalPath = path.join(rootDir, ".env.local");
  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envLocalPath)) {
    try { process.loadEnvFile(envLocalPath); } catch {}
  }
  if (fs.existsSync(envPath)) {
    try { process.loadEnvFile(envPath); } catch {}
  }
}

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
