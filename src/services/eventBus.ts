// ============================================================
// COZY GARDEN — Global Event Bus
// Central pub/sub system for game events.
// Village News and other systems subscribe to receive announcements.
// ============================================================

/**
 * All game event types.
 * Systems emit these events; UI components subscribe to them.
 */
export type GameEventType =
  // Story progression
  | 'CHAPTER_STARTED'
  | 'CHAPTER_COMPLETED'
  | 'QUEST_COMPLETED'
  | 'QUEST_PROGRESS'
  | 'BOSS_DAMAGED'
  | 'BOSS_DEFEATED'

  // Content unlocks — pipeline events (Phase 2)
  | 'CONTENT_AVAILABLE'   // Requirements just became satisfied; player can now accept/spend
  | 'CONTENT_UNLOCKED'    // Player confirmed unlock; item is now active
  | 'CROP_UNLOCKED'
  | 'MACHINE_UNLOCKED'
  | 'WORKER_UNLOCKED'
  | 'SKILL_UNLOCKED'
  | 'RECIPE_UNLOCKED'
  | 'REGION_UNLOCKED'
  | 'STORY_PAGE_UNLOCKED'

  // Production events
  | 'CROP_PLANTED'
  | 'CROP_HARVESTED'
  | 'CROP_SOLD'
  | 'RARE_CROP_DISCOVERED'
  | 'MACHINE_PRODUCTION'

  // Worker events
  | 'WORKER_HIRED'
  | 'WORKER_ASSIGNED'
  | 'WORKER_UNASSIGNED'
  | 'WORKER_LEVELED'
  | 'WORKER_TRUST_UPDATED'  // Worker trust score changed (Phase 2 trigger)

  // Market / economy events
  | 'COINS_CHANGED'           // Coin balance changed (Phase 2 trigger)
  | 'MERCHANT_OFFER_AVAILABLE'
  | 'MERCHANT_OFFER_ACCEPTED'
  | 'MERCHANT_OFFER_EXPIRED'
  | 'MARKET_PRICE_CHANGED'

  // Crafting events
  | 'CRAFT_COMPLETED'  // A recipe finished crafting (Phase 2 trigger)

  // Region events
  | 'REGION_REPUTATION_CHANGED'  // Region reputation delta applied (Phase 2 trigger)

  // System events
  | 'GAME_TICK'
  | 'GAME_SAVED'
  | 'GAME_LOADED'
  | 'PRESTIGE_AVAILABLE'
  | 'PRESTIGE_PERFORMED'

  // Achievements
  | 'ACHIEVEMENT_UNLOCKED'
  | 'MILESTONE_REACHED';

/**
 * Base event structure.
 */
export interface GameEvent<T = unknown> {
  type: GameEventType;
  payload: T;
  timestamp: number;
  source: 'system' | 'player' | 'automation';
}

/**
 * Event payload types for type safety.
 */
export interface EventPayloads {
  CHAPTER_STARTED: { chapterId: string; chapterNumber: number; title: string };
  CHAPTER_COMPLETED: { chapterId: string; chapterNumber: number; bossName: string };
  QUEST_COMPLETED: { questId: string; title: string; reward: number };
  QUEST_PROGRESS: { questId: string; current: number; target: number };
  BOSS_DAMAGED: { bossId: string; damage: number; remainingHp: number };
  BOSS_DEFEATED: { bossId: string; bossName: string; reward: number };

  CONTENT_AVAILABLE: { contentType: string; itemId: string; announcementText?: string };
  CONTENT_UNLOCKED: { contentType: string; itemId: string; announcementText?: string };
  CROP_UNLOCKED: { cropId: string; cropName: string };
  MACHINE_UNLOCKED: { machineId: string; machineName: string };
  WORKER_UNLOCKED: { workerId: string; workerName: string };
  SKILL_UNLOCKED: { skillId: string; skillName: string };
  RECIPE_UNLOCKED: { recipeId: string; recipeName: string };
  REGION_UNLOCKED: { regionId: string; regionName: string };
  STORY_PAGE_UNLOCKED: { pageId: string; pageTitle: string };

  CROP_PLANTED: { plotId: string; cropId: string };
  CROP_HARVESTED: { plotId: string; cropId: string; amount: number; coins: number };
  CROP_SOLD: { cropId: string; amount: number; coins: number };
  RARE_CROP_DISCOVERED: { cropId: string; cropName: string };
  MACHINE_PRODUCTION: { machineId: string; coins: number };

  WORKER_HIRED: { workerId: string; workerName: string; cost: number };
  WORKER_ASSIGNED: { instanceId: string; targetType: string; targetId: string };
  WORKER_UNASSIGNED: { instanceId: string };
  WORKER_LEVELED: { instanceId: string; newLevel: number };
  WORKER_TRUST_UPDATED: { workerId: string; trust: number; delta: number };

  COINS_CHANGED: { coins: number; delta: number; lifetimeCoins: number };
  MERCHANT_OFFER_AVAILABLE: { offerId: string; merchantName: string };
  MERCHANT_OFFER_ACCEPTED: { offerId: string };
  MERCHANT_OFFER_EXPIRED: { offerId: string };
  MARKET_PRICE_CHANGED: { cropId: string; oldMultiplier: number; newMultiplier: number };

  CRAFT_COMPLETED: { recipeId: string; recipeName: string; outputItem: string };

  REGION_REPUTATION_CHANGED: { regionId: string; reputation: number; delta: number };

