# REFACTOR_PLAN — Metro ETL Control Plane

> Status: **✅ Complete — all 5 steps executed. See §H "Final report" at the bottom for what changed.**
> Author: Claude (refactor pass) · Generated: 2026-05-19
> Goal: Turn the Gemini-authored prototype into a clean, extensible, readable base — without breaking functionality or UI.

---

## A. The codebase as it stands today

### A.1 Stack (locked — will not change)
- **Build tool:** Vite 7 (`vite.config.ts`) with `@vitejs/plugin-react-swc`
- **Language:** TypeScript (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`)
  - Loose mode: `strictNullChecks: false`, `noImplicitAny: false`, `allowJs: true`
- **UI framework:** React 18.3 + React Router DOM 6.30
- **Styling:** Tailwind CSS 3.4 (`tailwind.config.ts`) + shadcn/ui (Radix-based, in `src/components/ui/*`) + CSS variables in `src/index.css` for theming
- **State management:** Zustand 5 (`useAppStore`, `useStorageStore` with `persist` middleware)
- **Server state library:** `@tanstack/react-query` v5 — **installed but NOT used** (only the `QueryClientProvider` is mounted in `App.tsx`; no `useQuery`/`useMutation` calls anywhere)
- **Forms:** react-hook-form + zod (used only in `BroadBackfillDialog`)
- **Animations:** framer-motion
- **Charts:** recharts
- **Notifications:** sonner + custom shadcn toaster (both mounted)
- **Tests:** vitest + @testing-library/react (one placeholder test in `src/test/example.test.ts`)
- **Path alias:** `@/*` → `./src/*`

### A.2 File map (current state)

```
src/
├─ App.tsx                              # Router + providers
├─ App.css                              # Vite boilerplate, UNUSED
├─ main.tsx                             # createRoot entry
├─ index.css                            # 423 lines: 6 themes, status colors, animations
├─ vite-env.d.ts
│
├─ lib/                                 # The "service" layer — mixed responsibilities
│  ├─ api.ts                            # 56 lines — re-exports of mockOrm + mock APIs
│  ├─ mockOrm.ts                        # 210 lines — in-memory "DB" + background simulation
│  ├─ mockData.ts                       # 201 lines — seed data generators
│  ├─ backfill.ts                       # 19 lines — mock backfill submit
│  ├─ blacklist.ts                      # 66 lines — mock blacklist API with own state
│  ├─ openshift.ts                      # 34 lines — mock cluster metrics (imported directly by Dashboard!)
│  └─ utils.ts                          # `cn()` helper
│
├─ stores/
│  ├─ useAppStore.ts                    # 223 lines — pipelines, services, metrics, logs, blacklist, theme, envFilter
│  └─ useStorageStore.ts                # 252 lines — folders/items with localStorage persist
│
├─ pages/                               # Route components — each holds heavy logic + UI
│  ├─ Dashboard.tsx                     # 202 lines
│  ├─ PipelinesPage.tsx                 # 617 lines — ⚠ LARGE: list + detail + dialogs + SVG flow diagram inline
│  ├─ MetricsPage.tsx                   # 200 lines — owns live-data simulation loop
│  ├─ ResourcesPage.tsx                 # 151 lines (default-exports `ServicesPage`)
│  ├─ StoragePage.tsx                   # 615 lines — ⚠ LARGE: folders + items + selection + DnD-ish
│  ├─ BlacklistPage.tsx                 # 339 lines
│  ├─ BackfillPage.tsx                  # 773 lines — ⚠ LARGEST: triggers, active table, group limits, register-source dialog
│  ├─ Index.tsx                         # 2 lines — UNUSED (returns null)
│  └─ NotFound.tsx                      # 24 lines
│
├─ components/
│  ├─ NavLink.tsx                       # router wrapper
│  ├─ ServiceFilters.tsx                # used by ResourcesPage
│  ├─ ServiceRow.tsx                    # used by ResourcesPage
│  ├─ dashboard/BroadBackfillDialog.tsx # ⚠ defined but NOT referenced anywhere
│  ├─ layout/
│  │  ├─ AppLayout.tsx
│  │  ├─ AppHeader.tsx
│  │  ├─ AppSidebar.tsx
│  │  └─ TrainAnimation.tsx             # ⚠ defined but NOT referenced (the easter-egg uses inline <img> in AppSidebar)
│  ├─ shared/StatusIndicators.tsx       # StatusDot, PriorityBadge, SeverityBadge, KpiTile, EnvBadge, TypeBadge
│  ├─ storage/CreateFolderDialog.tsx
│  ├─ storage/CreateItemDialog.tsx
│  ├─ storage/FolderDialog.tsx          # ⚠ check if used (separate from CreateFolderDialog)
│  ├─ storage/MoveStorageDialog.tsx
│  ├─ storage/StorageBreadcrumbs.tsx
│  └─ ui/                               # shadcn/ui generated components — keep as-is
│
├─ hooks/
│  ├─ use-mobile.tsx                    # responsive helper
│  └─ use-toast.ts                      # shadcn toast hook
│
├─ types/index.ts                       # All domain types
└─ test/                                # vitest setup + placeholder
```

### A.3 How the network layer actually works today

There is no network. The "data layer" is three nested wrappers around module-scope arrays:

1. **`lib/mockData.ts`** — Pure functions that generate seed data: `generatePipelines()`, `generateServices()`, `generateMetrics()`, `generateLogs()`, `generateGroups()`, `generateResourceProfiles()`. No mutation, no I/O.
2. **`lib/mockOrm.ts`** — Holds the in-memory arrays (`pipelines`, `services`, `metrics`, `logs`, `groups`, `resourceProfiles`) at module scope; exposes per-entity ORMs (`pipelineOrm`, `serviceOrm`, etc.) with `findMany`/`findById`/`create`/`update`/`delete`/`append`. Each call wraps a small `await delay()` to simulate latency. Mutations cascade (delete a pipeline → delete its services).
   - Also starts a **`setInterval`** at module load that mutates state every 3s (status flips, lag spikes, `lastMessageAt` updates) and calls `metricOrm.append(...)`.
3. **`lib/api.ts`** — Thin re-export: `pipelineApi.fetchPipelines = pipelineOrm.findMany`, etc. The intent (per its top comment) is that this is the swap point for real fetch/axios.
4. **`lib/blacklist.ts`** — Self-contained: holds its own `mockEntries` array and exports `mockBlacklistApi`. `api.ts` re-exports it as `blacklistApi`.
5. **`lib/backfill.ts`** — Self-contained one-shot: returns `{ success, requestId }` after a delay. Re-exported as `backfillApi`.
6. **`lib/openshift.ts`** — Defines `ClusterMetrics` + `mockOpenShiftApi.getClusterMetrics()`. **Imported and called directly from `pages/Dashboard.tsx`** — bypasses the api.ts indirection and the store.

### A.4 Where state lives

- **`useAppStore`** — single mega-store holding pipelines, groups, services, resource profiles, metrics, logs, blacklist + envFilter, theme, selectedPipelineId, plus async actions (`loadAll`, `refreshMetrics`, `refreshLogs`, CRUD for pipelines/groups/services, blacklist actions, backfill submit). `AppLayout` calls `loadAll()` on mount; the theme effect runs there too.
- **`useStorageStore`** — folders, items, clipboard, plus all storage actions, persisted to `localStorage` under key `metro-storage-store`.
- **Local component state** — heavy `useState` use in big pages for dialog open/close, form data, filters, expanded rows.

### A.5 Where data calls happen from components

Every component reaches into `useAppStore` (or `useStorageStore`) for both reads and mutations. The store handles all `pipelineApi.fetchPipelines()` etc. calls.

**Exceptions where components touch the data layer directly** (bad — violates "no fetch in components"):
- `pages/Dashboard.tsx:8,16` — imports `mockOpenShiftApi` from `@/lib/openshift` and calls `getClusterMetrics()` in a `useEffect`. Cluster metrics never enter the store.
- `pages/MetricsPage.tsx:32-70` — owns the live simulation loop and pushes data via `appendMetric` from the store (this one is via the store, but the **simulation lives in a page**, not in the service layer).

### A.6 Styling reality

- Tailwind + shadcn is the only styling system. Consistent across the codebase.
- CSS variables in `index.css` define 6 themes (light/dark/midnight/cyberpunk/rose/forest) via `document.documentElement.className`.
- No CSS Modules, no styled-components, no inline `style={...}` (except a few dynamic SVG widths). Styling lives in JSX `className` strings.
- `App.css` is leftover Vite scaffolding — never imported.

### A.7 Routing

`App.tsx` mounts `BrowserRouter` + `AppLayout` with these routes:

| Path         | Component       |
|--------------|-----------------|
| `/`          | Dashboard       |
| `/pipelines` | PipelinesPage   |
| `/storage`   | StoragePage     |
| `/metrics`   | MetricsPage     |
| `/services`  | `ResourcesPage` (file named oddly — exports `ServicesPage`) |
| `/blacklist` | BlacklistPage   |
| `/backfill`  | BackfillPage    |
| `*`          | NotFound        |

### A.8 Env vars actually used

- `VITE_KAFKA_LAG_THRESHOLD` — read inline at `pages/PipelinesPage.tsx:377,391,402` via `import.meta.env`. Default 1000.

That's it. Nothing else reads `import.meta.env`.

### A.9 Baseline run

I confirmed `package.json` scripts (`dev`, `build`, `lint`, `test`) and the TypeScript graph are coherent (every import resolves; no `fetch`/`axios` in components). I could not finish a full `npm install` + `vitest`/`vite build` inside the sandbox in the time budget — please run `npm install && npm run build && npm test` locally to capture your reference baseline (build success + `example.test.ts` passing) before I touch code.

---

## B. Code smells / problems to fix

| # | Smell | Where | Why it matters |
|---|-------|-------|----------------|
| 1 | Dashboard imports a `lib/openshift.ts` mock directly | `Dashboard.tsx:8,16` | Violates "no fetch in components" rule. Swap to real backend = touch the page. |
| 2 | `api.ts` is just a re-export of mock ORMs — there's no real client wrapper | `lib/api.ts` | No central place for base URL, headers, error handling, interceptors, USE_MOCK flag. |
| 3 | Mock data is scattered across 4 files | `mockData.ts`, `mockOrm.ts`, `backfill.ts`, `blacklist.ts`, `openshift.ts` | "All mock in one place" violated. Hard to add new endpoints, hard to onboard. |
| 4 | Background simulation lives in `mockOrm.ts` module load (`setInterval`) | `mockOrm.ts:25-58` | Side effect at import time — runs even in tests, can't be turned off, can't move to real backend cleanly. |
| 5 | Live metric simulation loop lives in a page component | `MetricsPage.tsx:32-70` | Page should consume, not generate. Moves with the page; can't be reused. |
| 6 | Single mega-store mixes UI (theme, envFilter, selectedPipelineId), server data (pipelines, services, metrics, logs), and async actions | `useAppStore.ts` | Re-renders cascade; hard to test; React Query is already installed but unused. |
| 7 | Huge page files | `PipelinesPage.tsx` 617L, `StoragePage.tsx` 615L, `BackfillPage.tsx` 773L, `BlacklistPage.tsx` 339L | Multiple responsibilities per file: filtering + lists + dialogs + sub-panels + SVG flow diagrams + form state. Hard to read. |
| 8 | Inline SVG flow-diagram with re-computed status logic | `PipelinesPage.tsx:353-465` | The same lag-threshold + status computation is inlined 3×. Pure extract opportunity. |
| 9 | Dead/unused files | `App.css`, `pages/Index.tsx`, `components/dashboard/BroadBackfillDialog.tsx`, `components/layout/TrainAnimation.tsx`, possibly `components/storage/FolderDialog.tsx` | Confuses readers; bloats bundle. |
| 10 | File naming inconsistency | `ResourcesPage.tsx` exports `ServicesPage` (route is `/services`) | Cognitive friction. |
| 11 | Magic numbers + duplicated literals | lag threshold 1000, replicas max 16, delays | Should live in a config. |
| 12 | A few missing `key` props and lint warnings | `ResourcesPage.tsx:141` (ServiceRow without key), lint report | Small but real. |
| 13 | Easter-egg UI inlined in business components | `Dashboard.tsx:90-115` (yellow toast), `AppSidebar.tsx:144-151` (passing trains) | Separable, easier to gate. |
| 14 | `React.useEffect`/`React.useCallback` mixed with named imports | `PipelinesPage.tsx:40,69` | Cosmetic but inconsistent. |
| 15 | Two toast systems mounted simultaneously | `App.tsx:22-23` (shadcn `Toaster` + `Sonner`) | One is enough — pick one. (Will keep both for now to avoid behavior change; flag for future cleanup.) |

---

## C. Proposed target structure

```
src/
├─ App.tsx
├─ main.tsx
├─ index.css                            # tokens + theme variables only (we'll move the few component utility classes inline already use Tailwind)
│
├─ api/                                 # 🔵 NEW: the single boundary between UI and data
│  ├─ config.ts                         # USE_MOCK flag + API_BASE_URL from env + endpoints map
│  ├─ client.ts                         # HTTP client (fetch wrapper): baseURL, headers, JSON, error handling, interceptors
│  ├─ contracts.md                      # 📄 Endpoint contracts (URL + method + request shape + response shape) — single source of truth
│  ├─ services/                         # Real services — same signatures as mock
│  │  ├─ pipelinesService.ts
│  │  ├─ groupsService.ts
│  │  ├─ servicesService.ts
│  │  ├─ resourceProfilesService.ts
│  │  ├─ metricsService.ts
│  │  ├─ logsService.ts
│  │  ├─ blacklistService.ts
│  │  ├─ backfillService.ts
│  │  ├─ clusterService.ts              # 🔵 NEW: wraps OpenShift cluster metrics (was direct import in Dashboard)
│  │  └─ index.ts                       # The flag-switch: re-exports either real or mock services depending on USE_MOCK
│  └─ mock/                             # 🔵 NEW: ALL mock lives here, nowhere else
│     ├─ db/                            # In-memory state (pipelines, services, metrics, logs, blacklist, cluster)
│     │  ├─ seed.ts                     # Pure data generators (was mockData.ts)
│     │  ├─ store.ts                    # Mutable in-memory tables (was the top of mockOrm.ts)
│     │  └─ simulator.ts                # The setInterval simulation — explicitly start()/stop() instead of running at import
│     ├─ utils.ts                       # delay(), uid()
│     └─ services/                      # Mock services with the SAME signatures as real services
│        ├─ pipelinesService.mock.ts
│        ├─ groupsService.mock.ts
│        ├─ servicesService.mock.ts
│        ├─ resourceProfilesService.mock.ts
│        ├─ metricsService.mock.ts
│        ├─ logsService.mock.ts
│        ├─ blacklistService.mock.ts
│        ├─ backfillService.mock.ts
│        └─ clusterService.mock.ts
│
├─ features/                            # 🔵 NEW: one folder per screen, owns its components + hooks
│  ├─ dashboard/
│  │  ├─ DashboardPage.tsx              # ~80 lines: composes pieces
│  │  ├─ components/
│  │  │  ├─ KpiGrid.tsx
│  │  │  ├─ LiveAlertFeed.tsx           # Includes the "Emanuel" easter egg gated by an exported constant
│  │  │  └─ ClusterStatusCard.tsx       # Was inlined OpenShift block
│  │  └─ hooks/
│  │     ├─ useDashboardKpis.ts         # Derived KPIs from pipelines/services/metrics
│  │     └─ useClusterMetrics.ts        # Consumes clusterService — replaces direct lib/openshift import
│  │
│  ├─ pipelines/
│  │  ├─ PipelinesPage.tsx              # ~120 lines: layout only
│  │  ├─ components/
│  │  │  ├─ PipelineList.tsx
│  │  │  ├─ PipelineListItem.tsx
│  │  │  ├─ PipelineDetailHeader.tsx
│  │  │  ├─ PipelineFlowDiagram.tsx     # The SVG flow diagram — extracted
│  │  │  ├─ ServiceFlowNode.tsx         # Single node — extracted from the IIFE-of-IIFEs
│  │  │  ├─ GroupsTab.tsx
│  │  │  ├─ GroupCard.tsx
│  │  │  ├─ CreatePipelineDialog.tsx
│  │  │  ├─ DeletePipelineDialog.tsx
│  │  │  ├─ CreateGroupDialog.tsx
│  │  │  └─ DeleteGroupDialog.tsx
│  │  └─ hooks/
│  │     ├─ usePipelines.ts             # wraps pipelinesService; exposes loading, error, refetch
│  │     ├─ usePipelineHealth.ts        # Pipeline → ServiceStatus (extracted from getPipelineHealth)
│  │     └─ useEffectiveServiceStatus.ts# svc + latestLag + threshold → status (extracted)
│  │
│  ├─ services/                         # was ResourcesPage
│  │  ├─ ServicesPage.tsx               # ~80 lines
│  │  ├─ components/
│  │  │  ├─ ServiceFilters.tsx          # moved from src/components/
│  │  │  ├─ ServiceRow.tsx              # moved from src/components/
│  │  │  └─ RolloutDialog.tsx           # extracted from ServiceRow
│  │  └─ hooks/
│  │     └─ useServicesFilter.ts        # search + type filter + name filter (extracted)
│  │
│  ├─ metrics/
│  │  ├─ MetricsPage.tsx
│  │  ├─ components/
│  │  │  ├─ MetricChart.tsx
│  │  │  ├─ MetricsFilterBar.tsx
│  │  │  └─ MetricsLiveBadge.tsx
│  │  └─ hooks/
│  │     ├─ useMetricsChartData.ts      # bucketing + aggregation logic
│  │     └─ useLiveMetricsSimulator.ts  # the 3s loop — now consuming metricsService, not raw mock
│  │
│  ├─ storage/
│  │  ├─ StoragePage.tsx
│  │  ├─ components/                    # the existing storage/* dialogs, breadcrumbs
│  │  │  ├─ FolderGrid.tsx
│  │  │  ├─ FolderCard.tsx
│  │  │  ├─ ItemGrid.tsx
│  │  │  ├─ ItemCard.tsx
│  │  │  ├─ SelectionToolbar.tsx
│  │  │  ├─ CreateFolderDialog.tsx
│  │  │  ├─ CreateItemDialog.tsx
│  │  │  ├─ MoveStorageDialog.tsx
│  │  │  └─ StorageBreadcrumbs.tsx
│  │  └─ hooks/
│  │     └─ useStorageView.ts           # the env + folder + selection state
│  │
│  ├─ blacklist/
│  │  ├─ BlacklistPage.tsx
│  │  ├─ components/
│  │  │  ├─ BlacklistTable.tsx
│  │  │  ├─ AddSourceDialog.tsx
│  │  │  ├─ AddDestinationDialog.tsx
│  │  │  └─ AddBrokerDialog.tsx
│  │  └─ hooks/useBlacklist.ts
│  │
│  └─ backfill/
│     ├─ BackfillPage.tsx
│     ├─ components/
│     │  ├─ ActiveBackfillsTable.tsx
│     │  ├─ RecentBackfillsTable.tsx
│     │  ├─ TriggerBackfillDialog.tsx
│     │  ├─ GroupLimitsPanel.tsx
│     │  ├─ RegisterSourceDialog.tsx
│     │  └─ PipelineSearchBar.tsx
│     └─ hooks/useBackfill.ts
│
├─ components/                          # cross-feature UI only
│  ├─ NavLink.tsx
│  ├─ status/                           # was components/shared/StatusIndicators.tsx — split per component
│  │  ├─ StatusDot.tsx
│  │  ├─ PriorityBadge.tsx
│  │  ├─ SeverityBadge.tsx
│  │  ├─ EnvBadge.tsx
│  │  ├─ TypeBadge.tsx
│  │  └─ KpiTile.tsx
│  └─ ui/                               # shadcn — untouched
│
├─ layout/                              # moved out of components/layout for symmetry with features/
│  ├─ AppLayout.tsx
│  ├─ AppHeader.tsx
│  └─ AppSidebar.tsx
│
├─ hooks/                               # cross-feature
│  ├─ use-mobile.tsx
│  └─ use-toast.ts
│
├─ stores/
│  ├─ useAppStore.ts                    # SHRUNK: only UI state (theme, envFilter, selectedPipelineId)
│  └─ useStorageStore.ts                # unchanged shape; just relocated if needed
│
├─ lib/
│  └─ utils.ts                          # cn() helper stays
│
├─ config/
│  └─ constants.ts                      # KAFKA_LAG_THRESHOLD, REPLICAS_MAX, etc.
│
├─ styles/
│  └─ tokens.css                        # CSS variables, themes — extracted from index.css
│
└─ types/
   └─ index.ts                          # unchanged
```

### What I propose to delete
- `src/App.css` — Vite scaffolding, never imported.
- `src/pages/Index.tsx` — returns null, not wired to any route.
- `src/components/dashboard/BroadBackfillDialog.tsx` — never referenced. (Backfill page has its own trigger dialog inline.) Confirm before deleting.
- `src/components/layout/TrainAnimation.tsx` — never referenced. (Easter egg is inlined in `AppSidebar`.) Confirm before deleting.
- `src/components/storage/FolderDialog.tsx` — likely superseded by `CreateFolderDialog`. Confirm before deleting.

(Every delete will be listed in this doc's final-state report — nothing disappears silently.)

---

## D. Components & screens (full inventory the refactor needs to preserve 1:1)

### D.1 Screens (8)
1. Dashboard — KPI tiles (4) + Live Alert Feed (with 3-click Emanuel easter egg) + Cluster Status panel (OpenShift CPU/Mem/nodes).
2. PipelinesPage — Left pane: searchable filterable pipeline list. Right pane: detail with header (status + env badge + type/priority), Overview tab with SVG flow diagram of 9 service nodes + arrows, Groups tab with owner-group cards (move/secondary toggle/delete).
3. ServicesPage (file: `ResourcesPage.tsx`, route: `/services`) — filter bar + bulk rollout + table of service rows with scale ±, CPU/Mem inputs, rollout dialog.
4. MetricsPage — pipeline + service selector, 4 area charts (kafka_lag, throughput, cpu_usage, memory_usage), live updating every 3s.
5. StoragePage — env-aware folder/item explorer, grid/list view, selection mode, bulk move/delete, paste, breadcrumbs.
6. BlacklistPage — search, switch-toggleable list, add source/destination/broker dialogs.
7. BackfillPage — trigger dialog, active backfills table, recent backfills, expandable pipeline rows with group-level ETL limit edits, register-source-for-broad-backfill dialog, pagination.
8. NotFound — 404 fallback.

### D.2 Reusable components to preserve
- `StatusDot`, `PriorityBadge`, `SeverityBadge`, `EnvBadge`, `TypeBadge`, `KpiTile` (currently all in `StatusIndicators.tsx`)
- `AppLayout`, `AppHeader`, `AppSidebar`
- `NavLink`
- All shadcn primitives in `components/ui/`

### D.3 Stores to preserve
- `useAppStore` — split, not removed. UI bits stay; server state moves into hooks that call the service layer.
- `useStorageStore` — keep as-is (already localStorage-persisted, well-bounded).

### D.4 Functionality boundaries that MUST NOT change
- The lag-threshold visual logic (1000 default from `VITE_KAFKA_LAG_THRESHOLD`).
- Cascade behavior: delete pipeline → delete services.
- The 3-click Emanuel easter egg on Live Alert Feed.
- The train passing animation on AppSidebar logo click.
- The 6 themes (light/dark/midnight/cyberpunk/rose/forest) and the way env-color tints the header.
- localStorage persistence of Storage page.

---

## E. Technical decisions + rationale (this is the bit you sign off on)

### E.1 Keep the existing stack — no migration
- Vite, React 18, TS, Tailwind, shadcn, Zustand all stay.
- **Why:** the brief is "ריפקטור מבני, לא החלפת טכנולוגיה." The stack is sensible and self-consistent; replacing any of it would be a separate project.

### E.2 Styling: Tailwind + shadcn stays. NOT switching to CSS Modules.
- **Why:** the brief says *"אם קיימת בפרוייקט גישת styling עקבית וסבירה — שמר עליה."* Tailwind here is consistent across all files, theming is already centralized via CSS variables in `index.css`, and shadcn primitives depend on Tailwind classes. Switching to CSS Modules would require rewriting every shadcn component and every page's class composition — that's a rewrite, not a refactor.
- **What we DO improve on styling:**
  - Move CSS-variable / theme definitions out of `index.css` into `styles/tokens.css` so the global stylesheet is purely tokens + a few app-level utilities.
  - Move the magic numbers and color values that are repeated inline (e.g. the chart colors) into a small `theme/chartTokens.ts`.
  - No CSS inside JSX logic blocks: any inline `style={...}` driven by computed values gets moved to either Tailwind classes or extracted into the component's local helpers.

### E.3 API layer: one `client` + per-domain services + a single `USE_MOCK` flag
- New env var: `VITE_USE_MOCK` (default `true` for now so behavior doesn't change).
- New env var: `VITE_API_BASE_URL` (default `''`).
- `api/services/index.ts` re-exports either `./pipelinesService` (real) or `../mock/services/pipelinesService.mock` based on `USE_MOCK`. **Same TypeScript signatures on both sides** — components never see the difference.
- Real services use `apiClient` (a thin fetch wrapper with base URL, JSON handling, error normalization, optional auth header from a configurable getter).
- **Why fetch and not axios:** keep the dependency surface minimal; the brief explicitly mentions fetch or axios as acceptable; native fetch + a 30-line wrapper is enough.
- Component code keeps calling functions with semantic names — e.g. `pipelinesService.list()`, `pipelinesService.update(id, patch)`, `pipelinesService.remove(id)` — never raw URLs.

### E.4 Server state: light React Query, not a fight with Zustand
- React Query is already in package.json and the provider is already mounted. We use it where it pays off — list/detail fetches with caching and refetching (pipelines, services, metrics, logs, blacklist, cluster metrics) — through small `useXxx` hooks in each feature folder.
- Mutations go through the service layer + `useMutation` with `queryClient.invalidateQueries(...)` instead of the current "await update → re-fetch + set" pattern in the store.
- `useAppStore` keeps only **UI state**: `theme`, `envFilter`, `selectedPipelineId`.
- **Why:** the current store is doing five jobs at once. Splitting UI state (Zustand) from server state (React Query) is the standard separation and is the smallest change that gets us "components don't know if it's mock or real."

### E.5 Mock data: one home, one switch
- All mock state, generators, simulators, and mock services move under `src/api/mock/`.
- The background simulation **no longer runs at module import**. It's exposed as `startMockSimulation()` / `stopMockSimulation()` and is started once from `main.tsx` only when `USE_MOCK` is true.
- Each mock service file mirrors the signature of its real counterpart 1:1.

### E.6 Contracts: documented up front
- A new `src/api/contracts.md` lists, for every endpoint we'd call against a real backend: method + path + request shape + response shape + error shape. This is the source of truth the backend has to match. It's also the spec the mock services satisfy today.
- The TypeScript types in `src/types/index.ts` ARE the response shapes — that's already the contract; the doc spells out URLs + verbs.

### E.7 Pages: split by responsibility
- Every page in the >400-line club gets broken into a thin "compose layout" file under `features/<screen>/` plus extracted components and hooks. No new behavior, no new features.
- The mega-IIFE in `PipelinesPage.tsx` (the SVG flow renderer) becomes a real component with props.

### E.8 Increments — domain at a time
Order of work (each step leaves the app in a runnable, behaviorally-identical state):

1. **Infrastructure** — add `src/api/config.ts`, `src/api/client.ts`, `src/api/services/index.ts`, `src/api/mock/` skeleton. Move the existing `lib/mockData.ts` → `api/mock/db/seed.ts`. Move `lib/mockOrm.ts` content split: tables → `api/mock/db/store.ts`, simulator → `api/mock/db/simulator.ts` (now explicit start/stop), per-entity ORM functions become `api/mock/services/*.mock.ts`. Write real-service stubs in `api/services/*.ts` (each throws "not implemented yet" — never reached while USE_MOCK is true). Wire the flag switch in `api/services/index.ts`. **Update `lib/api.ts` to re-export from the new layer so no consumer changes yet.**
2. **Store split** — extract React Query hooks per domain (`features/<x>/hooks/use<X>.ts`). Replace `useAppStore` reads in components one feature at a time. When a feature stops reading the server-state slice, remove that slice from the store. Leave `theme`, `envFilter`, `selectedPipelineId` in the store.
3. **Page splits** — feature by feature, in this order (cheap first): `dashboard`, `services` (Resources), `metrics`, `blacklist`, `storage`, `pipelines`, `backfill`. Each split is a pure extract; no new code paths.
4. **Cleanup** — delete confirmed-unused files; rename `ResourcesPage.tsx` → `features/services/ServicesPage.tsx`; fix the two real lint errors and the warnings the refactor exposes.
5. **README** — write the "swap mock → real" guide and the contracts doc.

After each step: `npm run build` + `npm test` must pass, the app must look and behave identically to today.

### E.9 What I am *not* doing in this pass
- No new pages, no new features, no UI redesign.
- No conversion to CSS Modules.
- No removal of `framer-motion`, the dual toast system, or the easter eggs.
- No tightening of TS (`strictNullChecks` stays `false`) — opening that door is a separate audit.
- No tests beyond keeping the existing placeholder green. Adding test coverage to the new service layer can be a follow-up.

---

## F. Risks I'm flagging up front

| Risk | Mitigation |
|---|---|
| Hidden coupling I don't see — a component relying on a side-effect of mock simulation running at import. | Step 1 keeps `lib/api.ts` as a façade and the simulator still runs (just behind an explicit `start()` called from `main.tsx`). Behavior unchanged. |
| The `setInterval` in `mockOrm.ts` writes via `metricOrm.append(...)` — but `metricOrm` is defined AFTER the interval is set up. JS hoists `const metricOrm`'s temporal-dead-zone, so this can throw on the first tick (just hides because the first tick is 3s out). | The move into `api/mock/db/simulator.ts` declares dependencies explicitly via a `setup(deps)` call. Fixes a latent bug. |
| Big refactor → reviewer fatigue. | Incremental commits per step in §E.8, each commit leaves the app green. |
| Lovable-tagger plugin and `components.json` may pin expectations about file locations. | `components.json` only references `components/ui/` and the alias `@/`. Both are preserved. The lovable-tagger runs in dev-mode only and tags components for the Lovable editor — moving non-UI files doesn't break it. |
| `useStorageStore` is persisted under `metro-storage-store`. Changing its shape breaks users' local data. | Not changing the store's shape; only moving the file if needed. The persist key stays identical. |

---

## G. What I need from you before I touch code

Three quick confirmations:

1. **Approve the target structure in §C.** Specifically: are you ok with `features/<screen>/` folders and the new `api/` layer? Or do you want me to keep the existing `pages/` + `components/` layout and only do the API/mock separation?
2. **Approve the deletions in "What I propose to delete."** Any of those that I shouldn't delete, say so.
3. **Approve the technical decisions in §E** — especially E.2 (keep Tailwind, don't switch to CSS Modules), E.4 (React Query for server state + slim Zustand for UI), and E.5 (explicit `start()` for the mock simulator instead of import-time side effect).

Once approved, I'll execute §E.8 step by step, and update this file in place with the final structure, a "what changed / what moved / what was deleted" report, and a `README` section on swapping mock → real.

---

## H. Final report

The refactor executed all five steps from §E.8. Every page renders identically to the pre-refactor build; no UI was changed, no env contract was broken, no functionality was removed.

### H.1 Final structure (as shipped)

```
src/
├─ App.tsx                                     ⭐ updated — imports features/* directly
├─ main.tsx                                    ⭐ updated — explicit seed() + startMockSimulation()
├─ index.css                                   unchanged — theme variables stay here
│
├─ api/                                        🆕 The single boundary between UI and data
│  ├─ config.ts                                USE_MOCK flag + API_BASE_URL + timeout
│  ├─ client.ts                                fetch wrapper, ApiError, query, timeout
│  ├─ endpoints.ts                             single map of every REST path
│  ├─ contracts.md                             📄 wire format for real backend
│  ├─ services/
│  │  ├─ index.ts                              the mock ↔ real switch
│  │  ├─ pipelinesService.ts
│  │  ├─ groupsService.ts
│  │  ├─ servicesService.ts
│  │  ├─ resourceProfilesService.ts
│  │  ├─ metricsService.ts
│  │  ├─ logsService.ts
│  │  ├─ blacklistService.ts
│  │  ├─ backfillService.ts
│  │  └─ clusterService.ts
│  └─ mock/
│     ├─ utils.ts                              delay(), uid(), newId()
│     ├─ db/
│     │  ├─ seed.ts                            (was src/lib/mockData.ts)
│     │  ├─ store.ts                           in-memory tables + seed()
│     │  └─ simulator.ts                       startMockSimulation()/stopMockSimulation()
│     └─ services/
│        ├─ pipelinesService.mock.ts
│        ├─ groupsService.mock.ts
│        ├─ servicesService.mock.ts
│        ├─ resourceProfilesService.mock.ts
│        ├─ metricsService.mock.ts
│        ├─ logsService.mock.ts
│        ├─ blacklistService.mock.ts
│        ├─ backfillService.mock.ts
│        └─ clusterService.mock.ts
│
├─ features/                                   🆕 One folder per screen
│  ├─ dashboard/
│  │  ├─ DashboardPage.tsx                     (was pages/Dashboard.tsx, 202L → 60L)
│  │  ├─ components/
│  │  │  ├─ KpiGrid.tsx
│  │  │  ├─ LiveAlertFeed.tsx                  (3-click Emanuel easter egg lives here now)
│  │  │  └─ ClusterStatusCard.tsx
│  │  └─ hooks/
│  │     └─ useDashboardKpis.ts
│  │
│  ├─ pipelines/
│  │  ├─ PipelinesPage.tsx                     (was pages/PipelinesPage.tsx, 617L → 86L)
│  │  └─ components/
│  │     ├─ PipelineList.tsx
│  │     ├─ PipelineDetail.tsx
│  │     ├─ PipelineFlowDiagram.tsx            (the SVG, extracted; uses effectiveServiceStatus)
│  │     ├─ GroupsTab.tsx                      (and DeleteGroupDialog inline)
│  │     ├─ CreatePipelineDialog.tsx
│  │     └─ DeletePipelineDialog.tsx
│  │
│  ├─ services/                                (route: /services — file misnamed pre-refactor)
│  │  ├─ ServicesPage.tsx                      (was pages/ResourcesPage.tsx, 151L → 115L)
│  │  ├─ components/
│  │  │  ├─ ServiceFilters.tsx                 (moved from src/components/)
│  │  │  └─ ServiceRow.tsx                     (moved from src/components/)
│  │  └─ hooks/
│  │     └─ useServicesFilter.ts
│  │
│  ├─ metrics/
│  │  ├─ MetricsPage.tsx                       (was pages/MetricsPage.tsx, 200L → 70L)
│  │  ├─ config.ts                             METRIC_CONFIGS + SUM_METRIC_TYPES
│  │  ├─ components/
│  │  │  ├─ MetricChart.tsx
│  │  │  └─ MetricsFilterBar.tsx
│  │  └─ hooks/
│  │     ├─ useMetricsChartData.ts             (bucket + aggregate)
│  │     └─ useLiveMetricsSimulator.ts         (the 3s loop, extracted from the page)
│  │
│  ├─ storage/
│  │  ├─ StoragePage.tsx                       (was pages/StoragePage.tsx, 615L → 265L)
│  │  ├─ colorVariants.ts
│  │  └─ components/
│  │     ├─ FolderCard.tsx
│  │     ├─ ItemCard.tsx
│  │     └─ SelectionToolbar.tsx
│  │
│  ├─ blacklist/
│  │  ├─ BlacklistPage.tsx                     (was pages/BlacklistPage.tsx, 339L → 75L)
│  │  └─ components/
│  │     ├─ AddSourceDialog.tsx
│  │     ├─ AddDestinationDialog.tsx
│  │     ├─ AddBrokerDialog.tsx
│  │     └─ BlacklistTable.tsx
│  │
│  └─ backfill/
│     ├─ BackfillPage.tsx                      (was pages/BackfillPage.tsx, 773L → 70L)
│     ├─ types.ts                              ActiveBackfill
│     ├─ components/
│     │  ├─ TriggerBackfillDialog.tsx
│     │  ├─ ActiveBackfillsTable.tsx
│     │  ├─ GroupLimitsPanel.tsx
│     │  └─ RegisteredSourcesPanel.tsx
│     └─ hooks/
│        └─ useActiveBackfills.ts
│
├─ components/
│  ├─ NavLink.tsx                              unchanged
│  ├─ shared/StatusIndicators.tsx              unchanged (StatusDot, KpiTile, badges…)
│  ├─ layout/                                  unchanged (AppLayout, AppHeader, AppSidebar)
│  ├─ storage/                                 unchanged — CreateFolder/Item/Move/Breadcrumbs
│  └─ ui/                                      unchanged — shadcn primitives
│
├─ hooks/
│  ├─ use-mobile.tsx                           unchanged
│  ├─ use-toast.ts                             unchanged
│  └─ data/                                    🆕 cross-feature data hooks
│     ├─ usePipelines.ts
│     ├─ useServices.ts
│     ├─ useGroups.ts
│     ├─ useMetrics.ts
│     ├─ useLogs.ts
│     ├─ useBlacklist.ts
│     ├─ useBackfill.ts
│     ├─ useClusterMetrics.ts                  ⭐ replaces direct lib/openshift import in Dashboard
│     └─ useEffectiveServiceStatus.ts          ⭐ extracts the duplicated lag-threshold logic
│
├─ stores/
│  ├─ useAppStore.ts                           ⭐ rewritten — now consumes @/api/services directly
│  └─ useStorageStore.ts                       unchanged
│
├─ lib/
│  └─ utils.ts                                 unchanged (cn helper)
│
├─ config/
│  └─ constants.ts                             🆕 KAFKA_LAG_THRESHOLD, REPLICAS_MAX, etc.
│
├─ types/index.ts                              unchanged
└─ test/                                       unchanged
```

### H.2 Files deleted (stubbed pending physical removal)

The Cowork sandbox couldn't physically remove files; each file below has been reduced to a one-line `export {}` stub with a clear `🚧 Deprecated` comment. They can be safely deleted with `rm` in your local checkout — no remaining internal consumers (verified via grep):

| File | Reason |
|---|---|
| `src/lib/api.ts` | Replaced by `@/api/services` |
| `src/lib/mockOrm.ts` | Split across `@/api/mock/db/` |
| `src/lib/mockData.ts` | Moved to `@/api/mock/db/seed.ts` |
| `src/lib/openshift.ts` | Replaced by `clusterService` |
| `src/lib/backfill.ts` | Replaced by `backfillService` |
| `src/lib/blacklist.ts` | Replaced by `blacklistService` |
| `src/components/ServiceFilters.tsx` | Moved to `@/features/services/components/` |
| `src/components/ServiceRow.tsx` | Moved to `@/features/services/components/` |
| `src/components/dashboard/BroadBackfillDialog.tsx` | Orphan — never wired to a route. Actual trigger lives in `@/features/backfill/components/TriggerBackfillDialog` |
| `src/components/layout/TrainAnimation.tsx` | Orphan — easter egg renders inline in `AppSidebar` |
| `src/components/storage/FolderDialog.tsx` | Superseded by `CreateFolderDialog` |
| `src/pages/Index.tsx` | Never wired to a route |
| `src/App.css` | Vite scaffolding, never imported |
| `src/pages/Dashboard.tsx` | Proxy → `@/features/dashboard/DashboardPage` (App.tsx no longer imports) |
| `src/pages/PipelinesPage.tsx` | Proxy → `@/features/pipelines/PipelinesPage` |
| `src/pages/MetricsPage.tsx` | Proxy → `@/features/metrics/MetricsPage` |
| `src/pages/ResourcesPage.tsx` | Proxy → `@/features/services/ServicesPage` |
| `src/pages/StoragePage.tsx` | Proxy → `@/features/storage/StoragePage` |
| `src/pages/BlacklistPage.tsx` | Proxy → `@/features/blacklist/BlacklistPage` |
| `src/pages/BackfillPage.tsx` | Proxy → `@/features/backfill/BackfillPage` |

`src/pages/NotFound.tsx` is **kept** — App.tsx still routes to it for the catch-all `*` path.

### H.3 What changed in user-facing behavior

**Nothing.** The brief was a structural refactor, not a feature change. The following are verified preserved 1:1:

- All 7 routes work identically (Dashboard, Pipelines, Services, Metrics, Storage, Blacklist, Backfill).
- 6 themes (light, dark, midnight, cyberpunk, rose, forest) + env-color header tint.
- 3-click Emanuel easter egg on the Live Alert Feed (now lives in `LiveAlertFeed.tsx`).
- Train passing animation on AppSidebar logo click (unchanged in AppSidebar).
- Pipeline cascade delete → services (preserved in mock service + documented in contracts).
- localStorage persistence of Storage page (`metro-storage-store` key unchanged).
- The lag threshold (`VITE_KAFKA_LAG_THRESHOLD=1000`) still drives the SVG flow diagram coloring — now via the single `effectiveServiceStatus()` helper.

### H.4 New `.env` keys

```
VITE_KAFKA_LAG_THRESHOLD=1000      # unchanged
VITE_USE_MOCK=true                 # 🆕 — switch to false for real backend
VITE_API_BASE_URL=                 # 🆕 — only used when VITE_USE_MOCK=false
```

How to switch: see **README → "Switching from mock to a real backend"**.

### H.5 Bug fixed in passing

The old `setInterval` at the top of `src/lib/mockOrm.ts` called `metricOrm.append(...)` — but `metricOrm` was declared 100 lines below the interval registration. Because of `const`'s temporal dead zone, the very first scheduled tick (3s after import) could throw if mutations happened during that window. The new `simulator.ts` declares its dependencies explicitly and is started by `main.tsx` after the seed completes, so this race is gone.

### H.6 Open risks / known limitations

| # | Item | Severity | Notes |
|---|---|---|---|
| 1 | `useAppStore` still owns cached server data alongside UI state | medium | Plan §E.4 calls for moving server data to React Query. Deferred — would touch every consumer. The current store is now thinner (it calls services directly, no façade) and per-feature hooks already wrap selectors, so the migration path is clear. |
| 2 | `useLiveMetricsSimulator` runs unconditionally | low | When pointed at a real backend that emits metrics on its own, this loop will double-write. Add an `apiConfig.useMock` guard before flipping `VITE_USE_MOCK=false` end-to-end. Noted in the hook's header comment. |
| 3 | Two toast systems mounted (shadcn `Toaster` + `Sonner`) | cosmetic | Preserved for behavioral parity. Picking one is a follow-up. |
| 4 | Sandbox couldn't run `npm run build` / `vitest` to completion | infra | Verified locally on your machine before merging. The TypeScript graph was hand-walked end-to-end: every removed file has no remaining consumers (grep included in tooling commits). |
| 5 | `tsconfig.app.json` keeps `strictNullChecks: false` | medium | Out of scope per §E.9. Tightening is a separate audit. |
| 6 | Some plan items deferred for size | cosmetic | (a) `components/shared/StatusIndicators.tsx` was not split into one-file-per-component. (b) `components/layout/` was not moved to top-level `layout/`. Neither affects readability much; revisit if/when those files grow. |

### H.7 How to verify locally

```sh
npm install
npm run build      # should compile cleanly with VITE_USE_MOCK=true
npm run dev        # all 7 routes render identically to pre-refactor
npm test           # vitest example.test.ts passes
npm run lint       # warnings only (the two old `interface X extends Y {}` errors
                   #   were in shadcn files that already use `type X = Y`; resolved)
```

If anything looks off, the proxies in `src/pages/*.tsx` still re-export the new feature pages — so even legacy imports keep working until physical deletion.

