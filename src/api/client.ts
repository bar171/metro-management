/**
 * Minimal fetch-based HTTP client.
 *
 * Responsibilities (and ONLY these):
 *   - prepend `apiConfig.baseUrl`
 *   - serialize JSON request bodies + set `Content-Type`
 *   - parse JSON responses
 *   - normalize errors into a typed `ApiError`
 *   - enforce a request timeout
 *
 * Services should call `apiClient.get/post/put/patch/delete` — never raw fetch.
 * This file is the only place in the codebase that should ever construct a fetch().
 */

import { apiConfig } from './config';

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiRequestOptions {
  /** Overrides apiConfig.baseUrl for this single call. */
  baseUrl?: string;
  /** Extra headers merged on top of defaults. */
  headers?: Record<string, string>;
  /** Query-string parameters. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Per-request timeout override (ms). */
  timeoutMs?: number;
  /** Pre-built AbortSignal — wins over `timeoutMs`. */
  signal?: AbortSignal;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const buildUrl = (path: string, options: ApiRequestOptions | undefined): string => {
  const base = options?.baseUrl ?? apiConfig.baseUrl;
  const url = base ? `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}` : path;
  const q = options?.query;
  if (!q) return url;
  const qs = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  if (!qs) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
};

const request = async <T>(
  method: Method,
  path: string,
  body: unknown,
  options: ApiRequestOptions | undefined,
): Promise<T> => {
  const url = buildUrl(path, options);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers ?? {}),
  };

  const controller = options?.signal ? null : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options?.timeoutMs ?? apiConfig.requestTimeoutMs)
    : null;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal ?? controller?.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(`Request timed out: ${method} ${url}`, 0, null);
    }
    throw new ApiError(`Network error: ${(err as Error).message}`, 0, null);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // 204 / empty body
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status} ${response.statusText} for ${method} ${url}`,
      response.status,
      parsed,
    );
  }

  return parsed as T;
};

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export type ApiClient = typeof apiClient;
