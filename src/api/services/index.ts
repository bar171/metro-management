/**
 * The single switch between mock and real backend.
 *
 * Every consumer (hooks, stores, components) imports from THIS file —
 * never directly from `./pipelinesService.ts` or from `../mock/...`.
 *
 * Behavior:
 *   - VITE_USE_MOCK=true  (default) → mock services from `../mock/services/`
 *   - VITE_USE_MOCK=false           → real services that hit VITE_API_BASE_URL
 *
 * The mock and real implementations share the exact same TypeScript shape,
 * so swapping is a zero-touch change at the call site.
 */

import { apiConfig } from '../config';

import { pipelinesServiceMock } from '../mock/services/pipelinesService.mock';
import { groupsServiceMock } from '../mock/services/groupsService.mock';
import { servicesServiceMock } from '../mock/services/servicesService.mock';
import { resourceProfilesServiceMock } from '../mock/services/resourceProfilesService.mock';
import { metricsServiceMock } from '../mock/services/metricsService.mock';
import { logsServiceMock } from '../mock/services/logsService.mock';
import { blacklistServiceMock } from '../mock/services/blacklistService.mock';
import { backfillServiceMock } from '../mock/services/backfillService.mock';
import { clusterServiceMock } from '../mock/services/clusterService.mock';

import { pipelinesServiceReal } from './pipelinesService';
import { groupsServiceReal } from './groupsService';
import { servicesServiceReal } from './servicesService';
import { resourceProfilesServiceReal } from './resourceProfilesService';
import { metricsServiceReal } from './metricsService';
import { logsServiceReal } from './logsService';
import { blacklistServiceReal } from './blacklistService';
import { backfillServiceReal } from './backfillService';
import { clusterServiceReal } from './clusterService';

const pick = <M, R>(mock: M, real: R): M | R => (apiConfig.useMock ? mock : real);

export const pipelinesService = pick(pipelinesServiceMock, pipelinesServiceReal);
export const groupsService = pick(groupsServiceMock, groupsServiceReal);
export const servicesService = pick(servicesServiceMock, servicesServiceReal);
export const resourceProfilesService = pick(resourceProfilesServiceMock, resourceProfilesServiceReal);
export const metricsService = pick(metricsServiceMock, metricsServiceReal);
export const logsService = pick(logsServiceMock, logsServiceReal);
export const blacklistService = pick(blacklistServiceMock, blacklistServiceReal);
export const backfillService = pick(backfillServiceMock, backfillServiceReal);
export const clusterService = pick(clusterServiceMock, clusterServiceReal);

// Re-export the cluster metrics type so consumers don't have to know it lives in the mock folder.
export type { ClusterMetrics } from '../mock/services/clusterService.mock';
