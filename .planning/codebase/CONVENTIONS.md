# Coding Conventions

**Analysis Date:** 2026-03-28

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Layout.tsx`, `Sidebar.tsx`, `PanelManager.tsx`)
- Services/utilities: camelCase (e.g., `appwrite.ts`, `eventBus.ts`, `marketService.ts`)
- Data/configuration: camelCase (e.g., `chapters.ts`, `crops.ts`, `skills.ts`)
- Store slices: camelCase with descriptive suffix (e.g., `farmSlice.ts`, `resourceSlice.ts`, `automationSlice.ts`)
- Type definition files: Types organized within data files or in dedicated `types/` directory (e.g., `types/game.ts`, `types/base.ts`)

**Functions:**
- Regular functions and exported utilities: camelCase (e.g., `calculatePlotGrowth`, `fmt`, `getSkillMultiplier`)
- React components: PascalCase for component names (e.g., `function App()`, `export const TickEngine: React.FC`)
- Factory functions for Zustand slices: `create*Slice` pattern (e.g., `createFarmSlice`, `createResourceSlice`)
- Event handlers: camelCase prefixed with `on` or describe the action (e.g., `subscribe`, `emit`, `clearLog`)

**Variables:**
- Constants: SCREAMING_SNAKE_CASE for module-level constants (e.g., `DEFAULT_TUNABLES`, `QA_THRESHOLDS`, `NEWSWORTHY_TYPES`)
- State variables: camelCase (e.g., `currentCoins`, `lastTick`, `activePanel`)
- boolean properties: prefix with `is` or `has` (e.g., `isReady`, `isLoading`)
- Zustand selectors: Concise selectors using arrow functions (e.g., `(s) => s.activePanel`, `(state) => state.tick`)

**Types:**
- Type names: PascalCase with descriptive suffix (e.g., `GameState`, `FarmSlice`, `ProductionTunables`, `GameEventType`, `ChapterQuest`)
- Interface names: PascalCase with `I` prefix optional (pattern not used in this codebase; interfaces used directly without prefix)
- Union types: PascalCase or descriptive string literals (e.g., `type SkillTree = 'green_thumb' | 'automaton' | 'merchant'`)
- Event type unions: SCREAMING_SNAKE_CASE for discriminator values (e.g., `'CHAPTER_STARTED'`, `'CROP_PLANTED'`, `'COINS_CHANGED'`)

## Code Style

**Formatting:**
- No dedicated Prettier config file; ESLint is primary linter
- 2-space indentation (inferred from codebase patterns)
- No semicolons on imports/exports (ESLint configured for verbatimModuleSyntax)

**Linting:**
- ESLint 9.39.4 with TypeScript support
- Config: `eslint.config.js` (new flat config format)
- Extends: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- ECMAScript target: 2020
- React JSX is auto-transformed (vite+@vitejs/plugin-react with automatic JSX)
- Unused parameter detection disabled (`noUnusedParameters: false` in tsconfig)
- Strict mode enabled in TypeScript compiler

**File Structure:**
- Relative imports preferred within same directory/module
- Absolute paths from root (`src/`) not configured; relative paths used throughout
- Type imports use `type` keyword to enable verbatimModuleSyntax (e.g., `import type { GameState } from '../types/game'`)

## Import Organization

**Order:**
1. External libraries (React, zustand, appwrite, etc.)
2. Type imports from same module (if needed)
3. Local service/utility imports (eventBus, marketService, etc.)
4. Local data imports (CROPS, AUGMENTED_MACHINES, etc.)
5. Local type imports (using `type` keyword)
6. Local component imports (UI components)

**Examples:**
```typescript
// Correct ordering from src/store/gameStore.ts:
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState } from '../types/game';
import { createResourceSlice } from './slices/resourceSlice';
import { createFarmSlice } from './slices/farmSlice';
import { calculatePlotGrowth, calculateMachineProduction } from '../engine/mechanics';
import { marketService } from '../services/marketService';
import { eventBus } from '../services/eventBus';
```

**Path Aliases:**
- Not configured; all imports use relative paths (e.g., `../types/game`, `../../services/eventBus`)

## Error Handling

**Patterns:**
- No try-catch blocks for thrown errors; errors are caught silently in event handlers
- Event handlers wrap user callbacks in try-catch and log to console.error (see `eventBus.ts` lines 201-206, 209-215)
- Backend calls (Appwrite ping) use try-catch with console logging (see `appwrite.ts` lines 22-29)
- Missing data returns null or early exit (e.g., `if (!crop) return { nextProgress: currentProgress, isReady: false }`)
- No custom error classes observed; uses native Error/browser console

**Console Usage:**
- `console.log()`: Informational messages (e.g., Appwrite verification, live ops triggers)
- `console.warn()`: Non-critical warnings (e.g., missing i18n keys, connection failures)
- `console.error()`: Error conditions and exception context
- Uses emoji prefixes for visual distinction in logs (e.g., `✅`, `❌`, `[LIVE OPS ALERT]`, `[i18n]`)

## Comments

**When to Comment:**
- File headers: Module-level comments explaining purpose (using `// =====...` separator pattern)
- Complex calculations: Explain the "why" (e.g., production multiplier tuning parameters)
- State transitions: Annotate phase numbers (e.g., `// Phase 2: emit COINS_CHANGED so unlock pipeline can re-evaluate`)
- Non-obvious logic: Explain constraints or workarounds

