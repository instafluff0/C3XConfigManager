const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { loadBundle, saveBundle } = require('./src/configCore');
const { getPreview } = require('./src/artPreview');

const APP_SETTINGS_FILE = 'settings.json';
const JAVA_BIN_RELATIVE_PATHS = process.platform === 'win32'
  ? [path.join('bin', 'javaw.exe'), path.join('bin', 'java.exe')]
  : [path.join('bin', 'java')];

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

function resolveBundledJavaPath() {
  const candidates = [];

  // Packaged app: resources/vendor/jre/<platform>/bin/java
  if (process.resourcesPath) {
    const base = path.join(process.resourcesPath, 'vendor', 'jre', process.platform);
    JAVA_BIN_RELATIVE_PATHS.forEach((rel) => candidates.push(path.join(base, rel)));
  }

  // Development paths under repo vendor/jre/<platform>/bin/java
  const devBaseCandidates = [
    path.join(__dirname, 'vendor', 'jre', process.platform),
    path.join(path.dirname(__dirname), 'vendor', 'jre', process.platform),
    path.join(process.cwd(), 'vendor', 'jre', process.platform)
  ];
  devBaseCandidates.forEach((base) => {
    JAVA_BIN_RELATIVE_PATHS.forEach((rel) => candidates.push(path.join(base, rel)));
  });

  return findFirstExisting(candidates);
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
    title: 'Civ 3 | C3X Modern Configuration Manager',
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
    civ3Path: '',
    scenarioPath: '',
    mode: 'global',
    uiFontScale: 1,
    uiStateByContext: {}
  };
  const saved = readJsonIfExists(getSettingsPath(), defaults);
  const merged = { ...defaults, ...(saved || {}) };
  const inferred = inferDefaultPaths(merged);
  if (JSON.stringify(merged) !== JSON.stringify(inferred)) {
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

ipcMain.handle('manager:path-exists', async (_event, dirPath) => {
  return pathExists(dirPath);
});

ipcMain.handle('manager:list-scenarios', async (_event, civ3Path) => {
  try {
    return listKnownScenarios(civ3Path);
  } catch (_err) {
    return [];
  }
});

ipcMain.handle('manager:load-bundle', async (_event, payload) => {
  return loadBundle({
    ...(payload || {}),
    javaPath: resolveBundledJavaPath()
  });
});

ipcMain.handle('manager:save-bundle', async (_event, payload) => {
  return saveBundle({
    ...(payload || {}),
    javaPath: resolveBundledJavaPath()
  });
});

ipcMain.handle('manager:get-preview', async (_event, payload) => {
  try {
    return getPreview(payload || {});
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
