import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnvBadge, PriorityBadge, StatusDot, TypeBadge } from '@/components/shared/StatusIndicators';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useGroups } from '@/hooks/data/useGroups';
import { useServices } from '@/hooks/data/useServices';
import type { Pipeline } from '@/types';
import { PipelineFlowDiagram } from './PipelineFlowDiagram';
import { GroupsTab, DeleteGroupDialog } from './GroupsTab';
import { DeletePipelineDialog } from './DeletePipelineDialog';

interface PipelineDetailProps {
  pipeline: Pipeline;
}

export function PipelineDetail({ pipeline }: PipelineDetailProps) {
  const { getPipelineHealth, primaryPipelines, secondaryPipelines, deletePipeline } = usePipelines();
  const { getServicesForPipeline } = useServices();
  const { getGroupsForPipeline, createGroup, updateGroup, deleteGroup } = useGroups();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);

  const pipelineServices = getServicesForPipeline(pipeline.id);
  const pipelineGroups = getGroupsForPipeline(pipeline.id);

  const handleDeletePipeline = async () => {
    if (pipelineGroups.length > 0) {
      toast.error(`Cannot delete! Pipeline has ${pipelineGroups.length} associated groups. Please reassign them first.`);
      return;
    }
    await deletePipeline(pipeline.id);
    setIsDeleteOpen(false);
    toast.success('Pipeline deleted');
  };

  const handleCreateGroup = async (name: string) => {
    await createGroup({
      name,
      primaryPipelineId: pipeline.id,
      secondaryPipelineIds: [],
      etlDailyTransportMaxSizeGb: 15,
      etlBackfillLimitDays: null,
    });
    toast.success('Owner Group created');
  };

  const handleMoveGroup = async (groupId: string, newPipelineId: string) => {
    await updateGroup(groupId, { primaryPipelineId: newPipelineId });
    toast.success('Group moved to another pipeline');
  };

  const handleToggleSecondary = async (groupId: string, secondaryId: string, current: string[]) => {
    const next = current.includes(secondaryId) ? current.filter((id) => id !== secondaryId) : [...current, secondaryId];
    await updateGroup(groupId, { secondaryPipelineIds: next });
    toast.success('Secondary pipelines updated');
  };

  return (
    <motion.div
      key={pipeline.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pipeline-detail"
    >
      <div className="pipeline-detail__header">
        <div className="pipeline-detail__header-left">
          <StatusDot status={getPipelineHealth(pipeline.id)} pulse size="lg" />
          <div className="pipeline-detail__header-info">
            <h2 className="pipeline-detail__name">
              {pipeline.name}
              <EnvBadge env={pipeline.environment} />
            </h2>
            <div className="pipeline-detail__badges">
              <TypeBadge type={pipeline.type} />
              <PriorityBadge priority={pipeline.priority} />
            </div>
          </div>
        </div>
        <DeletePipelineDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          pipelineName={pipeline.name}
          associatedGroupsCount={pipelineGroups.length}
          onConfirm={handleDeletePipeline}
        />
      </div>

      <div className="pipeline-detail__body">
        <Tabs defaultValue="overview" className="pipeline-detail__tabs">
          <TabsList className="pipeline-detail__tabs-list">
            <TabsTrigger
              value="overview"
              className="pipeline-detail__tab-trigger"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="pipeline-detail__tab-trigger"
            >
              Groups ({pipelineGroups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pipeline-detail__overview-content">
            <div className="pipeline-detail__overview-card">
              <div className="pipeline-detail__overview-inner">
                <PipelineFlowDiagram pipelineId={pipeline.id} services={pipelineServices} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="pipeline-detail__groups-content">
            <GroupsTab
              selectedPipeline={pipeline}
              pipelineGroups={pipelineGroups}
              primaryPipelines={primaryPipelines}
              secondaryPipelines={secondaryPipelines}
              onCreateGroup={handleCreateGroup}
              onMoveGroup={handleMoveGroup}
              onToggleSecondary={handleToggleSecondary}
              onDeleteGroup={(g) => setGroupToDelete({ id: g.id, name: g.name })}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DeleteGroupDialog
        group={groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={() => {
          if (groupToDelete) {
            deleteGroup(groupToDelete.id);
            setGroupToDelete(null);
          }
        }}
      />
    </motion.div>
  );
}
