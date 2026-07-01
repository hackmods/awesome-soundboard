import type { Category, Clip, Soundboard } from "./schema";

export type ClientSoundboard = Omit<Soundboard, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type ClientClip = Omit<Clip, "createdAt"> & {
  createdAt: string;
};

export type BoardWithClipsClient = ClientSoundboard & {
  categories: Category[];
  clips: ClientClip[];
};

function toIso(value: Date | string | number | null | undefined): string {
  if (value == null) return new Date(0).toISOString();
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date(0).toISOString() : value.toISOString();
  }
  const asNumber = typeof value === "number" ? value : Number(value);
  const ms = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

export function serializeBoardForClient(
  board: Soundboard & { categories: Category[]; clips: Clip[] }
): BoardWithClipsClient {
  return {
    ...board,
    createdAt: toIso(board.createdAt),
    updatedAt: toIso(board.updatedAt),
    categories: board.categories,
    clips: board.clips.map((clip) => ({
      ...clip,
      loop: Boolean(clip.loop),
      createdAt: toIso(clip.createdAt),
    })),
  };
}
