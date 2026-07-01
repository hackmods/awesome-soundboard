import { Howl } from "howler";

export type ClipPlaybackConfig = {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
};

type PlayState = {
  howl: Howl;
  clipId: string;
};

class AudioManager {
  private active = new Map<string, PlayState>();
  private unlocked = false;
  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  unlock() {
    if (this.unlocked) return;
    if (Howler.ctx && Howler.ctx.state === "suspended") {
      Howler.ctx.resume();
    }
    this.unlocked = true;
    this.notify();
  }

  isUnlocked() {
    return this.unlocked;
  }

  isPlaying(clipId: string) {
    const state = this.active.get(clipId);
    return state?.howl.playing() ?? false;
  }

  getPlayingIds(): string[] {
    return Array.from(this.active.entries())
      .filter(([, s]) => s.howl.playing())
      .map(([id]) => id);
  }

  async play(config: ClipPlaybackConfig): Promise<void> {
    this.unlock();

    const existing = this.active.get(config.id);
    if (existing?.howl.playing()) {
      existing.howl.stop();
      this.active.delete(config.id);
      this.notify();
      return;
    }

    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [config.src],
        volume: config.volume,
        loop: config.loop,
        html5: true,
        onend: () => {
          if (!config.loop) {
            this.active.delete(config.id);
            this.notify();
          }
        },
        onplay: () => {
          this.active.set(config.id, { howl, clipId: config.id });
          this.notify();
          resolve();
        },
        onloaderror: (_id, err) => reject(new Error(String(err))),
        onplayerror: (_id, err) => reject(new Error(String(err))),
      });

      howl.play();
    });
  }

  stop(clipId: string) {
    const state = this.active.get(clipId);
    if (state) {
      state.howl.stop();
      this.active.delete(clipId);
      this.notify();
    }
  }

  stopAll() {
    this.active.forEach((state) => state.howl.stop());
    this.active.clear();
    this.notify();
  }
}

export const audioManager = typeof window !== "undefined" ? new AudioManager() : (null as unknown as AudioManager);

export function getClipAudioUrl(clipId: string): string {
  return `/api/clips/${clipId}/audio`;
}
