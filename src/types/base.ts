// AgriEmpire — Base Data Interfaces

export interface Plot {
  id: string;
  cropId: string | null;
  plantedAt: number | null;
  growthProgress: number; // 0 to 1
  isReady: boolean;
}

export interface PlayerMachine {
  id: string;
  machineId: string;
  count: number;
  level: { speed: number; yield: number; durability: number };
  wear: number;
  isBroken: boolean;
}
