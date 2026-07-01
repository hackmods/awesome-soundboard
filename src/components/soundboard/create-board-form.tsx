"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createBoardAction } from "@/app/(app)/actions";

export function CreateBoardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New soundboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create soundboard</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              const formData = new FormData(e.currentTarget);
              const result = await createBoardAction(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              if (result?.id) {
                setOpen(false);
                router.push(`/boards/${result.id}`);
                router.refresh();
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create soundboard.");
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="board-name">Name</Label>
            <Input id="board-name" name="name" required placeholder="My meme board" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
