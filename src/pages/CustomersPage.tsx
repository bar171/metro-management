import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomersPage() {
  const { customers, axes } = useAppStore();
  const [search, setSearch] = useState('');
  const [volFilter, setVolFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = customers;
    if (search) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (volFilter !== 'all') result = result.filter(c => c.dataVolumeLevel === volFilter);
    return result;
  }, [customers, search, volFilter]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Customers</h2>
          <p className="text-xs text-muted-foreground font-mono">{customers.length} customers across {axes.length} axes</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={volFilter} onValueChange={setVolFilter}>
            <SelectTrigger className="h-8 w-32 text-xs bg-surface-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Volumes</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs bg-surface-1" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-1">
              <TableHead className="text-[10px] font-mono uppercase">Name</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Axis</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Volume</TableHead>
              <TableHead className="text-[10px] font-mono uppercase">Criticality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c, i) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-border hover:bg-surface-1 transition-colors text-xs"
              >
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {axes.find(a => a.id === c.axisId)?.name ?? 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {c.dataVolumeLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={c.streamCriticality === 'critical' ? 'destructive' : 'outline'}
                    className="text-[10px] font-mono"
                  >
                    {c.streamCriticality}
                  </Badge>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
