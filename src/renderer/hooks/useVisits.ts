import { useState, useEffect, useCallback } from 'react';
import type { VisitSummary } from '@/types/visit';

export function useVisits() {
  const [visits, setVisits] = useState<VisitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.listVisits();
      if (Array.isArray(result)) setVisits(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        refetch();
        return;
      }
      setLoading(true);
      try {
        const result = await window.electronAPI.searchVisits(query);
        if (Array.isArray(result)) setVisits(result);
      } finally {
        setLoading(false);
      }
    },
    [refetch],
  );

  return { visits, loading, refetch, search };
}
