"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EvolutionDef } from "@/game/evolutions";
import { BossDef, COMBOS, ElementId, SPELLS, comboKey } from "@/game/content";
import { sfx } from "@/game/store";
import { SpellIcon, UiIcon } from "./icons";

/* ============================================================================
   overlays.tsx — Patch 7.0 "The Pure Arcanum".
   ----------------------------------------------------------------------------
   The story layer is GONE: no Cutscene player, no DialogueBar, no portraits.
   What remains are the pure gameplay overlays — Evolution, SpellOffer
   (with Back to Game), Merge — plus the in-game BossTitleCard, which now
   renders a PROCEDURAL ANIMATED SIGIL (seeded SVG geometry in the boss's
   colors) instead of portrait art. Zero image assets in this file. */

/* ============================================================================
   BossSigil — procedural rune emblem, generated from the boss's id.
   ----------------------------------------------------------------------------
   Deterministic: the same boss always gets the same geometry (hash of the id
   seeds a tiny LCG). Rotating dashed rings + a polygon core + orbiting studs,
   all tinted with the boss's color. CSS animations rotate the rings; the
   whole thing costs a handful of SVG nodes. */

function seedFrom(s: string): () => number {
  let a = 2166136261;
  for (let i = 0; i < s.length; i++) {
    a ^= s.charCodeAt(i);
    a = Math.imul(a, 16777619);
  }
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function BossSigil({ boss, size = 120, animate = true }: { boss: BossDef; size?: number; animate?: boolean }) {
  const rnd = seedFrom(boss.id);
  const studs = Array.from({ length: 5 + Math.floor(rnd() * 4) }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + rnd() * 0.6;
    const r = 30 + rnd() * 8;
    return { x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r, s: 2 + rnd() * 2.5 };
  });
  const sides = 3 + Math.floor(rnd() * 4); // 3..6-gon core
  const rot = Math.floor(rnd() * 60) - 30;
  const corePts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const r = 22 + rnd() * 5;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  }).join(" ");
  const { color, glow } = boss;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={animate ? "sigil-anim" : undefined}
      aria-hidden
    >
      <defs>
        <radialGradient id={`sig-${boss.id}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.95" />
          <stop offset="55%" stopColor={color} stopOpacity="0.75" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </radialGradient>
      </defs>
      {/* rotating outer rune ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeOpacity="0.75" strokeWidth="1.4" strokeDasharray="10 7" className="sigil-spin" />
      {/* counter-rotating inner ring */}
      <circle cx="50" cy="50" r="37" fill="none" stroke={glow} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 9" className="sigil-spin-rev" />
      {/* soft aura */}
      <circle cx="50" cy="50" r="30" fill={`url(#sig-${boss.id})`} className="sigil-pulse" />
      {/* polygon core */}
      <polygon points={corePts} fill="none" stroke={glow} strokeWidth="1.6" transform={`rotate(${rot} 50 50)`} />
      <polygon points={corePts} fill={color} fillOpacity="0.16" stroke={color} strokeWidth="1" transform={`rotate(${rot} 50 50) scale(0.72)`} style={{ transformOrigin: "50px 50px" }} />
      {/* orbiting studs */}
      {studs.map((s, i) => (
        <rect key={i} x={s.x - s.s / 2} y={s.y - s.s / 2} width={s.s} height={s.s} fill={glow} transform={`rotate(45 ${s.x} ${s.y})`} />
      ))}
      {/* center eye */}
      <circle cx="50" cy="50" r="3.4" fill={glow} className="sigil-pulse" />
    </svg>
  );
}

/* ============================================================================
   BossTitleCard — in-game boss intro over LIVE combat (no cutscene).
   ----------------------------------------------------------------------------
   Procedural sigil + name + title + mechanics line + threat readout
   (HP / damage / speed gauges relative to the deadliest tyrant). Auto-fades
   after ~6s or on click; the fight never pauses. */

export interface BossIntroProps {
  boss: BossDef;
  actName: string;
  onDone: () => void;
}

/* Max stats across all bosses → normalize the threat gauges. */
const MAX_HP = 2600, MAX_DMG = 44, MAX_SPD = 65;

