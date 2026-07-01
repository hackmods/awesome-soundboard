"use client";

import { useCallback, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queueUpload } from "@/lib/sync/cache";
import { newId } from "@/lib/id";

type DropZoneProps = {
  boardId: string;
  categoryId?: string;
  onUploaded: () => void;
  onQueued?: () => void;
};

export function DropZone({ boardId, categoryId, onUploaded, onQueued }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);
      try {
        for (const file of fileArray) {
          if (!navigator.onLine) {
            await queueUpload({
              id: newId(),
              boardId,
              categoryId,
              fileName: file.name,
              blob: file,
              mimeType: file.type || "audio/mpeg",
            });
            onQueued?.();
            continue;
          }

          const formData = new FormData();
          formData.append("boardId", boardId);
          formData.append("file", file);
          if (categoryId) formData.append("categoryId", categoryId);

          const res = await fetch("/api/uploads", { method: "POST", body: formData });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? "Upload failed");
          }
        }
        onUploaded();
      } finally {
        setUploading(false);
      }
    },
    [boardId, categoryId, onUploaded, onQueued]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        uploadFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        uploading && "pointer-events-none opacity-60"
      )}
    >
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <Upload className="h-8 w-8 text-muted-foreground" />
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        Drag & drop audio files here, or{" "}
        <label className="cursor-pointer text-primary hover:underline">
          browse
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </label>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">MP3, WAV, OGG, M4A — max 10 MB each</p>
    </div>
  );
}
