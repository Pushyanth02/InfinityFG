<div align="center">

# ⚔️ ARCHMAGE

### *Rift Survivor — Version 1.0 “The Sealed Rift”*

A **pure arcade roguelike** that runs entirely in the browser.
No accounts · no servers · no loading screens — **one** image ships with the
game, and everything else is generated at runtime.

[![Version](https://img.shields.io/badge/version-1.0_%E2%80%9CThe_Sealed_Rift%E2%80%9D-f5c96b?style=for-the-badge)](./CHANGELOG.md)
[![Engine](https://img.shields.io/badge/engine-Canvas%202D%20%C2%B7%2060%20fps-9a7bff?style=for-the-badge)](#-tech-stack)
[![Audio](https://img.shields.io/badge/audio-Web%20Audio%20%C2%B7%20fully%20synthesized-43e8d8?style=for-the-badge)](#-the-score)
[![Assets](https://img.shields.io/badge/assets-1%20image%20%C2%B7%20zero%20audio%20files-7ed957?style=for-the-badge)](#%EF%B8%8F-design-notes)
[![License](https://img.shields.io/badge/license-MIT-ff4d6b?style=for-the-badge)](./LICENSE)

**🜂 13 elements · 🜛 78 resonances · 👑 5 shuffled tyrants · 🌊 50 waves + endless**

</div>

---

## 🜛 The Game

You are the last Archmage. **Fifty waves** stand between you and the sealed
rift, split into five biomes of ten — each capped by a tyrant whose position
is shuffled by the seed. Clear the fiftieth and **the end-credit sequence
rolls your deeds over the frozen arena**; then the choice:

> 🌑 **RETURN** — bank the triumph.
> 🗡️ **FIGHT** — the rift reopens: the Endless Dirge, waves 51+ with
> escalating pressure and *Echo* tyrants every tenth wave, until you fall.

Everything scales, everything shuffles, and nothing interrupts the fight —
no cutscenes, no story, no filler.

| System | What it does |
| --- | --- |
| 🔥 **13 elements / 78 resonances** | Cast two different elements within 1.5 s to weave a resonance. All 78 live in the Arcanum, locked until you find them. |
| 📈 **The attunement curve** | *Your magic grows with the rift* — spell power compounds ×1.055 per wave against a softened enemy curve. Nothing is a bullet sponge; difficulty comes from pressure, not HP walls. |
| 🎯 **The weave hunts the marked** | Elite foes (Blazing / Swift / Bulwark / Leech) take **+35 % spell damage** and read gold on impact — marked prey, never walls. |
| 👑 **Tyrants that scale with the act** | Boss HP rides the same curve as your power, so every tenth-wave duel holds its hit-count wherever the shuffle places it. Five genuinely distinct minds: stampede charger, shockwave juggernaut, blade dancer, blink fortress, apex storm. |
| 💎 **Strict one-drop-per-wave** | Each wave fields **exactly one** drop type — a spell tear, a heart (25 % mend), a resonance orb, or the every-5-wave tribute gate. Unclaimed orbs dissolve at wave end. Scheduled tears carry a flat 19 % reabsorb chance. |
| 🜂 **The sacrifice merge** | Resonance orbs demand a tithe: sacrifice **exactly two** bound spells; they fuse into one merged slot that casts both in succession. |
| ✨ **Aether glyphs** | Foes shed glyphs — every pickup registers on the live HUD counter (`+N` beside your bank) and pays out post-game at 25 % conversion. |
| 🏛️ **The Reliquary** | Spend glyphs on four permanent tracks — Vitality / Power / Focus / Swiftness — six levels each. Every boost applies live from your next run's first breath. |
| 📖 **The Arcanum** | Spellbook, 78-resonance codex, **first-kill bestiary**, tyrant gallery and lifetime records — behind rerollable procedural cover sigils. |
| ⚖️ **Rift Mercy** | Opt-in per-death assist ladder (Hades-style dignity): tiers bank with every fall, clear on triumph; manual tier selection in Settings with a live HUD readout. |
| 🧠 **The Fateweaver** | Archmage Mode autopilot: line-of-sight-disciplined casting, resonance hunting, surge discipline, context-aware boon picks. Press `T` and watch a clean run. |
| 🎼 **The score** | Fully synthesized (Web Audio API) and **mixed loud** through a master compressor — an act-tinted drone with plucks that calms in the menu, sharpens in combat, and the instant a tyrant enters: sting → driving ostinato → tritone war-drone at half health → instant collapse on the kill. |

## 🎮 Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| `LMB` | Cast selected spell (aim assist curves the weave) |
| `RMB` | Arcane volley — homing bolts |
| `1 2 3` / wheel / `Q E` | Select / cycle spells |
| `Space` | Blink step (brief immunity) |
| `F` | Weave Surge (when the meter is full) |
| `T` | Archmage Mode — the rift plays itself |
| `P` / `Esc` | Pause |
| `M` | Mute |

📱 Touch devices get a thumb-zone layer: a docked MOVE stick (drag anywhere),
a hold-to-FIRE button with auto-targeting, a SPELL cycle button, DASH, SURGE,
and a tap-to-cast spell strip — **every toggler carries live cooldown veils
and aether-cost badges**. Portrait phones get a rotate guard; the landing
page carries a fullscreen enforcer that works on any device.

## ✨ Game Feel & Animation

The game is tuned like an action game, not a spreadsheet:

- **Per-element projectile silhouettes** — Pyroclasm flies as a layered comet
  with a streaming flame tail, Gravefrost as a faceted sliver with a
  refracted core line, Null Rift as a black heart wrapped in rotating
  accretion arms, Crimson Requiem as a barbed javelin trailing blood mist.
- **Resonance detonations bloom** — triple expanding rings in both element
  colors plus the white seam, a 34-particle two-color storm, hit-stop and a
  screen kick. The weave *sings* when two elements kiss.
- **Cinematic impact feedback** — hit-stop on crits and boss kills, eased
  camera shake, gold crit floaters, **gold-and-larger elite-marked damage
  numbers**, and enrage moments carried purely by audio + light (no message
  boxes ever interrupt combat).
- **Fluid UI motion** — eased cubic-bezier HUD bars, staggered fade-up
  panels, pulsing weave meters, drifting menu motes, rotating sigil rings.
  All of it respects `prefers-reduced-motion`.
- **A living arena** — bobbing foes with velocity lean, footstep dust, rift
  shifts that rearrange the entire floor plan every five waves, ambient motes
  tinted by the act.

## ⚙️ Tech stack

- **Next.js 16** (App Router) + **TypeScript 5** + **Tailwind CSS 4**
- **Canvas 2D engine** (~5,600 lines): fixed-timestep simulation, dead-flag
  entities with in-place compaction (zero per-frame allocation), squared-
  distance hot paths, cached gradients, flow-field pathfinding, and a
  throttled 30 Hz DOM-ref HUD (no React re-render on the hot path)
- **Zustand** for UI state, **Web Audio API** for all sound
- **localStorage** persistence — no database, no backend, no telemetry

```
src/
  game/
    content.ts     # spells, resonances, enemies, bosses, biomes, meta save,
                   #   the attunement + elite + tyrant scaling curves
    engine.ts      # the simulation: waves, casts, merges, bosses, juice
    audio.ts       # procedural synth: adaptive score + every SFX voice
    evolutions.ts  # 22 spell transmutations, filtered to equipped spells
    store.ts       # Zustand store (meta / settings / overlays)
  components/game/
    GameShell.tsx  # HUD + canvas host + overlay wiring
    screens.tsx    # menu, Reliquary, Arcanum, settings, pause, game over
    overlays.tsx   # evolution / spell offer / sacrifice merge / end credits
    TouchControls.tsx, icons.tsx, GameErrorBoundary.tsx
  app/
    page.tsx       # the single route (client-only game shell)
    globals.css    # the design system
public/art/
    cover.png      # the ONE image the game ships
```

## 🚀 Getting started (VS Code friendly)

Requires [Bun](https://bun.sh) ≥ 1.1 (or npm/node — swap the commands
accordingly).

```bash
bun install       # install dependencies
bun run dev       # dev server on http://localhost:3000
```

Recommended VS Code extensions are suggested automatically (ESLint, Tailwind
IntelliSense, Prettier) — see `.vscode/extensions.json`. Format-on-save and
ESLint auto-fix are preconfigured in `.vscode/settings.json`.

### Quality gates

```bash
bun run lint        # ESLint (Next.js + TypeScript rules)
bun run typecheck   # tsc --noEmit
```

## 🌐 Deploy to GitHub Pages

The repo ships a ready workflow (`.github/workflows/deploy.yml`):

1. Push this repo to GitHub (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Push (or run the workflow manually). It installs, lints, type-checks,
   builds the static export and deploys — your game lands at
   `https://<user>.github.io/<repo>/`.

The static build runs in export mode with a base path matching your repo name
(`BUILD_MODE=pages`, `BASE_PATH=/<repo>`); local dev and the standalone server
build are unaffected.

### Manual static build

```bash
BUILD_MODE=pages BASE_PATH=/my-repo NEXT_PUBLIC_BASE_PATH=/my-repo bun run build:pages
# → static site in ./out (serve it anywhere)
```

For a user-root site (`user.github.io`) omit the base-path variables entirely.

### Self-hosting (Node / Bun)

```bash
bun run build   # standalone server build → .next/standalone
bun run start
```

## 🎼 The Score

Every sound is an oscillator — **zero audio files**. An act-tinted drone and
plucked ladder calm down in the menu and sharpen with combat intensity; boss
fights get their own three-arc theme (entry sting → enrage war-drone at half
health → collapse on the kill), all summed through a master compressor so the
mix reads loud and dramatic at any volume setting.

## 🛠️ Design notes

- **One image on purpose.** Beyond the cover, every visual that wants art —
  boss sigils, Arcanum covers — is seeded, deterministic SVG generated at
  runtime. Same seed, same art; reroll for a new one.
- **Matched curves, not walls.** Player power and enemy HP ride curves of the
  same family; elites trade raw HP for a damage-taken bonus; bosses anchor to
  your own growth. The result: magic always feels powerful, and death always
  feels earned.
- **Mandatory tributes, optional everything else.** The every-5-wave tribute
  gate must be claimed (by design), but spell offers can be skipped and
  merges preview before you commit.
- **Bosses gain attacks, never just speed.** Phase two adds a new pattern or
  arm to every tyrant — the Dead Cells rule.
- **Difficulty is visible.** An act threat meter fills the wave plate as the
  tyrant approaches, and Rift Mercy's current value is always on the HUD
  when enabled.

## 📜 License

[MIT](./LICENSE) — fork it, mod it, ship it.
