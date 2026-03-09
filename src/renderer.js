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
  biqSectionSelectionByTab: {},
  biqRecordSelection: {},
  biqMapZoom: 6,
  biqMapLayer: 'terrain',
  biqMapShowGrid: false,
  biqMapShowOverlays: true,
  biqMapShowCityNames: false,
  biqMapSelectedTile: -1,
  biqMapScrollLeft: null,
  biqMapScrollTop: null,
  biqMapRerenderPending: false,
  biqMapLastScrollLogTs: 0,
  biqMapZoomAnchor: null,
  biqMapSuppressClickUntilTs: 0,
  biqMapArtCache: {},
  biqMapArtLoading: {},
  previewCache: new Map(),
  isLoading: false,
  pendingAutoReload: false,
  autoReloadTimer: null,
  pathsCollapsed: false,
  hasAutoCollapsedPaths: false,
  availableScenarios: [],
  navHistory: [],
  navHistoryIndex: -1,
  isApplyingHistory: false,
  civilopediaEditorOpen: {},
  civilopediaPreviewVisible: {},
  referenceSectionNavCleanup: null
};
const richTooltip = {
  node: null,
  active: false
};
const artFocus = {
  node: null,
  canvas: null,
  title: null,
  meta: null,
  zoomLabel: null,
  preview: null,
  slot: null,
  zoom: 1
};

const el = {
  modeGlobal: document.getElementById('mode-global'),
  modeScenarioSelect: document.getElementById('mode-scenario-select'),
  fontDown: document.getElementById('font-down'),
  fontUp: document.getElementById('font-up'),
  fontScaleLabel: document.getElementById('font-scale-label'),
  c3xPath: document.getElementById('c3x-path'),
  civ3Path: document.getElementById('civ3-path'),
  scenarioPath: document.getElementById('scenario-path'),
  scenarioPathRow: document.getElementById('scenario-path-row'),
  pickC3x: document.getElementById('pick-c3x'),
  pickCiv3: document.getElementById('pick-civ3'),
  pickScenario: document.getElementById('pick-scenario'),
  paths: document.querySelector('.paths'),
  pathsToggle: document.getElementById('paths-toggle'),
  pathsSummary: document.getElementById('paths-summary'),
  modeStateBadge: document.getElementById('mode-state-badge'),
  modeStateDetail: document.getElementById('mode-state-detail'),
  scenarioTitleChip: document.getElementById('scenario-title-chip'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.getElementById('loading-text'),
  backBtn: document.getElementById('back-btn'),
  forwardBtn: document.getElementById('forward-btn'),
  saveBtn: document.getElementById('save-btn'),
  undoBtn: document.getElementById('undo-btn'),
  resetBtn: document.getElementById('reset-btn'),
  dirtyIndicator: document.getElementById('dirty-indicator'),
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
  gameConcepts: 'icon-c3x',
  map: 'icon-civ',
  scenarioSettings: 'icon-gov',
  players: 'icon-civ',
  terrain: 'icon-natural',
  terrainPedia: 'icon-natural',
  workerActions: 'icon-natural',
  world: 'icon-resource',
  rules: 'icon-c3x',
  base: 'icon-c3x',
  districts: 'icon-district',
  wonders: 'icon-wonder',
  naturalWonders: 'icon-natural',
  animations: 'icon-anim'
};
const TAB_GROUPS = [
  { label: 'CIV 3', keys: ['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts', 'map', 'scenarioSettings', 'players', 'terrain', 'world', 'rules', 'terrainPedia', 'workerActions'] },
  { label: 'C3X', keys: ['base', 'districts', 'wonders', 'naturalWonders', 'animations'] }
];
const BIQ_TERRAIN_ATLAS_FILES = [
  'Art/Terrain/xtgc.pcx',
  'Art/Terrain/xpgc.pcx',
  'Art/Terrain/xdgc.pcx',
  'Art/Terrain/xdpc.pcx',
  'Art/Terrain/xdgp.pcx',
  'Art/Terrain/xggc.pcx',
  'Art/Terrain/wCSO.pcx',
  'Art/Terrain/wSSS.pcx',
  'Art/Terrain/wOOO.pcx'
];
const BIQ_MAP_OVERLAY_ANCHORS = {
  resource: { x: 40, y: 41 },
  unit: { x: 48, y: 41 },
  city: { x: 46, y: 20 },
  cityName: { x: 84, y: 50 }
};
const BIQ_MAP_ZOOM_MIN = 2;
const BIQ_MAP_ZOOM_MAX = 18;

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
const EDITABLE_TAB_KEYS = [
  'base',
  'districts',
  'wonders',
  'naturalWonders',
  'animations',
  'civilizations',
  'technologies',
  'resources',
  'improvements',
  'governments',
  'units',
  'gameConcepts',
  'terrainPedia',
  'workerActions',
  'scenarioSettings',
  'players',
  'terrain',
  'world',
  'rules'
];

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
  if (!el.status) return;
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

function clampFontScale(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0.85, Math.min(1.4, Math.round(n * 100) / 100));
}

function applyUiFontScale(scale) {
  const next = clampFontScale(scale);
  document.documentElement.style.setProperty('--ui-scale', String(next));
  if (el.fontScaleLabel) {
    el.fontScaleLabel.textContent = `${Math.round(next * 100)}%`;
  }
  if (state.settings) {
    state.settings.uiFontScale = next;
  }
}

function setUiFontScale(scale, persist = false) {
  applyUiFontScale(scale);
  if (persist && state.settings) {
    void window.c3xManager.setSettings(state.settings);
  }
}

function getScenarioPreviewPaths() {
  const roots = (state.bundle && Array.isArray(state.bundle.scenarioSearchPaths))
    ? state.bundle.scenarioSearchPaths
    : [];
  return roots;
}

function getScenarioPreviewPathsKey() {
  return getScenarioPreviewPaths().join('|');
}

function getPathTail(anyPath) {
  const trimmed = String(anyPath || '').trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || trimmed;
}

function normalizeSlashes(anyPath) {
  return String(anyPath || '').replace(/\\/g, '/');
}

function compactPathFromCiv3Root(anyPath) {
  const full = normalizeSlashes(anyPath).trim();
  const civ3Root = normalizeSlashes((state.settings && state.settings.civ3Path) || '').trim();
  if (!full || !civ3Root) return anyPath;
  const fullLower = full.toLowerCase();
  const rootLower = civ3Root.toLowerCase();
  const idx = fullLower.indexOf(rootLower);
  if (idx < 0) return anyPath;
  const rootName = getPathTail(civ3Root);
  const rest = full.slice(idx + civ3Root.length);
  return `/${rootName}${rest}`;
}

function stripBiqExtension(fileName) {
  return String(fileName || '').replace(/\.biq$/i, '');
}

function getLoadedScenarioName(bundle = null) {
  if (!bundle) return '';
  const biqPath = String((bundle.biq && bundle.biq.sourcePath) || (bundle.tabs && bundle.tabs.map && bundle.tabs.map.sourcePath) || '').trim();
  if (!biqPath) return '';
  return stripBiqExtension(getPathTail(biqPath));
}

function updateScenarioTitleChip(bundle = null) {
  if (!el.scenarioTitleChip || !state.settings) return;
  const shouldShow = state.settings.mode === 'scenario' && !!bundle;
  if (!shouldShow) {
    el.scenarioTitleChip.classList.add('hidden');
    el.scenarioTitleChip.textContent = 'Scenario: (not loaded)';
    el.scenarioTitleChip.removeAttribute('title');
    return;
  }
  const scenarioName = getLoadedScenarioName(bundle);
  if (!scenarioName) {
    el.scenarioTitleChip.classList.add('hidden');
    el.scenarioTitleChip.textContent = 'Scenario: (not loaded)';
    el.scenarioTitleChip.removeAttribute('title');
    return;
  }
  el.scenarioTitleChip.classList.remove('hidden');
  el.scenarioTitleChip.textContent = `Scenario: ${scenarioName}`;
  const biqSource = String((bundle.biq && bundle.biq.sourcePath) || (bundle.tabs && bundle.tabs.map && bundle.tabs.map.sourcePath) || '');
  if (biqSource) {
    el.scenarioTitleChip.title = biqSource;
  }
}

function updatePathsSummary() {
  if (!el.pathsSummary || !state.settings) return;
  const modeLabel = state.settings.mode === 'scenario' ? 'Scenario' : 'Standard Game';
  const c3x = state.settings.c3xPath ? getPathTail(state.settings.c3xPath) : '(no C3X folder)';
  const scenario = state.settings.scenarioPath ? getPathTail(state.settings.scenarioPath) : '(no scenario)';
  el.pathsSummary.textContent = state.settings.mode === 'scenario'
    ? `${modeLabel} | C3X: ${c3x} | BIQ: ${scenario}`
    : `${modeLabel} | C3X: ${c3x}`;
}

function updateScenarioSelectValue() {
  if (!el.modeScenarioSelect || !state.settings) return;
  const current = String(state.settings.scenarioPath || '').trim();
  const normalizedCurrent = current.toLowerCase();
  let hasExact = false;
  Array.from(el.modeScenarioSelect.options).forEach((opt) => {
    if (String(opt.value || '').toLowerCase() === normalizedCurrent && normalizedCurrent) {
      hasExact = true;
    }
  });
  if (state.settings.mode !== 'scenario') {
    el.modeScenarioSelect.value = '';
    return;
  }
  if (hasExact) {
    el.modeScenarioSelect.value = current;
    return;
  }
  el.modeScenarioSelect.value = '__manual__';
}

async function refreshScenarioSelectOptions() {
  if (!el.modeScenarioSelect || !state.settings) return;
  const manualValue = '__manual__';
  const selectedBefore = el.modeScenarioSelect.value;
  const scenarios = await window.c3xManager.listScenarios(state.settings.civ3Path || '');
  state.availableScenarios = Array.isArray(scenarios) ? scenarios : [];

  el.modeScenarioSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Scenario...';
  el.modeScenarioSelect.appendChild(placeholder);

  const manual = document.createElement('option');
  manual.value = manualValue;
  manual.textContent = 'Manual / Browse...';
  el.modeScenarioSelect.appendChild(manual);

  const addGroup = (source, label) => {
    const groupItems = state.availableScenarios.filter((s) => String(s.source || '') === source);
    if (groupItems.length === 0) return;
    const group = document.createElement('optgroup');
    group.label = label;
    groupItems.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.path;
      option.textContent = item.name || item.fileName || getPathTail(item.path);
      option.title = item.path;
      group.appendChild(option);
    });
    el.modeScenarioSelect.appendChild(group);
  };
  addGroup('Conquests', 'Conquests Folder');
  addGroup('Scenarios', 'Scenarios Folder');

  if (selectedBefore && Array.from(el.modeScenarioSelect.options).some((o) => o.value === selectedBefore)) {
    el.modeScenarioSelect.value = selectedBefore;
  }
  updateScenarioSelectValue();
}

function setPathsCollapsed(collapsed) {
  state.pathsCollapsed = !!collapsed;
  if (el.paths) el.paths.classList.toggle('collapsed', state.pathsCollapsed);
  if (el.pathsToggle) {
    el.pathsToggle.textContent = state.pathsCollapsed ? 'Show File Paths' : 'Hide File Paths';
  }
}

function updateModeState(bundle = null) {
  if (!state.settings) return;
  const modeLabel = state.settings.mode === 'scenario' ? 'Scenario' : 'Standard Game';
  if (el.modeStateBadge) {
    el.modeStateBadge.textContent = modeLabel;
  }
  if (state.settings.mode !== 'scenario') {
    updateScenarioTitleChip(null);
  } else if (!bundle) {
    updateScenarioTitleChip(null);
  } else {
    updateScenarioTitleChip(bundle);
  }
  if (!el.modeStateDetail) return;
  if (bundle && bundle.scenarioPath && state.settings.mode === 'scenario') {
    el.modeStateDetail.textContent = `Loaded from ${compactPathFromCiv3Root(bundle.scenarioPath)}`;
    updateScenarioTitleChip(bundle);
    return;
  }
  if (bundle && state.settings.mode !== 'scenario') {
    el.modeStateDetail.textContent = 'Loaded from standard game files';
    updateScenarioTitleChip(null);
    return;
  }
  if (state.settings.mode === 'scenario') {
    if (!state.settings.scenarioPath) {
      el.modeStateDetail.textContent = 'Waiting for scenario .biq';
    } else {
      el.modeStateDetail.textContent = `Selected ${getPathTail(state.settings.scenarioPath)} (not loaded yet)`;
    }
    return;
  }
  el.modeStateDetail.textContent = 'Ready to load standard game files';
  updateScenarioTitleChip(null);
}

function setLoadingUi(isLoading, text = 'Loading configs...') {
  state.isLoading = !!isLoading;
  if (el.loadingText) {
    el.loadingText.textContent = text;
  }
  if (el.loadingOverlay) {
    el.loadingOverlay.classList.toggle('hidden', !state.isLoading);
  }
  const controls = [
    el.modeGlobal,
    el.modeScenarioSelect,
    el.fontDown,
    el.fontUp,
    el.c3xPath,
    el.civ3Path,
    el.scenarioPath,
    el.pickC3x,
    el.pickCiv3,
    el.pickScenario,
    el.pathsToggle,
    el.backBtn,
    el.forwardBtn,
    el.saveBtn,
    el.undoBtn,
    el.resetBtn
  ];
  controls.forEach((control) => {
    if (control) control.disabled = state.isLoading;
  });
  updateNavButtons();
}

function clearBundleView() {
  state.bundle = null;
  state.trackDirty = false;
  state.baseFilter = '';
  state.cleanSnapshot = '';
  state.undoSnapshot = null;
  state.isDirty = false;
  refreshDirtyUi();
  if (el.tabs) el.tabs.innerHTML = '';
  if (el.tabContent) el.tabContent.innerHTML = '';
  if (el.workspace) el.workspace.classList.add('hidden');
  state.navHistory = [];
  state.navHistoryIndex = -1;
  updateNavButtons();
}

function cloneStateMap(mapLike) {
  return Object.assign({}, mapLike || {});
}

function captureViewSnapshot() {
  if (!state.bundle || !state.bundle.tabs) return null;
  const tabs = state.bundle.tabs;
  const fallbackTab = Object.keys(tabs)[0] || 'base';
  const activeTab = tabs[state.activeTab] ? state.activeTab : fallbackTab;
  return {
    activeTab,
    tabContentScrollTop: el.tabContent ? el.tabContent.scrollTop : state.tabContentScrollTop,
    sectionSelection: cloneStateMap(state.sectionSelection),
    referenceSelection: cloneStateMap(state.referenceSelection),
    referenceFilter: cloneStateMap(state.referenceFilter),
    referenceImprovementKind: cloneStateMap(state.referenceImprovementKind),
    biqSectionSelectionByTab: cloneStateMap(state.biqSectionSelectionByTab),
    biqRecordSelection: cloneStateMap(state.biqRecordSelection),
    biqMapSelectedTile: Number(state.biqMapSelectedTile || -1),
    biqMapLayer: String(state.biqMapLayer || 'terrain'),
    biqMapZoom: Number(state.biqMapZoom || 6)
  };
}

function snapshotKey(snapshot) {
  return JSON.stringify(snapshot || null);
}

function updateNavButtons() {
  if (el.backBtn) {
    el.backBtn.disabled = state.isLoading || state.navHistoryIndex <= 0;
  }
  if (el.forwardBtn) {
    el.forwardBtn.disabled = state.isLoading || state.navHistoryIndex < 0 || state.navHistoryIndex >= state.navHistory.length - 1;
  }
}

function pushNavigationSnapshot(snapshot) {
  if (!snapshot) {
    updateNavButtons();
    return;
  }
  const current = (state.navHistoryIndex >= 0 && state.navHistoryIndex < state.navHistory.length)
    ? state.navHistory[state.navHistoryIndex]
    : null;
  if (current && snapshotKey(current) === snapshotKey(snapshot)) {
    updateNavButtons();
    return;
  }
  if (state.navHistoryIndex < state.navHistory.length - 1) {
    state.navHistory = state.navHistory.slice(0, state.navHistoryIndex + 1);
  }
  state.navHistory.push(snapshot);
  const maxEntries = 120;
  if (state.navHistory.length > maxEntries) {
    const drop = state.navHistory.length - maxEntries;
    state.navHistory.splice(0, drop);
    state.navHistoryIndex = Math.max(0, state.navHistoryIndex - drop);
  }
  state.navHistoryIndex = state.navHistory.length - 1;
  updateNavButtons();
}

function resetNavigationHistory() {
  state.navHistory = [];
  state.navHistoryIndex = -1;
  const current = captureViewSnapshot();
  if (current) {
    state.navHistory = [current];
    state.navHistoryIndex = 0;
  }
  updateNavButtons();
}

function applyViewSnapshot(snapshot) {
  if (!snapshot || !state.bundle || !state.bundle.tabs) return;
  const tabs = state.bundle.tabs;
  const fallbackTab = Object.keys(tabs)[0] || 'base';
  state.activeTab = tabs[snapshot.activeTab] ? snapshot.activeTab : fallbackTab;
  state.sectionSelection = Object.assign({}, state.sectionSelection, cloneStateMap(snapshot.sectionSelection));
  state.referenceSelection = cloneStateMap(snapshot.referenceSelection);
  state.referenceFilter = cloneStateMap(snapshot.referenceFilter);
  state.referenceImprovementKind = cloneStateMap(snapshot.referenceImprovementKind);
  state.biqSectionSelectionByTab = cloneStateMap(snapshot.biqSectionSelectionByTab);
  state.biqRecordSelection = cloneStateMap(snapshot.biqRecordSelection);
  state.biqMapSelectedTile = Number.isFinite(snapshot.biqMapSelectedTile) ? snapshot.biqMapSelectedTile : -1;
  state.biqMapLayer = String(snapshot.biqMapLayer || 'terrain');
  state.biqMapZoom = Number.isFinite(snapshot.biqMapZoom) ? snapshot.biqMapZoom : state.biqMapZoom;
  state.tabContentScrollTop = Number.isFinite(snapshot.tabContentScrollTop) ? snapshot.tabContentScrollTop : 0;
  renderTabs();
  renderActiveTab({ preserveTabScroll: true });
  updateNavButtons();
}

