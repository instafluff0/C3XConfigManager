const fs = require('node:fs');
const path = require('node:path');

const FILE_SPECS = {
  base: {
    defaultName: 'default.c3x_config.ini',
    userName: 'custom.c3x_config.ini',
    scenarioName: 'scenario.c3x_config.ini',
    sectionMarker: null,
    title: 'Base Config'
  },
  districts: {
    defaultName: 'default.districts_config.txt',
    userName: 'user.districts_config.txt',
    scenarioName: 'scenario.districts_config.txt',
    sectionMarker: '#District',
    title: 'Districts'
  },
  wonders: {
    defaultName: 'default.districts_wonders_config.txt',
    userName: 'user.districts_wonders_config.txt',
    scenarioName: 'scenario.districts_wonders_config.txt',
    sectionMarker: '#Wonder',
    title: 'Wonder Districts'
  },
  naturalWonders: {
    defaultName: 'default.districts_natural_wonders_config.txt',
    userName: 'user.districts_natural_wonders_config.txt',
    scenarioName: 'scenario.districts_natural_wonders_config.txt',
    sectionMarker: '#Wonder',
    title: 'Natural Wonders'
  },
  animations: {
    defaultName: 'default.tile_animations.txt',
    userName: 'user.tile_animations.txt',
    scenarioName: 'scenario.tile_animations.txt',
    sectionMarker: '#Animation',
    title: 'Tile Animations'
  }
};

function readTextIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (_err) {
    return null;
  }
}

function ensureTrailingNewline(text) {
  if (!text.endsWith('\n')) {
    return `${text}\n`;
  }
  return text;
}

function parseIniLines(text) {
  const rows = [];
  const map = {};
  if (!text) {
    return { rows, map };
  }

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('[')) {
      continue;
    }
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) {
      continue;
    }
    const key = match[1];
    const value = match[2];
    rows.push({ key, value });
    map[key] = value;
  }

  return { rows, map };
}

function inferBaseType(value) {
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === 'false') {
    return 'boolean';
  }
  if (/^-?\d+$/.test(v)) {
    return 'integer';
  }
  return 'string';
}

function buildBaseModel(defaultText, scenarioText, customText, mode, targetText) {
  const defaultParsed = parseIniLines(defaultText);
  const scenarioParsed = parseIniLines(scenarioText);
  const customParsed = parseIniLines(customText);
  const targetParsed = parseIniLines(targetText);

  const effective = { ...defaultParsed.map };
  if (mode === 'scenario') {
    Object.assign(effective, scenarioParsed.map);
  }
  Object.assign(effective, customParsed.map);

  const orderedKeys = [];
  const keySet = new Set();

  for (const row of defaultParsed.rows) {
    orderedKeys.push(row.key);
    keySet.add(row.key);
  }

  for (const key of Object.keys(effective)) {
    if (!keySet.has(key)) {
      keySet.add(key);
      orderedKeys.push(key);
    }
  }

  const editableMap = Object.keys(targetParsed.map).length > 0 ? targetParsed.map : effective;

  const rows = orderedKeys.map((key) => {
    const defaultValue = defaultParsed.map[key] ?? '';
    const effectiveValue = effective[key] ?? '';
    const editableValue = editableMap[key] ?? effectiveValue;
    return {
      key,
      defaultValue,
      effectiveValue,
      value: editableValue,
      type: inferBaseType(defaultValue || effectiveValue || editableValue)
    };
  });

  return {
    rows,
    defaultMap: defaultParsed.map,
    effectiveMap: effective,
    sourceOrder: mode === 'scenario' ? ['default', 'scenario', 'custom'] : ['default', 'custom']
  };
}

function parseSectionedConfig(text, marker) {
  const result = {
    sections: [],
    headerComments: []
  };

  if (!text) {
    return result;
  }

  const lines = text.split(/\r?\n/);
  let current = null;
  let beforeFirstSection = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith(marker)) {
      if (current) {
        result.sections.push(current);
      }
      current = {
        marker,
        fields: [],
        comments: []
      };
      beforeFirstSection = false;
      continue;
    }

    if (beforeFirstSection) {
      result.headerComments.push(rawLine);
      continue;
    }

    if (!current) {
      continue;
    }

    if (!line) {
      continue;
    }

    if (line.startsWith(';') || line.startsWith('[')) {
      current.comments.push(rawLine);
      continue;
    }

    const match = rawLine.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);
    if (match) {
      current.fields.push({ key: match[1].trim(), value: match[2] });
    }
  }

  if (current) {
    result.sections.push(current);
  }

  return result;
}

function serializeSectionedConfig(model, marker) {
  const lines = [];

  if (model.headerComments && model.headerComments.length > 0) {
    for (const line of model.headerComments) {
      lines.push(line);
    }
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
  }

  for (let i = 0; i < model.sections.length; i += 1) {
    const section = model.sections[i];
    lines.push(marker);
    for (const field of section.fields) {
      if (!field.key) {
        continue;
      }
      lines.push(`${field.key} = ${field.value ?? ''}`);
    }
    if (i !== model.sections.length - 1) {
      lines.push('');
    }
  }

  return ensureTrailingNewline(lines.join('\n'));
}

