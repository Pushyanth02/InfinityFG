"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArchmageEngine, HudData } from "@/game/engine";
import { SLOT_KEYS, SPELLS, STARTER_SPELLS, ElementId, COMBOS, comboKey } from "@/game/content";
import { SpellIcon, UiIcon } from "./icons";

/* ============================================================================
   TouchControls — V1.1 "True Direction" thumb-zone layout.
   ----------------------------------------------------------------------------
   MOVEMENT FIX (the "locked to one direction" bug):
   The old stick measured the finger against the DOCKED housing at the screen's
   bottom-left corner. Any touch far from that corner clamped its X axis to ±1
   (per-axis clamp bug in the initial lean), and the follow-drag then preserved
   that quantized direction — so touching the middle of the screen pinned the
   mage to a single direction no matter how the finger moved. The stick now
   spawns WHERE YOU TOUCH (floating origin, the industry-standard pattern):
   direction is always finger-relative-to-touch-point with a true radial
   clamp, giving 1:1 analog control in all 360° from any contact point.
   Players who prefer the corner-docked stick can restore it in Settings.

   LAYOUT (V1.1):
   - MOVE joystick: floating origin; docked housing at bottom-left is the
     resting affordance and springs home on release.
   - ATTACK ARC (bottom-right) — one compact thumb grid, three rows:
       DASH  (spans, right-aligned — middle-right, above Weave)
       VOLLEY (left)  SURGE (right — the Weave button)
       SPELL (left)   FIRE  (right, at the thumb home)
   - UTILITY ROW (top-right): compact ARCHMAGE + PAUSE.
   - Spell strip: bottom-center quick-select.

   CUSTOMIZABLE UI (Settings → Touch controls):
   - touchScale   75–140% — every control's size, via the --tc-scale var
   - touchOpacity 40–100% — the whole layer, via --tc-opacity
   - stickMode    floating (default) | docked — the movement model
   - handSide     right (default) | left — mirrors the thumb zones

   ARCHMAGE MODE: the autopilot takes over movement, targeting, spell choice,
   dodges, weave bolts and surge. Touching a stick mid-auto pauses the pilot
   (human wins). All touches use `touch-action: none` to prevent hijack. */

interface Props {
  engineRef: React.MutableRefObject<ArchmageEngine | null>;
  paused: boolean;
  /** Weave fraction 0..1 from HUD tick so we can gate the surge button. */
  weaveRef: React.MutableRefObject<number>;
  surgeActiveRef: React.MutableRefObject<boolean>;
  onSelectSlot: (i: number) => void;
  onDash: () => void;
  onSurge: () => void;
  onPause: () => void;
  /** Patch 8.0 — Archmage Mode (autopilot) toggle + current state. */
  autoMode: boolean;
  onToggleAuto: () => void;
  /** Patch 4.0: the currently-equipped spell IDs (dynamic length). */
  equippedIds: (ElementId | { merged: ElementId[] } | null)[];
  /** Patch 9.0 — live selected slot index (drives the SPELL button icon). */
  selectedSlot: number;
  /** Patch 11.0 — live HUD mirror (drives the strip's cooldown + mana
      indicators and the dash-cooldown ring at a calm 10 Hz, ref-polled so
      the 30 Hz HUD path never re-renders this tree). */
  hudRef: React.MutableRefObject<HudData | null>;
  /** V1.1 — customizable UI (Settings → Touch controls), all live. */
  tcScale: number;                 // 0.75..1.4 size multiplier
  tcOpacity: number;               // 0.4..1 layer opacity
  stickMode: "floating" | "docked"; // movement origin model
  handSide: "right" | "left";      // mirror the thumb zones
}

interface StickState {
  /** touch identifier (so we can track across move/end) */
  id: number;
  /** current origin center in shell coordinates (floating: the anchored
      contact point; docked: the housing center, sliding with follow-drag) */
  ox: number; oy: number;
  /** movement model captured at gesture start (floating | docked) */
  mode: "floating" | "docked";
  /** live ring radius (px) — derived from the rendered housing size so the
      control scale setting + responsive bands stay in sync with the math */
  ring: number;
  /** live housing size (px) for the draw pass */
  housing: number;
}

