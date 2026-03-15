import { useState } from 'react';
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
  const _sections = getUniqueSections(questions);

  const handleNext = () => {
    if (state.isPaused) {
      togglePause();
    }

    if (phase === 'label') {
      // Start the interview timer
      setVisitType('initial');
      setPhase('bmi');
    } else if (phase === 'bmi') {
      setPhase('questions');
    } else if (phase === 'questions') {
      if (state.currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(state.currentQuestionIndex + 1);
      } else {
        setComplete(true);
        setPhase('summary');
      }
    }
  };

  const handleBack = () => {
    if (phase === 'summary') {
      setPhase('questions');
    } else if (phase === 'questions') {
      if (state.currentQuestionIndex > 0) {
        setCurrentQuestionIndex(state.currentQuestionIndex - 1);
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

  const currentQuestion = questions[state.currentQuestionIndex];
  const currentResponse = currentQuestion ? getResponse(currentQuestion.id) : undefined;

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
        {phase === 'questions' && currentQuestion && (
          <div className="mb-6">
            <ProgressIndicator
              currentIndex={state.currentQuestionIndex}
              totalQuestions={questions.length}
              sectionName={currentQuestion.section}
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

        {/* Questions Phase */}
        {phase === 'questions' && currentQuestion && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-primary font-medium">
                      {currentQuestion.section}
                    </span>
                    <h2 className="text-xl font-semibold mt-2">
                      {currentQuestion.question}
                    </h2>
                    {currentQuestion.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentQuestion.description}
                      </p>
                    )}
                  </div>
                  <QuestionForm
                    question={currentQuestion}
                    currentResponse={currentResponse}
                    onAnswer={(answer) => setResponse(currentQuestion.id, answer)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                {state.currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
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