function navigateBack() {
  if (state.navHistoryIndex <= 0) return;
  state.isApplyingHistory = true;
  state.navHistoryIndex -= 1;
  const target = state.navHistory[state.navHistoryIndex];
  applyViewSnapshot(target);
  state.isApplyingHistory = false;
  updateNavButtons();
}

function navigateForward() {
  if (state.navHistoryIndex < 0 || state.navHistoryIndex >= state.navHistory.length - 1) return;
  state.isApplyingHistory = true;
  state.navHistoryIndex += 1;
  const target = state.navHistory[state.navHistoryIndex];
  applyViewSnapshot(target);
  state.isApplyingHistory = false;
  updateNavButtons();
}

function navigateWithHistory(mutateState, renderOptions = { preserveTabScroll: true }) {
  if (!state.bundle || !state.bundle.tabs) return;
  const before = captureViewSnapshot();
  mutateState();
  const after = captureViewSnapshot();
  renderTabs();
  renderActiveTab(renderOptions);
  if (!state.isApplyingHistory && before && after && snapshotKey(before) !== snapshotKey(after)) {
    pushNavigationSnapshot(after);
  } else {
    updateNavButtons();
  }
}

function queueAutoReload(reason, delayMs = 320) {
  if (state.autoReloadTimer) {
    window.clearTimeout(state.autoReloadTimer);
  }
  state.autoReloadTimer = window.setTimeout(() => {
    state.autoReloadTimer = null;
    void loadBundleAndRender({ loadingText: reason || 'Loading configs...' });
  }, delayMs);
}

function setMode(mode) {
  state.settings.mode = mode;
  el.modeGlobal.classList.toggle('active', mode === 'global');
  if (el.modeScenarioSelect) {
    el.modeScenarioSelect.classList.toggle('active', mode === 'scenario');
  }
  el.scenarioPathRow.classList.toggle('hidden', mode !== 'scenario');
  document.body.classList.toggle('mode-standard', mode === 'global');
  document.body.classList.toggle('mode-scenario', mode === 'scenario');
  updateScenarioSelectValue();
  updatePathsSummary();
  updateModeState();
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
  updateScenarioSelectValue();
  updatePathsSummary();
}

function isBiqPath(value) {
  return /\.biq$/i.test(String(value || '').trim());
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
  filterInput.type = 'search';
  filterInput.classList.add('app-search-input');
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
          scenarioPath: state.settings.scenarioPath,
          scenarioPaths: getScenarioPreviewPaths(),
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
          scenarioPath: state.settings.scenarioPath,
          scenarioPaths: getScenarioPreviewPaths(),
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
        scenarioPath: state.settings.scenarioPath,
        scenarioPaths: getScenarioPreviewPaths(),
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
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    scenarioPaths: getScenarioPreviewPathsKey()
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
  const key = JSON.stringify({
    kind: 'list-thumb',
    tabKey,
    entry: entry.civilopediaKey,
    assetPath,
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    scenarioPaths: getScenarioPreviewPathsKey()
  });
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

  window.c3xManager.getPreview({
    kind: 'civilopediaIcon',
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    scenarioPaths: getScenarioPreviewPaths(),
    assetPath
  })
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

function toSlashPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function inferScenarioDirFromInput(inputPath) {
  const raw = toSlashPath(inputPath).trim();
  if (!raw) return '';
  if (/\.biq$/i.test(raw)) {
    const idx = raw.lastIndexOf('/');
    return idx > 0 ? raw.slice(0, idx) : '';
  }
  return raw;
}

function toPediaRelativeAssetPath(absPath) {
  const full = toSlashPath(absPath).trim();
  if (!full) return '';
  const civ3Root = toSlashPath(state.settings && state.settings.civ3Path || '');
  const scenarioDir = inferScenarioDirFromInput(state.settings && state.settings.scenarioPath || '');
  const roots = [];
  if (scenarioDir) roots.push(scenarioDir);
  if (civ3Root) {
    roots.push(`${civ3Root}/Conquests`);
    roots.push(`${civ3Root}/civ3PTW`);
    roots.push(civ3Root);
  }
  for (const root of roots) {
    const r = toSlashPath(root).replace(/\/+$/, '');
    if (!r) continue;
    if (full === r) return '';
    if (full.startsWith(`${r}/`)) {
      return full.slice(r.length + 1);
    }
  }
  return full;
}

function normalizeRelativePath(value) {
  return String(value || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\.?[\\/]+/, '')
    .replace(/\\/g, '/');
}

function getParentPath(rawPath) {
  const p = toSlashPath(rawPath).replace(/\/+$/, '');
  const idx = p.lastIndexOf('/');
  if (idx <= 0) return '';
  return p.slice(0, idx);
}

async function resolveExistingAssetPath(assetPath) {
  const rel = normalizeRelativePath(assetPath);
  if (!rel) return '';
  const roots = [];
  const scenarioDir = inferScenarioDirFromInput(state.settings && state.settings.scenarioPath || '');
  const civ3Root = toSlashPath(state.settings && state.settings.civ3Path || '');
  if (scenarioDir) roots.push(scenarioDir);
  if (civ3Root) {
    roots.push(`${civ3Root}/Conquests`);
    roots.push(`${civ3Root}/civ3PTW`);
    roots.push(civ3Root);
  }
  for (const root of roots) {
    const abs = `${root.replace(/\/+$/, '')}/${rel}`;
    try {
      if (await window.c3xManager.pathExists(abs)) return abs;
    } catch (_err) {
      // ignore
    }
  }
  return '';
}

function formatSourceInfo(meta, fallbackLabel = 'Unknown') {
  const src = meta || {};
  const source = String(src.source || fallbackLabel);
  const readPath = String(src.readPath || '').trim();
  const writePath = String(src.writePath || '').trim();
  const readCompact = readPath ? compactPathFromCiv3Root(readPath) : '';
  const writeCompact = writePath ? compactPathFromCiv3Root(writePath) : '';
  const lines = [`Source: ${source}`];
  if (readCompact && writeCompact && readCompact !== writeCompact) {
    lines.push(`File: ${readCompact}`);
    lines.push(`Save File: ${writeCompact}`);
  } else if (readCompact || writeCompact) {
    lines.push(`File: ${readCompact || writeCompact}`);
  } else {
    lines.push('File: (not available)');
  }
  return lines.join('\n');
}

function ensureRichTooltipNode() {
  if (richTooltip.node && richTooltip.node.isConnected) return richTooltip.node;
  const node = document.createElement('div');
  node.id = 'rich-tooltip';
  node.className = 'rich-tooltip hidden';
  document.body.appendChild(node);
  richTooltip.node = node;
  return node;
}

function showRichTooltip(text, x, y) {
  const node = ensureRichTooltipNode();
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  node.innerHTML = '';
  const rows = [];
  lines.forEach((line) => {
    const colon = line.indexOf(':');
    if (colon > 0) {
      rows.push({
        key: line.slice(0, colon).trim(),
        value: line.slice(colon + 1).trim()
      });
    } else {
      rows.push({ key: 'Info', value: line });
    }
  });
  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'rich-tooltip-row';
    const keyEl = document.createElement('span');
    keyEl.className = 'rich-tooltip-key';
    keyEl.textContent = `${row.key}:`;
    const valueEl = document.createElement('span');
    valueEl.className = 'rich-tooltip-value';
    valueEl.textContent = row.value || '(none)';
    rowEl.appendChild(keyEl);
    rowEl.appendChild(valueEl);
    node.appendChild(rowEl);
  });
  node.classList.remove('hidden');
  const pad = 14;
  const rect = node.getBoundingClientRect();
  const maxX = Math.max(12, window.innerWidth - rect.width - 12);
  const maxY = Math.max(12, window.innerHeight - rect.height - 12);
  node.style.left = `${Math.min(maxX, Math.max(12, x + pad))}px`;
  node.style.top = `${Math.min(maxY, Math.max(12, y + pad))}px`;
}

function hideRichTooltip() {
  if (!richTooltip.node) return;
  richTooltip.node.classList.add('hidden');
}

function attachRichTooltip(target, text) {
  const tip = String(text || '').trim();
  if (!target || !tip) return;
  target.classList.add('help-hover-target');
  target.addEventListener('mouseenter', (ev) => {
    richTooltip.active = true;
    showRichTooltip(tip, ev.clientX, ev.clientY);
  });
  target.addEventListener('mousemove', (ev) => {
    if (!richTooltip.active) return;
    showRichTooltip(tip, ev.clientX, ev.clientY);
  });
  target.addEventListener('mouseleave', () => {
    richTooltip.active = false;
    hideRichTooltip();
  });
}

function parseIntFromDisplayValue(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (/^-?\d+$/.test(text)) return Number.parseInt(text, 10);
  const m = text.match(/\((-?\d+)\)\s*$/);
  if (m) return Number.parseInt(m[1], 10);
  return null;
}

const BIQ_FIELD_REFS = {
  resources: { prerequisite: 'technologies' },
  improvements: {
    reqimprovement: 'improvements',
    reqgovernment: 'governments',
    obsoleteby: 'technologies',
    reqresource1: 'resources',
    reqresource2: 'resources',
    unitproduced: 'units'
  },
  units: {
    requiredtech: 'technologies',
    upgradeto: 'units',
    requiredresource1: 'resources',
    requiredresource2: 'resources',
    requiredresource3: 'resources',
    enslaveresultsin: 'units',
    enslaveresultsinto: 'units'
  },
  civilizations: {
    freetech1index: 'technologies',
    freetech2index: 'technologies',
    freetech3index: 'technologies',
    freetech4index: 'technologies',
    shunnedgovernment: 'governments',
    favoritegovernment: 'governments',
    kingunit: 'units'
  },
  governments: {
    prerequisitetechnology: 'technologies',
    immuneto: 'governments'
  },
  technologies: {
    era: 'eras',
    prerequisite1: 'technologies',
    prerequisite2: 'technologies',
    prerequisite3: 'technologies',
    prerequisite4: 'technologies'
  }
};

const BIQ_FIELD_ENUMS = {
  resources: {
    type: [
      { value: '0', label: 'Bonus' },
      { value: '1', label: 'Luxury' },
      { value: '2', label: 'Strategic' }
    ]
  },
  units: {
    unitclass: [
      { value: '0', label: 'Land' },
      { value: '1', label: 'Sea' },
      { value: '2', label: 'Air' }
    ]
  },
  governments: {
    corruption: [
      { value: '0', label: 'Minimal' },
      { value: '1', label: 'Nuisance' },
      { value: '2', label: 'Problematic' },
      { value: '3', label: 'Rampant' },
      { value: '4', label: 'Catastrophic' },
      { value: '5', label: 'Communal' },
      { value: '6', label: 'Off' }
    ],
    hurrying: [
      { value: '0', label: 'Impossible' },
      { value: '1', label: 'Forced Labor' },
      { value: '2', label: 'Paid Labor' }
    ],
    warweariness: [
      { value: '0', label: 'None' },
      { value: '1', label: 'Low' },
      { value: '2', label: 'High' }
    ]
  },
  civilizations: {
    culturegroup: [
      { value: '-1', label: 'None' },
      { value: '0', label: 'American' },
      { value: '1', label: 'European' },
      { value: '2', label: 'Mediterranean' },
      { value: '3', label: 'Mid East' },
      { value: '4', label: 'Asian' }
    ],
    aggressionlevel: [
      { value: '-2', label: 'Very Low' },
      { value: '-1', label: 'Low' },
      { value: '0', label: 'Neutral' },
      { value: '1', label: 'High' },
      { value: '2', label: 'Very High' }
    ]
  }
};

const BIQ_FIELD_HIDDEN = {
  all: new Set(['byte_length', 'datalength', 'data_length', 'note']),
  resources: new Set(['icon', 'question_mark', 'prerequisite']),
  improvements: new Set(['question_mark', 'reqadvance', 'obsoleteby']),
  units: new Set(['iconindex', 'question_mark', 'requiredtech']),
  technologies: new Set(['advanceicon', 'question_mark', 'prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4']),
  governments: new Set(['question_mark', 'prerequisitetechnology']),
  civilizations: new Set([
    'question_mark',
    'freetech1index',
    'freetech2index',
    'freetech3index',
    'freetech4index',
    'bonuses',
    'civilizationtraits',
    'buildoften',
    'buildnever',
    'governorsettings',
    'flavors',
    'plurality',
    'uniquecivilizationcounter',
    'uniquecolor'
  ]),
  eras: new Set(['question_mark'])
};

const BIQ_STRUCTURE_FIELD_HIDDEN = {
  all: new Set(['byte_length', 'data_length', 'datalength', 'note', 'civilopediaentry']),
  GAME: new Set(['playable_civ_ids']),
  LEAD: new Set(['numberofdifferentstartunits', 'numberofstartingtechnologies']),
  RULE: new Set([]),
  TERR: new Set([]),
  TFRM: new Set([]),
  WSIZ: new Set([]),
  WCHR: new Set([]),
  ERAS: new Set([]),
  DIFF: new Set([]),
  ESPN: new Set([]),
  CTZN: new Set([]),
  CULT: new Set([]),
  EXPR: new Set([]),
  FLAV: new Set([])
};

const BIQ_SECTION_TO_REFERENCE_TAB = {
  RACE: 'civilizations',
  TECH: 'technologies',
  GOOD: 'resources',
  BLDG: 'improvements',
  GOVT: 'governments',
  PRTO: 'units'
};

const BIQ_SECTION_FRIENDLY_NAMES = {
  GAME: 'Scenario Setup',
  LEAD: 'Players',
  TERR: 'Terrain Types',
  TFRM: 'Worker Jobs',
  WSIZ: 'World Sizes',
  WCHR: 'World Characteristics',
  ERAS: 'Eras',
  RULE: 'Core Rules',
  DIFF: 'Difficulty Levels',
  ESPN: 'Espionage',
  CTZN: 'Citizens',
  CULT: 'Culture',
  EXPR: 'Experience',
  FLAV: 'AI Flavors'
};

function getFriendlyBiqSectionTitle(section) {
  const code = String((section && section.code) || '').toUpperCase();
  return BIQ_SECTION_FRIENDLY_NAMES[code] || String((section && section.title) || code || 'Section');
}

function makeBiqSectionIndexOptions(sectionCode, oneBased = false) {
  const code = String(sectionCode || '').toUpperCase();
  const biq = state.bundle && state.bundle.biq;
  const sections = biq && Array.isArray(biq.sections) ? biq.sections : [];
  const section = sections.find((s) => String(s.code || '').toUpperCase() === code);
  if (!section || !Array.isArray(section.records)) return [];
  const targetTabKey = BIQ_SECTION_TO_REFERENCE_TAB[code] || '';
  const targetTab = targetTabKey && state.bundle && state.bundle.tabs && state.bundle.tabs[targetTabKey];
  const targetEntries = targetTab && Array.isArray(targetTab.entries) ? targetTab.entries : [];
  const entryByIndex = new Map();
  targetEntries.forEach((entry, fallbackIdx) => {
    const biqIndex = Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : fallbackIdx;
    entryByIndex.set(biqIndex, entry);
  });
  return section.records.map((rec, idx) => ({
    value: String(oneBased ? (idx + 1) : idx),
    label: String(rec.name || `${code} ${idx + 1}`),
    entry: entryByIndex.get(idx) || null
  }));
}

function getBiqStructureRefSpec(sectionCode, baseKey) {
  const code = String(sectionCode || '').toUpperCase();
  const base = String(baseKey || '').toLowerCase();
  const unitRefKeys = new Set(['advancedbarbarian', 'basicbarbarian', 'barbarianseaunit', 'battlecreatedunit', 'buildarmyunit', 'scout', 'slave', 'startunit1', 'startunit2', 'flagunit']);
  if ((code === 'GAME' || code === 'RULE') && unitRefKeys.has(base)) return { section: 'PRTO', oneBased: false };
  if ((code === 'GAME' || code === 'RULE') && base === 'defaultmoneyresource') return { section: 'GOOD', oneBased: false };
  if ((code === 'GAME' || code === 'RULE') && base === 'defaultdifficultylevel') return { section: 'DIFF', oneBased: false };
  if (code === 'GAME' && base.startsWith('playable_civ')) return { section: 'RACE', oneBased: false };
  if (code === 'LEAD' && base === 'civ') return { section: 'RACE', oneBased: false };
  if (code === 'LEAD' && base === 'government') return { section: 'GOVT', oneBased: false };
  if (code === 'LEAD' && base === 'initialera') return { section: 'ERAS', oneBased: false };
  if (code === 'TERR' && base === 'workerjob') return { section: 'TFRM', oneBased: false };
  if (code === 'TERR' && base === 'pollutioneffect') return { section: 'TERR', oneBased: false };
  if (code === 'CTZN' && base === 'prerequisite') return { section: 'TECH', oneBased: false };
  return null;
}

function shouldHideBiqStructureField(sectionCode, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (!base) return true;
  if (BIQ_STRUCTURE_FIELD_HIDDEN.all.has(base) || BIQ_STRUCTURE_FIELD_HIDDEN.all.has(canon)) return true;
  const sectionHidden = BIQ_STRUCTURE_FIELD_HIDDEN[String(sectionCode || '').toUpperCase()];
  if (sectionHidden && (sectionHidden.has(base) || sectionHidden.has(canon))) return true;
  return false;
}