**Documentation Style:**
- Block comments use `// =====` separator lines for file headers (e.g., in `eventBus.ts`, `appwrite.ts`)
- JSDoc comments used sparingly but consistently for exported functions
- JSDoc format: Single-line description, then `@param` and `@returns` if needed
- No parameter types in JSDoc (already specified in TypeScript signature)

**JSDoc Examples:**
```typescript
/**
 * Calculates a total multiplier from a set of unlocked skills for a specific bonus type.
 */
export const getSkillMultiplier = (unlockedSkills: string[], bonusType: string): number => { ... }

/**
 * Formats large numbers into human-readable strings (k, M, B, T).
 */
export const fmt = (num: number) => { ... }

/**
 * The Heartbeat of Cozy Garden.
 * Runs at 10Hz (every 100ms) to update the global simulation state.
 */
export const TickEngine: React.FC = () => { ... }
```

## Function Design

**Size:**
- Most functions are 10-30 lines
- Complex calculations (like mechanics.ts functions) are 20-60 lines with clear phases
- Single-responsibility principle observed (separate functions for different calculation stages)

**Parameters:**
- Functions accept explicit parameters rather than objects when count is low (< 4)
- Option bags with `?:` for optional configuration (e.g., `options?: { getGlobalAuraBonus?: () => number }`)
- Destructuring used in parameter lists for clarity (e.g., `{ set, get, ...args }` in Zustand slices)

**Return Values:**
- Typed return values always specified (never implicit `any`)
- Objects returned with clear structure (e.g., `{ nextProgress, isReady }`)
- Early returns for guard clauses (null checks, missing data)

**Pure Functions:**
- Production calculations are pure functions (no side effects)
- Event emission separated from state calculation
- Zustand setters wrap pure calculation results

## Module Design

**Exports:**
- Named exports for utilities and slices (e.g., `export const fmt = ...`)
- Default exports for React components (e.g., `export default function App()`)
- Type exports use `export type { TypeName }` syntax
- Singleton instances exported as named exports (e.g., `export const eventBus = new EventBus()`)

**Barrel Files:**
- No barrel files (index.ts) observed in codebase; imports are direct to source files
- Each module is single-purpose and self-contained

**State Management (Zustand):**
- Store slices are functional factories (e.g., `createFarmSlice`)
- Slices composed in main store (gameStore.ts) using spread operator
- Type composition uses interface extension (e.g., `interface GameState extends ResourceSlice, FarmSlice, ...`)
- Persist middleware applied at store level

## React Patterns

**Components:**
- Functional components using TypeScript (no class components)
- Props interface defined separately with descriptive names (e.g., `interface LayoutProps`)
- Component type annotation: `React.FC<Props>` or `React.FC` for no props
- Hook usage: `useGameStore` for state access, `useEffect` for lifecycle

**Styling:**
- Inline styles with CSS variables (e.g., `style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}`)
- Tailwind classes mixed with inline styles (e.g., `className="flex flex-1 overflow-hidden"`)
- CSS variables defined externally (`--space-xs`, `--radius-md`, `--shadow-card`)
- No CSS-in-JS library; pure Tailwind + inline styles + CSS custom properties

## Event System

**Pattern:**
- Central event bus (eventBus.ts) provides pub/sub for game events
- Strongly typed events using discriminated union (GameEventType)
- Event payloads typed via EventPayloads interface mapping
- Generic subscribe method: `subscribe<T extends GameEventType>(eventType: T, handler: EventHandler<T>)`
- React hook wrapper: `useGameEvent<T>(eventType, handler)` for component subscriptions

**Naming:**
- Event types are SCREAMING_SNAKE_CASE (e.g., `COINS_CHANGED`, `CROP_HARVESTED`)
- Organized by category in union definition (Story, Content unlocks, Production, Workers, Market, Crafting, Regions, System)

## Data Management

**Data Files:**
- Configuration stored in JSON files alongside TypeScript (e.g., `game_config.json`, `engineering_standards.json`)
- Exported TypeScript data definitions from `src/data/` directory
- Type definitions co-located with data (e.g., `ChapterQuest` defined in `chapters.ts`)
- Immutable data patterns (no mutation of game constants)

**Store Integration:**
- Zustand slices for mutable state (coins, plots, machines, etc.)
- GameStore combines slices and adds tick() method for simulation
- `persist()` middleware saves to localStorage as `cozy-garden-save`

---

*Convention analysis: 2026-03-28*
