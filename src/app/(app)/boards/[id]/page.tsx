import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { BoardEditor } from "@/components/soundboard/board-editor-dynamic";
import { requireAuth } from "@/lib/auth/session";
import { getSoundboardWithClips } from "@/lib/db/queries";
import { serializeBoardForClient } from "@/lib/db/serialize";
import { getShareUrl } from "@/lib/utils";
import { migrate } from "@/lib/db/migrate";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  await migrate();
  const { id } = await params;
  const session = await requireAuth();
  const data = await getSoundboardWithClips(id);

  if (!data || data.userId !== session.user.id) {
    notFound();
  }

  const board = serializeBoardForClient(data);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <BoardEditor
          board={board}
          clips={board.clips}
          categories={board.categories}
          shareUrl={getShareUrl(board.slug)}
          editable
        />
      </main>
    </div>
  );
}
