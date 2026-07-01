import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { parseBuffer } from "music-metadata";
import { auth } from "@/lib/auth";
import {
  getSoundboardById,
  createClip,
  getNextClipSortOrder,
} from "@/lib/db/queries";
import {
  buildClipFilePath,
  ensureUserUploadDir,
  getMaxUploadBytes,
  isAllowedAudioFile,
  resolveClipAbsolutePath,
} from "@/lib/storage/files";
import { newId } from "@/lib/id";
import { migrate } from "@/lib/db/migrate";

export async function POST(req: NextRequest) {
  migrate();

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const boardId = formData.get("boardId") as string;
  const categoryId = (formData.get("categoryId") as string) || undefined;
  const file = formData.get("file") as File | null;

  if (!boardId || !file) {
    return NextResponse.json({ error: "Missing boardId or file" }, { status: 400 });
  }

  const board = await getSoundboardById(boardId);
  if (!board || board.userId !== session.user.id) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (file.size > getMaxUploadBytes()) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  if (!isAllowedAudioFile(file.name, file.type)) {
    return NextResponse.json({ error: "Unsupported audio format" }, { status: 400 });
  }

  const clipId = newId();
  const relativePath = buildClipFilePath(session.user.id, clipId, file.name);
  ensureUserUploadDir(session.user.id);
  const absolutePath = resolveClipAbsolutePath(relativePath);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  let durationSec: number | undefined;
  try {
    const metadata = await parseBuffer(buffer, { mimeType: file.type });
    durationSec = metadata.format.duration;
  } catch {
    // duration optional
  }

  const sortOrder = await getNextClipSortOrder(boardId);
  const name = file.name.replace(/\.[^.]+$/, "");

  await createClip({
    id: clipId,
    soundboardId: boardId,
    userId: session.user.id,
    name,
    filePath: relativePath,
    mimeType: file.type,
    fileSize: file.size,
    durationSec,
    sortOrder,
    categoryId,
  });

  return NextResponse.json({
    id: clipId,
    name,
    filePath: relativePath,
    mimeType: file.type,
    fileSize: file.size,
    durationSec,
    sortOrder,
    volume: 1,
    loop: false,
    hotkey: null,
    categoryId: categoryId ?? null,
  });
}
