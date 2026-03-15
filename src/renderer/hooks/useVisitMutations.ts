import { useCallback } from 'react';
import { toast } from 'sonner';
import type { CreateVisitInput, UpdateVisitInput, Visit } from '@/types/visit';

export function useVisitMutations() {
  const createVisit = useCallback(
    async (data: CreateVisitInput): Promise<Visit | null> => {
      const result = await window.electronAPI.createVisit(data);
      if (result && 'error' in result) {
        toast.error(`Failed to save: ${result.error}`);
        return null;
      }
      toast.success('Visit saved');
      return result as Visit;
    },
    [],
  );

  const updateVisit = useCallback(
    async (id: string, data: UpdateVisitInput): Promise<Visit | null> => {
      const result = await window.electronAPI.updateVisit(id, data);
      if (result && 'error' in result) {
        toast.error(`Failed to update: ${result.error}`);
        return null;
      }
      toast.success('Visit updated');
      return result as Visit;
    },
    [],
  );

  const deleteVisit = useCallback(async (id: string): Promise<boolean> => {
    const result = await window.electronAPI.deleteVisit(id);
    if (result) toast.success('Visit deleted');
    else toast.error('Failed to delete visit');
    return result;
  }, []);

  return { createVisit, updateVisit, deleteVisit };
}
