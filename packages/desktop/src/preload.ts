// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose API for renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  reloadMainWindow: () => {
    console.log('🔄 Reloading main window via IPC');
    ipcRenderer.invoke('reload-main-window');
  }
});