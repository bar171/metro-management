/**
 * Dashboard — composes 3 panels:
 *   • KpiGrid          (4 tiles)
 *   • LiveAlertFeed    (critical + warning logs)
 *   • ClusterStatusCard(OpenShift)
 *
 * No data fetching, no derivation logic inline — all of that lives in
 * `useDashboardKpis`, `useLogs`, `useClusterMetrics`.
 */

import { usePipelines } from '@/hooks/data/usePipelines';
import { useLogs } from '@/hooks/data/useLogs';
import { useClusterMetrics } from '@/hooks/data/useClusterMetrics';
import { useDashboardKpis } from './hooks/useDashboardKpis';
import { KpiGrid } from './components/KpiGrid';
import { LiveAlertFeed } from './components/LiveAlertFeed';
import { ClusterStatusCard } from './components/ClusterStatusCard';
import './dashboard.css';

export default function DashboardPage() {
  const { loading } = usePipelines();
  const { pipelines, filteredByEnv, totalPods, avgKafkaLag, dbConnections } = useDashboardKpis();
  const { criticalLogs } = useLogs();
  const { data: clusterMetrics } = useClusterMetrics();

  if (loading) {
    return (
      <div className="dashboard-page__loading">
        <span className="dashboard-page__loading-text">Loading...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h2 className="dashboard-page__title">Metro Overview</h2>
          <p className="dashboard-page__subtitle">Real-time status</p>
        </div>
      </div>

      <KpiGrid
        filteredPipelines={filteredByEnv}
        totalPipelines={pipelines}
        totalPods={totalPods}
        avgKafkaLag={avgKafkaLag}
        dbConnections={dbConnections}
      />

      <div className="dashboard-page__bottom-grid">
        <LiveAlertFeed logs={criticalLogs} />
        <ClusterStatusCard metrics={clusterMetrics} />
      </div>
    </div>
  );
}
