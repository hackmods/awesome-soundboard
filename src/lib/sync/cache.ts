import Dexie, { type Table } from "dexie";

export type CachedClip = {
  clipId: string;
  boardId: string;
  blob: Blob;
  mimeType: string;
  updatedAt: number;
};

export type QueuedUpload = {
  id: string;
  boardId: string;
  categoryId?: string;
  fileName: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
};

class SoundboardDB extends Dexie {
  clips!: Table<CachedClip, string>;
  uploadQueue!: Table<QueuedUpload, string>;

  constructor() {
    super("awesome-soundboard");
    this.version(1).stores({
      clips: "clipId, boardId, updatedAt",
      uploadQueue: "id, boardId, createdAt",
    });
  }
}

export const db = typeof window !== "undefined" ? new SoundboardDB() : (null as unknown as SoundboardDB);

export async function getCachedClipUrl(clipId: string): Promise<string | null> {
  if (!db) return null;
  const cached = await db.clips.get(clipId);
  if (!cached) return null;
  return URL.createObjectURL(cached.blob);
}

export async function cacheClip(clipId: string, boardId: string, blob: Blob, mimeType: string) {
  if (!db) return;
  await db.clips.put({
    clipId,
    boardId,
    blob,
    mimeType,
    updatedAt: Date.now(),
  });
}

export async function fetchAndCacheClip(clipId: string, boardId: string): Promise<string> {
  const cached = await getCachedClipUrl(clipId);
  if (cached) return cached;

  const res = await fetch(`/api/clips/${clipId}/audio`);
  if (!res.ok) throw new Error("Failed to fetch clip");
  const blob = await res.blob();
  const mimeType = res.headers.get("content-type") ?? "audio/mpeg";
  await cacheClip(clipId, boardId, blob, mimeType);
  return URL.createObjectURL(blob);
}

export async function clearLocalCache() {
  if (!db) return;
  await db.clips.clear();
}

export async function queueUpload(item: Omit<QueuedUpload, "createdAt">) {
  if (!db) return;
  await db.uploadQueue.put({ ...item, createdAt: Date.now() });
}

export async function getQueuedUploads(): Promise<QueuedUpload[]> {
  if (!db) return [];
  return db.uploadQueue.orderBy("createdAt").toArray();
}

export async function removeQueuedUpload(id: string) {
  if (!db) return;
  await db.uploadQueue.delete(id);
}

export async function syncUploadQueue(
  onProgress?: (remaining: number) => void
): Promise<{ synced: number; failed: number }> {
  if (!db || !navigator.onLine) return { synced: 0, failed: 0 };

  const queue = await getQueuedUploads();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const formData = new FormData();
      formData.append("boardId", item.boardId);
      formData.append("file", new File([item.blob], item.fileName, { type: item.mimeType }));
      if (item.categoryId) formData.append("categoryId", item.categoryId);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      await removeQueuedUpload(item.id);
      synced++;
    } catch {
      failed++;
    }
    onProgress?.(queue.length - synced - failed);
  }

  return { synced, failed };
}
