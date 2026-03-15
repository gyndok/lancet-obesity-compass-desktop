import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">
          Lancet Obesity Compass
        </h1>
        <p className="text-muted-foreground">
          Clinical Obesity Diagnostic Tool — Desktop Edition
        </p>
        <div className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          Tailwind + React + Electron Ready
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
