/**
 * The 9-node SVG service flow shown on the Overview tab of a pipeline.
 */

import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { StatusDot } from '@/components/shared/StatusIndicators';
import { useMetrics } from '@/hooks/data/useMetrics';
import { useServices } from '@/hooks/data/useServices';
import { effectiveServiceStatus } from '@/hooks/data/useEffectiveServiceStatus';
import type { Service } from '@/types';

interface PipelineFlowDiagramProps {
  pipelineId: string;
  services: Service[];
}

/** (x, y) coordinates for each named service node in the SVG canvas. */
const NODE_LAYOUT: { name: string; x: number; y: number }[] = [
  { name: 'push-data', x: 5, y: 20 },
  { name: 'kafka-consumer', x: 5, y: 160 },
  { name: 'get-data', x: 5, y: 300 },
  { name: 'python-validate', x: 230, y: 100 },
  { name: 'informative-validation', x: 230, y: 240 },
  { name: 'external-transform', x: 450, y: 60 },
  { name: 'transform-data', x: 450, y: 200 },
  { name: 'publish', x: 670, y: 20 },
  { name: 'sink-data', x: 670, y: 160 },
];

/** SVG path data for the arrows wiring the nodes together. */
const ARROW_PATHS = [
  { d: 'M 165 75 L 197.5 75 L 197.5 155 L 230 155', kind: 'neutral' },
  { d: 'M 165 215 L 197.5 215 L 197.5 155 L 230 155', kind: 'neutral' },
  { d: 'M 165 355 L 197.5 355 L 197.5 155 L 230 155', kind: 'neutral' },
  { d: 'M 390 155 L 420 155 L 420 260 L 450 260', kind: 'neutral' },
  { d: 'M 390 155 L 420 155 L 420 115 L 450 115', kind: 'neutral' },
  { d: 'M 390 155 L 420 155 L 420 330 L 640 330 L 640 230', kind: 'neutral-no-arrow' },
  { d: 'M 310 210 L 310 240', kind: 'red' },
  { d: 'M 610 240 L 640 240 L 640 75 L 670 75', kind: 'neutral' },
  { d: 'M 610 240 L 640 240 L 640 210 L 670 210', kind: 'neutral' },
  { d: 'M 535 60 L 535 25 L 310 25 L 310 100', kind: 'blue' },
] as const;

export function PipelineFlowDiagram({ pipelineId, services }: PipelineFlowDiagramProps) {
  const { updateService } = useServices();
  const { metrics } = useMetrics();

  const getLatestLag = (serviceId: string): number => {
    const points = metrics.filter(
      (m) => m.pipelineId === pipelineId && m.serviceId === serviceId && m.type === 'kafka_lag',
    );
    return points.length > 0 ? points[points.length - 1].value : 0;
  };

  return (
    <svg viewBox="0 0 880 430" className="flow-diagram" style={{ zIndex: 0 }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" className="flow-marker--neutral" />
        </marker>
        <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" className="flow-marker--red" />
        </marker>
        <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" className="flow-marker--blue" />
        </marker>
      </defs>

      {ARROW_PATHS.map((p, i) => {
        const cls =
          p.kind === 'red'
            ? 'flow-arrow--red'
            : p.kind === 'blue'
              ? 'flow-arrow--blue'
              : 'flow-arrow--neutral';
        const marker =
          p.kind === 'red' ? 'url(#arrow-red)' : p.kind === 'blue' ? 'url(#arrow-blue)' : 'url(#arrow)';
        return (
          <path
            key={i}
            d={p.d}
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            className={cls}
            markerEnd={p.kind === 'neutral-no-arrow' ? undefined : marker}
          />
        );
      })}

      {NODE_LAYOUT.map((node) => {
        const svc = services.find((s) => s.name === node.name);
        const latestLag = svc ? getLatestLag(svc.id) : 0;
        const effective = svc ? effectiveServiceStatus(svc.status, latestLag) : null;

        const wrapperClass = svc
          ? effective === 'degraded'
            ? 'flow-node--degraded'
            : effective === 'lagging'
              ? 'flow-node--lagging'
              : 'flow-node--healthy'
          : 'flow-node--missing';

        return (
          <foreignObject
            key={node.name}
            x={node.x}
            y={node.y}
            width="160"
            height="110"
            className="flow-node__foreign"
          >
            <div
              className={`flow-node ${wrapperClass}`}
            >
              <div className="flow-node__header">
                <span className="flow-node__name">
                  {node.name}
                </span>
                {svc && effective ? (
                  <StatusDot status={effective} pulse size="xs" />
                ) : (
                  <div className="flow-node__missing-dot" />
                )}
              </div>

              {svc && effective && (
                <div className="flow-node__details">
                  <div className="flow-node__detail-row">
                    <span className="flow-node__detail-label">Health</span>
                    <span
                      className={`flow-node__health-badge ${
                        effective === 'degraded'
                          ? 'flow-node__health--degraded'
                          : effective === 'lagging'
                            ? 'flow-node__health--lagging'
                            : 'flow-node__health--healthy'
                      }`}
                    >
                      {effective.toUpperCase()}
                    </span>
                  </div>
                  <div className="flow-node__detail-row">
                    <span className="flow-node__detail-label">Kafka Lag</span>
                    <span className="flow-node__lag-value">
                      {latestLag.toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flow-node__rollout-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info(`Rollout of ${node.name} initiated.`);
                      updateService(svc.id, { status: 'degraded' });
                      setTimeout(() => updateService(svc.id, { status: 'healthy' }), 1500);
                    }}
                  >
                    <RotateCcw className="flow-node__rollout-icon" />
                    Rollout
                  </Button>
                </div>
              )}
            </div>
          </foreignObject>
        );
      })}
    </svg>
  );
}
