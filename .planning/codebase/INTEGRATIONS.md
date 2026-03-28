# External Integrations

**Analysis Date:** 2026-03-28

## APIs & External Services

**Appwrite Backend-as-a-Service:**
- Service: Appwrite v23.0.0
- What it's used for: User authentication, data persistence, server-side logic
- SDK/Client: appwrite package (23.0.0)
- Config location: `src/services/appwrite.ts`
- Auth: Client-based (API keys only on secure backend, not in frontend)
- Endpoint: Configurable via `VITE_APPWRITE_ENDPOINT`
- Project ID: Configurable via `VITE_APPWRITE_PROJECT_ID`

**Connectivity:**
- Ping verification on app startup: `pingAppwrite()` in `src/services/appwrite.ts`
- Used in: `src/App.tsx` for connection validation on mount
- Error handling: Graceful fallback with console warnings if offline

## Data Storage

**State Persistence:**
- Storage Type: Browser localStorage via Zustand persist middleware
- Key: `cozy-garden-save`
- Location: `src/store/gameStore.ts` (Zustand create with persist)
- Data: Complete game state (plots, machines, workers, resources, progression)

**Backend Storage:**
- Provider: Appwrite (intended but not yet integrated)
- Purpose: User accounts, cloud save synchronization, multiplayer features
- Implementation: Prepared architecture, awaiting Phase 2 integration

**File Storage:**
- Status: Not currently used
- Assets: Static files in `public/` directory
  - `favicon.svg` - App favicon
  - `icons.svg` - Sprite sheet for game icons

**Caching:**
- Method: In-memory (Zustand store state)
- Market prices: Updated at most once per minute by `marketService`
- No external caching layer (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- Service: Appwrite (configured but not yet active)
- Implementation: Prepared via `src/services/appwrite.ts` client
- Frontend scope: Anonymous/session-based (no user accounts required yet)
- Backend scope: Appwrite handles auth logic (not implemented in frontend)

**User Management:**
- Status: Not yet integrated
- Planned: Phase 2 integration with Appwrite user system
- Current: No user login/registration flows

## Monitoring & Observability

**Error Tracking:**
- Service: None detected
- Logging: Browser console only
  - `console.log()` - General info (Appwrite ping success)
  - `console.error()` - Error messages
  - `console.warn()` - Warnings (Appwrite ping failures)

**Event Logging:**
- Type: Internal event bus
- Implementation: `src/services/eventBus.ts` with event pub/sub
- Storage: In-memory event log (500 event max buffer)
- Events tracked: All 50+ game event types (story, production, progression, economy)
- No persistence to external service

**Performance Monitoring:**
- Status: Not implemented
- Market service tracks time since update for throttling (once per minute)

## CI/CD & Deployment

**Hosting:**
- Platform: Static hosting (SPA via Vite build output)
- Output directory: `dist/` (gitignored)
- Build output: ES2023 JavaScript bundles + CSS

**CI Pipeline:**
- Service: Not detected (no GitHub Actions, Jenkins, etc. configured in src/)
- Build command: `npm run build` (TypeScript + Vite)
- Validation: `npm run validate:system` (lint + build + strict tests)

**Development Workflow:**
- Dev server: `npm run dev` (Vite with HMR)
- Build tool: Vite with React plugin

## Environment Configuration

**Required env vars:**
```
VITE_APPWRITE_ENDPOINT       # Default: https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID     # Default: infinity-fg
```

**Optional env vars:**
- None currently detected beyond Appwrite config

**Secrets location:**
- `.env` file (local, not committed)
- Template: `.env.example` shows expected format
- Note: Appwrite API keys should NOT be in frontend variables (only backend)

**Config files:**
- `vite.config.ts` - Vite configuration
- `tsconfig.app.json` - TypeScript compilation targets

## Webhooks & Callbacks

**Incoming:**
- Status: None detected
- Preparation: Appwrite webhooks not yet configured

**Outgoing:**
- Status: None detected
- Event system: Internal only (eventBus pub/sub)
- No external webhook dispatches

## Internal Event System

**Event Bus:**
- Location: `src/services/eventBus.ts`
- Pattern: Pub/sub with type-safe event payloads
- Event types: 50+ defined event types covering:
  - Story progression (chapters, quests, bosses)
  - Content unlocks (crops, machines, workers, skills)
  - Production (planting, harvesting, selling)
  - Worker management (hiring, assignment, leveling)
  - Economy (price changes, merchant offers)
  - Crafting (recipe completion)
  - Prestige and achievements

**React Integration:**
- Hooks: `useGameEvent()`, `useRecentEvents()`, `useNewsEvents()`
- Auto-cleanup: Subscriptions removed on component unmount

## Market Service

**Location:** `src/services/marketService.ts`

**Functionality:**
- Dynamic crop pricing with 3 tunable parameters
- Price trends: rising/falling/stable
- Weather-based price adjustments
- Merchant offers system
- Price update throttling: once per minute max

**Data Format:**
- MarketPrice: cropId, basePrice, currentMultiplier, trend, weather impact
- MerchantOffer: Types include crop_price_bonus, machine_discount, worker_deal, recipe_unlock, bulk_order
- Tunables: PRICE_VOLATILITY, TREND_MOMENTUM, WEATHER_IMPACT

**Integration:**
- Called from: `src/store/gameStore.ts` tick function
- Event emission: MARKET_PRICE_CHANGED events via eventBus

## Other Services

**Unlock Service:**
- Location: `src/services/unlockService.ts`
- Purpose: Phase 2 content unlock pipeline
- Integration: Works with eventBus for CONTENT_AVAILABLE and CONTENT_UNLOCKED events

**Event Bus Integration Points:**
- All major game systems subscribe to relevant events
- No external API calls; internal coordination only

---

*Integration audit: 2026-03-28*
