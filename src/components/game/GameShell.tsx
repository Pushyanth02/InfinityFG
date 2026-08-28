"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArchmageEngine, GamePhase, HudData, MergeOffer, RunStats, SpellOffer } from "@/game/engine";
import {
  actForWave, computeBonuses, effectiveMercyTier, ElementId, SPELLS, STARTER_SPELLS,
} from "@/game/content";
import { EvolutionDef } from "@/game/evolutions";
import {
  bestEvolutionId, bestMergePair, bestRewardId, bestSpellPlacement, placementIsUpgrade,
} from "@/game/autopick";
import { useArchmageStore, sfx } from "@/game/store";
import { RotateIcon, SpellIcon, UiIcon } from "./icons";
import {
  Corners, GameOverScreen, MenuScreen, PauseOverlay, RewardOverlay, SanctumScreen, SettingsScreen, ArcanumScreen,
} from "./screens";
import { BossTitleCard, EndCreditsOverlay, EvolutionOverlay, MergeOverlay, SpellOfferOverlay } from "./overlays";
import { TouchControls } from "./TouchControls";
import { useIsPortraitTouch, useIsTouchDevice } from "./useIsTouchDevice";
import { BOSS_DEFS } from "@/game/content";

/* boss ids for routing bestiary discovery callbacks */
const BOSS_IDS = new Set<string>(BOSS_DEFS.map((b) => b.id));

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ArchmageEngine | null>(null);

  /* ---------------------------- store (state mgmt) ----------------------------
     Patch 7.0: all app state lives in the Zustand store — meta/settings,
     phase, screen, banners, overlays. The story layer (cutscene, dialogue,
     death quotes) is fully removed. Only the 30 Hz HUD payload still writes
     straight to DOM refs (zero React re-renders by design). */
  const meta = useArchmageStore((s) => s.meta);
  const screen = useArchmageStore((s) => s.screen);
  const phase = useArchmageStore((s) => s.phase);
  const banner = useArchmageStore((s) => s.banner);
  const rewardOffer = useArchmageStore((s) => s.rewardOffer);
  const spellOffer = useArchmageStore((s) => s.spellOffer);
  const mergeOffer = useArchmageStore((s) => s.mergeOffer);
  const evolutions = useArchmageStore((s) => s.evolutions);
  const bossIntro = useArchmageStore((s) => s.bossIntro);
  const stats = useArchmageStore((s) => s.stats);
  const settingsOpen = useArchmageStore((s) => s.settingsOpen);
  const seed = useArchmageStore((s) => s.seed);
  /* Patch 8.0 — Archmage Mode (mobile autopilot toggle) */
  const autoMode = useArchmageStore((s) => s.autoMode);
  /* Patch 9.0 — forced landscape: portrait touch devices get the rotate
     guard, and a live run auto-pauses so nothing dies mid-rotation. */
  const portraitTouch = useIsPortraitTouch();
  /* Patch 9.0 — live selected slot (drives the mobile SPELL button icon). */
  const [selectedSlot, setSelectedSlot] = useState(0);
  /* Patch 10.0 — end-credit epilogue stats (wave-50 triumph). */
  const [epilogueStats, setEpilogueStats] = useState<RunStats | null>(null);
  /* Patch 9.0 — effective Rift Mercy tier from the meta ladder (recomputed
     whenever the settings toggle, banked deaths, or manual tier change). */
  const mercyTier = effectiveMercyTier(meta);

  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta]);

  /* Live equipped-spell entries for the spell bar — updated from the HUD
     payload. Initialized to the starter set so the first paint matches the
     engine's constructor before any HUD frame has been pushed. Each entry
     can be a single spell (ElementId), a merged pair ({ merged: [...] }),
     or null (empty slot awaiting a drop). */
  const [equippedIds, setEquippedIds] = useState<(ElementId | { merged: ElementId[] } | null)[]>(
    () => STARTER_SPELLS as ElementId[],
  );

  /* ------------------------------ HUD dom refs ------------------------------ */
  const hpFill = useRef<HTMLDivElement | null>(null);
  const hpText = useRef<HTMLSpanElement | null>(null);
  const mpFill = useRef<HTMLDivElement | null>(null);
  const mpText = useRef<HTMLSpanElement | null>(null);
  const mercyRow = useRef<HTMLDivElement | null>(null);
  const mercyText = useRef<HTMLSpanElement | null>(null);
  const waveText = useRef<HTMLDivElement | null>(null);
  const actText = useRef<HTMLDivElement | null>(null);
  const foesText = useRef<HTMLSpanElement | null>(null);
  const scoreText = useRef<HTMLSpanElement | null>(null);
  const timeText = useRef<HTMLSpanElement | null>(null);
  const slotRoots = useRef<(HTMLButtonElement | null)[]>([]);
  const slotCds = useRef<(HTMLDivElement | null)[]>([]);
  const slotCosts = useRef<(HTMLSpanElement | null)[]>([]);
  const slotEvos = useRef<(HTMLSpanElement | null)[]>([]);
  const dashFill = useRef<HTMLDivElement | null>(null);
  const resWrap = useRef<HTMLDivElement | null>(null);
  const resFill = useRef<HTMLDivElement | null>(null);
  const resLabel = useRef<HTMLSpanElement | null>(null);
  const attWrap = useRef<HTMLDivElement | null>(null);
  const attFill = useRef<HTMLDivElement | null>(null);
  const attLabel = useRef<HTMLSpanElement | null>(null);
  const bossWrap = useRef<HTMLDivElement | null>(null);
  const bossFill = useRef<HTMLDivElement | null>(null);
  const bossLabel = useRef<HTMLDivElement | null>(null);
  const weaveWrap = useRef<HTMLDivElement | null>(null);
  const weaveFill = useRef<HTMLDivElement | null>(null);
  const weaveLabel = useRef<HTMLSpanElement | null>(null);
  const threatSegs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastActName = useRef("");

  /* touch detection — drives whether the virtual twin-stick layer renders */
  const isTouch = useIsTouchDevice();

  /* weave / surge mirror refs so TouchControls can read live state without
     subscribing to HUD callbacks (which would force re-renders). */
  const weaveRef = useRef(0);
  const surgeActiveRef = useRef(false);
  /* Patch 9.0 — selected-slot ref mirror (see onHud). */
  const selRef = useRef(0);

  const onHud = useCallback((h: HudData) => {
    const setW = (el: HTMLDivElement | null, frac: number) => {
      if (el) el.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    };
    setW(hpFill.current, h.hp / h.maxHp);
    setW(mpFill.current, h.mana / h.maxMana);
    if (hpText.current) hpText.current.textContent = `${Math.ceil(h.hp)} / ${h.maxHp}`;
    if (mpText.current) mpText.current.textContent = `${Math.floor(h.mana)} / ${h.maxMana}`;
    /* Patch 6.0→9.0: live Rift Mercy readout — the per-death ladder tier
       plus the live assist percentage, so the feature stays legible. */
    if (mercyRow.current && mercyText.current) {
      if (h.mercy !== null && h.mercy > 0) {
        mercyRow.current.style.display = "flex";
        mercyText.current.textContent = `T${h.mercyTier} · ${Math.round(h.mercy * 100)}%`;
      } else {
        mercyRow.current.style.display = "none";
      }
    }
    if (waveText.current) waveText.current.textContent = String(h.wave).padStart(2, "0");
    if (actText.current && lastActName.current !== h.actName) {
      lastActName.current = h.actName;
      actText.current.textContent = h.actName;
    }
    if (foesText.current) foesText.current.textContent = `${h.enemiesLeft} foes`;
    if (scoreText.current) scoreText.current.textContent = h.score.toLocaleString();
    if (timeText.current) {
      const m = Math.floor(h.timeSec / 60);
      const s = Math.floor(h.timeSec % 60).toString().padStart(2, "0");
      timeText.current.textContent = `${m}:${s}`;
    }
    for (let i = 0; i < h.spells.length; i++) {
      const sp = h.spells[i];
      const root = slotRoots.current[i];
      const cd = slotCds.current[i];
      const cost = slotCosts.current[i];
      const evo = slotEvos.current[i];
      const def = SPELLS[sp.id];
      /* detect equipped-set changes (drop pickup / replace / merge) and
         refresh the React spell-bar so icons + costs reflect the new spells. */
      setEquippedIds((prev) => {
        const next = h.spells.map((s) => {
          if (s.empty) return null;
          if (s.merged && s.merged.length >= 2) return { merged: s.merged };
          return s.id;
        });
        if (prev.length === next.length && prev.every((p, j) => {
          const q = next[j];
          if (p === q) return true;
          if (p && q && typeof p !== "string" && typeof q !== "string" && p.merged && q.merged) {
            return p.merged.length === q.merged.length && p.merged.every((m, k) => m === q.merged[k]);
          }
          return false;
        })) return prev;
        return next;
      });
      if (cd) {
        cd.style.height = `${sp.cdFrac * 100}%`;
        cd.style.opacity = sp.cdFrac > 0.01 ? "1" : "0";
      }
      if (cost) {
        if (sp.empty) {
          cost.textContent = "—";
          cost.style.color = "#6a5a99";
        } else if (sp.hpCost) {
          cost.textContent = `${sp.cost}♥`;
          cost.style.color = sp.affordable ? "#ff8ba0" : "#6e3a46";
        } else if (sp.merged && sp.merged.length >= 2) {
          cost.textContent = String(sp.cost);
          cost.style.color = sp.affordable ? "#ffe9ad" : "#ff8ba0";
        } else {
          cost.textContent = sp.cost === 0 ? "0" : String(sp.cost);
          cost.style.color = sp.cost === 0 ? "#6bf0c2" : sp.affordable ? "#9fd8ff" : "#ff8ba0";
        }
      }
      if (evo) {
        if (sp.empty) {
          evo.style.opacity = "0.2";
          evo.textContent = "◆";
        } else if (sp.merged && sp.merged.length >= 2) {
          evo.style.opacity = "1";
          evo.textContent = "⧉";
        } else {
          evo.style.opacity = sp.evolved ? "1" : "0";
          evo.textContent = "◆";
        }
      }
      if (root) {
        const sel = h.selected === i;
        let color: string;
        if (sp.empty) color = "#6a5a99";
        else if (sp.merged && sp.merged.length >= 2) color = "#ffe9ad";
        else color = def.color;
        root.style.borderColor = sel ? color : "rgba(154,123,255,0.28)";
        root.style.boxShadow = sel ? `0 0 16px ${color}66, inset 0 0 12px ${color}22` : "none";
        root.style.opacity = sp.empty ? "0.5" : (sp.affordable || sp.cdFrac > 0 ? "1" : "0.55");
      }
    }
    if (dashFill.current) dashFill.current.style.height = `${h.dashFrac * 100}%`;
    if (resWrap.current && resFill.current && resLabel.current) {
      if (h.resonance) {
        const def = SPELLS[h.resonance.id];
        resWrap.current.style.opacity = "1";
        resFill.current.style.width = `${h.resonance.frac * 100}%`;
        resFill.current.style.background = def.color;
        resLabel.current.textContent = `${def.name} primed — cast another element`;
        resLabel.current.style.color = def.color;
      } else {
        resWrap.current.style.opacity = "0";
      }
    }
    if (attWrap.current && attFill.current && attLabel.current) {
      if (h.attune) {
        const def = SPELLS[h.attune.id];
        attWrap.current.style.opacity = "1";
        attWrap.current.style.borderColor = def.color + "88";
        attFill.current.style.width = `${h.attune.frac * 100}%`;
        attFill.current.style.background = def.color;
        attLabel.current.textContent = `${def.name} attuned — free casts +50% power`;
        attLabel.current.style.color = def.color;
      } else {
        attWrap.current.style.opacity = "0";
      }
    }
    if (bossWrap.current && bossFill.current) {
      if (h.boss) {
        bossWrap.current.style.display = "block";
        bossWrap.current.style.opacity = "1";
        bossFill.current.style.width = `${h.boss.frac * 100}%`;
        if (bossLabel.current) bossLabel.current.textContent = h.boss.name;
      } else {
        bossWrap.current.style.opacity = "0";
        window.setTimeout(() => { if (bossWrap.current) bossWrap.current.style.display = "none"; }, 320);
      }
    }
    if (weaveFill.current && weaveLabel.current) {
      const surging = h.surge !== null;
      const frac = surging ? (h.surge as number) : h.weave;
      weaveFill.current.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
      weaveFill.current.style.background = surging
        ? "linear-gradient(90deg, #f5c96b, #ffe9ad)"
        : "linear-gradient(90deg, #8a5f1e, #f5c96b)";
      weaveFill.current.style.boxShadow = surging || h.weave >= 1
        ? "0 0 14px rgba(255,233,173,0.9)"
        : "0 0 8px rgba(245,201,107,0.4)";
      weaveLabel.current.textContent = surging
        ? `SURGE ${(frac * 6).toFixed(1)}s`
        : h.weave >= 1 ? (isTouch ? "SURGE READY" : "PRESS F") : `${Math.round(h.weave * 100)}%`;
      weaveLabel.current.style.color = surging || h.weave >= 1 ? "#ffe9ad" : "#f5c96b";
      if (weaveWrap.current) weaveWrap.current.classList.toggle("weave-full", h.weave >= 1 && !surging);
      weaveRef.current = h.weave;
      surgeActiveRef.current = surging;
    }
    /* Patch 9.0 — selected-slot mirror for the SPELL cycle button + strip
       highlight (cheap ref compare — setState only on real changes). */
    if (selRef.current !== h.selected) {
      selRef.current = h.selected;
      setSelectedSlot(h.selected);
    }
    /* Patch 7.0 — act threat meter: 4 rune segments fill toward the tyrant
       (RoR2-style visible pressure; the 4th pulses when the boss is due). */
    const lit = h.threat * 4 - 0.001;
    for (let i = 0; i < threatSegs.current.length; i++) {
      const el = threatSegs.current[i];
      if (el) {
        el.style.opacity = i < lit ? "1" : "0.18";
        el.style.boxShadow = i < lit ? `0 0 8px ${i >= 3 ? "#ff4d6b" : "#f5c96b"}` : "none";
      }
    }
  }, [isTouch]);

  /* -------------------------- engine event callbacks -------------------------- */

  const onPhase = useCallback((p: GamePhase, payload?: { rewards?: import("@/game/content").UpgradeChoice[]; tiers?: Record<string, number>; stats?: RunStats }) => {
    const store = useArchmageStore.getState();
    store.setPhase(p);
    if (p === "intermission" && payload?.rewards) {
      store.setRewardOffer({
        rewards: payload.rewards,
        tiers: payload.tiers ?? {},
        wave: engineRef.current?.waveNumber ?? 0,
      });
    }
    if (p === "gameover" && payload?.stats) {
      store.applyRunResult(payload.stats);
    }
    /* Patch 10.0 — the end-credit epilogue: hold the stats snapshot for the
       credits overlay; RETURN banks them, FIGHT reopens the rift. */
    if (p === "epilogue" && payload?.stats) {
      setEpilogueStats(payload.stats);
    }
  }, []);

  const onComboFound = useCallback((key: string) => {
    useArchmageStore.getState().addComboFound(key);
  }, []);

  /* Patch 7.0 — bestiary discovery: the engine reports the first kill of
     each enemy type / boss per run; route it into the meta save so the
     Arcanum wakes the entry. */
  const onBestiary = useCallback((kind: string) => {
    const store = useArchmageStore.getState();
    if (BOSS_IDS.has(kind)) store.addBossSeen(kind);
    else store.addEnemySeen(kind as import("@/game/content").EnemyType);
  }, []);

  const onEvolution = useCallback((choices: EvolutionDef[]) => {
    useArchmageStore.getState().setEvolutions(choices);
  }, []);

  const chooseEvolution = useCallback((id: string) => {
    useArchmageStore.getState().setEvolutions(null);
    engineRef.current?.chooseEvolution(id);
  }, []);

  /* Patch 6.0 — mandatory tribute pick: clears the store state, applies the
     reward in the engine, and the wave router continues automatically. */
  const chooseReward = useCallback((id: string) => {
    useArchmageStore.getState().setRewardOffer(null);
    engineRef.current?.chooseReward(id);
  }, []);

  const onSpellOffer = useCallback((offer: SpellOffer) => {
    const equipped = (engineRef.current?.equippedSnapshot() ?? []) as (ElementId | { merged: ElementId[] } | null)[];
    useArchmageStore.getState().setSpellOffer({ pool: offer.pool, equipped });
  }, []);

  const chooseSpellOffer = useCallback((slot: number, spellId: ElementId) => {
    useArchmageStore.getState().setSpellOffer(null);
    engineRef.current?.chooseSpellDrop(slot, spellId);
  }, []);

  /* Patch 6.0 — "Back to Game": skip the spell swap, keep the heal. */
  const skipSpellOffer = useCallback(() => {
    useArchmageStore.getState().setSpellOffer(null);
    engineRef.current?.skipSpellOffer();
  }, []);

  const onMerge = useCallback((offer: MergeOffer) => {
    const equipped = (engineRef.current?.equippedSnapshot() ?? []) as (ElementId | { merged: ElementId[] } | null)[];
    useArchmageStore.getState().setMergeOffer({ slots: offer.slots, equipped });
  }, []);

  const chooseMerge = useCallback((slotA: number, slotB: number) => {
    useArchmageStore.getState().setMergeOffer(null);
    engineRef.current?.chooseMerge(slotA, slotB);
  }, []);

  /* Patch 6.0 — boss title card over live combat (no phase change). */
  const onBossIntro = useCallback((boss: import("@/game/content").BossDef, act: import("@/game/content").ActDef) => {
    useArchmageStore.getState().setBossIntro(boss, act.name);
  }, []);

  const clearBossIntro = useCallback(() => {
    useArchmageStore.getState().clearBossIntro();
  }, []);

  /* live settings propagation — engine reads aim assist / gfx per frame;
     the audio graph follows the volume sliders immediately. Patch 9.0: the
     Rift Mercy ladder (toggle / banked deaths / manual tier) pushes a fresh
     effective tier into the engine the moment it changes. */
  useEffect(() => {
    engineRef.current?.updateSettings(meta.settings);
    engineRef.current?.setMercyTier(effectiveMercyTier(meta));
    sfx.setVolumes(meta.settings.master, meta.settings.music, meta.settings.sfx);
  }, [meta.settings, meta.mercyDeaths, meta.mercyTierSel, mercyTier]);

  /* ------------------------------ run control ------------------------------ */

  const stopRun = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = null;
  }, []);

  const beginEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stopRun();
    const store = useArchmageStore.getState();
    store.clearRunState();
    store.setPhase("running");
    store.setScreen("menu");
    setEquippedIds(STARTER_SPELLS as ElementId[]);
    setEpilogueStats(null);
    const m = metaRef.current;
    engineRef.current = new ArchmageEngine({
      canvas,
      seed: seed.trim() || "rune-1000",
      bonuses: computeBonuses(m),
      knownCombos: m.combosFound,
      settings: m.settings,
      mercyTier: effectiveMercyTier(m),
      sfx,
      onPhase,
      onHud,
      onBanner: (title, sub, color) => useArchmageStore.getState().showBanner(title, sub, color),
      onComboFound,
      onBestiary,
      onEvolution,
      onSpellOffer,
      onMerge,
      onBossIntro,
    });
    /* dev-only QA hook — lets browser automation drive the engine directly */
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __archmage?: ArchmageEngine | null }).__archmage = engineRef.current;
    }
  }, [seed, stopRun, onPhase, onHud, onComboFound, onBestiary, onEvolution, onSpellOffer, onMerge, onBossIntro]);

  const startRun = useCallback(() => {
    sfx.unlock();
    /* Patch 7.0: no intro cutscene — straight into the arena. */
    beginEngine();
  }, [beginEngine]);

  useEffect(() => () => stopRun(), [stopRun]);

  /* visibility safety-net — pause whenever the tab is hidden mid-run. */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && engineRef.current && (phase === "running")) {
        engineRef.current.togglePause();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  const inRun = phase === "running" || phase === "paused" || phase === "intermission" || phase === "gameover" || phase === "evolution" || phase === "spelloffer" || phase === "mergeoffer" || phase === "epilogue";

  /* Patch 7.0 — the adaptive score calms down whenever we're out of a run. */
  useEffect(() => {
    if (phase === "menu") sfx.setIntensity(0);
  }, [phase]);

  /* Patch 9.0 — FORCED LANDSCAPE: while a touch device is held portrait,
     auto-pause any live run so nothing kills the mage mid-rotation. The
     rotate overlay itself renders below. */
  useEffect(() => {
    if (portraitTouch && engineRef.current && phase === "running") {
      engineRef.current.togglePause();
    }
  }, [portraitTouch, phase]);

  /* touch handlers for the virtual twin-stick layer */
  const onSelectSlot = useCallback((i: number) => {
    engineRef.current?.select(i);
  }, []);
  const onDash = useCallback(() => engineRef.current?.dash(), []);
  const onSurge = useCallback(() => engineRef.current?.surge(), []);
  const onPauseTouch = useCallback(() => engineRef.current?.togglePause(), []);

  /* Patch 8.0 — Archmage Mode toggle: engine autopilot + a readable banner so
     the state change is obvious on a phone. */
  const onToggleAuto = useCallback(() => {
    const st = useArchmageStore.getState();
    const next = !st.autoMode;
    st.setAutoMode(next);
    st.showBanner(
      next ? "ARCHMAGE MODE ENGAGED" : "MANUAL CONTROL",
      next ? "The Archmage fights for you — touch a stick to override" : "The helm is yours again",
      next ? "#43e8d8" : "#f5c96b",
    );
  }, []);

  /* Patch 6.0: M toggles master volume (0 ↔ 80) through the store so the
     slider state + audio graph stay in sync. Patch 9.0: T toggles Archmage
     Mode on EVERY device (desktop keybind for the overhauled autopilot). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "KeyM") {
        const st = useArchmageStore.getState();
        st.patchSettings({ master: st.meta.settings.master <= 0 ? 80 : 0 });
      }
      if (e.code === "KeyT" && phase === "running") {
        onToggleAuto();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onToggleAuto]);

  /* keep the engine's autopilot flag in sync with the store (covers new
     engines created by restarts and mid-run toggles) */
  useEffect(() => {
    engineRef.current?.setAutopilot(autoMode);
  }, [autoMode, phase, inRun]);

  /* Patch 8.0 — while Archmage Mode drives the run, every choice overlay is
     auto-resolved after a short beat (the player sees WHAT was picked and
     WHY before it commits). Human picks still work — a manual tap cancels
     the pending auto-pick via the cleanup below.
     Patch 10.0 — the epilogue too: a hands-free player gets the full credit
     roll (10s), then RETURN (bank the triumph — endless is a commitment the
     pilot doesn't make for you). */
  useEffect(() => {
    if (!autoMode) return;
    let id: number | undefined;
    const DELAY = 1500;
    if (phase === "intermission" && rewardOffer) {
      id = window.setTimeout(() => chooseReward(bestRewardId(rewardOffer.rewards)), DELAY);
    } else if (phase === "evolution" && evolutions) {
      id = window.setTimeout(() => chooseEvolution(bestEvolutionId(evolutions)), DELAY);
    } else if (phase === "spelloffer" && spellOffer) {
      id = window.setTimeout(() => {
        const pick = bestSpellPlacement(spellOffer.pool, spellOffer.equipped);
        /* only swap when the offer beats what it replaces (or fills an empty
           slot) — otherwise bank the heal and keep the current loadout */
        if (pick && placementIsUpgrade(pick)) chooseSpellOffer(pick.slot, pick.id);
        else skipSpellOffer();
      }, DELAY);
    } else if (phase === "mergeoffer" && mergeOffer) {
      id = window.setTimeout(() => {
        const pair = bestMergePair(mergeOffer.slots, mergeOffer.equipped);
        if (pair) chooseMerge(pair[0], pair[1]);
      }, DELAY);
    } else if (phase === "epilogue") {
      id = window.setTimeout(() => engineRef.current?.finishRun(), 10000);
    }
    return () => window.clearTimeout(id);
  }, [autoMode, phase, rewardOffer, evolutions, spellOffer, mergeOffer, chooseReward, chooseEvolution, chooseSpellOffer, skipSpellOffer, chooseMerge]);

  /* chapter display for the menu */
  const chapter = actForWave(Math.max(1, meta.bestWave || 1));

  /* --------------------------------- render --------------------------------- */

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden select-none" style={{ background: "#0b0716" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: inRun && phase !== "gameover" ? "crosshair" : "default" }} aria-label="ArchMage arena" />

      {/* ============ Patch 9.0 — FORCED LANDSCAPE GUARD ============
          Portrait touch devices (phones / tablets held upright) get a
          fullscreen "rotate your screen" overlay. The engine auto-pauses
          (see the portraitTouch effect) so a mid-run rotation is safe. */}
      {portraitTouch && (
        <div className="rotate-guard" role="alertdialog" aria-modal="true" aria-label="Rotate your device">
          <div className="rotate-guard-inner">
            <div className="rotate-phone" aria-hidden="true">
              <RotateIcon size={44} strokeWidth={1.6} />
            </div>
            <div className="rotate-title font-display font-black">ROTATE YOUR SCREEN</div>
            <div className="rotate-sub">ArchMage is played in landscape — turn your device sideways to enter the rift</div>
          </div>
        </div>
      )}

      {/* ================================ HUD ================================ */}
      {inRun && (
        <>
          {/* vitals */}
          <div className="hud-vitals rune-panel px-4 py-3 w-[248px] pointer-events-none"
               style={{ top: "calc(env(safe-area-inset-top) + 12px)", left: "calc(env(safe-area-inset-left) + 12px)" }}>
            <div className="flex items-baseline justify-between">
              <span className="hud-vitals-title font-display font-bold text-[15px] tracking-[0.18em] text-[#f5e3b3]">ARCHMAGE</span>
              <span ref={timeText} className="text-[12px] font-bold text-[#8f7bff] tabular-nums">0:00</span>
            </div>
            <div className="mt-2">
              <div className="hud-vitals-row flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8ba0]">
                <span>Vitality</span><span ref={hpText} className="hud-vitals-num tabular-nums">100 / 100</span>
              </div>
              <div className="bar mt-0.5">
                <div ref={hpFill} className="bar-fill" style={{ width: "100%", background: "linear-gradient(90deg, #a1173a, #ff4d6b)", boxShadow: "0 0 10px rgba(255,77,107,0.55)" }} />
              </div>
            </div>
            <div className="mt-1.5">
              <div className="hud-vitals-row flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#7fd8ff]">
                <span>Aether</span><span ref={mpText} className="hud-vitals-num tabular-nums">100 / 100</span>
              </div>
              <div className="bar mt-0.5">
                <div ref={mpFill} className="bar-fill" style={{ width: "100%", background: "linear-gradient(90deg, #0e7f9c, #43e8d8)", boxShadow: "0 0 10px rgba(67,232,216,0.45)" }} />
              </div>
            </div>
            <div className="mt-1.5">
              <div className="hud-vitals-row flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#f5c96b]">
                <span>Weave</span><span ref={weaveLabel} className="hud-vitals-num tabular-nums">0%</span>
              </div>
              <div ref={weaveWrap} className="bar mt-0.5">
                <div ref={weaveFill} className="bar-fill" style={{ width: "0%", background: "linear-gradient(90deg, #8a5f1e, #f5c96b)", boxShadow: "0 0 8px rgba(245,201,107,0.4)" }} />
              </div>
            </div>
            {/* Patch 6.0: live Rift Mercy readout (visible only when enabled) */}
            <div ref={mercyRow} className="hud-vitals-row mt-1.5 justify-between items-center" style={{ display: "none" }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6bf0c2]">Rift Mercy</span>
              <span ref={mercyText} className="text-[10px] font-black tabular-nums text-[#6bf0c2]">2%</span>
            </div>
          </div>

          {/* wave plate — act name + wave */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none"
               style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}>
            <div className="hud-wave-plate rune-panel px-6 py-2 min-w-[190px]">
              <div ref={actText} className="hud-act-label text-[9px] font-bold uppercase tracking-[0.24em] text-[#6bf0c2]">The Weeping Gate</div>
              <div className="hud-wave-label text-[10px] font-bold uppercase tracking-[0.34em] text-[#9a7bff]">Wave</div>
              <div ref={waveText} className="hud-wave-num font-display font-black text-4xl leading-none text-[#ffe9ad]" style={{ textShadow: "0 0 22px rgba(245,201,107,0.5)" }}>01</div>
              {/* Patch 7.0 — act threat meter: fills toward the act's tyrant */}
              <div className="flex items-center justify-center gap-1 mt-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    ref={(el) => { threatSegs.current[i] = el; }}
                    className="threat-seg"
                    style={{ background: i >= 3 ? "#ff4d6b" : "#f5c96b", opacity: 0.18 }}
                  />
                ))}
              </div>
              <div className="hud-wave-row flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-wider mt-1">
                <span ref={foesText} className="text-[#b9aee0] tabular-nums">0 foes</span>
                <span className="hud-wave-sep text-[#4a3585]">◆</span>
                <span ref={scoreText} className="text-[#ffe9ad] tabular-nums">0</span>
              </div>
            </div>
            <div ref={bossWrap} className="mt-2 transition-opacity duration-300" style={{ opacity: 0, display: "none" }}>
              <div ref={bossLabel} className="text-[11px] font-display font-bold tracking-[0.3em] text-[#ff8ba0] uppercase">Rift Tyrant</div>
              <div className="bar mx-auto mt-1 h-[10px] w-[320px] max-w-[70vw] border-[rgba(255,77,107,0.5)]">
                <div ref={bossFill} className="bar-fill" style={{ width: "100%", background: "linear-gradient(90deg, #7a1028, #ff4d6b)", boxShadow: "0 0 12px rgba(255,77,107,0.6)" }} />
              </div>
            </div>
            {/* Patch 8.0 — Archmage Mode badge (visible whenever the pilot drives) */}
            {autoMode && (
              <div className="auto-chip mx-auto mt-2 w-fit">
                <span className="auto-dot" aria-hidden />
                ARCHMAGE AUTO
              </div>
            )}
          </div>

          {/* right cluster — on touch devices the pause button lives in the
              TouchControls action row. Shards + mute remain visible. */}
          <div className="absolute z-20 flex items-center gap-2"
               style={{ top: "calc(env(safe-area-inset-top) + 12px)", right: "calc(env(safe-area-inset-right) + 12px)" }}>
            <div className="rune-panel px-3 py-2 flex items-center gap-2 pointer-events-none">
              <span className="text-[#ffe9ad]"><UiIcon name="gem" size={16} /></span>
              <span className="font-display font-bold text-[#ffe9ad]">{meta.shards}</span>
            </div>
            <button onClick={(e) => { e.currentTarget.blur(); const st = useArchmageStore.getState(); st.patchSettings({ master: st.meta.settings.master <= 0 ? 80 : 0 }); }} className="btn-ghost px-2.5 py-2" title="Sound (M)">
              <UiIcon name={meta.settings.master <= 0 ? "mute" : "sound"} size={16} />
            </button>
            {!isTouch && (
              <button onClick={(e) => { e.currentTarget.blur(); engineRef.current?.togglePause(); }} className="btn-ghost px-2.5 py-2" title="Pause (P)">
                <UiIcon name="pause" size={16} />
              </button>
            )}
          </div>

          {/* resonance / attune meters — raised above the touch action row */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none w-[380px] max-w-[86vw]"
               style={{ bottom: isTouch ? "calc(168px + env(safe-area-inset-bottom))" : "128px" }}>
            <div ref={resWrap} className="w-full transition-opacity duration-200" style={{ opacity: 0 }}>
              <span ref={resLabel} className="block text-center text-[11px] font-bold uppercase tracking-[0.2em]">Resonance</span>
              <div className="bar h-[6px] mt-1"><div ref={resFill} className="bar-fill" style={{ width: "100%" }} /></div>
            </div>
            <div ref={attWrap} className="w-full border px-3 py-1.5 transition-opacity duration-300" style={{ opacity: 0, background: "rgba(13,9,25,0.85)" }}>
              <span ref={attLabel} className="block text-center text-[11px] font-bold uppercase tracking-[0.2em]">Attuned</span>
              <div className="bar h-[5px] mt-1"><div ref={attFill} className="bar-fill" style={{ width: "100%" }} /></div>
            </div>
          </div>

          {/* spell bar — hidden on touch devices (TouchControls renders its own strip)
              and during the game-over eulogy. */}
          {!isTouch && phase !== "gameover" && phase !== "spelloffer" && phase !== "mergeoffer" && (
            <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
                 style={{ bottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
              <div className="flex items-end gap-1">
                {equippedIds.map((entry, i) => {
                  if (entry === null) {
                    return (
                      <button
                        key={i}
                        ref={(el) => { slotRoots.current[i] = el; }}
                        onClick={(e) => { e.currentTarget.blur(); }}
                        disabled
                        className="spell-slot group opacity-50 cursor-not-allowed"
                        title="Empty slot — pick up a spell drop to refill"
                      >
                        <span className="absolute top-0.5 left-1 text-[8px] font-black text-[#8f7bff]">{["1", "2", "3"][i] ?? ""}</span>
                        <span ref={(el) => { slotEvos.current[i] = el; }} className="slot-evo" title="Evolved">◆</span>
                        <span className="spell-icon text-[#6a5a99]">
                          <UiIcon name="hourglass" size={18} />
                        </span>
                        <span ref={(el) => { slotCosts.current[i] = el; }} className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9.5px] font-black tabular-nums text-[#6a5a99]">—</span>
                        <div ref={(el) => { slotCds.current[i] = el; }} className="cd-overlay" />
                      </button>
                    );
                  }
                  if (typeof entry !== "string") {
                    const ids = entry.merged;
                    const a = SPELLS[ids[0]], b = SPELLS[ids[1]];
                    const totalCost = a.manaCost + b.manaCost;
                    return (
                      <button
                        key={i}
                        ref={(el) => { slotRoots.current[i] = el; }}
                        onClick={(e) => { e.currentTarget.blur(); engineRef.current?.cast(i); }}
                        className="spell-slot group"
                        title={`Merged: ${a.name} + ${b.name} — casts both in succession`}
                      >
                        <span className="absolute top-0.5 left-1 text-[8px] font-black text-[#ffe9ad] group-hover:text-[#ffe9ad]">{["1", "2", "3"][i] ?? ""}</span>
                        <span ref={(el) => { slotEvos.current[i] = el; }} className="slot-evo" title="Merged">⧉</span>
                        <span className="spell-icon flex items-center">
                          <span style={{ color: a.color }}><SpellIcon id={ids[0]} size={18} /></span>
                          <span className="ml-[-4px]" style={{ color: b.color }}><SpellIcon id={ids[1]} size={18} /></span>
                        </span>
                        <span ref={(el) => { slotCosts.current[i] = el; }} className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9.5px] font-black tabular-nums text-[#ffe9ad]">{totalCost}</span>
                        <div ref={(el) => { slotCds.current[i] = el; }} className="cd-overlay" />
                      </button>
                    );
                  }
                  const def = SPELLS[entry];
                  return (
                    <button
                      key={i}
                      ref={(el) => { slotRoots.current[i] = el; }}
                      onClick={(e) => { e.currentTarget.blur(); engineRef.current?.cast(i); }}
                      className="spell-slot group"
                      title={`${def.name} — ${def.desc}`}
                    >
                      <span className="absolute top-0.5 left-1 text-[8px] font-black text-[#8f7bff] group-hover:text-[#ffe9ad]">{["1", "2", "3"][i] ?? ""}</span>
                      <span ref={(el) => { slotEvos.current[i] = el; }} className="slot-evo" title="Evolved">◆</span>
                      <span className="spell-icon" style={{ color: def.color }}>
                        <SpellIcon id={entry} size={20} />
                      </span>
                      <span ref={(el) => { slotCosts.current[i] = el; }} className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9.5px] font-black tabular-nums">{def.manaCost}</span>
                      <div ref={(el) => { slotCds.current[i] = el; }} className="cd-overlay" />
                    </button>
                  );
                })}
                <div className="w-1.5" />
                <button
                  onClick={(e) => { e.currentTarget.blur(); engineRef.current?.dash(); }}
                  className="spell-slot"
                  title="Blink step — brief immunity"
                >
                  <span className="absolute top-0.5 left-1 text-[7.5px] font-black text-[#8f7bff]">SPC</span>
                  <span className="spell-icon" style={{ color: "#b06bff" }}>
                    <UiIcon name="bolt" size={19} />
                  </span>
                  <div ref={dashFill} className="cd-overlay" style={{ height: "0%" }} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="pointer-events-none text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#6a5a99]">
                  LMB cast · RMB volley · wheel / Q E cycle · F surge · T archmage
                </span>
                {/* Patch 9.0 — desktop AUTO (Archmage Mode) button */}
                <button
                  onClick={(e) => { e.currentTarget.blur(); onToggleAuto(); }}
                  className={`btn-ghost px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]${autoMode ? " text-[#43e8d8]" : ""}`}
                  style={autoMode ? { borderColor: "rgba(67,232,216,0.7)", boxShadow: "0 0 12px rgba(67,232,216,0.35)" } : undefined}
                  title="Archmage Mode — the rift plays itself (T)"
                  aria-pressed={autoMode}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UiIcon name="rings" size={13} />
                    {autoMode ? "AUTO ON" : "AUTO"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* touch control layer — only while a run is live (Patch 9.0 layout:
          MOVE stick + FIRE button + SPELL cycle + right-edge actions) */}
      {isTouch && phase === "running" && (
        <TouchControls
          engineRef={engineRef}
          paused={phase !== "running"}
          weaveRef={weaveRef}
          surgeActiveRef={surgeActiveRef}
          onSelectSlot={onSelectSlot}
          onDash={onDash}
          onSurge={onSurge}
          onPause={onPauseTouch}
          autoMode={autoMode}
          onToggleAuto={onToggleAuto}
          equippedIds={equippedIds}
          selectedSlot={selectedSlot}
        />
      )}

      {/* Patch 6.0 — boss title card over live combat (auto-fades, click to dismiss) */}
      {bossIntro && phase === "running" && (
        <BossTitleCard key={bossIntro.key} boss={bossIntro.boss} actName={bossIntro.actName} onDone={clearBossIntro} />
      )}

      {/* Patch 10.0 — END-CREDIT EPILOGUE: "you have closed the rift" + the
          RETURN / FIGHT choice (endless survival). Rendered above the frozen
          arena; the engine holds phase until a choice is made. */}
      {phase === "epilogue" && epilogueStats && (
        <EndCreditsOverlay
          stats={epilogueStats}
          onReturn={() => { sfx.click(); engineRef.current?.finishRun(); }}
          onFight={() => { sfx.click(); engineRef.current?.continueEndless(); }}
        />
      )}

      {/* banner */}
      {banner && phase !== "gameover" && phase !== "epilogue" && (
        <div key={"banner-" + banner.key} className="banner-pop absolute top-[26%] left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none px-4">
          <div className="font-display font-black text-4xl md:text-5xl tracking-[0.1em]" style={{ color: banner.color, textShadow: `0 0 34px ${banner.color}aa, 0 2px 0 rgba(0,0,0,0.6)` }}>
            {banner.title}
          </div>
          {banner.sub && (
            <div className="mt-2 text-[13px] font-bold uppercase tracking-[0.24em] text-[#e9e2ff]" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>
              {banner.sub}
            </div>
          )}
        </div>
      )}

      {/* overlays */}
      {phase === "intermission" && rewardOffer && (
        <RewardOverlay
          rewards={rewardOffer.rewards}
          tiers={rewardOffer.tiers}
          wave={rewardOffer.wave}
          onPick={chooseReward}
        />
      )}
      {phase === "evolution" && evolutions && (
        <EvolutionOverlay choices={evolutions} onPick={chooseEvolution} />
      )}
      {phase === "spelloffer" && spellOffer && (
        <SpellOfferOverlay offer={spellOffer} onPick={chooseSpellOffer} onSkip={skipSpellOffer} />
      )}
      {phase === "mergeoffer" && mergeOffer && (
        <MergeOverlay offer={mergeOffer} onMerge={chooseMerge} />
      )}
      {phase === "paused" && !settingsOpen && (
        <PauseOverlay
          onResume={() => engineRef.current?.togglePause()}
          onRestart={startRun}
          onAbandon={() => { stopRun(); useArchmageStore.getState().setPhase("menu"); }}
          onSettings={() => useArchmageStore.getState().openSettings()}
        />
      )}
      {phase === "gameover" && stats && (
        <GameOverScreen stats={stats} onRetry={startRun} onMenu={() => { stopRun(); useArchmageStore.getState().setPhase("menu"); }} />
      )}

      {/* settings screen — above everything (menu + pause paths) */}
      {settingsOpen && (
        <SettingsScreen onClose={() => useArchmageStore.getState().closeSettings()} />
      )}

      {/* menu layer */}
      {phase === "menu" && screen === "menu" && !settingsOpen && (
        <MenuScreen
          chapter={chapter.name}
          chapterSubtitle={chapter.subtitle}
          onStart={startRun}
        />
      )}
      {phase === "menu" && screen === "sanctum" && (
        <SanctumScreen />
      )}
      {phase === "menu" && screen === "arcanum" && (
        <ArcanumScreen />
      )}

      {/* decorative frame while in run */}
      {inRun && phase !== "gameover" && (
        <div className="rune-frame absolute inset-0 pointer-events-none z-10"><Corners /></div>
      )}
    </div>
  );
}
