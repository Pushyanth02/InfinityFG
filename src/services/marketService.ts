// ============================================================
// COZY GARDEN — Market Service
// Dynamic pricing system with 3 tunable knobs.
// Manages crop prices, trends, and merchant offers.
// ============================================================

import { CROPS } from '../data/crops';
import { eventBus } from './eventBus';

/**
 * Tunable parameters for the market system.
 */
export interface MarketTunables {
  /** How much prices can swing per update (default: 0.15 = 15%) */
  PRICE_VOLATILITY: number;
  /** How sticky price trends are (default: 0.7 = 70% momentum) */
  TREND_MOMENTUM: number;
  /** How much weather affects prices (default: 0.25 = 25%) */
  WEATHER_IMPACT: number;
}

/**
 * Default market tunables.
 */
export const DEFAULT_MARKET_TUNABLES: MarketTunables = {
  PRICE_VOLATILITY: 0.15,
  TREND_MOMENTUM: 0.7,
  WEATHER_IMPACT: 0.25,
};

/**
 * Price trend direction.
 */
export type PriceTrend = 'rising' | 'falling' | 'stable';

/**
 * Dynamic price entry for a crop.
 */
export interface MarketPrice {
  cropId: string;
  basePrice: number;
  currentMultiplier: number;
  trend: PriceTrend;
  affectedByWeather: boolean;
  activeBonuses: string[]; // Merchant offer IDs affecting this price
  lastUpdate: number;
}

/**
 * Merchant offer types.
 */
export type MerchantOfferType =
  | 'crop_price_bonus'    // +X% to specific crop prices
  | 'machine_discount'    // -X% to machine costs
  | 'worker_deal'         // Special worker hiring offer
  | 'recipe_unlock'       // Unlocks a recipe
  | 'bulk_order';         // Sell X crops for bonus

/**
 * Merchant offer definition.
 */
export interface MerchantOffer {
  id: string;
  merchantName: string;
  merchantEmoji: string;
  flavor: string;
  type: MerchantOfferType;
  targetIds: string[];
  multiplier?: number;
  duration: number; // Duration in seconds (0 = permanent)
  cost?: {
    coins?: number;
    crops?: { cropId: string; amount: number }[];
  };
  expiresAt?: number;
  chapterRequired?: number;
}

/**
 * Market service singleton.
 * Manages dynamic prices and merchant offers.
 */
class MarketService {
  private prices: Map<string, MarketPrice> = new Map();
  private activeOffers: MerchantOffer[] = [];
  private priceHistory: Map<string, number[]> = new Map();
  private tunables: MarketTunables = DEFAULT_MARKET_TUNABLES;
  private currentWeather: string = 'sunny';
  private lastUpdateTime: number = Date.now();

  constructor() {
    this.initializePrices();
  }

  /**
   * Initialize prices for all crops.
   */
  private initializePrices(): void {
    for (const crop of CROPS) {
      this.prices.set(crop.id, {
        cropId: crop.id,
        basePrice: crop.baseValue,
        currentMultiplier: 1.0,
        trend: 'stable',
        affectedByWeather: crop.weatherAffinity?.length > 0,
        activeBonuses: [],
        lastUpdate: Date.now(),
      });
      this.priceHistory.set(crop.id, [1.0]);
    }
  }

