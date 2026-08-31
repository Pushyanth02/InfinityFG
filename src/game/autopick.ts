/* ============================================================================
   Patch 10.2 — autopick.ts · THE FATEWEAVER
   ----------------------------------------------------------------------------
   The Fateweaver is Archmage Mode's decision brain. While Archmage Mode is
   ON, every choice overlay (tribute reward, spell drop, spell merge, shrine
   evolution) is auto-resolved after a short "the Fateweaver weighs the
   threads…" beat so the run plays itself end-to-end.

   Patch 10.2 overhaul — the pickers are no longer static priority ladders.
   Each one receives a FATECONTEXT (a live snapshot of the run: HP/mana
   fractions, wave, incoming boss, build stats, equipped roles) and bends its
   ranking accordingly:
     • wounded mage          → survivability floor first (armor / HP)
     • mana starvation       → focus economy (mana / regen)
     • a tyrant next wave    → offense spike (power / crit)
     • saturated stats       → skip what the build already has plenty of
     • lopsided spell roles  → fill the gap (no AoE? take the AoE offer)
   These pickers are PURE: no engine access, no React — just lightweight
   heuristics over the content tables + the context snapshot. The situational
   (in-combat) casting brain lives in engine.ts's autopilot; this file only
   ranks overlay cards.
   ============================================================================ */

import { ElementId, UpgradeChoice } from "./content";
import { EvolutionDef } from "./evolutions";

/* ---------------------------------------------------------------------------
   FateContext — the live run state the Fateweaver reasons over. Built by
   ArchmageEngine.getFateContext() whenever an overlay needs resolving;
   null means "no engine attached" (pickers fall back to sensible defaults).
--------------------------------------------------------------------------- */
export interface FateContext {
  /** current HP as a fraction of max (0..1) */
  hpFrac: number;
  /** current aether as a fraction of max (0..1) */
  manaFrac: number;
  /** current wave number */
  wave: number;
  /** the NEXT wave summons a tyrant */
  bossSoon: boolean;
  /** live enemies on the field right now */
  enemiesAlive: number;
  /** spell power multiplier so far (1 = base) */
  power: number;
  /** damage reduction so far (0 = none) */
  armor: number;
  /** crit chance so far (0..1) */
  crit: number;
  /** cooldown reduction so far (0..1) */
  cdr: number;
  /** equipped slots (single id / merged pair / empty) — drives role coverage */
  equipped: (ElementId | { merged: ElementId[] } | null)[];
}

/* ---------------------------------------------------------------------------
   Spell value table — a spell's general-purpose power rating used when
   deciding whether an OFFERED spell beats an equipped one, and which
   equipped slot is weakest (the natural replace/merge candidate).
   Ratings weigh damage potential, coverage, and cooldown efficiency.
--------------------------------------------------------------------------- */
const SPELL_VALUE: Record<ElementId, number> = {
  blood: 78,    // 110 dmg lance — premium single-target
  light: 70,    // 70 dmg long beam
  lightning: 66,// auto-chain, no aim needed
  fire: 60,     // reliable mid-range nuke
  void: 58,     // AoE pulse + pull
  wind: 56,     // triple pierce + knockback, cheap & fast
  ice: 55,      // fast pierce + chill
  nature: 50,   // lingering AoE cloud
  sonic: 49,    // panic-button nova, knocks foes off you
  arcane: 48,   // cheap fan spam
  time: 45,     // utility (slow field)
  shadow: 40,   // mobility + burst (player repositioning is a con for auto)
  earth: 34,    // defensive pillar (no direct damage)
};

export function spellValue(id: ElementId): number {
  return SPELL_VALUE[id] ?? 40;
}

/* Role buckets for loadout-coverage reasoning. */
const ROLE_AOE = new Set<ElementId>(["fire", "void", "nature", "sonic", "wind"]);
const ROLE_BURST = new Set<ElementId>(["blood", "light", "lightning"]);
const ROLE_PANIC = new Set<ElementId>(["sonic", "void", "earth", "shadow"]);

function equippedRoles(equipped: (ElementId | { merged: ElementId[] } | null)[]) {
  let aoe = 0, burst = 0, panic = 0, single = 0;
  for (const entry of equipped) {
    if (entry === null) continue;
    const ids = typeof entry === "string" ? [entry] : entry.merged;
    for (const id of ids) {
      if (ROLE_AOE.has(id)) aoe++;
      if (ROLE_BURST.has(id)) burst++;
      if (ROLE_PANIC.has(id)) panic++;
      if (id === "blood" || id === "light") single++;
    }
  }
  return { aoe, burst, panic, single };
}

