"use client";

import dynamic from "next/dynamic";
import { GameErrorBoundary } from "@/components/game/GameErrorBoundary";

/* The game is a full client-side canvas experience (localStorage, window,
   WebGL-free 2D canvas, keyboard/mouse/touch) — load it browser-only. */
const GameShell = dynamic(() => import("@/components/game/GameShell"), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

/* GitHub Pages base path (set by the deploy workflow) — same expression the
   game modules use, kept local so the skeleton stays dependency-free. */
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function LoadingSkeleton() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#0b0716" }}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        {/* V1.1 — the rift-gate sigil (public/logo.svg, the brand mark
            every favicon/banner derives from) with a soft ember glow. */}
        <img
          src={`${ASSET_BASE}/logo.svg`}
          alt=""
          aria-hidden
          width={72}
          height={72}
          draggable={false}
          style={{
            margin: "0 auto",
            filter: "drop-shadow(0 0 22px rgba(245,201,107,0.45))",
            animation: "sigil-breathe 2.4s ease-in-out infinite",
          }}
        />
        <div
          className="font-display font-black text-[clamp(36px,9vw,72px)] tracking-[0.14em]"
          style={{ color: "#f5e3b3", textShadow: "0 0 34px rgba(245,201,107,0.5)" }}
        >
          ARCHMAGE
        </div>
        <div className="mt-3 text-[12px] font-bold uppercase tracking-[0.34em] text-[#9a7bff]">
          Opening the rift…
        </div>
        <div className="mt-5 mx-auto h-[3px] w-[180px] max-w-[60vw] bg-[rgba(154,123,255,0.18)] overflow-hidden">
          <div
            className="h-full"
            style={{
              width: "40%",
              background: "linear-gradient(90deg, transparent, #f5c96b, transparent)",
              animation: "shimmer 1.3s ease-in-out infinite",
            }}
          />
        </div>
        <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}@keyframes sigil-breathe{0%,100%{opacity:.72;transform:scale(.97)}50%{opacity:1;transform:scale(1.03)}}`}</style>
        <noscript>
          <p className="mt-5 text-[12px] text-[#ff8ba0]">
            JavaScript is required to enter the rift.
          </p>
        </noscript>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <GameErrorBoundary>
      <GameShell />
    </GameErrorBoundary>
  );
}
