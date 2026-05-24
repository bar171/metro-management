/**
 * Single map of every endpoint a real backend has to expose for this app.
 *
 * Keeping it as a TS object — not raw strings sprinkled across services — means:
 *   - one place to rename a route
 *   - one place a backend dev can scan to know what's expected
 *   - one place tests can intercept
 *
 * See `src/api/contracts.md` for the request/response shapes of each endpoint.
 */

export const endpoints = {
  pipelines: {
    list: '/pipelines',
    byId: (id: string) => `/pipelines/${encodeURIComponent(id)}`,
  },
  groups: {
    list: '/groups',
    byId: (id: string) => `/groups/${encodeURIComponent(id)}`,
  },
  services: {
    list: '/services',
    byId: (id: string) => `/services/${encodeURIComponent(id)}`,
  },
  resourceProfiles: {
    list: '/resource-profiles',
  },
  metrics: {
    list: '/metrics',
  },
  logs: {
    list: '/logs',
  },
  blacklist: {
    list: '/blacklist',
    byId: (id: string) => `/blacklist/${encodeURIComponent(id)}`,
    toggle: (id: string) => `/blacklist/${encodeURIComponent(id)}/toggle`,
  },
  backfill: {
    submit: '/backfill/broad',
  },
  cluster: {
    metrics: '/cluster/metrics',
  },
} as const;
