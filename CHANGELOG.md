# Changelog

All notable changes to **Archmage — Rift Survivor** are documented here.
The game itself reports the live patch on its menu screen.

## Patch 10.1 — The Clear Horizon

The foundational controls & feel patch.

### Viewport & camera
- **Fullscreen on mobile**: entering the rift on a touch device now requests
  browser fullscreen automatically (the tap itself is the user gesture the
  API demands); a **FULL** button joins the touch action row for manual exit
  / re-entry. iPhone Safari (no element fullscreen) declines silently.
- **Camera widened for maximum map visibility**: the per-device FOV floors
  rose (phone 1080×640 → 1180×700, tablet → 1320×780, desktop → 1440×840) —
  threats telegraph earlier and the 1920×1280 arena reads true.
- Landscape remains enforced on touch devices with the rotate guard.

### Controls & UI
- Single **FIRE** button + spell-toggle mechanism (cycle button and tap-to-
  select strip) — confirmed final; no fire joystick anywhere.
- The Rite of Control teaches only the device it runs on (keyboard/mouse vs
  touch gestures) — never both.
- **HUD 10% smaller by default**, with a new **HUD-scale slider** in
  Settings → Graphics (75%–125%) covering vitals, wave plate, spell bar and
  status chips.
- **Icon status notifications**: the text-heavy primed/attuned lines are now
  compact glyph chips — spell icon + pulsing `+` for a primed resonance,
  spell icon + bolt `+50%` for an attunement, each with its decay bar. Full
  sentences remain as aria-labels for screen readers.

### Balance
- **Global base difficulty lowered another 10%** (DIFFICULTY_MULT
  0.9 → 0.81): enemy HP, damage, wave budget, spawn cap and elite pressure
  are all gentler; speed untouched so the arena still feels the same.
- **Rift Mercy** confirmed progressive: tier 1 = 2%→4% within a run, tier 2
  = 6%→8%, +4% per further death — attack up, damage taken down, fewer and
  softer spawns. The tier can always be lowered by hand in Settings (AUTO /
  T1…Tn / OFF) if the rift becomes too kind.

## Patch 10.0 — The Sealed Rift

The endgame, audio and cross-device polish patch.

### Endgame — wave 50 and beyond
- Clearing the wave-50 tyrant now rolls an **end-credit sequence**: the run's
  deeds scroll as a cinematic credit roll ("YOU HAVE CLOSED THE RIFT") over
  the frozen arena, with a resolve chord scored for the moment.
- After the credits (skippable): the choice — **RETURN** (bank the triumph,
  classic eulogy) or **FIGHT** (the rift reopens).
- **Endless mode**: choosing FIGHT continues from wave 51 forever. New act —
  *The Hollow Echo* (own palette + darker musical root). Escalation compounds
  past the seal: wave budget +3.5%/wave, enemy HP +2.5%/wave, and every 10th
  wave a returning **Echo of** a tyrant (+22% stats per echo cycle, cycling
  the whole roster). Dying in the echo still banks the triumph.

### Cross-platform UI/UX
- Touch controls rebuilt into a **thumb-zone layout** with zero overlap:
  FIRE (84px) at the right-thumb home, SPELL beside it, SURGE above — while
  ARCHMAGE + PAUSE moved to a compact top-right row. On short landscape
  phones the old 2×2 action grid collided with the attack cluster (the
  reference-screenshot bug); the new geometry cannot.
- DASH now docks beside the move stick — one action per thumb zone.
- **Rite of Control teaches the device it runs on**: keyboard/mouse rite on
  desktop, touch-gesture rite on phones/tablets. Never both.
- HUD readability pass (heavier labels, stronger plate contrast) and
  responsive tier retune for the new layout.

### Movement & feel
- Refined movement: faster acceleration ramp with a softer drag floor
  (stride in ~0.12s, weight instead of ice), **turn-assist** braking so
  direction changes bite, a smoothed **velocity lean** on the mage's body,
  and stride dust particles at speed.

### Balance
- **Magic spell drop rate nerfed exactly 10%**: every scheduled spell tear
  has a flat 10% chance to be reabsorbed by the rift before it forms —
  expected drops are exactly 0.9× the previous rate, globally.

### Audio
- The score is **mixed loud**: music bus headroom ×0.5 → ×0.85, default
  music volume 55 → 70, richer drone (octave-crown layer).
- **Boss music triggers the instant a tyrant enters the arena** — a driving
  two-tone minor-third ostinato at 480ms + tremolo saw layer + immediate
  filter jump; the sting gained timpani + brass riser.
- Web Audio robustness: suspended-context guards stop note pile-ups when the
  tab is backgrounded (burst-on-resume bug), tremolo layers clean up on
  every exit path.

## Patch 9.0 — The Expanded Rift

Forced landscape + rotate guard; 1920×1280 world with follow-camera,
look-ahead, device-tailored FOV and pressure zoom; fire joystick replaced by
a hold-to-FIRE button + SPELL cycle + action grid; wind & sonic spells
(13 elements, 78 resonances, 19 foe types); global −10% spawn pressure;
Rift Mercy per-death ladder with tier selection; flow-field pathfinding over
five seed-driven arena archetypes; Archmage Mode on every device.

## Patch 8.0 — The Guided Hand

Fixed twin-stick housings (no floating joysticks); hold-to-FIRE right stick;
**Archmage Mode** — a full autopilot (kiting, dodging, pickup magnets,
situational spell selection, auto-picks for every choice overlay); human
input always overrides.

## Patch 7.0 — The Pure Arcanum

Story and cutscenes excised completely; Codex reborn as **The Arcanum**
(Spellbook, Resonances, Bestiary with first-kill discovery, Tyrants,
Records — with procedural seeded cover art); adaptive three-intensity score
with boss heartbeat; elite HP bars, damage-number toggle, act threat meter;
production readiness (README, LICENSE, VS Code profile, GitHub Pages
workflow, dual-mode build); repo slimmed to one image asset.

## Patch 6.0 — The Honed Blade (and earlier)

Balance pass (−10% difficulty), mandatory tribute gates, merge intermissions,
boss title cards over live combat, Rift Mercy, wave flavor, settings screen,
and the original replication of the game into Next.js with 13 engine-level
bug fixes and allocation-free hot paths.
