import { describe, expect, it, afterEach } from "vitest";
import {
  buildClipFilePath,
  getMaxUploadBytes,
  isAllowedAudioFile,
  resolveClipAbsolutePath,
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
    expect(isAllowedAudioFile("clip.mp3", "application/octet-stream")).toBe(false);
  });

  it("builds user-scoped clip file paths", () => {
    expect(buildClipFilePath("user-1", "clip-1", "sound.mp3")).toBe("user-1/clip-1.mp3");
    expect(buildClipFilePath("user-1", "clip-1", "sound")).toBe("user-1/clip-1.mp3");
  });

  it("reads max upload bytes from env", () => {
    process.env.MAX_UPLOAD_BYTES = "2048";
    expect(getMaxUploadBytes()).toBe(2048);
  });

  it("rejects path traversal in resolveClipAbsolutePath", () => {
    process.env.UPLOAD_DIR = "/tmp/asb-uploads-test";
    expect(() => resolveClipAbsolutePath("../../etc/passwd")).toThrow("Invalid clip path");
    expect(() => resolveClipAbsolutePath("user-1/../../../etc/passwd")).toThrow("Invalid clip path");
  });

  it("resolves valid paths under upload dir", () => {
    process.env.UPLOAD_DIR = "/tmp/asb-uploads-test";
    const resolved = resolveClipAbsolutePath("user-1/clip-1.mp3");
    expect(resolved).toContain("user-1");
    expect(resolved).toContain("clip-1.mp3");
  });
});
