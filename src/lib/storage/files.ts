import { mkdirSync } from "fs";
import { join, extname } from "path";

const ALLOWED_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".webm"]);
const ALLOWED_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
]);

export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? "./data/uploads";
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getMaxUploadBytes(): number {
  return Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
}

export function isAllowedAudioFile(filename: string, mimeType: string): boolean {
  const ext = extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!mimeType || mimeType === "application/octet-stream") return true;
  return ALLOWED_MIMES.has(mimeType) || mimeType.startsWith("audio/");
}

export function buildClipFilePath(userId: string, clipId: string, filename: string): string {
  const ext = extname(filename).toLowerCase() || ".mp3";
  return join(userId, `${clipId}${ext}`);
}

export function resolveClipAbsolutePath(relativePath: string): string {
  return join(getUploadDir(), relativePath);
}

export function ensureUserUploadDir(userId: string): string {
  const dir = join(getUploadDir(), userId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export { newId } from "@/lib/id";
