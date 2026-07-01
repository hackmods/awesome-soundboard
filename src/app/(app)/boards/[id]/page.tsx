import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { BoardEditor } from "@/components/soundboard/board-editor";
import { requireAuth } from "@/lib/auth/session";
import { getSoundboardWithClips } from "@/lib/db/queries";
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

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <BoardEditor
          board={data}
          clips={data.clips}
          categories={data.categories}
          shareUrl={getShareUrl(data.slug)}
          editable
        />
      </main>
    </div>
  );
}
