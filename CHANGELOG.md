# Changelog

## Version 1.1 — True Direction

The first post-release patch: touch play rebuilt from the stick up, the
audit pass that followed, and a full brand identity for every device and
every crawler.

### Touch controls — True Direction
- **The floating analog stick.** The root cause of the "locked to one
  direction" bug is fixed at the root: on touch, the stick now anchors at
  the exact contact point (biased inward at screen edges) and maps your
  finger 1:1 — any angle, any distance, zero drift on press, zero bleed
  from the previous gesture. The docked housing remains as the resting
  affordance and springs home on release; a classic **docked** mode (legacy
  follow-drag with a direction-preserving radial clamp) stays selectable in
  Settings. Verified: all 4 compass directions, all 4 diagonals, and
  multi-thumb play (move while firing) track exactly.
- **The attack cluster, re-laid.** DASH sits middle-right directly above
  the Weave/Surge button; VOLLEY (hold-to-fire arcane bolts, right-mouse
  parity) joins the cluster beside Weave, above Spell/Fire. One thumb owns
  movement, the other owns the whole arsenal.
- **A customizable touch UI.** Control size (75–140%), control opacity
  (40–100%), stick model (floating / docked) and handedness (right / left
  mirror) — all live from Settings, all persisted, all verified at 140%
  scale in the mirrored left-hand layout.

### The audit pass
- **Performance** (60 fps held at wave-50 boss with 400+ particles):
  ember motes blit as baked 2×-DPR sprites instead of per-frame
  `shadowBlur`; floater fonts and pillar gradients are cached and cleared
  on arena change; the per-slot inventory dispatch storm (~180
  setState/s) is gone; boss-bar timers are one-shot.
- **Combat fairness:** the boss charge-lane telegraph tracks the LIVE aim
  (it pointed at where you dashed *from*); mender plinks are range-gated
  under 560px (no more off-screen sniping); swift elites cap at 1.05× the
  LIVE player speed (swiftness relics always win); Ysolth/Mordrax spiral
  volleys gained a 0.4s grace + 0.45s charge-glow windup.
- **Accessibility:** 9px floor on the smallest HUD labels; the touch
  utility cluster carries full labels; AA/AAA target sizes documented at
  every control scale.

### Platform & brand
- **Fullscreen, one icon.** The fullscreen switch now lives as an icon in
  the top-right corner beside Settings and Sound — one tap from the
  landing page on any device, live state (expand ⇄ compress), and
  unsupported browsers hide it quietly.
- **A full icon & banner suite, optimized for every device:** true-PNG
  favicon.ico (16/32/48) + SVG favicon, apple-touch-icon (180), PWA
  manifest with 192/512 and maskable icons, Open Graph (1200×630), Twitter
  summary-large card (1200×600), a GitHub social-preview banner (1280×640),
  a 1600×900 preview banner and a new true-PNG menu cover — all brand-gold
  on night violet, all regenerable with one command (`bun run brand`).
- **Repo hardening:** GitHub Pages workflow repaired (branch filter) and
  extended (site URL, base path, nojekyll verified), `.gitattributes` and
  `.editorconfig` normalized, VS Code workspace tuned (format-on-save,
  ESLint + Tailwind IntelliSense).

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
