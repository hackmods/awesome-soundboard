import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  getSoundboardById,
  getSoundboardWithClips,
  slugExists,
  updateSoundboard,
} from "@/lib/db/queries";
import { clearTestData, initTestDb, setupTestEnv } from "../helpers/db";
import { createTestClip, createTestBoard, createTestUser } from "../helpers/fixtures";

const env = setupTestEnv("asb-queries-");

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  await clearTestData();
});

afterAll(() => {
  env.cleanup();
});

describe("db queries", () => {
  it("creates and fetches a soundboard with clips", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    await createTestClip(user.id, board.id);

    const result = await getSoundboardWithClips(board.id);
    expect(result?.clips).toHaveLength(1);
    expect(result?.categories).toEqual([]);
  });

  it("updates board visibility", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id, { visibility: "private" });

    await updateSoundboard(board.id, { visibility: "public" });

    const updated = await getSoundboardById(board.id);
    expect(updated?.visibility).toBe("public");
  });

  it("enforces slug uniqueness", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);

    expect(await slugExists(board.slug)).toBe(true);
    expect(await slugExists(board.slug, "other-id")).toBe(true);
  });
});
