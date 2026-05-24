/**
 * Tiny helpers shared by every mock service: simulated latency + id generation.
 */

export const delay = (ms = 80): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 60));

let _id = 0;
export const uid = (): string => `id_${++_id}`;

export const newId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
