# API Contracts — Metro Control Plane

> This document is the single source of truth for every endpoint the
> Metro frontend expects from a real backend. The mock services in
> `src/api/mock/services/` satisfy these contracts today.
>
> **TypeScript shapes** for each entity live in `src/types/index.ts`.
> When a contract says "returns `Pipeline[]`", it means the JSON body is an array of objects matching the `Pipeline` interface.
>
> **Conventions:**
> - All requests/responses are JSON.
> - `id` fields are server-assigned strings (any opaque format).
> - Timestamps are ISO 8601 strings.
> - Query parameters with `undefined`/empty values are omitted.
> - On success: `2xx` with the documented body (or `204` for void).
> - On error: any non-2xx with `{ "message": string, ... }` is fine; the client surfaces `ApiError { status, body }`.

---

## Pipelines

### `GET /pipelines`
List pipelines. Optional `environment` query param filters to `prod` / `prep` / `dev`.
**Response:** `Pipeline[]`

### `GET /pipelines/:id`
**Response:** `Pipeline` or `404`

### `POST /pipelines`
**Body:** `Omit<Pipeline, 'id'>`
**Response:** `Pipeline` (with server-assigned `id`)

### `PATCH /pipelines/:id`
**Body:** `Partial<Pipeline>`
**Response:** `Pipeline` (the updated entity)

### `DELETE /pipelines/:id`
**Response:** `204 No Content`
**Side effect:** the backend MUST cascade-delete all services where `service.pipelineId === id`. (Mock parity.)

---

## Groups

### `GET /groups`
Optional `primaryPipelineId` filter.
**Response:** `Group[]`

### `GET /groups/:id`
**Response:** `Group` or `404`

### `POST /groups`
**Body:** `Omit<Group, 'id' | 'lastActive'>`
**Response:** `Group`

### `PATCH /groups/:id`
**Body:** `Partial<Group>`
**Response:** `Group`

### `DELETE /groups/:id`
**Response:** `204`

---

## Services

### `GET /services`
Optional `pipelineId` filter (`pipelineId=global` returns global services).
**Response:** `Service[]`

### `GET /services/:id`
**Response:** `Service` or `404`

### `POST /services`
**Body:** `Omit<Service, 'id'>`
**Response:** `Service`

### `PATCH /services/:id`
**Body:** `Partial<Service>`
**Response:** `Service`

### `DELETE /services/:id`
**Response:** `204`

---

## Resource profiles

### `GET /resource-profiles`
**Response:** `ResourceProfile[]`

### `GET /resource-profiles/:id`
**Response:** `ResourceProfile`

### `PATCH /resource-profiles/:id`
**Body:** `Partial<ResourceProfile>`
**Response:** `ResourceProfile`

---

## Metrics

### `GET /metrics`
Optional filters: `pipelineId`, `type` (one of `kafka_lag` / `throughput` / `cpu_usage` / `memory_usage` / `db_connections` / `error_rate` / `pending_tasks`).
**Response:** `MetricSnapshot[]`
**Note:** The frontend buckets and aggregates client-side; the backend can return raw points.

### `POST /metrics`
**Body:** `Omit<MetricSnapshot, 'id'>`
**Response:** `MetricSnapshot`
**Note:** Optional — the frontend will not call this when pointed at a real backend that emits metrics on its own. Used today only by the mock simulator and the MetricsPage simulation loop.

---

## Logs

### `GET /logs`
Optional filters: `pipelineId`, `serviceId`, `severity` (`info`/`warning`/`critical`), `limit` (default unbounded — frontend typically asks for `limit=100`).
**Response:** `LogEntry[]` — backend MUST return newest-first.

### `POST /logs`
**Body:** `Omit<LogEntry, 'id'>`
**Response:** `LogEntry`

---

## Blacklist

### `GET /blacklist`
**Response:** `BlacklistEntry[]`

### `POST /blacklist`
**Body:** `Omit<BlacklistEntry, 'id' | 'createdAt' | 'active'>`
**Response:** `BlacklistEntry` (server fills `id`, `createdAt`, and sets `active=true`)

### `POST /blacklist/:id/toggle`
Flips the `active` flag.
**Response:** `BlacklistEntry` (the updated entity)

### `DELETE /blacklist/:id`
**Response:** `204`

---

## Backfill

### `POST /backfill/broad`
**Body:** `BackfillRequest`
**Response:**
```json
{
  "success": true,
  "requestId": "bf-1714589123456-abc12"
}
```
`requestId` is opaque — the frontend just surfaces it in a toast and a recent-backfills table.

---

## Cluster (OpenShift)

### `GET /cluster/metrics`
**Response:**
```json
{
  "cpu":    { "total": 16000, "used": 7421 },
  "memory": { "total": 65536, "used": 33518 },
  "nodes": 3,
  "healthyNodes": 3
}
```
- `cpu.total` / `cpu.used` are in millicores.
- `memory.total` / `memory.used` are in MiB.
