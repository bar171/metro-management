/**
 * Fetches OpenShift cluster metrics once on mount.
 *
 * Was inlined into `Dashboard.tsx` against the now-deprecated `lib/openshift.ts`.
 * Moving the call here means the page is purely presentational and the
 * cluster data flows through the same service layer as everything else.
 *
 * Intentionally simple — no polling, no manual refresh, matching today's behavior.
 * Swap in React Query / SWR later if we ever want cache + revalidation.
 */

import { useEffect, useState } from 'react';
import { clusterService, type ClusterMetrics } from '@/api/services';

export function useClusterMetrics() {
  const [data, setData] = useState<ClusterMetrics | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    clusterService
      .getMetrics()
      .then((m) => {
        if (!cancelled) setData(m);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading: data === null && error === null };
}

export type { ClusterMetrics };
