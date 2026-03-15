import { useParams, useNavigate } from 'react-router-dom';
import { useVisit } from '@/hooks/useVisit';
import { useVisitMutations } from '@/hooks/useVisitMutations';
import { VisitDetail } from '@/components/visits/VisitDetail';

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { visit, loading, refetch } = useVisit(id);
  const { deleteVisit } = useVisitMutations();

  if (loading)
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!visit)
    return <div className="p-6 text-muted-foreground">Visit not found.</div>;

  const handleDelete = async () => {
    const success = await deleteVisit(visit.id);
    if (success) navigate('/saved-visits');
  };

  return (
    <div className="p-6 max-w-5xl">
      <VisitDetail visit={visit} onDelete={handleDelete} onUpdate={refetch} />
    </div>
  );
}
