# Metro ETL Control Plane

The Metro frontend — a Vite + React + TypeScript dashboard for monitoring and operating ETL pipelines.

## Local development

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # production build
npm run lint     # eslint
npm test         # vitest
```

Node.js 18+ recommended. The project uses Vite 7 and the SWC-based React plugin.

## Project layout

```
src/
├─ api/                  ← The single boundary between UI and data
│  ├─ config.ts          USE_MOCK flag + API_BASE_URL
│  ├─ client.ts          Tiny fetch wrapper (one place for headers + errors)
│  ├─ endpoints.ts       Single map of all REST paths
│  ├─ contracts.md       📄 Wire format the real backend must satisfy
│  ├─ services/          Real services + the switch index
│  └─ mock/              All mock state + mock services live here
│     ├─ db/             In-memory tables, seeders, background simulator
│     ├─ services/       Mock services with identical signatures to real
│     └─ utils.ts        delay() / uid()
│
├─ features/             One folder per screen
│  ├─ dashboard/
│  ├─ pipelines/
│  ├─ services/
│  ├─ metrics/
│  ├─ storage/
│  ├─ blacklist/
│  └─ backfill/
│     ├─ <Feature>Page.tsx     thin composition file
│     ├─ components/           presentational pieces
│     └─ hooks/                feature-local hooks
│
├─ components/
│  ├─ shared/            StatusIndicators (status dot, badges, KPI tile)
│  ├─ layout/            AppLayout, AppHeader, AppSidebar
│  ├─ storage/           shared storage dialogs (Create*, Move, Breadcrumbs)
│  └─ ui/                shadcn primitives (don't edit by hand)
│
├─ hooks/
│  ├─ use-mobile.tsx
│  ├─ use-toast.ts
│  └─ data/              cross-feature data hooks (usePipelines, useServices, …)
│
├─ stores/               Zustand stores (UI + cached server state)
│  ├─ useAppStore.ts
│  └─ useStorageStore.ts (localStorage-persisted)
│
├─ config/constants.ts
├─ types/index.ts        domain types — the API contract source of truth
└─ test/                 vitest setup + placeholder
```

## Switching from mock to a real backend

The app talks to a single boundary (`src/api/services/`). Switching to a real backend is a config change — **no component code is touched.**

### 1) Set env vars

In `.env` (or `.env.local`):

```sh
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api.metro.internal/v1
```

That's it. On the next `npm run dev` the app will route every data call through `src/api/client.ts` against your `VITE_API_BASE_URL` instead of the in-memory mock.

### 2) Make sure your backend matches the contracts

The TypeScript shapes in `src/types/index.ts` are the response shapes. The HTTP verbs, paths, query params, and side effects each endpoint must satisfy are documented in **`src/api/contracts.md`**.

A quick summary of what the backend has to expose:

| Domain | Endpoints |
|---|---|
| Pipelines | `GET /pipelines`, `GET/PATCH/DELETE /pipelines/:id`, `POST /pipelines` — delete cascades to services |
| Groups | `GET /groups`, `GET/PATCH/DELETE /groups/:id`, `POST /groups` |
| Services | `GET /services`, `GET/PATCH/DELETE /services/:id`, `POST /services` |
| Resource profiles | `GET /resource-profiles`, `GET/PATCH /resource-profiles/:id` |
| Metrics | `GET /metrics`, `POST /metrics` (optional — used by the live simulator) |
| Logs | `GET /logs`, `POST /logs` — list returns newest-first |
| Blacklist | `GET /blacklist`, `POST /blacklist`, `POST /blacklist/:id/toggle`, `DELETE /blacklist/:id` |
| Backfill | `POST /backfill/broad` |
| Cluster | `GET /cluster/metrics` |

Full request/response schemas: see `src/api/contracts.md`.

### 3) (Optional) custom headers / auth

`src/api/client.ts` is the only place that calls `fetch`. Add auth headers, interceptors, request IDs, etc. there — every service gets them automatically.

## Architectural notes

- **No `fetch`/`axios` in components.** Components read through `hooks/data/*` (which wrap the service layer) and through `useAppStore` (for shared cached state).
- **One way to swap mock ↔ real.** The `VITE_USE_MOCK` flag in `src/api/config.ts` is the only switch. `src/api/services/index.ts` picks the implementation at module load. The mock and real services have identical TypeScript signatures.
- **Background mock simulation is explicit.** Pipelines randomly degrade and Kafka lag spikes every 3s under the mock backend. It's started exactly once in `src/main.tsx` (only when `useMock=true`) and is a no-op in production builds.
- **State separation.** UI state (`theme`, `envFilter`, `selectedPipelineId`) and cached server data both live in `useAppStore` today. The longer-term direction (see REFACTOR_PLAN.md §E.4) is to move server data onto React Query and shrink the store to UI only.

## Testing

```sh
npm test          # one-shot run
npm run test:watch
```

Vitest + Testing Library are wired up; `src/test/setup.ts` mocks `matchMedia`. The placeholder in `src/test/example.test.ts` shows the minimal shape.

## See also

- **`REFACTOR_PLAN.md`** — the plan that produced the current structure, including what was deleted/moved.
- **`src/api/contracts.md`** — backend contract surface.
