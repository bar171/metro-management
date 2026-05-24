/**
 * App-wide constants. Anything that's "a magic number used in two places"
 * should land here so the source of truth is unambiguous.
 */

/** Default kafka-lag threshold (msgs). Overridable per-env via VITE_KAFKA_LAG_THRESHOLD. */
const envLagThreshold = Number(import.meta.env.VITE_KAFKA_LAG_THRESHOLD);
export const KAFKA_LAG_THRESHOLD = Number.isFinite(envLagThreshold) && envLagThreshold > 0 ? envLagThreshold : 1000;

/** Inclusive bounds for service replica count. Critical pipelines can't go to 0. */
export const REPLICAS_MIN = 0;
export const REPLICAS_MAX = 16;

/** Inclusive lower bounds for service resources (millicores / MiB). */
export const CPU_LIMIT_MIN = 10;
export const MEMORY_LIMIT_MIN = 16;

/** Default poll interval for live metrics on MetricsPage. */
export const METRICS_POLL_INTERVAL_MS = 3000;