const REFERENCE_RULE_SCHEMAS = {
  resources: {
    order: ['type', 'prerequisite', 'appearanceratio', 'disapperanceprobability', 'foodbonus', 'shieldsbonus', 'commercebonus'],
    fields: {
      type: { group: 'Identity', control: 'select' },
      prerequisite: { group: 'Prerequisites', control: 'reference' },
      appearanceratio: { group: 'Map Placement', control: 'number', min: 0 },
      disapperanceprobability: { group: 'Map Placement', control: 'number', min: 0 },
      foodbonus: { group: 'Tile Yields', control: 'number' },
      shieldsbonus: { group: 'Tile Yields', control: 'number' },
      commercebonus: { group: 'Tile Yields', control: 'number' }
    }
  },
  technologies: {
    order: ['cost', 'era', 'prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4', 'x', 'y'],
    fields: {
      cost: { group: 'Core', control: 'number', min: 0 },
      era: { group: 'Core', control: 'reference' },
      prerequisite1: { group: 'Prerequisites', control: 'reference' },
      prerequisite2: { group: 'Prerequisites', control: 'reference' },
      prerequisite3: { group: 'Prerequisites', control: 'reference' },
      prerequisite4: { group: 'Prerequisites', control: 'reference' },
      x: { group: 'Tech Tree Position', control: 'number', min: 0 },
      y: { group: 'Tech Tree Position', control: 'number', min: 0 }
    }
  },
  improvements: {
    order: ['reqadvance', 'obsoleteby', 'reqresource1', 'reqresource2', 'reqgovernment', 'reqimprovement', 'unitproduced', 'unitfrequency'],
    fields: {
      reqadvance: { group: 'Prerequisites', control: 'reference' },
      obsoleteby: { group: 'Prerequisites', control: 'reference' },
      reqresource1: { group: 'Prerequisites', control: 'reference' },
      reqresource2: { group: 'Prerequisites', control: 'reference' },
      reqgovernment: { group: 'Prerequisites', control: 'reference' },
      reqimprovement: { group: 'Prerequisites', control: 'reference' },
      unitproduced: { group: 'Auto-Produced Unit', control: 'reference' },
      unitfrequency: { group: 'Auto-Produced Unit', control: 'number', min: 0 }
    }
  },
  governments: {
    order: ['prerequisitetechnology', 'corruption', 'warweariness', 'hurrying', 'freeunitspertown', 'freeunitspercity', 'freeunitspermetropolis', 'costperunit'],
    fields: {
      prerequisitetechnology: { group: 'Core', control: 'reference' },
      corruption: { group: 'Core', control: 'select' },
      warweariness: { group: 'Core', control: 'select' },
      hurrying: { group: 'Core', control: 'select' },
      freeunitspertown: { group: 'Unit Support', control: 'number' },
      freeunitspercity: { group: 'Unit Support', control: 'number' },
      freeunitspermetropolis: { group: 'Unit Support', control: 'number' },
      costperunit: { group: 'Unit Support', control: 'number' }
    }
  },
  civilizations: {
    order: ['leadername', 'leadertitle', 'culturegroup', 'favoritegovernment', 'shunnedgovernment', 'freetech1index', 'freetech2index', 'freetech3index', 'freetech4index', 'aggressionlevel'],
    fields: {
      leadername: { group: 'Identity', control: 'text' },
      leadertitle: { group: 'Identity', control: 'text' },
      culturegroup: { group: 'Identity', control: 'select' },
      favoritegovernment: { group: 'Governments', control: 'reference' },
      shunnedgovernment: { group: 'Governments', control: 'reference' },
      freetech1index: { group: 'Free Techs', control: 'reference' },
      freetech2index: { group: 'Free Techs', control: 'reference' },
      freetech3index: { group: 'Free Techs', control: 'reference' },
      freetech4index: { group: 'Free Techs', control: 'reference' },
      aggressionlevel: { group: 'AI', control: 'select' }
    }
  },
  units: {
    order: ['requiredtech', 'upgradeto', 'requiredresource1', 'requiredresource2', 'requiredresource3', 'unitclass', 'attack', 'defense', 'bombard', 'cost'],
    fields: {
      requiredtech: { group: 'Prerequisites', control: 'reference' },
      upgradeto: { group: 'Upgrades', control: 'reference' },
      requiredresource1: { group: 'Prerequisites', control: 'reference' },
      requiredresource2: { group: 'Prerequisites', control: 'reference' },
      requiredresource3: { group: 'Prerequisites', control: 'reference' },
      unitclass: { group: 'Identity', control: 'select' },
      attack: { group: 'Combat', control: 'number', min: 0 },
      defense: { group: 'Combat', control: 'number', min: 0 },
      bombard: { group: 'Combat', control: 'number', min: 0 },
      cost: { group: 'Costs', control: 'number', min: 0 }
    }
  }
};

function shouldHideBiqField(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (!base) return true;
  if ((BIQ_FIELD_HIDDEN.all && (BIQ_FIELD_HIDDEN.all.has(base) || BIQ_FIELD_HIDDEN.all.has(canon)))) return true;
  const tabHidden = BIQ_FIELD_HIDDEN[tabKey];
  return !!(tabHidden && (tabHidden.has(base) || tabHidden.has(canon)));
}

function getRuleFieldSpec(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const schema = REFERENCE_RULE_SCHEMAS[tabKey] || null;
  if (!schema || !schema.fields) return null;
  return schema.fields[base] || null;
}

function getRuleFieldGroup(tabKey, field) {
  const spec = getRuleFieldSpec(tabKey, field);
  if (spec && spec.group) return spec.group;
  return 'Other';
}

function getRuleFieldOrder(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const schema = REFERENCE_RULE_SCHEMAS[tabKey] || null;
  if (!schema || !Array.isArray(schema.order)) return Number.MAX_SAFE_INTEGER;
  const idx = schema.order.indexOf(base);
  return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
}

function getReadableSetterReason(field) {
  const setter = String(field && field.expectedSetter || '').trim();
  if (!setter) return 'No writable BIQ bridge setter found.';
  return `No writable BIQ bridge setter found for ${setter}.`;
}

function makeIndexOptionsForTab(tabKey) {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
  if (!tab || !Array.isArray(tab.entries)) return [];
  return tab.entries.map((entry, idx) => ({
    value: String(Number.isFinite(entry.biqIndex) ? entry.biqIndex : idx),
    label: String(entry.name || ''),
    thumbPath: entry.thumbPath || '',
    entry
  }));
}

function getReferenceOptionsForField(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const map = BIQ_FIELD_REFS[tabKey] || {};
  const target = map[base];
  if (!target) return [];
  if (target === 'eras') {
    const names = ['Ancient', 'Middle Ages', 'Industrial', 'Modern'];
    return names.map((name, idx) => ({ value: String(idx), label: `${name} (${idx})` }));
  }
  return makeIndexOptionsForTab(target);
}

function getEnumOptionsForField(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const enums = BIQ_FIELD_ENUMS[tabKey] || {};
  return enums[base] || [];
}

function formatFieldValueForDisplay(tabKey, field) {
  const raw = String(field && field.value || '').trim();
  if (!raw) return '(none)';
  const parsed = parseIntFromDisplayValue(raw);
  const enumOptions = getEnumOptionsForField(tabKey, field);
  if (parsed != null && enumOptions.length > 0) {
    const m = enumOptions.find((opt) => Number.parseInt(String(opt.value), 10) === parsed);
    if (m) return m.label;
  }
  const refOptions = getReferenceOptionsForField(tabKey, field);
  if (parsed != null && refOptions.length > 0) {
    const m = refOptions.find((opt) => Number.parseInt(String(opt.value), 10) === parsed);
    if (m) return m.label;
  }
  if (raw === '-1') return '(none)';
  return raw;
}

function getTechEntries() {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs.technologies;
  if (!tab || !Array.isArray(tab.entries)) return [];
  return tab.entries;
}

function getTechLabelByIndex(index) {
  if (!Number.isFinite(index) || index < 0) return '(none)';
  const tech = getTechEntries().find((t, fallbackIdx) => {
    const biqIdx = Number.isFinite(t.biqIndex) ? t.biqIndex : fallbackIdx;
    return biqIdx === index;
  });
  return tech ? String(tech.name || '') : String(index);
}

function findOptionByValue(options, value) {
  const normalized = String(value ?? '').trim();
  if (!Array.isArray(options)) return null;
  return options.find((opt) => String(opt && opt.value) === normalized) || null;
}

function createReferencePicker(config) {
  const opts = config || {};
  const options = Array.isArray(opts.options) ? opts.options : [];
  const targetTabKey = String(opts.targetTabKey || '').trim();
  const noneLabel = String(opts.noneLabel || '(none)');
  const searchPlaceholder = String(opts.searchPlaceholder || 'Search...');
  const currentValue = String(opts.currentValue ?? '-1');
  const onSelect = typeof opts.onSelect === 'function' ? opts.onSelect : null;

  const normalizedOptions = [];
  normalizedOptions.push({ value: '-1', label: noneLabel, entry: null });
  options.forEach((opt) => {
    if (!opt) return;
    const value = String(opt.value ?? '');
    if (value === '-1') return;
    normalizedOptions.push({
      value,
      label: String(opt.label || value),
      entry: opt.entry || null
    });
  });

  const wrap = document.createElement('div');
  wrap.className = 'tech-picker';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tech-picker-btn';
  const buttonThumb = document.createElement('span');
  buttonThumb.className = 'entry-thumb';
  const buttonText = document.createElement('span');
  const renderButton = (value) => {
    const selected = findOptionByValue(normalizedOptions, value) || normalizedOptions[0];
    buttonText.textContent = selected ? String(selected.label || noneLabel) : noneLabel;
    buttonThumb.innerHTML = '';
    if (selected && selected.entry && targetTabKey) {
      loadReferenceListThumbnail(targetTabKey, selected.entry, buttonThumb);
    }
  };
  renderButton(currentValue);
  button.appendChild(buttonThumb);
  button.appendChild(buttonText);
  wrap.appendChild(button);

  const menu = document.createElement('div');
  menu.className = 'tech-picker-menu hidden';
  const search = document.createElement('input');
  search.type = 'search';
  search.classList.add('app-search-input');
  search.className = 'tech-picker-search';
  search.placeholder = searchPlaceholder;
  menu.appendChild(search);
  const listWrap = document.createElement('div');
  listWrap.className = 'tech-picker-list';
  normalizedOptions.forEach((opt) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'tech-picker-row';
    row.dataset.search = String(opt.label || '').toLowerCase();
    if (opt.entry && targetTabKey) {
      const thumb = document.createElement('span');
      thumb.className = 'entry-thumb';
      row.appendChild(thumb);
      loadReferenceListThumbnail(targetTabKey, opt.entry, thumb);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'entry-thumb';
      row.appendChild(spacer);
    }
    const text = document.createElement('span');
    text.textContent = String(opt.label || '');
    row.appendChild(text);
    row.addEventListener('click', (ev) => {
      ev.preventDefault();
      renderButton(opt.value);
      menu.classList.add('hidden');
      if (onSelect) onSelect(opt.value);
    });
    listWrap.appendChild(row);
  });
  menu.appendChild(listWrap);
  wrap.appendChild(menu);

  button.addEventListener('click', (ev) => {
    ev.preventDefault();
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
      search.value = '';
      Array.from(listWrap.querySelectorAll('.tech-picker-row')).forEach((row) => row.classList.remove('hidden'));
      search.focus();
    }
  });
  search.addEventListener('input', () => {
    const needle = search.value.trim().toLowerCase();
    Array.from(listWrap.querySelectorAll('.tech-picker-row')).forEach((row) => {
      const hay = String(row.dataset.search || '');
      row.classList.toggle('hidden', !!needle && !hay.includes(needle));
    });
  });
  document.addEventListener('click', (ev) => {
    if (!wrap.contains(ev.target)) menu.classList.add('hidden');
  });
  return wrap;
}

function isLikelyBooleanField(field) {
  const raw = String(field && field.value || '').toLowerCase().trim();
  if (raw === 'true' || raw === 'false') return true;
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  return base.startsWith('is') || base.startsWith('can') || base.startsWith('allow') || base.startsWith('enable') || base.startsWith('has');
}

function getBiqFieldByBaseKey(entry, baseKey) {
  const target = String(baseKey || '').toLowerCase();
  if (!entry || !Array.isArray(entry.biqFields) || !target) return null;
  return entry.biqFields.find((f) => String(f.baseKey || f.key || '').toLowerCase() === target) || null;
}

function buildIdentityTechContext(tabKey, entry) {
  const ctx = {
    label: 'Tech Notes',
    values: Array.isArray(entry && entry.techDependencies) ? entry.techDependencies : [],
    fields: [],
    editable: false
  };
  if (!entry || !Array.isArray(entry.biqFields)) return ctx;
  if (tabKey === 'civilizations') {
    const keys = ['freetech1index', 'freetech2index', 'freetech3index', 'freetech4index'];
    const fields = keys.map((k) => getBiqFieldByBaseKey(entry, k)).filter(Boolean);
    ctx.label = 'Starting Techs';
    ctx.fields = fields;
    ctx.values = fields.map((f) => String(f.value || '').trim()).filter((v) => v && !/^none$/i.test(v) && v !== '-1');
    ctx.editable = fields.some((f) => !!f.editable);
    return ctx;
  }
  if (tabKey === 'technologies') {
    const keys = ['prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4'];
    const fields = keys.map((k) => getBiqFieldByBaseKey(entry, k)).filter(Boolean);
    ctx.label = 'Prerequisite Techs';
    ctx.fields = fields;
    ctx.values = fields.map((f) => String(f.value || '').trim()).filter((v) => v && !/^none$/i.test(v) && v !== '-1');
    ctx.editable = fields.some((f) => !!f.editable);
    return ctx;
  }
  if (tabKey === 'resources') {
    const f = getBiqFieldByBaseKey(entry, 'prerequisite');
    if (f) {
      ctx.label = 'Required Tech';
      ctx.fields = [f];
      ctx.values = String(f.value || '').trim() && !/^none$/i.test(String(f.value || '')) ? [String(f.value || '').trim()] : [];
      ctx.editable = !!f.editable;
    }
    return ctx;
  }
  if (tabKey === 'improvements') {
    const req = getBiqFieldByBaseKey(entry, 'reqadvance');
    const obs = getBiqFieldByBaseKey(entry, 'obsoleteby');
    const fields = [req, obs].filter(Boolean);
    ctx.label = 'Tech Requirements';
    ctx.fields = fields;
    ctx.values = fields
      .map((f) => String(f.value || '').trim())
      .filter((v) => v && !/^none$/i.test(v) && v !== '-1');
    ctx.editable = fields.some((f) => !!f.editable);
    return ctx;
  }
  if (tabKey === 'units') {
    const f = getBiqFieldByBaseKey(entry, 'requiredtech');
    if (f) {
      ctx.label = 'Required Tech';
      ctx.fields = [f];
      ctx.values = String(f.value || '').trim() && !/^none$/i.test(String(f.value || '')) ? [String(f.value || '').trim()] : [];
      ctx.editable = !!f.editable;
    }
    return ctx;
  }
  if (tabKey === 'governments') {
    const f = getBiqFieldByBaseKey(entry, 'prerequisitetechnology');
    if (f) {
      ctx.label = 'Required Tech';
      ctx.fields = [f];
      ctx.values = String(f.value || '').trim() && !/^none$/i.test(String(f.value || '')) ? [String(f.value || '').trim()] : [];
      ctx.editable = !!f.editable;
    }
    return ctx;
  }
  return ctx;
}

function formatIdentityTechValues(techCtx) {
  if (!techCtx || !Array.isArray(techCtx.fields) || techCtx.fields.length === 0) {
    return Array.isArray(techCtx && techCtx.values) ? techCtx.values : [];
  }
  return techCtx.fields
    .map((field) => {
      const idx = parseIntFromDisplayValue(field.value);
      return idx == null || idx < 0 ? '' : getTechLabelByIndex(idx);
    })
    .filter(Boolean);
}

function createTechIdentityPicker(field, onChange) {
  const techOptions = getTechEntries().map((tech, fallbackIdx) => ({
    value: String(Number.isFinite(tech.biqIndex) ? tech.biqIndex : fallbackIdx),
    label: String(tech.name || ''),
    entry: tech
  }));
  return createReferencePicker({
    options: techOptions,
    targetTabKey: 'technologies',
    currentValue: field.value,
    searchPlaceholder: 'Search tech...',
    noneLabel: '(none)',
    onSelect: (value) => {
      rememberUndoSnapshot();
      field.value = String(value);
      if (onChange) onChange();
    }
  });
}

function mapCivilopediaKeyToTabKey(civilopediaKey) {
  const key = String(civilopediaKey || '').toUpperCase();
  if (key.startsWith('RACE_')) return 'civilizations';
  if (key.startsWith('TECH_')) return 'technologies';
  if (key.startsWith('GOOD_')) return 'resources';
  if (key.startsWith('BLDG_')) return 'improvements';
  if (key.startsWith('GOVT_')) return 'governments';
  if (key.startsWith('PRTO_')) return 'units';
  if (key.startsWith('GCON_')) return 'gameConcepts';
  if (key.startsWith('TERR_') || key.startsWith('TFRM_')) return 'terrain';
  return null;
}

function findTerrainRecordSelectionByCivilopediaKey(civilopediaKey) {
  const key = String(civilopediaKey || '').trim().toUpperCase();
  if (!key) return null;
  const terrainTab = state.bundle && state.bundle.tabs && state.bundle.tabs.terrain;
  if (!terrainTab || !Array.isArray(terrainTab.sections)) return null;
  const targetSectionCode = key.startsWith('TFRM_') ? 'TFRM' : (key.startsWith('TERR_') ? 'TERR' : '');
  if (!targetSectionCode) return null;
  const sectionIndex = terrainTab.sections.findIndex((section) => String(section && section.code || '').toUpperCase() === targetSectionCode);
  if (sectionIndex < 0) return null;
  const section = terrainTab.sections[sectionIndex];
  const records = Array.isArray(section && section.records) ? section.records : [];
  const recordIndex = records.findIndex((record) => {
    const fields = Array.isArray(record && record.fields) ? record.fields : [];
    const civField = fields.find((f) => String((f && (f.baseKey || f.key)) || '').toLowerCase() === 'civilopediaentry');
    const value = String(civField && civField.value || '').trim().toUpperCase();
    return value === key;
  });
  if (recordIndex < 0) return null;
  return { section, sectionIndex, recordIndex };
}

