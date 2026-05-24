/**
 * Blacklist Admin — search + 3 add-block dialogs + table.
 *
 * Each "add" dialog now manages its own form state internally; the page
 * just hands them a typed submit callback. The 339-line monolith becomes
 * a thin composition file.
 */

import { useEffect, useState } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { usePipelines } from '@/hooks/data/usePipelines';
import { useBlacklist } from '@/hooks/data/useBlacklist';
import { AddSourceDialog } from './components/AddSourceDialog';
import { AddDestinationDialog } from './components/AddDestinationDialog';
import { AddBrokerDialog } from './components/AddBrokerDialog';
import { BlacklistTable } from './components/BlacklistTable';
import './blacklist.css';

export default function BlacklistPage() {
  const { pipelines } = usePipelines();
  const { entries, loadBlacklist, addBlacklist, deleteBlacklist } = useBlacklist();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBlacklist();
  }, [loadBlacklist]);

  const filtered = entries.filter(
    (e) =>
      e.reason.toLowerCase().includes(search.toLowerCase()) ||
      e.pipelineId.toLowerCase().includes(search.toLowerCase()) ||
      e.targetValue.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    deleteBlacklist(id);
    toast.error('Block removed');
  };

  return (
    <div className="blacklist-page">
      <div className="blacklist-page__header">
        <div>
          <h1 className="blacklist-page__title">
            <ShieldAlert className="blacklist-page__title-icon" />
            Blacklist Admin
          </h1>
          <p className="blacklist-page__description">
            Direct incident response: immediate blocks for sources, destinations, and infrastructure.
          </p>
        </div>

        <div className="blacklist-page__actions">
          <AddSourceDialog pipelines={pipelines} onSubmit={addBlacklist} />
          <AddDestinationDialog pipelines={pipelines} onSubmit={addBlacklist} />
          <AddBrokerDialog onSubmit={addBlacklist} />
        </div>
      </div>

      <div className="blacklist-page__filter-bar">
        <div className="blacklist-page__search-wrapper">
          <Search className="blacklist-page__search-icon" />
          <Input
            placeholder="Filter blocks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <BlacklistTable entries={filtered} pipelines={pipelines} onDelete={handleDelete} />
    </div>
  );
}
