import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { formatDuration, getShareUrl, slugify } from "@/lib/utils";

describe("utils", () => {
  const originalUrl = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXTAUTH_URL;
    } else {
      process.env.NEXTAUTH_URL = originalUrl;
    }
  });

  it("slugifies board names", () => {
    expect(slugify("My Meme Board!")).toBe("my-meme-board");
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });

  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(null)).toBe("—");
  });

  it("builds share URLs from NEXTAUTH_URL", () => {
    expect(getShareUrl("my-board")).toBe("http://localhost:3000/s/my-board");
  });
});
