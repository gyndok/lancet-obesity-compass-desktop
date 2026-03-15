import { useState, useEffect, useCallback } from 'react';
import type { Visit } from '@/types/visit';

export function useVisit(id: string | undefined) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setVisit(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    window.electronAPI.getVisit(id).then((result) => {
      setVisit(result && !('error' in result) ? result : null);
      setLoading(false);
    });
  }, [id]);

  const refetch = useCallback(async () => {
    if (!id) return;
    const result = await window.electronAPI.getVisit(id);
    setVisit(result && !('error' in result) ? result : null);
  }, [id]);

  return { visit, loading, refetch };
}
