"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/* ============================================================================
   useFullscreen — Patch 10.1 "forced" fullscreen mechanism for mobile.
   ----------------------------------------------------------------------------
   Phones and tablets play Archmage best edge-to-edge: the HUD anchors to the
   real screen corners (safe-area insets), the touch layer owns the whole
   surface, and browser chrome (URL bar on Android, tab strip on iPad) steals
   precious landscape height. This hook wraps the Fullscreen API behind one
   graceful, vendor-prefixed surface:

     • requestMobileFullscreen() — called on ENTER THE RIFT / RISE AGAIN taps
       (a user gesture is REQUIRED by the API). Touch devices only; desktops
       keep their windowed layout. iPhone Safari (no element fullscreen)
       silently no-ops — the game is fully playable windowed.
     • toggle() — the FULL button in the touch action row, any device class.
     • isFullscreen — live state via fullscreenchange (+ webkit) events.

   Failures (denied permission, unsupported, already transitioning) resolve
   quietly — fullscreen is an enhancement, never a gate.
   ============================================================================ */

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  fullscreenEnabled?: boolean;
  webkitFullscreenEnabled?: boolean;
};

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function fsElement(): Element | null {
  const d = document as FsDoc;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function fsSupported(): boolean {
  const d = document as FsDoc;
  const el = document.documentElement as FsEl;
  return typeof el.requestFullscreen === "function"
    || typeof el.webkitRequestFullscreen === "function"
    || !!(d.fullscreenEnabled ?? d.webkitFullscreenEnabled);
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!fsElement());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as EventListener);
    };
  }, []);

  /** Enter fullscreen. Resolves true when the request was issued. */
  const request = useCallback(async (): Promise<boolean> => {
    if (typeof document === "undefined" || fsElement()) return false;
    const el = document.documentElement as FsEl;
    try {
      if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen({ navigationUI: "hide" });
        return true;
      }
      if (typeof el.webkitRequestFullscreen === "function") {
        /* iPad Safari prefix — no options argument */
        await el.webkitRequestFullscreen();
        return true;
      }
    } catch {
      /* permission denied / not a gesture / mid-transition — stay windowed */
    }
    return false;
  }, []);

  /** Patch 10.1 "forced" path: touch devices auto-enter fullscreen on run
      start (the tap IS the user gesture the API demands). */
  const requestMobileFullscreen = useCallback(async (isTouch: boolean): Promise<boolean> => {
    if (!isTouch || typeof document === "undefined" || !fsSupported()) return false;
    return request();
  }, [request]);

  /** Exit fullscreen (also used when abandoning to the menu on touch). */
  const exit = useCallback(async (): Promise<void> => {
    if (typeof document === "undefined" || !fsElement()) return;
    const d = document as FsDoc;
    try {
      if (typeof d.exitFullscreen === "function") await d.exitFullscreen();
      else if (typeof d.webkitExitFullscreen === "function") await d.webkitExitFullscreen();
    } catch { /* ignore */ }
  }, []);

  /** Toggle — the FULL button. */
  const toggle = useCallback((): void => {
    if (fsElement()) void exit();
    else void request();
  }, [exit, request]);

  return useMemo(
    () => ({ isFullscreen, supported: typeof document !== "undefined" && fsSupported(), request, requestMobileFullscreen, exit, toggle }),
    [isFullscreen, request, requestMobileFullscreen, exit, toggle],
  );
}
