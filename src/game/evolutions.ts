/* Spell evolution system — Patch 3.0.
   Each of the 11 elements has 2 evolutions. Offered when an act is cleared
   (boss defeated) and at Rift Shrine surprise entrances. One element can
   evolve once per run; evolution replaces the base spell's behavior via
   `mod` multipliers + a `special` key the engine interprets per element. */

import { ElementId, RNG, SPELLS } from "./content";

export interface EvoMod {
  dmg?: number;        // damage multiplier
  count?: number;      // extra projectiles
  radius?: number;     // blast / aoe radius multiplier
  speed?: number;      // projectile speed multiplier
  pierce?: number;     // extra pierce
  cooldown?: number;   // cooldown multiplier
  cost?: number;       // mana cost multiplier
  life?: number;       // projectile life multiplier
  special?: string;    // unique behavior key handled by the engine
}

export interface EvolutionDef {
  id: string;
  base: ElementId;
  name: string;
  tagline: string;
  desc: string;
  mod: EvoMod;
}

export const EVOLUTIONS: EvolutionDef[] = [
  /* ---- fire ---- */
  {
    id: "fire_cataclysm", base: "fire", name: "Cataclysm Orb", tagline: "The sky remembers fire",
    desc: "The fireball becomes a falling sun — near-double blast, heavier damage, deeper burns that leap to nearby foes.",
    mod: { dmg: 1.25, radius: 1.9, special: "cataclysm" },
  },
  {
    id: "fire_fan", base: "fire", name: "Ember Fan", tagline: "An argument in three parts",
    desc: "Hurls three fireballs in a spread. Each blast is smaller, but the floor becomes a deadline.",
    mod: { dmg: 0.62, count: 2, radius: 0.85, special: "fan" },
  },
  /* ---- ice ---- */
  {
    id: "ice_glacial", base: "ice", name: "Glacial Lance", tagline: "Winter, sharpened",
    desc: "A single massive shard — heavier damage, flies faster, pierces far deeper and chills longer.",
    mod: { dmg: 1.5, speed: 1.2, pierce: 3, cooldown: 1.15, special: "glacial" },
  },
  {
    id: "ice_shatter", base: "ice", name: "Shatter Bloom", tagline: "Break beautifully",
    desc: "Shards burst on impact into a ring of splinters, skewering everything near the wound.",
    mod: { dmg: 0.85, special: "shatter" },
  },
  /* ---- lightning ---- */
  {
    id: "light_tempest", base: "lightning", name: "Tempest Chain", tagline: "The storm learns names",
    desc: "Chain lightning leaps up to four additional foes, striking each harder.",
    mod: { dmg: 1.15, count: 4, special: "tempest" },
  },
  {
    id: "light_skyfall", base: "lightning", name: "Skyfall Judgment", tagline: "No ladder required",
    desc: "Forgoes the chain and strikes three marked foes directly from above, wherever they hide.",
    mod: { dmg: 0.9, special: "skyfall" },
  },
  /* ---- earth ---- */
  {
    id: "earth_bastion", base: "earth", name: "Iron Bastion", tagline: "The mountain volunteers",
    desc: "The stone ward nearly doubles in toughness and size and stands twice as long.",
    mod: { radius: 1.35, life: 1.45, special: "bastion" },
  },
  {
    id: "earth_tremor", base: "earth", name: "Tremor Ward", tagline: "Stone has opinions",
    desc: "The ward trembles violently, punishing every foe that lingers beside it.",
    mod: { radius: 1.1, special: "tremor" },
  },
  /* ---- shadow ---- */
  {
    id: "shadow_longnight", base: "shadow", name: "Long Night", tagline: "Farther into the dark",
    desc: "Blink much farther with a wider arrival strike and a longer veil of immunity.",
    mod: { radius: 1.4, special: "longnight" },
  },
  {
    id: "shadow_pocket", base: "shadow", name: "Twin Shadow", tagline: "You, twice, briefly",
    desc: "Leaves a hungry pocket of dark where you departed, gnawing at foes who cross it.",
    mod: { dmg: 1.1, special: "pocket" },
  },
  /* ---- light ---- */
  {
    id: "light_dawnbreaker", base: "light", name: "Dawnbreaker", tagline: "Morning, weaponized",
    desc: "The lance burns far hotter and returns twice the healing for each foe seared.",
    mod: { dmg: 1.4, special: "dawnbreaker" },
  },
  {
    id: "light_halo", base: "light", name: "Judgement Halo", tagline: "A crown of rays",
    desc: "Splits into three searing beams — left, center, right. The dawn comes from everywhere.",
    mod: { dmg: 0.8, count: 2, special: "halo" },
  },
  /* ---- time ---- */
  {
    id: "time_eternity", base: "time", name: "Still Eternity", tagline: "A held breath, longer",
    desc: "The chrono bubble swells far larger and holds its silence for far longer.",
    mod: { radius: 1.5, life: 1.45, special: "eternity" },
  },
  {
    id: "time_rewind", base: "time", name: "Rewind", tagline: "Bolts, returned to sender",
    desc: "The bubble also crawls hostile bolts to a tenth speed and stitches your wounds on cast.",
    mod: { special: "rewind" },
  },
  /* ---- void ---- */
  {
    id: "void_collapse", base: "void", name: "Event Collapse", tagline: "A heavier nothing",
    desc: "The singularity implodes with far greater force across a wider reach.",
    mod: { dmg: 1.6, radius: 1.4, special: "collapse" },
  },
  {
    id: "void_maw", base: "void", name: "Hungering Maw", tagline: "It eats while it waits",
    desc: "The pull tightens mercilessly and the maw devours everything it drags near, continuously.",
    mod: { dmg: 0.85, special: "maw" },
  },
  /* ---- arcane ---- */
  {
    id: "arcane_prism", base: "arcane", name: "Prism Storm", tagline: "Geometry, unleashed",
    desc: "The fan sprays four additional seeking bolts in a far wider cone.",
    mod: { count: 4, special: "prism" },
  },
  {
    id: "arcane_snakes", base: "arcane", name: "Rune Serpents", tagline: "They fly in circles",
    desc: "Bolts curve impossibly hard toward prey and hunt far longer before fading.",
    mod: { life: 1.4, dmg: 1.15, special: "snakes" },
  },
  /* ---- blood ---- */
  {
    id: "blood_exsanguinator", base: "blood", name: "Exsanguinator", tagline: "Debt collected in full",
    desc: "The javelin hits far harder and drinks deeper — greater healing per foe skewered.",
    mod: { dmg: 1.35, special: "exsanguinator" },
  },
  {
    id: "blood_comet", base: "blood", name: "Crimson Comet", tagline: "It leaves a red wake",
    desc: "Flies faster and detonates in a small burst of shrapnel with every foe it pierces.",
    mod: { speed: 1.35, special: "comet" },
  },
  /* ---- nature ---- */
  {
    id: "nature_verdant", base: "nature", name: "Verdant Wrath", tagline: "The garden retaliates",
    desc: "Spore clouds grow far larger, linger far longer, and rot with terrible enthusiasm.",
    mod: { radius: 1.4, life: 1.5, dmg: 1.5, special: "verdant" },
  },
  {
    id: "nature_strangling", base: "nature", name: "Strangling Spores", tagline: "Roots that grip lungs",
    desc: "The cloud grows grasping roots — every foe inside is dragged to half speed.",
    mod: { radius: 1.15, special: "strangling" },
  },
  /* ---- wind (Patch 9.0) ---- */
  {
    id: "wind_cyclone", base: "wind", name: "Cyclone Choir", tagline: "A committee of gales",
    desc: "Five blades fan out in a wide arc — each smaller, but the sky is suddenly very crowded.",
    mod: { dmg: 0.7, count: 2, special: "cyclone" },
  },
  {
    id: "wind_hurricane", base: "wind", name: "Hurricane Edge", tagline: "What leaves, returns",
    desc: "Heavier blades that boomerang back through everything a second time on the way home.",
    mod: { dmg: 1.35, speed: 1.15, special: "hurricane" },
  },
  /* ---- sonic (Patch 9.0) ---- */
  {
    id: "sonic_crescendo", base: "sonic", name: "Crescendo", tagline: "Louder, and louder",
    desc: "The nova nearly doubles in radius and force — the whole room becomes the instrument.",
    mod: { dmg: 1.25, radius: 1.6, cooldown: 1.15, special: "crescendo" },
  },
  {
    id: "sonic_silence", base: "sonic", name: "Silencing Chord", tagline: "The note after the end",
    desc: "The pulse flings foes much farther away and roots them in a long, dragging stupor.",
    mod: { dmg: 0.9, special: "silence" },
  },
];

export function evolutionsForBase(base: ElementId): EvolutionDef[] {
  return EVOLUTIONS.filter((e) => e.base === base);
}

/** Offer 3 evolutions for spells the player actually holds (Patch 6.0 fix:
    upgrade options must reference the player's existing spells — merged slot
    components count as held since they still cast). Bases already evolved
    this run are excluded. If fewer than 3 bases remain, fewer cards show. */
export function offerEvolutions(rng: RNG, evolved: (EvolutionDef | null)[], equipped: Set<ElementId>): EvolutionDef[] {
  const taken = new Set(evolved.filter(Boolean).map((e) => e!.base));
  const pool = EVOLUTIONS.filter((e) => equipped.has(e.base) && !taken.has(e.base));
  const out: EvolutionDef[] = [];
  const scratch = [...pool];
  while (out.length < 3 && scratch.length) {
    const i = Math.floor(rng.next() * scratch.length);
    out.push(scratch.splice(i, 1)[0]);
  }
  return out;
}

/** The engine's per-slot evolution lookup helper. */
export function evoColor(base: ElementId): string {
  return SPELLS[base].color;
}
