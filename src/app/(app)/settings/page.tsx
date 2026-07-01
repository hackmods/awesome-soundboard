import { AppHeader } from "@/components/layout/app-header";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage local cache and preferences.</p>
        <div className="mt-8">
          <SettingsClient />
        </div>
      </main>
    </div>
  );
}
