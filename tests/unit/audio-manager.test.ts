import { describe, expect, it, beforeEach, vi } from "vitest";
import { getAudioManager, resetAudioManagerForTests } from "@/lib/audio/manager";

vi.mock("howler", () => {
  class MockHowl {
    private playingState = false;

    constructor(private options: { onplay?: () => void }) {}

    play() {
      this.playingState = true;
      this.options.onplay?.();
    }

    playing() {
      return this.playingState;
    }

    stop() {
      this.playingState = false;
    }
  }

  return {
    Howl: MockHowl,
    Howler: { ctx: { state: "running", resume: vi.fn() } },
  };
});

describe("AudioManager", () => {
  beforeEach(() => {
    resetAudioManagerForTests();
  });

  it("returns stable array reference from getPlayingIds when unchanged", async () => {
    const manager = getAudioManager();
    const first = manager.getPlayingIds();
    const second = manager.getPlayingIds();

    expect(first).toBe(second);
    expect(first).toEqual([]);
  });

  it("returns stable reference across repeated calls while playing", async () => {
    const manager = getAudioManager();

    await manager.play({
      id: "clip-1",
      src: "/api/clips/clip-1/audio",
      volume: 1,
      loop: false,
    });

    const first = manager.getPlayingIds();
    const second = manager.getPlayingIds();

    expect(first).toBe(second);
    expect(first).toEqual(["clip-1"]);
  });
});