export function BossTitleCard({ boss, actName, onDone }: BossIntroProps) {
  const [visible, setVisible] = useState(false);
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVisible(false);
    window.setTimeout(onDone, 260);
  }, [onDone]);

  useEffect(() => {
    const t1 = window.setTimeout(() => setVisible(true), 60);
    const t2 = window.setTimeout(finish, 6000);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [finish]);

  const gauge = (label: string, v: number, max: number) => (
    <div className="boss-gauge" key={label}>
      <span className="boss-gauge-label">{label}</span>
      <span className="boss-gauge-track">
        <span className="boss-gauge-fill" style={{ width: `${Math.max(6, Math.round((v / max) * 100))}%` }} />
      </span>
    </div>
  );

  return (
    <div
      className={`boss-card ${visible ? "is-visible" : ""}`}
      role="status"
      aria-live="polite"
      onClick={finish}
      title="Click to dismiss"
    >
      <div className="boss-card-inner">
        <div className="boss-card-sigil-wrap" style={{ borderColor: boss.color + "88", boxShadow: `0 0 26px ${boss.color}55` }}>
          <BossSigil boss={boss} size={118} />
        </div>
        <div className="boss-card-body">
          <div className="boss-card-kicker" style={{ color: boss.color }}>
            {actName} · a tyrant approaches
          </div>
          <h2 className="boss-card-name font-display" style={{ color: boss.color, textShadow: `0 0 30px ${boss.color}66` }}>
            {boss.name.toUpperCase()}
          </h2>
          <div className="boss-card-title font-display">{boss.title}</div>
          <p className="boss-card-lore">{boss.mechanics}</p>
          <div className="boss-card-gauges">
            {gauge("HP", boss.hp, MAX_HP)}
            {gauge("DMG", boss.damage, MAX_DMG)}
            {gauge("SPD", boss.speed, MAX_SPD)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   EvolutionOverlay — spell transmutation choice (act clear / rift shrine). */

export function EvolutionOverlay({ choices, onPick }: { choices: EvolutionDef[]; onPick: (id: string) => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(6,4,14,0.72)" }}>
      <div className="text-center w-full max-w-3xl">
        <div className="anim-fade-up text-[11px] font-bold uppercase tracking-[0.38em] text-[#43e8d8]">The rift offers a transmutation</div>
        <h2 className="anim-fade-up font-display text-4xl md:text-5xl font-black text-[#f5e3b3] tracking-wide mt-1" style={{ textShadow: "0 0 30px rgba(245,201,107,0.35)" }}>
          REFORGE A SPELL
        </h2>
        <p className="anim-fade-up-1 text-sm text-[#b9aee0] italic mt-2">Choose one rune to forever change its nature — this trial only.</p>
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {choices.map((evo, i) => {
            const base = SPELLS[evo.base];
            return (
              <button key={evo.id} onClick={() => onPick(evo.id)} className={`boon-card evo-card p-5 text-left anim-fade-up-${i + 1}`}>
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 grid place-items-center border" style={{ color: base.color, borderColor: base.color + "55", background: base.color + "12" }}>
                    <SpellIcon id={evo.base} size={24} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffe9ad] flex items-center gap-1">
                    <UiIcon name="star" size={11} /> evolution
                  </span>
                </div>
                <div className="font-display font-bold text-lg text-[#f0e8ff] tracking-wide mt-3">{evo.name.toUpperCase()}</div>
                <div className="text-[11px] italic text-[#8f7bff]">{base.name} · {evo.tagline}</div>
                <div className="text-[13px] text-[#c9bdf0] mt-1.5 leading-snug">{evo.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SpellOfferOverlay — drop pickup (skip = Back to Game, Patch 6.0 rule kept).
   ----------------------------------------------------------------------------
   Shown when the player walks over a spell-drop glyph. Three random spells
   are offered (the dropped element is always the first card). The player
   picks which equipped slot (1/2/3) to replace — or skips via Back to Game. */

export interface SpellOfferState {
  pool: ElementId[];
  /** current equipped spells — one entry per slot. A slot can be a single
      spell (ElementId), a merged pair ({ merged: [...] }), or empty (null). */
  equipped: (ElementId | { merged: ElementId[] } | null)[];
}

/* Render the equipped slot content as an icon + label. Handles all three
   slot shapes (single / merged / empty). */
function EquippedSlotBadge({ entry, slot }: { entry: ElementId | { merged: ElementId[] } | null; slot: number }) {
  if (entry === null) {
    return (
      <div className="px-3 py-2 flex items-center gap-2 opacity-50" style={{ color: "#6a5a99" }}>
        <span className="text-[10px] font-black opacity-70">{slot + 1}</span>
        <span className="text-[12px] font-bold tracking-wide italic">empty</span>
      </div>
    );
  }
  if (typeof entry === "string") {
    const sp = SPELLS[entry];
    return (
      <>
        <span className="text-[10px] font-black opacity-70">{slot + 1}</span>
        <span style={{ color: sp.color }}><SpellIcon id={entry} size={18} /></span>
        <span className="text-[12px] font-bold tracking-wide" style={{ color: sp.color }}>{sp.name}</span>
      </>
    );
  }
  /* merged slot — stacked icons */
  const ids = entry.merged;
  const a = SPELLS[ids[0]], b = SPELLS[ids[1]];
  return (
    <>
      <span className="text-[10px] font-black opacity-70">{slot + 1}</span>
      <span className="relative inline-flex">
        <span style={{ color: a.color }}><SpellIcon id={ids[0]} size={18} /></span>
        <span className="ml-[-6px]" style={{ color: b.color }}><SpellIcon id={ids[1]} size={18} /></span>
      </span>
      <span className="text-[12px] font-bold tracking-wide" style={{ color: "#ffe9ad" }}>
        {COMBOS[comboKey(ids[0], ids[1])]?.name ?? `${a.name}+${b.name}`}
      </span>
    </>
  );
}

export interface SpellOfferOverlayProps {
  offer: SpellOfferState;
  onPick: (slot: number, spellId: ElementId) => void;
  onSkip: () => void;
}

export function SpellOfferOverlay({ offer, onPick, onSkip }: SpellOfferOverlayProps) {
  const [targetSlot, setTargetSlot] = useState(0);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(6,4,14,0.78)" }}>
      <div className="text-center w-full max-w-3xl max-h-full overflow-y-auto py-6">
        <div className="anim-fade-up text-[11px] font-bold uppercase tracking-[0.38em] text-[#7ed957]">A spell tear falls</div>
        <h2 className="anim-fade-up font-display text-4xl md:text-5xl font-black text-[#f5e3b3] tracking-wide mt-1" style={{ textShadow: "0 0 30px rgba(126,217,87,0.35)" }}>
          CLAIM A SPELL
        </h2>
        <p className="anim-fade-up-1 text-sm text-[#b9aee0] italic mt-2">
          +10% Vitality restored. Choose which slot to replace with your pick — or return to the fight as you are.
        </p>

        {/* slot picker — shows the player's current spells (single/merged/empty) */}
        <div className="anim-fade-up-1 mt-5 inline-flex flex-wrap justify-center gap-2 p-1.5 border border-[#2a1d4d] rounded-md" style={{ background: "rgba(13,9,25,0.6)" }}>
          {offer.equipped.map((entry, i) => {
            const active = i === targetSlot;
            const color = typeof entry === "string" ? SPELLS[entry].color : (entry === null ? "#6a5a99" : "#ffe9ad");
            return (
              <button
                key={i}
                onClick={() => setTargetSlot(i)}
                className={`px-3 py-2 flex items-center gap-2 rounded transition-all ${active ? "ring-2" : "opacity-70 hover:opacity-100"}`}
                style={active ? { background: color + "1f", color, boxShadow: `0 0 0 2px ${color}` } : { color }}
                title={`Replace slot ${i + 1}`}
              >
                <EquippedSlotBadge entry={entry} slot={i} />
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {offer.pool.map((id, i) => {
            const sp = SPELLS[id];
            const isDrop = i === 0;
            return (
              <button
                key={id + i}
                onClick={() => onPick(targetSlot, id)}
                className={`boon-card evo-card p-5 text-left anim-fade-up-${i + 1}`}
                style={isDrop ? { borderColor: sp.color + "aa" } : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 grid place-items-center border" style={{ color: sp.color, borderColor: sp.color + "55", background: sp.color + "12" }}>
                    <SpellIcon id={id} size={24} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1"
                        style={{ color: isDrop ? "#7ed957" : "#8f7bff" }}>
                    <UiIcon name={isDrop ? "star" : "fan"} size={11} /> {isDrop ? "the drop" : "offer"}
                  </span>
                </div>
                <div className="font-display font-bold text-lg text-[#f0e8ff] tracking-wide mt-3">{sp.name.toUpperCase()}</div>
                <div className="text-[11px] italic" style={{ color: sp.color }}>{sp.tagline}</div>
                <div className="text-[13px] text-[#c9bdf0] mt-1.5 leading-snug">{sp.desc}</div>
                <div className="mt-3 pt-2 border-t border-[#2a1d4d] text-[11px] font-bold uppercase tracking-[0.16em] text-[#6a5a99]">
                  {sp.manaCost} aether · {sp.cooldown.toFixed(2)}s cd
                </div>
              </button>
            );
          })}
        </div>
        <div className="anim-fade-up-2 mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onSkip}
            className="btn-ghost px-6 py-2.5 flex items-center gap-2 text-sm"
            title="Keep your current spells — the heal is already yours"
          >
            <UiIcon name="play" size={14} /> Back to Game
          </button>
          <p className="anim-fade-up-2 text-[11px] text-[#6a5a99] italic">
            Click any spell to bind it to slot {targetSlot + 1} — the heal is already yours either way.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MergeOverlay — merge-spell intermission (waves 9/19/29/39/49).
   ----------------------------------------------------------------------------
   The player picks two single-spell slots to fuse into one merged slot that
   casts both spells in succession. The other slot is emptied — drops can
   refill it later. The merged spell name comes from the COMBOS dictionary. */

export interface MergeOfferState {
  /** indices of single-spell slots eligible for the merge */
  slots: number[];
  /** snapshot of all equipped slots (one entry per slot, can be merged/empty) */
  equipped: (ElementId | { merged: ElementId[] } | null)[];
}

export function MergeOverlay({ offer, onMerge }: { offer: MergeOfferState; onMerge: (slotA: number, slotB: number) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (i: number) => {
    if (!offer.slots.includes(i)) return;
    setPicked((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= 2) return [prev[1], i];
      return [...prev, i];
    });
  };
  /* preview the resulting merged spell name from COMBOS */
  let previewName: string | null = null;
  if (picked.length === 2) {
    const a = offer.equipped[picked[0]];
    const b = offer.equipped[picked[1]];
    if (typeof a === "string" && typeof b === "string") {
      const key = comboKey(a, b);
      previewName = COMBOS[key]?.name ?? `${SPELLS[a].name}+${SPELLS[b].name}`;
    }
  }
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4" style={{ background: "rgba(6,4,14,0.78)" }}>
      <div className="text-center w-full max-w-3xl max-h-full overflow-y-auto py-6">
        <div className="anim-fade-up text-[11px] font-bold uppercase tracking-[0.38em] text-[#ffe9ad]">The merge gate opens</div>
        <h2 className="anim-fade-up font-display text-4xl md:text-5xl font-black text-[#f5e3b3] tracking-wide mt-1" style={{ textShadow: "0 0 30px rgba(245,201,107,0.4)" }}>
          MERGE SPELLS
        </h2>
        <p className="anim-fade-up-1 text-sm text-[#b9aee0] italic mt-2">
          Pick two single spells to fuse into one merged slot — it casts both in succession. The second slot is emptied for a future drop.
        </p>

        {/* slot cards — show every equipped slot; mergeable (single) slots are clickable */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {offer.equipped.map((entry, i) => {
            const mergeable = offer.slots.includes(i);
            const isPicked = picked.includes(i);
            const color = typeof entry === "string" ? SPELLS[entry].color : (entry === null ? "#6a5a99" : "#ffe9ad");
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                disabled={!mergeable}
                className={`boon-card evo-card p-5 text-left anim-fade-up-${Math.min(3, i + 1)} ${mergeable ? "cursor-pointer" : "opacity-50 cursor-not-allowed"} ${isPicked ? "ring-2" : ""}`}
                style={isPicked ? { borderColor: color + "aa", boxShadow: `0 0 0 2px ${color}` } : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 grid place-items-center border" style={{ color, borderColor: color + "55", background: color + "12" }}>
                    {typeof entry === "string"
                      ? <SpellIcon id={entry} size={24} />
                      : entry === null
                        ? <UiIcon name="hourglass" size={20} />
                        : <span className="flex">
                            <SpellIcon id={entry.merged[0]} size={18} />
                            <span className="ml-[-4px]"><SpellIcon id={entry.merged[1]} size={18} /></span>
                          </span>}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: mergeable ? "#7ed957" : "#6a5a99" }}>
                    {mergeable ? (isPicked ? "picked" : "single") : (entry === null ? "empty" : "merged")}
                  </span>
                </div>
                <div className="font-display font-bold text-lg text-[#f0e8ff] tracking-wide mt-3">
                  {typeof entry === "string"
                    ? SPELLS[entry].name.toUpperCase()
                    : entry === null
                      ? "EMPTY SLOT"
                      : (COMBOS[comboKey(entry.merged[0], entry.merged[1])]?.name ?? "MERGED").toUpperCase()}
                </div>
                <div className="text-[12px] italic" style={{ color }}>
                  {typeof entry === "string" ? SPELLS[entry].tagline : entry === null ? "Awaiting a drop" : "Merged — immutable"}
                </div>
              </button>
            );
          })}
        </div>

        {/* merge preview + confirm */}
        <div className="anim-fade-up-2 mt-5 rune-panel px-5 py-3 inline-block">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a5a99]">Result</div>
          <div className="font-display font-black text-xl text-[#ffe9ad] mt-1">
            {previewName ?? "— pick two single spells —"}
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => picked.length === 2 && onMerge(picked[0], picked[1])}
            disabled={picked.length !== 2}
            className={`btn-gold px-8 py-3 ${picked.length !== 2 ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <UiIcon name="rings" size={16} /> Fuse
          </button>
        </div>
        <p className="anim-fade-up-3 text-[11px] text-[#6a5a99] italic mt-3">
          The merged slot will replace slot {picked[0] !== undefined ? picked[0] + 1 : "?"}; slot {picked.length === 2 ? picked[1] + 1 : "?"} will be emptied.
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   EndCreditsOverlay — Patch 10.0 "The Sealed Rift" endgame.
   ----------------------------------------------------------------------------
   Fires when the wave-50 tyrant falls: the run's story rolls as a cinematic
   credit sequence ("YOU HAVE CLOSED THE RIFT"), then the choice —
     RETURN  bank the triumph, classic game-over eulogy
     FIGHT   the rift reopens: endless survival from wave 51
   The roll is a single authored moment: a slow masked scroll of the run's
   deeds over a frozen arena, gate sigil breathing behind, resolve chord
   already playing (sfx.credits fired by the engine). Skippable at any time. */

export interface EndCreditsProps {
  stats: import("@/game/engine").RunStats;
  onReturn: () => void;
  onFight: () => void;
}

export function EndCreditsOverlay({ stats, onReturn, onFight }: EndCreditsProps) {
  const [choiceReady, setChoiceReady] = useState(false);
  const mm = Math.floor(stats.timeSec / 60);
  const ss = Math.floor(stats.timeSec % 60).toString().padStart(2, "0");

  /* the credit roll plays ~8.6s; then the choice rises. Skip unlocks it early. */
  useEffect(() => {
    const t = window.setTimeout(() => setChoiceReady(true), 8600);
    return () => window.clearTimeout(t);
  }, []);

  const credit = (label: string, value: string) => (
    <div className="credit-row">
      <span className="credit-label">{label}</span>
      <span className="credit-value">{value}</span>
    </div>
  );

  return (
    <div className="end-credits absolute inset-0 z-40 overflow-hidden" role="dialog" aria-modal="true" aria-label="The rift is closed">
      {/* backdrop — frozen arena dimmed beneath a gold breath */}
      <div className="end-credits-backdrop" />

      {/* slow-rolling credit column (masked) */}
      <div className="credit-scroll" aria-hidden={!choiceReady}>
        <div className="credit-roll">
          <div className="credit-kicker">The five tyrants have fallen</div>
          <div className="credit-title">YOU HAVE CLOSED THE RIFT</div>
          <div className="credit-sub">The archmage stands alone in the silence between worlds</div>
          <div className="credit-hr" />
          {credit("Waves endured", String(stats.wave))}
          {credit("Foes felled", stats.kills.toLocaleString())}
          {credit("Damage woven", stats.damage.toLocaleString())}
          {credit("Resonances discovered", String(stats.newCombos.length))}
          {credit("Spell transmutations", String(stats.evolutions.length))}
          {credit("Fusions woven", String(stats.merges.length))}
          {credit("Time in the rift", `${mm}:${ss}`)}
          {credit("Final score", stats.score.toLocaleString())}
          <div className="credit-hr" />
          <div className="credit-cast">FIVE ACTS · FIVE TYRANTS · ONE ARCHMAGE</div>
          <div className="credit-cast-sub">The Dimensional Trials</div>
        </div>
      </div>

      {/* skip / choice */}
      <div className="end-credits-footer">
        {!choiceReady ? (
          <button className="btn-ghost px-5 py-2 text-[12px]" onClick={() => setChoiceReady(true)}>
            Skip credits
          </button>
        ) : (
          <div className="end-choice anim-fade-up">
            <div className="end-choice-title font-display font-black tracking-[0.14em]">THE WEAVE STILL HUMS</div>
            <div className="end-choice-sub">
              The rift is sealed — but something behind the seal answers. Leave with the triumph, or turn and face the echo.
            </div>
            <div className="end-choice-buttons">
              <button
                className="end-btn end-btn-return"
                onClick={onReturn}
                onMouseEnter={() => sfx.uiHover()}
                aria-label="Return — bank the triumph and end the run"
              >
                <UiIcon name="gate" size={18} />
                <span>RETURN</span>
                <span className="end-btn-sub">bank the triumph</span>
              </button>
              <button
                className="end-btn end-btn-fight"
                onClick={onFight}
                onMouseEnter={() => sfx.uiHover()}
                aria-label="Fight — reopen the rift and survive the endless echo"
              >
                <UiIcon name="sword" size={18} />
                <span>FIGHT</span>
                <span className="end-btn-sub">endless, until you fall</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
