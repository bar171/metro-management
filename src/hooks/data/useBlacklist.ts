import { useAppStore } from '@/stores/useAppStore';

export function useBlacklist() {
  const entries = useAppStore((s) => s.blacklistEntries);
  const loadBlacklist = useAppStore((s) => s.loadBlacklist);
  const toggleBlacklist = useAppStore((s) => s.toggleBlacklist);
  const addBlacklist = useAppStore((s) => s.addBlacklist);
  const deleteBlacklist = useAppStore((s) => s.deleteBlacklist);

  return { entries, loadBlacklist, toggleBlacklist, addBlacklist, deleteBlacklist };
}
