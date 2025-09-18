// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC API to renderer process through contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  storage: {
    set: (key: string, value: any) => ipcRenderer.invoke('storage:set', { key, value }),
    get: (key: string, defaultValue?: any) => ipcRenderer.invoke('storage:get', { key, defaultValue }),
    has: (key: string) => ipcRenderer.invoke('storage:has', { key }),
    delete: (key: string) => ipcRenderer.invoke('storage:delete', { key }),
    clear: () => ipcRenderer.invoke('storage:clear'),
    keys: () => ipcRenderer.invoke('storage:keys'),
    size: () => ipcRenderer.invoke('storage:size'),
    path: () => ipcRenderer.invoke('storage:path')
  }
});
