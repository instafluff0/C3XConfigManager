const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { loadBundle, saveBundle } = require('./src/configCore');
const { getPreview } = require('./src/artPreview');

const APP_SETTINGS_FILE = 'settings.json';

function dirExists(dirPath) {
  try {
    return !!dirPath && fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (_err) {
    return false;
  }
}

function looksLikeC3xFolder(dirPath) {
  return dirExists(dirPath) && fs.existsSync(path.join(dirPath, 'default.c3x_config.ini'));
}

function inferDefaultPaths(existing) {
  const next = { ...existing };

  if (!looksLikeC3xFolder(next.c3xPath)) {
    const c3xCandidates = [
      path.join(__dirname, 'C3X'),
      path.join(path.dirname(__dirname), 'C3X'),
      __dirname,
      path.dirname(__dirname)
    ];
    const foundC3x = c3xCandidates.find((p) => looksLikeC3xFolder(p));
    if (foundC3x) {
      next.c3xPath = foundC3x;
    }
  }

  if (!dirExists(next.civ3ConquestsPath)) {
    const appParent = path.dirname(__dirname);
    if (path.basename(appParent).toLowerCase() === 'conquests') {
      next.civ3ConquestsPath = appParent;
    } else if (path.basename(__dirname).toLowerCase() === 'conquests') {
      next.civ3ConquestsPath = __dirname;
    } else if (looksLikeC3xFolder(next.c3xPath)) {
      const c3xParent = path.dirname(next.c3xPath);
      if (path.basename(c3xParent).toLowerCase() === 'conquests') {
        next.civ3ConquestsPath = c3xParent;
      }
    }
  }

  return next;
}

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
  const saved = readJsonIfExists(getSettingsPath(), defaults);
  const inferred = inferDefaultPaths(saved);
  if (JSON.stringify(saved) !== JSON.stringify(inferred)) {
    writeJson(getSettingsPath(), inferred);
  }
  return inferred;
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

ipcMain.handle('manager:pick-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('manager:path-exists', async (_event, dirPath) => {
  return dirExists(dirPath);
});

ipcMain.handle('manager:load-bundle', async (_event, payload) => {
  return loadBundle(payload);
});

ipcMain.handle('manager:save-bundle', async (_event, payload) => {
  return saveBundle(payload);
});

ipcMain.handle('manager:get-preview', async (_event, payload) => {
  try {
    return getPreview(payload || {});
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
