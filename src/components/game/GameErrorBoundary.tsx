"use client";

import { Component, ReactNode } from "react";

/**
 * GameErrorBoundary — graceful fallback if the engine or any game component
 * throws during render or in a lifecycle method. Without this, an exception
 * inside the canvas engine would blank the whole `/` route and the player
 * would lose their meta-progression context.
 *
 * The fallback offers a one-tap "restart the trial" reload that bypasses
 * the broken React subtree entirely.
 */
interface Props { children: ReactNode }
interface State { error: Error | null }

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    /* visible in the browser dev console — keep stderr tidy but discoverable */
    console.error("[ArchMage] runtime error caught:", error, info.componentStack);
  }

  reload = () => {
    this.setState({ error: null });
    /* a hard reload is the safest recovery: the engine teardown may have
       left half-registered listeners; reload guarantees a clean slate. */
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: "#0b0716" }}>
        <div className="rune-panel rune-frame max-w-md w-full p-8 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.38em] text-[#ff4d6b]">
            The rift collapsed
          </div>
          <h2 className="font-display text-3xl font-black text-[#ffb3c0] tracking-wide mt-2"
              style={{ textShadow: "0 0 30px rgba(255,77,107,0.45)" }}>
            DIMENSIONAL FAULT
          </h2>
          <p className="text-sm text-[#b9aee0] italic mt-3">
            A weave unravelled unexpectedly. Your ledger is safe — return to the gate and try again.
          </p>
          <pre className="mt-4 text-left text-[11px] text-[#6a5a99] bg-[rgba(8,5,16,0.6)] p-3 overflow-auto max-h-32">
{this.state.error.message || String(this.state.error)}
          </pre>
          <button onClick={this.reload} className="btn-gold mt-5 px-8 py-3 inline-flex items-center gap-2">
            <span className="font-display">Reload the Rift</span>
          </button>
        </div>
      </div>
    );
  }
}