  GAME_TICK: { delta: number; coins: number };
  GAME_SAVED: { timestamp: number };
  GAME_LOADED: { timestamp: number };
  PRESTIGE_AVAILABLE: { points: number };
  PRESTIGE_PERFORMED: { pointsGained: number; totalPoints: number };

  ACHIEVEMENT_UNLOCKED: { achievementId: string; title: string };
  MILESTONE_REACHED: { milestoneType: string; value: number };
}

type EventHandler<T extends GameEventType> = (
  event: GameEvent<EventPayloads[T]>
) => void;

type AnyEventHandler = (event: GameEvent<unknown>) => void;

/**
 * Global event bus singleton.
 * Provides centralized event pub/sub for the entire game.
 */
class EventBus {
  private handlers: Map<GameEventType, Set<AnyEventHandler>> = new Map();
  private wildcardHandlers: Set<AnyEventHandler> = new Set();
  private eventLog: GameEvent[] = [];
  private readonly maxLogSize = 500;

  /**
   * Subscribe to a specific event type.
   * Returns an unsubscribe function.
   */
  subscribe<T extends GameEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as AnyEventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as AnyEventHandler);
    };
  }

  /**
   * Subscribe to ALL events (wildcard).
   * Useful for logging, debugging, or global event tracking.
   */
  subscribeAll(handler: AnyEventHandler): () => void {
    this.wildcardHandlers.add(handler);
    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<T extends GameEventType>(
    eventType: T,
    payload: EventPayloads[T],
    source: GameEvent['source'] = 'system'
  ): void {
    const event: GameEvent<EventPayloads[T]> = {
      type: eventType,
      payload,
      timestamp: nowMs(),
      source,
    };

    // Log event
    this.eventLog.push(event as GameEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Notify specific handlers
    this.handlers.get(eventType)?.forEach((handler) => {
      try {
        handler(event as GameEvent);
      } catch (err) {
        console.error(`Event handler error for ${eventType}:`, err);
      }
    });

    // Notify wildcard handlers
    this.wildcardHandlers.forEach((handler) => {
      try {
        handler(event as GameEvent);
      } catch (err) {
        console.error(`Wildcard handler error for ${eventType}:`, err);
      }
    });
  }

  /**
   * Get recent events, optionally filtered by type.
   */
  getRecentEvents(count = 50, filterType?: GameEventType): GameEvent[] {
    let events = this.eventLog;
    if (filterType) {
      events = events.filter((e) => e.type === filterType);
    }
    return events.slice(-count);
  }

  /**
   * Get events by multiple types.
   */
  getEventsByTypes(types: GameEventType[], count = 50): GameEvent[] {
    return this.eventLog.filter((e) => types.includes(e.type)).slice(-count);
  }

  /**
   * Clear the event log.
   * Useful for testing or prestige resets.
   */
  clearLog(): void {
    this.eventLog = [];
  }

  /**
   * Get all handlers count (for debugging).
   */
  getHandlerCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.handlers.forEach((handlers, type) => {
      counts[type] = handlers.size;
    });
    counts['*'] = this.wildcardHandlers.size;
    return counts;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// ============================================================
// React Hook for subscribing to events
// ============================================================

import { useEffect, useState, useCallback } from 'react';

const NEWSWORTHY_TYPES: GameEventType[] = [
  'CHAPTER_COMPLETED',
  'QUEST_COMPLETED',
  'BOSS_DEFEATED',
  'CONTENT_AVAILABLE',    // Phase 2: item just became available (requirements met)
  'CONTENT_UNLOCKED',
  'CROP_UNLOCKED',
  'MACHINE_UNLOCKED',
  'WORKER_UNLOCKED',
  'SKILL_UNLOCKED',
  'REGION_UNLOCKED',
  'RARE_CROP_DISCOVERED',
  'MERCHANT_OFFER_AVAILABLE',
  'ACHIEVEMENT_UNLOCKED',
  'MILESTONE_REACHED',
  'PRESTIGE_PERFORMED',
];

/**
 * React hook to subscribe to game events.
 * Automatically cleans up subscription on unmount.
 */
export function useGameEvent<T extends GameEventType>(
  eventType: T,
  handler: EventHandler<T>
): void {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
}

/**
 * React hook to get recent events of a specific type.
 * Updates when new events of that type are emitted.
 */
export function useRecentEvents<T extends GameEventType>(
  eventType: T,
  count = 10
): GameEvent<EventPayloads[T]>[] {
  const [events, setEvents] = useState<GameEvent<EventPayloads[T]>[]>(() =>
    eventBus.getRecentEvents(count, eventType) as GameEvent<EventPayloads[T]>[]
  );

  const handler = useCallback(
    (event: GameEvent<EventPayloads[T]>) => {
      setEvents((prev) => [...prev.slice(-(count - 1)), event]);
    },
    [count]
  );

  useEffect(() => {
    // Subscribe for new events
    const unsubscribe = eventBus.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, count, handler]);

  return events;
}

/**
 * React hook to track events for Village News display.
 * Filters to "newsworthy" events only.
 */
export function useNewsEvents(count = 20): GameEvent[] {
  const [events, setEvents] = useState<GameEvent[]>(() =>
    eventBus.getEventsByTypes(NEWSWORTHY_TYPES, count)
  );

  useEffect(() => {
    // Subscribe to each newsworthy type
    const unsubscribers = NEWSWORTHY_TYPES.map((type) =>
      eventBus.subscribe(type, (event) => {
        setEvents((prev) => [...prev.slice(-(count - 1)), event as GameEvent]);
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [count]);

  return events;
}
import { nowMs } from '../systems/time';