function serializeBaseConfig(baseRows, defaultMap, mode) {
  const lines = [];
  lines.push('; Managed by C3X Config Manager');
  lines.push(`; Scope: ${mode}`);
  lines.push('');

  for (const row of baseRows) {
    const key = row.key;
    const val = String(row.value ?? '').trim();
    const defaultVal = String(defaultMap[key] ?? '').trim();
    if (val !== defaultVal && val !== '') {
      lines.push(`${key} = ${val}`);
    }
  }

  return ensureTrailingNewline(lines.join('\n'));
}

function resolvePaths({ c3xPath, scenarioPath, mode }) {
  const paths = {};
  for (const [kind, spec] of Object.entries(FILE_SPECS)) {
    const defaultPath = c3xPath ? path.join(c3xPath, spec.defaultName) : null;
    const userPath = c3xPath ? path.join(c3xPath, spec.userName) : null;
    const scenarioFilePath = scenarioPath ? path.join(scenarioPath, spec.scenarioName) : null;

    let effectivePath = defaultPath;
    let effectiveSource = 'default';

    if (kind === 'base') {
      if (mode === 'scenario' && scenarioFilePath && fs.existsSync(scenarioFilePath)) {
        effectivePath = scenarioFilePath;
        effectiveSource = 'scenario+custom';
      }
      if (userPath && fs.existsSync(userPath)) {
        effectivePath = userPath;
        effectiveSource = mode === 'scenario' ? 'scenario+custom' : 'custom';
      }
    } else {
      if (mode === 'scenario' && scenarioFilePath && fs.existsSync(scenarioFilePath)) {
        effectivePath = scenarioFilePath;
        effectiveSource = 'scenario';
      } else if (userPath && fs.existsSync(userPath)) {
        effectivePath = userPath;
        effectiveSource = 'user';
      }
    }

    const targetPath = mode === 'scenario' ? scenarioFilePath : userPath;

    paths[kind] = {
      defaultPath,
      userPath,
      scenarioPath: scenarioFilePath,
      effectivePath,
      effectiveSource,
      targetPath
    };
  }
  return paths;
}

function loadBundle(payload) {
  const mode = payload.mode === 'scenario' ? 'scenario' : 'global';
  const c3xPath = payload.c3xPath || '';
  const scenarioPath = payload.scenarioPath || '';

  const filePaths = resolvePaths({ c3xPath, scenarioPath, mode });
  const bundle = {
    mode,
    c3xPath,
    scenarioPath,
    tabs: {}
  };

  const defaultBaseText = readTextIfExists(filePaths.base.defaultPath) || '';
  const scenarioBaseText = readTextIfExists(filePaths.base.scenarioPath) || '';
  const customBaseText = readTextIfExists(filePaths.base.userPath) || '';
  const targetBaseText = readTextIfExists(filePaths.base.targetPath) || '';

  bundle.tabs.base = {
    title: FILE_SPECS.base.title,
    effectiveSource: filePaths.base.effectiveSource,
    targetPath: filePaths.base.targetPath,
    ...buildBaseModel(defaultBaseText, scenarioBaseText, customBaseText, mode, targetBaseText)
  };

  for (const kind of ['districts', 'wonders', 'naturalWonders', 'animations']) {
    const spec = FILE_SPECS[kind];
    const targetText = readTextIfExists(filePaths[kind].targetPath);
    const fallbackText = readTextIfExists(filePaths[kind].effectivePath) || '';
    const text = targetText ?? fallbackText;

    bundle.tabs[kind] = {
      title: spec.title,
      effectiveSource: filePaths[kind].effectiveSource,
      targetPath: filePaths[kind].targetPath,
      marker: spec.sectionMarker,
      model: parseSectionedConfig(text, spec.sectionMarker)
    };
  }

  return bundle;
}

function saveBundle(payload) {
  const mode = payload.mode === 'scenario' ? 'scenario' : 'global';
  const c3xPath = payload.c3xPath || '';
  const scenarioPath = payload.scenarioPath || '';

  const filePaths = resolvePaths({ c3xPath, scenarioPath, mode });

  const saveReport = [];

  const baseTab = payload.tabs.base;
  if (baseTab && filePaths.base.targetPath) {
    fs.mkdirSync(path.dirname(filePaths.base.targetPath), { recursive: true });
    const serialized = serializeBaseConfig(baseTab.rows, baseTab.defaultMap || {}, mode);
    fs.writeFileSync(filePaths.base.targetPath, serialized, 'utf8');
    saveReport.push({ kind: 'base', path: filePaths.base.targetPath });
  }

  for (const kind of ['districts', 'wonders', 'naturalWonders', 'animations']) {
    const tab = payload.tabs[kind];
    const spec = FILE_SPECS[kind];
    const targetPath = filePaths[kind].targetPath;
    if (!tab || !targetPath) {
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const serialized = serializeSectionedConfig(tab.model, spec.sectionMarker);
    fs.writeFileSync(targetPath, serialized, 'utf8');
    saveReport.push({ kind, path: targetPath });
  }

  return { ok: true, saveReport };
}

module.exports = {
  FILE_SPECS,
  parseIniLines,
  buildBaseModel,
  parseSectionedConfig,
  serializeSectionedConfig,
  serializeBaseConfig,
  resolvePaths,
  loadBundle,
  saveBundle
};
