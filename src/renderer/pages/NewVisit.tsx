import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Stethoscope, Save, User } from 'lucide-react';
import { useInterviewState } from '@/hooks/useInterviewState';
import { initialVisitQuestions, getUniqueSections } from '@/data/initialVisitQuestions';
import { EncounterTimer } from '@/components/interview/EncounterTimer';
import { ProgressIndicator } from '@/components/interview/ProgressIndicator';
import { QuestionForm } from '@/components/interview/QuestionForm';
import { BMICalculator } from '@/components/interview/BMICalculator';
import { InterviewSummary } from '@/components/interview/InterviewSummary';
import { ClinicalDataHeader } from '@/components/interview/ClinicalDataHeader';

type InterviewPhase = 'label' | 'bmi' | 'questions' | 'summary';

export default function NewVisit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeDraft = searchParams.get('resume') === 'true';

  const {
    state,
    setVisitType,
    setCurrentQuestionIndex,
    setResponse,
    getResponse,
    setBmiData,
    togglePause,
    setComplete,
    reset,
  } = useInterviewState(resumeDraft);

  const [phase, setPhase] = useState<InterviewPhase>(resumeDraft ? 'questions' : 'label');
  const [patientLabel, setPatientLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const questions = initialVisitQuestions;
  const sections = getUniqueSections(questions);

  // Group questions by section for multi-question pages
  const questionsBySection = sections.map(section => ({
    section,
    questions: questions.filter(q => q.section === section),
  }));

  // Track current section index (replaces per-question index for navigation)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const currentSectionGroup = questionsBySection[currentSectionIndex];

  const handleNext = () => {
    if (state.isPaused) {
      togglePause();
    }

    if (phase === 'label') {
      setVisitType('initial');
      setPhase('bmi');
    } else if (phase === 'bmi') {
      setCurrentSectionIndex(0);
      setPhase('questions');
    } else if (phase === 'questions') {
      if (currentSectionIndex < questionsBySection.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        // Update the question index to the first question of the next section
        const nextSection = questionsBySection[currentSectionIndex + 1];
        const qIdx = questions.findIndex(q => q.id === nextSection.questions[0].id);
        setCurrentQuestionIndex(qIdx);
      } else {
        setComplete(true);
        setPhase('summary');
      }
    }
  };

  const handleBack = () => {
    if (phase === 'summary') {
      setCurrentSectionIndex(questionsBySection.length - 1);
      setPhase('questions');
    } else if (phase === 'questions') {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
      } else {
        setPhase('bmi');
      }
    } else if (phase === 'bmi') {
      setPhase('label');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the interview? All data will be lost.')) {
      reset();
      setPhase('label');
      setPatientLabel('');
    }
  };

  const handleSaveVisit = async () => {
    setIsSaving(true);
    try {
      const totalInches = state.bmiData.useFeetInches
        ? ((state.bmiData.heightInFeet || 0) * 12) + (state.bmiData.heightInInches || 0)
        : state.bmiData.height || 0;
      const bmi = totalInches && state.bmiData.weight
        ? (state.bmiData.weight / (totalInches * totalInches)) * 703
        : undefined;

      const result = await window.electronAPI.createVisit({
        patient_label: patientLabel || undefined,
        height_feet: state.bmiData.heightInFeet ?? undefined,
        height_inches: state.bmiData.heightInInches ?? undefined,
        weight_lbs: state.bmiData.weight ?? undefined,
        bmi,
        responses: JSON.stringify(state.responses),
        elapsed_time: state.elapsedTime,
      });

      if (result && !('error' in result)) {
        // Discard the draft since we've saved the visit
        await window.electronAPI.discardDraft();
        navigate(`/saved-visits/${result.id}`);
      }
    } catch (err) {
      console.error('Failed to save visit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToAssessment = async () => {
    setIsSaving(true);
    try {
      const totalInches = state.bmiData.useFeetInches
        ? ((state.bmiData.heightInFeet || 0) * 12) + (state.bmiData.heightInInches || 0)
        : state.bmiData.height || 0;
      const bmi = totalInches && state.bmiData.weight
        ? (state.bmiData.weight / (totalInches * totalInches)) * 703
        : undefined;

      // Save the visit first
      const result = await window.electronAPI.createVisit({
        patient_label: patientLabel || undefined,
        height_feet: state.bmiData.heightInFeet ?? undefined,
        height_inches: state.bmiData.heightInInches ?? undefined,
        weight_lbs: state.bmiData.weight ?? undefined,
        bmi,
        responses: JSON.stringify(state.responses),
        elapsed_time: state.elapsedTime,
      });

      if (result && !('error' in result)) {
        await window.electronAPI.discardDraft();
        navigate(`/assessment?visitId=${result.id}`);
      }
    } catch (err) {
      console.error('Failed to save visit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard navigation: Arrow keys for section nav (not in inputs)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Enter' && phase === 'label') {
        e.preventDefault();
        handleNext();
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleBack();
    }
  }, [phase, currentSectionIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">New Visit Interview</h1>
              <p className="text-xs text-muted-foreground">
                {patientLabel ? `Patient: ${patientLabel}` : 'Weight Management Intake'}
              </p>
            </div>
          </div>
          {phase !== 'label' && (
            <EncounterTimer
              startTime={state.startTime}
              elapsedTime={state.elapsedTime}
              isPaused={state.isPaused}
              onTogglePause={togglePause}
              onReset={handleReset}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Clinical Data Header */}
        {(phase === 'bmi' || phase === 'questions') && (
          <ClinicalDataHeader
            age={state.responses.find(r => r.questionId === 1)?.answer as number | null}
            sex={state.responses.find(r => r.questionId === 2)?.answer as string | null}
            weight={state.bmiData.weight}
            heightInches={
              state.bmiData.useFeetInches
                ? ((state.bmiData.heightInFeet || 0) * 12) + (state.bmiData.heightInInches || 0) || null
                : state.bmiData.height
            }
            goalWeight={state.responses.find(r => r.questionId === 6)?.answer as number | null}
          />
        )}

        {/* Progress */}
        {phase === 'questions' && currentSectionGroup && (
          <div className="mb-6">
            <ProgressIndicator
              currentIndex={currentSectionIndex}
              totalQuestions={questionsBySection.length}
              sectionName={currentSectionGroup.section}
            />
          </div>
        )}

        {/* Label Phase */}
        {phase === 'label' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Information
                </CardTitle>
                <CardDescription>
                  Enter an optional label for this visit (e.g., patient initials or chart number).
                  No PHI is stored -- this is for your reference only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-label">Patient Label (optional)</Label>
                  <Input
                    id="patient-label"
                    placeholder="e.g., J.D. or #12345"
                    value={patientLabel}
                    onChange={(e) => setPatientLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNext();
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleNext} size="lg">
                Start Interview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* BMI Phase */}
        {phase === 'bmi' && (
          <div className="space-y-6">
            <BMICalculator
              height={state.bmiData.height}
              weight={state.bmiData.weight}
              heightInFeet={state.bmiData.heightInFeet}
              heightInInches={state.bmiData.heightInInches}
              useFeetInches={state.bmiData.useFeetInches}
              onUpdate={setBmiData}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Continue to Questions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Questions Phase — grouped by section */}
        {phase === 'questions' && currentSectionGroup && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                    Section {currentSectionIndex + 1} of {questionsBySection.length}
                  </span>
                  <span>{currentSectionGroup.section}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {currentSectionGroup.questions.map((q, idx) => {
                  const resp = getResponse(q.id);
                  return (
                    <div key={q.id} className={idx > 0 ? 'border-t pt-6' : ''}>
                      <div className="mb-3">
                        <h3 className="text-base font-semibold">
                          {q.question}
                        </h3>
                        {q.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {q.description}
                          </p>
                        )}
                      </div>
                      <QuestionForm
                        question={q}
                        currentResponse={resp}
                        onAnswer={(answer) => setResponse(q.id, answer)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentSectionIndex === 0 ? 'Back to BMI' : 'Previous Section'}
              </Button>
              <Button onClick={handleNext}>
                {currentSectionIndex === questionsBySection.length - 1 ? 'Complete' : 'Next Section'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary Phase */}
        {phase === 'summary' && (
          <div className="space-y-6">
            <InterviewSummary
              responses={state.responses}
              questions={questions}
              elapsedTime={state.elapsedTime}
              visitType="initial"
              bmiData={state.bmiData}
              onRestart={handleReset}
              onProceedToAssessment={handleProceedToAssessment}
            />
            <div className="flex justify-center">
              <Button
                onClick={handleSaveVisit}
                disabled={isSaving}
                size="lg"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Visit Without Assessment'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
