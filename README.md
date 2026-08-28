# ARCHMAGE — Rift Survivor

A **pure arcade roguelike** that runs entirely in the browser. No accounts, no servers, no loading screens between you and the fight — one cover image, everything else generated at runtime.

> Eleven elements. Fifty-five resonances. Five shuffled tyrants. Adaptive procedural music. Zero interruptions.

![Patch](https://img.shields.io/badge/patch-7.0_%22The_Pure_Arcanum%22-f5c96b) ![Engine](https://img.shields.io/badge/engine-Canvas%202D%20%C2%B7%2060fps-9a7bff) ![Audio](https://img.shields.io/badge/audio-Web%20Audio%20API%20%C2%B7%20fully%20synthesized-43e8d8) ![Assets](https://img.shields.io/badge/image%20assets-1%20file-7ed957)

---

## The Game

You are the last Archmage. Fifty waves stand between you and the sealed rift, split into five biomes of ten. Clear the fiftieth and the credits roll — then choose: **Return** with the triumph, or **Fight** into the endless echo (waves 51+, escalating forever). Everything scales, everything shuffles, and nothing interrupts the fight — no cutscenes, no story, no filler.

| System | What it does |
| --- | --- |
| **13 elements / 78 resonances** | Cast two different elements within 1.5 s to discover a resonance (combo). All 78 live in the Arcanum, locked until you find them. |
| **Spell drops — every 3–5 waves (strict, −10 %)** | A spell tear floats into the arena: walk over it for **+10 % max-HP heal** and a 3-card spell offer. Each scheduled tear has a flat 10 % chance to be reabsorbed by the rift (Patch 10.0 drop-rate nerf). "Back to Game" skips the swap; the heal is yours either way. |
| **Merges — every 10 waves (strict)** | One wave before each boss: fuse two single spells into one merged slot that casts both in succession (fire + ice → *Steam Cloud*). |
| **Tribute gates — every 5 waves** | Three scalable stat rewards (+health, critical damage, armor, …). Selection is **mandatory** — the gate does not close until you choose. |
| **Five shuffled tyrants** | The seed permutes boss order every run — Maelthar can be your wave-10 gatekeeper or your wave-50 executioner. Each introduces itself with a procedural animated sigil **over live combat**. Below half health they enter phase two and gain a new spiral-storm attack. |
| **Endgame — wave 50 credits + endless** | Seal the rift and the end-credit sequence rolls your run's deeds; then **RETURN** (bank the triumph) or **FIGHT** — the endless echo: *The Hollow Echo* act, escalating budget/HP, and **Echo of** tyrants (+22 %/cycle) every 10th wave until you fall. |
| **Rift Mercy** | Optional per-death assist ladder (Hades God-Mode style): tiers bank with every fall, clear on triumph; manual tier selection in Settings. Live readout on the HUD. |
| **The Sanctum** | Spend aether shards on four permanent tracks (Vitality / Power / Focus / Swiftness), 6 levels each on a quadratic cost curve. |
| **The Arcanum** | The compendium: Spellbook, Resonances, **Bestiary that unlocks on first kill**, Tyrants, and your lifetime Records — with a rerollable procedural cover sigil. |
| **Adaptive music** | Fully synthesized (Web Audio API) and **mixed loud**: an act-tinted drone + pentatonic plucks that calms in the menu, sharpens in combat, and — the instant a tyrant enters — jumps to a driving minor-third ostinato + tremolo boss theme. Every SFX is an oscillator — zero audio files. |

### Controls

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

Touch devices get a thumb-zone layer: a docked MOVE stick (drag anywhere), a
hold-to-FIRE button with auto-targeting, SPELL cycle + SURGE beside/above it,
DASH next to the stick, ARCHMAGE + PAUSE in a compact top-right row, and a
tap-to-select spell strip. Portrait phones get a rotate guard — the game is
played in landscape.

### Accessibility & settings

Master / music / SFX volume sliders, graphics quality presets (render resolution, particle budget), screen-shake toggle, **damage-number toggle**, three aim-assist levels, Rift Mercy, and a confirm-guarded full progress reset. `prefers-reduced-motion` is respected throughout.

---

## Tech stack

- **Next.js 16** (App Router) + **TypeScript 5** + **Tailwind CSS 4**
- **Canvas 2D engine** (~3,600 lines): dead-flag entities with in-place compaction (zero per-frame allocation), squared-distance hot paths, cached gradients, a throttled 30 Hz DOM-ref HUD (no React re-render on the hot path)
- **Zustand** for UI state, **Web Audio API** for all sound
- **localStorage** persistence — no database, no backend, no telemetry

```
src/
  game/
    content.ts     # spells, resonances, enemies, bosses, biomes, meta save
    engine.ts      # the simulation: waves, casts, merges, bosses, juice
    audio.ts       # procedural synth: adaptive score + every SFX voice
    evolutions.ts  # 22 spell transmutations, filtered to equipped spells
    store.ts       # Zustand store (meta / settings / overlays)
  components/game/
    GameShell.tsx  # HUD + canvas host + overlay wiring
    screens.tsx    # menu, Sanctum, Arcanum, settings, pause, game over
    overlays.tsx   # evolution / spell offer / merge / boss title card
    TouchControls.tsx, icons.tsx, GameErrorBoundary.tsx
  app/
    page.tsx       # the single route (client-only game shell)
    globals.css    # the design system
public/art/
    cover.png      # the ONE image the game ships
```

## Getting started (VS Code friendly)

Requires [Bun](https://bun.sh) ≥ 1.1 (or npm/node — swap the commands accordingly).

```bash
bun install       # install dependencies
bun run dev       # dev server on http://localhost:3000
```

Recommended VS Code extensions will be suggested automatically (ESLint, Tailwind IntelliSense, Prettier) — see `.vscode/extensions.json`.

### Quality gates

```bash
bun run lint        # ESLint (Next.js + TypeScript rules)
bun run typecheck   # tsc --noEmit
```

## Deploy to GitHub Pages

The repo ships a ready workflow (`.github/workflows/deploy.yml`):

1. Push this repo to GitHub (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Push (or run the workflow manually). It installs, lints, type-checks, builds the static export and deploys — your game lands at `https://<user>.github.io/<repo>/`.

The static build runs in export mode with a base path matching your repo name (`BUILD_MODE=pages`, `BASE_PATH=/<repo>`); local dev and the standalone server build are unaffected.

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

## Design notes

- **One image on purpose.** Beyond the cover, every visual that wants art — boss sigils, Arcanum covers — is seeded, deterministic SVG generated at runtime. Same seed, same art; reroll for a new one.
- **Mandatory tributes, optional everything else.** The every-5-wave tribute gate must be claimed (by design), but spell offers can be skipped and merges preview before you commit.
- **Bosses gain attacks, never just speed.** Phase two adds a double spiral storm — the Dead Cells rule.
- **Difficulty is visible.** An act threat meter fills the wave plate as the tyrant approaches, and Rift Mercy's current value is always on the HUD when enabled.

## License

[MIT](./LICENSE) — fork it, mod it, ship it.
