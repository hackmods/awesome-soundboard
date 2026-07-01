import { notFound } from "next/navigation";
import Link from "next/link";
import { Volume2 } from "lucide-react";
import { BoardEditor } from "@/components/soundboard/board-editor-dynamic";
import { Button } from "@/components/ui/button";
import { getSoundboardBySlug, getSoundboardWithClips } from "@/lib/db/queries";
import { serializeBoardForClient } from "@/lib/db/serialize";
import { getShareUrl } from "@/lib/utils";
import { getOptionalAuth } from "@/lib/auth/session";
import { migrate } from "@/lib/db/migrate";

export default async function SharedBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  await migrate();
  const { slug } = await params;
  const session = await getOptionalAuth();
  const board = await getSoundboardBySlug(slug);

  if (!board) {
    notFound();
  }

  if (board.visibility === "private") {
    if (!session?.user?.id || session.user.id !== board.userId) {
      notFound();
    }
  }

  const data = await getSoundboardWithClips(board.id);
  if (!data) notFound();

  const boardData = serializeBoardForClient(data);
  const isOwner = session?.user?.id === board.userId;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Volume2 className="h-5 w-5 text-primary" />
            Awesome Soundboard
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore">Explore</Link>
            </Button>
            {isOwner ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/boards/${board.id}`}>Edit board</Link>
              </Button>
            ) : session ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <BoardEditor
          board={boardData}
          clips={boardData.clips}
          categories={boardData.categories}
          shareUrl={getShareUrl(boardData.slug)}
          editable={false}
        />
      </main>
    </div>
  );
}
