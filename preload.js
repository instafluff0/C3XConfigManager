const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('c3xManager', {
  getSettings: () => ipcRenderer.invoke('manager:get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('manager:set-settings', settings),
  pickDirectory: () => ipcRenderer.invoke('manager:pick-directory'),
  pickFile: (options) => ipcRenderer.invoke('manager:pick-file', options),
  pathExists: (dirPath) => ipcRenderer.invoke('manager:path-exists', dirPath),
  listScenarios: (civ3Path) => ipcRenderer.invoke('manager:list-scenarios', civ3Path),
  getPreview: (payload) => ipcRenderer.invoke('manager:get-preview', payload),
  loadBundle: (payload) => ipcRenderer.invoke('manager:load-bundle', payload),
  saveBundle: (payload) => ipcRenderer.invoke('manager:save-bundle', payload)
});
