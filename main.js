const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { loadBundle, saveBundle, previewSavePlan, previewFileDiff, createScenario } = require('./src/configCore');
const { getPreview } = require('./src/artPreview');

const APP_SETTINGS_FILE = 'settings.json';
const APP_NAME = 'Civ 3 C3X Modern Configuration Manager';
const DEV_APP_ICON_PATH = path.join(__dirname, 'build', 'icon.png');
app.setName(APP_NAME);
app.name = APP_NAME;

function applyAppIdentity() {
  app.setName(APP_NAME);
  app.name = APP_NAME;
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: APP_NAME,
      applicationVersion: app.getVersion()
    });
  }
}

function getSettingsPathUnsafe() {
  try {
    return path.join(app.getPath('userData'), APP_SETTINGS_FILE);
  } catch (_err) {
    return '';
  }
}

function readStartupPerformanceMode() {
  try {
    const settingsPath = getSettingsPathUnsafe();
    if (!settingsPath || !fs.existsSync(settingsPath)) return 'high';
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return normalizePerformanceMode(raw && raw.performanceMode);
  } catch (_err) {
    return 'high';
  }
}

function normalizePerformanceMode(value) {
  return String(value || 'high').toLowerCase() === 'safe' ? 'safe' : 'high';
}

const startupPerformanceMode = readStartupPerformanceMode();
let currentPerformanceMode = startupPerformanceMode;
// Prevent frequent macOS IOSurface allocation crashes in canvas-heavy screens.
if (process.platform === 'darwin' && startupPerformanceMode === 'safe' && process.env.C3X_MANAGER_FORCE_GPU !== '1') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

function dirExists(dirPath) {
  try {
    return !!dirPath && fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (_err) {
    return false;
  }
}

function pathExists(anyPath) {
  try {
    return !!anyPath && fs.existsSync(anyPath);
  } catch (_err) {
    return false;
  }
}

function resolveCiv3RootPath(civ3Path) {
  if (!civ3Path) return '';
  const base = path.basename(civ3Path).toLowerCase();
  if (base === 'conquests' || base === 'civ3ptw') {
    return path.dirname(civ3Path);
  }
  return civ3Path;
}

function listKnownScenarios(civ3Path) {
  const root = resolveCiv3RootPath(civ3Path);
  if (!root) return [];
  const conquestsRoot = path.join(root, 'Conquests');
  const groups = [
    { source: 'Conquests', dir: path.join(conquestsRoot, 'Conquests') },
    { source: 'Scenarios', dir: path.join(conquestsRoot, 'Scenarios') }
  ];
  const out = [];
  groups.forEach((group) => {
    if (!dirExists(group.dir)) return;
    const entries = fs.readdirSync(group.dir, { withFileTypes: true })
      .filter((d) => d.isFile() && /\.biq$/i.test(d.name))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    entries.forEach((fileName) => {
      out.push({
        source: group.source,
        fileName,
        name: fileName.replace(/\.biq$/i, ''),
        path: path.join(group.dir, fileName)
      });
    });
  });
  return out;
}

function looksLikeC3xFolder(dirPath) {
  return dirExists(dirPath) && fs.existsSync(path.join(dirPath, 'default.c3x_config.ini'));
}

function inferDefaultPaths(existing) {
  const next = { ...existing };

  // Backward compatibility: older settings stored a Conquests path directly.
  if (!next.civ3Path && next.civ3ConquestsPath) {
    const old = next.civ3ConquestsPath;
    if (path.basename(old).toLowerCase() === 'conquests') next.civ3Path = path.dirname(old);
    else next.civ3Path = old;
  }

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

  if (!dirExists(next.civ3Path)) {
    const appParent = path.dirname(__dirname);
    const appGrandParent = path.dirname(appParent);
    if (path.basename(appParent).toLowerCase() === 'conquests') {
      next.civ3Path = appGrandParent;
    } else if (path.basename(__dirname).toLowerCase() === 'conquests') {
      next.civ3Path = path.dirname(__dirname);
    } else if (looksLikeC3xFolder(next.c3xPath)) {
      const c3xParent = path.dirname(next.c3xPath);
      if (path.basename(c3xParent).toLowerCase() === 'conquests') {
        next.civ3Path = path.dirname(c3xParent);
      }
    }
  }

  return next;
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), APP_SETTINGS_FILE);
}

