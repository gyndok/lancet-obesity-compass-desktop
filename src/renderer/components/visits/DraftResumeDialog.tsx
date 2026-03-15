import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DraftResumeDialog() {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.electronAPI.getDraft().then((draft) => {
      if (draft) {
        setDraftDate(new Date(draft.updated_at).toLocaleString());
        setOpen(true);
      }
    });
  }, []);

  const handleResume = () => {
    setOpen(false);
    navigate('/new-visit?resume=true');
  };

  const handleDiscard = async () => {
    await window.electronAPI.discardDraft();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unfinished Visit</AlertDialogTitle>
          <AlertDialogDescription>
            You have an unfinished visit from {draftDate}. Would you like to
            resume or discard it?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscard}>Discard</AlertDialogCancel>
          <AlertDialogAction onClick={handleResume}>Resume</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