interface StickDraw {
  /** housing top-left (px) while active */
  x: number; y: number;
  /** knob offset from housing center (px, clamped to the ring) */
  kx: number; ky: number;
}

const HOUSING_BASE = 128;    // CSS size of the stick housing at scale 1
const RING_RATIO = 46 / 128; // knob travel as a fraction of the housing
const DEAD_ZONE = 0.14;      // ignore tiny stick movements (fraction of ring)

function clampLen(x: number, y: number, max: number): { x: number; y: number; mag: number } {
  const len = Math.hypot(x, y);
  if (len < 1e-4) return { x: 0, y: 0, mag: 0 };
  const m = Math.min(max, len);
  const s = m / len;
  return { x: x * s, y: y * s, mag: m / max };
}

export function TouchControls({
  engineRef, paused, weaveRef, surgeActiveRef,
  onSelectSlot, onDash, onSurge, onPause, onToggleAuto, autoMode,
  equippedIds = STARTER_SPELLS as ElementId[],
  selectedSlot = 0,
  hudRef,
  tcScale = 1,
  tcOpacity = 1,
  stickMode = "floating",
  handSide = "right",
}: Props) {
  const moveStick = useRef<StickState | null>(null);
  const moveHomeRef = useRef<HTMLDivElement | null>(null);
  const [moveDraw, setMoveDraw] = useState<StickDraw | null>(null);
  /* Patch 9.0 — fire button hold state (visual feedback while auto-firing) */
  const [firing, setFiring] = useState(false);
  /* V1.1 — volley hold state (visual feedback while bolts stream) */
  const [volleying, setVolleying] = useState(false);
  /* local weave/surge mirror — written by a 10Hz poll effect that reads the
     parent's refs. Keeping these as state (not ref reads in render) lets the
     surge button reflect readiness without violating react-hooks/refs. */
  const [weaveLocal, setWeaveLocal] = useState(0);
  const [surgeLocal, setSurgeLocal] = useState(false);
  /* Patch 11.0 — per-slot cooldown veils + mana badges (the spell togglers)
     and the dash cooldown veil. Refs only: the 10 Hz poll below writes them
     directly, so the indicator updates cost zero React renders. */
  const stripCds = useRef<(HTMLDivElement | null)[]>([]);
  const stripCosts = useRef<(HTMLSpanElement | null)[]>([]);
  const stripRoots = useRef<(HTMLButtonElement | null)[]>([]);
  const dashCdFill = useRef<HTMLDivElement | null>(null);
  const spellBtnCd = useRef<HTMLDivElement | null>(null);
  const volleyRoot = useRef<HTMLButtonElement | null>(null);

  /* live geometry: the actual rendered housing size (respects the control
     scale setting + every responsive band) — read fresh on each gesture */
  const housingSize = useCallback((): { housing: number; ring: number } => {
    const el = moveHomeRef.current;
    const w = el ? el.getBoundingClientRect().width : HOUSING_BASE * tcScale;
    const housing = Math.max(64, w);
    return { housing, ring: housing * RING_RATIO };
  }, [tcScale]);

  /* ------------------------------ move stick ------------------------------ */
  const beginMove = useCallback((id: number, clientX: number, clientY: number) => {
    const { housing, ring } = housingSize();
    let ox: number, oy: number;
    if (stickMode === "docked" && moveHomeRef.current) {
      /* docked model — the corner housing IS the origin (legacy feel) */
      const r = moveHomeRef.current.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top + r.height / 2;
    } else {
      /* floating model — the origin is WHERE YOU TOUCHED. Direction is
         always finger-relative-to-contact: 1:1, all 360°, any screen area.
         Bias the origin inward so edge-touches keep their full ring. */
      ox = Math.max(ring * 0.55, Math.min(window.innerWidth - ring * 0.55, clientX));
      oy = Math.max(ring * 0.55, Math.min(window.innerHeight - ring * 0.55, clientY));
    }
    moveStick.current = { id, ox, oy, mode: stickMode, ring, housing };
    setMoveDraw({ x: ox - housing / 2, y: oy - housing / 2, kx: 0, ky: 0 });
    /* docked model only: treat the initial press as a drag from home so a
     tap far from the housing immediately leans the stick toward the finger.
     V1.1 FIX — radial clamp (direction-preserving); the old per-axis clamp
     quantized far touches into pinned diagonals (the "locked direction"). */
    if (stickMode === "docked") {
      const dx = clientX - ox, dy = clientY - oy;
      const c = clampLen(dx, dy, ring);
      if (c.mag > 0.05) engineRef.current?.setMoveAxis(c.x / ring, c.y / ring);
    } else {
      engineRef.current?.setMoveAxis(0, 0);
    }
  }, [engineRef, housingSize, stickMode]);

  const updateMove = useCallback((clientX: number, clientY: number) => {
    const s = moveStick.current;
    if (!s) return;
    let dx = clientX - s.ox, dy = clientY - s.oy;
    const len = Math.hypot(dx, dy);
    /* FLOATING: the origin is ANCHORED at the contact point — direction is
       a pure 1:1 map of finger-position-relative-to-touch with the knob
       clamped at the ring edge (console-stick feel). No origin chase: a
       moving reference would bleed the old direction into new ones (that
       was the "locked to one direction" failure mode).
       DOCKED: follow-drag keeps the legacy feel — beyond the ring the
       housing slides with the finger so the knob never feels stuck on
       long corner-anchored swipes. */
    if (s.mode === "docked" && len > s.ring) {
      const slide = len - s.ring;
      s.ox += (dx / len) * slide;
      s.oy += (dy / len) * slide;
      dx = (dx / len) * s.ring;
      dy = (dy / len) * s.ring;
    }
    const c = clampLen(dx, dy, s.ring);
    if (c.mag < DEAD_ZONE) engineRef.current?.setMoveAxis(0, 0);
    else engineRef.current?.setMoveAxis(c.x / s.ring, c.y / s.ring);
    setMoveDraw({ x: s.ox - s.housing / 2, y: s.oy - s.housing / 2, kx: c.x, ky: c.y });
  }, [engineRef]);

  const endMove = useCallback(() => {
    moveStick.current = null;
    /* homing phase: keep the housing at its home coords (px) so the CSS
       left/top transition springs it back; afterwards inline styles clear and
       the safe-area CSS anchor takes over again */
    const el = moveHomeRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const { housing } = housingSize();
      setMoveDraw({ x: r.left + r.width / 2 - housing / 2, y: r.top + r.height / 2 - housing / 2, kx: 0, ky: 0 });
    }
    window.setTimeout(() => { if (!moveStick.current) setMoveDraw(null); }, 300);
    engineRef.current?.setMoveAxis(0, 0);
  }, [engineRef, housingSize]);

  /* ---------------------------- touch routing ----------------------------- */
  /* A single onTouchStart/onTouchMove/onTouchEnd on the full-screen overlay.
     Every free touch drives the move stick — the whole play surface is
     movement territory. Buttons render above the zone (higher z-index) and
     are separate elements, so their touches never route here. */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (paused) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (!moveStick.current) beginMove(t.identifier, t.clientX, t.clientY);
    }
  }, [beginMove, paused]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (paused) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (moveStick.current && t.identifier === moveStick.current.id) {
        updateMove(t.clientX, t.clientY);
      }
    }
  }, [updateMove, paused]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (moveStick.current && t.identifier === moveStick.current.id) endMove();
    }
  }, [endMove]);

  /* ------------------------- FIRE / SPELL buttons ------------------------- */
  /* FIRE: hold to auto-target + auto-cast. Release stops. pointerdown/up +
     pointerleave/cancel so a thumb sliding off never latches the fire. */
  const fireDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (paused) return;
    setFiring(true);
    engineRef.current?.setFireHeld(true);
  }, [engineRef, paused]);

  const fireUp = useCallback(() => {
    setFiring(false);
    engineRef.current?.setFireHeld(false);
  }, [engineRef]);

  /* V1.1 — VOLLEY: hold to stream arcane weave bolts at the nearest foe
     (the right-mouse-button action). Release stops. Same hold semantics as
     FIRE so a sliding thumb never latches it. */
  const volleyDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (paused) return;
    setVolleying(true);
    engineRef.current?.setVolleyHeld(true);
  }, [engineRef, paused]);

  const volleyUp = useCallback(() => {
    setVolleying(false);
    engineRef.current?.setVolleyHeld(false);
  }, [engineRef]);

  /* SPELL: one tap cycles to the next non-empty slot. */
  const cycleSpell = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (paused) return;
    engineRef.current?.cycleSlot();
  }, [engineRef, paused]);

  /* HUD mirror poll — copy the parent's refs into local state at ~10Hz so
     the surge button can light up when the weave meter is full.
     Patch 11.0 — the same poll also drives the spell togglers' cooldown
     veils + mana badges and the dash cooldown ring straight through refs
     (no re-renders; the buttons themselves stay static React nodes).
     V1.1 — it also dims the VOLLEY button when aether can't afford bolts. */
  useEffect(() => {
    const id = window.setInterval(() => {
      setWeaveLocal(weaveRef.current);
      setSurgeLocal(surgeActiveRef.current);
      const h = hudRef.current;
      if (!h) return;
      for (let i = 0; i < h.spells.length; i++) {
        const sp = h.spells[i];
        const veil = stripCds.current[i];
        if (veil) {
          veil.style.height = `${Math.min(1, sp.cdFrac) * 100}%`;
          veil.style.opacity = sp.cdFrac > 0.01 ? "1" : "0";
        }
        const cost = stripCosts.current[i];
        if (cost) {
          if (sp.empty) {
            cost.textContent = "—";
            cost.style.color = "#6a5a99";
          } else {
            cost.textContent = String(sp.cost);
            cost.style.color = sp.cost === 0 ? "#6bf0c2" : sp.affordable ? "#9fd8ff" : "#ff8ba0";
          }
        }
        const root = stripRoots.current[i];
        if (root) {
          root.style.opacity = sp.empty ? "0.5" : sp.affordable || sp.cdFrac > 0 ? "1" : "0.55";
        }
      }
      /* the SPELL cycle button shares the selected slot's cooldown veil */
      if (spellBtnCd.current) {
        const sel = h.spells[h.selected];
        if (sel) {
          spellBtnCd.current.style.height = `${Math.min(1, sel.cdFrac) * 100}%`;
          spellBtnCd.current.style.opacity = sel.cdFrac > 0.01 ? "1" : "0";
        }
      }
      /* dash cooldown veil */
      if (dashCdFill.current) {
        dashCdFill.current.style.height = `${Math.min(1, h.dashFrac) * 100}%`;
        dashCdFill.current.style.opacity = h.dashFrac > 0.01 ? "1" : "0";
      }
      /* volley affordability (bolts cost 3 aether; free during a surge) */
      if (volleyRoot.current) {
        const afford = h.surge !== null || h.mana >= 3;
        volleyRoot.current.style.opacity = afford ? "" : "0.55";
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [weaveRef, surgeActiveRef, hudRef]);

  /* Patch 9.0 — unmount safety: if the engine pauses (or the run ends) while
     FIRE/VOLLEY is held, this layer unmounts WITHOUT a pointerup — release
     every held input here so the mage doesn't resume mid-autofire. */
  useEffect(() => () => {
    engineRef.current?.setFireHeld(false);
    engineRef.current?.setVolleyHeld(false);
    engineRef.current?.setMoveAxis(0, 0);
  }, [engineRef]);

  const surgeReady = weaveLocal >= 1 && !surgeLocal;

  const stickStyle = (d: StickDraw | null): React.CSSProperties | undefined =>
    d ? { left: d.x, top: d.y } : undefined;

  const knobStyle = (d: StickDraw | null): React.CSSProperties | undefined =>
    d ? { transform: `translate(${d.kx}px, ${d.ky}px)` } : undefined;

  /* the SPELL button shows the live selected spell (merged slots stack) */
  const selEntry = equippedIds[selectedSlot] ?? null;

  return (
    <div
      className={`touch-layer${handSide === "left" ? " tc-left" : ""}`}
      style={{ "--tc-scale": tcScale, "--tc-opacity": tcOpacity } as React.CSSProperties}
    >
      {/* full-screen touch surface — every free touch drives the move stick.
          pointer-events auto, but buttons above it stop propagation. */}
      <div
        className="touch-zone"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        aria-hidden="true"
      />

      {/* ---- movement joystick — docked housing is the resting affordance;
               while active the housing tracks the live origin (floating:
               wherever you touched; docked: the corner, sliding with drags)
               and springs home on release. ---- */}
      <div
        ref={moveHomeRef}
        className={`stick-home move${moveDraw ? " is-active" : ""}${autoMode ? " is-auto" : ""}`}
        style={stickStyle(moveDraw)}
        aria-hidden="true"
      >
        <span className="stick-label">MOVE</span>
        <div className="stick-inner" style={knobStyle(moveDraw)} />
      </div>

      {/* ---- attack zone (bottom-right) — V1.1 three-row thumb grid:
               DASH spans the top (right-aligned — middle-right, above Weave),
               VOLLEY sits beside SURGE (the Weave button) above SPELL/FIRE,
               FIRE at the thumb home. One compact arc with guaranteed
               clearance from the top-right utility row. ---- */}
      <div className="attack-cluster">
        <button
          type="button"
          className="touch-btn dash atk-dash touch-btn-cd"
          onPointerDown={(e) => { e.preventDefault(); onDash(); }}
          aria-label="Blink step"
        >
          <UiIcon name="bolt" size={22} />
          <span className="touch-btn-label">DASH</span>
          <div ref={dashCdFill} className="cd-veil" style={{ height: "0%", opacity: "0" }} aria-hidden />
          <span className="cd-ready" aria-hidden />
        </button>

        <button
          type="button"
          className={`touch-btn volley${volleying ? " firing" : ""}${autoMode ? " is-auto" : ""}`}
          ref={volleyRoot}
          onPointerDown={volleyDown}
          onPointerUp={volleyUp}
          onPointerLeave={volleyUp}
          onPointerCancel={volleyUp}
          aria-label="Arcane volley — hold to loose bolts at the nearest foe"
          aria-pressed={volleying}
        >
          <UiIcon name="wave" size={24} />
          <span className="touch-btn-label">VOLLEY</span>
        </button>

        <button
          type="button"
          className={`touch-btn surge atk-surge${autoMode ? " is-auto" : ""}`}
          data-ready={surgeReady ? "1" : "0"}
          onPointerDown={(e) => { e.preventDefault(); if (surgeReady) onSurge(); }}
          disabled={!surgeReady}
          aria-label="Weave surge"
          aria-disabled={!surgeReady}
        >
          <UiIcon name="gem" size={20} />
          <span className="touch-btn-label">
            {surgeReady ? "SURGE" : `${Math.round(weaveLocal * 100)}%`}
          </span>
        </button>

        <button
          type="button"
          className={`touch-btn spell-btn touch-btn-cd${autoMode ? " is-auto" : ""}`}
          onPointerDown={cycleSpell}
          aria-label="Cycle spell"
        >
          {selEntry === null ? (
            <UiIcon name="hourglass" size={22} />
          ) : typeof selEntry !== "string" ? (
            <span className="flex items-center">
              <span style={{ color: SPELLS[selEntry.merged[0]].color }}><SpellIcon id={selEntry.merged[0]} size={20} /></span>
              <span className="ml-[-4px]" style={{ color: SPELLS[selEntry.merged[1]].color }}><SpellIcon id={selEntry.merged[1]} size={20} /></span>
            </span>
          ) : (
            <span style={{ color: SPELLS[selEntry].color }}><SpellIcon id={selEntry} size={24} /></span>
          )}
          <span className="touch-btn-label">SPELL</span>
          <div ref={spellBtnCd} className="cd-veil" style={{ height: "0%", opacity: "0" }} aria-hidden />
        </button>

        <button
          type="button"
          className={`touch-btn fire-btn${firing ? " firing" : ""}${autoMode ? " is-auto" : ""}`}
          onPointerDown={fireDown}
          onPointerUp={fireUp}
          onPointerLeave={fireUp}
          onPointerCancel={fireUp}
          aria-label="Fire — hold to attack the nearest foe"
          aria-pressed={firing}
        >
          <UiIcon name="target" size={30} />
          <span className="touch-btn-label">FIRE</span>
        </button>
      </div>

      {/* utility row — top-right, BELOW the shards HUD: ARCHMAGE · PAUSE.
          Patch 11.0 — the in-game FULLSCREEN button is REMOVED (the
          landing-page enforcer owns fullscreen on every device; ENTER THE
          RIFT still auto-requests it on touch as the fallback gesture).
          Compact horizontal buttons: nothing up here ever collides with the
          attack zone below. */}
      <div className="touch-actions">
        <button
          type="button"
          className={`touch-btn sm archmage${autoMode ? " on" : ""}`}
          onPointerDown={(e) => { e.preventDefault(); onToggleAuto(); }}
          aria-label="Archmage mode — the rift plays itself"
          aria-pressed={autoMode}
        >
          <UiIcon name="rings" size={19} />
          <span className="touch-btn-label">{autoMode ? "AUTO" : "MAGE"}</span>
        </button>

        <button
          type="button"
          className="touch-btn sm pause"
          onPointerDown={(e) => { e.preventDefault(); onPause(); }}
          aria-label="Pause"
        >
          <UiIcon name="pause" size={19} />
          <span className="touch-btn-label">PAUSE</span>
        </button>
      </div>

      {/* compact spell-selector strip — direct slot selection. Sits at the
          bottom-center on touch devices above the system home-indicator. */}
      <div className="touch-spell-strip" role="tablist" aria-label="Spells">
        {equippedIds.map((entry, i) => {
          const selected = i === selectedSlot;
          if (entry === null) {
            return (
              <button
                key={i}
                type="button"
                role="tab"
                disabled
                ref={(el) => { stripRoots.current[i] = el; }}
                className="touch-spell touch-spell-cd opacity-50"
                title="Empty slot — pick up a spell drop to refill"
                aria-label="Empty slot"
              >
                <span className="text-[#6a5a99]">
                  <UiIcon name="hourglass" size={20} />
                </span>
                <span className="touch-spell-key">{SLOT_KEYS[i]}</span>
                <span ref={(el) => { stripCosts.current[i] = el; }} className="touch-spell-cost">—</span>
                <div ref={(el) => { stripCds.current[i] = el; }} className="cd-veil" style={{ height: "0%", opacity: "0" }} aria-hidden />
              </button>
            );
          }
          if (typeof entry !== "string") {
            const ids = entry.merged;
            const a = SPELLS[ids[0]], b = SPELLS[ids[1]];
            const mergeName = COMBOS[comboKey(ids[0], ids[1])]?.name ?? `${a.name}+${b.name}`;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                ref={(el) => { stripRoots.current[i] = el; }}
                onPointerDown={(e) => { e.preventDefault(); onSelectSlot(i); }}
                className={`touch-spell touch-spell-cd${selected ? " is-selected" : ""}`}
                title={`Merged: ${a.name} + ${b.name} — casts both in succession`}
                aria-label={mergeName}
              >
                <span className="flex items-center">
                  <span style={{ color: a.color }}><SpellIcon id={ids[0]} size={20} /></span>
                  <span className="ml-[-4px]" style={{ color: b.color }}><SpellIcon id={ids[1]} size={20} /></span>
                </span>
                <span className="touch-spell-key text-[#ffe9ad]">{SLOT_KEYS[i]}</span>
                <span ref={(el) => { stripCosts.current[i] = el; }} className="touch-spell-cost touch-spell-cost-merged" />
                <div ref={(el) => { stripCds.current[i] = el; }} className="cd-veil" style={{ height: "0%", opacity: "0" }} aria-hidden />
              </button>
            );
          }
          const def = SPELLS[entry];
          return (
            <button
              key={i}
              type="button"
              role="tab"
              ref={(el) => { stripRoots.current[i] = el; }}
              onPointerDown={(e) => { e.preventDefault(); onSelectSlot(i); }}
              className={`touch-spell touch-spell-cd${selected ? " is-selected" : ""}`}
              title={`${def.name} — ${def.desc}`}
              aria-label={`${def.name} — ${def.manaCost} aether`}
            >
              <span style={{ color: def.color }}>
                <SpellIcon id={entry} size={22} />
              </span>
              <span className="touch-spell-key">{SLOT_KEYS[i]}</span>
              <span ref={(el) => { stripCosts.current[i] = el; }} className="touch-spell-cost">{def.manaCost}</span>
              <div ref={(el) => { stripCds.current[i] = el; }} className="cd-veil" style={{ height: "0%", opacity: "0" }} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
