"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { audioManager, getClipAudioUrl, type ClipPlaybackConfig } from "@/lib/audio/manager";
import { fetchAndCacheClip } from "@/lib/sync/cache";

export function useAudioPlayer(boardId: string) {
  const playingIds = useSyncExternalStore(
    (cb) => audioManager.subscribe(cb),
    () => audioManager.getPlayingIds(),
    () => [] as string[]
  );

  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(audioManager.isUnlocked());
    return audioManager.subscribe(() => setUnlocked(audioManager.isUnlocked()));
  }, []);

  const unlock = useCallback(() => {
    audioManager.unlock();
    setUnlocked(true);
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

      await audioManager.play({ ...config, src });
    },
    [boardId]
  );

  const stop = useCallback((clipId: string) => {
    audioManager.stop(clipId);
  }, []);

  const stopAll = useCallback(() => {
    audioManager.stopAll();
  }, []);

  const isPlaying = useCallback((clipId: string) => audioManager.isPlaying(clipId), []);

  return { play, stop, stopAll, isPlaying, playingIds, unlocked, unlock };
}
