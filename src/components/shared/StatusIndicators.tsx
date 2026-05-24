import { cn } from '@/lib/utils';
import type { ServiceStatus, Priority, Severity } from '@/types';
import './shared.css';

export function StatusDot({
  status,
  pulse = false,
  size = 'md',
  className
}: {
  status: ServiceStatus;
  pulse?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string
}) {
  return (
    <span
      className={cn(
        'status-dot',
        size === 'xs' && 'status-dot--xs',
        size === 'sm' && 'status-dot--sm',
        size === 'md' && 'status-dot--md',
        size === 'lg' && 'status-dot--lg',
        status === 'healthy' && 'status-dot--healthy',
        status === 'degraded' && 'status-dot--degraded',
        status === 'lagging' && 'status-dot--lagging',
        pulse && status === 'degraded' && 'status-pulse-degraded',
        pulse && status === 'lagging' && 'status-pulse-critical',
        className
      )}
    />
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        'priority-badge',
        priority === 'critical' && 'priority-badge--critical',
        priority === 'high' && 'priority-badge--high',
        priority === 'normal' && 'priority-badge--normal',
      )}
    >
      {priority}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        'severity-badge',
        severity === 'critical' && 'severity-badge--critical status-pulse-critical',
        severity === 'warning' && 'severity-badge--warning',
        severity === 'info' && 'severity-badge--info',
      )}
    >
      {severity}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  subtitle,
  variant = 'default',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'accent' | 'warning' | 'critical';
  icon?: React.ElementType;
}) {
  return (
    <div className={cn(
      'kpi-tile',
      variant === 'accent' && 'kpi-tile--accent',
      variant === 'warning' && 'kpi-tile--warning',
      variant === 'critical' && 'kpi-tile--critical glow-critical',
    )}>
      {/* Subtle Radial Gradient */}
      <div className={cn(
        "kpi-tile__glow",
        variant === 'critical' ? 'kpi-tile__glow--critical' : variant === 'warning' ? 'kpi-tile__glow--warning' : variant === 'accent' ? 'kpi-tile__glow--accent' : 'kpi-tile__glow--default'
      )} />

      <div className="kpi-tile__header">
        {Icon && <Icon className="kpi-tile__icon" />}
        <span className="kpi-tile__label">{label}</span>
      </div>

      <span className="kpi-tile__value">{value}</span>

      <div className="kpi-tile__subtitle-wrapper">
        {subtitle && (
          <span className={cn(
            "kpi-tile__subtitle",
            variant === 'critical' && "kpi-tile__subtitle--critical",
            variant === 'warning' && "kpi-tile__subtitle--warning",
            variant !== 'critical' && variant !== 'warning' && "kpi-tile__subtitle--default"
          )}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export function EnvBadge({ env }: { env: string }) {
  return (
    <span className={cn(
      'env-badge',
      env === 'prod' && 'env-badge--prod',
      env === 'dev' && 'env-badge--dev',
    )}>
      {env}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'type-badge',
        type === 'BASIC' && 'type-badge--basic',
        type === 'STREAM' && 'type-badge--stream',
        type === 'BACKFILL' && 'type-badge--backfill',
      )}
    >
      {type}
    </span>
  );
}