/* ---------------------------------------------------------------------------
   Tribute reward ranking (mandatory pick each 5 waves) — FATEWEAVER rules.
   Base ladder stays survivability-aware, then the context bends it:
     wounded → armor/hp first · starving → focus economy · boss next → spike.
--------------------------------------------------------------------------- */
const REWARD_BASE: Record<string, number> = {
  power: 100,   // +8% spell damage — always relevant
  critdmg: 92,  // +25% crit damage
  crit: 84,     // +6% crit chance
  cdr: 80,      // −8% cooldowns
  armor: 74,    // −8% damage taken
  hp: 70,       // +10 max HP
  pierce: 62,   // +1 pierce
  mana: 54,
  manaregen: 52,
  speed: 46,
  dash: 42,
  combo: 38,
  cache: 20,
};

export function bestRewardId(rewards: UpgradeChoice[], ctx: FateContext | null): string {
  const hurt = !ctx || ctx.hpFrac < 0.5;
  const starving = !ctx || (ctx.manaFrac < 0.3 && ctx.wave > 5);
  const bossSoon = !ctx || ctx.bossSoon;
  let best = rewards[0]?.id ?? "cache";
  let bestScore = -Infinity;
  for (const r of rewards) {
    let s = REWARD_BASE[r.id] ?? 30;
    /* context bends */
    if (hurt && (r.id === "armor" || r.id === "hp")) s += 60;
    if (starving && (r.id === "mana" || r.id === "manaregen")) s += 55;
    if (bossSoon && (r.id === "power" || r.id === "critdmg" || r.id === "crit")) s += 25;
    /* saturation — skip what the build already has plenty of */
    if (ctx) {
      if (r.id === "armor" && ctx.armor > 0.5) s -= 45;
      if (r.id === "crit" && ctx.crit > 0.35) s -= 40;
      if (r.id === "cdr" && ctx.cdr > 0.45) s -= 40;
      if (r.id === "speed" && ctx.wave < 12) s -= 20;   // early kiting is safe enough
    }
    if (s > bestScore) {
      bestScore = s;
      best = r.id;
    }
  }
  return best;
}

/* ---------------------------------------------------------------------------
   Shrine evolution pick — prefer offensive/transformative mods; a wounded
   mage prefers defensive/control transformations instead. EvolutionDef
   names vary; score by keyword so new evolutions rank sensibly without
   hard-coding ids.
--------------------------------------------------------------------------- */
export function bestEvolutionId(defs: EvolutionDef[], ctx: FateContext | null): string {
  if (defs.length === 0) return "";
  const hurt = !ctx || ctx.hpFrac < 0.55;
  let best = defs[0];
  let bestScore = -Infinity;
  for (const d of defs) {
    /* concrete mod math first — damage, count, pierce, cooldown all scale DPS */
    let s = 50;
    s += ((d.mod.dmg ?? 1) - 1) * 60;
    s += (d.mod.count ?? 0) * 9;
    s += (d.mod.pierce ?? 0) * 4;
    if (d.mod.cooldown) s += (1 - d.mod.cooldown) * 40;
    if (d.mod.cost) s += (1 - d.mod.cost) * 20;
    if (d.mod.special) s += 6; // transformed behavior is usually a net win
    /* keyword nudge for flavor-text-only mods */
    const text = (d.name + " " + d.desc).toLowerCase();
    if (/chain|split|pierce|extra|burst/.test(text)) s += 6;
    /* Patch 10.2 — the Fateweaver reads the battlefield: hurt mages favor
       evolutions that control or blunt the fight, healthy ones escalate. */
    if (hurt && /guard|shield|slow|freeze|glacial|ward|stasis|drain|sustain|wall|bloom/.test(text)) s += 14;
    if (!hurt && /chain|split|pierce|burst|storm|nova|catalys|comet|hurricane/.test(text)) s += 8;
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  }
  return best.id;
}

