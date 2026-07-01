"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Square, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClipGrid } from "@/components/soundboard/clip-grid";
import { ClipEditDialog } from "@/components/soundboard/clip-edit-dialog";
import { DropZone } from "@/components/upload/drop-zone";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useHotkeyBindings } from "@/components/soundboard/clip-button";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { BoardSettings } from "@/components/soundboard/board-settings";
import { reorderClipsAction } from "@/app/(app)/actions";
import type { Soundboard, Clip, Category } from "@/lib/db/schema";

type BoardEditorProps = {
  board: Soundboard;
  clips: Clip[];
  categories: Category[];
  shareUrl: string;
  editable?: boolean;
};

export function BoardEditor({ board, clips, categories, shareUrl, editable = true }: BoardEditorProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingClip, setEditingClip] = useState<Clip | null>(null);
  const { play, stopAll, playingIds, unlocked, unlock } = useAudioPlayer(board.id);
  const { queuedCount, online, sync, syncing } = useOfflineSync(() => router.refresh());

  const handlePlay = useCallback(
    (clip: Clip) => {
      if (!unlocked) unlock();
      play({
        id: clip.id,
        volume: clip.volume,
        loop: clip.loop,
      });
    },
    [play, unlocked, unlock]
  );

  const hotkeyBindings = useHotkeyBindings(clips, handlePlay);
  useHotkeys(hotkeyBindings, !editingClip);

  return (
    <div className="space-y-6">
      {!unlocked && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">Click any clip or the button below to enable audio playback.</p>
          <Button className="mt-2" size="sm" onClick={unlock}>
            Enable audio
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{board.name}</h1>
          {board.description && <p className="text-muted-foreground">{board.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!online && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          )}
          {queuedCount > 0 && (
            <Button variant="outline" size="sm" onClick={sync} disabled={syncing || !online}>
              <Wifi className="h-3 w-3" />
              Sync {queuedCount} upload{queuedCount !== 1 ? "s" : ""}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={stopAll}>
            <Square className="h-3 w-3" />
            Stop all
          </Button>
        </div>
      </div>

      {editable && <BoardSettings board={board} shareUrl={shareUrl} />}

      {editable && (
        <DropZone
          boardId={board.id}
          onUploaded={() => router.refresh()}
          onQueued={() => router.refresh()}
        />
      )}

      <ClipGrid
        clips={clips}
        categories={categories}
        playingIds={playingIds}
        editable={editable}
        onPlay={handlePlay}
        onEdit={editable ? setEditingClip : undefined}
        onReorder={
          editable
            ? async (orderedIds) => {
                await reorderClipsAction(board.id, orderedIds);
                router.refresh();
              }
            : undefined
        }
        search={search}
        onSearchChange={setSearch}
      />

      <ClipEditDialog
        clip={editingClip}
        boardId={board.id}
        categories={categories}
        open={!!editingClip}
        onOpenChange={(open) => !open && setEditingClip(null)}
      />
    </div>
  );
}
