"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the primary input is touch-based (mobile phones, tablets,
 * and touch-capable laptops where the user is actually using touch).
 *
 * Uses two signals combined:
 *   1. `(pointer: coarse)` media query — the OS thinks the primary pointer is non-precise.
 *   2. `ontouchstart in window` AND a small max-width ceiling — narrower viewport
 *      with touch support is almost certainly a phone/tablet held in hand.
 *
 * The result re-evaluates on viewport resize so a window flipped between
 * portrait/landscape or docked/undocked stays correct. We also listen for
 * `pointermediaquery` change events for cross-device transitions.
 *
 * Returns `false` during SSR so the desktop layout renders first
 * (avoiding hydration mismatches); the hook re-syncs on mount.
 */
export function useIsTouchDevice(): boolean {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(pointer: coarse)") ?? null;

    const compute = () => {
      /* Patch 8.0: read every signal LIVE (not captured at mount) so the
         layer follows real device transitions — a touch laptop docking to
         a big monitor, a phone rotating, a tablet gaining a mouse. The old
         closure-captured values froze the verdict until a full reload. */
      const coarse = mql?.matches ?? false;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const narrow = window.innerWidth <= 1024;
      // Show touch controls if: coarse pointer, OR (touch + narrow viewport)
      setTouch(coarse || (hasTouch && narrow));
    };
    compute();

    const onMq = () => compute();
    mql?.addEventListener?.("change", onMq);
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    const onOrient = () => compute();
    window.addEventListener("orientationchange", onOrient);

    return () => {
      mql?.removeEventListener?.("change", onMq);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, []);

  return touch;
}

/**
 * Patch 9.0 — Forced landscape: tracks whether a TOUCH device is currently
 * held in PORTRAIT. GameShell renders the "Rotate Your Screen" guard while
 * true (and auto-pauses a live run so the mage never dies mid-rotation).
 * Re-evaluates live on resize/orientationchange, exactly like useIsTouchDevice.
 */
export function useIsPortraitTouch(): boolean {
  const [portraitTouch, setPortraitTouch] = useState(false);

  useEffect(() => {
    const compute = () => {
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isTouch = coarse || hasTouch;
      setPortraitTouch(isTouch && window.innerHeight > window.innerWidth * 1.02);
    };
    compute();

    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return portraitTouch;
}

