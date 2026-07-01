"use client";

import { useEffect, useState, useCallback } from "react";
import { getQueuedUploads, syncUploadQueue } from "@/lib/sync/cache";

export function useOfflineSync(onSynced?: () => void) {
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  const refreshQueue = useCallback(async () => {
    const queue = await getQueuedUploads();
    setQueuedCount(queue.length);
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      const result = await syncUploadQueue();
      if (result.synced > 0) onSynced?.();
      await refreshQueue();
    } finally {
      setSyncing(false);
    }
  }, [onSynced, refreshQueue]);

  useEffect(() => {
    refreshQueue();
    setOnline(navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      sync();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshQueue, sync]);

  return { queuedCount, syncing, online, sync, refreshQueue };
}
