import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/app.db";
  return url.startsWith("file:") ? url : `file:${url}`;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function resetDbForTests() {
  _db = null;
}

export function getDb() {
  if (!_db) {
    const url = resolveDatabaseUrl();
    const filePath = url.replace(/^file:/, "");
    mkdirSync(dirname(filePath), { recursive: true });
    const client = createClient({ url });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export { schema };
