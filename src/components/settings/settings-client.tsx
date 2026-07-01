"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearLocalCache, getQueuedUploads } from "@/lib/sync/cache";

export function SettingsClient() {
  const [cleared, setCleared] = useState(false);
  const [queueCount, setQueueCount] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Local clip cache</CardTitle>
          <CardDescription>
            Clips you play are cached in your browser for faster replay and offline access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            onClick={async () => {
              await clearLocalCache();
              setCleared(true);
              setTimeout(() => setCleared(false), 3000);
            }}
          >
            Clear local cache
          </Button>
          {cleared && <p className="text-sm text-green-500">Cache cleared.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Offline upload queue</CardTitle>
          <CardDescription>Uploads queued while offline are stored locally until synced.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              const queue = await getQueuedUploads();
              setQueueCount(queue.length);
            }}
          >
            Check queue
          </Button>
          {queueCount !== null && (
            <p className="mt-2 text-sm text-muted-foreground">
              {queueCount} upload{queueCount !== 1 ? "s" : ""} in queue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