/* ---------------------------------------------------------------------------
   Spell-drop placement — offered pool × equipped slots.
   Strategy: score every OFFER by value + role coverage (the Fateweaver fills
   gaps in the loadout — an AoE-less build chases AoE offers), then place the
   winner into the first EMPTY slot, else replace the lowest-value equipped
   SINGLE spell — but only if the offer actually beats what's there.
--------------------------------------------------------------------------- */
export interface SpellPlacement {
  slot: number;
  id: ElementId;
  offerValue: number;
  replacedValue: number; // 0 when filling an empty slot
}

export function bestSpellPlacement(
  pool: ElementId[],
  equipped: (ElementId | { merged: ElementId[] } | null)[],
  ctx: FateContext | null,
): SpellPlacement | null {
  if (pool.length === 0) return null;

  const slotValue = (entry: ElementId | { merged: ElementId[] } | null): number => {
    if (entry === null) return 0;
    if (typeof entry === "string") return spellValue(entry);
    /* merged slots are the strongest asset — value above their parts */
    return entry.merged.reduce((acc, id) => acc + spellValue(id), 0) * 0.75 + 20;
  };

  /* Patch 10.2 — role-aware offer scoring: fill what the loadout lacks */
  const roles = equippedRoles(ctx ? ctx.equipped : equipped);
  const hurt = !ctx || ctx.hpFrac < 0.55;
  const offerScore = (id: ElementId): number => {
    let s = spellValue(id);
    if (roles.aoe === 0 && ROLE_AOE.has(id)) s += 18;          // no AoE tool at all
    if (roles.burst === 0 && ROLE_BURST.has(id)) s += 12;      // no premium single-target
    if (hurt && ROLE_PANIC.has(id)) s += 10;                   // wounded → panic tools
    if (roles.aoe >= 3 && ROLE_AOE.has(id)) s -= 8;            // already AoE-heavy
    return s;
  };

  let bestOffer = pool[0];
  let bestOfferScore = -Infinity;
  for (const id of pool) {
    const s = offerScore(id);
    if (s > bestOfferScore) { bestOfferScore = s; bestOffer = id; }
  }

  let target = -1;
  let worst = Infinity;
  let worstVal = 0;
  for (let i = 0; i < equipped.length; i++) {
    const entry = equipped[i];
    if (entry === null) {
      /* empty slot — free real estate, take it immediately */
      return { slot: i, id: bestOffer, offerValue: bestOfferScore, replacedValue: 0 };
    }
    if (typeof entry !== "string") continue; // never break a merged pair
    const v = spellValue(entry);
    if (v < worst) {
      worst = v;
      worstVal = v;
      target = i;
    }
  }
  if (target < 0) return null; // nothing replaceable (all merged)
  return { slot: target, id: bestOffer, offerValue: bestOfferScore, replacedValue: worstVal };
}

/** Whether an auto-placement is actually an upgrade (or an empty-slot fill). */
export function placementIsUpgrade(p: SpellPlacement | null): boolean {
  if (!p) return false;
  return p.replacedValue === 0 || p.offerValue > p.replacedValue;
}

/* ---------------------------------------------------------------------------
   Merge pick — fuse the two lowest-value single spells. Rationale: merged
   slots are always stronger than the sum of their parts (both fire in
   succession AND free a slot for future drops), so merging the weakest pair
   keeps the strong singles flexible while compounding the chaff. Patch 10.2
   nudge: when the build is AoE-starved, avoid merging the LAST AoE tool.
--------------------------------------------------------------------------- */
export function bestMergePair(
  slots: number[],
  equipped: (ElementId | { merged: ElementId[] } | null)[],
): [number, number] | null {
  if (slots.length < 2) return null;
  const isAoe = (entry: ElementId | { merged: ElementId[] } | null): boolean => {
    if (typeof entry !== "string") return false;
    return ROLE_AOE.has(entry);
  };
  const aoeSlots = slots.filter((i) => isAoe(equipped[i]));
  const protectLastAoe = aoeSlots.length === 1;
  const ranked = [...slots].sort((a, b) => {
    const ea = equipped[a];
    const eb = equipped[b];
    const va = typeof ea === "string" ? spellValue(ea) : 0;
    const vb = typeof eb === "string" ? spellValue(eb) : 0;
    /* a lone AoE tool sinks in the merge ranking when the build needs it */
    const pa = protectLastAoe && isAoe(ea) ? 1000 : 0;
    const pb = protectLastAoe && isAoe(eb) ? 1000 : 0;
    return (va + pa) - (vb + pb);
  });
  return [ranked[0], ranked[1]];
}
