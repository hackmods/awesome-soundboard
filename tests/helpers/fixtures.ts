import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import {
  createUser,
  createSoundboard,
  createClip,
  getSoundboardById,
} from "@/lib/db/queries";
import { newId } from "@/lib/id";
import { buildClipFilePath, ensureUserUploadDir } from "@/lib/storage/files";

export type TestUser = {
  id: string;
  email: string;
  password: string;
  displayName: string;
};

export async function createTestUser(overrides?: Partial<TestUser>): Promise<TestUser> {
  const user: TestUser = {
    id: newId(),
    email: overrides?.email ?? `test-${newId()}@example.com`,
    password: overrides?.password ?? "password123",
    displayName: overrides?.displayName ?? "Test User",
    ...overrides,
  };

  const passwordHash = await bcrypt.hash(user.password, 4);
  await createUser({
    id: user.id,
    email: user.email,
    passwordHash,
    displayName: user.displayName,
  });

  return user;
}

export async function createTestBoard(
  userId: string,
  overrides?: Partial<{ name: string; slug: string; visibility: "private" | "unlisted" | "public" }>
) {
  const id = newId();
  const slug = overrides?.slug ?? `board-${id.slice(0, 8)}`;
  await createSoundboard({
    id,
    userId,
    name: overrides?.name ?? "Test Board",
    slug,
    visibility: overrides?.visibility ?? "private",
  });
  const board = await getSoundboardById(id);
  if (!board) throw new Error("Failed to create test board");
  return board;
}

export function createMinimalWavBuffer(): Buffer {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = 80;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

export async function createTestClip(
  userId: string,
  boardId: string,
  overrides?: Partial<{ id: string; name: string; visibility?: "private" | "unlisted" | "public" }>
) {
  const clipId = overrides?.id ?? newId();
  const audio = createMinimalWavBuffer();
  const fileName = "sample.wav";
  const relativePath = buildClipFilePath(userId, clipId, fileName);
  const userDir = ensureUserUploadDir(userId);
  mkdirSync(userDir, { recursive: true });
  const absolutePath = join(userDir, `${clipId}.wav`);
  writeFileSync(absolutePath, audio);

  await createClip({
    id: clipId,
    soundboardId: boardId,
    userId,
    name: overrides?.name ?? "Test Clip",
    filePath: relativePath,
    mimeType: "audio/wav",
    fileSize: audio.length,
    durationSec: 0.01,
  });

  return { clipId, filePath: absolutePath, relativePath };
}

export function writeFixtureAudio(targetPath: string) {
  writeFileSync(targetPath, createMinimalWavBuffer());
}
