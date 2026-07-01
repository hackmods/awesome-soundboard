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
            const formData = new FormData(e.currentTarget);
            const result = await createBoardAction(formData);
            setPending(false);
            if (result?.id) {
              setOpen(false);
              router.push(`/boards/${result.id}`);
              router.refresh();
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="board-name">Name</Label>
            <Input id="board-name" name="name" required placeholder="My meme board" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
