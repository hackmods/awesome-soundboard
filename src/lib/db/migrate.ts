import { getDb } from "./index";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export async function migrate() {
  const db = getDb();
  const existing = await db.$client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
  );
  if (existing.rows.length > 0) return;

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
      await db.$client.execute(statement);
    }
  }

  console.log(`Applied ${files.length} migration(s).`);
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
