import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VisitSummary } from '@/types/visit';

function getBmiColor(bmi: number | null): string {
  if (bmi == null) return 'text-muted-foreground';
  if (bmi < 18.5) return 'text-blue-500';
  if (bmi < 25) return 'text-green-500';
  if (bmi < 30) return 'text-yellow-500';
  if (bmi < 35) return 'text-orange-500';
  return 'text-red-500';
}

function getClassificationVariant(
  classification: string | null,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!classification) return 'outline';
  const lower = classification.toLowerCase();
  if (lower.includes('class iii') || lower.includes('severe'))
    return 'destructive';
  if (lower.includes('class ii') || lower.includes('class i'))
    return 'default';
  return 'secondary';
}

interface VisitCardProps {
  visit: VisitSummary;
}

export function VisitCard({ visit }: VisitCardProps) {
  const navigate = useNavigate();

  const formattedDate = new Date(visit.created_at).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );

  const duration = visit.elapsed_time
    ? `${Math.round(visit.elapsed_time / 60)} min`
    : null;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => navigate(`/saved-visits/${visit.id}`)}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium">
            {visit.patient_label || 'Unnamed Patient'}
          </span>
          <span className="text-sm text-muted-foreground">
            {formattedDate}
            {duration && ` \u00B7 ${duration}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {visit.bmi != null && (
            <span className={`text-sm font-semibold ${getBmiColor(visit.bmi)}`}>
              BMI {visit.bmi.toFixed(1)}
            </span>
          )}
          {visit.classification && (
            <Badge variant={getClassificationVariant(visit.classification)}>
              {visit.classification}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
