import { eventBus } from './eventBus';

export function emitCoinsChanged(payload: { coins: number; delta: number; lifetimeCoins: number }): void {
  if (payload.delta <= 0) return;
  eventBus.emit('COINS_CHANGED', payload);
}
