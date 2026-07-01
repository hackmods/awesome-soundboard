"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WaveformPreview } from "@/components/soundboard/waveform-preview";
import { updateClipAction, deleteClipAction } from "@/app/(app)/actions";
import type { ClientClip } from "@/lib/db/serialize";
import type { Category } from "@/lib/db/schema";

type ClipEditDialogProps = {
  clip: ClientClip | null;
  boardId: string;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClipEditDialog({ clip, boardId, categories, open, onOpenChange }: ClipEditDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(clip?.name ?? "");
  const [volume, setVolume] = useState((clip?.volume ?? 1) * 100);
  const [loop, setLoop] = useState(clip?.loop ?? false);
  const [hotkey, setHotkey] = useState(clip?.hotkey ?? "");
  const [categoryId, setCategoryId] = useState(clip?.categoryId ?? "none");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (clip && open) {
      setName(clip.name);
      setVolume(clip.volume * 100);
      setLoop(clip.loop);
      setHotkey(clip.hotkey ?? "");
      setCategoryId(clip.categoryId ?? "none");
      setError(null);
    }
  }, [clip, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit clip</DialogTitle>
        </DialogHeader>
        {clip && (
          <div className="space-y-4">
            <WaveformPreview clipId={clip.id} height={64} />

            <div className="space-y-2">
              <Label htmlFor="clip-name">Name</Label>
              <Input id="clip-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Volume ({Math.round(volume)}%)</Label>
              <Slider value={[volume]} min={0} max={100} step={1} onValueChange={([v]) => setVolume(v)} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="clip-loop">Loop</Label>
              <Switch id="clip-loop" checked={loop} onCheckedChange={setLoop} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clip-hotkey">Hotkey</Label>
              <Input
                id="clip-hotkey"
                value={hotkey}
                placeholder="e.g. 1, a, F1"
                maxLength={10}
                onKeyDown={(e) => {
                  e.preventDefault();
                  if (e.key === "Backspace" || e.key === "Delete") {
                    setHotkey("");
                  } else if (e.key.length <= 3) {
                    setHotkey(e.key);
                  }
                }}
                readOnly
              />
              <p className="text-xs text-muted-foreground">Press a key to assign. Backspace to clear.</p>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-between gap-2">
              <Button
                variant="destructive"
                disabled={pending}
                onClick={async () => {
                  setPending(true);
                  await deleteClipAction(clip.id, boardId);
                  setPending(false);
                  onOpenChange(false);
                  router.refresh();
                }}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={pending}
                  onClick={async () => {
                    setPending(true);
                    setError(null);
                    const result = await updateClipAction(clip.id, boardId, {
                      name,
                      volume: volume / 100,
                      loop,
                      hotkey: hotkey || null,
                      categoryId: categoryId === "none" ? null : categoryId,
                    });
                    setPending(false);
                    if (result?.error) {
                      setError(result.error);
                      return;
                    }
                    onOpenChange(false);
                    router.refresh();
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
