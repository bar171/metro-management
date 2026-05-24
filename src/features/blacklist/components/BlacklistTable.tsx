import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BlacklistEntry, Pipeline } from '@/types';

interface BlacklistTableProps {
  entries: BlacklistEntry[];
  pipelines: Pipeline[];
  onDelete: (id: string) => void;
}

export function BlacklistTable({ entries, pipelines, onDelete }: BlacklistTableProps) {
  return (
    <div className="blacklist-table">
      <Table>
        <TableHeader className="blacklist-table__header">
          <TableRow>
            <TableHead>Scope</TableHead>
            <TableHead>Target Type</TableHead>
            <TableHead>Identifier</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="blacklist-table__action-col">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <motion.tr
                key={entry.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="group blacklist-table__row"
              >
                <TableCell className="blacklist-table__scope-cell">
                  {entry.pipelineId === 'all' ? (
                    <Badge variant="outline" className="blacklist-table__scope-badge">
                      GLOBAL
                    </Badge>
                  ) : (
                    pipelines.find((p) => p.id === entry.pipelineId)?.name
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {entry.targetType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="blacklist-table__target-code">{entry.targetValue}</code>
                </TableCell>
                <TableCell className="blacklist-table__reason-cell" title={entry.reason}>
                  {entry.reason}
                </TableCell>
                <TableCell className="blacklist-table__time-cell">
                  {new Date(entry.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="blacklist-table__action-cell">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="blacklist-table__delete-btn"
                    onClick={() => onDelete(entry.id)}
                  >
                    <Trash2 className="blacklist-table__delete-icon" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="blacklist-table__empty">
                <div className="blacklist-table__empty-inner">
                  <AlertCircle className="blacklist-table__empty-icon" />
                  <span>No active blocks found.</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
