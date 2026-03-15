import type { Plot, PlayerMachine } from './base';
import type { StorySlice } from '../store/slices/storySlice';
import type { TrackingSlice } from '../store/slices/trackingSlice';
import type { WorkerAssignmentSlice } from '../store/slices/workerAssignmentSlice';
import type { CraftingSlice } from '../store/slices/craftingSlice';

export interface GameState extends ResourceSlice, FarmSlice, AutomationSlice, MetaSlice, StorySlice, TrackingSlice, WorkerAssignmentSlice, CraftingSlice {
  // Common state
  lastTick: number;
  tick: (timestamp: number) => void;
}

export interface ResourceSlice {
  coins: number;
  gems: number;
  lifetimeCoins: number;
}

export interface FarmSlice {
  plots: Plot[];
  plantCrop: (plotId: string, cropId: string) => void;
  harvestCrop: (plotId: string) => void;
  buyPlot: () => void;
}

export interface AutomationSlice {
  machines: PlayerMachine[];
  workers: Record<string, number>;
  buyMachine: (machineId: string) => void;
  buyMachineUpgrade: (instanceId: string, branch: 'speed' | 'yield' | 'durability') => void;
  buyWorker: (workerId: string) => void;
}

export interface MetaSlice {
  unlockedCrops: string[];
  unlockedRegions: string[];
  unlockedSkills: string[];
  chapterTokens: string[];
  skillPoints: {
    total: number;
    spent: number;
    byTree: Record<string, number>;
  };
  currentRegion: string;
  prestigePoints: number;
  activePanel: string;
  setPanel: (panel: string) => void;
  grantChapterToken: (tokenId: string) => void;
  buySkill: (skillId: string) => void;
  ascend: () => void;
}
