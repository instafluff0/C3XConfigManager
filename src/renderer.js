const state = {
  settings: null,
  bundle: null,
  activeTab: 'base',
  baseFilter: '',
  previewSize: 220,
  tabContentScrollTop: 0,
  isDirty: false,
  isRendering: false,
  trackDirty: false,
  suppressDirtyUntilInteraction: true,
  cleanSnapshot: '',
  undoSnapshot: null,
  sectionListScrollTop: {
    districts: 0,
    wonders: 0,
    naturalWonders: 0,
    animations: 0
  },
  sectionDetailScrollTop: {
    districts: 0,
    wonders: 0,
    naturalWonders: 0,
    animations: 0
  },
  sectionSelection: {
    districts: 0,
    wonders: 0,
    naturalWonders: 0,
    animations: 0
  },
  referenceListScrollTop: {},
  referenceDetailScrollTop: {},
  referenceSelection: {},
  referenceFilter: {},
  referenceImprovementKind: {},
  referenceSearchCaret: {},
  referenceSearchFocusedTab: null,
  referenceNotice: null,
  previewCache: new Map()
};

const el = {
  modeGlobal: document.getElementById('mode-global'),
  modeScenario: document.getElementById('mode-scenario'),
  c3xPath: document.getElementById('c3x-path'),
  civ3Path: document.getElementById('civ3-path'),
  scenarioPath: document.getElementById('scenario-path'),
  scenarioPathRow: document.getElementById('scenario-path-row'),
  pickC3x: document.getElementById('pick-c3x'),
  pickCiv3: document.getElementById('pick-civ3'),
  pickScenario: document.getElementById('pick-scenario'),
  loadBtn: document.getElementById('load-btn'),
  saveBtn: document.getElementById('save-btn'),
  undoBtn: document.getElementById('undo-btn'),
  resetBtn: document.getElementById('reset-btn'),
  dirtyIndicator: document.getElementById('dirty-indicator'),
  status: document.getElementById('status'),
  debugLog: document.getElementById('debug-log'),
  copyDebugLog: document.getElementById('copy-debug-log'),
  clearDebugLog: document.getElementById('clear-debug-log'),
  debugToggle: document.getElementById('debug-toggle'),
  debugDrawer: document.getElementById('debug-drawer'),
  debugClose: document.getElementById('debug-close'),
  workspace: document.getElementById('workspace'),
  tabs: document.getElementById('tabs'),
  tabContent: document.getElementById('tab-content')
};

const DIRECTION_OPTIONS = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north'];
const TERRAIN_OPTIONS = ['desert', 'plains', 'grassland', 'jungle', 'tundra', 'floodplain', 'swamp', 'hill', 'mountain', 'forest', 'volcano', 'snow-forest', 'snow-mountain', 'snow-volcano', 'coast', 'sea', 'ocean'];
const TAB_ICONS = {
  units: 'icon-unit',
  technologies: 'icon-tech',
  civilizations: 'icon-civ',
  resources: 'icon-resource',
  improvements: 'icon-improv',
  governments: 'icon-gov',
  base: 'icon-c3x',
  districts: 'icon-district',
  wonders: 'icon-wonder',
  naturalWonders: 'icon-natural',
  animations: 'icon-anim'
};
const TAB_GROUPS = [
  { label: 'CIV 3', keys: ['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units'] },
  { label: 'C3X', keys: ['base', 'districts', 'wonders', 'naturalWonders', 'animations'] }
];

const BASE_ENUM_OPTIONS = {
  draw_lines_using_gdi_plus: ['never', 'wine', 'always'],
  double_minimap_size: ['never', 'always', 'high-def'],
  unit_cycle_search_criteria: ['standard', 'similar-near-start', 'similar-near-destination'],
  day_night_cycle_mode: ['off', 'timer', 'user-time', 'every-turn', 'specified'],
  seasonal_cycle_mode: ['off', 'timer', 'user-season', 'every-turn', 'on-day-night-hour', 'specified']
};

const BASE_STRUCTURED_LIST_FIELDS = new Set([
  'limit_units_per_tile',
  'production_perfume',
  'perfume_specs',
  'technology_perfume',
  'government_perfume',
  'building_prereqs_for_units',
  'buildings_generating_resources',
  'ai_multi_start_extra_palaces'
]);

const BASE_FIELD_DETAILS = {
  enable_districts: 'Master toggle for district systems.',
  enable_wonder_districts: 'Enables the wonder district layer.',
  enable_natural_wonders: 'Enables natural wonder systems and placement.',
  enable_custom_animations: 'Enables tile animation configs.',
  minimum_natural_wonder_separation: 'Minimum tile distance between natural wonders.',
  draw_lines_using_gdi_plus: 'Line rendering strategy.'
};
const EDITABLE_TAB_KEYS = ['base', 'districts', 'wonders', 'naturalWonders', 'animations'];

