import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, FolderOpen, Microscope, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

const navItems = [
  { path: '/new-visit', label: 'New Visit', icon: ClipboardList },
  { path: '/saved-visits', label: 'Saved Visits', icon: FolderOpen },
  { path: '/assessment', label: 'Assessment Tool', icon: Microscope },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="h-12 app-drag-region" />
      <div className="px-4 mb-4">
        <h1 className="text-sm font-bold text-sidebar-foreground">Obesity Compass</h1>
        <p className="text-xs text-muted-foreground">Clinical Assessment Tool</p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
          {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </div>
  );
}
