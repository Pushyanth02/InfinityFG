import { eventBus } from './eventBus';

export function emitCoinsChanged(payload: { coins: number; delta: number; lifetimeCoins: number }): void {
  // Preserve previous behavior from gameStore: only positive coin gains emit this trigger.
  if (payload.delta <= 0) return;
  eventBus.emit('COINS_CHANGED', payload);
}
