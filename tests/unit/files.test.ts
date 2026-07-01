import { describe, expect, it, afterEach } from "vitest";
import {
  buildClipFilePath,
  getMaxUploadBytes,
  isAllowedAudioFile,
} from "@/lib/storage/files";

describe("storage/files", () => {
  const originalMax = process.env.MAX_UPLOAD_BYTES;

  afterEach(() => {
    if (originalMax === undefined) {
      delete process.env.MAX_UPLOAD_BYTES;
    } else {
      process.env.MAX_UPLOAD_BYTES = originalMax;
    }
  });

  it("validates allowed audio extensions and mime types", () => {
    expect(isAllowedAudioFile("clip.mp3", "audio/mpeg")).toBe(true);
    expect(isAllowedAudioFile("clip.wav", "audio/wav")).toBe(true);
    expect(isAllowedAudioFile("clip.txt", "text/plain")).toBe(false);
    expect(isAllowedAudioFile("clip.mp3", "application/octet-stream")).toBe(true);
  });

  it("builds user-scoped clip file paths", () => {
    expect(buildClipFilePath("user-1", "clip-1", "sound.mp3")).toBe("user-1/clip-1.mp3");
    expect(buildClipFilePath("user-1", "clip-1", "sound")).toBe("user-1/clip-1.mp3");
  });

  it("reads max upload bytes from env", () => {
    process.env.MAX_UPLOAD_BYTES = "2048";
    expect(getMaxUploadBytes()).toBe(2048);
  });
});
