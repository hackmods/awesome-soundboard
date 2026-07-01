"use client";

import dynamic from "next/dynamic";

export const BoardEditor = dynamic(
  () => import("./board-editor").then((mod) => mod.BoardEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading soundboard...
      </div>
    ),
  }
);
