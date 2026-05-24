/**
 * In-memory mock database — a set of mutable arrays seeded once at startup.
 *
 * Every mock service mutates THIS module's state. Nothing else does.
 * Nothing reads the underlying arrays directly — go through the mock services.
 *
 * (Replaces the top of the old `src/lib/mockOrm.ts` — the seed call no longer
 * runs at import time; it's wrapped in `seed()` which the bootstrap in `main.tsx`
 * calls explicitly when `apiConfig.useMock` is true.)
 */

import type { Pipeline, Service, ResourceProfile, MetricSnapshot, LogEntry, Group, BlacklistEntry } from '@/types';
import {
  generateBlacklist,
  generateGroups,
  generateLogs,
  generateMetrics,
  generatePipelines,
  generateResourceProfiles,
  generateServices,
} from './seed';

interface MockDb {
  pipelines: Pipeline[];
  groups: Group[];
  services: Service[];
  resourceProfiles: ResourceProfile[];
  metrics: MetricSnapshot[];
  logs: LogEntry[];
  blacklist: BlacklistEntry[];
  seeded: boolean;
}

export const db: MockDb = {
  pipelines: [],
  groups: [],
  services: [],
  resourceProfiles: [],
  metrics: [],
  logs: [],
  blacklist: [],
  seeded: false,
};

export function seed(): void {
  if (db.seeded) return;
  db.resourceProfiles = generateResourceProfiles();
  db.pipelines = generatePipelines();
  db.groups = generateGroups(db.pipelines);
  db.services = generateServices(db.pipelines);
  db.metrics = generateMetrics(db.pipelines, db.services);
  db.logs = generateLogs(db.pipelines, db.services);
  db.blacklist = generateBlacklist();
  db.seeded = true;
}