const SECTION_SCHEMAS = {
  districts: {
    marker: '#District',
    entityName: 'District',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'District Name', desc: 'Internal unique district name.', type: 'text', required: true },
      { key: 'display_name', label: 'Display Name', desc: 'Name shown in UI.', type: 'text' },
      { key: 'tooltip', label: 'Tooltip Text', desc: 'Shown on worker command hover.', type: 'text' },
      { key: 'img_paths', label: 'Image Paths', desc: 'List of district PCX files.', type: 'list' },
      { key: 'btn_tile_sheet_row', label: 'Button Tile Row', desc: 'Row index in district button sheet.', type: 'number' },
      { key: 'btn_tile_sheet_column', label: 'Button Tile Column', desc: 'Column index in district button sheet.', type: 'number' },
      { key: 'advance_prereqs', label: 'Tech Prerequisites', desc: 'List of required advances.', type: 'list' },
      { key: 'dependent_improvs', label: 'Dependent Improvements', desc: 'List of city improvements this district unlocks.', type: 'list' },
      { key: 'buildable_on', label: 'Buildable Terrain', desc: 'Allowed terrain list.', type: 'list', options: [...TERRAIN_OPTIONS, 'lake'] },
      { key: 'buildable_adjacent_to', label: 'Adjacency Requirement', desc: 'Required adjacent terrain/city list.', type: 'list', options: [...TERRAIN_OPTIONS, 'lake', 'city'] },
      { key: 'buildable_on_overlays', label: 'Buildable Overlays', desc: 'Allowed overlays list.', type: 'list', options: ['irrigation', 'mine', 'fortress', 'barricade', 'outpost', 'radar-tower', 'airfield', 'jungle', 'forest', 'swamp'] },
      { key: 'buildable_without_removal', label: 'Buildable Without Removal', desc: 'Overlays that do not require clearing.', type: 'list', options: ['jungle', 'forest', 'swamp'] },
      { key: 'buildable_adjacent_to_overlays', label: 'Adjacent Overlays', desc: 'Required adjacent overlays.', type: 'list', options: ['irrigation', 'mine', 'fortress', 'barricade', 'outpost', 'radar-tower', 'airfield', 'jungle', 'forest', 'swamp', 'river'] },
      { key: 'buildable_on_districts', label: 'Buildable On Districts', desc: 'District names that can be replaced.', type: 'list' },
      { key: 'buildable_adjacent_to_districts', label: 'Adjacent Districts', desc: 'District names required adjacent.', type: 'list' },
      { key: 'buildable_by_civs', label: 'Allowed Civs', desc: 'Civ names that may build this district.', type: 'list' },
      { key: 'buildable_by_civ_traits', label: 'Allowed Traits', desc: 'Trait names that may build this district.', type: 'list' },
      { key: 'buildable_by_civ_govs', label: 'Allowed Governments', desc: 'Government names that may build this district.', type: 'list' },
      { key: 'buildable_by_civ_cultures', label: 'Allowed Cultures', desc: 'Culture names that may build this district.', type: 'list' },
      { key: 'resource_prereqs', label: 'Resource Prerequisites', desc: 'Resource names required nearby.', type: 'list' },
      { key: 'wonder_prereqs', label: 'Wonder Prerequisites', desc: 'Wonder names required by civ.', type: 'list' },
      { key: 'natural_wonder_prereqs', label: 'Natural Wonder Prerequisites', desc: 'Natural wonder names required in territory.', type: 'list' },
      { key: 'allow_multiple', label: 'Allow Multiple', desc: 'Allow multiple copies per city.', type: 'bool' },
      { key: 'vary_img_by_era', label: 'Vary Art By Era', desc: 'Use era-specific rows in art.', type: 'bool' },
      { key: 'vary_img_by_culture', label: 'Vary Art By Culture', desc: 'Use culture-variant image set.', type: 'bool' },
      { key: 'draw_over_resources', label: 'Draw Over Resources', desc: 'Draw district art above map resources.', type: 'bool' },
      { key: 'defense_bonus_percent', label: 'Defense Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'culture_bonus', label: 'Culture Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'science_bonus', label: 'Science Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'food_bonus', label: 'Food Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'gold_bonus', label: 'Gold Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'shield_bonus', label: 'Shield Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'happiness_bonus', label: 'Happiness Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' }
    ],
    template: {
      name: 'New District',
      tooltip: 'Build New District',
      buildable_on: 'desert,plains,grassland,tundra,floodplain,hill',
      allow_multiple: '1'
    }
  },
  wonders: {
    marker: '#Wonder',
    entityName: 'Wonder District',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Wonder Name', desc: 'Must match the in-game wonder improvement name.', type: 'text', required: true },
      { key: 'buildable_on', label: 'Buildable Terrain', desc: 'Allowed terrain list.', type: 'list', options: [...TERRAIN_OPTIONS, 'lake'] },
      { key: 'buildable_adjacent_to', label: 'Adjacency Requirement', desc: 'Adjacent terrain/city list.', type: 'list', options: [...TERRAIN_OPTIONS, 'lake', 'city'] },
      { key: 'buildable_adjacent_to_overlays', label: 'Adjacent Overlays', desc: 'Required adjacent overlays.', type: 'list', options: ['irrigation', 'mine', 'fortress', 'barricade', 'outpost', 'radar-tower', 'airfield', 'jungle', 'forest', 'swamp', 'river'] },
      { key: 'buildable_by_civs', label: 'Allowed Civs', desc: 'Civ names that may build this wonder district.', type: 'list' },
      { key: 'buildable_by_civ_traits', label: 'Allowed Traits', desc: 'Trait names that may build this wonder district.', type: 'list' },
      { key: 'buildable_by_civ_govs', label: 'Allowed Governments', desc: 'Government names that may build this wonder district.', type: 'list' },
      { key: 'buildable_by_civ_cultures', label: 'Allowed Cultures', desc: 'Culture names that may build this wonder district.', type: 'list' },
      { key: 'buildable_only_on_rivers', label: 'River Required', desc: 'Require wonder tile to be on a river.', type: 'bool' },
      { key: 'img_path', label: 'Image Path', desc: 'District wonder art PCX file.', type: 'text' },
      { key: 'img_construct_row', label: 'Construct Row', desc: 'Construction art row index.', type: 'number', required: true },
      { key: 'img_construct_column', label: 'Construct Column', desc: 'Construction art column index.', type: 'number', required: true },
      { key: 'img_row', label: 'Completed Row', desc: 'Completed wonder art row index.', type: 'number', required: true },
      { key: 'img_column', label: 'Completed Column', desc: 'Completed wonder art column index.', type: 'number', required: true },
      { key: 'enable_img_alt_dir', label: 'Enable Alt Direction Art', desc: 'Use alternate directional art set.', type: 'bool' }
    ],
    template: {
      name: 'New Wonder',
      img_path: 'Wonders.pcx',
      img_construct_row: '0',
      img_construct_column: '0',
      img_row: '0',
      img_column: '1'
    }
  },
  naturalWonders: {
    marker: '#Wonder',
    entityName: 'Natural Wonder',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Wonder Name', desc: 'Unique natural wonder identifier.', type: 'text', required: true },
      { key: 'terrain_type', label: 'Terrain Type', desc: 'Primary terrain for this wonder.', type: 'select', options: TERRAIN_OPTIONS, required: true },
      { key: 'adjacent_to', label: 'Adjacent To', desc: 'Optional adjacency terrain or river.', type: 'select', options: ['any', 'river', ...TERRAIN_OPTIONS] },
      { key: 'adjacency_dir', label: 'Adjacency Direction', desc: 'Optional direction for adjacency check.', type: 'select', options: DIRECTION_OPTIONS },
      { key: 'img_path', label: 'Image Path', desc: 'Natural wonder PCX filename.', type: 'text', required: true },
      { key: 'img_row', label: 'Image Row', desc: 'Sprite row index in PCX.', type: 'number', required: true },
      { key: 'img_column', label: 'Image Column', desc: 'Sprite column index in PCX.', type: 'number', required: true },
      { key: 'culture_bonus', label: 'Culture Bonus', desc: 'Worked-tile culture bonus.', type: 'number' },
      { key: 'science_bonus', label: 'Science Bonus', desc: 'Worked-tile science bonus.', type: 'number' },
      { key: 'food_bonus', label: 'Food Bonus', desc: 'Worked-tile food bonus.', type: 'number' },
      { key: 'gold_bonus', label: 'Gold Bonus', desc: 'Worked-tile gold bonus.', type: 'number' },
      { key: 'shield_bonus', label: 'Shield Bonus', desc: 'Worked-tile shield bonus.', type: 'number' },
      { key: 'happiness_bonus', label: 'Happiness Bonus', desc: 'Worked-tile happiness bonus.', type: 'number' },
      { key: 'impassible', label: 'Impassible', desc: 'Disallow movement through tile.', type: 'bool' },
      { key: 'impassible_to_wheeled', label: 'Impassible To Wheeled', desc: 'Disallow wheeled movement unless connected.', type: 'bool' },
      { key: 'animation', label: 'Animation Item', desc: 'Natural wonder animation spec string.', type: 'text', multi: true }
    ],
    template: {
      name: 'New Natural Wonder',
      terrain_type: 'grassland',
      img_path: 'NaturalWonders.pcx',
      img_row: '0',
      img_column: '0'
    }
  },
  animations: {
    marker: '#Animation',
    entityName: 'Tile Animation',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Animation Name', desc: 'Unique animation identifier.', type: 'text', required: true },
      { key: 'ini_path', label: 'INI Path', desc: 'Relative to Art/Animations/.', type: 'text', required: true },
      { key: 'type', label: 'Animation Type', desc: 'Rule type controlling where this animation can appear.', type: 'select', options: ['terrain', 'resource', 'pcx', 'coastal-wave'], required: true },
      { key: 'resource_type', label: 'Resource Type', desc: 'Required for type=resource.', type: 'text' },
      { key: 'pcx_file', label: 'PCX File', desc: 'Required for type=pcx.', type: 'select', options: ['deltaRivers.pcx', 'floodplains.pcx', 'LMHills.pcx', 'Mountains.pcx', 'Mountains-snow.pcx', 'mtnRivers.pcx', 'Volcanos.pcx', 'Volcanos-snow.pcx', 'waterfalls.pcx', 'xhills.pcx'] },
      { key: 'pcx_index', label: 'PCX Index', desc: 'Required for type=pcx.', type: 'number' },
      { key: 'terrain_types', label: 'Terrain Types', desc: 'Terrain list; required for type=terrain.', type: 'list', options: [...TERRAIN_OPTIONS, 'land'] },
      { key: 'adjacent_to', label: 'Adjacent To', desc: 'Optional terrain:direction list.', type: 'list' },
      { key: 'direction', label: 'Direction Override', desc: 'Optional fixed facing direction.', type: 'select', options: DIRECTION_OPTIONS },
      { key: 'x_offset', label: 'X Offset', desc: 'Horizontal pixel offset.', type: 'number' },
      { key: 'y_offset', label: 'Y Offset', desc: 'Vertical pixel offset.', type: 'number' },
      { key: 'frame_time_seconds', label: 'Frame Time', desc: 'Per-frame seconds.', type: 'text' },
      { key: 'show_in_day_night_hours', label: 'Day/Night Hours', desc: 'Hour list/ranges where animation appears.', type: 'list' },
      { key: 'show_in_seasons', label: 'Seasons', desc: 'Allowed seasons.', type: 'list', options: ['spring', 'summer', 'fall', 'winter'] }
    ],
    template: {
      name: 'New Animation',
      ini_path: 'Terrain\\Wave\\Wave.INI',
      type: 'terrain',
      terrain_types: 'grassland'
    }
  }
};

function setStatus(text, isError = false) {
  el.status.textContent = text;
  el.status.style.color = isError ? '#a13514' : '';
}

function setReferenceNotice(text, isError = false, rerender = true) {
  state.referenceNotice = text ? { text, isError } : null;
  if (rerender && state.bundle && state.bundle.tabs && state.activeTab && state.bundle.tabs[state.activeTab] && state.bundle.tabs[state.activeTab].type === 'reference') {
    renderActiveTab({ preserveTabScroll: true });
  }
}

function withRemoveIcon(button, label) {
  button.textContent = '';
  const icon = document.createElement('span');
  icon.className = 'remove-icon';
  icon.textContent = 'x';
  button.appendChild(icon);
  button.appendChild(document.createTextNode(label));
}

function refreshDirtyUi() {
  if (el.saveBtn) el.saveBtn.classList.toggle('dirty', state.isDirty);
  if (el.dirtyIndicator) el.dirtyIndicator.classList.toggle('hidden', !state.isDirty);
  if (el.undoBtn) el.undoBtn.disabled = !state.undoSnapshot;
}

function snapshotTabs() {
  if (!state.bundle || !state.bundle.tabs) return 'null';
  const editableTabs = {};
  EDITABLE_TAB_KEYS.forEach((key) => {
    if (state.bundle.tabs[key]) editableTabs[key] = state.bundle.tabs[key];
  });
  return JSON.stringify(editableTabs);
}

function rememberUndoSnapshot() {
  if (state.isRendering || !state.trackDirty || state.suppressDirtyUntilInteraction) return;
  if (!state.undoSnapshot) {
    state.undoSnapshot = snapshotTabs();
    refreshDirtyUi();
  }
}

function captureCleanSnapshot() {
  state.cleanSnapshot = snapshotTabs();
  state.undoSnapshot = null;
  state.isDirty = false;
  refreshDirtyUi();
}

function setDirty(next) {
  if (state.isRendering || !state.trackDirty || state.suppressDirtyUntilInteraction) return;
  if (!next) {
    state.isDirty = false;
    refreshDirtyUi();
    return;
  }
  const currentSnapshot = snapshotTabs();
  state.isDirty = currentSnapshot !== state.cleanSnapshot;
  refreshDirtyUi();
}

function appendDebugLog(message, data) {
  if (!el.debugLog) return;
  const stamp = new Date().toISOString().split('T')[1].replace('Z', '');
  const payload = data ? ` ${JSON.stringify(data)}` : '';
  el.debugLog.textContent += `[${stamp}] ${message}${payload}\n`;
  el.debugLog.scrollTop = el.debugLog.scrollHeight;
}

function isScenarioMode() {
  return state.settings && state.settings.mode === 'scenario';
}

function setMode(mode) {
  state.settings.mode = mode;
  el.modeGlobal.classList.toggle('active', mode === 'global');
  el.modeScenario.classList.toggle('active', mode === 'scenario');
  el.scenarioPathRow.classList.toggle('hidden', mode !== 'scenario');
  document.body.classList.toggle('mode-standard', mode === 'global');
  document.body.classList.toggle('mode-scenario', mode === 'scenario');
}

function syncSettingsFromInputs() {
  state.settings.c3xPath = el.c3xPath.value.trim();
  state.settings.civ3Path = el.civ3Path.value.trim();
  state.settings.scenarioPath = el.scenarioPath.value.trim();
}

function fillInputsFromSettings() {
  el.c3xPath.value = state.settings.c3xPath || '';
  if (!state.settings.civ3Path && state.settings.civ3ConquestsPath) {
    const old = state.settings.civ3ConquestsPath;
    state.settings.civ3Path = /[\\/]Conquests$/i.test(old) ? old.replace(/[\\/]Conquests$/i, '') : old;
  }
  el.civ3Path.value = state.settings.civ3Path || '';
  el.scenarioPath.value = state.settings.scenarioPath || '';
}

function prettySourceLabel(source) {
  if (!source) return 'unknown';
  return source.replace('+', ' -> ');
}

function toFriendlyKey(key) {
  return key.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function createBaseMeta(row, fieldDocs) {
  const meta = document.createElement('div');
  meta.className = 'field-meta-block';
  const desc = (fieldDocs && fieldDocs[row.key]) || BASE_FIELD_DETAILS[row.key] || '';
  const line = document.createElement('div');
  line.className = 'field-meta';
  line.textContent = desc ? `${row.key} - ${desc}` : row.key;
  meta.appendChild(line);
  return meta;
}

function createIcon(className) {
  const icon = document.createElement('span');
  icon.className = `tab-icon ${className || ''}`.trim();
  return icon;
}

function tokenizeListPreservingQuotes(text) {
  const items = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (!inQuotes && (ch === ',' || ch === '\n' || ch === '\r')) {
      const t = cur.trim();
      if (t) items.push(t);
      cur = '';
      continue;
    }
    cur += ch;
  }
  const tail = cur.trim();
  if (tail) items.push(tail);
  return items;
}

