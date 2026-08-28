/* ============================================================================
   Patch 8.0 — autopick.ts
   ----------------------------------------------------------------------------
   Static best-choice pickers used by Archmage Mode (the mobile autopilot
   toggle). While Archmage Mode is ON, every choice overlay (tribute reward,
   spell drop, spell merge, shrine evolution) is auto-resolved after a short
   "the Archmage decides…" beat so the run plays itself end-to-end.

   These pickers are PURE: no engine access, no React — just lightweight
   heuristics over the content tables. The situational (in-combat) casting
   brain lives in engine.ts's autopilot; this file only ranks overlay cards.
   ============================================================================ */

import { ElementId, UpgradeChoice } from "./content";
import { EvolutionDef } from "./evolutions";

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
  wind: 56,     // Patch 9.0 — triple pierce + knockback, cheap & fast
  ice: 55,      // fast pierce + chill
  nature: 50,   // lingering AoE cloud
  sonic: 49,    // Patch 9.0 — panic-button nova, knock foes off you
  arcane: 48,   // cheap fan spam
  time: 45,     // utility (slow field)
  shadow: 40,   // mobility + burst (player repositioning is a con for auto)
  earth: 34,    // defensive pillar (no direct damage)
};

export function spellValue(id: ElementId): number {
  return SPELL_VALUE[id] ?? 40;
}

/* ---------------------------------------------------------------------------
   Tribute reward ranking (mandatory pick each 5 waves).
   Priority: survivability floor first (armor/HP scale forever), then flat
   damage multipliers, then quality-of-life. "cache" is the floor.
--------------------------------------------------------------------------- */
const REWARD_PRIORITY: string[] = [
  "power",    // +8% spell damage — always relevant
  "critdmg",  // +25% crit damage
  "crit",     // +6% crit chance
  "cdr",      // −8% cooldowns
  "armor",    // −8% damage taken
  "hp",       // +10 max HP
  "pierce",   // +1 pierce
  "mana",
  "manaregen",
  "speed",
  "dash",
  "combo",
  "cache",
];

export function bestRewardId(rewards: UpgradeChoice[]): string {
  let best = rewards[0]?.id ?? "cache";
  let bestRank = Infinity;
  for (const r of rewards) {
    const rank = REWARD_PRIORITY.indexOf(r.id);
    if (rank >= 0 && rank < bestRank) {
      bestRank = rank;
      best = r.id;
    }
  }
  return best;
}

/* ---------------------------------------------------------------------------
   Shrine evolution pick — prefer offensive/transformative mods. EvolutionDef
   names vary; score by keyword so new evolutions rank sensibly without
   hard-coding ids.
--------------------------------------------------------------------------- */
export function bestEvolutionId(defs: EvolutionDef[]): string {
  if (defs.length === 0) return "";
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
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  }
  return best.id;
}

/* ---------------------------------------------------------------------------
   Spell-drop placement — offered pool × equipped slots.
   Strategy: take the highest-value offered spell; place it into the first
   EMPTY slot, else replace the lowest-value equipped SINGLE spell — but only
   if the offer actually beats what's there (otherwise the caller can keep
   the heal via "Back to Game"; we still return the best placement and let
   the shell compare values).
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
): SpellPlacement | null {
  if (pool.length === 0) return null;

  const slotValue = (entry: ElementId | { merged: ElementId[] } | null): number => {
    if (entry === null) return 0;
    if (typeof entry === "string") return spellValue(entry);
    /* merged slots are the strongest asset — value above their parts */
    return entry.merged.reduce((acc, id) => acc + spellValue(id), 0) * 0.75 + 20;
  };

  const bestOffer = pool.reduce((a, b) => (spellValue(b) > spellValue(a) ? b : a));

  let target = -1;
  let worst = Infinity;
  let worstVal = 0;
  for (let i = 0; i < equipped.length; i++) {
    const entry = equipped[i];
    if (entry === null) {
      /* empty slot — free real estate, take it immediately */
      return { slot: i, id: bestOffer, offerValue: spellValue(bestOffer), replacedValue: 0 };
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
  return { slot: target, id: bestOffer, offerValue: spellValue(bestOffer), replacedValue: worstVal };
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
   keeps the strong singles flexible while compounding the chaff.
--------------------------------------------------------------------------- */
export function bestMergePair(
  slots: number[],
  equipped: (ElementId | { merged: ElementId[] } | null)[],
): [number, number] | null {
  if (slots.length < 2) return null;
  const ranked = [...slots].sort((a, b) => {
    const ea = equipped[a];
    const eb = equipped[b];
    const va = typeof ea === "string" ? spellValue(ea) : 0;
    const vb = typeof eb === "string" ? spellValue(eb) : 0;
    return va - vb;
  });
  return [ranked[0], ranked[1]];
}
