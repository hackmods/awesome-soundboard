"use client";

import { useEffect, useCallback } from "react";

export function useHotkeys(
  bindings: Record<string, () => void>,
  enabled = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handler = bindings[key] ?? bindings[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [bindings, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