function parseStructuredEntries(value) {
  let v = String(value || '').trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    v = v.slice(1, -1).trim();
  }
  if (!v) return [];
  return tokenizeListPreservingQuotes(v);
}

function serializeStructuredEntries(entries) {
  const cleaned = entries.map((e) => String(e || '').trim()).filter(Boolean);
  return cleaned.length > 0 ? `[${cleaned.join(', ')}]` : '';
}

function isStructuredBaseField(row) {
  if (BASE_STRUCTURED_LIST_FIELDS.has(row.key)) {
    return true;
  }
  const v = String(row.value || '').trim();
  return v.startsWith('[') && v.endsWith(']');
}

function parseNameAmountItems(value) {
  return parseStructuredEntries(value).map((item) => {
    const i = item.indexOf(':');
    if (i < 0) return { name: item.trim(), amount: '' };
    return {
      name: item.slice(0, i).trim().replace(/^"(.*)"$/, '$1'),
      amount: item.slice(i + 1).trim()
    };
  });
}

function serializeNameAmountItems(items) {
  const entries = items
    .map((it) => ({ name: String(it.name || '').trim(), amount: String(it.amount || '').trim() }))
    .filter((it) => it.name && it.amount)
    .map((it) => `${it.name.includes(' ') ? `"${it.name}"` : it.name}: ${it.amount}`);
  return serializeStructuredEntries(entries);
}

function parseBuildingPrereqItems(value) {
  return parseStructuredEntries(value).map((item) => {
    const i = item.indexOf(':');
    if (i < 0) return { building: item.trim(), units: [] };
    const building = item.slice(0, i).trim().replace(/^"(.*)"$/, '$1');
    const units = tokenizeListPreservingQuotes(item.slice(i + 1).replace(/\s+/g, ','))
      .map((u) => u.replace(/^"(.*)"$/, '$1').trim())
      .filter(Boolean);
    return { building, units };
  });
}

function serializeBuildingPrereqItems(items) {
  const entries = items
    .map((it) => ({ building: String(it.building || '').trim(), units: (it.units || []).map((u) => String(u || '').trim()).filter(Boolean) }))
    .filter((it) => it.building && it.units.length > 0)
    .map((it) => {
      const building = it.building.includes(' ') ? `"${it.building}"` : it.building;
      const units = it.units.map((u) => (u.includes(' ') ? `"${u}"` : u)).join(' ');
      return `${building}: ${units}`;
    });
  return serializeStructuredEntries(entries);
}

function parseBuildingResourceItems(value) {
  const FLAGS = ['local', 'no-tech-req', 'yields', 'show-bonus', 'hide-non-bonus'];
  return parseStructuredEntries(value).map((item) => {
    const i = item.indexOf(':');
    if (i < 0) return { building: item.trim(), resource: '', flags: [] };
    const building = item.slice(0, i).trim().replace(/^"(.*)"$/, '$1');
    const rhs = tokenizeListPreservingQuotes(item.slice(i + 1).replace(/\s+/g, ',')).map((t) => t.replace(/^"(.*)"$/, '$1').trim()).filter(Boolean);
    const resource = rhs.length > 0 ? rhs[rhs.length - 1] : '';
    const flags = rhs.filter((t) => FLAGS.includes(t));
    return { building, resource, flags };
  });
}

function serializeBuildingResourceItems(items) {
  const entries = items
    .map((it) => ({
      building: String(it.building || '').trim(),
      resource: String(it.resource || '').trim(),
      flags: Array.from(new Set((it.flags || []).map((f) => String(f || '').trim()).filter(Boolean)))
    }))
    .filter((it) => it.building && it.resource)
    .map((it) => {
      const b = it.building.includes(' ') ? `"${it.building}"` : it.building;
      const r = it.resource.includes(' ') ? `"${it.resource}"` : it.resource;
      return `${b}: ${[...it.flags, r].join(' ')}`;
    });
  return serializeStructuredEntries(entries);
}

function makeInputForBaseRow(row, onChange) {
  if (row.key === 'limit_units_per_tile') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    const raw = String(row.value || '').trim();

    const mode = document.createElement('select');
    [
      { value: 'false', label: 'No Limit' },
      { value: 'single', label: 'Single Value' },
      { value: 'triple', label: 'Land / Sea / Air' }
    ].forEach((m) => {
      const o = document.createElement('option');
      o.value = m.value;
      o.textContent = m.label;
      mode.appendChild(o);
    });

    const inputA = document.createElement('input');
    inputA.placeholder = 'value';
    const inputB = document.createElement('input');
    inputB.placeholder = 'land';
    const inputC = document.createElement('input');
    inputC.placeholder = 'sea';
    const inputD = document.createElement('input');
    inputD.placeholder = 'air';

    if (raw.startsWith('[') && raw.endsWith(']')) {
      mode.value = 'triple';
      const tokens = raw.slice(1, -1).trim().split(/\s+/);
      inputB.value = tokens[0] || '';
      inputC.value = tokens[1] || '';
      inputD.value = tokens[2] || '';
    } else if (raw === 'false' || raw === '') {
      mode.value = 'false';
    } else {
      mode.value = 'single';
      inputA.value = raw;
    }

    const recalc = () => {
      if (mode.value === 'false') onChange('false');
      else if (mode.value === 'single') onChange(String(inputA.value || '').trim());
      else onChange(`[${String(inputB.value || '').trim()} ${String(inputC.value || '').trim()} ${String(inputD.value || '').trim()}]`);
      rerender();
    };

    const rerender = () => {
      wrap.innerHTML = '';
      wrap.appendChild(mode);
      if (mode.value === 'single') wrap.appendChild(inputA);
      if (mode.value === 'triple') {
        const rowWrap = document.createElement('div');
        rowWrap.className = 'kv-row';
        rowWrap.appendChild(inputB);
        rowWrap.appendChild(inputC);
        rowWrap.appendChild(inputD);
        wrap.appendChild(rowWrap);
      }
    };

    mode.addEventListener('change', recalc);
    inputA.addEventListener('input', recalc);
    inputB.addEventListener('input', recalc);
    inputC.addEventListener('input', recalc);
    inputD.addEventListener('input', recalc);
    rerender();
    recalc();
    return wrap;
  }

  const renderSimpleList = (entries) => {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = entries.length > 0 ? entries : [''];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const line = document.createElement('div');
        line.className = 'kv-row compact';
        const input = document.createElement('input');
        input.placeholder = 'item';
        input.value = item;
        input.addEventListener('input', () => {
          items[idx] = input.value;
          onChange(serializeStructuredEntries(items));
        });
        const del = document.createElement('button');
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
      rememberUndoSnapshot();
          items.splice(idx, 1);
          if (items.length === 0) items.push('');
          onChange(serializeStructuredEntries(items));
          rerender();
        });
        line.appendChild(input);
        line.appendChild(del);
        wrap.appendChild(line);
      });
      const add = document.createElement('button');
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
    rememberUndoSnapshot();
        items.push('');
        onChange(serializeStructuredEntries(items));
        rerender();
      });
      wrap.appendChild(add);
    };
    rerender();
    return wrap;
  };

  if (row.key === 'production_perfume' || row.key === 'perfume_specs' || row.key === 'technology_perfume' || row.key === 'government_perfume') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseNameAmountItems(row.value);
    if (items.length === 0) items = [{ name: '', amount: '' }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const line = document.createElement('div');
        line.className = 'kv-row';
        const name = document.createElement('input');
        name.placeholder = 'name';
        name.value = item.name;
        name.addEventListener('input', () => {
          items[idx].name = name.value;
          onChange(serializeNameAmountItems(items));
        });
        const amount = document.createElement('input');
        amount.placeholder = 'amount (e.g. 20 or -50%)';
        amount.value = item.amount;
        amount.addEventListener('input', () => {
          items[idx].amount = amount.value;
          onChange(serializeNameAmountItems(items));
        });
        const del = document.createElement('button');
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ name: '', amount: '' });
          onChange(serializeNameAmountItems(items));
          rerender();
        });
        line.appendChild(name);
        line.appendChild(amount);
        line.appendChild(del);
        wrap.appendChild(line);
      });
      const add = document.createElement('button');
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ name: '', amount: '' });
        rerender();
      });
      wrap.appendChild(add);
    };
    onChange(serializeNameAmountItems(items));
    rerender();
    return wrap;
  }

  if (row.key === 'building_prereqs_for_units') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseBuildingPrereqItems(row.value);
    if (items.length === 0) items = [{ building: '', units: [] }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const block = document.createElement('div');
        block.className = 'structured-card';
        const b = document.createElement('input');
        b.placeholder = 'building';
        b.value = item.building;
        b.addEventListener('input', () => {
          items[idx].building = b.value;
          onChange(serializeBuildingPrereqItems(items));
        });
        const u = document.createElement('input');
        u.placeholder = 'units (comma list)';
        u.value = item.units.join(', ');
        u.addEventListener('input', () => {
          items[idx].units = tokenizeListPreservingQuotes(u.value);
          onChange(serializeBuildingPrereqItems(items));
        });
        const del = document.createElement('button');
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ building: '', units: [] });
          onChange(serializeBuildingPrereqItems(items));
          rerender();
        });
        block.appendChild(b);
        block.appendChild(u);
        block.appendChild(del);
        wrap.appendChild(block);
      });
      const add = document.createElement('button');
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ building: '', units: [] });
        rerender();
      });
      wrap.appendChild(add);
    };
    onChange(serializeBuildingPrereqItems(items));
    rerender();
    return wrap;
  }

  if (row.key === 'buildings_generating_resources') {
    const FLAGS = ['local', 'no-tech-req', 'yields', 'show-bonus', 'hide-non-bonus'];
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseBuildingResourceItems(row.value);
    if (items.length === 0) items = [{ building: '', resource: '', flags: [] }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const block = document.createElement('div');
        block.className = 'structured-card';

        const b = document.createElement('input');
        b.placeholder = 'building';
        b.value = item.building;
        b.addEventListener('input', () => {
          items[idx].building = b.value;
          onChange(serializeBuildingResourceItems(items));
        });
        block.appendChild(b);

        const r = document.createElement('input');
        r.placeholder = 'resource';
        r.value = item.resource;
        r.addEventListener('input', () => {
          items[idx].resource = r.value;
          onChange(serializeBuildingResourceItems(items));
        });
        block.appendChild(r);

        const flagRow = document.createElement('div');
        flagRow.className = 'flag-row';
        FLAGS.forEach((flag) => {
          const label = document.createElement('label');
          const check = document.createElement('input');
          check.type = 'checkbox';
          check.checked = item.flags.includes(flag);
          check.addEventListener('change', () => {
            const set = new Set(items[idx].flags);
            if (check.checked) set.add(flag);
            else set.delete(flag);
            items[idx].flags = Array.from(set);
            onChange(serializeBuildingResourceItems(items));
          });
          label.appendChild(check);
          label.appendChild(document.createTextNode(flag));
          flagRow.appendChild(label);
        });
        block.appendChild(flagRow);

        const del = document.createElement('button');
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ building: '', resource: '', flags: [] });
          onChange(serializeBuildingResourceItems(items));
          rerender();
        });
        block.appendChild(del);
        wrap.appendChild(block);
      });
      const add = document.createElement('button');
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ building: '', resource: '', flags: [] });
        rerender();
      });
      wrap.appendChild(add);
    };
    onChange(serializeBuildingResourceItems(items));
    rerender();
    return wrap;
  }

  if (isStructuredBaseField(row)) {
    return renderSimpleList(parseStructuredEntries(row.value));
  }

  if (row.type === 'boolean') {
    const wrap = document.createElement('label');
    wrap.className = 'bool-toggle';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = String(row.value).trim().toLowerCase() !== 'false';
    check.addEventListener('change', () => onChange(check.checked ? 'true' : 'false'));
    const text = document.createElement('span');
    text.textContent = check.checked ? 'Enabled' : 'Disabled';
    check.addEventListener('change', () => {
      text.textContent = check.checked ? 'Enabled' : 'Disabled';
    });
    wrap.appendChild(check);
    wrap.appendChild(text);
    return wrap;
  }

  const enumOptions = BASE_ENUM_OPTIONS[row.key];
  if (enumOptions && enumOptions.length > 0) {
    const select = document.createElement('select');
    enumOptions.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    select.value = row.value;
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  const input = document.createElement('input');
  input.type = row.type === 'integer' ? 'number' : 'text';
  input.value = row.value;
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function renderBaseTab(tab) {
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS.base));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = 'C3X core settings for this mode. Most fields are typed; plain text appears only when a setting is truly free-form.';
  wrap.appendChild(helper);

  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.placeholder = 'Filter settings...';
  filterInput.value = state.baseFilter;
  filterRow.appendChild(filterInput);
  wrap.appendChild(filterRow);

  const table = document.createElement('div');
  table.className = 'base-table';
  const rowElements = [];
  const groups = new Map();
  for (const row of tab.rows) {
    const sectionName = (tab.sectionByKey && tab.sectionByKey[row.key]) || 'General';
    if (!groups.has(sectionName)) {
      const group = document.createElement('div');
      group.className = 'base-group';
      const title = document.createElement('h4');
      title.className = 'base-group-title';
      title.textContent = sectionName;
      group.appendChild(title);
      const rowsWrap = document.createElement('div');
      rowsWrap.className = 'base-group-rows';
      group.appendChild(rowsWrap);
      table.appendChild(group);
      groups.set(sectionName, { group, rowsWrap, rowCount: 0 });
    }

    const r = document.createElement('div');
    r.className = 'base-row';

    const keyWrap = document.createElement('div');
    keyWrap.className = 'base-key-wrap';

    const keyTitle = document.createElement('div');
    keyTitle.className = 'base-key';
    keyTitle.textContent = toFriendlyKey(row.key);
    keyWrap.appendChild(keyTitle);
    keyWrap.appendChild(createBaseMeta(row, tab.fieldDocs));

    r.appendChild(keyWrap);

    const input = makeInputForBaseRow(row, (newValue) => {
      rememberUndoSnapshot();
      row.value = String(newValue);
      setDirty(true);
    });
    r.appendChild(input);

    const groupInfo = groups.get(sectionName);
    groupInfo.rowsWrap.appendChild(r);
    groupInfo.rowCount += 1;
    rowElements.push({ key: row.key.toLowerCase(), el: r, group: groupInfo.group });
  }

  const applyFilter = () => {
    const needle = filterInput.value.trim().toLowerCase();
    state.baseFilter = filterInput.value;
    rowElements.forEach((entry) => {
      entry.el.style.display = !needle || entry.key.includes(needle) ? '' : 'none';
    });
    groups.forEach((g) => {
      const hasVisible = Array.from(g.rowsWrap.children).some((child) => child.style.display !== 'none');
      g.group.style.display = hasVisible ? '' : 'none';
    });
  };
  filterInput.addEventListener('input', applyFilter);
  applyFilter();

  wrap.appendChild(table);
  return wrap;
}

