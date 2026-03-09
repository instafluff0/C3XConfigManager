const fs = require('node:fs');
const path = require('node:path');

const FILE_SPECS = {
  base: {
    defaultName: 'default.c3x_config.ini',
    userName: 'custom.c3x_config.ini',
    scenarioName: 'scenario.c3x_config.ini',
    sectionMarker: null,
    title: 'C3X'
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

const REFERENCE_TAB_SPECS = [
  { key: 'civilizations', title: 'Civs', prefix: 'RACE_' },
  { key: 'technologies', title: 'Techs', prefix: 'TECH_' },
  { key: 'resources', title: 'Resources', prefix: 'GOOD_' },
  { key: 'improvements', title: 'Improvements', prefix: 'BLDG_' },
  { key: 'governments', title: 'Governments', prefix: 'GOVT_' },
  { key: 'units', title: 'Units', prefix: 'PRTO_' }
];

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

function normalizeRelativePath(raw) {
  return String(raw || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\.?[\\/]+/, '')
    .replace(/\\/g, '/');
}

function resolveCiv3RootPath(civ3Path) {
  if (!civ3Path) return '';
  const base = path.basename(civ3Path).toLowerCase();
  if (base === 'conquests' || base === 'civ3ptw') {
    return path.dirname(civ3Path);
  }
  return civ3Path;
}

function getTextLayerFiles(civ3Path, name) {
  const root = resolveCiv3RootPath(civ3Path);
  if (!root) {
    return [];
  }
  return [
    { layer: 'vanilla', filePath: path.join(root, 'Text', name) },
    { layer: 'ptw', filePath: path.join(root, 'civ3PTW', 'Text', name) },
    { layer: 'conquests', filePath: path.join(root, 'Conquests', 'Text', name) }
  ];
}

function readTextLayers(civ3Path, name) {
  const layers = {};
  for (const ref of getTextLayerFiles(civ3Path, name)) {
    layers[ref.layer] = {
      filePath: ref.filePath,
      text: readTextIfExists(ref.filePath)
    };
  }
  return layers;
}

function parseCivilopediaSections(text) {
  const sections = {};
  if (!text) return sections;

  const lines = text.split(/\r?\n/);
  let currentKey = null;
  let currentLines = [];
  const flush = () => {
    if (!currentKey) return;
    sections[currentKey] = {
      key: currentKey,
      rawLines: [...currentLines]
    };
  };

  for (const line of lines) {
    if (line.startsWith('#')) {
      flush();
      currentKey = line.slice(1).trim();
      currentLines = [];
      continue;
    }
    if (currentKey) {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

function parsePediaIconsBlocks(text) {
  const blocks = {};
  if (!text) return blocks;
  const lines = text.split(/\r?\n/);
  let currentKey = null;
  let currentLines = [];
  const flush = () => {
    if (!currentKey) return;
    blocks[currentKey] = [...currentLines];
  };

  for (const line of lines) {
    if (line.startsWith('#')) {
      flush();
      currentKey = line.slice(1).trim();
      currentLines = [];
      continue;
    }
    if (!currentKey) continue;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    currentLines.push(trimmed);
  }
  flush();
  return blocks;
}

function toCanonicalKeyMap(rawMap) {
  const out = {};
  for (const [key, value] of Object.entries(rawMap || {})) {
    out[String(key || '').toUpperCase()] = {
      rawKey: key,
      value
    };
  }
  return out;
}

function mergeByPrecedence(mapsByLayer) {
  const merged = {};
  for (const layer of ['vanilla', 'ptw', 'conquests']) {
    const src = mapsByLayer[layer] || {};
    for (const [key, value] of Object.entries(src)) {
      merged[key] = value;
    }
  }
  return merged;
}

function inferDisplayNameFromKey(shortKey) {
  const acronyms = new Set(['AEGIS']);
  return String(shortKey || '')
    .split('_')
    .filter(Boolean)
    .map((word) => {
      if (acronyms.has(word)) return word;
      if (/^[IVX]+$/.test(word)) return word;
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .trim();
}

function parseBodyFromCivilopediaSection(civilopediaSection) {
  const lines = (civilopediaSection && civilopediaSection.rawLines) || [];
  const bodyLines = [];
  for (const line of lines) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    const cleaned = trimmed.replace(/\^/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    bodyLines.push(cleaned);
  }
  return bodyLines;
}

function dedupeStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function extractTechDependenciesFromText(bodyLines) {
  const deps = [];
  for (const line of bodyLines || []) {
    const linkMatches = line.match(/=TECH_[A-Za-z0-9_]+/g) || [];
    for (const token of linkMatches) {
      deps.push(token.slice(1).replace(/^TECH_/, '').replace(/_/g, ' '));
    }
    const tokenMatches = line.match(/\bTECH_[A-Za-z0-9_]+\b/g) || [];
    for (const token of tokenMatches) {
      deps.push(token.replace(/^TECH_/, '').replace(/_/g, ' '));
    }

    const requires = line.match(/\brequires?\b\s*[:\-]?\s*(.+)$/i);
    if (!requires) continue;
    const rhs = requires[1].split(/[.;]/)[0];
    rhs.split(/,|\/|\band\b/i).forEach((piece) => {
      const cleaned = piece.replace(/[\[\]()]/g, '').trim();
      if (cleaned.length > 1) deps.push(cleaned);
    });
  }
  return dedupeStrings(deps);
}

function mergeSimplePrecedence(vanillaMap, ptwMap, conquestsMap) {
  return {
    ...(vanillaMap || {}),
    ...(ptwMap || {}),
    ...(conquestsMap || {})
  };
}

function parseImprovementKindsFromCivilopediaText(text) {
  const kinds = {};
  if (!text) return kinds;

  const lines = text.split(/\r?\n/);
  let scope = 'normal';
  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();
    if (!line) continue;

    if (line.startsWith(';')) {
      const upper = line.toUpperCase();
      if (upper.includes('SMALL WONDERS')) {
        scope = 'small_wonder';
      } else if (upper.includes('GREAT WONDERS')) {
        scope = 'wonder';
      } else if (upper.includes('CITY IMPROVEMENTS') || upper.includes('END SMALL WONDERS') || upper.includes('END GREAT WONDERS')) {
        scope = 'normal';
      }
      continue;
    }

    if (!line.startsWith('#BLDG_')) continue;
    const key = line.slice(1).trim().toUpperCase();
    if (!key) continue;
    kinds[key] = scope;
  }
  return kinds;
}

function parseImprovementKindsFromPediaIconsBlocks(blocks) {
  const kinds = {};
  for (const key of Object.keys(blocks || {})) {
    const upper = String(key || '').toUpperCase();
    if (!upper.startsWith('WON_SPLASH_BLDG_')) continue;
    const bldg = `BLDG_${upper.slice('WON_SPLASH_BLDG_'.length)}`;
    kinds[bldg] = 'wonder';
  }
  return kinds;
}

function mapPediaIconsForKey(pediaBlocks, civilopediaKey) {
  const collectIconLines = (upperKey) => {
    const iconKey = `ICON_${upperKey}`;
    const iconBlock = (pediaBlocks[iconKey] && pediaBlocks[iconKey].value) || [];
    const techSmallBlock = (pediaBlocks[upperKey] && pediaBlocks[upperKey].value) || [];
    const techLargeBlock = (pediaBlocks[`${upperKey}_LARGE`] && pediaBlocks[`${upperKey}_LARGE`].value) || [];
    return [...iconBlock, ...techLargeBlock, ...techSmallBlock]
      .filter((line) => /[\\/]/.test(line) || /\.(pcx|flc|ini)$/i.test(line));
  };

  const upperKey = civilopediaKey.toUpperCase();
  const usableLines = collectIconLines(upperKey);
  const raceIconKey = `ICON_RACE_${upperKey.replace(/^RACE_/, '')}`;
  const raceIconBlock = (pediaBlocks[raceIconKey] && pediaBlocks[raceIconKey].value) || [];
  const raceUsable = raceIconBlock.filter((line) => /[\\/]/.test(line) || /\.(pcx|flc|ini)$/i.test(line));

  const govFallback = [];
  if (upperKey.startsWith('GOVT_') && usableLines.length === 0) {
    const short = upperKey.slice('GOVT_'.length);
    govFallback.push(...collectIconLines(`TECH_${short}`));
    if (govFallback.length === 0) {
      const techCandidates = Object.keys(pediaBlocks)
        .filter((key) => key.startsWith('TECH_') && !key.endsWith('_LARGE') && !key.startsWith('ICON_'));
      const bySuffix = techCandidates.find((key) => key.endsWith(`_${short}`));
      const byToken = bySuffix || techCandidates.find((key) => key.split('_').includes(short));
      if (byToken) {
        govFallback.push(...collectIconLines(byToken));
      }
    }
  }

  const rawPaths = [...usableLines, ...govFallback, ...raceUsable].map((line) => normalizeRelativePath(line));
  const iconPaths = dedupeStrings(rawPaths.filter(Boolean));

  const animKey = `ANIMNAME_${civilopediaKey.toUpperCase()}`;
  const animBlock = (pediaBlocks[animKey] && pediaBlocks[animKey].value) || [];
  const animName = animBlock.length > 0 ? String(animBlock[0]).trim() : '';

  const raceBlock = (pediaBlocks[civilopediaKey.toUpperCase()] && pediaBlocks[civilopediaKey.toUpperCase()].value) || [];
  const racePaths = raceBlock.map((line) => normalizeRelativePath(line)).filter(Boolean);

  return {
    iconPaths,
    animationName: animName,
    racePaths: dedupeStrings(racePaths)
  };
}

function buildReferenceTabs(civ3Path) {
  const civilopediaLayers = readTextLayers(civ3Path, 'Civilopedia.txt');
  const pediaIconLayers = readTextLayers(civ3Path, 'PediaIcons.txt');
  const improvementKindsByKey = mergeSimplePrecedence(
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.vanilla && pediaIconLayers.vanilla.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.vanilla && civilopediaLayers.vanilla.text) || ''),
      {}
    ),
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.ptw && pediaIconLayers.ptw.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.ptw && civilopediaLayers.ptw.text) || ''),
      {}
    ),
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.conquests && pediaIconLayers.conquests.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.conquests && civilopediaLayers.conquests.text) || ''),
      {}
    )
  );
  const civilopediaSections = mergeByPrecedence({
    vanilla: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.vanilla && civilopediaLayers.vanilla.text) || '')),
    ptw: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.ptw && civilopediaLayers.ptw.text) || '')),
    conquests: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.conquests && civilopediaLayers.conquests.text) || ''))
  });
  const pediaBlocks = mergeByPrecedence({
    vanilla: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.vanilla && pediaIconLayers.vanilla.text) || '')),
    ptw: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.ptw && pediaIconLayers.ptw.text) || '')),
    conquests: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.conquests && pediaIconLayers.conquests.text) || ''))
  });

  const tabs = {};
  for (const tabSpec of REFERENCE_TAB_SPECS) {
    const entriesByKey = new Map();
    const prefix = tabSpec.prefix;

    const canonicalPrefix = prefix.toUpperCase();
    Object.keys(civilopediaSections)
      .filter((key) => key.startsWith(canonicalPrefix))
      .forEach((civilopediaKey) => entriesByKey.set(civilopediaKey, { civilopediaKey }));

    Object.keys(pediaBlocks)
      .filter((key) => key.startsWith(`ICON_${canonicalPrefix}`) || key.startsWith(`ANIMNAME_${canonicalPrefix}`) || key.startsWith(`ICON_RACE_`) || (canonicalPrefix === 'RACE_' && key.startsWith(canonicalPrefix)))
      .forEach((key) => {
        let civilopediaKey = key.startsWith('ICON_') ? key.slice(5) : key.startsWith('ANIMNAME_') ? key.slice(9) : key;
        if (canonicalPrefix === 'RACE_' && key.startsWith('ICON_RACE_')) {
          civilopediaKey = `RACE_${key.slice('ICON_RACE_'.length)}`;
        }
        if (civilopediaKey.startsWith(canonicalPrefix)) {
          entriesByKey.set(civilopediaKey, { civilopediaKey });
        }
      });

    const entries = Array.from(entriesByKey.values())
      .map((entry) => {
        const civilopediaSection = (civilopediaSections[entry.civilopediaKey] && civilopediaSections[entry.civilopediaKey].value) || null;
        const descSection = (civilopediaSections[`DESC_${entry.civilopediaKey}`] && civilopediaSections[`DESC_${entry.civilopediaKey}`].value) || null;
        const pedia = mapPediaIconsForKey(pediaBlocks, entry.civilopediaKey);
        const overviewLines = parseBodyFromCivilopediaSection(civilopediaSection);
        const descLines = parseBodyFromCivilopediaSection(descSection);
        const shortKey = entry.civilopediaKey.slice(prefix.length);
        const descriptionLines = descLines.length > 0 ? descLines : overviewLines;
        const thumbPath =
          tabSpec.key === 'civilizations'
            ? (pedia.racePaths[0] || pedia.iconPaths[pedia.iconPaths.length - 1] || '')
            : (pedia.iconPaths[pedia.iconPaths.length - 1] || pedia.iconPaths[0] || '');

        return {
          id: shortKey,
          civilopediaKey: entry.civilopediaKey,
          name: inferDisplayNameFromKey(shortKey),
          overview: overviewLines.join('\n'),
          description: descriptionLines.join('\n'),
          techDependencies: tabSpec.key === 'technologies' ? [] : extractTechDependenciesFromText(overviewLines),
          improvementKind: tabSpec.key === 'improvements' ? (improvementKindsByKey[entry.civilopediaKey] || 'normal') : null,
          iconPaths: pedia.iconPaths,
          racePaths: pedia.racePaths,
          thumbPath,
          animationName: pedia.animationName
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

    if (tabSpec.key === 'civilizations') {
      const fallbackThumb = (entries.find((e) => e.thumbPath) || {}).thumbPath || '';
      if (fallbackThumb) {
        entries.forEach((entry) => {
          if (!entry.thumbPath) {
            entry.thumbPath = fallbackThumb;
          }
        });
      }
    }

    tabs[tabSpec.key] = {
      title: tabSpec.title,
      type: 'reference',
      readOnly: true,
      sourcePath: (civilopediaLayers.conquests && civilopediaLayers.conquests.filePath) || '',
      sourceDetails: {
        civilopediaVanilla: (civilopediaLayers.vanilla && civilopediaLayers.vanilla.filePath) || '',
        civilopediaPtw: (civilopediaLayers.ptw && civilopediaLayers.ptw.filePath) || '',
        civilopediaConquests: (civilopediaLayers.conquests && civilopediaLayers.conquests.filePath) || '',
        pediaIconsVanilla: (pediaIconLayers.vanilla && pediaIconLayers.vanilla.filePath) || '',
        pediaIconsPtw: (pediaIconLayers.ptw && pediaIconLayers.ptw.filePath) || '',
        pediaIconsConquests: (pediaIconLayers.conquests && pediaIconLayers.conquests.filePath) || ''
      },
      entries
    };
  }

  return tabs;
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

function normalizeIniSectionName(raw) {
  const cleaned = raw.replace(/^\[+|\]+$/g, '').replace(/=/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  if (cleaned.length > 56) return null;
  if (!/[A-Za-z]/.test(cleaned)) return null;
  if (/^NOTE$/i.test(cleaned)) return null;
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

function parseIniSectionMap(text) {
  const sectionByKey = {};
  const sectionOrder = [];
  const seen = new Set();
  if (!text) {
    return { sectionByKey, sectionOrder };
  }

  const lines = text.split(/\r?\n/);
  let currentSection = 'General';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const section = normalizeIniSectionName(trimmed);
      if (section) {
        currentSection = section;
      }
      continue;
    }

    const keyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (keyMatch) {
      const key = keyMatch[1];
      sectionByKey[key] = currentSection;
      if (!seen.has(currentSection)) {
        seen.add(currentSection);
        sectionOrder.push(currentSection);
      }
    }
  }

  return { sectionByKey, sectionOrder };
}

function normalizeDocLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function parseIniFieldDocs(text) {
  const docs = {};
  if (!text) {
    return docs;
  }

  const lines = text.split(/\r?\n/);
  let commentBuffer = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(';')) {
      const body = normalizeDocLine(trimmed.replace(/^;\s?/, ''));
      if (body) {
        commentBuffer.push(body);
      }
      continue;
    }

    const keyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (commentBuffer.length > 0 && !docs[key]) {
        docs[key] = commentBuffer.join(' ');
      }
    }

    if (!trimmed || trimmed.startsWith('[') || keyMatch) {
      commentBuffer = [];
    }
  }
  return docs;
}

