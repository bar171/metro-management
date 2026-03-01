import { cn } from '@/lib/utils';
import type { ServiceStatus, Priority, Severity } from '@/types';

export function StatusDot({ status, pulse = false, className }: { status: ServiceStatus; pulse?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        status === 'healthy' && 'bg-status-healthy',
        status === 'degraded' && 'bg-status-degraded',
        status === 'lagging' && 'bg-status-lagging',
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
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
        priority === 'critical' && 'bg-status-critical/15 text-status-critical',
        priority === 'high' && 'bg-status-degraded/15 text-status-degraded',
        priority === 'normal' && 'bg-muted text-muted-foreground',
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
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
        severity === 'critical' && 'bg-status-critical/15 text-status-critical status-pulse-critical',
        severity === 'warning' && 'bg-status-degraded/15 text-status-degraded',
        severity === 'info' && 'bg-primary/10 text-primary',
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
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'accent' | 'warning' | 'critical';
}) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 flex flex-col gap-1',
      variant === 'accent' && 'border-accent/30',
      variant === 'warning' && 'border-status-degraded/30',
      variant === 'critical' && 'border-status-critical/30 glow-critical',
    )}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</span>
      <span className="text-2xl font-bold font-mono tabular-nums">{value}</span>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  );
}

export function EnvBadge({ env }: { env: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
      env === 'prod' && 'bg-status-critical/10 text-status-critical',
      env === 'dev' && 'bg-primary/10 text-primary',
    )}>
      {env}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border',
        type === 'BASIC' && 'border-muted text-muted-foreground bg-muted/10',
        type === 'STREAM' && 'border-blue-500/30 text-blue-500 bg-blue-500/10',
        type === 'BACKFILL' && 'border-purple-500/30 text-purple-500 bg-purple-500/10',
      )}
    >
      {type}
    </span>
  );
}
