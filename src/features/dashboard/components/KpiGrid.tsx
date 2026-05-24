import { motion } from 'framer-motion';
import { Activity, Cpu, Server, Zap } from 'lucide-react';
import { KpiTile } from '@/components/shared/StatusIndicators';
import type { Pipeline } from '@/types';

interface KpiGridProps {
  filteredPipelines: Pipeline[];
  totalPipelines: Pipeline[];
  totalPods: number;
  avgKafkaLag: number;
  dbConnections: number;
}

/**
 * The 4 KPI tiles at the top of the dashboard.
 * Pure presentational — receives derived values, renders.
 */
export function KpiGrid({
  filteredPipelines,
  totalPipelines,
  totalPods,
  avgKafkaLag,
  dbConnections,
}: KpiGridProps) {
  const criticalCount = totalPipelines.filter((p) => p.priority === 'critical').length;

  return (
    <div className="kpi-grid">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <KpiTile
          label="Total Pipelines"
          value={filteredPipelines.length}
          subtitle={`${criticalCount} critical`}
          variant={criticalCount > 0 ? 'critical' : 'default'}
          icon={Activity}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <KpiTile label="Total Pods" value={totalPods} variant="accent" icon={Server} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <KpiTile
          label="Avg Kafka Lag"
          value={avgKafkaLag.toLocaleString()}
          variant={avgKafkaLag > 5000 ? 'warning' : 'default'}
          subtitle="messages"
          icon={Zap}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <KpiTile
          label="DB Connections"
          value={dbConnections}
          variant={dbConnections > 1000 ? 'warning' : 'default'}
          icon={Cpu}
        />
      </motion.div>
    </div>
  );
}
