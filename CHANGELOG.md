# Changelog

All notable changes to **Archmage — Rift Survivor** are documented here.
The game itself reports the live patch on its menu screen.

## Patch 11.0 — The Umbral Requiem

The dark-arcane rebrand, the loud score, and the strict drop economy.

### Thematic rebrand — the black-grimoire register
- **Every spell renamed** (ids unchanged, saves unaffected): Pyroclasm,
  Gravefrost, Wraithbolt, Gravewarden, Umbral Passage, Lance of Judgment,
  Chronoshroud, Null Rift, Hexweave Fan, Crimson Requiem, Blightspore,
  Soulscythe, Dirge Nova — each with a new tagline and description.
- **Every foe renamed**: Gutter Ghoul, Ossuary Archer, Gravemote, Ashfiend,
  Gloom Skitter, Rustbound Knight, Shroud Stalker, Pyrehusk, Umbra Cultist,
  Bone Colossus, Abyssal Lancer, Errant Wraith, Bonespeaker, Tempest Herald,
  Nightmare Shade, Chronowraith, Corpseweaver, Voidcage Golem, Nullmaw Beast.
- **Every tyrant renamed**: Malgrym the Maw of Ruin, Ashgorim the Unquenched
  Pyre, Sylthara the Reaving Waltz, Ysolth the Hollow Hour, Mordrax the First
  Sundering (boss ids and kits untouched — 10.2's five distinct brains live on).
- **Every act renamed**: The Sunless Vestibule, The Cinder Labyrinth, The
  Drowned Necropolis, The Silent Sepulcher, The Heart of the Abyss, The
  Endless Dirge.
- **All 13 element icons redrawn** to match the lore — hellmouth flames,
  coffin-slab grave-ice, gallows sparks, ossuary tombstone wards, umbral
  archways, wrathlight shafts, shrouded hourglasses, rift tears, hexagram
  eyes, thorn-struck tithe drops, wilted blooms, reaping crescents and
  tolling bells.

### Audio engineering — loud, dramatic, boss-aware
- **Master-bus DynamicsCompressor** added (industry-standard loudness stage)
  and the music bus raised to **unity** — the score is dramatically louder
  with zero hard clipping. Default music volume raised to 85.
- **Distinct boss-encounter music triggers**, engine-driven:
  - **ENTRY** — the big low sting + bright cutoff + kick ostinato (480ms) +
    tremolo saw + a darker PHRYGIAN pluck ladder replacing the pentatonic.
  - **ENRAGE** (below half HP) — the ostinato accelerates to 360ms and a
    dissonant **tritone war-drone** (root × flat-fifth saws) rises under
    the fight.
  - **DEATH** — the theme collapses instantly back to combat intensity
    (no more waiting for the next wave).
- **Repairs**: the music bus now adopts the *current* intensity cutoff when
  the score spins up mid-fight (was hardcoded 620 Hz); the ostinato tempo is
  proper state so intensity flapping can never double-schedule beats.

### VFX & animation overhaul
- **Every projectile flies its own distinct silhouette** with an additive
  glow pass: Pyroclasm is a layered comet with a streaming flame tail,
  Gravefrost a faceted sliver with a refracted core line, Null Rift a black
  heart wrapped in rotating accretion arms, Hexweave Fan a spinning rune knot
  with an orbiting familiar mote, Crimson Requiem a barbed javelin trailing
  blood mist, Blightspore a throbbing seed sack, Soulscythe twin crescents
  with gale streaks.
- **Wrathlight beams** gain a glow halo, a bright core and an animated dash
  pass that travels down the shaft.
- **Resonance detonations** bloom into a triple expanding ring (both element
  colors + the white seam), a 34-particle two-color storm with white-hot
  sparks, and a heavier hit-stop.
- **Pyroclasm blasts** detonate in triple rings (shock / fire crown /
  white-hot core) with an ember shower and a micro hit-stop.
- **Rings expand on an eased curve** (fast bloom, smooth melt) and every HUD
  bar glides on an eased cubic-bezier instead of stepping linearly.

### Strict drop economy — exactly one drop type per wave
- Each wave resolves **exactly ONE drop type** — spell, heart, resonance or
  tribute — in priority order: tribute waves (5/15/25/35/45) pay through the
  end-of-wave gate; waves 9/19/29/39/49 field a **resonance orb**; the
  scheduled spell tear lands every 3–5 waves; a **heart** forms when the
  mage bleeds below 70% HP. Unclaimed orbs **dissolve at wave end** — no drop
  type ever bleeds into the next wave. Rift shrines never spawn on tribute
  or resonance waves.
- **Spell drop rates nerfed another flat −10%** (compounding the 10.0 nerf:
  19% reabsorption chance per scheduled tear).
- **Spell tears no longer heal** — hearts are the dedicated mend, restoring
  25% max HP on touch with their own crimson orb silhouette.
- **Resonance orbs demand a sacrifice**: touching one opens the merge tithe
  — sacrifice **exactly two bound spells** and they fuse into one merged slot
  (the old end-of-wave merge intermission is gone; the wave resumes the
  moment the tithe resolves). The Fateweaver autopilot hunts resonance orbs,
  grabs hearts while wounded, and auto-resolves the tithe.

### Interface
- **Icon status chips removed** from the interface entirely (no glyph
  notifications, no decay bars).
- **Cooldown + aether-cost indicators on every spell toggler**: the desktop
  bar keeps its draining cooldown veil + live cost badge; the touch spell
  strip gains both, plus a cooldown veil on the SPELL cycle button.
- **Dash cooldown display** on both layouts — a draining veil on the touch
  DASH button and the desktop SPC slot.
- **Fullscreen enforcer on the landing page** — one prominent button engages
  edge-to-edge fullscreen on ANY device (live state, graceful fallback where
  unsupported). The old in-game FULL toggle is removed; ENTER THE RIFT still
  auto-requests fullscreen on touch as the gesture-path fallback.

## Patch 10.2 — The Thinking Rift

The AI & procedural overhaul patch.

### Boss encounters — five distinct tyrants
- **Every boss completely redesigned** with its own bespoke behavior set (the
  shared charge/volley loop is gone):
  - **Vorrac, the Gate-Sorrow** — the *Stampede Charger*: stalks, then chains
    2–3 re-aimed lane dashes (3 when enraged) with aimed fan volleys between.
  - **Korrath, the Ash-Eaten** — the *Immovable Juggernaut*: never charges and
    never strafes; walks you down, slams **expanding shockwave rings** you must
    space against, and **sheds cinder imps** throughout the fight.
  - **Solenne, the Last Note** — the *Blade Dancer*: orbits at fencing range on
    a **metronome tempo** of triple-bolt fans that accelerates as she bleeds,
    then chains lunges straight through your position.
  - **Ysed, the Hour-Cradled** — the *Blink Fortress*: anchors and channels
    **rotating twin-arm spiral barrages**, then blinks to a fresh anchor
    around you with a radial landing pulse (triple arm when enraged).
  - **Maelthar, the First Sundering** — the *Apex Storm*: cycles all three
    signatures — stampede charges, a multi-arm spiral storm, and a **gravity
    rift** that drags you in before the nova release.
- **All boss spawn cutscenes and message boxes removed**: no title card, no
  spawn banner, no enrage banner, no felled banner — tyrants arrive with only
  an audio roar, a sting, a screen shake, and honest in-arena telegraphs
  (windup rings, dash puffs, spiral arms, shockwave bands). Kills read
  through the death burst + a floating score; the HUD boss plate keeps the
  name and HP bar.
- Enrage (below half HP) follows the Dead Cells rule everywhere: each pattern
  **adds** (a third charge, denser slams, doubled tempo, an extra arm, a wider
  nova) instead of merely speeding up.

### Fateweaver & Archmage Mode
- **Line of Sight is now enforced**: the autopilot raycasts against pillars
  before targeting — it never casts at enemies behind walls, never lobs weave
  bolts into geometry, and repositions instead of wasting mana. (LoS-checked
  early-out keeps the raycast cost negligible.)
- **Intensity scaled back**: cast decisions run at a deliberate 0.30s cadence
  (was 0.14s), the value threshold is stricter, a 12% mana reserve is kept
  for panic tools, and wounded pilots kite wider and blink earlier.
- **The Fateweaver** (the decision brain) is context-aware:
  - *Casting*: hunts primed **resonances** (+score for the detonating
    element), respects per-spell range bands, cluster sizes and close-count
    panic value — no more ability spam.
  - *Surge discipline*: a full Weave meter is held until it matters (boss up,
    pack closing, or ~5s held) instead of being dumped instantly.
  - *Boons*: tribute rewards, evolutions, spell offers and merges are now
    ranked against a live **FateContext** snapshot — wounded mages take
    armor/HP, mana-starved builds take focus economy, pre-boss gates spike
    offense, saturated stats are skipped, and lopsided loadouts chase the
    missing role (an AoE-less build hunts AoE offers; the last AoE tool is
    protected from merging).

### World generation
- **Pathfinding hardened** so terrain can never trap a foe: the flow-field
  descent **cannot corner-cut** (diagonal steps require both orthogonal
  neighbours open), cell inflation rose 10→14px, stuck recovery runs on a
  0.6s/14px window with **escalating kicks**, and four consecutive stuck
  windows trigger a **rift-hop** — a tiny relocation to the open spawn ring.
- **The world grew to 2560×1600** (+67% area) with all five original
  archetypes rescaled to fill it, and **three new layout archetypes** —
  *Spiral* (an archimedean whorl), *Crosswall* (a broken X of stepped rays),
  and *Scatter* (a drifting field of free shards) — for eight floor plans.
- **Rift Seeds now drive the monster ecology**: `poolBias` derives a stable
  per-seed weight multiplier for every foe type (two "featured" stars surge
  2.4×, some fade) applied to every wave composition and boss-wave add roll —
  changing the seed reshapes **both** the map layout and the enemy pool, while
  unlock waves keep progression pacing intact.

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
