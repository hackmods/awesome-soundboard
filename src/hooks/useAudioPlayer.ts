"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getAudioManager, getClipAudioUrl, type ClipPlaybackConfig } from "@/lib/audio/manager";
import { fetchAndCacheClip } from "@/lib/sync/cache";

export function useAudioPlayer(boardId: string) {
  const playingIds = useSyncExternalStore(
    (cb) => getAudioManager().subscribe(cb),
    () => getAudioManager().getPlayingIds(),
    () => [] as string[]
  );

  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const manager = getAudioManager();
    setUnlocked(manager.isUnlocked());
    return manager.subscribe(() => setUnlocked(manager.isUnlocked()));
  }, []);

  const unlock = useCallback(() => {
    void getAudioManager().unlock().then(() => setUnlocked(true));
  }, []);

  const play = useCallback(
    async (config: Omit<ClipPlaybackConfig, "src"> & { useCache?: boolean }) => {
      let src: string;
      if (config.useCache !== false) {
        try {
          src = await fetchAndCacheClip(config.id, boardId);
        } catch {
          src = getClipAudioUrl(config.id);
        }
      } else {
        src = getClipAudioUrl(config.id);
      }

      await getAudioManager().play({ ...config, src });
    },
    [boardId]
  );

  const stop = useCallback((clipId: string) => {
    getAudioManager().stop(clipId);
  }, []);

  const stopAll = useCallback(() => {
    getAudioManager().stopAll();
  }, []);

  const isPlaying = useCallback((clipId: string) => getAudioManager().isPlaying(clipId), []);

  return { play, stop, stopAll, isPlaying, playingIds, unlocked, unlock };
}
