import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (null as unknown as pg.Pool);

export const db = pool
  ? drizzle(pool, { schema })
  : (new Proxy({}, {
      get(_target, prop) {
        throw new Error(
          `Cannot access database property '${String(prop)}': DATABASE_URL environment variable is not configured. Did you forget to set it in your .env file?`,
        );
      },
    }) as unknown as ReturnType<typeof drizzle<typeof schema>>);

export * from "./schema";
