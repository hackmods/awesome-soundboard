import { AppHeader } from "@/components/layout/app-header";
import { requireAuth } from "@/lib/auth/session";
import { getSoundboardsByUserId } from "@/lib/db/queries";
import { migrate } from "@/lib/db/migrate";
import { CreateBoardForm } from "@/components/soundboard/create-board-form";
import { BoardCard } from "@/components/soundboard/board-card";

export default async function DashboardPage() {
  await migrate();
  const session = await requireAuth();
  const boards = await getSoundboardsByUserId(session.user.id);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your soundboards</h1>
            <p className="text-muted-foreground">Create and manage your audio collections.</p>
          </div>
          <CreateBoardForm />
        </div>

        {boards.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground">No soundboards yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