function getFieldValues(section, key) {
  return section.fields.filter((f) => f.key === key).map((f) => f.value || '');
}

function setSingleFieldValue(section, key, value) {
  rememberUndoSnapshot();
  section.fields = section.fields.filter((f) => f.key !== key);
  if (value !== '') {
    section.fields.push({ key, value });
  }
  setDirty(true);
}

function setMultiFieldValues(section, key, values) {
  rememberUndoSnapshot();
  section.fields = section.fields.filter((f) => f.key !== key);
  for (const value of values) {
    if (value !== '') {
      section.fields.push({ key, value });
    }
  }
  setDirty(true);
}

function getFieldValue(section, key) {
  const f = section.fields.find((x) => x.key === key);
  return f ? String(f.value || '').trim() : '';
}

function getFieldValuesRaw(section, key) {
  return section.fields.filter((x) => x.key === key).map((x) => String(x.value || '').trim()).filter(Boolean);
}

function getCropDimensions(section, defaults) {
  const customW = Number.parseInt(getFieldValue(section, 'custom_width') || '', 10);
  const customH = Number.parseInt(getFieldValue(section, 'custom_height') || '', 10);
  return {
    w: Number.isFinite(customW) && customW > 0 ? customW : defaults.w,
    h: Number.isFinite(customH) && customH > 0 ? customH : defaults.h
  };
}