function navigateToCivilopediaKey(civilopediaKey) {
  if (!state.bundle || !state.bundle.tabs) return false;
  const tabKey = mapCivilopediaKeyToTabKey(civilopediaKey);
  if (!tabKey || !state.bundle.tabs[tabKey]) return false;
  if (tabKey === 'terrain') {
    const hit = findTerrainRecordSelectionByCivilopediaKey(civilopediaKey);
    if (!hit) return false;
    navigateWithHistory(() => {
      state.activeTab = 'terrain';
      state.biqSectionSelectionByTab.terrain = hit.sectionIndex;
      state.biqRecordSelection[hit.section.id] = hit.recordIndex;
    }, { preserveTabScroll: false });
    return true;
  }
  if (!Array.isArray(state.bundle.tabs[tabKey].entries)) return false;
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
  navigateWithHistory(() => {
    state.activeTab = tabKey;
    state.referenceSelection[tabKey] = idx;
  }, { preserveTabScroll: false });
  return true;
}

function renderCivilopediaRichText(container, text) {
  const lines = String(text || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    container.textContent = '(none)';
    return;
  }
  const linkPattern = /\$LINK<([^=<>]+)=([^<>]+)>/g;
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
      const key = String(match[2] || '').trim();
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

function createCivilopediaEditorBlock({ entry, fieldKey, titleText, sourceMeta, emptyText }) {
  const editorKey = `${String(entry && entry.civilopediaKey || '').toUpperCase()}:${fieldKey}`;
  const isEditing = !!state.civilopediaEditorOpen[editorKey];
  const block = document.createElement('div');
  block.className = 'section-card source-section';
  block.style.marginTop = '8px';
  const title = document.createElement('div');
  title.className = 'section-top';
  const left = document.createElement('strong');
  left.textContent = titleText;
  title.appendChild(left);
  const controls = document.createElement('div');
  controls.className = 'civilopedia-editor-controls';
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'ghost civilopedia-edit-toggle';
  editBtn.textContent = isEditing ? 'Done' : 'Edit';
  editBtn.addEventListener('click', () => {
    state.civilopediaEditorOpen[editorKey] = !isEditing;
    renderActiveTab({ preserveTabScroll: true });
  });
  controls.appendChild(editBtn);
  title.appendChild(controls);
  attachRichTooltip(title, formatSourceInfo(sourceMeta, 'Civilopedia'));
  block.appendChild(title);

  if (!isEditing) {
    const value = String(entry[fieldKey] || '').trim();
    if (value) {
      renderCivilopediaRichText(block, value);
    } else {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = emptyText || '(empty)';
      block.appendChild(hint);
    }
    return block;
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'civilopedia-editor-toolbar';
  const insertLinkBtn = document.createElement('button');
  insertLinkBtn.type = 'button';
  insertLinkBtn.className = 'ghost civilopedia-link-btn';
  insertLinkBtn.textContent = 'Insert Link';
  toolbar.appendChild(insertLinkBtn);

  if (typeof state.civilopediaPreviewVisible[editorKey] === 'undefined') {
    state.civilopediaPreviewVisible[editorKey] = true;
  }
  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'ghost civilopedia-preview-btn';
  previewBtn.textContent = state.civilopediaPreviewVisible[editorKey] ? 'Hide Preview' : 'Show Preview';
  previewBtn.addEventListener('click', () => {
    state.civilopediaPreviewVisible[editorKey] = !state.civilopediaPreviewVisible[editorKey];
    renderActiveTab({ preserveTabScroll: true });
  });
  toolbar.appendChild(previewBtn);
  block.appendChild(toolbar);

  const linkPanel = document.createElement('div');
  linkPanel.className = 'civilopedia-link-panel hidden';
  const linkSearch = document.createElement('input');
  linkSearch.type = 'search';
  linkSearch.classList.add('app-search-input');
  linkSearch.placeholder = 'Search Civopedia key or name...';
  linkSearch.className = 'civilopedia-link-search';
  linkPanel.appendChild(linkSearch);
  const linkList = document.createElement('div');
  linkList.className = 'civilopedia-link-list';
  linkPanel.appendChild(linkList);
  block.appendChild(linkPanel);

  const editor = document.createElement('textarea');
  editor.className = 'civilopedia-editor';
  editor.rows = 7;
  editor.placeholder = emptyText || '';
  editor.value = String(entry[fieldKey] || '');
  editor.addEventListener('input', () => {
    rememberUndoSnapshot();
    entry[fieldKey] = editor.value;
    setDirty(true);
  });
  block.appendChild(editor);

  const tokenOptions = [];
  const tabs = ['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts'];
  tabs.forEach((tabKey) => {
    const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
    if (!tab || !Array.isArray(tab.entries)) return;
    tab.entries.forEach((candidate) => {
      tokenOptions.push({
        label: String(candidate.name || ''),
        key: String(candidate.civilopediaKey || ''),
        tabKey,
        entry: candidate
      });
    });
  });
  tokenOptions.sort((a, b) => {
    const nameCmp = a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
    if (nameCmp !== 0) return nameCmp;
    return a.key.localeCompare(b.key, 'en', { sensitivity: 'base' });
  });

  const renderLinkRows = () => {
    const needle = String(linkSearch.value || '').trim().toLowerCase();
    linkList.innerHTML = '';
    const shown = tokenOptions.filter((opt) => {
      if (!needle) return true;
      return `${opt.label} ${opt.key}`.toLowerCase().includes(needle);
    }).slice(0, 120);
    shown.forEach((opt) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'civilopedia-link-row';
      const thumb = document.createElement('span');
      thumb.className = 'entry-thumb';
      loadReferenceListThumbnail(opt.tabKey, opt.entry, thumb);
      row.appendChild(thumb);
      const text = document.createElement('span');
      text.className = 'civilopedia-link-row-text';
      text.textContent = `${opt.label} (${opt.key})`;
      row.appendChild(text);
      row.addEventListener('click', () => {
        const safeLabel = String(opt.label || '').replace(/[<>=$]/g, '').trim() || String(opt.key || '');
        const token = `$LINK<${safeLabel}=${opt.key}>`;
        const start = editor.selectionStart ?? editor.value.length;
        const end = editor.selectionEnd ?? editor.value.length;
        const before = editor.value.slice(0, start);
        const after = editor.value.slice(end);
        const spacerBefore = before && !/\s$/.test(before) ? ' ' : '';
        const spacerAfter = after && !/^\s/.test(after) ? ' ' : '';
        const next = `${before}${spacerBefore}${token}${spacerAfter}${after}`;
        rememberUndoSnapshot();
        editor.value = next;
        entry[fieldKey] = next;
        setDirty(true);
        linkPanel.classList.add('hidden');
        renderActiveTab({ preserveTabScroll: true });
      });
      linkList.appendChild(row);
    });
    if (shown.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hint';
      empty.textContent = 'No matching entries.';
      linkList.appendChild(empty);
    }
  };
  renderLinkRows();
  linkSearch.addEventListener('input', renderLinkRows);

  insertLinkBtn.addEventListener('click', () => {
    const nextOpen = linkPanel.classList.contains('hidden');
    linkPanel.classList.toggle('hidden', !nextOpen);
    if (nextOpen) {
      linkSearch.value = '';
      renderLinkRows();
      linkSearch.focus();
    }
  });

  document.addEventListener('click', (ev) => {
    if (!block.contains(ev.target)) {
      linkPanel.classList.add('hidden');
    }
  });

  if (state.civilopediaPreviewVisible[editorKey]) {
    const preview = document.createElement('div');
    preview.className = 'civilopedia-preview';
    renderCivilopediaRichText(preview, String(entry[fieldKey] || '').trim());
    block.appendChild(preview);
  }
  return block;
}

function getPreviewRequestForArtSlot(slot) {
  if (!slot || !slot.path) return null;
  return {
    kind: 'civilopediaIcon',
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    scenarioPaths: getScenarioPreviewPaths(),
    assetPath: slot.path
  };
}

function loadArtSlotPreview(slot, holder, size = 86) {
  holder.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.className = 'entry-thumb-canvas';
  holder.appendChild(canvas);
  if (!slot || !slot.path) return;
  const request = getPreviewRequestForArtSlot(slot);
  if (!request) return;
  window.c3xManager.getPreview(request)
    .then((res) => {
      if (!res || !res.ok || !holder.isConnected) return;
      const w = Math.max(1, Number(res.width) || size);
      const h = Math.max(1, Number(res.height) || size);
      canvas.width = w;
      canvas.height = h;
      drawPreviewFrameToCanvas(res, canvas);
    })
    .catch(() => {});
}

function getPreviewRgba(preview) {
  if (!preview) return null;
  if (preview.rgbaBase64) return fromBase64ToUint8(preview.rgbaBase64);
  if (Array.isArray(preview.framesBase64) && preview.framesBase64[0]) return fromBase64ToUint8(preview.framesBase64[0]);
  return null;
}

function ensureArtFocusNode() {
  if (artFocus.node && artFocus.node.isConnected) return artFocus.node;
  const overlay = document.createElement('div');
  overlay.className = 'art-focus-overlay hidden';
  overlay.innerHTML = `
    <div class="art-focus-panel">
      <div class="art-focus-header">
        <div class="art-focus-header-text">
          <strong id="art-focus-title">Art Preview</strong>
          <span id="art-focus-meta" class="hint"></span>
        </div>
        <div class="art-focus-controls">
          <button type="button" class="ghost" data-act="zoom-out">-</button>
          <button type="button" class="ghost" data-act="zoom-reset">100%</button>
          <button type="button" class="ghost" data-act="zoom-in">+</button>
          <button type="button" class="ghost" data-act="close">Close</button>
        </div>
      </div>
      <div class="art-focus-canvas-wrap">
        <canvas id="art-focus-canvas"></canvas>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  artFocus.node = overlay;
  const panel = overlay.querySelector('.art-focus-panel');
  artFocus.canvas = overlay.querySelector('#art-focus-canvas');
  artFocus.title = overlay.querySelector('#art-focus-title');
  artFocus.meta = overlay.querySelector('#art-focus-meta');
  artFocus.zoomLabel = overlay.querySelector('[data-act="zoom-reset"]');
  const closeOverlay = () => overlay.classList.add('hidden');
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) {
      closeOverlay();
    }
  });
  if (panel) {
    panel.addEventListener('click', (ev) => {
      ev.stopPropagation();
    });
  }
  const closeBtn = overlay.querySelector('[data-act="close"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      closeOverlay();
    });
  }
  overlay.querySelector('[data-act="zoom-in"]').addEventListener('click', () => setArtFocusZoom(artFocus.zoom * 1.2));
  overlay.querySelector('[data-act="zoom-out"]').addEventListener('click', () => setArtFocusZoom(artFocus.zoom / 1.2));
  overlay.querySelector('[data-act="zoom-reset"]').addEventListener('click', () => setArtFocusZoom(1));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && artFocus.node && !artFocus.node.classList.contains('hidden')) {
      closeOverlay();
    }
  });
  return overlay;
}

function renderArtFocusCanvas() {
  if (!artFocus.preview || !artFocus.canvas) return;
  const rgba = getPreviewRgba(artFocus.preview);
  if (!rgba) return;
  const width = Number(artFocus.preview.width) || 1;
  const height = Number(artFocus.preview.height) || 1;
  const canvas = artFocus.canvas;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
  canvas.style.width = `${Math.max(1, Math.round(width * artFocus.zoom))}px`;
  canvas.style.height = `${Math.max(1, Math.round(height * artFocus.zoom))}px`;
  if (artFocus.zoomLabel) {
    artFocus.zoomLabel.textContent = `${Math.round(artFocus.zoom * 100)}%`;
  }
}

function setArtFocusZoom(nextZoom) {
  artFocus.zoom = Math.max(0.25, Math.min(8, Number(nextZoom) || 1));
  renderArtFocusCanvas();
}

function openArtFocusPreview(slot) {
  if (!slot || !slot.path) return;
  const overlay = ensureArtFocusNode();
  if (artFocus.title) artFocus.title.textContent = slot.label || 'Art Preview';
  if (artFocus.meta) artFocus.meta.textContent = slot.path;
  overlay.classList.remove('hidden');
  const request = getPreviewRequestForArtSlot(slot);
  if (!request) return;
  window.c3xManager.getPreview(request)
    .then((res) => {
      if (!res || !res.ok) return;
      artFocus.preview = res;
      artFocus.slot = slot;
      artFocus.zoom = 1;
      renderArtFocusCanvas();
    })
    .catch(() => {});
}

function buildReferenceArtSlots(tabKey, entry) {
  const slots = [];
  const supportsIconArt = new Set(['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units']);
  if (!supportsIconArt.has(tabKey)) {
    return slots;
  }
  const icons = Array.isArray(entry && entry.iconPaths) ? entry.iconPaths : [];
  const iconCount = icons.length > 0 ? Math.max(2, icons.length) : 0;
  for (let i = 0; i < iconCount; i += 1) {
    const label = i === 0 ? 'Civilopedia Large' : i === 1 ? 'Civilopedia Small' : `Icon ${i + 1}`;
    slots.push({ group: 'iconPaths', index: i, label, path: String(icons[i] || '') });
  }
  if (tabKey === 'civilizations') {
    const race = Array.isArray(entry && entry.racePaths) ? entry.racePaths : [];
    const raceCount = Math.max(2, race.length);
    for (let i = 0; i < raceCount; i += 1) {
      const label = i === 0 ? 'Advisor Portrait' : i === 1 ? 'Victory Portrait' : `Race Art ${i + 1}`;
      slots.push({ group: 'racePaths', index: i, label, path: String(race[i] || '') });
    }
  }
  return slots;
}

function setReferenceArtSlotPath(entry, slot, nextPathRaw) {
  if (!entry || !slot) return;
  const nextPath = normalizeRelativePath(toPediaRelativeAssetPath(nextPathRaw || ''));
  const key = slot.group === 'racePaths' ? 'racePaths' : 'iconPaths';
  const arr = Array.isArray(entry[key]) ? [...entry[key]] : [];
  arr[slot.index] = nextPath;
  while (arr.length > 0 && !String(arr[arr.length - 1] || '').trim()) arr.pop();
  entry[key] = arr;
}

function makeArtSlotCard({ tabKey, entry, slot, editable, onChanged }) {
  const card = document.createElement('div');
  card.className = 'art-slot-card';
  if (!editable) card.classList.add('read-only');
  const title = document.createElement('div');
  title.className = 'art-slot-title';
  title.textContent = slot.label;
  card.appendChild(title);
  const visual = document.createElement('div');
  visual.className = 'art-slot-visual';
  card.appendChild(visual);
  loadArtSlotPreview(slot, visual, 128);
  const meta = document.createElement('div');
  meta.className = 'art-slot-meta';
  meta.textContent = slot.path ? slot.path : 'Click or drop PCX to set';
  card.appendChild(meta);
  const actions = document.createElement('div');
  actions.className = 'art-slot-actions';
  const viewBtn = document.createElement('button');
  viewBtn.type = 'button';
  viewBtn.className = 'ghost';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openArtFocusPreview(slot);
  });
  actions.appendChild(viewBtn);
  const replaceBtn = document.createElement('button');
  replaceBtn.type = 'button';
  replaceBtn.className = 'ghost';
  replaceBtn.textContent = 'Replace';
  actions.appendChild(replaceBtn);
  card.appendChild(actions);
  attachRichTooltip(card, `Source: PediaIcons\nFile: ${slot.path || '(not set)'}\nSlot: ${slot.label}`);

  const setPathAndRefresh = (absolutePathOrRelative) => {
    rememberUndoSnapshot();
    setReferenceArtSlotPath(entry, slot, absolutePathOrRelative);
    setDirty(true);
    if (onChanged) onChanged();
  };

  if (editable) {
    replaceBtn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const resolved = await resolveExistingAssetPath(slot.path);
      const fallbackDir = resolved ? getParentPath(resolved) : '';
      const filePath = await window.c3xManager.pickFile({
        filters: [{ name: 'PCX Images', extensions: ['pcx', 'png', 'bmp'] }],
        defaultPath: resolved || fallbackDir || undefined
      });
      if (!filePath) return;
      setPathAndRefresh(filePath);
    });
    card.addEventListener('click', () => {
      openArtFocusPreview(slot);
    });
    card.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });
    card.addEventListener('drop', (ev) => {
      ev.preventDefault();
      card.classList.remove('drag-over');
      const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      const droppedPath = file && file.path ? String(file.path) : '';
      if (!droppedPath) return;
      setPathAndRefresh(droppedPath);
    });
  } else {
    replaceBtn.disabled = true;
    card.addEventListener('click', () => {
      openArtFocusPreview(slot);
    });
  }
  return card;
}

function slugifySectionId(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function buildReferenceSectionNav({ tabKey, textCol, navCol }) {
  if (!textCol || !navCol) return;
  const sections = [];
  const usedIds = new Set();
  const makeId = (base) => {
    let id = `${tabKey}-${slugifySectionId(base)}`;
    let i = 2;
    while (usedIds.has(id) || document.getElementById(id)) {
      id = `${tabKey}-${slugifySectionId(base)}-${i}`;
      i += 1;
    }
    usedIds.add(id);
    return id;
  };

  const topCards = Array.from(textCol.querySelectorAll(':scope > .source-section'));
  topCards.forEach((card) => {
    const heading = card.querySelector('.section-top strong');
    const title = String(heading && heading.textContent || '').trim();
    if (!title) return;
    const id = makeId(title);
    card.id = id;
    sections.push({ id, label: title, level: 0 });
    if (title.toLowerCase().startsWith('rules')) {
      const groupCards = Array.from(card.querySelectorAll('.rule-group-card'));
      groupCards.forEach((groupCard) => {
        const groupTitle = String((groupCard.querySelector('.rule-group-title') || {}).textContent || '').trim();
        if (!groupTitle) return;
        const groupId = makeId(`${title}-${groupTitle}`);
        groupCard.id = groupId;
        sections.push({ id: groupId, label: groupTitle, level: 1 });
        const rows = Array.from(groupCard.querySelectorAll('.rule-row'));
        rows.forEach((row) => {
          const label = String((row.querySelector('label') || {}).textContent || '').trim();
          if (!label) return;
          const fieldId = makeId(`${groupTitle}-${label}`);
          row.id = fieldId;
          sections.push({ id: fieldId, label, level: 2 });
        });
      });
    }
  });

  if (sections.length === 0) return;

  const nav = document.createElement('nav');
  nav.className = 'reference-section-nav';
  const search = document.createElement('input');
  search.type = 'search';
  search.classList.add('app-search-input');
  search.className = 'reference-section-nav-search';
  search.placeholder = 'Search sections or fields...';
  nav.appendChild(search);

  const list = document.createElement('div');
  list.className = 'reference-section-nav-list';
  const btnById = new Map();
  sections.forEach((sec) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `reference-section-nav-item level-${sec.level}`;
    btn.textContent = sec.label;
    btn.dataset.targetId = sec.id;
    btn.addEventListener('click', () => {
      const target = document.getElementById(sec.id);
      if (!target) return;
      setActive(sec.id);
      const scrollTarget = el.tabContent;
      const rootRect = scrollTarget.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const topOffset = 92;
      const nextTop = scrollTarget.scrollTop + (targetRect.top - rootRect.top) - topOffset;
      const clampedTop = Math.max(0, nextTop);
      scrollTarget.scrollTo({ top: clampedTop, behavior: 'smooth' });
      let ticks = 0;
      let stableTicks = 0;
      let lastTop = scrollTarget.scrollTop;
      const animateOnArrival = () => {
        target.classList.remove('nav-jump-highlight');
        // Force reflow so repeated clicks retrigger the animation.
        void target.offsetWidth;
        target.classList.add('nav-jump-highlight');
        window.setTimeout(() => {
          target.classList.remove('nav-jump-highlight');
        }, 1200);
      };
      const waitForScrollSettle = () => {
        ticks += 1;
        const curTop = scrollTarget.scrollTop;
        const nearTarget = Math.abs(curTop - clampedTop) <= 2;
        if (Math.abs(curTop - lastTop) <= 0.5) stableTicks += 1;
        else stableTicks = 0;
        lastTop = curTop;
        if (nearTarget || stableTicks >= 4 || ticks >= 120) {
          animateOnArrival();
          return;
        }
        window.requestAnimationFrame(waitForScrollSettle);
      };
      window.requestAnimationFrame(waitForScrollSettle);
    });
    list.appendChild(btn);
    btnById.set(sec.id, btn);
  });
  nav.appendChild(list);
  navCol.appendChild(nav);
  const applySearchFilter = () => {
    const needle = String(search.value || '').trim().toLowerCase();
    let visibleCount = 0;
    btnById.forEach((btn) => {
      const text = String(btn.textContent || '').toLowerCase();
      const show = !needle || text.includes(needle);
      btn.classList.toggle('hidden', !show);
      if (show) visibleCount += 1;
    });
    list.classList.toggle('empty', visibleCount === 0);
  };
  search.addEventListener('input', applySearchFilter);
  applySearchFilter();

  const setActive = (id) => {
    btnById.forEach((btn, key) => {
      btn.classList.toggle('active', key === id);
    });
  };
  let navSelectionLocked = false;
  const findActiveId = () => {
    const rootRect = el.tabContent.getBoundingClientRect();
    const anchor = rootRect.top + 152;
    let best = sections[0] && sections[0].id;
    let containingId = '';
    let containingTop = -Infinity;
    let aboveId = best;
    let aboveTop = -Infinity;
    sections.forEach((sec) => {
      const node = document.getElementById(sec.id);
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const top = rect.top;
      const bottom = rect.bottom;
      if (top <= anchor && bottom >= anchor && top > containingTop) {
        containingTop = top;
        containingId = sec.id;
      }
      if (top <= anchor && top > aboveTop) {
        aboveTop = top;
        aboveId = sec.id;
      }
    });
    if (containingId) return containingId;
    if (aboveId) return aboveId;
    return best;
  };

  const syncActive = () => {
    if (navSelectionLocked) return;
    const activeId = findActiveId();
    if (activeId) setActive(activeId);
  };
  syncActive();

  if (state.referenceSectionNavCleanup) {
    try { state.referenceSectionNavCleanup(); } catch (_err) {}
  }
  const scrollTarget = el.tabContent;
  const onScroll = () => syncActive();
  const unlockNavSelection = () => {
    if (!navSelectionLocked) return;
    navSelectionLocked = false;
    syncActive();
  };
  const onWheel = () => unlockNavSelection();
  const onTouchMove = () => unlockNavSelection();
  const onPointerDown = () => unlockNavSelection();
  const onKeyDown = (ev) => {
    const k = String(ev && ev.key || '');
    if ([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'
    ].includes(k)) {
      unlockNavSelection();
    }
  };
  sections.forEach((sec) => {
    const btn = btnById.get(sec.id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      navSelectionLocked = true;
      setActive(sec.id);
    });
  });
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  scrollTarget.addEventListener('wheel', onWheel, { passive: true });
  scrollTarget.addEventListener('touchmove', onTouchMove, { passive: true });
  scrollTarget.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('keydown', onKeyDown);
  state.referenceSectionNavCleanup = () => {
    scrollTarget.removeEventListener('scroll', onScroll);
    scrollTarget.removeEventListener('wheel', onWheel);
    scrollTarget.removeEventListener('touchmove', onTouchMove);
    scrollTarget.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeyDown);
  };
}

function renderReferenceTab(tab, tabKey) {
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[tabKey]));
  const referenceEditable = isScenarioMode();
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">${referenceEditable ? 'editable (scenario)' : 'read-only'}</span>`);
  wrap.appendChild(header);

  const helperRow = document.createElement('div');
  helperRow.className = 'reference-helper-row';
  const helper = document.createElement('p');
  helper.className = 'hint hint-compact';
  helper.textContent = isScenarioMode()
    ? 'Scenario mode: BIQ rules and Civilopedia text are editable. Hover any field for source + write target.'
    : 'Read-only Civilopedia view with precedence Conquests > civ3PTW > vanilla. Hover fields for source details.';
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
  search.type = 'search';
  search.classList.add('app-search-input');
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
      navigateWithHistory(() => {
        state.referenceListScrollTop[tabKey] = listPane.scrollTop;
        state.referenceSelection[tabKey] = baseIndex;
        state.tabContentScrollTop = el.tabContent.scrollTop;
      }, { preserveTabScroll: true });
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
    const navCol = document.createElement('div');
    navCol.className = 'reference-nav-col';
    card.appendChild(detailLayout);
    detailLayout.appendChild(textCol);
    detailLayout.appendChild(navCol);

    const identityMeta = document.createElement('div');
    identityMeta.className = 'section-card source-section';
    const deferredInfoBlocks = [];
    const identityTitle = document.createElement('div');
    identityTitle.className = 'section-top';
    identityTitle.innerHTML = '<strong>Identity & Art</strong>';
    identityMeta.appendChild(identityTitle);
    const identityGrid = document.createElement('div');
    identityGrid.className = 'kv-grid';
    const keyLine = document.createElement('div');
    keyLine.className = 'field-meta';
    keyLine.innerHTML = `<strong>Key:</strong> ${entry.civilopediaKey}`;
    attachRichTooltip(keyLine, formatSourceInfo({ source: 'Derived', readPath: '', writePath: '' }, 'Derived'));
    identityGrid.appendChild(keyLine);
    const depsLine = document.createElement('div');
    depsLine.className = 'field-meta';
    const techCtx = buildIdentityTechContext(tabKey, entry);
    const identityValues = formatIdentityTechValues(techCtx);
    const hasIdentityTechInfo = techCtx.fields.length > 0 || identityValues.length > 0;
    if (hasIdentityTechInfo) {
      depsLine.innerHTML = `<strong>${techCtx.label}:</strong>${referenceEditable && techCtx.fields.length > 0 ? '' : ` ${formatReferenceList(identityValues)}`}`;
      attachRichTooltip(depsLine, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ'));
      identityGrid.appendChild(depsLine);
    }
    if (referenceEditable && techCtx.editable && techCtx.fields.length > 0) {
      const techEditRow = document.createElement('div');
      techEditRow.className = 'rule-control';
      techCtx.fields.forEach((field) => {
        const picker = createTechIdentityPicker(field, () => {
          const nextValues = formatIdentityTechValues(techCtx);
          depsLine.innerHTML = `<strong>${techCtx.label}:</strong> ${formatReferenceList(
            nextValues
          )}`;
          setDirty(true);
        });
        techEditRow.appendChild(picker);
      });
      identityGrid.appendChild(techEditRow);
    }
    identityMeta.appendChild(identityGrid);
    const artGrid = document.createElement('div');
    artGrid.className = 'kv-grid';
    const artSlots = buildReferenceArtSlots(tabKey, entry);
    if (artSlots.length > 0) {
      const artHint = document.createElement('p');
      artHint.className = 'hint';
      artHint.textContent = referenceEditable
        ? 'Click artwork to replace it, or drag and drop a PCX directly onto a tile.'
        : 'Preview artwork used by this entry.';
      artGrid.appendChild(artHint);
    }
    const artSlotsWrap = document.createElement('div');
    artSlotsWrap.className = 'art-slot-grid';
    artSlots.forEach((slot) => {
      const cardSlot = makeArtSlotCard({
        tabKey,
        entry,
        slot,
        editable: referenceEditable,
        onChanged: () => renderActiveTab({ preserveTabScroll: true })
      });
      artSlotsWrap.appendChild(cardSlot);
    });
    if (artSlots.length > 0) {
      artGrid.appendChild(artSlotsWrap);
    }
    if (tabKey === 'units') {
      const animationLine = document.createElement('div');
      animationLine.className = 'field-meta';
      animationLine.innerHTML = `<strong>Animation:</strong> ${entry.animationName || '(none)'}`;
      attachRichTooltip(animationLine, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.animationName, 'PediaIcons'));
      artGrid.appendChild(animationLine);
    }
    if (artSlots.length > 0 || tabKey === 'units') {
      identityMeta.appendChild(artGrid);
    }
    textCol.appendChild(identityMeta);

    if (Array.isArray(entry.biqFields) && entry.biqFields.length > 0) {
      const rulesMeta = document.createElement('div');
      rulesMeta.className = 'section-card source-section';
      const rulesTitle = document.createElement('div');
      rulesTitle.className = 'section-top';
      rulesTitle.innerHTML = `<strong>Rules</strong><span class="hint">From BIQ section: ${entry.biqSectionCode || '(unknown)'}</span>`;
      attachRichTooltip(rulesTitle, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ'));
      rulesMeta.appendChild(rulesTitle);
      const rulesGrid = document.createElement('div');
      rulesGrid.className = 'kv-grid';
      const visibleRuleFields = entry.biqFields
        .filter((field) => !shouldHideBiqField(tabKey, field))
        .sort((a, b) => {
          const ao = getRuleFieldOrder(tabKey, a);
          const bo = getRuleFieldOrder(tabKey, b);
          if (ao !== bo) return ao - bo;
          return String(a.label || a.key).localeCompare(String(b.label || b.key), 'en', { sensitivity: 'base' });
        });
      const groups = new Map();
      visibleRuleFields.forEach((field) => {
        const group = getRuleFieldGroup(tabKey, field);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(field);
      });
      for (const [groupName, fields] of groups.entries()) {
        const groupCard = document.createElement('div');
        groupCard.className = 'rule-group-card';
        const groupTitle = document.createElement('div');
        groupTitle.className = 'rule-group-title';
        groupTitle.textContent = groupName;
        groupCard.appendChild(groupTitle);
        fields.forEach((field) => {
          const row = document.createElement('div');
          row.className = 'rule-row';
          const label = document.createElement('label');
          label.className = 'field-meta';
          label.textContent = field.label || field.key;
          attachRichTooltip(label, `${formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ')}\nField: ${field.key}`);
          row.appendChild(label);

          const controlWrap = document.createElement('div');
          controlWrap.className = 'rule-control';
          const spec = getRuleFieldSpec(tabKey, field) || {};
          const enumOptions = getEnumOptionsForField(tabKey, field);
          const refOptions = getReferenceOptionsForField(tabKey, field);
          const desiredControl = spec.control || '';

          if (referenceEditable) {
            const hasEnumOptions = enumOptions.length > 0;
            const hasRefOptions = refOptions.length > 0;
            const useReferencePicker = hasRefOptions && (desiredControl === 'reference' || (!desiredControl && !hasEnumOptions));

            if (useReferencePicker) {
              const labelText = String(field.label || field.key || 'value').trim();
              const picker = createReferencePicker({
                options: refOptions,
                targetTabKey: (BIQ_FIELD_REFS[tabKey] || {})[String(field.baseKey || field.key || '').toLowerCase()] || '',
                currentValue: field.value,
                searchPlaceholder: `Search ${labelText}...`,
                noneLabel: '(none)',
                onSelect: (value) => {
                  rememberUndoSnapshot();
                  field.value = String(value);
                  setDirty(true);
                }
              });
              controlWrap.appendChild(picker);
            } else if (desiredControl === 'select' || desiredControl === 'reference' || hasEnumOptions || hasRefOptions) {
              const options = hasEnumOptions ? enumOptions : refOptions;
              const select = document.createElement('select');
              const hasNone = options.some((opt) => String(opt.value) === '-1');
              if (!hasNone) {
                const empty = document.createElement('option');
                empty.value = '-1';
                empty.textContent = '(none)';
                select.appendChild(empty);
              }
              options.forEach((opt) => {
                const o = document.createElement('option');
                o.value = String(opt.value);
                o.textContent = String(opt.label || `${opt.value}`);
                select.appendChild(o);
              });
              const parsed = parseIntFromDisplayValue(field.value);
              select.value = parsed == null ? '-1' : String(parsed);
              select.addEventListener('change', () => {
                rememberUndoSnapshot();
                const selectedOpt = options.find((opt) => String(opt.value) === String(select.value));
                field.value = selectedOpt ? String(selectedOpt.value) : '-1';
                setDirty(true);
              });
              controlWrap.appendChild(select);
            } else if (desiredControl === 'bool' || isLikelyBooleanField(field)) {
              const checkWrap = document.createElement('label');
              checkWrap.className = 'bool-toggle';
              const check = document.createElement('input');
              check.type = 'checkbox';
              check.checked = String(field.value || '').toLowerCase() === 'true';
              const t = document.createElement('span');
              t.textContent = check.checked ? 'Enabled' : 'Disabled';
              check.addEventListener('change', () => {
                rememberUndoSnapshot();
                field.value = check.checked ? 'true' : 'false';
                t.textContent = check.checked ? 'Enabled' : 'Disabled';
                setDirty(true);
              });
              checkWrap.appendChild(check);
              checkWrap.appendChild(t);
              controlWrap.appendChild(checkWrap);
            } else if (desiredControl === 'number' || (parseIntFromDisplayValue(field.value) != null && !/[A-Za-z]/.test(String(field.value || '').replace(/\(-?\d+\)\s*$/, '')))) {
              const num = document.createElement('input');
              num.type = 'number';
              if (Number.isFinite(spec.min)) num.min = String(spec.min);
              if (Number.isFinite(spec.max)) num.max = String(spec.max);
              const n = parseIntFromDisplayValue(field.value);
              num.value = n == null ? '' : String(n);
              num.addEventListener('input', () => {
                rememberUndoSnapshot();
                field.value = num.value;
                setDirty(true);
              });
              controlWrap.appendChild(num);
            } else {
              const input = document.createElement('input');
              input.type = 'text';
              input.value = String(field.value || '');
              input.addEventListener('input', () => {
                rememberUndoSnapshot();
                field.value = input.value;
                setDirty(true);
              });
              controlWrap.appendChild(input);
            }
          } else {
            const text = document.createElement('div');
            text.className = 'field-meta';
            text.textContent = formatFieldValueForDisplay(tabKey, field);
            controlWrap.appendChild(text);
          }
          row.appendChild(controlWrap);
          groupCard.appendChild(row);
        });
        rulesGrid.appendChild(groupCard);
      }
      rulesMeta.appendChild(rulesGrid);
      deferredInfoBlocks.push(rulesMeta);
    }

    if (referenceEditable) {
      textCol.appendChild(createCivilopediaEditorBlock({
        entry,
        fieldKey: 'overview',
        titleText: 'Overview',
        sourceMeta: entry.sourceMeta && entry.sourceMeta.overview,
        emptyText: 'Overview text'
      }));
      textCol.appendChild(createCivilopediaEditorBlock({
        entry,
        fieldKey: 'description',
        titleText: 'Civilopedia',
        sourceMeta: entry.sourceMeta && entry.sourceMeta.description,
        emptyText: 'Civilopedia description'
      }));
    } else {
      if (entry.overview) {
        const overviewBlock = document.createElement('div');
        overviewBlock.className = 'section-card source-section';
        overviewBlock.style.marginTop = '8px';
        const title = document.createElement('div');
        title.className = 'section-top';
        const left = document.createElement('strong');
        left.textContent = 'Overview';
        title.appendChild(left);
        attachRichTooltip(title, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.overview, 'Civilopedia'));
        overviewBlock.appendChild(title);
        renderCivilopediaRichText(overviewBlock, entry.overview);
        textCol.appendChild(overviewBlock);
      }

      const textBlock = document.createElement('div');
      textBlock.className = 'section-card source-section';
      textBlock.style.marginTop = '8px';
      const descTitle = document.createElement('div');
      descTitle.className = 'section-top';
      const descLeft = document.createElement('strong');
      descLeft.textContent = 'Civilopedia';
      descTitle.appendChild(descLeft);
      attachRichTooltip(descTitle, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.description, 'Civilopedia'));
      textBlock.appendChild(descTitle);
      renderCivilopediaRichText(textBlock, entry.description || '(No Civilopedia body found)');
      textCol.appendChild(textBlock);
    }
    deferredInfoBlocks.forEach((block) => textCol.appendChild(block));
    buildReferenceSectionNav({ tabKey, textCol, navCol });

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