  /**
   * Update market prices based on weather and random fluctuation.
   */
  updatePrices(weatherType?: string): void {
    if (weatherType) {
      this.currentWeather = weatherType;
    }

    const now = Date.now();

    for (const crop of CROPS) {
      const current = this.prices.get(crop.id);
      if (!current) continue;

      // Calculate weather modifier
      let weatherMod = 1.0;
      if (crop.weatherAffinity?.includes(this.currentWeather)) {
        // Good weather for this crop - prices drop (supply up)
        weatherMod = 1 - this.tunables.WEATHER_IMPACT * 0.5;
      } else if (this.currentWeather === 'drought' || this.currentWeather === 'pest') {
        // Bad weather - prices rise (supply down)
        weatherMod = 1 + this.tunables.WEATHER_IMPACT;
      }

      // Random swing
      const randomSwing =
        1 + (Math.random() - 0.5) * this.tunables.PRICE_VOLATILITY;

      // Apply trend momentum
      const trendFactor =
        current.trend === 'rising'
          ? 1.02
          : current.trend === 'falling'
          ? 0.98
          : 1.0;

      // Calculate new multiplier
      let newMult =
        current.currentMultiplier *
        (this.tunables.TREND_MOMENTUM * trendFactor +
          (1 - this.tunables.TREND_MOMENTUM) * randomSwing) *
        weatherMod;

      // Clamp to reasonable bounds [0.5, 2.0]
      newMult = Math.max(0.5, Math.min(2.0, newMult));

      // Determine new trend
      const newTrend: PriceTrend =
        newMult > current.currentMultiplier * 1.01
          ? 'rising'
          : newMult < current.currentMultiplier * 0.99
          ? 'falling'
          : 'stable';

      // Update price
      const oldMult = current.currentMultiplier;
      this.prices.set(crop.id, {
        ...current,
        currentMultiplier: newMult,
        trend: newTrend,
        lastUpdate: now,
      });

      // Update history (keep last 10)
      const history = this.priceHistory.get(crop.id) ?? [];
      history.push(newMult);
      if (history.length > 10) history.shift();
      this.priceHistory.set(crop.id, history);

      // Emit event if significant change
      if (Math.abs(newMult - oldMult) > 0.05) {
        eventBus.emit('MARKET_PRICE_CHANGED', {
          cropId: crop.id,
          oldMultiplier: oldMult,
          newMultiplier: newMult,
        });
      }
    }

    this.lastUpdateTime = now;
  }

  /**
   * Get current sell price for a crop.
   */
  getSellPrice(cropId: string, baseValue: number): number {
    const price = this.prices.get(cropId);
    if (!price) return baseValue;

    // Apply merchant bonuses
    const merchantBonus = this.activeOffers
      .filter(
        (o) =>
          o.type === 'crop_price_bonus' && o.targetIds.includes(cropId)
      )
      .reduce((mult, o) => mult * (o.multiplier ?? 1), 1);

    return Math.floor(baseValue * price.currentMultiplier * merchantBonus);
  }

  /**
   * Get market price data for a crop.
   */
  getPrice(cropId: string): MarketPrice | undefined {
    return this.prices.get(cropId);
  }

  /**
   * Get all prices.
   */
  getAllPrices(): MarketPrice[] {
    return Array.from(this.prices.values());
  }

  /**
   * Get price history for a crop.
   */
  getPriceHistory(cropId: string): number[] {
    return this.priceHistory.get(cropId) ?? [];
  }

  /**
   * Add a merchant offer.
   */
  addOffer(offer: MerchantOffer): void {
    // Set expiration if duration is specified
    if (offer.duration > 0) {
      offer.expiresAt = Date.now() + offer.duration * 1000;
    }

    this.activeOffers.push(offer);

    eventBus.emit('MERCHANT_OFFER_AVAILABLE', {
      offerId: offer.id,
      merchantName: offer.merchantName,
    });
  }

  /**
   * Accept a merchant offer.
   */
  acceptOffer(offerId: string): MerchantOffer | undefined {
    const offer = this.activeOffers.find((o) => o.id === offerId);
    if (!offer) return undefined;

    // Mark offer as accepted (remove from active)
    this.activeOffers = this.activeOffers.filter((o) => o.id !== offerId);

    eventBus.emit('MERCHANT_OFFER_ACCEPTED', { offerId });

    return offer;
  }

  /**
   * Get all active offers.
   */
  getActiveOffers(): MerchantOffer[] {
    // Clean up expired offers
    const now = Date.now();
    const expired = this.activeOffers.filter(
      (o) => o.expiresAt && o.expiresAt < now
    );

    for (const offer of expired) {
      eventBus.emit('MERCHANT_OFFER_EXPIRED', { offerId: offer.id });
    }

    this.activeOffers = this.activeOffers.filter(
      (o) => !o.expiresAt || o.expiresAt >= now
    );

    return this.activeOffers;
  }