function fromBase64ToUint8(base64) {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function parseFrameSecondsFromSpec(spec) {
  const m = String(spec || '').match(/(?:^|[;\s])frame_time_seconds\s*[:=]\s*([0-9]*\.?[0-9]+)/i);
  if (!m) return null;
  const v = Number.parseFloat(m[1]);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

function getPreviewDelayMs(tabKey, section, title) {
  if (tabKey === 'animations' && title === 'Animation FLC') {
    const seconds = Number.parseFloat(getFieldValue(section, 'frame_time_seconds'));
    if (Number.isFinite(seconds) && seconds > 0) return Math.max(16, Math.round(seconds * 1000));
  }
  if (tabKey === 'naturalWonders' && title === 'Animation') {
    const spec = getFieldValuesRaw(section, 'animation')[0] || '';
    const seconds = parseFrameSecondsFromSpec(spec);
    if (seconds) return Math.max(16, Math.round(seconds * 1000));
  }
  return 100;
}

function renderRgbaPreview(container, preview, title, delayMsProvider, displayWidth = null) {
  const card = document.createElement('div');
  card.className = 'preview-card';
  const h = document.createElement('div');
  h.className = 'preview-title';
  h.textContent = title;
  card.appendChild(h);

  const canvas = document.createElement('canvas');
  canvas.width = preview.width;
  canvas.height = preview.height;
  canvas.className = 'preview-canvas';
  const previewWidth = Number.isFinite(displayWidth) && displayWidth > 0 ? displayWidth : state.previewSize;
  canvas.style.width = `${previewWidth}px`;
  canvas.style.height = 'auto';
  const ctx = canvas.getContext('2d');
  card.appendChild(canvas);

  const meta = document.createElement('div');
  meta.className = 'preview-meta';
  const motion = preview.animated ? 'animated' : 'static';
  meta.textContent = `${preview.width}x${preview.height} - ${motion} - ${preview.sourcePath.split(/[\\\\/]/).pop()}`;
  card.appendChild(meta);
  container.appendChild(card);

  if (preview.animated && Array.isArray(preview.framesBase64) && preview.framesBase64.length > 0) {
    const frames = preview.framesBase64.map((b64) =>
      new ImageData(new Uint8ClampedArray(fromBase64ToUint8(b64)), preview.width, preview.height)
    );
    appendDebugLog('preview:animated:init', { title, frames: frames.length, w: preview.width, h: preview.height, sourcePath: preview.sourcePath });
    let frameIdx = 0;
    let lastTick = performance.now();
    const step = () => {
      if (!canvas.isConnected) return;
      const delay = Math.max(16, Number(delayMsProvider ? delayMsProvider() : 100) || 100);
      const now = performance.now();
      if (now - lastTick >= delay) {
        ctx.putImageData(frames[frameIdx], 0, 0);
        frameIdx = (frameIdx + 1) % frames.length;
        lastTick = now;
      }
      window.requestAnimationFrame(step);
    };
    ctx.putImageData(frames[0], 0, 0);
    window.requestAnimationFrame(step);
  } else if (preview.rgbaBase64) {
    const rgba = fromBase64ToUint8(preview.rgbaBase64);
    const data = new ImageData(new Uint8ClampedArray(rgba), preview.width, preview.height);
    ctx.putImageData(data, 0, 0);
    appendDebugLog('preview:static:drawn', { title, w: preview.width, h: preview.height, sourcePath: preview.sourcePath });
  }
}

async function loadPreviewsForSection(tabKey, section, previewWrap) {
  const cacheKey = JSON.stringify({ tabKey, fields: section.fields, c3xPath: state.settings.c3xPath });
  if (state.previewCache.has(cacheKey)) {
    const cached = state.previewCache.get(cacheKey);
    appendDebugLog('preview:cache-hit', { tabKey, count: cached.length });
    cached.forEach((p) => renderRgbaPreview(previewWrap, p.preview, p.title, () => getPreviewDelayMs(tabKey, section, p.title), p.displayWidth));
    return;
  }

  const tasks = [];
  if (tabKey === 'districts') {
    const imgPaths = tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths'));
    imgPaths.forEach((name, idx) => {
      const cleaned = name.trim().replace(/^\"|\"$/g, '');
      tasks.push({
        title: `img_paths[${idx}] - ${cleaned}`,
        request: { kind: 'district', c3xPath: state.settings.c3xPath, fileName: cleaned }
      });
    });
  } else if (tabKey === 'wonders') {
    const fileName = getFieldValue(section, 'img_path') || 'Wonders.pcx';
    const row = parseInt(getFieldValue(section, 'img_row') || '0', 10) || 0;
    const col = parseInt(getFieldValue(section, 'img_column') || '0', 10) || 0;
    const crop = getCropDimensions(section, { w: 128, h: 64 });
    tasks.push({
      title: 'Completed Wonder',
      request: {
        kind: 'wonder',
        c3xPath: state.settings.c3xPath,
        fileName,
        crop: { row, col, w: crop.w, h: crop.h }
      }
    });
    const cr = parseInt(getFieldValue(section, 'img_construct_row') || '0', 10) || 0;
    const cc = parseInt(getFieldValue(section, 'img_construct_column') || '0', 10) || 0;
    tasks.push({
      title: 'Construction',
      request: {
        kind: 'wonder',
        c3xPath: state.settings.c3xPath,
        fileName,
        crop: { row: cr, col: cc, w: crop.w, h: crop.h }
      }
    });
  } else if (tabKey === 'naturalWonders') {
    const fileName = getFieldValue(section, 'img_path');
    const row = parseInt(getFieldValue(section, 'img_row') || '0', 10) || 0;
    const col = parseInt(getFieldValue(section, 'img_column') || '0', 10) || 0;
    const crop = getCropDimensions(section, { w: 128, h: 88 });
    tasks.push({
      title: 'Natural Wonder',
      request: {
        kind: 'naturalWonder',
        c3xPath: state.settings.c3xPath,
        fileName,
        crop: { row, col, w: crop.w, h: crop.h }
      }
    });
    getFieldValuesRaw(section, 'animation').slice(0, 1).forEach((spec) => {
      tasks.push({
        title: 'Animation',
        request: { kind: 'naturalWonderAnimationSpec', c3xPath: state.settings.c3xPath, animationSpec: spec }
      });
    });
  } else if (tabKey === 'animations') {
    const iniPath = getFieldValue(section, 'ini_path');
    tasks.push({
      title: 'Animation FLC',
      request: { kind: 'animationIni', c3xPath: state.settings.c3xPath, iniPath }
    });
  }

  const resolved = [];
  appendDebugLog('preview:load-start', { tabKey, taskCount: tasks.length });
  for (const task of tasks) {
    try {
      appendDebugLog('preview:request', { tabKey, title: task.title, request: task.request });
      const res = await window.c3xManager.getPreview(task.request);
      if (res && res.ok) {
        appendDebugLog('preview:response:ok', { tabKey, title: task.title, animated: !!res.animated, width: res.width, height: res.height, sourcePath: res.sourcePath, frames: res.framesBase64 ? res.framesBase64.length : 0, debug: res.debug || null });
        renderRgbaPreview(previewWrap, res, task.title, () => getPreviewDelayMs(tabKey, section, task.title), task.displayWidth);
        resolved.push({ title: task.title, preview: res, displayWidth: task.displayWidth || null });
      } else {
        appendDebugLog('preview:response:err', { tabKey, title: task.title, error: res && res.error });
      }
    } catch (err) {
      appendDebugLog('preview:response:exception', { tabKey, title: task.title, error: err && err.message });
    }
  }

  if (resolved.length > 0) {
    state.previewCache.set(cacheKey, resolved);
  }
}

function makeReferencePreviewTasks(tabKey, entry) {
  const tasks = [];
  const largeSizeByTab = {
    technologies: 150,
    resources: 150,
    improvements: 170,
    governments: 170,
    civilizations: 170,
    units: 180
  };
  const smallSize = 72;
  if (Array.isArray(entry.iconPaths)) {
    entry.iconPaths.slice(0, 2).forEach((assetPath, idx) => {
      tasks.push({
        title: idx === 0 ? 'Civilopedia Large' : 'Civilopedia Small',
        displayWidth: idx === 0 ? Math.min(largeSizeByTab[tabKey] || 170, state.previewSize) : Math.min(smallSize, state.previewSize),
        request: {
          kind: 'civilopediaIcon',
          civ3Path: state.settings.civ3Path,
          assetPath
        }
      });
    });
  }
  if (tabKey === 'civilizations' && Array.isArray(entry.racePaths)) {
    entry.racePaths.slice(0, 2).forEach((assetPath, idx) => {
      tasks.push({
        title: idx === 0 ? 'Advisor Portrait' : 'Victory Portrait',
        displayWidth: Math.min(150, state.previewSize),
        request: {
          kind: 'civilopediaIcon',
          civ3Path: state.settings.civ3Path,
          assetPath
        }
      });
    });
  }
  if (tabKey === 'units' && entry.animationName) {
    tasks.push({
      title: 'Unit Animation',
      displayWidth: Math.min(180, state.previewSize),
      request: {
        kind: 'unitAnimation',
        civ3Path: state.settings.civ3Path,
        animationName: entry.animationName
      }
    });
  }
  return tasks;
}

async function loadPreviewsForReferenceEntry(tabKey, entry, previewWrap) {
  const cacheKey = JSON.stringify({
    kind: 'reference',
    tabKey,
    key: entry.civilopediaKey,
    civ3Path: state.settings.civ3Path
  });
  if (state.previewCache.has(cacheKey)) {
    const cached = state.previewCache.get(cacheKey);
    cached.forEach((p) => renderRgbaPreview(previewWrap, p.preview, p.title, () => 100, p.displayWidth));
    return;
  }

  const tasks = makeReferencePreviewTasks(tabKey, entry);
  const resolved = [];
  for (const task of tasks) {
    try {
      const res = await window.c3xManager.getPreview(task.request);
      if (res && res.ok) {
        renderRgbaPreview(previewWrap, res, task.title, () => 100, task.displayWidth);
        resolved.push({ title: task.title, preview: res, displayWidth: task.displayWidth || null });
      }
    } catch (_err) {
      // Ignore preview errors for missing art references.
    }
  }
  if (resolved.length > 0) {
    state.previewCache.set(cacheKey, resolved);
  }
}

function drawPreviewFrameToCanvas(preview, canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !preview) return;
  let rgba;
  if (preview.rgbaBase64) {
    rgba = fromBase64ToUint8(preview.rgbaBase64);
  } else if (preview.framesBase64 && preview.framesBase64[0]) {
    rgba = fromBase64ToUint8(preview.framesBase64[0]);
  } else {
    return;
  }
  const src = document.createElement('canvas');
  src.width = preview.width;
  src.height = preview.height;
  const srcCtx = src.getContext('2d');
  if (!srcCtx) return;
  srcCtx.putImageData(new ImageData(new Uint8ClampedArray(rgba), preview.width, preview.height), 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.min(canvas.width / preview.width, canvas.height / preview.height);
  const w = Math.max(1, Math.floor(preview.width * ratio));
  const h = Math.max(1, Math.floor(preview.height * ratio));
  const x = Math.floor((canvas.width - w) / 2);
  const y = Math.floor((canvas.height - h) / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, x, y, w, h);
}

function loadReferenceListThumbnail(tabKey, entry, holder) {
  const assetPath = entry.thumbPath || '';
  if (!assetPath) return;
  const key = JSON.stringify({ kind: 'list-thumb', tabKey, entry: entry.civilopediaKey, assetPath, civ3Path: state.settings.civ3Path });
  const paint = (preview) => {
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.className = 'entry-thumb-canvas';
    drawPreviewFrameToCanvas(preview, canvas);
    holder.innerHTML = '';
    holder.appendChild(canvas);
  };

  if (state.previewCache.has(key)) {
    paint(state.previewCache.get(key));
    return;
  }

  window.c3xManager.getPreview({ kind: 'civilopediaIcon', civ3Path: state.settings.civ3Path, assetPath })
    .then((res) => {
      if (!res || !res.ok) return;
      state.previewCache.set(key, res);
      if (holder.isConnected) paint(res);
    })
    .catch(() => {});
}

function getSectionTitle(section, schema, index) {
  const titleField = section.fields.find((f) => f.key === schema.titleKey);
  if (titleField && titleField.value) {
    return titleField.value;
  }
  return `${schema.entityName} ${index + 1}`;
}

function formatReferenceList(values) {
  if (!values || values.length === 0) return '(none)';
  return values.join(', ');
}

function mapCivilopediaKeyToTabKey(civilopediaKey) {
  const key = String(civilopediaKey || '').toUpperCase();
  if (key.startsWith('RACE_')) return 'civilizations';
  if (key.startsWith('TECH_')) return 'technologies';
  if (key.startsWith('GOOD_')) return 'resources';
  if (key.startsWith('BLDG_')) return 'improvements';
  if (key.startsWith('GOVT_')) return 'governments';
  if (key.startsWith('PRTO_')) return 'units';
  return null;
}

function navigateToCivilopediaKey(civilopediaKey) {
  if (!state.bundle || !state.bundle.tabs) return false;
  const tabKey = mapCivilopediaKeyToTabKey(civilopediaKey);
  if (!tabKey || !state.bundle.tabs[tabKey] || !Array.isArray(state.bundle.tabs[tabKey].entries)) return false;
  const target = String(civilopediaKey || '').toUpperCase();
  const entries = state.bundle.tabs[tabKey].entries;
  const idx = entries.findIndex((entry) => String(entry.civilopediaKey || '').toUpperCase() === target);
  if (idx < 0) return false;
  const targetEntry = entries[idx];
  const needle = String(state.referenceFilter[tabKey] || '').trim().toLowerCase();
  if (needle) {
    const hay = `${targetEntry.name} ${targetEntry.civilopediaKey}`.toLowerCase();
    if (!hay.includes(needle)) {
      state.referenceFilter[tabKey] = '';
    }
  }
  if (tabKey === 'improvements') {
    const kind = state.referenceImprovementKind[tabKey] || 'all';
    if (kind !== 'all' && targetEntry.improvementKind !== kind) {
      state.referenceImprovementKind[tabKey] = 'all';
    }
  }
  state.activeTab = tabKey;
  state.referenceSelection[tabKey] = idx;
  renderTabs();
  renderActiveTab();
  return true;
}

function renderCivilopediaRichText(container, text) {
  const lines = String(text || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    container.textContent = '(none)';
    return;
  }
  const linkPattern = /\$LINK<([^=<>]+)=([A-Za-z0-9_]+)>/g;
  lines.forEach((line) => {
    const p = document.createElement('p');
    p.className = 'pedia-paragraph';
    const cleaned = line.replace(/\[([^\]]+)\]/g, '$1');
    let pos = 0;
    for (const match of cleaned.matchAll(linkPattern)) {
      const index = match.index || 0;
      if (index > pos) {
        p.appendChild(document.createTextNode(cleaned.slice(pos, index)));
      }
      const label = match[1];
      const key = match[2];
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'pedia-link';
      a.textContent = label;
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (!navigateToCivilopediaKey(key)) {
          setReferenceNotice(`No local entry for ${key}.`, true);
        }
      });
      p.appendChild(a);
      pos = index + match[0].length;
    }
    if (pos < cleaned.length) {
      p.appendChild(document.createTextNode(cleaned.slice(pos)));
    }
    container.appendChild(p);
  });
}