function getBiqRecordFieldValueByBaseKey(record, baseKey) {
  const target = String(baseKey || '').toLowerCase();
  if (!record || !Array.isArray(record.fields) || !target) return '';
  const hit = record.fields.find((field) => String((field && (field.baseKey || field.key)) || '').toLowerCase() === target);
  return String(hit && hit.value || '').trim();
}

function normalizeTerrainCivilopediaKey(sectionCode, record) {
  const code = String(sectionCode || '').toUpperCase();
  const prefix = code === 'TFRM' ? 'TFRM_' : (code === 'TERR' ? 'TERR_' : '');
  if (!prefix) return '';
  const raw = getBiqRecordFieldValueByBaseKey(record, 'civilopediaentry').toUpperCase();
  if (raw && raw.startsWith(prefix)) return raw;
  if (raw) {
    const normalizedRaw = raw.replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    if (normalizedRaw) return normalizedRaw.startsWith(prefix) ? normalizedRaw : `${prefix}${normalizedRaw}`;
  }
  const fallback = String(record && record.name || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
  return fallback ? `${prefix}${fallback}` : '';
}

function getTerrainCivilopediaEntryForRecord(tab, sectionCode, record) {
  const terrainMeta = tab && tab.civilopedia;
  if (!terrainMeta) return null;
  const targetKey = normalizeTerrainCivilopediaKey(sectionCode, record);
  if (!targetKey) return null;
  const group = String(sectionCode || '').toUpperCase() === 'TFRM'
    ? (terrainMeta.workerActions && terrainMeta.workerActions.entries)
    : (terrainMeta.terrain && terrainMeta.terrain.entries);
  const entries = Array.isArray(group) ? group : [];
  return entries.find((entry) => String(entry && entry.civilopediaKey || '').toUpperCase() === targetKey) || null;
}

function renderBiqTab(tab) {
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[state.activeTab] || TAB_ICONS.map));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title || 'BIQ'}</h3><span class="source-tag">${tab.readOnly ? 'read-only' : 'editable (scenario)'}</span>`);
  wrap.appendChild(header);

  if (tab.bridgeError) {
    const warn = document.createElement('p');
    warn.className = 'warning';
    warn.textContent = `Friendly BIQ mapping fallback active: ${tab.bridgeError}`;
    wrap.appendChild(warn);
  }

  if (tab.error) {
    const error = document.createElement('p');
    error.className = 'warning';
    error.textContent = tab.error;
    wrap.appendChild(error);
    return wrap;
  }

  const sections = Array.isArray(tab.sections) ? tab.sections : [];
  if (sections.length === 0) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'No BIQ sections were found.';
    wrap.appendChild(note);
    return wrap;
  }

  const selectionKey = String((tab && tab.key) || state.activeTab || 'biq');
  const currentIndex = Number(state.biqSectionSelectionByTab[selectionKey] || 0);
  const selectedSectionIndex = Math.max(0, Math.min(currentIndex, sections.length - 1));
  state.biqSectionSelectionByTab[selectionKey] = selectedSectionIndex;
  const selected = sections[selectedSectionIndex];

  if (sections.length > 1) {
    const subtabRow = document.createElement('div');
    subtabRow.className = 'biq-subtabs';
    sections.forEach((section, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'biq-subtab-btn';
      btn.classList.toggle('active', idx === selectedSectionIndex);
      btn.textContent = getFriendlyBiqSectionTitle(section);
      attachRichTooltip(btn, `Section: ${getFriendlyBiqSectionTitle(section)}\nCode: ${section.code}`);
      btn.addEventListener('click', () => {
        navigateWithHistory(() => {
          state.tabContentScrollTop = el.tabContent.scrollTop;
          state.biqSectionSelectionByTab[selectionKey] = idx;
        }, { preserveTabScroll: true });
      });
      subtabRow.appendChild(btn);
    });
    wrap.appendChild(subtabRow);
  }

  const records = Array.isArray(selected.records) ? selected.records : [];

  if (selected.code === 'TILE') {
    wrap.appendChild(renderBiqMapSection(tab, selected));
    return wrap;
  }

  const selectedRecordIndex = Math.max(
    0,
    Math.min(Number(state.biqRecordSelection[selected.id] || 0), Math.max(0, records.length - 1))
  );
  state.biqRecordSelection[selected.id] = selectedRecordIndex;

  if (selected.recordsTruncated) {
    const title = document.createElement('p');
    title.className = 'hint';
    title.textContent = `Showing first ${records.length} records for performance.`;
    wrap.appendChild(title);
  }

  const layout = document.createElement('div');
  layout.className = 'entry-layout';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  records.forEach((record, idx) => {
    const itemBtn = document.createElement('button');
    itemBtn.className = 'entry-list-item no-thumb';
    itemBtn.type = 'button';
    itemBtn.classList.toggle('active', idx === selectedRecordIndex);
    itemBtn.innerHTML = `<strong>${record.name || `Record ${record.index + 1}`}</strong>`;
    itemBtn.addEventListener('click', () => {
      navigateWithHistory(() => {
        state.biqRecordSelection[selected.id] = idx;
      }, { preserveTabScroll: true });
    });
    listPane.appendChild(itemBtn);
  });
  layout.appendChild(listPane);

  const detailPane = document.createElement('div');
  detailPane.className = 'entry-detail-pane';
  if (records.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'section-card';
    empty.innerHTML = '<p class="hint">No records available for this section.</p>';
    detailPane.appendChild(empty);
  } else {
    const record = records[selectedRecordIndex];
    const terrainPediaEntry = (selected.code === 'TERR' || selected.code === 'TFRM')
      ? getTerrainCivilopediaEntryForRecord(tab, selected.code, record)
      : null;
    const card = document.createElement('div');
    card.className = 'section-card';
    card.innerHTML = `<div class="section-top"><strong>${record.name || `Record ${record.index + 1}`}</strong><span class="hint">${selected.code} | #${record.index + 1}</span></div>`;

    if (terrainPediaEntry) {
      const sourceBadge = document.createElement('div');
      sourceBadge.className = 'hint';
      sourceBadge.style.marginBottom = '6px';
      sourceBadge.textContent = selected.code === 'TFRM'
        ? 'Worker Action Civilopedia linked to this BIQ record.'
        : 'Terrain Civilopedia linked to this BIQ record.';
      card.appendChild(sourceBadge);
      if (isScenarioMode()) {
        card.appendChild(createCivilopediaEditorBlock({
          entry: terrainPediaEntry,
          fieldKey: 'overview',
          titleText: 'Overview',
          sourceMeta: terrainPediaEntry.sourceMeta && terrainPediaEntry.sourceMeta.overview,
          emptyText: 'Overview text'
        }));
        card.appendChild(createCivilopediaEditorBlock({
          entry: terrainPediaEntry,
          fieldKey: 'description',
          titleText: 'Civilopedia',
          sourceMeta: terrainPediaEntry.sourceMeta && terrainPediaEntry.sourceMeta.description,
          emptyText: 'Civilopedia description'
        }));
      } else {
        if (terrainPediaEntry.overview) {
          const overviewBlock = document.createElement('div');
          overviewBlock.className = 'section-card source-section';
          overviewBlock.style.marginTop = '8px';
          const title = document.createElement('div');
          title.className = 'section-top';
          const left = document.createElement('strong');
          left.textContent = 'Overview';
          title.appendChild(left);
          attachRichTooltip(title, formatSourceInfo(terrainPediaEntry.sourceMeta && terrainPediaEntry.sourceMeta.overview, 'Civilopedia'));
          overviewBlock.appendChild(title);
          renderCivilopediaRichText(overviewBlock, terrainPediaEntry.overview);
          card.appendChild(overviewBlock);
        }
        const textBlock = document.createElement('div');
        textBlock.className = 'section-card source-section';
        textBlock.style.marginTop = '8px';
        const descTitle = document.createElement('div');
        descTitle.className = 'section-top';
        const descLeft = document.createElement('strong');
        descLeft.textContent = 'Civilopedia';
        descTitle.appendChild(descLeft);
        attachRichTooltip(descTitle, formatSourceInfo(terrainPediaEntry.sourceMeta && terrainPediaEntry.sourceMeta.description, 'Civilopedia'));
        textBlock.appendChild(descTitle);
        renderCivilopediaRichText(textBlock, terrainPediaEntry.description || '(No Civilopedia body found)');
        card.appendChild(textBlock);
      }
    }

    const fields = (record.fields || []).filter((field) => !shouldHideBiqStructureField(selected.code, field));
    if (fields.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'No user-facing fields for this record.';
      card.appendChild(empty);
    } else {
      const rows = document.createElement('div');
      rows.className = 'kv-grid';
      fields.forEach((field) => {
        const row = document.createElement('div');
        row.className = 'rule-row';
        const label = document.createElement('label');
        label.className = 'field-meta';
        label.textContent = String(field.label || field.key);
        attachRichTooltip(
          label,
          `Source: BIQ\nFile: ${compactPathFromCiv3Root(tab.sourcePath || '') || '(not available)'}\nSection: ${selected.title || selected.code}\nSection Code: ${selected.code}\nField: ${field.baseKey || field.key}\nRecord: ${record.index + 1}`
        );
        row.appendChild(label);

        const controlWrap = document.createElement('div');
        controlWrap.className = 'rule-control';
        const editable = !tab.readOnly;
        const baseKey = String(field.baseKey || field.key || '').toLowerCase();
        const refSpec = getBiqStructureRefSpec(selected.code, baseKey);
        const refOptions = refSpec ? makeBiqSectionIndexOptions(refSpec.section, !!refSpec.oneBased) : [];
        const refTargetTabKey = refSpec ? (BIQ_SECTION_TO_REFERENCE_TAB[String(refSpec.section || '').toUpperCase()] || '') : '';
        const parsed = parseIntFromDisplayValue(field.value);
        const rawText = String(field.value || '').trim();
        const looksNumeric = parsed != null && !/[A-Za-z]/.test(rawText.replace(/\(-?\d+\)\s*$/, ''));
        const boolRaw = rawText.toLowerCase();
        const looksBoolean = boolRaw === 'true' || boolRaw === 'false';

        if (editable) {
          if (refOptions.length > 0) {
            const picker = createReferencePicker({
              options: refOptions,
              targetTabKey: refTargetTabKey,
              currentValue: parsed == null ? '-1' : String(parsed),
              searchPlaceholder: `Search ${String(refSpec.section || '').toUpperCase()}...`,
              noneLabel: '(none)',
              onSelect: (value) => {
                rememberUndoSnapshot();
                field.value = String(value);
                setDirty(true);
              }
            });
            controlWrap.appendChild(picker);
          } else if (looksBoolean) {
            const toggle = document.createElement('label');
            toggle.className = 'bool-toggle';
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = boolRaw === 'true';
            const text = document.createElement('span');
            text.textContent = check.checked ? 'Enabled' : 'Disabled';
            check.addEventListener('change', () => {
              rememberUndoSnapshot();
              field.value = check.checked ? 'true' : 'false';
              text.textContent = check.checked ? 'Enabled' : 'Disabled';
              setDirty(true);
            });
            toggle.appendChild(check);
            toggle.appendChild(text);
            controlWrap.appendChild(toggle);
          } else if (looksNumeric) {
            const input = document.createElement('input');
            input.type = 'number';
            input.value = parsed == null ? '' : String(parsed);
            input.addEventListener('input', () => {
              rememberUndoSnapshot();
              field.value = input.value;
              setDirty(true);
            });
            controlWrap.appendChild(input);
          } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = String(field.value || '');
            input.addEventListener('input', () => {
              rememberUndoSnapshot();
              field.value = input.value;
              setDirty(true);
            });
            controlWrap.appendChild(input);
          }
        } else {
          const text = document.createElement('div');
          text.className = 'field-meta';
          text.textContent = String(field.value || '(none)');
          controlWrap.appendChild(text);
        }

        row.appendChild(controlWrap);
        rows.appendChild(row);
      });
      card.appendChild(rows);
    }
    detailPane.appendChild(card);
  }
  layout.appendChild(detailPane);
  wrap.appendChild(layout);

  return wrap;
}

