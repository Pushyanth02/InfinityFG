"use client";

import dynamic from "next/dynamic";
import { GameErrorBoundary } from "@/components/game/GameErrorBoundary";

/* The game is a full client-side canvas experience (localStorage, window,
   WebGL-free 2D canvas, keyboard/mouse/touch) — load it browser-only. */
const GameShell = dynamic(() => import("@/components/game/GameShell"), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

function LoadingSkeleton() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#0b0716" }}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
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
        <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}`}</style>
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
