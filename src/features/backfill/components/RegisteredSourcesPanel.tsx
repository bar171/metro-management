import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, Plus, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Group, Pipeline, Service } from '@/types';

interface RegisteredSourcesPanelProps {
  pipelines: Pipeline[];
  services: Service[];
  groups: Group[];
  onUpdateService: (id: string, data: Partial<Service>) => Promise<void>;
}

const EXCLUDED_PIPELINES = ['global', 'backfill', 'excel'];

interface SourceRow {
  id: string;
  pipelineName: string;
  sourceId: string;
  groupName: string;
  projectName: string;
  sourceName: string;
}

export function RegisteredSourcesPanel({ pipelines, services, groups, onUpdateService }: RegisteredSourcesPanelProps) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerId, setRegisterId] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rows = useMemo<SourceRow[]>(() => {
    const baseSources = services.filter((s) => s.stage === 'source' && s.isRegisteredForBroadBackfill);
    const out: SourceRow[] = [];
    baseSources.forEach((source) => {
      const pipeline = pipelines.find((p) => p.id === source.pipelineId);
      const pipelineName =
        pipeline?.name || (source.pipelineId === 'global' ? 'Global' : source.pipelineId);
      if (EXCLUDED_PIPELINES.includes(pipelineName.toLowerCase())) return;

      const matchingGroups = groups.filter((g) => g.primaryPipelineId === source.pipelineId);

      if (matchingGroups.length === 0) {
        out.push({
          id: `${source.id}-nogroup`,
          pipelineName,
          sourceId: source.id,
          groupName: 'None',
          projectName: source.project || 'None',
          sourceName: source.name,
        });
      } else {
        matchingGroups.forEach((group) => {
          out.push({
            id: `${source.id}-${group.id}`,
            pipelineName,
            sourceId: source.id,
            groupName: group.name,
            projectName: source.project || 'None',
            sourceName: source.name,
          });
        });
      }
    });

    if (search) {
      const q = search.toLowerCase();
      return out.filter(
        (r) =>
          r.pipelineName.toLowerCase().includes(q) ||
          r.groupName.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          r.sourceName.toLowerCase().includes(q) ||
          r.sourceId.toLowerCase().includes(q),
      );
    }
    return out;
  }, [services, pipelines, groups, search]);

  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = rows.slice(startIndex, startIndex + itemsPerPage);

  const handleRegister = async () => {
    if (!registerId) return;
    try {
      await onUpdateService(registerId, { isRegisteredForBroadBackfill: true });
      toast.success('Source registered for broad backfills');
      setRegisterOpen(false);
      setRegisterId('');
    } catch {
      toast.error('Failed to register source');
    }
  };

  const handleUnregister = async (serviceId: string) => {
    try {
      await onUpdateService(serviceId, { isRegisteredForBroadBackfill: false });
      toast.success('Source unregistered from broad backfills');
    } catch {
      toast.error('Failed to unregister source');
    }
  };

  return (
    <div className="reg-sources">
      <div className="reg-sources__header">
        <h2 className="reg-sources__title">
          <Database className="reg-sources__title-icon" /> Registered Sources for Broad Backfill
        </h2>

        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="reg-sources__register-btn">
              <Plus className="reg-sources__register-icon" /> Register Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Source</DialogTitle>
              <DialogDescription>Register an existing source service to participate in broad backfills.</DialogDescription>
            </DialogHeader>
            <div className="dialog-form">
              <div className="dialog-field">
                <label className="dialog-label">Enter Source ID</label>
                <Input
                  placeholder="Enter Source UUID..."
                  value={registerId}
                  onChange={(e) => setRegisterId(e.target.value)}
                  className="dialog-source-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRegisterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegister} disabled={!registerId || registerId === 'none'}>
                Register
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="reg-sources__search-wrapper">
        <Search className="reg-sources__search-icon" />
        <Input
          placeholder="Search sources (Pipeline, Group, Project, Name, ID)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="reg-sources__search-input"
        />
      </div>

      <div className="reg-sources__table-card">
        <Table>
          <TableHeader className="reg-sources__table-header">
            <TableRow>
              <TableHead className="w-[15%]">Pipeline</TableHead>
              <TableHead className="w-[15%]">Group</TableHead>
              <TableHead className="w-[15%]">Project</TableHead>
              <TableHead className="w-[20%]">Source Name</TableHead>
              <TableHead className="w-[20%]">Source ID</TableHead>
              <TableHead className="w-[15%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totalItems === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="reg-sources__empty">
                  No registered sources found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginated.map((row) => (
                  <TableRow key={row.id} className="group/row">
                    <TableCell className="backfill-table__name-cell">{row.pipelineName}</TableCell>
                    <TableCell>{row.groupName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.projectName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="reg-sources__source-badge">
                        {row.sourceName}
                      </Badge>
                    </TableCell>
                    <TableCell className="reg-sources__source-id">{row.sourceId}</TableCell>
                    <TableCell className="backfill-table__action-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="reg-sources__unregister-btn"
                        onClick={() => handleUnregister(row.sourceId)}
                        title="Unregister source"
                      >
                        <XCircle className="reg-sources__unregister-icon" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="reg-sources__pagination">
                    <div className="reg-sources__pagination-inner">
                      <div className="reg-sources__pagination-info">
                        Showing <span className="reg-sources__pagination-info-bold">{startIndex + 1}</span> to{' '}
                        <span className="reg-sources__pagination-info-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
                        <span className="reg-sources__pagination-info-bold">{totalItems}</span> sources
                      </div>
                      <div className="reg-sources__pagination-controls">
                        <div className="reg-sources__pagination-rows">
                          <span className="reg-sources__pagination-rows-label">Rows per page</span>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(val) => {
                              setItemsPerPage(Number(val));
                              setCurrentPage(1);
                            }}
                          >
                            <SelectTrigger className="reg-sources__pagination-rows-trigger">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="reg-sources__pagination-nav">
                          <Button
                            variant="outline"
                            size="icon"
                            className="reg-sources__pagination-btn"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="reg-sources__pagination-text">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="reg-sources__pagination-btn"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
