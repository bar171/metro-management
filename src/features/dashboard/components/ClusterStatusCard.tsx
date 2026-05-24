import { Activity, Cpu, Server } from 'lucide-react';
import type { ClusterMetrics } from '@/hooks/data/useClusterMetrics';

interface ClusterStatusCardProps {
  metrics: ClusterMetrics | null;
}

/**
 * OpenShift cluster panel — nodes, CPU bar, memory bar.
 * Renders a loading placeholder until the snapshot arrives.
 */
export function ClusterStatusCard({ metrics }: ClusterStatusCardProps) {
  return (
    <div className="cluster-card">
      <div className="cluster-card__header">
        <span className="cluster-card__title">
          <Server className="cluster-card__title-icon" />
          OpenShift Cluster
        </span>
        <span className="cluster-card__live-label">Live</span>
      </div>

      {metrics ? (
        <div className="cluster-card__body">
          <div className="cluster-card__nodes-row">
            <div className="cluster-card__nodes-label">
              <Activity className="cluster-card__nodes-icon" />
              <span className="cluster-card__nodes-text">Worker Nodes</span>
            </div>
            <span className="cluster-card__nodes-value">
              {metrics.healthyNodes} / {metrics.nodes}{' '}
              <span className="cluster-card__nodes-ready">Ready</span>
            </span>
          </div>

          <UsageBar
            label="CPU Usage"
            Icon={Cpu}
            used={metrics.cpu.used}
            total={metrics.cpu.total}
            barColorClass="bg-primary"
            warningColorClass="bg-status-degraded"
            formatFooter={(used, total) => `${(used / 1000).toFixed(1)} / ${total / 1000} Cores`}
          />

          <UsageBar
            label="Memory Usage"
            Icon={Server}
            used={metrics.memory.used}
            total={metrics.memory.total}
            barColorClass="bg-status-healthy"
            warningColorClass="bg-status-degraded"
            formatFooter={(used, total) => `${Math.round(used / 1024)} / ${Math.round(total / 1024)} GB`}
          />
        </div>
      ) : (
        <div className="cluster-card__loading">
          Fetching OpenShift metrics...
        </div>
      )}
    </div>
  );
}

interface UsageBarProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  used: number;
  total: number;
  barColorClass: string;
  warningColorClass: string;
  formatFooter: (used: number, total: number) => string;
}

function UsageBar({ label, Icon, used, total, barColorClass, warningColorClass, formatFooter }: UsageBarProps) {
  const ratio = total > 0 ? used / total : 0;
  const pct = Math.round(ratio * 100);
  const isWarning = ratio > 0.8;
  return (
    <div className="usage-bar">
      <div className="usage-bar__header">
        <span className="usage-bar__label">
          <Icon className="usage-bar__label-icon" /> {label}
        </span>
        <span className="usage-bar__pct">{pct}%</span>
      </div>
      <div className="usage-bar__track">
        <div className={`h-full ${isWarning ? warningColorClass : barColorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="usage-bar__footer">{formatFooter(used, total)}</div>
    </div>
  );
}
