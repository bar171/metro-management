export interface ActiveBackfill {
  id: string;
  pipelineId: string;
  fromTime: string;
  toTime: string;
  status: 'running' | 'stopping';
  startedAt: string;
}
