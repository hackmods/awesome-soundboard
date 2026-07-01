import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { signOut } from "@/lib/auth";
import { getOptionalAuth } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getOptionalAuth();
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Volume2 className="h-6 w-6 text-primary" />
            Awesome Soundboard
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/explore">Explore</Link>
            </Button>
            {isLoggedIn ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">{session.user?.name}</span>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <Button variant="outline" type="submit">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Your sounds, <span className="text-primary">one click away</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Upload clips, organize them into soundboards, assign hotkeys, and share with the world — or keep them private.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {isLoggedIn ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/explore">Browse public boards</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/register">Create your soundboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/explore">Browse public boards</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { title: "Upload & organize", desc: "Drag-and-drop audio clips into categorized boards." },
            { title: "Hotkeys & controls", desc: "Assign keyboard shortcuts, per-clip volume, and loop." },
            { title: "Share anywhere", desc: "Private, unlisted, or public — you control visibility." },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
