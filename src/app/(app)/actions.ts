"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import {
  createSoundboard,
  updateSoundboard,
  deleteSoundboard,
  getSoundboardById,
  slugExists,
  createCategory,
  updateCategory,
  deleteCategory,
  updateClip,
  deleteClip,
  getHotkeyConflicts,
  getClipByIdAndBoardId,
  getClipsByIdsForBoard,
  getCategoryByIdAndBoardId,
  getCategoriesByIdsForBoard,
} from "@/lib/db/queries";
import { newId, resolveClipAbsolutePath } from "@/lib/storage/files";
import { slugify } from "@/lib/utils";
import { unlink } from "fs/promises";
import { migrate } from "@/lib/db/migrate";

async function ensureOwner(boardId: string) {
  await migrate();
  const session = await requireAuth();
  const board = await getSoundboardById(boardId);
  if (!board || board.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }
  return { session, board };
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base) || "board";
  let attempt = slug;
  let i = 1;
  while (await slugExists(attempt, excludeId)) {
    attempt = `${slug}-${i++}`;
  }
  return attempt;
}

const boardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(["private", "unlisted", "public"]).optional(),
  slug: z.string().min(1).max(100).optional(),
});

export async function createBoardAction(formData: FormData) {
  const session = await requireAuth();
  await migrate();

  const parsed = boardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") || "private",
  });

  if (!parsed.success) return { error: "Invalid board data." };

  const id = newId();
  const slug = await uniqueSlug(parsed.data.name);
  await createSoundboard({
    id,
    userId: session.user.id,
    name: parsed.data.name,
    slug,
    visibility: parsed.data.visibility,
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  return { id, slug };
}

export async function updateBoardAction(boardId: string, formData: FormData) {
  const { board } = await ensureOwner(boardId);

  const parsed = boardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    visibility: formData.get("visibility"),
    slug: formData.get("slug") || undefined,
  });

  if (!parsed.success) return { error: "Invalid board data." };

  let slug = board.slug;
  if (parsed.data.slug && parsed.data.slug !== board.slug) {
    const candidate = slugify(parsed.data.slug);
    if (!candidate) return { error: "Invalid slug." };
    if (await slugExists(candidate, boardId)) return { error: "Slug already taken." };
    slug = candidate;
  }

  await updateSoundboard(boardId, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    visibility: parsed.data.visibility,
    slug,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/boards/${boardId}`);
  revalidatePath(`/s/${slug}`);
  return { success: true, slug };
}

export async function deleteBoardAction(boardId: string) {
  await ensureOwner(boardId);
  await deleteSoundboard(boardId);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createCategoryAction(boardId: string, name: string) {
  await ensureOwner(boardId);
  const id = newId();
  await createCategory({ id, soundboardId: boardId, name });
  revalidatePath(`/boards/${boardId}`);
  return { id };
}

export async function updateCategoryAction(categoryId: string, boardId: string, data: { name?: string; sortOrder?: number }) {
  await ensureOwner(boardId);
  const category = await getCategoryByIdAndBoardId(categoryId, boardId);
  if (!category) throw new Error("Unauthorized");
  await updateCategory(categoryId, data);
  revalidatePath(`/boards/${boardId}`);
}

export async function deleteCategoryAction(categoryId: string, boardId: string) {
  await ensureOwner(boardId);
  const category = await getCategoryByIdAndBoardId(categoryId, boardId);
  if (!category) throw new Error("Unauthorized");
  await deleteCategory(categoryId);
  revalidatePath(`/boards/${boardId}`);
}

export async function updateClipAction(
  clipId: string,
  boardId: string,
  data: {
    name?: string;
    volume?: number;
    hotkey?: string | null;
    sortOrder?: number;
    loop?: boolean;
    categoryId?: string | null;
  }
) {
  await ensureOwner(boardId);

  const clip = await getClipByIdAndBoardId(clipId, boardId);
  if (!clip) throw new Error("Unauthorized");

  if (data.hotkey) {
    const conflicts = await getHotkeyConflicts(boardId, data.hotkey, clipId);
    if (conflicts.length > 0) {
      return { error: `Hotkey "${data.hotkey}" is already assigned.` };
    }
  }

  if (data.categoryId) {
    const category = await getCategoryByIdAndBoardId(data.categoryId, boardId);
    if (!category) throw new Error("Unauthorized");
  }

  await updateClip(clipId, data);
  revalidatePath(`/boards/${boardId}`);
  return { success: true };
}

export async function deleteClipAction(clipId: string, boardId: string) {
  await ensureOwner(boardId);
  const clip = await getClipByIdAndBoardId(clipId, boardId);
  if (!clip) throw new Error("Unauthorized");
  const deleted = await deleteClip(clipId);
  if (deleted) {
    try {
      await unlink(resolveClipAbsolutePath(deleted.filePath));
    } catch {
      // file may already be gone
    }
  }
  revalidatePath(`/boards/${boardId}`);
  return { success: true };
}

export async function reorderClipsAction(boardId: string, orderedIds: string[]) {
  await ensureOwner(boardId);
  const found = await getClipsByIdsForBoard(orderedIds, boardId);
  if (found.length !== orderedIds.length) {
    throw new Error("Unauthorized");
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await updateClip(orderedIds[i], { sortOrder: i });
  }
  revalidatePath(`/boards/${boardId}`);
}

export async function reorderCategoriesAction(boardId: string, orderedIds: string[]) {
  await ensureOwner(boardId);
  const found = await getCategoriesByIdsForBoard(orderedIds, boardId);
  if (found.length !== orderedIds.length) {
    throw new Error("Unauthorized");
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await updateCategory(orderedIds[i], { sortOrder: i });
  }
  revalidatePath(`/boards/${boardId}`);
}
