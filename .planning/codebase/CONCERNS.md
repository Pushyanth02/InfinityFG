# Codebase Concerns

**Analysis Date:** 2026-03-28

## Tech Debt

**Weak ID Generation (Collision Risk):**
- Issue: Multiple systems use `Date.now() + Math.random().toString(36)` for generating unique IDs. This approach is susceptible to collisions under rapid successive calls.
- Files: `src/services/marketService.ts`, `src/store/slices/workerAssignmentSlice.ts`, `src/ui/VillageNews.tsx`
- Impact: Worker instances, merchant offers, and news items could have duplicate IDs if multiple are created in the same millisecond, causing state inconsistencies and UI rendering bugs.
- Fix approach: Implement crypto-based UUID generation (e.g., `crypto.randomUUID()` or a library like `uuid`) to guarantee globally unique IDs.

**String Parsing Without Validation:**
- Issue: Chapter IDs are parsed using regex and `parseInt()` without defensive checks. Multiple places extract numeric values from string IDs.
- Files: `src/data/chapters.ts`, `src/services/unlockService.ts`, `src/store/slices/craftingSlice.ts`
- Impact: If malformed chapter IDs exist in state or data, parsing returns `0` or `NaN`, causing silent logical errors. Crafting station tier detection (`/tier(\d+)/i`) fails silently if the string doesn't match.
- Fix approach: Add explicit validation functions with clear error handling. Return typed results or throw explicit errors instead of falling back to defaults.

**Large Auto-Generated Data Files:**
- Issue: `src/data/machine_upgrades.ts` is 2,634 lines. It's marked as "Auto-generated" but lacks validation of the generation process.
- Files: `src/data/machine_upgrades.ts`, `src/data/crops.ts` (1,439 lines), `src/data/machines.ts` (1,054 lines)
- Impact: Changes to data generation scripts could introduce invalid data silently. No schema validation between generation and runtime. Updates are error-prone.
- Fix approach: Add runtime schema validation on load. Implement validation step in the economy generation pipeline that runs before committing generated files.

**No Input Validation on State Mutations:**
- Issue: Store actions don't validate parameters before updating state (e.g., buying machines, crafting, assigning workers).
- Files: `src/store/slices/automationSlice.ts`, `src/store/slices/craftingSlice.ts`, `src/store/slices/farmSlice.ts`
- Impact: Invalid state can be written if functions are called with bad parameters. No safeguards against negative coins, duplicate worker assignments, or missing recipe lookups.
- Fix approach: Add input validation guards at the start of each action. Verify preconditions before mutations (sufficient coins, valid IDs, unlock requirements met).

## Known Bugs

**Potential Craft Queue Infinite Loop:**
- Symptoms: Crafting queue processing could skip items or process them out of order
- Files: `src/store/slices/craftingSlice.ts` (lines 97-110)
- Trigger: If `Date.now()` drifts or multiple items have identical `completeAt` times
- Workaround: None currently implemented
- Root cause: Queue is filtered but items aren't removed atomically; race conditions possible in tick processing

**Event Bus Error Suppression:**
- Symptoms: Handler errors are logged but not surfaced; failed event subscriptions fail silently
- Files: `src/services/eventBus.ts`
- Trigger: Any event handler that throws an exception
- Workaround: Check console logs for suppressed errors
- Root cause: Error handlers catch and log but don't report failures to caller

**Worker Trust Lookup Missing Type Safety:**
- Symptoms: Accessing worker trust on non-existent workers returns 0 by default
- Files: `src/store/slices/workerAssignmentSlice.ts`, `src/store/slices/craftingSlice.ts` (line 59)
- Trigger: Checking trust for a worker that doesn't exist
- Root cause: Getter uses `?? 0` fallback without validating worker existence

## Security Considerations

**No Validation of Cost Parameters in Purchase Functions:**
- Risk: A malicious actor could potentially craft state mutations that bypass cost checks or unlock conditions.
- Files: `src/store/slices/automationSlice.ts`, `src/store/slices/farmSlice.ts`, `src/store/slices/craftingSlice.ts`
- Current mitigation: Client-side checks in UI before calling purchase methods; localStorage persisted state.
- Recommendations:
  - Implement server-side validation (Phase 2 backend when Appwrite integration completes).
  - Add cryptographic checksums to saved game state to detect tampering.
  - Audit all financial mutations (coin transfers, purchases) before release.

**Appwrite Client Configuration Hardcoded:**
- Risk: If the hardcoded endpoint or project ID is changed maliciously, the frontend could connect to an attacker's Appwrite instance.
- Files: `src/services/appwrite.ts`
- Current mitigation: Environment variables `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID` with safe defaults.
- Recommendations:
  - Validate that the endpoint is from an approved list of domains.
  - Implement API key rotation strategy when Phase 2 backend APIs are implemented.
  - Consider using secure device binding for multiplayer features when added.

