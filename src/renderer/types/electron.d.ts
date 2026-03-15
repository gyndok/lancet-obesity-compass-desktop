import type { Visit, VisitSummary, CreateVisitInput, UpdateVisitInput } from './visit';

export interface ElectronAPI {
  createVisit: (data: CreateVisitInput) => Promise<Visit | { error: string }>;
  getVisit: (id: string) => Promise<Visit | null>;
  listVisits: () => Promise<VisitSummary[]>;
  searchVisits: (query: string) => Promise<VisitSummary[]>;
  updateVisit: (id: string, data: UpdateVisitInput) => Promise<Visit | { error: string }>;
  deleteVisit: (id: string) => Promise<boolean>;
  saveDraft: (data: CreateVisitInput & { current_question_index?: number }) => Promise<Visit | { error: string }>;
  getDraft: () => Promise<Visit | null>;
  discardDraft: () => Promise<boolean>;
  onNavigate: (callback: (path: string) => void) => () => void;
  onShortcut: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
