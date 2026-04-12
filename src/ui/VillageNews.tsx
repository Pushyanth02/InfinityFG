// ============================================================
// COZY GARDEN — Village News Component
// Global news feed that subscribes to game events.
// Replaces the old isolated EventFeed component.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNewsEvents, type GameEvent } from '../services/eventBus';
import { createStableId, nowMs } from '../systems/time';

/**
 * News item type categories.
 */
export type NewsItemType =
  | 'unlock'       // New content unlocked
  | 'achievement'  // Achievement earned
  | 'market'       // Market/merchant news
  | 'story'        // Chapter/quest progress
  | 'milestone'    // Milestone reached
  | 'system';      // System announcements

/**
 * Formatted news item for display.
 */
export interface NewsItem {
  id: string;
  type: NewsItemType;
  emoji: string;
  headline: string;
  detail?: string;
  timestamp: number;
  isNew: boolean;
}

/**
 * Maps game events to news items.
 */
function eventToNewsItem(event: GameEvent): NewsItem | null {
  const base = {
    id: createStableId('news'),
    timestamp: event.timestamp,
    isNew: true,
  };

  switch (event.type) {
    case 'CHAPTER_COMPLETED':
      return {
        ...base,
        type: 'story',
        emoji: '📖',
        headline: `Chapter ${(event.payload as { chapterNumber: number }).chapterNumber} Complete!`,
        detail: `You defeated ${(event.payload as { bossName: string }).bossName}!`,
      };

    case 'QUEST_COMPLETED':
      return {
        ...base,
        type: 'story',
        emoji: '✅',
        headline: 'Quest Complete!',
        detail: (event.payload as { title: string }).title,
      };

    case 'BOSS_DEFEATED':
      return {
        ...base,
        type: 'story',
        emoji: '🗡️',
        headline: 'Boss Defeated!',
        detail: `${(event.payload as { bossName: string }).bossName} has been vanquished!`,
      };

    case 'CONTENT_AVAILABLE':
      return {
        ...base,
        type: 'unlock',
        emoji: '🔔',
        headline: 'Now Available!',
        detail: (event.payload as { announcementText?: string }).announcementText ?? 'Check the Story Book!',
      };

    case 'CONTENT_UNLOCKED':
      return {
        ...base,
        type: 'unlock',
        emoji: '🔓',
        headline: 'New Content Unlocked!',
        detail: (event.payload as { announcementText?: string }).announcementText ?? 'Check the Story Book!',
      };

    case 'CROP_UNLOCKED':
      return {
        ...base,
        type: 'unlock',
        emoji: '🌱',
        headline: 'New Crop Discovered!',
        detail: (event.payload as { cropName: string }).cropName,
      };

    case 'MACHINE_UNLOCKED':
      return {
        ...base,
        type: 'unlock',
        emoji: '⚙️',
        headline: 'New Machine Available!',
        detail: (event.payload as { machineName: string }).machineName,
      };

    case 'WORKER_UNLOCKED':
      return {
        ...base,
        type: 'unlock',
        emoji: '👷',
        headline: 'New Worker Available!',
        detail: (event.payload as { workerName: string }).workerName,
      };

    case 'SKILL_UNLOCKED':
      return {
        ...base,
        type: 'unlock',
        emoji: '✨',
        headline: 'New Skill Learned!',
        detail: (event.payload as { skillName: string }).skillName,
      };

    case 'REGION_UNLOCKED':
      return {
        ...base,
        type: 'unlock',
        emoji: '🗺️',
        headline: 'New Region Discovered!',
        detail: (event.payload as { regionName: string }).regionName,
      };

    case 'RARE_CROP_DISCOVERED':
      return {
        ...base,
        type: 'achievement',
        emoji: '💎',
        headline: 'Rare Discovery!',
        detail: `You found ${(event.payload as { cropName: string }).cropName}!`,
      };

    case 'MERCHANT_OFFER_AVAILABLE':
      return {
        ...base,
        type: 'market',
        emoji: '🛒',
        headline: 'New Merchant Offer!',
        detail: `${(event.payload as { merchantName: string }).merchantName} has a deal for you.`,
      };

    case 'ACHIEVEMENT_UNLOCKED':
      return {
        ...base,
        type: 'achievement',
        emoji: '🏆',
        headline: 'Achievement Unlocked!',
        detail: (event.payload as { title: string }).title,
      };

    case 'MILESTONE_REACHED':
      return {
        ...base,
        type: 'milestone',
        emoji: '🎯',
        headline: 'Milestone Reached!',
        detail: `${(event.payload as { milestoneType: string }).milestoneType}: ${(event.payload as { value: number }).value.toLocaleString()}`,
      };

    case 'PRESTIGE_PERFORMED':
      return {
        ...base,
        type: 'story',
        emoji: '🌟',
        headline: 'Ascension Complete!',
        detail: `Earned ${(event.payload as { pointsGained: number }).pointsGained} prestige points!`,
      };

    default:
      return null;
  }
}

