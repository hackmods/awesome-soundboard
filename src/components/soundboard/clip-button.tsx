"use client";

import { useMemo } from "react";
import { cn, formatDuration } from "@/lib/utils";
import { WaveformPreview } from "./waveform-preview";
import { Volume2, Square } from "lucide-react";
import type { ClientClip } from "@/lib/db/serialize";

type ClipButtonProps = {
  clip: ClientClip;
  isPlaying: boolean;
  editable?: boolean;
  onPlay: () => void;
  onEdit?: () => void;
};

export function ClipButton({ clip, isPlaying, editable, onPlay, onEdit }: ClipButtonProps) {
  return (
    <button
      type="button"
      onClick={onPlay}
      onContextMenu={(e) => {
        if (editable && onEdit) {
          e.preventDefault();
          onEdit();
        }
      }}
      className={cn(
        "group relative flex min-h-[120px] flex-col rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-md",
        isPlaying && "border-primary ring-2 ring-primary/30"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-medium leading-tight">{clip.name}</span>
        {isPlaying ? (
          <Square className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>

      <WaveformPreview clipId={clip.id} className="mb-2 opacity-70" height={28} />

      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDuration(clip.durationSec)}</span>
        {clip.hotkey && (
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">{clip.hotkey}</kbd>
        )}
      </div>

      {editable && (
        <span className="absolute right-2 top-2 hidden text-[10px] text-muted-foreground group-hover:block">
          right-click to edit
        </span>
      )}
    </button>
  );
}

export function useHotkeyBindings(
  clips: ClientClip[],
  onPlay: (clip: ClientClip) => void
): Record<string, () => void> {
  return useMemo(() => {
    const bindings: Record<string, () => void> = {};
    for (const clip of clips) {
      if (clip.hotkey) {
        const key = clip.hotkey.length === 1 ? clip.hotkey.toLowerCase() : clip.hotkey;
        bindings[key] = () => onPlay(clip);
      }
    }
    return bindings;
  }, [clips, onPlay]);
}
