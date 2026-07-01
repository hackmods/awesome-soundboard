import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/uploads/route";
import { getClipById } from "@/lib/db/queries";
import { clearTestData, initTestDb, setupTestEnv } from "../helpers/db";
import { createMinimalWavBuffer, createTestBoard, createTestUser } from "../helpers/fixtures";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const env = setupTestEnv("asb-uploads-");

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  mockAuth.mockReset();
  await clearTestData();
});

afterAll(() => {
  env.cleanup();
});

describe("POST /api/uploads", () => {
  it("returns 401 without auth", async () => {
    mockAuth.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("boardId", "board-1");
    formData.append("file", new File([createMinimalWavBuffer()], "clip.wav", { type: "audio/wav" }));

    const request = new Request("http://localhost/api/uploads", { method: "POST", body: formData });
    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it("returns 400 when file is missing", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id, email: user.email, name: user.displayName } });

    const formData = new FormData();
    formData.append("boardId", board.id);

    const request = new Request("http://localhost/api/uploads", { method: "POST", body: formData });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it("creates a clip for a valid upload", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id, email: user.email, name: user.displayName } });

    const formData = new FormData();
    formData.append("boardId", board.id);
    formData.append(
      "file",
      new File([createMinimalWavBuffer()], "clip.wav", { type: "audio/wav" })
    );

    const request = new Request("http://localhost/api/uploads", { method: "POST", body: formData });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBeTruthy();

    const clip = await getClipById(body.id);
    expect(clip?.soundboardId).toBe(board.id);
    expect(clip?.userId).toBe(user.id);
  });
});
