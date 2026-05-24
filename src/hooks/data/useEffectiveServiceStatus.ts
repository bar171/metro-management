/**
 * Translates `(serviceStatus, latestKafkaLag)` → effective status for the UI.
 *
 * The same 3-line ladder was inlined three times inside the SVG renderer
 * in `PipelinesPage.tsx`. Extracted so the threshold + the rule live
 * in exactly one place.
 *
 *   - `degraded` always wins
 *   - if lag exceeds `KAFKA_LAG_THRESHOLD` → `lagging`
 *   - otherwise → `healthy`
 */

import { KAFKA_LAG_THRESHOLD } from '@/config/constants';
import type { ServiceStatus } from '@/types';

export function effectiveServiceStatus(
  serviceStatus: ServiceStatus | undefined,
  latestKafkaLag: number,
  threshold = KAFKA_LAG_THRESHOLD,
): ServiceStatus {
  if (serviceStatus === 'degraded') return 'degraded';
  if (latestKafkaLag > threshold) return 'lagging';
  return 'healthy';
}