function findFirstExisting(paths) {
  return paths.find((p) => !!p && fs.existsSync(p)) || '';
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
  const windowIcon = fs.existsSync(DEV_APP_ICON_PATH) ? DEV_APP_ICON_PATH : undefined;
  const win = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: 'Civ 3 | C3X Modern Configuration Manager',
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const openExternalUrl = (url) => {
    const target = String(url || '').trim();
    if (!/^https?:\/\//i.test(target)) return false;
    shell.openExternal(target).catch(() => {});
    return true;
  };

  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (openExternalUrl(url)) {
      event.preventDefault();
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

function sendPerformanceModeSelection(mode) {
  currentPerformanceMode = normalizePerformanceMode(mode);
  try {
    const settingsPath = getSettingsPath();
    const existing = readJsonIfExists(settingsPath, {});
    writeJson(settingsPath, {
      ...(existing || {}),
      performanceMode: currentPerformanceMode
    });
  } catch (_err) {
    // Best effort: renderer event below still applies mode for active session.
  }
  buildAppMenu();
  const target = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (!target || target.isDestroyed()) return;
  target.webContents.send('manager:performance-mode-selected', currentPerformanceMode);
}

function buildAppMenu() {
  const fileMenu = {
    label: 'File',
    submenu: [
      {
        label: 'Performance',
        submenu: [
          {
            label: 'High',
            type: 'radio',
            checked: currentPerformanceMode === 'high',
            click: () => sendPerformanceModeSelection('high')
          },
          {
            label: 'Safe',
            type: 'radio',
            checked: currentPerformanceMode === 'safe',
            click: () => sendPerformanceModeSelection('safe')
          }
        ]
      },
      { type: 'separator' },
      process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
    ]
  };

  const appMenu = {
    label: APP_NAME,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  };

  const template = [
    ...(process.platform === 'darwin' ? [appMenu] : []),
    fileMenu,
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  applyAppIdentity();
  if (process.platform === 'darwin' && fs.existsSync(DEV_APP_ICON_PATH)) {
    app.dock.setIcon(nativeImage.createFromPath(DEV_APP_ICON_PATH));
  }
  buildAppMenu();
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
    civ3Path: '',
    scenarioPath: '',
    mode: 'global',
    performanceMode: 'high',
    uiFontScale: 1,
    uiStateByContext: {},
    c3xVersion: 'R26'
  };
  const saved = readJsonIfExists(getSettingsPath(), defaults);
  const merged = { ...defaults, ...(saved || {}) };
  merged.performanceMode = normalizePerformanceMode(merged.performanceMode);
  if (!merged.c3xVersion) merged.c3xVersion = defaults.c3xVersion;
  const inferred = inferDefaultPaths(merged);
  inferred.performanceMode = normalizePerformanceMode(inferred.performanceMode);
  currentPerformanceMode = inferred.performanceMode;
  buildAppMenu();
  if (JSON.stringify(merged) !== JSON.stringify(inferred)) {
    writeJson(getSettingsPath(), inferred);
  }
  return inferred;
});

ipcMain.handle('manager:set-settings', async (_event, settings) => {
  const normalized = {
    ...(settings || {}),
    performanceMode: normalizePerformanceMode(settings && settings.performanceMode)
  };
  writeJson(getSettingsPath(), normalized);
  if (currentPerformanceMode !== normalized.performanceMode) {
    currentPerformanceMode = normalized.performanceMode;
    buildAppMenu();
  }
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

ipcMain.handle('manager:pick-file', async (_event, options) => {
  const dialogOptions = {
    properties: ['openFile']
  };
  if (options && Array.isArray(options.filters) && options.filters.length > 0) {
    dialogOptions.filters = options.filters;
  }
  if (options && typeof options.defaultPath === 'string' && options.defaultPath.trim()) {
    dialogOptions.defaultPath = options.defaultPath.trim();
  }
  const result = await dialog.showOpenDialog(dialogOptions);
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('manager:open-file-path', async (_event, filePath) => {
  const target = String(filePath || '').trim();
  if (!target) return { ok: false, error: 'No file path provided.' };
  try {
    if (!fs.existsSync(target)) return { ok: false, error: 'File does not exist.' };
    const openErr = await shell.openPath(target);
    if (openErr) return { ok: false, error: openErr };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'Could not open file.' };
  }
});

ipcMain.handle('manager:path-exists', async (_event, dirPath) => {
  return pathExists(dirPath);
});

ipcMain.handle('manager:get-path-access', async (_event, paths) => {
  const out = {};
  const list = Array.isArray(paths) ? paths : [];
  const findNearestExistingParent = (absPath) => {
    let cursor = path.dirname(absPath);
    while (cursor && cursor !== path.dirname(cursor)) {
      if (fs.existsSync(cursor)) return cursor;
      cursor = path.dirname(cursor);
    }
    if (cursor && fs.existsSync(cursor)) return cursor;
    return '';
  };
  list.forEach((raw) => {
    const target = String(raw || '').trim();
    if (!target) return;
    try {
      const resolved = path.resolve(target);
      const exists = fs.existsSync(resolved);
      let writable = false;
      let parentPath = '';
      let parentWritable = false;
      if (exists) {
        try {
          fs.accessSync(resolved, fs.constants.W_OK);
          writable = true;
        } catch (_err) {
          writable = false;
        }
      } else {
        parentPath = findNearestExistingParent(resolved);
        if (parentPath) {
          try {
            fs.accessSync(parentPath, fs.constants.W_OK);
            parentWritable = true;
          } catch (_err) {
            parentWritable = false;
          }
        }
      }
      out[target] = {
        exists,
        writable,
        readOnly: exists && !writable,
        parentPath,
        parentWritable
      };
    } catch (err) {
      out[target] = { exists: false, writable: false, readOnly: false, error: err.message };
    }
  });
  return out;
});

ipcMain.handle('manager:list-scenarios', async (_event, civ3Path) => {
  try {
    return listKnownScenarios(civ3Path);
  } catch (_err) {
    return [];
  }
});

ipcMain.handle('manager:create-scenario', async (_event, payload) => {
  return createScenario(payload || {});
});

ipcMain.handle('manager:relaunch', async () => {
  app.relaunch();
  app.exit(0);
  return { ok: true };
});

ipcMain.handle('manager:load-bundle', async (_event, payload) => {
  return loadBundle(payload || {});
});

ipcMain.handle('manager:save-bundle', async (_event, payload) => {
  return saveBundle(payload || {});
});

ipcMain.handle('manager:preview-save-plan', async (_event, payload) => {
  return previewSavePlan(payload || {});
});

ipcMain.handle('manager:preview-file-diff', async (_event, payload) => {
  return previewFileDiff(payload || {});
});

ipcMain.handle('manager:get-preview', async (_event, payload) => {
  try {
    return getPreview(payload || {});
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
