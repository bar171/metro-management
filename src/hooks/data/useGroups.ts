import { useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Group } from '@/types';

export function useGroups() {
  const groups = useAppStore((s) => s.groups);
  const createGroup = useAppStore((s) => s.createGroup);
  const updateGroup = useAppStore((s) => s.updateGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);

  /** Groups where the pipeline is either the primary owner or listed as a secondary target. */
  const getGroupsForPipeline = useCallback(
    (pipelineId: string | null | undefined): Group[] => {
      if (!pipelineId) return [];
      return groups.filter(
        (g) => g.primaryPipelineId === pipelineId || g.secondaryPipelineIds.includes(pipelineId),
      );
    },
    [groups],
  );

  return { groups, getGroupsForPipeline, createGroup, updateGroup, deleteGroup };
}
