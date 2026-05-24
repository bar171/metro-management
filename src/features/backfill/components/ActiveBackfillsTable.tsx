import { Activity, History, StopCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Pipeline } from '@/types';
import type { ActiveBackfill } from '../types';

interface ActiveBackfillsTableProps {
  active: ActiveBackfill[];
  recent: ActiveBackfill[];
  pipelines: Pipeline[];
  onStop: (id: string) => void;
}

function formatRow(job: ActiveBackfill, pipelines: Pipeline[]) {
  const pipeline = pipelines.find((p) => p.id === job.pipelineId);
  return { name: pipeline?.name || job.pipelineId };
}

export function ActiveBackfillsTable({ active, recent, pipelines, onStop }: ActiveBackfillsTableProps) {
  return (
    <div className="backfill-table">
      <h2 className="backfill-table__title">
        <Activity className="backfill-table__title-icon--active" /> Current Running Jobs
      </h2>
      <div className="backfill-table__card">
        <Table>
          <TableHeader className="backfill-table__header">
            <TableRow>
              <TableHead>Pipeline</TableHead>
              <TableHead>Time Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="backfill-table__action-col">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((job) => {
              const { name } = formatRow(job, pipelines);
              return (
                <TableRow key={job.id}>
                  <TableCell className="backfill-table__name-cell">{name}</TableCell>
                  <TableCell className="backfill-table__time-cell">
                    <div>From: {new Date(job.fromTime).toLocaleDateString()}</div>
                    <div>To: {new Date(job.toTime).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    {job.status === 'running' ? (
                      <Badge variant="outline" className="backfill-badge--running">
                        <Activity className="backfill-badge--running-icon" /> Running
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="backfill-badge--stopping">
                        Stopping...
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="backfill-table__action-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStop(job.id)}
                      disabled={job.status === 'stopping'}
                      className="backfill-table__stop-btn"
                    >
                      <StopCircle className="backfill-table__stop-icon" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {active.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="backfill-table__empty">
                  No active backfill jobs.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {recent.length > 0 && (
        <div className="backfill-table__recent-section">
          <h2 className="backfill-table__title">
            <History className="backfill-table__title-icon--recent" /> Recently Triggered Jobs
          </h2>
          <div className="backfill-table__card--recent">
            <Table>
              <TableHeader className="backfill-table__header--recent">
                <TableRow>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((job) => {
                  const { name } = formatRow(job, pipelines);
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="backfill-table__name-cell--recent">{name}</TableCell>
                      <TableCell className="backfill-table__time-cell">
                        <div>From: {new Date(job.fromTime).toLocaleDateString()}</div>
                        <div>To: {new Date(job.toTime).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="backfill-badge--stopped">
                          Stopped
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
