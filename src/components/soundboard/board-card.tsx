import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getShareUrl } from "@/lib/utils";
import type { Soundboard } from "@/lib/db/schema";

const visibilityLabels = {
  private: "Private",
  unlisted: "Unlisted",
  public: "Public",
} as const;

export function BoardCard({ board }: { board: Soundboard }) {
  return (
    <Link href={`/boards/${board.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{board.name}</CardTitle>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {visibilityLabels[board.visibility]}
            </span>
          </div>
          {board.description && <CardDescription className="line-clamp-2">{board.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {board.visibility !== "private" && (
            <p className="truncate font-mono text-xs text-muted-foreground">{getShareUrl(board.slug)}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
