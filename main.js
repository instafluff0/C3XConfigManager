const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { loadBundle, saveBundle } = require('./src/configCore');

const APP_SETTINGS_FILE = 'settings.json';

function getSettingsPath() {
  return path.join(app.getPath('userData'), APP_SETTINGS_FILE);
}

function readJsonIfExists(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_err) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: 'C3X Config Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('manager:get-settings', async () => {
  const defaults = {
    c3xPath: '',
    civ3ConquestsPath: '',
    scenarioPath: '',
    mode: 'global'
  };
  return readJsonIfExists(getSettingsPath(), defaults);
});

ipcMain.handle('manager:set-settings', async (_event, settings) => {
  writeJson(getSettingsPath(), settings);
  return { ok: true };
});

ipcMain.handle('manager:pick-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('manager:load-bundle', async (_event, payload) => {
  return loadBundle(payload);
});

ipcMain.handle('manager:save-bundle', async (_event, payload) => {
  return saveBundle(payload);
});
