// AgriEmpire — Resource Slice
import type { StateCreator } from 'zustand';
import type { GameState, ResourceSlice } from '../../types/game';

export const createResourceSlice: StateCreator<
  GameState,
  [],
  [],
  ResourceSlice
> = () => ({
  coins: 10,
  gems: 0,
  lifetimeCoins: 10,
});
