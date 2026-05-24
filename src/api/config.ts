/**
 * API layer configuration.
 *
 * Single source of truth for:
 *   - whether the app talks to a real backend or to the in-memory mock
 *   - the base URL of the real backend
 *   - any other API-wide setting (timeout, default headers, etc.)
 *
 * To switch the app to a real backend, set:
 *     VITE_USE_MOCK=false
 *     VITE_API_BASE_URL=https://your.api.example.com
 * Nothing else in `src/` needs to change.
 */

const envFlag = (name: string, fallback: boolean): boolean => {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  return String(raw).toLowerCase() !== 'false' && raw !== '0';
};

const envString = (name: string, fallback: string): string => {
  const raw = import.meta.env[name];
  return raw === undefined || raw === '' ? fallback : String(raw);
};

export const apiConfig = {
  /** When true, the API services layer reads from the in-memory mock instead of the network. */
  useMock: envFlag('VITE_USE_MOCK', true),

  /** Base URL the real apiClient prepends to every request. Ignored when useMock is true. */
  baseUrl: envString('VITE_API_BASE_URL', ''),

  /** Request timeout for the real apiClient, in ms. */
  requestTimeoutMs: 30_000,
} as const;

export type ApiConfig = typeof apiConfig;
