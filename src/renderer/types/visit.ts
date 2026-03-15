export interface Visit {
  id: string;
  patient_label: string | null;
  is_draft: number;
  created_at: string;
  updated_at: string;
  height_feet: number | null;
  height_inches: number | null;
  weight_lbs: number | null;
  bmi: number | null;
  responses: string;
  assessment: string | null;
  elapsed_time: number | null;
  notes: string | null;
  current_question_index: number | null;
}

export interface VisitSummary {
  id: string;
  patient_label: string | null;
  created_at: string;
  bmi: number | null;
  classification: string | null;
  elapsed_time: number | null;
}

export interface CreateVisitInput {
  id?: string;
  patient_label?: string;
  height_feet?: number;
  height_inches?: number;
  weight_lbs?: number;
  bmi?: number;
  responses: string;
  assessment?: string;
  elapsed_time?: number;
  notes?: string;
}

export interface UpdateVisitInput {
  patient_label?: string;
  height_feet?: number;
  height_inches?: number;
  weight_lbs?: number;
  bmi?: number;
  responses?: string;
  assessment?: string;
  elapsed_time?: number;
  notes?: string;
}
