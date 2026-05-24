import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MetricConfig } from '../config';
import type { ChartPoint } from '../hooks/useMetricsChartData';

interface MetricChartProps {
  config: MetricConfig;
  data: ChartPoint[];
  index: number;
}

/** Single area-chart card on the Metrics page. */
export function MetricChart({ config, data, index }: MetricChartProps) {
  const lastValue = data[data.length - 1]?.value ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="metric-chart"
    >
      <div className="metric-chart__header">
        <span className="metric-chart__label">{config.label}</span>
        <span className="metric-chart__value">
          {lastValue.toLocaleString()} <span className="metric-chart__unit">{config.unit}</span>
        </span>
      </div>
      <div className="metric-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${config.type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={35} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              fill={`url(#grad-${config.type})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
