"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBoardAction, createCategoryAction } from "@/app/(app)/actions";
import type { ClientSoundboard } from "@/lib/db/serialize";

type BoardSettingsProps = {
  board: ClientSoundboard;
  shareUrl: string;
};

export function BoardSettings({ board, shareUrl }: BoardSettingsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [visibility, setVisibility] = useState(board.visibility);
  const canShare = visibility !== "private";

  return (
    <div id="settings" className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">Board settings</h2>
      <form
        action={async (formData) => {
          formData.set("visibility", visibility);
          await updateBoardAction(board.id, formData);
          router.refresh();
        }}
        className="grid gap-4 md:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={board.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={board.slug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" defaultValue={board.description ?? ""} />
        </div>
        <Button type="submit" className="w-fit">
          Save settings
        </Button>
      </form>

      {canShare && (
        <div className="flex items-center gap-2">
          <Input readOnly value={shareUrl} className="font-mono text-xs" />
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button
          variant="secondary"
          type="button"
          disabled={!newCategory.trim()}
          onClick={async () => {
            await createCategoryAction(board.id, newCategory.trim());
            setNewCategory("");
            router.refresh();
          }}
        >
          Add category
        </Button>
      </div>
    </div>
  );
}