  /**
   * Get offers available for a specific chapter.
   */
  getOffersForChapter(chapter: number): MerchantOffer[] {
    return this.activeOffers.filter(
      (o) => !o.chapterRequired || o.chapterRequired <= chapter
    );
  }

  /**
   * Update tunables.
   */
  setTunables(tunables: Partial<MarketTunables>): void {
    this.tunables = { ...this.tunables, ...tunables };
  }

  /**
   * Get current tunables.
   */
  getTunables(): MarketTunables {
    return { ...this.tunables };
  }

  /**
   * Set current weather.
   */
  setWeather(weather: string): void {
    this.currentWeather = weather;
  }

  /**
   * Get time since last price update.
   */
  getTimeSinceUpdate(): number {
    return Date.now() - this.lastUpdateTime;
  }

  /**
   * Reset market to initial state.
   */
  reset(): void {
    this.prices.clear();
    this.priceHistory.clear();
    this.activeOffers = [];
    this.initializePrices();
  }
}

// Singleton instance
export const marketService = new MarketService();

// ============================================================
// SAMPLE MERCHANT OFFERS
// ============================================================

/**
 * Sample merchant offers that can spawn throughout the game.
 */
export const SAMPLE_MERCHANT_OFFERS: Omit<MerchantOffer, 'id' | 'expiresAt'>[] = [
  {
    merchantName: 'Farmer Joe',
    merchantEmoji: '👨‍🌾',
    flavor: 'Got some wheat? I\'ll pay extra!',
    type: 'crop_price_bonus',
    targetIds: ['wheat', 'barley', 'oats'],
    multiplier: 1.25,
    duration: 300, // 5 minutes
    chapterRequired: 1,
  },
  {
    merchantName: 'The Herbalist',
    merchantEmoji: '🧙‍♀️',
    flavor: 'Herbs are in high demand...',
    type: 'crop_price_bonus',
    targetIds: ['herb', 'lavender', 'mint'],
    multiplier: 1.50,
    duration: 180, // 3 minutes
    chapterRequired: 2,
  },
  {
    merchantName: 'Tech Trader',
    merchantEmoji: '🤖',
    flavor: 'Upgrading my farm. Machines on sale!',
    type: 'machine_discount',
    targetIds: ['planter_t1', 'harvester_t1', 'waterer_t1'],
    multiplier: 0.85,
    duration: 600, // 10 minutes
    chapterRequired: 2,
  },
  {
    merchantName: 'Exotic Buyer',
    merchantEmoji: '🎩',
    flavor: 'Only the rarest crops for my collection!',
    type: 'crop_price_bonus',
    targetIds: ['rare_orchid', 'golden_wheat', 'starfruit'],
    multiplier: 2.0,
    duration: 120, // 2 minutes
    chapterRequired: 4,
  },
  {
    merchantName: 'Bulk Buyer Boris',
    merchantEmoji: '📦',
    flavor: 'Sell me 100 crops, get +50% bonus!',
    type: 'bulk_order',
    targetIds: [],
    multiplier: 1.5,
    duration: 0, // Permanent until completed
    cost: { crops: [{ cropId: 'any', amount: 100 }] },
    chapterRequired: 3,
  },
];

/**
 * Spawn a random merchant offer appropriate for the current chapter.
 */
export function spawnRandomOffer(currentChapter: number): void {
  const eligibleOffers = SAMPLE_MERCHANT_OFFERS.filter(
    (o) => !o.chapterRequired || o.chapterRequired <= currentChapter
  );

  if (eligibleOffers.length === 0) return;

  const randomOffer =
    eligibleOffers[Math.floor(Math.random() * eligibleOffers.length)];

  marketService.addOffer({
    ...randomOffer,
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  });
}
