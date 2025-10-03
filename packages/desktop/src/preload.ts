// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose API for renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  reloadMainWindow: () => {
    ipcRenderer.invoke('reload-main-window');
  }
});