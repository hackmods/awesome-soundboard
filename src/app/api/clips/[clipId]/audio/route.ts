import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { getClipById, getSoundboardById } from "@/lib/db/queries";
import { resolveClipAbsolutePath } from "@/lib/storage/files";

function canAccessBoard(
  board: { userId: string; visibility: string },
  userId?: string
): boolean {
  if (board.visibility === "public" || board.visibility === "unlisted") return true;
  return userId === board.userId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
) {
  const { clipId } = await params;
  const session = await auth();

  const clip = await getClipById(clipId);
  if (!clip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const board = await getSoundboardById(clip.soundboardId);
  if (!board || !canAccessBoard(board, session?.user?.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = resolveClipAbsolutePath(clip.filePath);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stat = statSync(filePath);
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": clip.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": clip.mimeType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