function renderReferenceTab(tab, tabKey) {
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[tabKey]));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">read-only</span>`);
  wrap.appendChild(header);

  const helperRow = document.createElement('div');
  helperRow.className = 'reference-helper-row';
  const helper = document.createElement('p');
  helper.className = 'hint hint-compact';
  helper.textContent = 'Read-only Civilopedia view with precedence Conquests > civ3PTW > vanilla.';
  helperRow.appendChild(helper);
  if (state.referenceNotice && state.referenceNotice.text) {
    const note = document.createElement('span');
    note.className = `reference-notice ${state.referenceNotice.isError ? 'error' : ''}`.trim();
    note.textContent = state.referenceNotice.text;
    helperRow.appendChild(note);
  }
  wrap.appendChild(helperRow);

  const controls = document.createElement('div');
  controls.className = 'reference-filter-row';
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = `Search ${tab.title}...`;
  search.value = state.referenceFilter[tabKey] || '';
  controls.appendChild(search);

  let kindFilter = null;
  if (tabKey === 'improvements') {
    kindFilter = document.createElement('select');
    const options = [
      { value: 'all', label: 'All Improvements' },
      { value: 'wonder', label: 'Wonders' },
      { value: 'small_wonder', label: 'Small Wonders' },
      { value: 'normal', label: 'Non-Wonders' }
    ];
    options.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      kindFilter.appendChild(o);
    });
    kindFilter.value = state.referenceImprovementKind[tabKey] || 'all';
    controls.appendChild(kindFilter);
  }
  wrap.appendChild(controls);

  const allEntries = tab.entries || [];
  const filteredEntries = allEntries
    .map((entry, baseIndex) => ({ entry, baseIndex }))
    .filter(({ entry }) => {
      const needle = String(state.referenceFilter[tabKey] || '').trim().toLowerCase();
      const hay = `${entry.name} ${entry.civilopediaKey}`.toLowerCase();
      if (needle && !hay.includes(needle)) return false;
      if (tabKey === 'improvements') {
        const k = state.referenceImprovementKind[tabKey] || 'all';
        if (k !== 'all' && entry.improvementKind !== k) return false;
      }
      return true;
    });

  const currentBaseIndex = state.referenceSelection[tabKey] || 0;
  let selectedFilteredIndex = filteredEntries.findIndex((x) => x.baseIndex === currentBaseIndex);
  if (selectedFilteredIndex < 0) selectedFilteredIndex = 0;
  if (filteredEntries.length > 0) {
    state.referenceSelection[tabKey] = filteredEntries[selectedFilteredIndex].baseIndex;
  }

  const layout = document.createElement('div');
  layout.className = 'entry-layout';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  listPane.addEventListener('scroll', () => {
    state.referenceListScrollTop[tabKey] = listPane.scrollTop;
  });

  filteredEntries.forEach(({ entry, baseIndex }, index) => {
    const itemBtn = document.createElement('button');
    itemBtn.className = 'entry-list-item';
    itemBtn.type = 'button';
    itemBtn.classList.toggle('active', index === selectedFilteredIndex);
    const thumb = document.createElement('span');
    thumb.className = 'entry-thumb';
    const title = document.createElement('strong');
    title.textContent = entry.name;
    itemBtn.appendChild(thumb);
    itemBtn.appendChild(title);
    loadReferenceListThumbnail(tabKey, entry, thumb);
    itemBtn.addEventListener('mousedown', () => {
      state.referenceListScrollTop[tabKey] = listPane.scrollTop;
    });
    itemBtn.addEventListener('click', () => {
      state.referenceListScrollTop[tabKey] = listPane.scrollTop;
      state.referenceSelection[tabKey] = baseIndex;
      state.tabContentScrollTop = el.tabContent.scrollTop;
      renderActiveTab({ preserveTabScroll: true });
    });
    listPane.appendChild(itemBtn);
  });
  layout.appendChild(listPane);

  const detailPane = document.createElement('div');
  detailPane.className = 'entry-detail-pane';
  detailPane.addEventListener('scroll', () => {
    state.referenceDetailScrollTop[tabKey] = detailPane.scrollTop;
  });

  search.addEventListener('input', () => {
    state.referenceFilter[tabKey] = search.value;
    state.referenceListScrollTop[tabKey] = 0;
    state.referenceSearchFocusedTab = tabKey;
    state.referenceSearchCaret[tabKey] = {
      start: search.selectionStart ?? search.value.length,
      end: search.selectionEnd ?? search.value.length
    };
    renderActiveTab({ preserveTabScroll: true });
  });
  if (kindFilter) {
    kindFilter.addEventListener('change', () => {
      state.referenceImprovementKind[tabKey] = kindFilter.value;
      state.referenceListScrollTop[tabKey] = 0;
      renderActiveTab({ preserveTabScroll: true });
    });
  }

  if (filteredEntries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'section-card';
    const hasFilter = !!String(state.referenceFilter[tabKey] || '').trim() || (tabKey === 'improvements' && (state.referenceImprovementKind[tabKey] || 'all') !== 'all');
    empty.innerHTML = hasFilter
      ? '<p class="hint">No entries match the current filters.</p>'
      : '<p class="hint">No entries found. Verify your Civilization 3 path and reload.</p>';
    detailPane.appendChild(empty);
  } else {
    const entry = filteredEntries[selectedFilteredIndex].entry;
    const card = document.createElement('div');
    card.className = 'section-card';
    card.style.setProperty('--preview-size', `${state.previewSize}px`);

    const top = document.createElement('div');
    top.className = 'section-top';
    top.innerHTML = `<strong>${entry.name}</strong>`;
    card.appendChild(top);

    const detailLayout = document.createElement('div');
    detailLayout.className = 'reference-detail-layout';
    const textCol = document.createElement('div');
    textCol.className = 'reference-text-col';
    const artCol = document.createElement('div');
    artCol.className = 'reference-art-col';
    card.appendChild(detailLayout);
    detailLayout.appendChild(textCol);
    detailLayout.appendChild(artCol);

    const previewWrap = document.createElement('div');
    previewWrap.className = 'preview-wrap compact';
    artCol.appendChild(previewWrap);
    loadPreviewsForReferenceEntry(tabKey, entry, previewWrap);

    const meta = document.createElement('div');
    meta.className = 'kv-grid';
    meta.innerHTML = `
      <div class="field-meta"><strong>Key:</strong> ${entry.civilopediaKey}</div>
      <div class="field-meta"><strong>Tech Dependencies:</strong> ${formatReferenceList(entry.techDependencies)}</div>
      <div class="field-meta"><strong>Animation:</strong> ${entry.animationName || '(none)'}</div>
      <div class="field-meta"><strong>Icon Paths:</strong> ${formatReferenceList(entry.iconPaths)}</div>
    `;
    if (tabKey === 'civilizations') {
      const civMeta = document.createElement('div');
      civMeta.className = 'field-meta';
      civMeta.innerHTML = `<strong>Race Paths:</strong> ${formatReferenceList(entry.racePaths)}`;
      meta.appendChild(civMeta);
    }
    textCol.appendChild(meta);

    if (entry.overview) {
      const overviewBlock = document.createElement('div');
      overviewBlock.className = 'field-description';
      overviewBlock.style.marginTop = '8px';
      const title = document.createElement('div');
      title.className = 'field-meta';
      title.textContent = 'Overview';
      overviewBlock.appendChild(title);
      renderCivilopediaRichText(overviewBlock, entry.overview);
      textCol.appendChild(overviewBlock);
    }

    const textBlock = document.createElement('div');
    textBlock.className = 'field-description';
    textBlock.style.marginTop = '8px';
    const descTitle = document.createElement('div');
    descTitle.className = 'field-meta';
    descTitle.textContent = 'Civilopedia';
    textBlock.appendChild(descTitle);
    renderCivilopediaRichText(textBlock, entry.description || '(No Civilopedia body found)');
    textCol.appendChild(textBlock);

    detailPane.appendChild(card);
  }

  layout.appendChild(detailPane);
  wrap.appendChild(layout);
  const savedListTop = state.referenceListScrollTop[tabKey] || 0;
  const savedDetailTop = state.referenceDetailScrollTop[tabKey] || 0;
  window.requestAnimationFrame(() => {
    listPane.scrollTop = savedListTop;
    detailPane.scrollTop = savedDetailTop;
    if (state.referenceSearchFocusedTab === tabKey) {
      const caret = state.referenceSearchCaret[tabKey];
      search.focus({ preventScroll: true });
      if (caret && Number.isFinite(caret.start) && Number.isFinite(caret.end)) {
        search.setSelectionRange(caret.start, caret.end);
      }
    }
  });
  return wrap;
}

