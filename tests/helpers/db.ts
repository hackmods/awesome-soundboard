import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resetDbForTests } from "@/lib/db/index";
import { migrate } from "@/lib/db/migrate";
import { getDb } from "@/lib/db/index";

export type TestEnv = {
  dbPath: string;
  uploadDir: string;
  cleanup: () => void;
};

export function setupTestEnv(prefix = "asb-test-"): TestEnv {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const dbPath = join(dir, "test.db");
  const uploadDir = join(dir, "uploads");

  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.UPLOAD_DIR = uploadDir;
  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-auth-secret";
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  resetDbForTests();

  return {
    dbPath,
    uploadDir,
    cleanup: () => {
      resetDbForTests();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export async function initTestDb() {
  await migrate();
}

export async function clearTestData() {
  const db = getDb();
  await db.$client.execute("DELETE FROM clips");
  await db.$client.execute("DELETE FROM categories");
  await db.$client.execute("DELETE FROM soundboards");
  await db.$client.execute("DELETE FROM users");
}
