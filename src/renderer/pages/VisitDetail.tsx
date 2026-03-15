import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVisit } from '@/hooks/useVisit';
import { useVisitMutations } from '@/hooks/useVisitMutations';
import { VisitDetail } from '@/components/visits/VisitDetail';
import { copyToClipboard, formatVisitSummary } from '@/lib/copy-utils';

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { visit, loading, refetch } = useVisit(id);
  const { deleteVisit } = useVisitMutations();

  const handleDelete = useCallback(async () => {
    if (!visit) return;
    const success = await deleteVisit(visit.id);
    if (success) navigate('/saved-visits');
  }, [visit, deleteVisit, navigate]);

  useEffect(() => {
    const unsub = window.electronAPI.onShortcut((action: string) => {
      if (!visit) return;
      switch (action) {
        case 'copy-summary':
          copyToClipboard(formatVisitSummary(visit), 'Full summary');
          break;
        case 'edit-visit':
          // Dispatch a custom event that the VisitDetail component can listen to
          window.dispatchEvent(new CustomEvent('visit-shortcut-edit'));
          break;
        case 'delete-visit':
          handleDelete();
          break;
      }
    });
    return unsub;
  }, [visit, handleDelete]);

  if (loading)
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!visit)
    return <div className="p-6 text-muted-foreground">Visit not found.</div>;

  return (
    <div className="p-6 max-w-5xl">
      <VisitDetail visit={visit} onDelete={handleDelete} onUpdate={refetch} />
    </div>
  );
}