function createFieldInput(schemaField, value, onChange) {
  if (schemaField.type === 'bool') {
    const wrap = document.createElement('label');
    wrap.className = 'bool-toggle';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = String(value || '').trim() !== '0';
    check.addEventListener('change', () => onChange(check.checked ? '1' : '0'));
    const text = document.createElement('span');
    text.textContent = check.checked ? 'Enabled' : 'Disabled';
    check.addEventListener('change', () => {
      text.textContent = check.checked ? 'Enabled' : 'Disabled';
    });
    wrap.appendChild(check);
    wrap.appendChild(text);
    return wrap;
  }

  if (schemaField.type === 'select') {
    const select = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '(not set)';
    select.appendChild(empty);
    (schemaField.options || []).forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    select.value = value || '';
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  const isPathField = schemaField.key.includes('path');
  if (isPathField) {
    const wrap = document.createElement('div');
    wrap.className = 'path-input-with-btn';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.placeholder = schemaField.required ? 'required' : '';
    input.addEventListener('input', () => onChange(input.value));
    const browse = document.createElement('button');
    browse.type = 'button';
    browse.textContent = '...';
    browse.addEventListener('click', async () => {
      const filePath = await window.c3xManager.pickFile();
      if (!filePath) return;
      input.value = filePath;
      onChange(filePath);
    });
    wrap.appendChild(input);
    wrap.appendChild(browse);
    return wrap;
  }

  const input = document.createElement('input');
  input.type = schemaField.type === 'number' ? 'number' : 'text';
  input.value = value || '';
  input.placeholder = schemaField.required ? 'required' : '';
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function renderKnownField(section, schemaField, fieldDocs, onValueChange) {
  const row = document.createElement('div');
  row.className = 'form-row';

  const label = document.createElement('label');
  label.className = 'field-label';
  label.textContent = schemaField.label + (schemaField.required ? ' *' : '');
  row.appendChild(label);

  const longDoc = (fieldDocs && fieldDocs[schemaField.key]) || '';
  const fullDesc = longDoc || schemaField.desc || '';
  const meta = document.createElement('div');
  meta.className = 'field-meta-block';
  const metaText = document.createElement('div');
  metaText.className = 'field-meta';
  metaText.textContent = schemaField.key;
  meta.appendChild(metaText);
  if (fullDesc) {
    const desc = document.createElement('div');
    desc.className = 'field-description';
    desc.textContent = fullDesc;
    meta.appendChild(desc);
  }
  row.appendChild(meta);

  const values = getFieldValues(section, schemaField.key);

  if (schemaField.multi || schemaField.type === 'list') {
    const multiWrap = document.createElement('div');
    multiWrap.className = 'multi-value-group';

    const list = (schemaField.type === 'list' && !schemaField.multi)
      ? (values[0] ? tokenizeListPreservingQuotes(values[0]) : [''])
      : (values.length > 0 ? values : ['']);
    list.forEach((current, idx) => {
      const line = document.createElement('div');
      line.className = 'kv-row compact';

      let input;
      if (schemaField.options && schemaField.options.length > 0) {
        input = document.createElement('select');
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = '(not set)';
        input.appendChild(empty);
        schemaField.options.forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
        input.value = current || '';
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'item';
        input.value = current;
      }
      input.addEventListener('input', () => {
        const next = [...list];
        next[idx] = input.value;
        if (schemaField.type === 'list' && !schemaField.multi)
          setSingleFieldValue(section, schemaField.key, next.join(', '));
        else
          setMultiFieldValues(section, schemaField.key, next);
        if (onValueChange) onValueChange(schemaField.key, next.join(', '));
      });

      const del = document.createElement('button');
      withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          const next = [...list];
          next.splice(idx, 1);
        if (schemaField.type === 'list' && !schemaField.multi)
          setSingleFieldValue(section, schemaField.key, next.join(', '));
        else
          setMultiFieldValues(section, schemaField.key, next);
        renderActiveTab();
      });

      if (schemaField.key.includes('path') && !schemaField.options) {
        const browse = document.createElement('button');
        browse.textContent = '...';
        browse.type = 'button';
        browse.addEventListener('click', async () => {
          const filePath = await window.c3xManager.pickFile();
          if (!filePath) return;
          input.value = filePath;
          const next = [...list];
          next[idx] = filePath;
          setMultiFieldValues(section, schemaField.key, next);
        });
        line.appendChild(input);
        line.appendChild(browse);
      } else {
        line.appendChild(input);
      }
      line.appendChild(del);
      multiWrap.appendChild(line);
    });

    const add = document.createElement('button');
    add.textContent = 'Add Item';
    add.addEventListener('click', () => {
      const next = [...list, ''];
      if (schemaField.type === 'list' && !schemaField.multi)
        setSingleFieldValue(section, schemaField.key, next.join(', '));
      else
        setMultiFieldValues(section, schemaField.key, next);
      renderActiveTab();
    });

    row.appendChild(multiWrap);
    row.appendChild(add);
    return row;
  }

  const input = createFieldInput(schemaField, values[0] || '', (newValue) => {
    setSingleFieldValue(section, schemaField.key, String(newValue || '').trim());
    if (onValueChange) onValueChange(schemaField.key, String(newValue || '').trim());
  });
  row.appendChild(input);

  return row;
}

function renderAdvancedFields(section, schemaKeys) {
  const wrap = document.createElement('details');
  wrap.className = 'advanced-wrap';

  const summary = document.createElement('summary');
  summary.textContent = 'Advanced fields';
  wrap.appendChild(summary);

  const unknownFields = section.fields.filter((f) => !schemaKeys.has(f.key));

  const list = document.createElement('div');
  list.className = 'kv-grid';
  unknownFields.forEach((field, idx) => {
    const row = document.createElement('div');
    row.className = 'kv-row compact';

    const keyInput = document.createElement('input');
    keyInput.value = field.key || '';
    keyInput.placeholder = 'config key';
    keyInput.addEventListener('input', () => {
      rememberUndoSnapshot();
      field.key = keyInput.value;
      setDirty(true);
    });

    const valueInput = document.createElement('input');
    valueInput.value = field.value || '';
    valueInput.placeholder = 'value';
    valueInput.addEventListener('input', () => {
      rememberUndoSnapshot();
      field.value = valueInput.value;
      setDirty(true);
    });

    const del = document.createElement('button');
    withRemoveIcon(del, ' Remove');
    del.addEventListener('click', () => {
      rememberUndoSnapshot();
      const allUnknown = section.fields.filter((f) => !schemaKeys.has(f.key));
      const target = allUnknown[idx];
      const pos = section.fields.indexOf(target);
      if (pos >= 0) {
        section.fields.splice(pos, 1);
      }
      setDirty(true);
      renderActiveTab();
    });

    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(del);
    list.appendChild(row);
  });

  const add = document.createElement('button');
  add.textContent = 'Add Advanced Field';
  add.addEventListener('click', () => {
    rememberUndoSnapshot();
    section.fields.push({ key: '', value: '' });
    setDirty(true);
    renderActiveTab();
  });

  wrap.appendChild(list);
  wrap.appendChild(add);
  return wrap;
}

function createSectionFromTemplate(tabKey) {
  const schema = SECTION_SCHEMAS[tabKey];
  const section = { marker: schema.marker, fields: [], comments: [] };
  for (const [key, value] of Object.entries(schema.template || {})) {
    section.fields.push({ key, value });
  }
  return section;
}

function addSection(tab, tabKey) {
  rememberUndoSnapshot();
  tab.model.sections.unshift(createSectionFromTemplate(tabKey));
  state.sectionSelection[tabKey] = 0;
  setDirty(true);
  renderActiveTab();
}

function renderSectionTab(tab, tabKey) {
  const schema = SECTION_SCHEMAS[tabKey];
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[tabKey]));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`);

  const addSectionBtn = document.createElement('button');
  addSectionBtn.textContent = `Add ${schema.entityName}`;
  addSectionBtn.className = 'add-section';
  addSectionBtn.addEventListener('click', () => addSection(tab, tabKey));

  header.appendChild(addSectionBtn);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = `${tab.title} editor. Saving writes ${isScenarioMode() ? 'scenario.*' : 'user.*'} files for this tab.`;
  wrap.appendChild(helper);

  const schemaKeys = new Set(schema.fields.map((f) => f.key));
  const selectedIndex = Math.max(0, Math.min(state.sectionSelection[tabKey] || 0, Math.max(0, tab.model.sections.length - 1)));
  state.sectionSelection[tabKey] = selectedIndex;

  const layout = document.createElement('div');
  layout.className = 'entry-layout';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  listPane.scrollTop = state.sectionListScrollTop[tabKey] || 0;
  listPane.addEventListener('scroll', () => {
    state.sectionListScrollTop[tabKey] = listPane.scrollTop;
  });
  tab.model.sections.forEach((section, sectionIndex) => {
    const itemBtn = document.createElement('button');
    itemBtn.className = 'entry-list-item no-thumb';
    itemBtn.dataset.index = String(sectionIndex);
    itemBtn.classList.toggle('active', sectionIndex === selectedIndex);
    itemBtn.type = 'button';
    itemBtn.innerHTML = `<strong>${getSectionTitle(section, schema, sectionIndex)}</strong>`;
    itemBtn.addEventListener('mousedown', () => {
      state.tabContentScrollTop = el.tabContent.scrollTop;
    });
    itemBtn.addEventListener('click', () => {
      state.tabContentScrollTop = el.tabContent.scrollTop;
      state.sectionListScrollTop[tabKey] = listPane.scrollTop;
      state.sectionSelection[tabKey] = sectionIndex;
      renderActiveTab({ preserveTabScroll: true });
    });
    listPane.appendChild(itemBtn);
  });
  layout.appendChild(listPane);

  const detailPane = document.createElement('div');
  detailPane.className = 'entry-detail-pane';
  detailPane.scrollTop = state.sectionDetailScrollTop[tabKey] || 0;
  detailPane.addEventListener('scroll', () => {
    state.sectionDetailScrollTop[tabKey] = detailPane.scrollTop;
  });

  if (tab.model.sections.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'section-card';
    empty.innerHTML = `<p class="hint">No ${schema.entityName.toLowerCase()} entries yet.</p>`;
    const addFirst = document.createElement('button');
    addFirst.textContent = `Add ${schema.entityName}`;
    addFirst.addEventListener('click', () => addSection(tab, tabKey));
    empty.appendChild(addFirst);
    detailPane.appendChild(empty);
  } else {
    const section = tab.model.sections[selectedIndex];
    const card = document.createElement('div');
    card.className = 'section-card';
    card.style.setProperty('--preview-size', `${state.previewSize}px`);

    const top = document.createElement('div');
    top.className = 'section-top';
    top.innerHTML = `<strong>${getSectionTitle(section, schema, selectedIndex)}</strong>`;

    const removeSectionBtn = document.createElement('button');
    withRemoveIcon(removeSectionBtn, ` Remove ${schema.entityName}`);
    removeSectionBtn.addEventListener('click', () => {
      rememberUndoSnapshot();
      tab.model.sections.splice(selectedIndex, 1);
      state.sectionSelection[tabKey] = Math.max(0, selectedIndex - 1);
      setDirty(true);
      renderActiveTab();
    });
    top.appendChild(removeSectionBtn);
    card.appendChild(top);

    const previewTools = document.createElement('div');
    previewTools.className = 'preview-tools';
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'preview-size-label';
    sizeLabel.textContent = 'Preview Size';
    const sizeValue = document.createElement('span');
    sizeValue.className = 'preview-size-value';
    sizeValue.textContent = `${state.previewSize}px`;
    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '120';
    sizeSlider.max = '420';
    sizeSlider.step = '10';
    sizeSlider.value = String(state.previewSize);
    sizeSlider.addEventListener('input', () => {
      state.previewSize = Number.parseInt(sizeSlider.value, 10) || 220;
      sizeValue.textContent = `${state.previewSize}px`;
      card.style.setProperty('--preview-size', `${state.previewSize}px`);
      card.querySelectorAll('canvas.preview-canvas').forEach((c) => {
        c.style.width = `${state.previewSize}px`;
        c.style.height = 'auto';
      });
    });
    previewTools.appendChild(sizeLabel);
    previewTools.appendChild(sizeSlider);
    previewTools.appendChild(sizeValue);
    card.appendChild(previewTools);

    const previewWrap = document.createElement('div');
    previewWrap.className = 'preview-wrap';
    card.appendChild(previewWrap);
    const refreshPreviews = () => {
      const scopedKey = JSON.stringify({ tabKey, section: section.fields });
      for (const key of Array.from(state.previewCache.keys())) {
        if (key.includes(`\"tabKey\":\"${tabKey}\"`)) {
          state.previewCache.delete(key);
        }
      }
      void scopedKey;
      previewWrap.innerHTML = '';
      loadPreviewsForSection(tabKey, section, previewWrap);
    };
    refreshPreviews();

    const previewFieldKeysByTab = {
      districts: new Set(['img_paths', 'custom_width', 'custom_height']),
      wonders: new Set(['img_path', 'img_row', 'img_column', 'img_construct_row', 'img_construct_column', 'custom_width', 'custom_height']),
      naturalWonders: new Set(['img_path', 'img_row', 'img_column', 'animation', 'custom_width', 'custom_height']),
      animations: new Set(['ini_path', 'frame_time_seconds'])
    };
    const previewFields = previewFieldKeysByTab[tabKey] || new Set();

    const form = document.createElement('div');
    form.className = 'form-grid';
    schema.fields.forEach((schemaField) => {
      form.appendChild(renderKnownField(section, schemaField, tab.fieldDocs, (key, value) => {
        if (key === schema.titleKey) {
          const titleEl = listPane.querySelector(`.entry-list-item[data-index="${selectedIndex}"] strong`);
          if (titleEl) {
            titleEl.textContent = value || `${schema.entityName}`;
          }
        }
        if (previewFields.has(key)) {
          refreshPreviews();
        }
        setDirty(true);
      }));
    });
    card.appendChild(form);
    card.appendChild(renderAdvancedFields(section, schemaKeys));
    detailPane.appendChild(card);
  }

  layout.appendChild(detailPane);
  wrap.appendChild(layout);

  if (isScenarioMode()) {
    const warning = document.createElement('p');
    warning.className = 'warning';
    warning.textContent = 'This tab is replacement-based in Scenario mode: scenario file replaces user/default content.';
    wrap.appendChild(warning);
  }

  return wrap;
}

