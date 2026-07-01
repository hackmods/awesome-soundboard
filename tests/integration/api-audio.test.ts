import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/clips/[clipId]/audio/route";
import { clearTestData, initTestDb, setupTestEnv } from "../helpers/db";
import { createTestBoard, createTestClip, createTestUser } from "../helpers/fixtures";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const env = setupTestEnv("asb-audio-");

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

describe("GET /api/clips/[clipId]/audio", () => {
  it("allows owners to stream private board clips", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id, { visibility: "private" });
    const { clipId } = await createTestClip(user.id, board.id);

    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const request = new Request(`http://localhost/api/clips/${clipId}/audio`);
    const response = await GET(request as never, { params: Promise.resolve({ clipId }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
  });

  it("blocks anonymous access to private board clips", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id, { visibility: "private" });
    const { clipId } = await createTestClip(user.id, board.id);

    mockAuth.mockResolvedValue(null);

    const request = new Request(`http://localhost/api/clips/${clipId}/audio`);
    const response = await GET(request as never, { params: Promise.resolve({ clipId }) });

    expect(response.status).toBe(403);
  });

  it("allows anonymous access to public board clips", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id, { visibility: "public" });
    const { clipId } = await createTestClip(user.id, board.id);

    mockAuth.mockResolvedValue(null);

    const request = new Request(`http://localhost/api/clips/${clipId}/audio`);
    const response = await GET(request as never, { params: Promise.resolve({ clipId }) });

    expect(response.status).toBe(200);
  });

  it("allows anonymous access to unlisted board clips", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id, { visibility: "unlisted" });
    const { clipId } = await createTestClip(user.id, board.id);

    mockAuth.mockResolvedValue(null);

    const request = new Request(`http://localhost/api/clips/${clipId}/audio`);
    const response = await GET(request as never, { params: Promise.resolve({ clipId }) });

    expect(response.status).toBe(200);
  });
});
