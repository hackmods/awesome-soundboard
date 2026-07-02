import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  updateClipAction,
  deleteClipAction,
  reorderClipsAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from "@/app/(app)/actions";
import {
  createCategory,
  getClipById,
  getCategoryByIdAndBoardId,
} from "@/lib/db/queries";
import { newId } from "@/lib/id";
import { clearTestData, initTestDb, setupTestEnv } from "../helpers/db";
import { createTestBoard, createTestClip, createTestUser } from "../helpers/fixtures";

const { mockRequireAuth } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAuth: () => mockRequireAuth(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const env = setupTestEnv("asb-idor-");

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  mockRequireAuth.mockReset();
  await clearTestData();
});

afterAll(() => {
  env.cleanup();
});

describe("server actions IDOR protection", () => {
  it("blocks updating another board's clip via foreign clipId", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const boardA = await createTestBoard(userA.id);
    const boardB = await createTestBoard(userB.id);
    const { clipId } = await createTestClip(userB.id, boardB.id);

    mockRequireAuth.mockResolvedValue({ user: { id: userA.id } });

    await expect(updateClipAction(clipId, boardA.id, { name: "Hijacked" })).rejects.toThrow(
      "Unauthorized"
    );

    const clip = await getClipById(clipId);
    expect(clip?.name).toBe("Test Clip");
  });

  it("blocks deleting another board's clip", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const boardA = await createTestBoard(userA.id);
    const boardB = await createTestBoard(userB.id);
    const { clipId } = await createTestClip(userB.id, boardB.id);

    mockRequireAuth.mockResolvedValue({ user: { id: userA.id } });

    await expect(deleteClipAction(clipId, boardA.id)).rejects.toThrow("Unauthorized");

    expect(await getClipById(clipId)).not.toBeNull();
  });

  it("blocks reordering with foreign clip ids", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const boardA = await createTestBoard(userA.id);
    const boardB = await createTestBoard(userB.id);
    const { clipId: foreignClipId } = await createTestClip(userB.id, boardB.id);
    const { clipId: ownClipId } = await createTestClip(userA.id, boardA.id);

    mockRequireAuth.mockResolvedValue({ user: { id: userA.id } });

    await expect(reorderClipsAction(boardA.id, [ownClipId, foreignClipId])).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("blocks updating another board's category", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const boardA = await createTestBoard(userA.id);
    const boardB = await createTestBoard(userB.id);
    const categoryId = newId();
    await createCategory({ id: categoryId, soundboardId: boardB.id, name: "B Category" });

    mockRequireAuth.mockResolvedValue({ user: { id: userA.id } });

    await expect(updateCategoryAction(categoryId, boardA.id, { name: "Hijacked" })).rejects.toThrow(
      "Unauthorized"
    );

    const category = await getCategoryByIdAndBoardId(categoryId, boardB.id);
    expect(category?.name).toBe("B Category");
  });

  it("blocks deleting another board's category", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const boardA = await createTestBoard(userA.id);
    const boardB = await createTestBoard(userB.id);
    const categoryId = newId();
    await createCategory({ id: categoryId, soundboardId: boardB.id, name: "B Category" });

    mockRequireAuth.mockResolvedValue({ user: { id: userA.id } });

    await expect(deleteCategoryAction(categoryId, boardA.id)).rejects.toThrow("Unauthorized");

    expect(await getCategoryByIdAndBoardId(categoryId, boardB.id)).not.toBeNull();
  });

  it("blocks reordering with foreign category ids", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const boardA = await createTestBoard(userA.id);
    const boardB = await createTestBoard(userB.id);
    const ownCategoryId = newId();
    const foreignCategoryId = newId();
    await createCategory({ id: ownCategoryId, soundboardId: boardA.id, name: "A Cat" });
    await createCategory({ id: foreignCategoryId, soundboardId: boardB.id, name: "B Cat" });

    mockRequireAuth.mockResolvedValue({ user: { id: userA.id } });

    await expect(
      reorderCategoriesAction(boardA.id, [ownCategoryId, foreignCategoryId])
    ).rejects.toThrow("Unauthorized");
  });
});
