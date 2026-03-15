import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useVisitMutations } from '@/hooks/useVisitMutations';
import {
  copyToClipboard,
  formatVisitSummary,
  formatSection,
} from '@/lib/copy-utils';
import { initialVisitQuestions, getUniqueSections } from '@/data/initialVisitQuestions';
import type { Visit } from '@/types/visit';
import type { Response } from '@/types/interview';

interface VisitDetailProps {
  visit: Visit;
  onDelete: () => void;
  onUpdate: () => void;
}

function calculateBmi(
  heightFeet: number | null,
  heightInches: number | null,
  weightLbs: number | null,
): number | null {
  if (heightFeet == null || heightInches == null || weightLbs == null)
    return null;
  const totalInches = heightFeet * 12 + heightInches;
  if (totalInches <= 0 || weightLbs <= 0) return null;
  return (weightLbs / (totalInches * totalInches)) * 703;
}

export function VisitDetail({ visit, onDelete, onUpdate }: VisitDetailProps) {
  const { updateVisit } = useVisitMutations();
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [patientLabel, setPatientLabel] = useState(visit.patient_label || '');
  const [heightFeet, setHeightFeet] = useState(visit.height_feet);
  const [heightInches, setHeightInches] = useState(visit.height_inches);
  const [weightLbs, setWeightLbs] = useState(visit.weight_lbs);
  const [notes, setNotes] = useState(visit.notes || '');

  const responses: Response[] = useMemo(
    () => JSON.parse(visit.responses || '[]'),
    [visit.responses],
  );

  const assessment = useMemo(() => {
    if (!visit.assessment) return null;
    try {
      return JSON.parse(visit.assessment);
    } catch {
      return null;
    }
  }, [visit.assessment]);

  const sections = useMemo(() => getUniqueSections(initialVisitQuestions), []);

  const editBmi = useMemo(
    () => calculateBmi(heightFeet, heightInches, weightLbs),
    [heightFeet, heightInches, weightLbs],
  );

  const displayBmi = isEditing ? editBmi : visit.bmi;

  const handleSave = async () => {
    const result = await updateVisit(visit.id, {
      patient_label: patientLabel || undefined,
      height_feet: heightFeet ?? undefined,
      height_inches: heightInches ?? undefined,
      weight_lbs: weightLbs ?? undefined,
      bmi: editBmi ?? undefined,
      notes: notes || undefined,
    });
    if (result) {
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleCancel = () => {
    setPatientLabel(visit.patient_label || '');
    setHeightFeet(visit.height_feet);
    setHeightInches(visit.height_inches);
    setWeightLbs(visit.weight_lbs);
    setNotes(visit.notes || '');
    setIsEditing(false);
  };

  const formattedDate = new Date(visit.created_at).toLocaleDateString(
    undefined,
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  const duration = visit.elapsed_time
    ? `${Math.round(visit.elapsed_time / 60)} minutes`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isEditing ? (
            <Input
              value={patientLabel}
              onChange={(e) => setPatientLabel(e.target.value)}
              placeholder="Patient label"
              className="text-2xl font-bold h-auto py-1 mb-1"
            />
          ) : (
            <h1 className="text-2xl font-bold">
              {visit.patient_label || 'Unnamed Patient'}
            </h1>
          )}
          <p className="text-muted-foreground">
            {formattedDate}
            {duration && ` \u00B7 ${duration}`}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            copyToClipboard(formatVisitSummary(visit), 'Full summary')
          }
        >
          Copy Full Summary
        </Button>

        {isEditing ? (
          <>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                visit record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* BMI Card */}
      {(displayBmi != null || isEditing) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">BMI Data</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Height (ft)
                  </label>
                  <Input
                    type="number"
                    value={heightFeet ?? ''}
                    onChange={(e) =>
                      setHeightFeet(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Height (in)
                  </label>
                  <Input
                    type="number"
                    value={heightInches ?? ''}
                    onChange={(e) =>
                      setHeightInches(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Weight (lbs)
                  </label>
                  <Input
                    type="number"
                    value={weightLbs ?? ''}
                    onChange={(e) =>
                      setWeightLbs(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">BMI</label>
                  <div className="h-10 flex items-center font-semibold">
                    {editBmi != null ? editBmi.toFixed(1) : '--'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 text-sm">
                {visit.height_feet != null && visit.height_inches != null && (
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() =>
                      copyToClipboard(
                        `${visit.height_feet}'${visit.height_inches}"`,
                        'Height',
                      )
                    }
                  >
                    Height: {visit.height_feet}&apos;{visit.height_inches}&quot;
                  </span>
                )}
                {visit.weight_lbs != null && (
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() =>
                      copyToClipboard(`${visit.weight_lbs} lbs`, 'Weight')
                    }
                  >
                    Weight: {visit.weight_lbs} lbs
                  </span>
                )}
                {displayBmi != null && (
                  <span
                    className="font-semibold cursor-pointer hover:underline"
                    onClick={() =>
                      copyToClipboard(displayBmi.toFixed(1), 'BMI')
                    }
                  >
                    BMI: {displayBmi.toFixed(1)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interview Sections */}
      {sections.map((sectionName) => {
        const sectionQuestions = initialVisitQuestions.filter(
          (q) => q.section === sectionName,
        );
        const sectionResponses = responses.filter((r) =>
          sectionQuestions.some((q) => q.id === r.questionId),
        );

        if (sectionResponses.length === 0) return null;

        return (
          <Card key={sectionName}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{sectionName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    copyToClipboard(
                      formatSection(sectionName, visit),
                      sectionName,
                    )
                  }
                >
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {sectionResponses.map((resp) => {
                  const question = initialVisitQuestions.find(
                    (q) => q.id === resp.questionId,
                  );
                  if (!question) return null;
                  const answerText = Array.isArray(resp.answer)
                    ? resp.answer.join(', ')
                    : String(resp.answer);
                  return (
                    <div key={resp.questionId}>
                      <dt className="text-xs text-muted-foreground">
                        {question.question}
                      </dt>
                      <dd
                        className="text-sm cursor-pointer hover:underline"
                        onClick={() =>
                          copyToClipboard(answerText, question.question)
                        }
                      >
                        {answerText || '--'}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        );
      })}

      {/* Assessment Card */}
      {assessment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Diagnostic Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Classification:
              </span>
              <Badge>{assessment.classification}</Badge>
            </div>
            {assessment.confidence && (
              <div className="text-sm">
                <span className="text-muted-foreground">Confidence: </span>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() =>
                    copyToClipboard(assessment.confidence, 'Confidence')
                  }
                >
                  {assessment.confidence}
                </span>
              </div>
            )}
            {assessment.affectedSystems?.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Affected Systems:{' '}
                </span>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() =>
                    copyToClipboard(
                      assessment.affectedSystems.join(', '),
                      'Affected systems',
                    )
                  }
                >
                  {assessment.affectedSystems.join(', ')}
                </span>
              </div>
            )}
            {assessment.recommendations?.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Recommendations:{' '}
                </span>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() =>
                    copyToClipboard(
                      assessment.recommendations.join('; '),
                      'Recommendations',
                    )
                  }
                >
                  {assessment.recommendations.join('; ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(isEditing || visit.notes) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            ) : (
              <p
                className="text-sm cursor-pointer hover:underline whitespace-pre-wrap"
                onClick={() => copyToClipboard(visit.notes || '', 'Notes')}
              >
                {visit.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
