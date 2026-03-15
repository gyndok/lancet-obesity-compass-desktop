import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/lib/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import { DraftResumeDialog } from '@/components/visits/DraftResumeDialog';
import SavedVisits from '@/pages/SavedVisits';
import VisitDetailPage from '@/pages/VisitDetail';
import NewVisit from '@/pages/NewVisit';
import Assessment from '@/pages/Assessment';

function NavigationListener() {
  useEffect(() => {
    const unsubNav = window.electronAPI.onNavigate((path: string) => {
      window.location.hash = path;
    });
    return unsubNav;
  }, []);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <NavigationListener />
        <DraftResumeDialog />
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
