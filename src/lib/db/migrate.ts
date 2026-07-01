import { getDb } from "./index";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export function migrate() {
  const db = getDb();
  const exists = db.$client
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();
  if (exists) return;

  const migrationsDir = join(process.cwd(), "drizzle");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      db.$client.exec(statement);
    }
  }

  console.log(`Applied ${files.length} migration(s).`);
}

if (require.main === module) {
  migrate();
}
