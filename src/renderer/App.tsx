import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/lib/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import SavedVisits from '@/pages/SavedVisits';
import VisitDetailPage from '@/pages/VisitDetail';
import NewVisit from '@/pages/NewVisit';
import Assessment from '@/pages/Assessment';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/new-visit" replace />} />
            <Route path="/new-visit" element={<NewVisit />} />
            <Route path="/saved-visits" element={<SavedVisits />} />
            <Route path="/saved-visits/:id" element={<VisitDetailPage />} />
            <Route path="/assessment" element={<Assessment />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}