**Market Data Lacks Persistence Validation:**
- Risk: Market prices are calculated dynamically but not backed by server state. Replay attacks or state deserialization attacks could manipulate prices.
- Files: `src/services/marketService.ts`
- Current mitigation: Price updates happen locally; no server synchronization yet.
- Recommendations: When Appwrite syncs are implemented, validate market state against server canonical values.

## Performance Bottlenecks

**Production Engine Calculation on Every Tick:**
- Problem: `calculateMachineProduction()` in the game tick loop is called every frame without memoization or optimization.
- Files: `src/store/gameStore.ts` (line 56), `src/engine/mechanics.ts`
- Cause: All machines, workers, and skill bonuses are recalculated from scratch on every tick. No caching of intermediate values.
- Improvement path:
  - Memoize production multiplier calculations.
  - Only recalculate when state changes (workers assigned, skills unlocked, prestige gained).
  - Cache region/weather/equipment multipliers separately.

**Linear Search for Machine/Recipe/Chapter Lookup:**
- Problem: Frequent `.find()` calls to look up machines, recipes, and chapters by ID without index.
- Files: `src/store/slices/craftingSlice.ts`, `src/store/slices/automationSlice.ts`, `src/data/chapters.ts`
- Cause: Data is stored as flat arrays; no lookup maps created for fast access.
- Improvement path: Pre-compute lookup maps (machine ID → definition, recipe ID → definition) at store initialization. Update on new data loads.

**Market Price Updates Not Debounced:**
- Problem: `marketService.updatePrices()` creates new offer objects and recalculates all prices on every update.
- Files: `src/services/marketService.ts`, `src/store/gameStore.ts` (line 69)
- Cause: No request throttling; UI may re-render on every update even if visible change is minimal.
- Improvement path: Implement rate limiting on price broadcasts. Only emit `MARKET_PRICE_CHANGED` events if price delta exceeds threshold (e.g., 5% change).

**No Pagination on Story Book Content:**
- Problem: All chapters, workers, and story pages are rendered/indexed simultaneously.
- Files: `src/ui/StoryBookPage.tsx`, `src/data/chapters.ts`
- Cause: Chapter data is fully materialized; no lazy loading.
- Improvement path: For future expansion, implement virtualization or pagination for story content.

## Fragile Areas

**Unlock Evaluation System:**
- Files: `src/services/unlockService.ts`, `src/store/slices/storySlice.ts`
- Why fragile: Complex condition evaluation with many branches (chapter progress, quest completion, harvest tracking, region reputation, crafting). Missing fields in state gracefully default to 0, hiding logic errors.
- Safe modification:
  1. Add type guards for all optional fields in `UnlockEvaluationState`.
  2. Write comprehensive tests for each condition type before modifying evaluation logic.
  3. Keep backwards compatibility by maintaining fallback values for new fields.
- Test coverage: Unlock conditions are tested via simulation but no unit tests for edge cases.

**Worker Assignment Bonuses:**
- Files: `src/store/slices/workerAssignmentSlice.ts` (555 lines)
- Why fragile: Complex bonus calculation with multiple assignment types (global aura, machine, region, plot). Reassigning a worker requires recalculating all affected entities. No transactional safety if recalculation is interrupted.
- Safe modification:
  1. Extract bonus calculation into pure functions with clear inputs/outputs.
  2. Test reassignment logic with before/after state snapshots.
  3. Add invariant checks: total assigned + unassigned workers = total owned.
- Test coverage: No unit tests for bonus calculations; only integration testing via game simulation.

**Crafting Station Tier Detection:**
- Files: `src/store/slices/craftingSlice.ts` (lines 26-34)
- Why fragile: `station.match(/tier(\d+)/i)` is fragile string parsing. If station names change in data, parsing breaks silently. Defaults to tier 1 on mismatch.
- Safe modification:
  1. Define a proper `CraftStation` type with explicit tier values, not inferred from names.
  2. Add `testCraftStation()` validation function.
  3. Fail loud (throw error) instead of defaulting to tier 1.
- Test coverage: No tests for craft station matching logic.

**Weather and Region Multiplier Application:**
- Files: `src/engine/productionEngine.ts` (lines 155-160)
- Why fragile: Fixed multipliers (region, weather, equipment) are applied multiplicatively at the end. If any multiplier is missing from input, calculation is silently wrong (multiplier would be undefined, causing NaN).
- Safe modification:
  1. Add strict type checking to ensure all multipliers are provided.
  2. Use explicit defaults (1.0) if a multiplier is unknown.
  3. Log warnings when defaults are used for debugging.
- Test coverage: Tunable tests exist but don't cover all multiplier combinations.

## Scaling Limits

**Zustand Store Size:**
- Current capacity: Single monolithic store with 50+ fields across 8 slices
- Limit: No measured limit, but store updates on every tick (60+ FPS potential) could cause re-render storms
- Scaling path:
  - Monitor bundle size as more slices are added.
  - Split store into domain-specific slices if it exceeds 5,000 lines total.
  - Implement selective subscriptions to avoid re-rendering entire app on minor state changes.