function parseSectionFieldDocs(text) {
  const docs = {};
  if (!text) {
    return docs;
  }

  const lines = text.split(/\r?\n/);
  let activeKey = null;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith(';')) {
      activeKey = null;
      continue;
    }
    const body = normalizeDocLine(trimmed.replace(/^;\s?/, ''));
    if (!body) {
      activeKey = null;
      continue;
    }

    const start = body.match(/^-+\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (start) {
      const key = start[1];
      const desc = start[2].trim();
      docs[key] = desc;
      activeKey = key;
      continue;
    }

    if (activeKey && !/^-+\s*[A-Za-z0-9_]+\s*:/.test(body)) {
      docs[activeKey] = `${docs[activeKey]} ${body}`.trim();
    }
  }

  return docs;
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
  lines.push('; Managed by Civ 3 | C3X Modern Configuration Manager');
  lines.push(`; Mode: ${mode}`);
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
  const civ3Path = payload.civ3Path || '';
  const scenarioPath = payload.scenarioPath || '';

  const filePaths = resolvePaths({ c3xPath, scenarioPath, mode });
  const bundle = {
    mode,
    c3xPath,
    civ3Path,
    scenarioPath,
    tabs: {}
  };

  if (mode === 'global') {
    const referenceTabs = buildReferenceTabs(civ3Path);
    for (const spec of REFERENCE_TAB_SPECS) {
      if (referenceTabs[spec.key]) {
        bundle.tabs[spec.key] = referenceTabs[spec.key];
      }
    }
  }

  const defaultBaseText = readTextIfExists(filePaths.base.defaultPath) || '';
  const scenarioBaseText = readTextIfExists(filePaths.base.scenarioPath) || '';
  const customBaseText = readTextIfExists(filePaths.base.userPath) || '';
  const targetBaseText = readTextIfExists(filePaths.base.targetPath) || '';

  bundle.tabs.base = {
    title: FILE_SPECS.base.title,
    effectiveSource: filePaths.base.effectiveSource,
    targetPath: filePaths.base.targetPath,
    fieldDocs: parseIniFieldDocs(defaultBaseText),
    ...parseIniSectionMap(defaultBaseText),
    ...buildBaseModel(defaultBaseText, scenarioBaseText, customBaseText, mode, targetBaseText)
  };

  for (const kind of ['districts', 'wonders', 'naturalWonders', 'animations']) {
    const spec = FILE_SPECS[kind];
    const defaultText = readTextIfExists(filePaths[kind].defaultPath) || '';
    const targetText = readTextIfExists(filePaths[kind].targetPath);
    const fallbackText = readTextIfExists(filePaths[kind].effectivePath) || '';
    const text = targetText ?? fallbackText;

    bundle.tabs[kind] = {
      title: spec.title,
      effectiveSource: filePaths[kind].effectiveSource,
      targetPath: filePaths[kind].targetPath,
      marker: spec.sectionMarker,
      fieldDocs: parseSectionFieldDocs(defaultText),
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
  parseIniFieldDocs,
  parseIniSectionMap,
  parseSectionFieldDocs,
  buildReferenceTabs,
  resolvePaths,
  loadBundle,
  saveBundle
};
