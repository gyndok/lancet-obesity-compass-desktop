import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Stethoscope, FileText, Calculator, User, RotateCcw, Save } from 'lucide-react';
import { AnthropometricForm } from '@/components/forms/AnthropometricForm';
import { ClinicalForm } from '@/components/forms/ClinicalForm';
import { LaboratoryForm } from '@/components/forms/LaboratoryForm';
import { FunctionalForm } from '@/components/forms/FunctionalForm';
import { DiagnosticResults } from '@/components/results/DiagnosticResults';
import { DiagnosticEngine } from '@/lib/diagnostic-engine';
import { PatientData, DiagnosticResult, FunctionalData } from '@/types/clinical';
import { Response } from '@/types/interview';
import { toast } from 'sonner';

export default function Assessment() {
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visitId');

  const [patientData, setPatientData] = useState<PatientData>({
    anthropometrics: {},
    clinical: {},
    laboratory: {},
    functional: {},
  });

  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [activeTab, setActiveTab] = useState('anthropometric');
  const [isSaving, setIsSaving] = useState(false);
  const [visitLabel, setVisitLabel] = useState<string | null>(null);

  // Load visit data if visitId is present
  useEffect(() => {
    if (!visitId) return;

    window.electronAPI.getVisit(visitId).then((visit) => {
      if (!visit) return;

      setVisitLabel(visit.patient_label);

      // Parse responses from the visit
      let responses: Response[] = [];
      try {
        responses = JSON.parse(visit.responses || '[]');
      } catch {
        // ignore parse errors
      }

      // If there's already an assessment saved, load it
      if (visit.assessment) {
        try {
          const savedAssessment = JSON.parse(visit.assessment);
          if (savedAssessment.patientData) {
            setPatientData(savedAssessment.patientData);
            const result = DiagnosticEngine.evaluate(savedAssessment.patientData);
            setDiagnosticResult(result);
            return;
          }
        } catch {
          // fall through to build from responses
        }
      }

      // Build patient data from visit responses (same logic as web app)
      const updatedData: PatientData = {
        anthropometrics: {},
        clinical: {},
        laboratory: {},
        functional: {},
      };

      // Anthropometrics from visit measurements
      // Treat null height_inches as 0 when height_feet is present
      const heightInches = visit.height_feet != null
        ? (visit.height_feet * 12) + (visit.height_inches ?? 0)
        : visit.height_inches != null
          ? visit.height_inches
          : undefined;

      const ageResponse = responses.find(r => r.questionId === 1);
      const sexResponse = responses.find(r => r.questionId === 2);
      const ethnicityResponse = responses.find(r => r.questionId === 53);

      const ethnicityMap: Record<string, string> = {
        'Caucasian': 'caucasian',
        'African American': 'african-american',
        'Hispanic/Latino': 'hispanic',
        'Asian': 'asian',
        'Other': 'other',
      };

      const age = ageResponse?.answer ? Number(ageResponse.answer) : undefined;
      const sexValue = sexResponse?.answer
        ? (sexResponse.answer as string).toLowerCase()
        : undefined;

      // Calculate body fat % using Deurenberg formula
      let bodyFatPercentage: number | undefined;
      if (heightInches && visit.weight_lbs && age && sexValue) {
        const heightMeters = heightInches * 0.0254;
        const weightKg = visit.weight_lbs * 0.453592;
        const bmi = weightKg / (heightMeters * heightMeters);
        const sexMultiplier = sexValue === 'male' ? 1 : 0;
        bodyFatPercentage = parseFloat(
          ((1.20 * bmi) + (0.23 * age) - (10.8 * sexMultiplier) - 5.4).toFixed(1)
        );
      }

      updatedData.anthropometrics = {
        height: heightInches,
        weight: visit.weight_lbs ?? undefined,
        age,
        sex: sexValue as 'male' | 'female' | undefined,
        ethnicity: ethnicityResponse?.answer
          ? ethnicityMap[ethnicityResponse.answer as string]
          : undefined,
        bodyFatPercentage,
      };

      // Functional limitations (question 54)
      const adlResponse = responses.find(r => r.questionId === 54);
      const adlAnswers = Array.isArray(adlResponse?.answer) ? adlResponse.answer : [];
      const adlMapping: Record<string, keyof FunctionalData> = {
        'Mobility Limitations': 'mobilityLimitations',
        'Bathing Difficulty': 'bathingDifficulty',
        'Dressing Difficulty': 'dressingDifficulty',
        'Toileting Difficulty': 'toiletingDifficulty',
        'Continence Issues': 'continenceDifficulty',
        'Eating Difficulty': 'eatingDifficulty',
      };
      const functionalData: Record<string, boolean> = {};
      adlAnswers.forEach((answer) => {
        const field = adlMapping[answer];
        if (field) functionalData[field] = true;
      });
      updatedData.functional = functionalData;

      // Clinical symptoms & medical history
      const symptomMappings = [
        { questionId: 55, mappings: { 'Breathlessness/Dyspnea': 'breathlessness', 'Chronic Fatigue': 'fatigue' } },
        { questionId: 56, mappings: { 'Chronic Pain': 'chronicPain', 'Urinary Incontinence': 'urinaryIncontinence', 'Gastroesophageal Reflux (GERD)': 'reflux' } },
        { questionId: 57, mappings: { 'Sleep Disorders': 'sleepDisorders', 'Mental Health Issues (Depression/Anxiety)': 'mentalHealth' } },
        { questionId: 58, mappings: { 'Type 2 Diabetes': 'type2Diabetes', 'Polycystic Ovary Syndrome (PCOS)': 'pcos' } },
        { questionId: 59, mappings: { 'Hypertension': 'hypertension', 'Cardiovascular Disease': 'cardiovascularDisease' } },
        { questionId: 60, mappings: { 'Sleep Apnea': 'sleepApnea', 'NAFLD/NASH': 'nafld', 'Osteoarthritis': 'osteoarthritis' } },
      ];
      const clinicalData: Record<string, boolean> = {};
      symptomMappings.forEach(({ questionId, mappings }) => {
        const response = responses.find(r => r.questionId === questionId);
        const answers = Array.isArray(response?.answer) ? response.answer : [];
        answers.forEach((answer) => {
          const field = mappings[answer as keyof typeof mappings];
          if (field) clinicalData[field] = true;
        });
      });
      updatedData.clinical = clinicalData;

      setPatientData(updatedData);
      const result = DiagnosticEngine.evaluate(updatedData);
      setDiagnosticResult(result);
    });
  }, [visitId]);

  const handleDataUpdate = (section: keyof PatientData, data: Record<string, unknown>) => {
    const updatedData = {
      ...patientData,
      [section]: data,
    };
    setPatientData(updatedData);
    const result = DiagnosticEngine.evaluate(updatedData);
    setDiagnosticResult(result);
  };

  const isDataComplete = (section: keyof PatientData) => {
    const data = patientData[section];
    return data && Object.keys(data).length > 0;
  };

  const handleClearAll = () => {
    setPatientData({
      anthropometrics: {},
      clinical: {},
      laboratory: {},
      functional: {},
    });
    setDiagnosticResult(null);
    setActiveTab('anthropometric');
  };

  const handleSaveToVisit = async () => {
    if (!visitId || !diagnosticResult) return;
    setIsSaving(true);
    try {
      const assessmentPayload = {
        patientData,
        result: diagnosticResult,
      };
      const result = await window.electronAPI.updateVisit(visitId, {
        assessment: JSON.stringify(assessmentPayload),
      });
      if (result && !('error' in result)) {
        toast.success('Assessment saved to visit');
      } else {
        toast.error('Failed to save assessment');
      }
    } catch (err) {
      console.error('Failed to save assessment:', err);
      toast.error('Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Clinical Obesity Diagnostic Tool
                </h1>
                <p className="text-muted-foreground">
                  Based on 2025 Lancet Commission Criteria
                  {visitLabel && (
                    <span className="ml-2 text-sm">
                      -- Patient: {visitLabel}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {visitId && diagnosticResult && (
                <Button
                  size="sm"
                  onClick={handleSaveToVisit}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save to Visit'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Clear All
              </Button>
              <Badge variant="outline">Evidence-Based</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Data Entry */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Assessment
                </CardTitle>
                <CardDescription>
                  Complete the assessment forms to receive a diagnostic evaluation based on Lancet Commission criteria.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="anthropometric" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span className="hidden sm:inline">Anthropometric</span>
                      <span className="sm:hidden">Anthro</span>
                      {isDataComplete('anthropometrics') && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="clinical" className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      <span className="hidden sm:inline">Clinical</span>
                      {isDataComplete('clinical') && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="laboratory" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Laboratory</span>
                      <span className="sm:hidden">Labs</span>
                      {isDataComplete('laboratory') && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="functional" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Functional</span>
                      <span className="sm:hidden">Func</span>
                      {isDataComplete('functional') && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="anthropometric">
                    <AnthropometricForm
                      data={patientData.anthropometrics}
                      onUpdate={(data) => handleDataUpdate('anthropometrics', data)}
                    />
                  </TabsContent>

                  <TabsContent value="clinical">
                    <ClinicalForm
                      data={patientData.clinical}
                      onUpdate={(data) => handleDataUpdate('clinical', data)}
                    />
                  </TabsContent>

                  <TabsContent value="laboratory">
                    <LaboratoryForm
                      data={patientData.laboratory}
                      onUpdate={(data) => handleDataUpdate('laboratory', data)}
                    />
                  </TabsContent>

                  <TabsContent value="functional">
                    <FunctionalForm
                      data={patientData.functional}
                      onUpdate={(data) => handleDataUpdate('functional', data)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Diagnostic Results */}
          <div className="lg:col-span-1">
            <DiagnosticResults result={diagnosticResult} patientData={patientData} />
          </div>
        </div>
      </div>
    </div>
  );
}