**LocalStorage Persistence:**
- Current capacity: Browser localStorage (typically 5-10 MB limit)
- Limit: Zustand persist middleware stores entire state object as JSON. With hundreds of workers, machines, and story pages, could approach limit.
- Scaling path:
  - Implement compression or selective persistence (only critical state, not cached computations).
  - Plan migration to Appwrite for server-side persistence (Phase 2).
  - Test save/load with large late-game states (100+ machines, 50+ workers).

**Event Bus Subscription Memory:**
- Current capacity: Global event bus with unbounded subscribers
- Limit: No cleanup mechanism for subscriptions; memory leaks possible if components subscribe without unsubscribing.
- Scaling path:
  - Implement auto-cleanup for event handlers when components unmount.
  - Add listener count telemetry to detect leaks.
  - Consider event demultiplexing to reduce listener overhead.

## Dependencies at Risk

**Appwrite Client Library (v23.0.0):**
- Risk: SDK is not yet integrated into core game loop. When Phase 2 backend syncs are implemented, network failures could cause state desynchronization.
- Impact: User progress could diverge from server; offline/online transitions untested.
- Migration plan:
  1. Implement offline-first persistence: keep all mutations in localStorage.
  2. Sync on reconnection with conflict resolution strategy.
  3. Add comprehensive error handling for network timeouts.

**Zustand (v5.0.11):**
- Risk: No major version bump expected soon, but middleware API could break.
- Impact: If persist middleware changes, save/load functionality breaks.
- Migration plan: Lock version; plan migration to alternative state management if needed (e.g., Redux Toolkit for better time-travel debugging).

**TailwindCSS (v4.2.1):**
- Risk: Major version upgrade breaking layout/styling assumptions.
- Impact: UI could break on future upgrades.
- Migration plan: Test all UI components before upgrading; maintain compatibility tests for minor versions.

## Missing Critical Features

**No Save Game Versioning:**
- Problem: Loaded saves have no version number. If game_config.json format changes, old saves break.
- Blocks: Adding new game features safely without breaking existing saves.
- Implementation: Add `saveVersion` field to persisted state. Implement migration functions for each version upgrade.

**No Offline Indicator:**
- Problem: No UI feedback when Appwrite connection is lost. Player doesn't know if their game is syncing.
- Blocks: Multiplayer/competitive features where sync state matters.
- Implementation: Add connection status indicator in UI; show sync queue depth for pending mutations.

**No Cheating Detection:**
- Problem: No validation that state changes are legitimate (e.g., coins increased without harvest).
- Blocks: Future leaderboards or competitive modes.
- Implementation: Add mutation signature validation; server-side verification in Phase 2 backend.

**No Game State Validation on Load:**
- Problem: Corrupted saves could cause crashes or undefined behavior.
- Blocks: Reliable recovery from bugs or player device failures.
- Implementation: Add schema validation on game load; auto-repair common corruption patterns (missing fields, invalid IDs).

## Test Coverage Gaps

**Production Engine Calculation:**
- What's not tested: Edge cases like 0 multipliers, very large multiplier stacks, prestige overflow.
- Files: `src/engine/productionEngine.ts`
- Risk: Numerical overflow or underflow could cause coins to become `Infinity` or `NaN`.
- Priority: High — production is the core game mechanic.
- Improvement: Add unit tests for max/min edge cases; fuzz test with randomized inputs.

**Worker Assignment Interactions:**
- What's not tested: Reassigning a worker from one machine to another; multi-assignment edge cases.
- Files: `src/store/slices/workerAssignmentSlice.ts`
- Risk: Bonuses could be double-counted or lost on reassignment.
- Priority: High — worker system is complex and state is easy to corrupt.
- Improvement: Add snapshot testing to verify before/after state consistency.

**Unlock Condition Evaluation:**
- What's not tested: Combinations of unlock conditions; backwards compatibility with missing state fields.
- Files: `src/services/unlockService.ts`
- Risk: Content could unlock at the wrong time or get stuck permanently locked.
- Priority: Medium — affects story progression but caught by QA simulation.
- Improvement: Parameterized tests for all condition types; regression tests when adding new conditions.

**Crafting Queue Processing:**
- What's not tested: Multiple items completing in the same tick; queue ordering under load.
- Files: `src/store/slices/craftingSlice.ts`
- Risk: Crafted items could be lost or duplicated.
- Priority: Medium — affects late-game economy but less likely to occur in normal play.
- Improvement: Add timing tests with synthetic tick sequences.

**Market Service Price Updates:**
- What's not tested: Price volatility bounds; offer expiration logic; simultaneous offer generation.
- Files: `src/services/marketService.ts`
- Risk: Prices could drift outside reasonable bounds; expired offers could reappear.
- Priority: Low — market is less critical to core progression but affects economy balance.
- Improvement: Add property-based tests for price bounds validation.

---

*Concerns audit: 2026-03-28*
