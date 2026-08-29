# Changelog

## Version 1.0 — The Sealed Rift (official release)

The official release. Everything before this page is history;
everything on it is the game as shipped.

### The world
- **Five acts, fifty waves, one rift.** The Sunless Vestibule, the Cinder
  Labyrinth, the Drowned Necropolis, the Silent Sepulcher and the Heart of
  the Abyss — each capped by one of five shuffled tyrants: Malgrym the Maw of
  Ruin, Ashgorim the Unquenched Pyre, Sylthara the Reaving Waltz, Ysolth the
  Hollow Hour, Mordrax the First Sundering.
- **Thirteen dark arts, seventy-eight resonances.** Cast two elements within
  a breath to weave a resonance; discover all 78 in the Arcanum.
- **Seed-driven everything.** The Rift Seed shapes the floor plan (eight
  archetypes across a 2560×1600 world), the tyrant order, and the monster
  ecology itself — two foe types surge per seed while others fade.

### Combat & game feel
- **The attunement curve.** The mage's spell power grows with the wave
  (×1.055^wave, capped ×44), matched against a softened enemy HP curve —
  magic stays crisp to wave 50 and beyond; nothing is a bullet sponge.
- **The weave hunts the marked.** Elite foes take **+35% spell damage**;
  elite affixes (Blazing / Swift / Bulwark / Leech) were rebalanced around
  burst instead of HP walls. Bulwark: 2.30× HP & 35% resist → 1.75× & 18%.
- **Tyrants that scale with the act.** Boss HP and damage now ride the
  attunement curve, so every tenth-wave duel holds its hit-count wherever
  the shuffle places that tyrant. Endless echoes keep escalating +22%/cycle.
- **Five distinct boss minds** — a stampede charger, a shockwave juggernaut,
  a blade dancer, a blink fortress, and an apex storm with a gravity rift.
  No cutscenes: audio, telegraphs and the HUD plate carry every beat.
- **Juice everywhere.** Additive per-element projectile silhouettes, triple-
  ring resonance detonations with hit-stop, eased HUD bars, screen shake
  (respecting `prefers-reduced-motion`), floating damage numbers with gold
  crit and elite-marked readouts.

### The economy
- **Strict one-drop-per-wave.** Each wave fields exactly one drop type —
  spell tear, heart (25% max-HP mend), resonance orb, or the every-5-wave
  tribute gate. Unclaimed orbs dissolve at wave end.
- **Loadout-aware loot pools.** The drop economy reads your equipped
  inventory live: a standard loadout (3 base spells) keeps resonances,
  boons, new spells and transmutations in the pool, while an apex loadout
  (2 resonance spells bound) instantly removes resonances and spell
  upgrades — only new base spells and boons remain.
- **Fair-cycling RNG.** Spell tears draw from a seeded shuffle-bag (every
  eligible element appears once per cycle before any repeat); tribute
  boons and transmutations draft with 1/(1+n) recency weights so every
  eligible card surfaces. Strict drop rates untouched.
- **The sacrifice merge.** Resonance orbs demand a tithe: sacrifice exactly
  two bound spells, fused into one merged slot that casts both in succession.
- **Aether glyphs.** Foes shed glyphs; every pickup registers on the live HUD
  counter and pays out post-game (25% conversion) alongside the run formula.

### Meta progression
- **The Reliquary** — four permanent tracks (Vitality, Power, Focus,
  Swiftness), six levels each, all boosts applied live from the next run's
  first frame.
- **The Arcanum** — spellbook, 78-resonance codex, first-kill bestiary,
  tyrant gallery and lifetime records, all behind procedural seeded covers.
- **Rift Mercy** — an opt-in per-death assist ladder (defense, attack, spawn
  thinning, foe softening) with manual tier selection; a triumph clears it.

### The endgame
- **Wave 50 seals the rift.** The end-credit sequence rolls your deeds over
  the frozen arena — then the choice: **RETURN** to bank the triumph, or
  **FIGHT** into the Endless Dirge (waves 51+, escalating budget and HP,
  Echo tyrants every tenth wave until you fall).

### Platform
- **Compact centered announcements.** Every in-game call — wave plates,
  spawn whispers, boss alerts (tyrant name + title), rift events — renders
  through one small plate at the exact viewport center: short 3% overshoot,
  whisper fade, zero obstruction on any device, sized by the Accessibility
  text-scale slider.
- **A full accessibility suite** — UI size (75–150%), announcement text
  size (75–150%), reduce flashes (dampens the red damage vignette),
  high-contrast HUD (solid panels, brighter borders, announcement scrim),
  aim assist (3 levels), damage numbers, screen shake, Rift Mercy, and
  `prefers-reduced-motion` respect — every option live, no restart.
- Desktop (keyboard + mouse), mobile (twin-thumb touch layer with
  cooldown/mana readouts, forced-landscape guard, landing-page fullscreen
  enforcer), adaptive synthesized score with a three-stage boss-music arc.
- One-command deploys: GitHub Pages workflow included (with `.nojekyll`);
  standalone server build for self-hosting.
