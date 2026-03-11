const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('c3xManager', {
  getSettings: () => ipcRenderer.invoke('manager:get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('manager:set-settings', settings),
  pickDirectory: () => ipcRenderer.invoke('manager:pick-directory'),
  pickFile: (options) => ipcRenderer.invoke('manager:pick-file', options),
  openFilePath: (filePath) => ipcRenderer.invoke('manager:open-file-path', filePath),
  pathExists: (dirPath) => ipcRenderer.invoke('manager:path-exists', dirPath),
  getPathAccess: (paths) => ipcRenderer.invoke('manager:get-path-access', paths),
  listScenarios: (civ3Path) => ipcRenderer.invoke('manager:list-scenarios', civ3Path),
  relaunch: () => ipcRenderer.invoke('manager:relaunch'),
  getPreview: (payload) => ipcRenderer.invoke('manager:get-preview', payload),
  loadBundle: (payload) => ipcRenderer.invoke('manager:load-bundle', payload),
  saveBundle: (payload) => ipcRenderer.invoke('manager:save-bundle', payload)
});