function renderMapTab(tab) {
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS.map));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title || 'Map'}</h3><span class="source-tag">${tab.readOnly ? 'read-only' : 'editable (scenario)'}</span>`);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = tab.sourcePath
    ? `Source BIQ: ${compactPathFromCiv3Root(tab.sourcePath)}`
    : 'No BIQ source selected.';
  wrap.appendChild(helper);

  if (tab.error) {
    const error = document.createElement('p');
    error.className = 'warning';
    error.textContent = tab.error;
    wrap.appendChild(error);
    return wrap;
  }
  const sections = Array.isArray(tab.sections) ? tab.sections : [];
  const tileSection = sections.find((s) => s.code === 'TILE');
  if (!tileSection) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'No map tile section found in this BIQ.';
    wrap.appendChild(note);
    return wrap;
  }
  wrap.appendChild(renderBiqMapSection(tab, tileSection));
  return wrap;
}

function getFieldByBaseKey(record, baseKey) {
  if (!record || !Array.isArray(record.fields)) return null;
  const target = String(baseKey || '').toLowerCase();
  return record.fields.find((f) => String(f.key || '').toLowerCase() === target) || null;
}

function parseIntLoose(value, fallback = 0) {
  const s = String(value == null ? '' : value).trim();
  const m = s.match(/-?\d+/);
  if (!m) return fallback;
  return Number.parseInt(m[0], 10);
}

function setRecordFieldValue(record, key, value) {
  const f = getFieldByBaseKey(record, key);
  if (!f) return false;
  f.value = String(value);
  return true;
}

function colorFromNumber(value) {
  const n = Number(value) || 0;
  const x = (Math.abs(n * 1103515245 + 12345) >>> 0) & 0xffffff;
  const r = 40 + (x & 0x7f);
  const g = 40 + ((x >> 8) & 0x7f);
  const b = 40 + ((x >> 16) & 0x7f);
  return `rgb(${r}, ${g}, ${b})`;
}

function decodeRgbaBase64(preview) {
  if (!preview || !preview.rgbaBase64 || !preview.width || !preview.height) return null;
  const bin = atob(preview.rgbaBase64);
  const rgba = new Uint8ClampedArray(bin.length);
  for (let i = 0; i < bin.length; i += 1) rgba[i] = bin.charCodeAt(i);
  return { width: preview.width, height: preview.height, rgba };
}

function rgbaToCanvas(preview) {
  const decoded = decodeRgbaBase64(preview);
  if (!decoded) return null;
  const canvas = document.createElement('canvas');
  canvas.width = decoded.width;
  canvas.height = decoded.height;
  const ctx = canvas.getContext('2d');
  const data = new ImageData(decoded.rgba, decoded.width, decoded.height);
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function requestBiqMapArtAsset(assetKey, assetPath) {
  if (!state.settings || !state.settings.civ3Path) return;
  if (state.biqMapArtCache[assetKey] || state.biqMapArtLoading[assetKey]) return;
  state.biqMapArtLoading[assetKey] = true;
  appendDebugLog('biq-map:asset-load-start', { assetKey, assetPath });
  window.c3xManager.getPreview({
    kind: 'civilopediaIcon',
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    scenarioPaths: getScenarioPreviewPaths(),
    assetPath
  }).then((res) => {
    if (res && res.ok && !res.animated) {
      const canvas = rgbaToCanvas(res);
      if (canvas) {
        state.biqMapArtCache[assetKey] = canvas;
        appendDebugLog('biq-map:asset-load-ok', { assetKey, width: canvas.width, height: canvas.height, sourcePath: res.sourcePath });
      } else {
        appendDebugLog('biq-map:asset-load-decode-failed', { assetKey });
      }
    } else {
      appendDebugLog('biq-map:asset-load-error', { assetKey, error: res && res.error });
    }
  }).catch(() => {
    // best effort
    appendDebugLog('biq-map:asset-load-exception', { assetKey });
  }).finally(() => {
    delete state.biqMapArtLoading[assetKey];
    if (state.biqMapRerenderPending) return;
    state.biqMapRerenderPending = true;
    window.requestAnimationFrame(() => {
      state.biqMapRerenderPending = false;
      if (!state.bundle || !state.bundle.tabs || !state.bundle.tabs[state.activeTab] || state.bundle.tabs[state.activeTab].type !== 'map') {
        return;
      }
      renderActiveTab({ preserveTabScroll: true });
    });
  });
}

function renderBiqMapSection(tab, tileSection) {
  const container = document.createElement('div');
  container.className = 'biq-map-layout';
  appendDebugLog('biq-map:open', { sectionId: tileSection && tileSection.id, sourcePath: tab && tab.sourcePath });

  const wmapSection = (tab.sections || []).find((s) => s.code === 'WMAP');
  const wmapRecord = wmapSection && Array.isArray(wmapSection.records) ? wmapSection.records[0] : null;
  const width = parseIntLoose(getFieldByBaseKey(wmapRecord, 'width')?.value, 0);
  const height = parseIntLoose(getFieldByBaseKey(wmapRecord, 'height')?.value, 0);
  const tiles = Array.isArray(tileSection.records) ? tileSection.records : [];

  if (!width || !height || tiles.length === 0) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Map data unavailable in this BIQ (missing WMAP/TILE records).';
    container.appendChild(note);
    return container;
  }

  const maxIdx = tiles.length - 1;
  if (state.biqMapSelectedTile < 0 || state.biqMapSelectedTile > maxIdx) {
    state.biqMapSelectedTile = Math.floor(maxIdx / 2);
  }
  const selectedTile = tiles[state.biqMapSelectedTile] || null;
  const clampZoom = (z) => Math.max(BIQ_MAP_ZOOM_MIN, Math.min(BIQ_MAP_ZOOM_MAX, Number(z) || state.biqMapZoom || 6));

  const controls = document.createElement('div');
  controls.className = 'biq-map-toolbar';

  const layerLabel = document.createElement('label');
  layerLabel.className = 'hint';
  layerLabel.textContent = 'Layer';
  const layerSelect = document.createElement('select');
  [
    { value: 'terrain', label: 'Terrain' },
    { value: 'resource', label: 'Resource' },
    { value: 'owner', label: 'Owner' },
    { value: 'continent', label: 'Continent' }
  ].forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    layerSelect.appendChild(o);
  });
  layerSelect.value = state.biqMapLayer;
  layerSelect.addEventListener('change', () => {
    state.biqMapLayer = layerSelect.value;
    appendDebugLog('biq-map:layer-change', { layer: state.biqMapLayer });
    renderActiveTab({ preserveTabScroll: true });
  });
  layerLabel.appendChild(layerSelect);
  controls.appendChild(layerLabel);

  const gridWrap = document.createElement('label');
  gridWrap.className = 'bool-toggle';
  const grid = document.createElement('input');
  grid.type = 'checkbox';
  grid.checked = !!state.biqMapShowGrid;
  grid.addEventListener('change', () => {
    state.biqMapShowGrid = grid.checked;
    appendDebugLog('biq-map:grid-toggle', { enabled: state.biqMapShowGrid });
    renderActiveTab({ preserveTabScroll: true });
  });
  const gridText = document.createElement('span');
  gridText.textContent = 'Grid';
  gridWrap.appendChild(grid);
  gridWrap.appendChild(gridText);
  controls.appendChild(gridWrap);

  const overlaysWrap = document.createElement('label');
  overlaysWrap.className = 'bool-toggle';
  const overlays = document.createElement('input');
  overlays.type = 'checkbox';
  overlays.checked = !!state.biqMapShowOverlays;
  overlays.addEventListener('change', () => {
    state.biqMapShowOverlays = overlays.checked;
    appendDebugLog('biq-map:overlays-toggle', { enabled: state.biqMapShowOverlays });
    renderActiveTab({ preserveTabScroll: true });
  });
  const overlaysText = document.createElement('span');
  overlaysText.textContent = 'Overlays';
  overlaysWrap.appendChild(overlays);
  overlaysWrap.appendChild(overlaysText);
  controls.appendChild(overlaysWrap);

  const namesWrap = document.createElement('label');
  namesWrap.className = 'bool-toggle';
  const names = document.createElement('input');
  names.type = 'checkbox';
  names.checked = !!state.biqMapShowCityNames;
  names.addEventListener('change', () => {
    state.biqMapShowCityNames = names.checked;
    appendDebugLog('biq-map:city-names-toggle', { enabled: state.biqMapShowCityNames });
    renderActiveTab({ preserveTabScroll: true });
  });
  const namesText = document.createElement('span');
  namesText.textContent = 'City Names';
  namesWrap.appendChild(names);
  namesWrap.appendChild(namesText);
  controls.appendChild(namesWrap);

  const hint = document.createElement('span');
  hint.className = 'hint';
  hint.textContent = isScenarioMode()
    ? 'Wheel to zoom. Map edits are local UI edits for now (BIQ writing is next).'
    : 'Wheel to zoom. Standard Game BIQ is read-only.';
  controls.appendChild(hint);

  container.appendChild(controls);

  const mapFrame = document.createElement('div');
  mapFrame.className = 'biq-map-frame';
  const mapPane = document.createElement('div');
  mapPane.className = 'biq-map-canvas-wrap';
  let isDraggingMap = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragMoved = false;
  const DRAG_THRESHOLD = 4;
  const onDragMove = (ev) => {
    if (!isDraggingMap || ev.pointerId !== dragPointerId) return;
    ev.preventDefault();
    const totalDx = ev.clientX - dragStartX;
    const totalDy = ev.clientY - dragStartY;
    if (Math.abs(totalDx) > DRAG_THRESHOLD || Math.abs(totalDy) > DRAG_THRESHOLD) {
      dragMoved = true;
    }
    const dx = ev.clientX - dragLastX;
    const dy = ev.clientY - dragLastY;
    mapPane.scrollLeft -= dx;
    mapPane.scrollTop -= dy;
    dragLastX = ev.clientX;
    dragLastY = ev.clientY;
  };
  const onDragEnd = () => {
    if (!isDraggingMap) return;
    isDraggingMap = false;
    dragPointerId = null;
    mapPane.classList.remove('dragging');
    if (dragMoved) {
      state.biqMapSuppressClickUntilTs = Date.now() + 180;
      appendDebugLog('biq-map:drag-pan', {
        left: mapPane.scrollLeft,
        top: mapPane.scrollTop
      });
    }
  };
  mapPane.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    isDraggingMap = true;
    dragPointerId = ev.pointerId;
    dragMoved = false;
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    dragLastX = ev.clientX;
    dragLastY = ev.clientY;
    mapPane.classList.add('dragging');
    mapPane.setPointerCapture(ev.pointerId);
  });
  mapPane.addEventListener('pointermove', onDragMove);
  mapPane.addEventListener('pointerup', onDragEnd);
  mapPane.addEventListener('pointercancel', onDragEnd);
  mapPane.addEventListener('scroll', () => {
    state.biqMapScrollLeft = mapPane.scrollLeft;
    state.biqMapScrollTop = mapPane.scrollTop;
    const now = Date.now();
    if (now - state.biqMapLastScrollLogTs > 250) {
      state.biqMapLastScrollLogTs = now;
      appendDebugLog('biq-map:scroll', { left: state.biqMapScrollLeft, top: state.biqMapScrollTop });
    }
  });
  const setMapZoom = (nextZoom, source, paneX, paneY, anchorContent) => {
    const fromZoom = Number(state.biqMapZoom || 6);
    const clamped = clampZoom(nextZoom);
    if (clamped === fromZoom) return;
    const safePaneX = Number.isFinite(paneX) ? paneX : Math.floor(mapPane.clientWidth / 2);
    const safePaneY = Number.isFinite(paneY) ? paneY : Math.floor(mapPane.clientHeight / 2);
    state.biqMapZoomAnchor = {
      fromZoom,
      paneX: safePaneX,
      paneY: safePaneY,
      contentX: anchorContent && Number.isFinite(anchorContent.x)
        ? anchorContent.x
        : mapPane.scrollLeft + safePaneX,
      contentY: anchorContent && Number.isFinite(anchorContent.y)
        ? anchorContent.y
        : mapPane.scrollTop + safePaneY
    };
    state.biqMapZoom = clamped;
    appendDebugLog('biq-map:zoom-change', { zoom: state.biqMapZoom, source });
    renderActiveTab({ preserveTabScroll: true });
  };
  mapPane.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const rect = mapPane.getBoundingClientRect();
    const paneX = ev.clientX - rect.left;
    const paneY = ev.clientY - rect.top;
    const canvasX = mapPane.scrollLeft + paneX;
    const canvasY = mapPane.scrollTop + paneY;
    const hovered = typeof findTileAtCanvasPx === 'function'
      ? findTileAtCanvasPx(canvasX, canvasY, false)
      : null;
    const anchorContent = hovered
      ? { x: hovered.centerX, y: hovered.centerY }
      : null;
    const delta = ev.deltaY > 0 ? -1 : 1;
    if (hovered) {
      appendDebugLog('biq-map:zoom-anchor', {
        index: hovered.index,
        metric: Number(hovered.metric || 0).toFixed(3),
        centerX: Math.round(hovered.centerX),
        centerY: Math.round(hovered.centerY)
      });
    }
    setMapZoom(Number(state.biqMapZoom || 6) + delta, 'wheel', paneX, paneY, anchorContent);
  }, { passive: false });

  const zoomControls = document.createElement('div');
  zoomControls.className = 'biq-map-zoom-controls';
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'biq-map-zoom-btn';
  zoomInBtn.type = 'button';
  zoomInBtn.textContent = '+';
  zoomInBtn.title = 'Zoom in';
  zoomInBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setMapZoom(Number(state.biqMapZoom || 6) + 1, 'button+');
  });
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'biq-map-zoom-btn';
  zoomOutBtn.type = 'button';
  zoomOutBtn.textContent = '-';
  zoomOutBtn.title = 'Zoom out';
  zoomOutBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setMapZoom(Number(state.biqMapZoom || 6) - 1, 'button-');
  });
  zoomControls.appendChild(zoomInBtn);
  zoomControls.appendChild(zoomOutBtn);

  const scaleForZoom = (z) => Math.max(0.18, clampZoom(z) / 16);
  const canvas = document.createElement('canvas');
  const tilePx = Math.max(BIQ_MAP_ZOOM_MIN, clampZoom(state.biqMapZoom || 6));
  const scale = scaleForZoom(tilePx);
  const tileW = Math.max(24, Math.round(128 * scale));
  const tileH = Math.max(12, Math.round(64 * scale));
  const stepX = Math.max(12, Math.round(64 * scale));
  const stepY = Math.max(6, Math.round(32 * scale));
  const padX = tileW + 24;
  const padY = tileH + 24;
  const worldWrapSpan = width * stepX;
  const xWrap = parseIntLoose(getFieldByBaseKey(wmapRecord, 'xwrapping')?.value, 0) !== 0 || String(getFieldByBaseKey(wmapRecord, 'xwrapping')?.value || '').toLowerCase() === 'true';
  const wrapCenterOffset = xWrap ? worldWrapSpan : 0;

  const toTileCoords = (index) => {
    const pairY = Math.floor(index / width) * 2;
    const rem = index % width;
    const half = Math.floor(width / 2);
    if (rem < half) {
      return { xPos: rem * 2, yPos: pairY };
    }
    return { xPos: (rem - half) * 2 + 1, yPos: pairY + 1 };
  };
  const tileGeom = new Array(tiles.length);
  for (let i = 0; i < tiles.length; i += 1) tileGeom[i] = toTileCoords(i);

  const tileToScreenTopLeft = (xPos, yPos) => ({
    sx: padX + xPos * stepX - stepX,
    sy: padY + yPos * stepY - stepY
  });

  let minSx = Number.POSITIVE_INFINITY;
  let minSy = Number.POSITIVE_INFINITY;
  let maxSx = Number.NEGATIVE_INFINITY;
  let maxSy = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < tileGeom.length; i += 1) {
    const p = tileToScreenTopLeft(tileGeom[i].xPos, tileGeom[i].yPos);
    if (p.sx < minSx) minSx = p.sx;
    if (p.sy < minSy) minSy = p.sy;
    if (p.sx > maxSx) maxSx = p.sx;
    if (p.sy > maxSy) maxSy = p.sy;
  }
  if (!Number.isFinite(minSx) || !Number.isFinite(minSy)) {
    minSx = 0;
    minSy = 0;
    maxSx = 0;
    maxSy = 0;
  }
  canvas.width = Math.max(1200, (maxSx - minSx) + tileW + padX * 2 + (wrapCenterOffset * 2));
  canvas.height = Math.max(800, (maxSy - minSy) + tileH + padY * 2);
  canvas.className = 'biq-map-canvas';
  const ctx = canvas.getContext('2d');
  const originX = padX - minSx + wrapCenterOffset;
  const originY = padY - minSy;
  appendDebugLog('biq-map:geometry', {
    width,
    height,
    tileCount: tiles.length,
    expectedTileCount: width * height,
    stepX,
    stepY,
    tileW,
    tileH,
    minSx,
    minSy,
    maxSx,
    maxSy,
    originX,
    originY,
    worldWrapSpan,
    wrapCenterOffset,
    canvasW: canvas.width,
    canvasH: canvas.height
  });

  BIQ_TERRAIN_ATLAS_FILES.forEach((assetPath, idx) => {
    requestBiqMapArtAsset(`terrain-${idx}`, assetPath);
  });
  requestBiqMapArtAsset('resources', 'Art/resources.pcx');
  requestBiqMapArtAsset('units32', 'Art/Units/units_32.pcx');
  requestBiqMapArtAsset('terrainBuildings', 'Art/Terrain/TerrainBuildings.PCX');

  const goodSection = (tab.sections || []).find((s) => s.code === 'GOOD');
  const goodIconById = {};
  (goodSection?.records || []).forEach((record, idx) => {
    goodIconById[idx] = parseIntLoose(getFieldByBaseKey(record, 'icon')?.value, -1);
  });
  const prtoSection = (tab.sections || []).find((s) => s.code === 'PRTO');
  const prtoIndexByName = {};
  const prtoIconById = {};
  (prtoSection?.records || []).forEach((record, idx) => {
    prtoIndexByName[String(record.name || '').trim().toLowerCase()] = idx;
    prtoIconById[idx] = parseIntLoose(getFieldByBaseKey(record, 'iconindex')?.value, -1);
  });
  const citySection = (tab.sections || []).find((s) => s.code === 'CITY');
  const cityRecordById = {};
  (citySection?.records || []).forEach((record, idx) => {
    cityRecordById[idx] = record;
  });

  const drawTerrainSprite = (record, sx, sy) => {
    const fileIdx = parseIntLoose(getFieldByBaseKey(record, 'file')?.value, -1);
    const imageIdx = parseIntLoose(getFieldByBaseKey(record, 'image')?.value, -1);
    const atlas = state.biqMapArtCache[`terrain-${fileIdx}`];
    if (!atlas || imageIdx < 0) return false;
    const cols = 9;
    const rows = 9;
    const cellW = Math.max(1, Math.floor(atlas.width / cols));
    const cellH = Math.max(1, Math.floor(atlas.height / rows));
    const col = imageIdx % cols;
    const row = Math.floor(imageIdx / cols);
    if (row >= rows) return false;
    ctx.drawImage(
      atlas,
      col * cellW,
      row * cellH,
      cellW,
      cellH,
      sx,
      sy,
      tileW,
      tileH
    );
    return true;
  };

  const drawResourceOverlay = (record, sx, sy) => {
    const atlas = state.biqMapArtCache.resources;
    if (!atlas) return;
    const resourceId = parseIntLoose(getFieldByBaseKey(record, 'resource')?.value, -1);
    if (resourceId < 0) return;
    const iconIdx = goodIconById[resourceId];
    if (!Number.isFinite(iconIdx) || iconIdx < 0) return;
    const cols = 10;
    const cellW = Math.floor(atlas.width / cols);
    const cellH = Math.floor(atlas.height / cols);
    const col = iconIdx % cols;
    const row = Math.floor(iconIdx / cols);
    const size = Math.max(6, Math.round(32 * scale));
    const dx = sx + Math.round(BIQ_MAP_OVERLAY_ANCHORS.resource.x * scale);
    const dy = sy + Math.round(BIQ_MAP_OVERLAY_ANCHORS.resource.y * scale);
    ctx.drawImage(atlas, col * cellW, row * cellH, cellW, cellH, dx, dy, size, size);
  };

  const drawUnitOverlay = (record, screenX, screenY) => {
    const atlas = state.biqMapArtCache.units32;
    if (!atlas) return;
    const rawUnit = String(getFieldByBaseKey(record, 'unit_on_tile')?.value || '').trim();
    if (!rawUnit) return;
    const unitName = rawUnit.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
    const unitId = prtoIndexByName[unitName];
    if (!Number.isFinite(unitId)) return;
    const iconIdx = prtoIconById[unitId];
    if (!Number.isFinite(iconIdx) || iconIdx < 0) return;
    const cols = 14;
    const cellW = 32;
    const cellH = 32;
    const step = 33;
    const col = iconIdx % cols;
    const row = Math.floor(iconIdx / cols);
    const srcX = col * step;
    const srcY = row * step;
    if (srcX + cellW > atlas.width || srcY + cellH > atlas.height) return;
    const size = Math.max(6, Math.round(32 * scale));
    const dx = screenX + Math.round(BIQ_MAP_OVERLAY_ANCHORS.unit.x * scale);
    const dy = screenY + Math.round(BIQ_MAP_OVERLAY_ANCHORS.unit.y * scale);
    ctx.drawImage(atlas, srcX, srcY, cellW, cellH, dx, dy, size, size);
  };

  const drawCityOverlay = (record, sx, sy) => {
    const cityId = parseIntLoose(getFieldByBaseKey(record, 'city')?.value, -1);
    if (cityId < 0) return;
    const cityRecord = cityRecordById[cityId];
    const cityLevel = parseIntLoose(getFieldByBaseKey(cityRecord, 'citylevel')?.value, 0);
    const hasWalls = parseIntLoose(getFieldByBaseKey(cityRecord, 'haswalls')?.value, 0) !== 0;
    const cityName = String(getFieldByBaseKey(cityRecord, 'name')?.value || '').trim();
    const atlas = state.biqMapArtCache.terrainBuildings;

    if (atlas) {
      const cols = 16;
      const cellW = Math.floor(atlas.width / cols);
      const cellH = Math.floor(atlas.height / 8);
      const levelBase = Math.max(0, Math.min(2, cityLevel));
      const idx = levelBase + (hasWalls ? 16 : 0);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const srcX = col * cellW;
      const srcY = row * cellH;
      const size = Math.max(8, Math.round(Math.max(cellW, cellH) * scale));
      const dx = sx + Math.round(BIQ_MAP_OVERLAY_ANCHORS.city.x * scale) - Math.floor(size / 2);
      const dy = sy + Math.round(BIQ_MAP_OVERLAY_ANCHORS.city.y * scale) - Math.floor(size / 2);
      if (srcX + cellW <= atlas.width && srcY + cellH <= atlas.height) {
        ctx.drawImage(atlas, srcX, srcY, cellW, cellH, dx, dy, size, size);
      }
    } else {
      const cx = sx + Math.floor(tileW / 2);
      const cy = sy + Math.floor(tileH / 2);
      const r = Math.max(1, Math.floor(tilePx / 5));
      ctx.fillStyle = '#f8f8ff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#233045';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (state.biqMapShowCityNames && cityName && tilePx >= 8) {
      ctx.font = `${Math.max(8, Math.floor(tilePx * 0.55))}px sans-serif`;
      const tx = sx + Math.round(BIQ_MAP_OVERLAY_ANCHORS.cityName.x * scale);
      const ty = sy + Math.round(BIQ_MAP_OVERLAY_ANCHORS.cityName.y * scale);
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 2;
      ctx.strokeText(cityName, tx, ty);
      ctx.fillStyle = '#f3f6ff';
      ctx.fillText(cityName, tx, ty);
    }
  };

  const selGeom = tileGeom[state.biqMapSelectedTile] || { xPos: 0, yPos: 0 };
  const selPosRaw = tileToScreenTopLeft(selGeom.xPos, selGeom.yPos);
  const selPos = { sx: selPosRaw.sx + originX, sy: selPosRaw.sy + originY };
  const drawWrapOffsets = xWrap ? [-worldWrapSpan, 0, worldWrapSpan] : [0];
  const findTileAtCanvasPx = (px, py, requireInside = false) => {
    let bestIdx = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestCx = 0;
    let bestCy = 0;
    for (let i = 0; i <= maxIdx; i += 1) {
      const geom = tileGeom[i];
      const basePosRaw = tileToScreenTopLeft(geom.xPos, geom.yPos);
      const basePos = { sx: basePosRaw.sx + originX, sy: basePosRaw.sy + originY };
      for (const wrapDx of drawWrapOffsets) {
        const tx = basePos.sx + wrapDx + Math.floor(tileW / 2);
        const ty = basePos.sy + Math.floor(tileH / 2);
        const nx = Math.abs(px - tx) / Math.max(1, tileW / 2);
        const ny = Math.abs(py - ty) / Math.max(1, tileH / 2);
        const metric = nx + ny;
        if (metric < bestDist) {
          bestDist = metric;
          bestIdx = i;
          bestCx = tx;
          bestCy = ty;
        }
      }
    }
    if (bestIdx < 0) return null;
    if (requireInside && bestDist > 1.02) return null;
    return { index: bestIdx, centerX: bestCx, centerY: bestCy, metric: bestDist };
  };

  for (let i = 0; i <= maxIdx; i += 1) {
    const record = tiles[i];
    const geom = tileGeom[i];
    const basePosRaw = tileToScreenTopLeft(geom.xPos, geom.yPos);
    const basePos = { sx: basePosRaw.sx + originX, sy: basePosRaw.sy + originY };
    const terrain = parseIntLoose(getFieldByBaseKey(record, 'baserealterrain')?.value, 0);
    const resource = parseIntLoose(getFieldByBaseKey(record, 'resource')?.value, -1);
    const owner = parseIntLoose(getFieldByBaseKey(record, 'owner')?.value, 0);
    const continent = parseIntLoose(getFieldByBaseKey(record, 'continent')?.value, 0);

    let value = terrain;
    if (state.biqMapLayer === 'resource') value = resource;
    if (state.biqMapLayer === 'owner') value = owner;
    if (state.biqMapLayer === 'continent') value = continent;

    for (const wrapDx of drawWrapOffsets) {
      const sx = basePos.sx + wrapDx;
      const sy = basePos.sy;
      let drewSprite = false;
      if (state.biqMapLayer === 'terrain') drewSprite = drawTerrainSprite(record, sx, sy);
      if (!drewSprite) {
        ctx.fillStyle = value < 0 ? '#222831' : colorFromNumber(value);
        ctx.beginPath();
        ctx.moveTo(sx + Math.floor(tileW / 2), sy);
        ctx.lineTo(sx + tileW, sy + Math.floor(tileH / 2));
        ctx.lineTo(sx + Math.floor(tileW / 2), sy + tileH);
        ctx.lineTo(sx, sy + Math.floor(tileH / 2));
        ctx.closePath();
        ctx.fill();
      }
      if (state.biqMapLayer === 'terrain' && tilePx >= 4 && state.biqMapShowOverlays) {
        drawResourceOverlay(record, sx, sy);
        drawUnitOverlay(record, sx, sy);
        drawCityOverlay(record, sx, sy);
      }
      if (state.biqMapShowGrid && tilePx >= 5) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(sx + Math.floor(tileW / 2), sy);
        ctx.lineTo(sx + tileW, sy + Math.floor(tileH / 2));
        ctx.lineTo(sx + Math.floor(tileW / 2), sy + tileH);
        ctx.lineTo(sx, sy + Math.floor(tileH / 2));
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  const sx = selPos.sx;
  const sy = selPos.sy;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, Math.floor(tilePx / 2.6));
  ctx.beginPath();
  ctx.moveTo(sx + Math.floor(tileW / 2), sy);
  ctx.lineTo(sx + tileW, sy + Math.floor(tileH / 2));
  ctx.lineTo(sx + Math.floor(tileW / 2), sy + tileH);
  ctx.lineTo(sx, sy + Math.floor(tileH / 2));
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = '#1a1f2a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + Math.floor(tileW / 2), sy + 1);
  ctx.lineTo(sx + tileW - 1, sy + Math.floor(tileH / 2));
  ctx.lineTo(sx + Math.floor(tileW / 2), sy + tileH - 1);
  ctx.lineTo(sx + 1, sy + Math.floor(tileH / 2));
  ctx.closePath();
  ctx.stroke();

  canvas.addEventListener('click', (ev) => {
    if (Date.now() < (state.biqMapSuppressClickUntilTs || 0)) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    const hit = findTileAtCanvasPx(px, py, true);
    if (hit) {
      state.biqMapSelectedTile = hit.index;
      const g = tileGeom[hit.index] || null;
      appendDebugLog('biq-map:tile-select', { index: hit.index, xPos: g ? g.xPos : null, yPos: g ? g.yPos : null });
    } else {
      appendDebugLog('biq-map:tile-select-miss', { px: Math.round(px), py: Math.round(py) });
    }
    renderActiveTab({ preserveTabScroll: true });
  });
  mapPane.appendChild(canvas);
  mapFrame.appendChild(mapPane);
  mapFrame.appendChild(zoomControls);
  container.appendChild(mapFrame);

  window.requestAnimationFrame(() => {
    const zoomAnchor = state.biqMapZoomAnchor;
    if (zoomAnchor && Number.isFinite(zoomAnchor.fromZoom)) {
      const factor = scaleForZoom(state.biqMapZoom) / scaleForZoom(zoomAnchor.fromZoom);
      const targetLeft = Math.max(0, Math.round((zoomAnchor.contentX * factor) - zoomAnchor.paneX));
      const targetTop = Math.max(0, Math.round((zoomAnchor.contentY * factor) - zoomAnchor.paneY));
      mapPane.scrollLeft = targetLeft;
      mapPane.scrollTop = targetTop;
      state.biqMapScrollLeft = targetLeft;
      state.biqMapScrollTop = targetTop;
      state.biqMapZoomAnchor = null;
      return;
    }
    if (Number.isFinite(state.biqMapScrollLeft) && Number.isFinite(state.biqMapScrollTop)) {
      mapPane.scrollLeft = state.biqMapScrollLeft;
      mapPane.scrollTop = state.biqMapScrollTop;
      return;
    }
    const targetLeft = Math.max(0, sx + Math.floor(tileW / 2) - Math.floor(mapPane.clientWidth / 2));
    const targetTop = Math.max(0, sy + Math.floor(tileH / 2) - Math.floor(mapPane.clientHeight / 2));
    mapPane.scrollLeft = targetLeft;
    mapPane.scrollTop = targetTop;
    state.biqMapScrollLeft = targetLeft;
    state.biqMapScrollTop = targetTop;
    appendDebugLog('biq-map:init-scroll', { left: targetLeft, top: targetTop });
  });

  const inspector = document.createElement('div');
  inspector.className = 'section-card';
  const inspectorPos = tileGeom[state.biqMapSelectedTile] || { xPos: 0, yPos: 0 };
  inspector.innerHTML = `<div class="section-top"><strong>Tile ${state.biqMapSelectedTile}</strong><span class="hint">x=${inspectorPos.xPos}, y=${inspectorPos.yPos}</span></div>`;
  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'kv-grid';

  const addFieldEditor = (key, label) => {
    const row = document.createElement('div');
    row.className = 'kv-row compact';
    const name = document.createElement('div');
    name.className = 'field-meta';
    name.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(getFieldByBaseKey(selectedTile, key)?.value || '');
    input.addEventListener('change', () => {
      if (!isScenarioMode()) return;
      setRecordFieldValue(selectedTile, key, input.value.trim());
      renderActiveTab({ preserveTabScroll: true });
    });
    input.disabled = !isScenarioMode();
    row.appendChild(name);
    row.appendChild(input);
    fieldsGrid.appendChild(row);
  };

  addFieldEditor('baserealterrain', 'Base Terrain Code');
  addFieldEditor('resource', 'Resource');
  addFieldEditor('owner', 'Owner');
  addFieldEditor('continent', 'Continent');
  addFieldEditor('city', 'City Ref');
  addFieldEditor('unit_on_tile', 'Unit');
  addFieldEditor('rivercrossingdata', 'River Crossing');
  inspector.appendChild(fieldsGrid);
  container.appendChild(inspector);

  return container;
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
      navigateWithHistory(() => {
        state.tabContentScrollTop = el.tabContent.scrollTop;
        state.sectionListScrollTop[tabKey] = listPane.scrollTop;
        state.sectionSelection[tabKey] = sectionIndex;
      }, { preserveTabScroll: true });
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
        navigateWithHistory(() => {
          state.activeTab = key;
        }, { preserveTabScroll: false });
      });
      row.appendChild(button);
    });
    groupWrap.appendChild(row);
    el.tabs.appendChild(groupWrap);
  });
}

function renderActiveTab(options = {}) {
  const preserveTabScroll = !!options.preserveTabScroll;
  if (state.referenceSectionNavCleanup) {
    try { state.referenceSectionNavCleanup(); } catch (_err) {}
    state.referenceSectionNavCleanup = null;
  }
  if (!preserveTabScroll) {
    state.tabContentScrollTop = el.tabContent.scrollTop;
  }
  state.isRendering = true;
  hideRichTooltip();
  el.tabContent.innerHTML = '';
  const tab = state.bundle.tabs[state.activeTab];
  if (!tab) {
    state.isRendering = false;
    return;
  }

  if (tab.type === 'reference') {
    el.tabContent.appendChild(renderReferenceTab(tab, state.activeTab));
  } else if (tab.type === 'map') {
    el.tabContent.appendChild(renderMapTab(tab));
  } else if (tab.type === 'biqStructure') {
    el.tabContent.appendChild(renderBiqTab(tab));
  } else if (tab.type === 'biq') {
    el.tabContent.appendChild(renderBiqTab(tab));
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

async function loadBundleAndRender(options = {}) {
  if (state.isLoading) {
    state.pendingAutoReload = true;
    return;
  }
  if (state.autoReloadTimer) {
    window.clearTimeout(state.autoReloadTimer);
    state.autoReloadTimer = null;
  }
  syncSettingsFromInputs();
  updatePathsSummary();
  updateModeState();
  await window.c3xManager.setSettings(state.settings);
  setLoadingUi(true, options.loadingText || 'Loading configs...');

  try {
    if (!state.settings.c3xPath) {
      clearBundleView();
      setStatus('Set C3X Folder first.', true);
      updateModeState();
      return;
    }

    if (state.settings.mode === 'scenario' && !state.settings.scenarioPath) {
      clearBundleView();
      setStatus('Select a scenario .biq in Scenario mode.', true);
      updateModeState();
      return;
    }

    if (state.settings.mode === 'scenario' && !isBiqPath(state.settings.scenarioPath)) {
      clearBundleView();
      setStatus('Scenario mode requires selecting a .biq file.', true);
      updateModeState();
      return;
    }

    state.trackDirty = false;
    const bundle = await window.c3xManager.loadBundle({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      civ3Path: state.settings.civ3Path,
      scenarioPath: state.settings.scenarioPath
    });

    const previousActiveTab = state.activeTab;
    state.bundle = bundle;
    state.activeTab = bundle.tabs[previousActiveTab]
      ? previousActiveTab
      : (Object.keys(bundle.tabs)[0] || 'base');
    state.baseFilter = '';
    state.biqMapArtCache = {};
    state.biqMapArtLoading = {};
    state.biqMapSelectedTile = -1;
    state.biqMapScrollLeft = null;
    state.biqMapScrollTop = null;
    state.biqMapZoomAnchor = null;
    state.biqMapSuppressClickUntilTs = 0;
    el.workspace.classList.remove('hidden');
    renderTabs();
    renderActiveTab();
    resetNavigationHistory();
    window.setTimeout(() => {
      captureCleanSnapshot();
      state.trackDirty = true;
    }, 0);
    if (!state.hasAutoCollapsedPaths) {
      setPathsCollapsed(true);
      state.hasAutoCollapsedPaths = true;
    }
    updateModeState(bundle);
    setReferenceNotice('Configs loaded.');
    setStatus('Configs loaded. Changes to mode or paths reload automatically.');
  } catch (err) {
    clearBundleView();
    state.trackDirty = true;
    updateModeState();
    setStatus(`Failed to load configs: ${err.message}`, true);
  } finally {
    setLoadingUi(false);
    if (state.pendingAutoReload) {
      state.pendingAutoReload = false;
      void loadBundleAndRender({ loadingText: 'Applying latest mode/path changes...' });
    }
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
    ['base', 'districts', 'wonders', 'naturalWonders', 'animations', 'civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts', 'terrainPedia', 'workerActions', 'scenarioSettings', 'players', 'terrain', 'world', 'rules'].forEach((key) => {
      if (state.bundle.tabs[key]) tabsToSave[key] = state.bundle.tabs[key];
    });
    const res = await window.c3xManager.saveBundle({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      civ3Path: state.settings.civ3Path,
      scenarioPath: state.settings.scenarioPath,
      tabs: tabsToSave
    });

    if (!res.ok) {
      setStatus(`Save failed: ${res.error || 'unknown error'}`, true);
      return;
    }

    const paths = res.saveReport.map((r) => r.path).join(' | ');
    const biqReport = res.saveReport.find((r) => r.kind === 'biq');
    captureCleanSnapshot();
    if (biqReport && (Number(biqReport.skipped || 0) > 0 || String(biqReport.warning || '').trim())) {
      setStatus(`Saved ${res.saveReport.length} file(s): ${paths} | BIQ applied ${biqReport.applied || 0}, skipped ${biqReport.skipped || 0}.`, true);
    } else {
      setStatus(`Saved ${res.saveReport.length} file(s): ${paths}`);
    }
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
    if (input === el.civ3Path) {
      await refreshScenarioSelectOptions();
    }
    updatePathsSummary();
    updateModeState();
    await window.c3xManager.setSettings(state.settings);
    await loadBundleAndRender({ loadingText: 'Reloading after path change...' });
  });
}

async function wireScenarioBrowseButton(button, input) {
  button.addEventListener('click', async () => {
    const filePath = await window.c3xManager.pickFile({
      filters: [{ name: 'BIQ Scenario Files', extensions: ['biq'] }]
    });
    if (!filePath) return;
    input.value = filePath;
    syncSettingsFromInputs();
    updateScenarioSelectValue();
    updatePathsSummary();
    updateModeState();
    await window.c3xManager.setSettings(state.settings);
    await loadBundleAndRender({ loadingText: 'Reloading scenario...' });
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
  if (!isBiqPath(state.settings.scenarioPath)) return false;
  return await window.c3xManager.pathExists(state.settings.scenarioPath);
}

async function init() {
  state.settings = await window.c3xManager.getSettings();
  applyUiFontScale(state.settings.uiFontScale || 1);
  state.trackDirty = false;
  state.suppressDirtyUntilInteraction = true;
  refreshDirtyUi();
  updateNavButtons();
  fillInputsFromSettings();
  setPathsCollapsed(false);
  setMode(state.settings.mode || 'global');
  await refreshScenarioSelectOptions();
  updateModeState();

  const unlockDirtyTracking = () => {
    state.suppressDirtyUntilInteraction = false;
  };
  document.addEventListener('pointerdown', unlockDirtyTracking, { capture: true });
  document.addEventListener('keydown', unlockDirtyTracking, { capture: true });

  el.modeGlobal.addEventListener('click', async () => {
    setMode('global');
    await window.c3xManager.setSettings(state.settings);
    await loadBundleAndRender({ loadingText: 'Switching to standard game...' });
  });

  if (el.modeScenarioSelect) {
    el.modeScenarioSelect.addEventListener('change', async () => {
      const selected = el.modeScenarioSelect.value;
      if (!selected) {
        return;
      }
      setMode('scenario');
      if (selected !== '__manual__') {
        el.scenarioPath.value = selected;
      }
      syncSettingsFromInputs();
      updateScenarioSelectValue();
      await window.c3xManager.setSettings(state.settings);
      await loadBundleAndRender({ loadingText: 'Switching to scenario...' });
    });
  }

  if (el.fontDown) {
    el.fontDown.addEventListener('click', () => {
      const current = state.settings && state.settings.uiFontScale ? state.settings.uiFontScale : 1;
      setUiFontScale(current - 0.05, true);
    });
  }
  if (el.fontUp) {
    el.fontUp.addEventListener('click', () => {
      const current = state.settings && state.settings.uiFontScale ? state.settings.uiFontScale : 1;
      setUiFontScale(current + 0.05, true);
    });
  }

  [el.c3xPath, el.civ3Path, el.scenarioPath].forEach((input) => {
    input.addEventListener('input', () => {
      syncSettingsFromInputs();
      if (input === el.civ3Path) {
        void refreshScenarioSelectOptions();
      } else if (input === el.scenarioPath) {
        updateScenarioSelectValue();
      }
      updatePathsSummary();
      updateModeState();
      void window.c3xManager.setSettings(state.settings);
      queueAutoReload('Reloading after path edit...');
    });
    input.addEventListener('blur', () => {
      if (input === el.civ3Path) {
        void refreshScenarioSelectOptions();
      }
      queueAutoReload('Reloading after path edit...', 80);
    });
  });

  if (el.pathsToggle) {
    el.pathsToggle.addEventListener('click', () => {
      setPathsCollapsed(!state.pathsCollapsed);
    });
  }

  el.saveBtn.addEventListener('click', saveCurrentBundle);
  if (el.undoBtn) {
    el.undoBtn.addEventListener('click', undoOneStep);
  }
  if (el.resetBtn) {
    el.resetBtn.addEventListener('click', resetCurrentBundle);
  }
  if (el.backBtn) {
    el.backBtn.addEventListener('click', navigateBack);
  }
  if (el.forwardBtn) {
    el.forwardBtn.addEventListener('click', navigateForward);
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
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const target = ev.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains('app-search-input')) return;
    if (!target.value) return;
    target.value = '';
    target.dispatchEvent(new Event('input', { bubbles: true }));
    ev.preventDefault();
    ev.stopPropagation();
  });
  if (el.debugDrawer) {
    document.addEventListener('click', (ev) => {
      if (el.debugDrawer.classList.contains('hidden')) return;
      const target = ev.target;
      if (!target) return;
      if (el.debugDrawer.contains(target)) return;
      if (el.debugToggle && el.debugToggle.contains(target)) return;
      el.debugDrawer.classList.add('hidden');
    });
  }

  wireBrowseButton(el.pickC3x, el.c3xPath);
  wireBrowseButton(el.pickCiv3, el.civ3Path);
  wireScenarioBrowseButton(el.pickScenario, el.scenarioPath);

  setStatus('Auto-reload is enabled. Changing mode or paths reloads configs.');

  if (await shouldAutoLoad()) {
    await loadBundleAndRender();
  }
}

init();
