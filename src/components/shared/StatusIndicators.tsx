import { cn } from '@/lib/utils';
import type { ServiceStatus, Priority, Severity } from '@/types';

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
        'inline-block rounded-full shrink-0',
        size === 'xs' && 'w-1.5 h-1.5',
        size === 'sm' && 'w-2 h-2',
        size === 'md' && 'w-3 h-3',
        size === 'lg' && 'w-5 h-5',
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
      'relative rounded-xl border border-[#333] bg-background/50 backdrop-blur-sm p-6 flex flex-col items-center text-center gap-1 overflow-hidden',
      variant === 'accent' && 'border-accent/50',
      variant === 'warning' && 'border-amber-500/50',
      variant === 'critical' && 'border-destructive/50 glow-critical',
    )}>
      {/* Subtle Radial Gradient */}
      <div className={cn(
        "absolute -top-12 -left-12 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none",
        variant === 'critical' ? 'bg-destructive' : variant === 'warning' ? 'bg-amber-500' : variant === 'accent' ? 'bg-accent' : 'bg-primary'
      )} />

      <div className="flex w-full items-center justify-center relative z-10">
        {Icon && <Icon className="absolute left-0 w-4 h-4 text-muted-foreground/60" />}
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-medium">{label}</span>
      </div>

      <span className="text-4xl font-extrabold font-sans tabular-nums tracking-tight relative z-10 mt-1">{value}</span>

      <div className="mt-2 min-h-[20px] flex items-center justify-center relative z-10">
        {subtitle && (
          <span className={cn(
            "text-[10px] font-sans font-medium uppercase tracking-wider px-2 py-0.5 rounded",
            variant === 'critical' && "bg-destructive/20 text-destructive",
            variant === 'warning' && "bg-amber-500/20 text-amber-500",
            variant !== 'critical' && variant !== 'warning' && "text-muted-foreground"
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
