import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useVisits } from '@/hooks/useVisits';
import { VisitCard } from './VisitCard';

export function SavedVisitsList() {
  const { visits, loading, search } = useVisits();
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saved Visits</h1>
      </div>

      <Input
        placeholder="Search by patient name..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-muted-foreground">Loading visits...</p>
      ) : visits.length === 0 ? (
        <p className="text-muted-foreground">
          {query ? 'No visits match your search.' : 'No saved visits yet.'}
        </p>
      ) : (
        <div className="space-y-2">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}
