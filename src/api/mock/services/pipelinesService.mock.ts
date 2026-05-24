import type { Pipeline } from '@/types';
import { db } from '../db/store';
import { delay } from '../utils';

export interface PipelineListFilter {
  environment?: string;
}

export const pipelinesServiceMock = {
  async list(filter?: PipelineListFilter): Promise<Pipeline[]> {
    await delay();
    let result = [...db.pipelines];
    if (filter?.environment) result = result.filter((p) => p.environment === filter.environment);
    return result;
  },

  async getById(id: string): Promise<Pipeline | undefined> {
    await delay();
    return db.pipelines.find((p) => p.id === id);
  },

  async create(data: Omit<Pipeline, 'id'>): Promise<Pipeline> {
    await delay(150);
    const pipeline: Pipeline = { ...data, id: `pipeline-${Date.now()}` };
    db.pipelines.push(pipeline);
    return pipeline;
  },

  async update(id: string, data: Partial<Pipeline>): Promise<Pipeline> {
    await delay(120);
    db.pipelines = db.pipelines.map((p) => (p.id === id ? { ...p, ...data } : p));
    return db.pipelines.find((p) => p.id === id)!;
  },

  async remove(id: string): Promise<void> {
    await delay(100);
    // Cascade: remove services belonging to this pipeline
    db.services = db.services.filter((s) => s.pipelineId !== id);
    db.pipelines = db.pipelines.filter((p) => p.id !== id);
  },
};
