import { useState, useEffect, useCallback, useRef } from 'react';
import { InterviewState, Response, initialInterviewState } from '@/types/interview';

const DRAFT_SAVE_INTERVAL = 30_000; // 30 seconds

export function useInterviewState(resumeDraft?: boolean) {
  const [state, setState] = useState<InterviewState>(initialInterviewState);
  const draftIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval>>();

  // On mount: check for existing draft if resuming
  useEffect(() => {
    if (!resumeDraft) return;
    window.electronAPI.getDraft().then((draft) => {
      if (draft) {
        draftIdRef.current = draft.id;
        const responses: Response[] = JSON.parse(draft.responses || '[]');
        setState({
          visitType: 'initial',
          currentQuestionIndex: draft.current_question_index ?? 0,
          responses,
          startTime: Date.now(),
          elapsedTime: draft.elapsed_time ?? 0,
          isPaused: false,
          isComplete: false,
          bmiData: {
            height: null,
            weight: draft.weight_lbs ?? null,
            heightInFeet: draft.height_feet ?? null,
            heightInInches: draft.height_inches ?? null,
            useFeetInches: true,
          },
          importedData: '',
        });
      }
    });
  }, [resumeDraft]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      if (state.isComplete) return;
      if (state.responses.length === 0 && !state.bmiData.weight) return;

      const totalInches = state.bmiData.useFeetInches
        ? ((state.bmiData.heightInFeet || 0) * 12) + (state.bmiData.heightInInches || 0)
        : state.bmiData.height || 0;
      const bmi = totalInches && state.bmiData.weight
        ? (state.bmiData.weight / (totalInches * totalInches)) * 703
        : undefined;

      window.electronAPI.saveDraft({
        id: draftIdRef.current || undefined,
        height_feet: state.bmiData.heightInFeet ?? undefined,
        height_inches: state.bmiData.heightInInches ?? undefined,
        weight_lbs: state.bmiData.weight ?? undefined,
        bmi,
        responses: JSON.stringify(state.responses),
        elapsed_time: state.elapsedTime,
        current_question_index: state.currentQuestionIndex,
      }).then((result) => {
        if (result && !('error' in result)) {
          draftIdRef.current = result.id;
        }
      });
    }, DRAFT_SAVE_INTERVAL);
    return () => clearInterval(saveTimerRef.current);
  }, [state]);

  const setVisitType = useCallback((type: 'initial' | 'return') => {
    setState(prev => ({
      ...prev,
      visitType: type,
      startTime: Date.now(),
      currentQuestionIndex: 0,
      responses: [],
      isComplete: false,
    }));
  }, []);

  const setCurrentQuestionIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentQuestionIndex: index }));
  }, []);

  const setResponse = useCallback((questionId: number, answer: string | string[] | number) => {
    setState(prev => {
      const existingIndex = prev.responses.findIndex(r => r.questionId === questionId);
      const newResponses = [...prev.responses];
      if (existingIndex >= 0) {
        newResponses[existingIndex] = { questionId, answer };
      } else {
        newResponses.push({ questionId, answer });
      }
      return { ...prev, responses: newResponses };
    });
  }, []);

  const getResponse = useCallback((questionId: number): Response | undefined => {
    return state.responses.find(r => r.questionId === questionId);
  }, [state.responses]);

  const setBmiData = useCallback((data: Partial<InterviewState['bmiData']>) => {
    setState(prev => ({ ...prev, bmiData: { ...prev.bmiData, ...data } }));
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => {
      if (prev.isPaused) {
        return { ...prev, isPaused: false, startTime: Date.now() - prev.elapsedTime * 1000 };
      }
      const elapsed = prev.startTime
        ? Math.floor((Date.now() - prev.startTime) / 1000)
        : prev.elapsedTime;
      return { ...prev, isPaused: true, elapsedTime: elapsed };
    });
  }, []);

  const updateElapsedTime = useCallback(() => {
    setState(prev => {
      if (prev.isPaused || !prev.startTime) return prev;
      return { ...prev, elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000) };
    });
  }, []);

  const setComplete = useCallback((complete: boolean) => {
    setState(prev => ({ ...prev, isComplete: complete }));
  }, []);

  const reset = useCallback(() => {
    setState(initialInterviewState);
    draftIdRef.current = null;
    window.electronAPI.discardDraft();
  }, []);

  return {
    state,
    setVisitType,
    setCurrentQuestionIndex,
    setResponse,
    getResponse,
    setBmiData,
    togglePause,
    updateElapsedTime,
    setComplete,
    reset,
    draftId: draftIdRef.current,
  };
}