/**
 * Format relative time for display.
 */
function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((nowMs() - timestamp) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return 'earlier';
}

/**
 * Village News component props.
 */
interface VillageNewsProps {
  maxItems?: number;
  showTimestamp?: boolean;
  compact?: boolean;
}

/**
 * Village News component.
 * Displays a feed of game events in a scrollable list.
 */
export const VillageNews: React.FC<VillageNewsProps> = ({
  maxItems = 15,
  showTimestamp = true,
  compact = false,
}) => {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Subscribe to newsworthy events
  const events = useNewsEvents(maxItems);

  const newsItems = useMemo(() => {
    const items: NewsItem[] = [];

    for (const event of events) {
      const newsItem = eventToNewsItem(event);
      if (newsItem) {
        // Mark as not new if we've seen it
        newsItem.isNew = !seenIds.has(newsItem.id);
        items.push(newsItem);
      }
    }

    return items.slice(-maxItems);
  }, [events, seenIds, maxItems]);

  // Mark items as seen after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setSeenIds((prev) => {
        const next = new Set(prev);
        newsItems.forEach((item) => next.add(item.id));
        return next;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [newsItems]);

  // Get type-specific styling
  const getTypeStyles = useCallback((type: NewsItemType): string => {
    switch (type) {
      case 'unlock':
        return 'border-l-4 border-green-400 bg-green-900/20';
      case 'achievement':
        return 'border-l-4 border-yellow-400 bg-yellow-900/20';
      case 'market':
        return 'border-l-4 border-blue-400 bg-blue-900/20';
      case 'story':
        return 'border-l-4 border-purple-400 bg-purple-900/20';
      case 'milestone':
        return 'border-l-4 border-orange-400 bg-orange-900/20';
      default:
        return 'border-l-4 border-gray-400 bg-gray-900/20';
    }
  }, []);

  if (newsItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No news yet...</p>
        <p className="text-xs mt-1">Start farming to see updates!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
      {newsItems
        .slice()
        .reverse()
        .map((item) => (
          <div
            key={item.id}
            className={`
              p-2 rounded-r transition-all duration-300
              ${getTypeStyles(item.type)}
              ${item.isNew ? 'animate-pulse' : ''}
              ${compact ? 'py-1' : ''}
            `}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                  {item.headline}
                </p>
                {item.detail && !compact && (
                  <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                )}
              </div>
              {showTimestamp && (
                <span className="text-xs text-gray-500 shrink-0">
                  {formatRelativeTime(item.timestamp)}
                </span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};

/**
 * Village News Panel component.
 * A standalone panel wrapper for the news feed.
 */
export const VillageNewsPanel: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>📰</span>
        <span>Village News</span>
      </h2>
      <VillageNews />
    </div>
  );
};

export default VillageNews;
