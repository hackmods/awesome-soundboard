import Link from "next/link";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicSoundboards } from "@/lib/db/queries";
import { migrate } from "@/lib/db/migrate";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  migrate();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const boards = await getPublicSoundboards(page);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Volume2 className="h-5 w-5 text-primary" />
            Awesome Soundboard
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Explore public soundboards</h1>
        <p className="mt-1 text-muted-foreground">Discover and play community soundboards.</p>

        {boards.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">No public soundboards yet.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link key={board.id} href={`/s/${board.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    {board.description && <CardDescription className="line-clamp-2">{board.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">by {board.ownerName}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
