import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Visit CRUD
  createVisit: (data: unknown) => ipcRenderer.invoke('visit:create', data),
  getVisit: (id: string) => ipcRenderer.invoke('visit:get', id),
  listVisits: () => ipcRenderer.invoke('visit:list'),
  searchVisits: (query: string) => ipcRenderer.invoke('visit:search', query),
  updateVisit: (id: string, data: unknown) => ipcRenderer.invoke('visit:update', id, data),
  deleteVisit: (id: string) => ipcRenderer.invoke('visit:delete', id),

  // Draft management
  saveDraft: (data: unknown) => ipcRenderer.invoke('visit:save-draft', data),
  getDraft: () => ipcRenderer.invoke('visit:get-draft'),
  discardDraft: () => ipcRenderer.invoke('visit:discard-draft'),

  // Navigation & shortcuts (from main process)
  onNavigate: (callback: (path: string) => void) => {
    const handler = (_event: unknown, path: string) => callback(path);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },
  onShortcut: (callback: (action: string) => void) => {
    const handler = (_event: unknown, action: string) => callback(action);
    ipcRenderer.on('shortcut', handler);
    return () => ipcRenderer.removeListener('shortcut', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
