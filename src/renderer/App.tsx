import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/lib/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import SavedVisits from '@/pages/SavedVisits';
import VisitDetailPage from '@/pages/VisitDetail';

// Placeholder pages for features not yet implemented
function NewVisit() {
  return <div className="p-6"><h1 className="text-2xl font-bold">New Visit</h1><p className="text-muted-foreground mt-2">Interview flow coming soon.</p></div>;
}
function Assessment() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Assessment Tool</h1><p className="text-muted-foreground mt-2">Diagnostic assessment coming soon.</p></div>;
}

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
