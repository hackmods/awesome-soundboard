"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { cn } from "@/lib/utils";

export function WaveformPreview({
  clipId,
  className,
  height = 32,
}: {
  clipId: string;
  className?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: "hsl(262 83% 58% / 0.4)",
      progressColor: "hsl(262 83% 58%)",
      cursorWidth: 0,
      interact: false,
      barWidth: 2,
      barGap: 1,
      normalize: true,
    });

    ws.load(`/api/clips/${clipId}/audio`);
    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [clipId, height]);

  return <div ref={containerRef} className={cn("w-full overflow-hidden rounded", className)} />;
}
