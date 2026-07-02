import { eq, and, desc, asc, like, or, sql, inArray } from "drizzle-orm";
import { getDb } from "./index";
import { users, soundboards, categories, clips } from "./schema";
import type { Soundboard, Clip, Category } from "./schema";

export async function getUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return user ?? null;
}

export async function getUserById(id: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function createUser(data: {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
}) {
  const db = getDb();
  await db.insert(users).values({
    id: data.id,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    displayName: data.displayName,
  });
}

export async function getSoundboardsByUserId(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(soundboards)
    .where(eq(soundboards.userId, userId))
    .orderBy(asc(soundboards.sortOrder), desc(soundboards.updatedAt));
}

export async function getSoundboardById(id: string) {
  const db = getDb();
  const [board] = await db.select().from(soundboards).where(eq(soundboards.id, id));
  return board ?? null;
}

export async function getSoundboardBySlug(slug: string) {
  const db = getDb();
  const [board] = await db.select().from(soundboards).where(eq(soundboards.slug, slug));
  return board ?? null;
}

export async function getPublicSoundboards(page = 1, pageSize = 20) {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  return db
    .select({
      id: soundboards.id,
      name: soundboards.name,
      slug: soundboards.slug,
      description: soundboards.description,
      createdAt: soundboards.createdAt,
      updatedAt: soundboards.updatedAt,
      ownerName: users.displayName,
    })
    .from(soundboards)
    .innerJoin(users, eq(soundboards.userId, users.id))
    .where(eq(soundboards.visibility, "public"))
    .orderBy(desc(soundboards.updatedAt))
    .limit(pageSize)
    .offset(offset);
}

export async function slugExists(slug: string, excludeId?: string) {
  const db = getDb();
  const [existing] = await db.select({ id: soundboards.id }).from(soundboards).where(eq(soundboards.slug, slug));
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

export async function createSoundboard(data: {
  id: string;
  userId: string;
  name: string;
  slug: string;
  visibility?: "private" | "unlisted" | "public";
  description?: string;
}) {
  const db = getDb();
  const now = new Date();
  await db.insert(soundboards).values({
    id: data.id,
    userId: data.userId,
    name: data.name,
    slug: data.slug,
    visibility: data.visibility ?? "private",
    description: data.description,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateSoundboard(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    visibility: "private" | "unlisted" | "public";
    description: string | null;
  }>
) {
  const db = getDb();
  await db
    .update(soundboards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(soundboards.id, id));
}

export async function deleteSoundboard(id: string) {
  const db = getDb();
  await db.delete(soundboards).where(eq(soundboards.id, id));
}

export async function getCategoriesBySoundboardId(soundboardId: string) {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .where(eq(categories.soundboardId, soundboardId))
    .orderBy(asc(categories.sortOrder));
}

export async function createCategory(data: { id: string; soundboardId: string; name: string; sortOrder?: number }) {
  const db = getDb();
  await db.insert(categories).values({
    id: data.id,
    soundboardId: data.soundboardId,
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
  });
}

export async function updateCategory(id: string, data: Partial<{ name: string; sortOrder: number }>) {
  const db = getDb();
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: string) {
  const db = getDb();
  await db.delete(categories).where(eq(categories.id, id));
}

export async function getCategoryByIdAndBoardId(categoryId: string, boardId: string) {
  const db = getDb();
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.soundboardId, boardId)));
  return category ?? null;
}

export async function getCategoriesByIdsForBoard(categoryIds: string[], boardId: string) {
  if (categoryIds.length === 0) return [];
  const db = getDb();
  return db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.soundboardId, boardId), inArray(categories.id, categoryIds)));
}

export async function getClipsBySoundboardId(soundboardId: string, search?: string) {
  const db = getDb();
  const conditions = [eq(clips.soundboardId, soundboardId)];
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(clips.name, term), like(clips.hotkey, term))!);
  }
  return db
    .select()
    .from(clips)
    .where(and(...conditions))
    .orderBy(asc(clips.sortOrder), asc(clips.name));
}

export async function getClipById(id: string) {
  const db = getDb();
  const [clip] = await db.select().from(clips).where(eq(clips.id, id));
  return clip ?? null;
}

export async function getClipByIdAndBoardId(clipId: string, boardId: string) {
  const db = getDb();
  const [clip] = await db
    .select()
    .from(clips)
    .where(and(eq(clips.id, clipId), eq(clips.soundboardId, boardId)));
  return clip ?? null;
}

export async function getClipsByIdsForBoard(clipIds: string[], boardId: string) {
  if (clipIds.length === 0) return [];
  const db = getDb();
  return db
    .select({ id: clips.id })
    .from(clips)
    .where(and(eq(clips.soundboardId, boardId), inArray(clips.id, clipIds)));
}

export async function createClip(data: {
  id: string;
  soundboardId: string;
  userId: string;
  name: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  durationSec?: number;
  sortOrder?: number;
  categoryId?: string;
}) {
  const db = getDb();
  await db.insert(clips).values({
    id: data.id,
    soundboardId: data.soundboardId,
    userId: data.userId,
    name: data.name,
    filePath: data.filePath,
    mimeType: data.mimeType,
    fileSize: data.fileSize,
    durationSec: data.durationSec,
    sortOrder: data.sortOrder ?? 0,
    categoryId: data.categoryId,
  });
  await db.update(soundboards).set({ updatedAt: new Date() }).where(eq(soundboards.id, data.soundboardId));
}

export async function updateClip(
  id: string,
  data: Partial<{
    name: string;
    volume: number;
    hotkey: string | null;
    sortOrder: number;
    loop: boolean;
    categoryId: string | null;
  }>
) {
  const db = getDb();
  const clip = await getClipById(id);
  if (!clip) return;
  await db.update(clips).set(data).where(eq(clips.id, id));
  await db.update(soundboards).set({ updatedAt: new Date() }).where(eq(soundboards.id, clip.soundboardId));
}

export async function deleteClip(id: string) {
  const db = getDb();
  const clip = await getClipById(id);
  if (!clip) return null;
  await db.delete(clips).where(eq(clips.id, id));
  await db.update(soundboards).set({ updatedAt: new Date() }).where(eq(soundboards.id, clip.soundboardId));
  return clip;
}

export async function getNextClipSortOrder(soundboardId: string): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ max: sql<number>`coalesce(max(${clips.sortOrder}), -1)` })
    .from(clips)
    .where(eq(clips.soundboardId, soundboardId));
  return (result?.max ?? -1) + 1;
}

export async function getHotkeyConflicts(soundboardId: string, hotkey: string, excludeClipId?: string) {
  const db = getDb();
  const all = await db
    .select()
    .from(clips)
    .where(and(eq(clips.soundboardId, soundboardId), eq(clips.hotkey, hotkey)));
  return all.filter((c) => c.id !== excludeClipId);
}

export type SoundboardWithClips = Soundboard & {
  categories: Category[];
  clips: Clip[];
};

export async function getSoundboardWithClips(soundboardId: string, search?: string): Promise<SoundboardWithClips | null> {
  const board = await getSoundboardById(soundboardId);
  if (!board) return null;
  const [cats, clipList] = await Promise.all([
    getCategoriesBySoundboardId(soundboardId),
    getClipsBySoundboardId(soundboardId, search),
  ]);
  return { ...board, categories: cats, clips: clipList };
}
