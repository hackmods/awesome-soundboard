import Link from "next/link";
import { signOut } from "@/lib/auth";
import { requireAuth } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

export async function AppHeader() {
  const session = await requireAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Volume2 className="h-5 w-5 text-primary" />
          Awesome Soundboard
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/explore">Explore</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
          <span className="hidden text-sm text-muted-foreground sm:inline">{session.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