function renderTabs() {
  el.tabs.innerHTML = '';
  TAB_GROUPS.forEach((group) => {
    const present = group.keys.filter((key) => state.bundle.tabs[key]);
    if (present.length === 0) return;
    const groupWrap = document.createElement('div');
    groupWrap.className = 'tab-group';
    const label = document.createElement('div');
    label.className = 'tab-group-label';
    label.textContent = group.label;
    groupWrap.appendChild(label);
    const row = document.createElement('div');
    row.className = 'tab-group-row';
    present.forEach((key) => {
      const tab = state.bundle.tabs[key];
      const button = document.createElement('button');
      button.className = 'tab-btn';
      button.appendChild(createIcon(TAB_ICONS[key]));
      const text = document.createElement('span');
      text.textContent = tab.title;
      button.appendChild(text);
      button.classList.toggle('active', state.activeTab === key);
      button.addEventListener('click', () => {
        state.activeTab = key;
        renderTabs();
        renderActiveTab();
      });
      row.appendChild(button);
    });
    groupWrap.appendChild(row);
    el.tabs.appendChild(groupWrap);
  });
}

function renderActiveTab(options = {}) {
  const preserveTabScroll = !!options.preserveTabScroll;
  if (!preserveTabScroll) {
    state.tabContentScrollTop = el.tabContent.scrollTop;
  }
  state.isRendering = true;
  el.tabContent.innerHTML = '';
  const tab = state.bundle.tabs[state.activeTab];
  if (!tab) {
    state.isRendering = false;
    return;
  }

  if (tab.type === 'reference') {
    el.tabContent.appendChild(renderReferenceTab(tab, state.activeTab));
  } else if (state.activeTab === 'base') {
    el.tabContent.appendChild(renderBaseTab(tab));
  } else {
    el.tabContent.appendChild(renderSectionTab(tab, state.activeTab));
  }
  state.isRendering = false;
  const targetTop = state.tabContentScrollTop || 0;
  window.requestAnimationFrame(() => {
    el.tabContent.scrollTop = targetTop;
  });
}

async function loadBundleAndRender() {
  syncSettingsFromInputs();
  await window.c3xManager.setSettings(state.settings);

  if (!state.settings.c3xPath) {
    setStatus('Set C3X Folder first.', true);
    return;
  }

  if (state.settings.mode === 'scenario' && !state.settings.scenarioPath) {
    setStatus('Set Scenario Folder in Scenario mode.', true);
    return;
  }

  try {
    state.trackDirty = false;
    const bundle = await window.c3xManager.loadBundle({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      civ3Path: state.settings.civ3Path,
      scenarioPath: state.settings.scenarioPath
    });

    state.bundle = bundle;
    state.activeTab = Object.keys(bundle.tabs)[0] || 'base';
    state.baseFilter = '';
    el.workspace.classList.remove('hidden');
    renderTabs();
    renderActiveTab();
    window.setTimeout(() => {
      captureCleanSnapshot();
      state.trackDirty = true;
    }, 0);
    setReferenceNotice('Configs loaded.');
  } catch (err) {
    state.trackDirty = true;
    setStatus(`Failed to load configs: ${err.message}`, true);
  }
}

async function saveCurrentBundle() {
  if (!state.bundle) {
    setStatus('Load configs before saving.', true);
    return;
  }

  syncSettingsFromInputs();
  await window.c3xManager.setSettings(state.settings);

  try {
    const tabsToSave = {};
    ['base', 'districts', 'wonders', 'naturalWonders', 'animations'].forEach((key) => {
      if (state.bundle.tabs[key]) tabsToSave[key] = state.bundle.tabs[key];
    });
    const res = await window.c3xManager.saveBundle({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      scenarioPath: state.settings.scenarioPath,
      tabs: tabsToSave
    });

    if (!res.ok) {
      setStatus('Save failed.', true);
      return;
    }

    const paths = res.saveReport.map((r) => r.path).join(' | ');
    captureCleanSnapshot();
    setStatus(`Saved ${res.saveReport.length} file(s): ${paths}`);
  } catch (err) {
    setStatus(`Failed to save: ${err.message}`, true);
  }
}

async function resetCurrentBundle() {
  if (!state.bundle) {
    setStatus('Load configs before resetting.', true);
    return;
  }
  await loadBundleAndRender();
  setStatus('Reset to last saved files.');
}

function undoOneStep() {
  if (!state.bundle || !state.undoSnapshot) {
    setStatus('Nothing to undo.');
    return;
  }
  try {
    state.bundle.tabs = JSON.parse(state.undoSnapshot);
    state.undoSnapshot = null;
    state.isDirty = snapshotTabs() !== state.cleanSnapshot;
    refreshDirtyUi();
    renderTabs();
    renderActiveTab({ preserveTabScroll: true });
    setStatus('Undid last change.');
  } catch (err) {
    setStatus('Undo failed.', true);
  }
}

async function wireBrowseButton(button, input) {
  button.addEventListener('click', async () => {
    const dir = await window.c3xManager.pickDirectory();
    if (!dir) {
      return;
    }
    input.value = dir;
    syncSettingsFromInputs();
    await window.c3xManager.setSettings(state.settings);
  });
}

async function shouldAutoLoad() {
  const hasC3x = await window.c3xManager.pathExists(state.settings.c3xPath);
  if (!hasC3x) {
    return false;
  }
  if (state.settings.mode !== 'scenario') {
    return true;
  }
  return await window.c3xManager.pathExists(state.settings.scenarioPath);
}

async function init() {
  state.settings = await window.c3xManager.getSettings();
  state.trackDirty = false;
  state.suppressDirtyUntilInteraction = true;
  refreshDirtyUi();
  fillInputsFromSettings();
  setMode(state.settings.mode || 'global');

  const unlockDirtyTracking = () => {
    state.suppressDirtyUntilInteraction = false;
  };
  document.addEventListener('pointerdown', unlockDirtyTracking, { capture: true });
  document.addEventListener('keydown', unlockDirtyTracking, { capture: true });

  el.modeGlobal.addEventListener('click', async () => {
    setMode('global');
    await window.c3xManager.setSettings(state.settings);
  });

  el.modeScenario.addEventListener('click', async () => {
    setMode('scenario');
    await window.c3xManager.setSettings(state.settings);
  });

  el.loadBtn.addEventListener('click', loadBundleAndRender);
  el.saveBtn.addEventListener('click', saveCurrentBundle);
  if (el.undoBtn) {
    el.undoBtn.addEventListener('click', undoOneStep);
  }
  if (el.resetBtn) {
    el.resetBtn.addEventListener('click', resetCurrentBundle);
  }
  if (el.debugToggle && el.debugDrawer) {
    el.debugToggle.addEventListener('click', () => {
      el.debugDrawer.classList.toggle('hidden');
    });
  }
  if (el.debugClose && el.debugDrawer) {
    el.debugClose.addEventListener('click', () => {
      el.debugDrawer.classList.add('hidden');
    });
  }
  if (el.clearDebugLog) {
    el.clearDebugLog.addEventListener('click', () => {
      el.debugLog.textContent = '';
    });
  }
  if (el.copyDebugLog) {
    el.copyDebugLog.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(el.debugLog.textContent || '');
        setStatus('Debug log copied.');
      } catch (_err) {
        setStatus('Could not copy debug log.', true);
      }
    });
  }

  wireBrowseButton(el.pickC3x, el.c3xPath);
  wireBrowseButton(el.pickCiv3, el.civ3Path);
  wireBrowseButton(el.pickScenario, el.scenarioPath);

  setStatus('Choose paths, then load configs.');

  if (await shouldAutoLoad()) {
    await loadBundleAndRender();
  }
}

init();
