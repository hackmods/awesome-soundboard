import { describe, expect, it } from "vitest";
import { serializeBoardForClient } from "@/lib/db/serialize";
import type { Category, Clip, Soundboard } from "@/lib/db/schema";

function makeBoard(overrides?: Partial<Soundboard>): Soundboard {
  return {
    id: "board-1",
    userId: "user-1",
    name: "Test Board",
    slug: "test-board",
    visibility: "private",
    description: null,
    sortOrder: 0,
    createdAt: new Date("2026-07-01T12:00:00.000Z"),
    updatedAt: new Date("2026-07-01T12:00:00.000Z"),
    ...overrides,
  };
}

function makeClip(overrides?: Partial<Clip>): Clip {
  return {
    id: "clip-1",
    soundboardId: "board-1",
    userId: "user-1",
    categoryId: null,
    name: "Clip",
    filePath: "user-1/clip-1.wav",
    mimeType: "audio/wav",
    fileSize: 100,
    durationSec: 1,
    volume: 1,
    hotkey: null,
    sortOrder: 0,
    loop: false,
    createdAt: new Date("2026-07-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("serializeBoardForClient", () => {
  it("converts Date fields to ISO strings", () => {
    const board = makeBoard();
    const result = serializeBoardForClient({ ...board, categories: [], clips: [] });

    expect(result.createdAt).toBe("2026-07-01T12:00:00.000Z");
    expect(result.updatedAt).toBe("2026-07-01T12:00:00.000Z");
  });

  it("converts libsql second timestamps to ISO strings", () => {
    const board = makeBoard({
      createdAt: 1782936629 as unknown as Date,
      updatedAt: 1782936629 as unknown as Date,
    });
    const result = serializeBoardForClient({ ...board, categories: [], clips: [] });

    expect(result.createdAt).toBe(new Date(1782936629000).toISOString());
    expect(result.updatedAt).toBe(new Date(1782936629000).toISOString());
  });

  it("normalizes clip loop to boolean and serializes clip dates", () => {
    const clip = makeClip({ loop: 1 as unknown as boolean });
    const result = serializeBoardForClient({
      ...makeBoard(),
      categories: [] as Category[],
      clips: [clip],
    });

    expect(result.clips[0].loop).toBe(true);
    expect(result.clips[0].createdAt).toBe("2026-07-01T12:00:00.000Z");
  });

  it("handles null dates with epoch fallback", () => {
    const board = makeBoard({
      createdAt: null as unknown as Date,
      updatedAt: null as unknown as Date,
    });
    const result = serializeBoardForClient({ ...board, categories: [], clips: [] });

    expect(result.createdAt).toBe(new Date(0).toISOString());
    expect(result.updatedAt).toBe(new Date(0).toISOString());
  });
});
