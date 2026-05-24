import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Save, Search, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Group, Pipeline } from '@/types';

interface GroupLimitsPanelProps {
  pipelines: Pipeline[];
  groups: Group[];
  onUpdateGroup: (id: string, data: Partial<Group>) => Promise<void>;
}

type EditMap = Record<string, { etlDailyTransportMaxSizeGb?: string; etlBackfillLimitDays?: string }>;

export function GroupLimitsPanel({ pipelines, groups, onUpdateGroup }: GroupLimitsPanelProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<EditMap>({});

  const groupsByPipeline = useMemo(() => {
    const buckets: Record<string, Group[]> = {};
    groups
      .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
      .forEach((g) => {
        const pipId = g.primaryPipelineId || 'unassigned';
        (buckets[pipId] ||= []).push(g);
      });
    return buckets;
  }, [groups, search]);

  const togglePipeline = (pipelineId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pipelineId)) {
        next.delete(pipelineId);
      } else {
        next.add(pipelineId);
      }
      return next;
    });

  const changeEdit = (
    groupId: string,
    field: 'etlDailyTransportMaxSizeGb' | 'etlBackfillLimitDays',
    value: string,
  ) => setEdits((prev) => ({ ...prev, [groupId]: { ...prev[groupId], [field]: value } }));

  const saveEdit = async (group: Group) => {
    const e = edits[group.id];
    if (!e) return;
    const payload: Partial<Group> = {};
    if (e.etlDailyTransportMaxSizeGb !== undefined) {
      payload.etlDailyTransportMaxSizeGb = e.etlDailyTransportMaxSizeGb === '' ? null : Number(e.etlDailyTransportMaxSizeGb);
    }
    if (e.etlBackfillLimitDays !== undefined) {
      payload.etlBackfillLimitDays = e.etlBackfillLimitDays === '' ? null : Number(e.etlBackfillLimitDays);
    }
    if (Object.values(payload).some((v) => v !== null && Number.isNaN(v as number))) {
      toast.error('Invalid limit value');
      return;
    }
    try {
      await onUpdateGroup(group.id, payload);
      toast.success('Group daily limit updated');
      setEdits((prev) => {
        const next = { ...prev };
        delete next[group.id];
        return next;
      });
    } catch {
      toast.error('Failed to update limit');
    }
  };

  return (
    <div className="group-limits">
      <div className="group-limits__header">
        <h2 className="group-limits__title">
          <Settings className="group-limits__title-icon" /> Group Daily Limits
        </h2>
        <div className="group-limits__search-wrapper">
          <Search className="group-limits__search-icon" />
          <Input
            placeholder="Search groups..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="group-limits__list">
        {Object.entries(groupsByPipeline).map(([pipelineId, pipelineGroups]) => {
          const pipeline = pipelines.find((p) => p.id === pipelineId);
          const displayName = pipeline ? pipeline.name : 'Unassigned / Global Groups';
          const isExpanded = expanded.has(pipelineId);

          return (
            <div key={pipelineId} className="group-limits__pipeline-card">
              <div
                className="group-limits__pipeline-header"
                onClick={() => togglePipeline(pipelineId)}
              >
                <div className="group-limits__pipeline-name">
                  {isExpanded ? <ChevronDown className="group-limits__chevron" /> : <ChevronRight className="group-limits__chevron" />}
                  {displayName}
                  <Badge variant="secondary" className="ml-2">
                    {pipelineGroups.length}
                  </Badge>
                </div>
              </div>

              {isExpanded && (
                <div className="group-limits__table-wrapper">
                  <Table>
                    <TableHeader className="group-limits__table-header">
                      <TableRow>
                        <TableHead className="group-limits__name-col">Group Name</TableHead>
                        <TableHead>Daily (GB)</TableHead>
                        <TableHead>Range (Days)</TableHead>
                        <TableHead className="backfill-table__action-col">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pipelineGroups.map((group) => {
                        const e = edits[group.id] || {};
                        const dailyOriginal = group.etlDailyTransportMaxSizeGb === null ? '' : String(group.etlDailyTransportMaxSizeGb);
                        const daysOriginal = group.etlBackfillLimitDays === null ? '' : String(group.etlBackfillLimitDays ?? '');
                        const dailyVal = e.etlDailyTransportMaxSizeGb !== undefined ? e.etlDailyTransportMaxSizeGb : dailyOriginal;
                        const daysVal = e.etlBackfillLimitDays !== undefined ? e.etlBackfillLimitDays : daysOriginal;
                        const isDirty =
                          (e.etlDailyTransportMaxSizeGb !== undefined && dailyOriginal !== e.etlDailyTransportMaxSizeGb) ||
                          (e.etlBackfillLimitDays !== undefined && daysOriginal !== e.etlBackfillLimitDays);

                        return (
                          <TableRow key={group.id} className="group/row">
                            <TableCell className="backfill-table__name-cell">{group.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={dailyVal}
                                onChange={(ev) => changeEdit(group.id, 'etlDailyTransportMaxSizeGb', ev.target.value)}
                                className="group-limits__input"
                                placeholder="No Limit"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={daysVal}
                                onChange={(ev) => changeEdit(group.id, 'etlBackfillLimitDays', ev.target.value)}
                                className="group-limits__input"
                                placeholder="No Limit"
                              />
                            </TableCell>
                            <TableCell className="backfill-table__action-cell">
                              <Button
                                size="sm"
                                variant={isDirty ? 'default' : 'ghost'}
                                disabled={!isDirty}
                                onClick={() => saveEdit(group)}
                                className={`transition-all ${
                                  isDirty
                                    ? 'group-limits__save-btn--dirty'
                                    : 'group-limits__save-btn--idle'
                                }`}
                              >
                                <Save className="group-limits__save-icon" />
                                {isDirty && <span className="group-limits__save-label">Save</span>}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="group-limits__empty">
            No groups configured.
          </div>
        )}
      </div>
    </div>
  );
}
