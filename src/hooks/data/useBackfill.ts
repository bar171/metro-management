import { useAppStore } from '@/stores/useAppStore';

export function useBackfill() {
  const submit = useAppStore((s) => s.broadBackfill);
  return { submit };
}
