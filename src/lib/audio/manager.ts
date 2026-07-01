export type ClipPlaybackConfig = {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
};

type HowlerModule = typeof import("howler");
type HowlInstance = InstanceType<HowlerModule["Howl"]>;

type PlayState = {
  howl: HowlInstance;
  clipId: string;
};

class AudioManager {
  private active = new Map<string, PlayState>();
  private unlocked = false;
  private listeners = new Set<() => void>();
  private howlerPromise: Promise<HowlerModule> | null = null;
  private playingIdsSnapshot: string[] = [];

  private loadHowler() {
    if (!this.howlerPromise) {
      this.howlerPromise = import("howler");
    }
    return this.howlerPromise;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async unlock() {
    if (this.unlocked) return;
    const { Howler } = await this.loadHowler();
    if (Howler.ctx && Howler.ctx.state === "suspended") {
      await Howler.ctx.resume();
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
    const ids = Array.from(this.active.entries())
      .filter(([, s]) => s.howl.playing())
      .map(([id]) => id);

    if (
      ids.length === this.playingIdsSnapshot.length &&
      ids.every((id, index) => id === this.playingIdsSnapshot[index])
    ) {
      return this.playingIdsSnapshot;
    }

    this.playingIdsSnapshot = ids;
    return this.playingIdsSnapshot;
  }

  async play(config: ClipPlaybackConfig): Promise<void> {
    await this.unlock();
    const { Howl } = await this.loadHowler();

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

let audioManager: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManager) {
    audioManager = new AudioManager();
  }
  return audioManager;
}

export function getClipAudioUrl(clipId: string): string {
  return `/api/clips/${clipId}/audio`;
}

export function resetAudioManagerForTests() {
  audioManager = null;
}
