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
  cleanTabsCache: null,
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
  sectionFilter: {},
  biqRecordFilter: {},
  referenceSearchCaret: {},
  referenceSearchFocusedTab: null,
  referenceNotice: null,
  biqSectionSelectionByTab: {},
  biqRecordSelection: {},
  techTreeSnapByTab: {},
  biqMapZoom: 6,
  biqMapLayer: 'terrain',
  biqMapShowGrid: false,
  biqMapShowOverlays: true,
  biqMapShowCityNames: true,
  biqMapSelectedTile: -1,
  biqMapScrollLeft: null,
  biqMapScrollTop: null,
  biqMapRerenderPending: false,
  biqMapLastScrollLogTs: 0,
  biqMapZoomAnchor: null,
  biqMapZoomAnim: null,
  biqMapZoomAnimRaf: 0,
  biqMapSuppressClickUntilTs: 0,
  biqMapArtCache: {},
  biqMapArtLoading: {},
  biqMapTerritoryEdgeCache: new Map(),
  biqMapNtpColorCache: {},
  previewCache: new Map(),
  districtRepresentativePreviewPending: new Map(),
  unitAnimationUiByKey: {},
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
  referenceSectionNavCleanup: null,
  dirtyTabCounts: {},
  dirtyReferenceKeysByTab: {},
  dirtySectionIndexesByTab: {},
  unsavedModal: {
    open: false,
    resolve: null
  },
  entityModal: {
    open: false,
    resolve: null
  },
  globalSearch: {
    open: false,
    query: '',
    activeIndex: 0,
    results: []
  },
  diplomacyEditorSelection: {
    sectionKey: '',
    blockId: ''
  },
  techTreeEraSelectionByTab: {},
  mapEditorTool: {
    mode: 'select',
    diameter: 1,
    terrainCode: 0,
    overlayType: 'road',
    fogMode: 'add',
    districtType: 0,
    districtState: 1,
    ownerType: 1,
    owner: 0,
    unitType: 0
  },
  settingsPersistTimer: null,
  performanceMenuUnsubscribe: null,
  startupPerformanceMode: 'high',
  sectionValidationError: '',
  copyDebugFeedbackTimer: null,
  filesReadAccessByPath: {},
  filesReadIssueCount: 0,
  filesReadAccessRequestId: 0,
  filesReadEntriesCache: null,
  filesReadEntriesCacheDirty: true,
  filesReadRenderTimer: null,
  filesReadSearchInputMirror: '',
  filesReadSearchQuery: '',
  fileDiffOpen: false,
  saveUi: {
    toastTimer: null,
    toastPhase: 'idle',
    detailOpen: false,
    detailItems: [],
    detailSummary: '',
    rollbackSummary: '',
    rollbackHasWarning: false
  },
  filesReadFilters: {
    locationCore: false,
    locationScenario: false,
    locationC3x: false,
    locationExternal: false,
    typeConfigIni: true,
    typeAnimationIni: false,
    typeText: true,
    typeBiq: true,
    statusNew: false,
    statusChanged: false,
    statusUnchanged: false,
    statusRisk: false
  }
};
const mapCore = (typeof window !== 'undefined' && window.MapEditorCore) ? window.MapEditorCore : null;
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
const techTreeModal = {
  node: null,
  body: null,
  title: null
};
const mapModal = {
  node: null,
  body: null,
  title: null,
  tab: null,
  tileSection: null
};
const pediaLinkPreview = {
  node: null,
  img: null,
  title: null,
  body: null,
  activeKey: ''
};
const UNIT_FACING_OPTIONS = [
  { index: 0, key: 'sw', label: 'SW', glyph: '↙' },
  { index: 1, key: 's', label: 'S', glyph: '↓' },
  { index: 2, key: 'se', label: 'SE', glyph: '↘' },
  { index: 3, key: 'e', label: 'E', glyph: '→' },
  { index: 4, key: 'ne', label: 'NE', glyph: '↗' },
  { index: 5, key: 'n', label: 'N', glyph: '↑' },
  { index: 6, key: 'nw', label: 'NW', glyph: '↖' },
  { index: 7, key: 'w', label: 'W', glyph: '←' }
];
const UNIT_DIRECTION_SLICE_OFFSET = 0;
const DEFAULT_PERFORMANCE_MODE = 'high';
const previewScratch = {
  canvas: null,
  ctx: null
};

function setPreviewCache(key, value) {
  const cacheKey = String(key || '');
  if (!cacheKey) return;
  if (state.previewCache.has(cacheKey)) state.previewCache.delete(cacheKey);
  state.previewCache.set(cacheKey, value);
  while (state.previewCache.size > getPreviewCacheLimit()) {
    const first = state.previewCache.keys().next();
    if (first && !first.done) state.previewCache.delete(first.value);
    else break;
  }
}

function getPerformanceMode() {
  const mode = String(state.settings && state.settings.performanceMode || DEFAULT_PERFORMANCE_MODE).toLowerCase();
  return mode === 'safe' ? 'safe' : 'high';
}

function getPreviewCacheLimit() {
  return getPerformanceMode() === 'safe' ? 220 : 700;
}

function getDefaultFrameSampleLimit() {
  return getPerformanceMode() === 'safe' ? 90 : 220;
}

function getPreviewScratchCanvas(width, height) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  if (!previewScratch.canvas) {
    previewScratch.canvas = document.createElement('canvas');
    previewScratch.ctx = previewScratch.canvas.getContext('2d');
  }
  if (!previewScratch.ctx) return null;
  if (previewScratch.canvas.width !== w) previewScratch.canvas.width = w;
  if (previewScratch.canvas.height !== h) previewScratch.canvas.height = h;
  return previewScratch;
}

const el = {
  modeGlobal: document.getElementById('mode-global'),
  modeScenarioSelect: document.getElementById('mode-scenario-select'),
  modeScenarioNewAction: document.getElementById('mode-scenario-new-action'),
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
  globalSearchBtn: document.getElementById('global-search-btn'),
  modeStateBadge: document.getElementById('mode-state-badge'),
  modeStateDetail: document.getElementById('mode-state-detail'),
  scenarioTitleChip: document.getElementById('scenario-title-chip'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.getElementById('loading-text'),
  unsavedModalOverlay: document.getElementById('unsaved-modal-overlay'),
  unsavedModalBody: document.getElementById('unsaved-modal-body'),
  unsavedSaveContinue: document.getElementById('unsaved-save-continue'),
  unsavedDiscard: document.getElementById('unsaved-discard'),
  unsavedCancel: document.getElementById('unsaved-cancel'),
  entityModalOverlay: document.getElementById('entity-modal-overlay'),
  entityModalTitle: document.getElementById('entity-modal-title'),
  entityModalBody: document.getElementById('entity-modal-body'),
  entityModalContent: document.getElementById('entity-modal-content'),
  entityModalCancel: document.getElementById('entity-modal-cancel'),
  entityModalConfirm: document.getElementById('entity-modal-confirm'),
  globalSearchOverlay: document.getElementById('global-search-overlay'),
  globalSearchInput: document.getElementById('global-search-input'),
  globalSearchResults: document.getElementById('global-search-results'),
  backBtn: document.getElementById('back-btn'),
  forwardBtn: document.getElementById('forward-btn'),
  saveBtn: document.getElementById('save-btn'),
  undoBtn: document.getElementById('undo-btn'),
  dirtyIndicator: document.getElementById('dirty-indicator'),
  debugLog: document.getElementById('debug-log'),
  copyDebugLog: document.getElementById('copy-debug-log'),
  clearDebugLog: document.getElementById('clear-debug-log'),
  filesReadToggle: document.getElementById('files-read-toggle'),
  filesReadModalOverlay: document.getElementById('files-read-modal-overlay'),
  filesReadModalBody: document.getElementById('files-read-modal-body'),
  fileDiffModalOverlay: document.getElementById('file-diff-modal-overlay'),
  fileDiffModalTitle: document.getElementById('file-diff-modal-title'),
  fileDiffModalBody: document.getElementById('file-diff-modal-body'),
  fileDiffContent: document.getElementById('file-diff-content'),
  fileDiffClose: document.getElementById('file-diff-close'),
  saveToast: document.getElementById('save-toast'),
  saveToastButton: document.getElementById('save-toast-button'),
  saveToastIcon: document.getElementById('save-toast-icon'),
  saveToastTitle: document.getElementById('save-toast-title'),
  saveToastBody: document.getElementById('save-toast-body'),
  saveProgressModalOverlay: document.getElementById('save-progress-modal-overlay'),
  saveProgressModalBody: document.getElementById('save-progress-modal-body'),
  saveProgressList: document.getElementById('save-progress-list'),
  saveProgressRollback: document.getElementById('save-progress-rollback'),
  saveProgressClose: document.getElementById('save-progress-close'),
  filesReadFiltersWrap: document.getElementById('files-read-filters'),
  filesReadSearchInput: document.getElementById('files-read-search'),
  filesFilterCore: document.getElementById('files-filter-core'),
  filesFilterScenario: document.getElementById('files-filter-scenario'),
  filesFilterC3x: document.getElementById('files-filter-c3x'),
  filesFilterExternal: document.getElementById('files-filter-external'),
  filesFilterTypeConfigIni: document.getElementById('files-filter-type-config-ini'),
  filesFilterTypeAnimationIni: document.getElementById('files-filter-type-animation-ini'),
  filesFilterTypeText: document.getElementById('files-filter-type-text'),
  filesFilterTypeBiq: document.getElementById('files-filter-type-biq'),
  filesFilterStatusNew: document.getElementById('files-filter-status-new'),
  filesFilterStatusChanged: document.getElementById('files-filter-status-changed'),
  filesFilterStatusUnchanged: document.getElementById('files-filter-status-unchanged'),
  filesFilterStatusRisk: document.getElementById('files-filter-status-risk'),
  filesReadList: document.getElementById('files-read-list'),
  filesReadClose: document.getElementById('files-read-close'),
  debugToggle: document.getElementById('debug-toggle'),
  debugDrawer: document.getElementById('debug-drawer'),
  debugClose: document.getElementById('debug-close'),
  scrollTopFab: document.getElementById('scroll-top-fab'),
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
  gameConcepts: 'icon-c3x-concepts',
  map: 'icon-map',
  scenarioSettings: 'icon-scenario-settings',
  players: 'icon-players',
  terrain: 'icon-terrain',
  terrainPedia: 'icon-terrain-pedia',
  workerActions: 'icon-worker-actions',
  world: 'icon-world',
  rules: 'icon-rules',
  base: 'icon-base',
  districts: 'icon-district',
  wonders: 'icon-wonder',
  naturalWonders: 'icon-natural-wonder',
  animations: 'icon-anim'
};
const TAB_GROUPS = [
  { label: 'CIV 3', keys: ['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts', 'map', 'scenarioSettings', 'players', 'terrain', 'world', 'rules', 'terrainPedia', 'workerActions'] },
  { label: 'C3X', keys: ['base', 'districts', 'wonders', 'naturalWonders', 'animations'] }
];
const REFERENCE_MUTABLE_ENTITY_TABS = new Set(['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts']);
const REFERENCE_TOP_NAME_EDIT_TABS = new Set(['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts']);
const REFERENCE_PREFIX_BY_TAB = {
  civilizations: 'RACE_',
  technologies: 'TECH_',
  resources: 'GOOD_',
  improvements: 'BLDG_',
  governments: 'GOVT_',
  units: 'PRTO_',
  gameConcepts: 'GCON_'
};
const ALL_REFERENCE_PREFIXES = Array.from(
  new Set(Object.values(REFERENCE_PREFIX_BY_TAB).filter(Boolean).map((v) => String(v).toUpperCase()))
).sort((a, b) => b.length - a.length);
const CIVILOPEDIA_TEXT_UTILS = (typeof window !== 'undefined' && window.c3xCivilopediaText)
  ? window.c3xCivilopediaText
  : null;
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
const BIQ_TERRAIN = {
  DESERT: 0,
  PLAINS: 1,
  GRASSLAND: 2,
  TUNDRA: 3,
  FLOODPLAIN: 4,
  HILLS: 5,
  MOUNTAIN: 6,
  FOREST: 7,
  JUNGLE: 8,
  MARSH: 9,
  VOLCANO: 10,
  COAST: 11,
  SEA: 12,
  OCEAN: 13
};
const BIQ_TILE_BONUS = {
  SNOW_CAPPED_MOUNTAIN: 0x10,
  PINE_FOREST: 0x20,
  LANDMARK: 0x2000
};
const BIQ_MAP_ZOOM_MIN = 2;
const BIQ_MAP_ZOOM_MAX = 18;
const BIQ_MAP_ZOOM_LEVELS = [3, 5, 7, 9, 12, 16];

const BASE_ENUM_OPTIONS = {
  draw_lines_using_gdi_plus: ['never', 'wine', 'always'],
  double_minimap_size: ['never', 'always', 'high-def'],
  unit_cycle_search_criteria: ['standard', 'similar-near-start', 'similar-near-destination'],
  day_night_cycle_mode: ['off', 'timer', 'user-time', 'every-turn', 'specified'],
  seasonal_cycle_mode: ['off', 'timer', 'user-season', 'every-turn', 'on-day-night-hour', 'specified']
};
const BASE_SEGMENTED_OPTIONS = {
  draw_lines_using_gdi_plus: ['never', 'wine', 'always'],
  double_minimap_size: ['never', 'always', 'high-def'],
  unit_cycle_search_criteria: ['standard', 'similar-near-start', 'similar-near-destination'],
  day_night_cycle_mode: ['off', 'timer', 'user-time', 'every-turn', 'specified'],
  seasonal_cycle_mode: ['off', 'timer', 'user-season', 'every-turn', 'on-day-night-hour', 'specified'],
  distribution_hub_yield_division_mode: ['flat', 'scale-by-city-count'],
  ai_distribution_hub_build_strategy: ['auto', 'by-city-count'],
  ai_auto_build_great_wall_strategy: ['all-borders', 'other-civ-bordered-only'],
  work_area_limit: ['none', 'cultural', 'cultural-min-2', 'cultural-or-adjacent'],
  land_retreat_rules: ['standard', 'none', 'all-units', 'if-faster'],
  sea_retreat_rules: ['standard', 'none', 'all-units', 'if-faster'],
  aircraft_victory_animation: ['none', 'blank', 'default', 'run', 'attack1', 'attack2', 'attack3', 'death', 'fortify', 'fidget', 'victory', 'capture', 'fortress', 'build', 'road', 'mine', 'irrigate', 'jungle', 'forest', 'plant']
};
const BASE_REFERENCE_LIST_TAB_BY_KEY = {
  exclude_types_from_units_per_tile_limit: 'units',
  limit_defensive_retreat_on_water_to_types: 'units',
  ptw_like_artillery_targeting: 'units',
  ai_multi_start_extra_palaces: 'improvements'
};
const BASE_MULTI_CHOICE_LIST_OPTIONS = {
  special_defensive_bombard_rules: ['lethal', 'aerial', 'not-invisible', 'blitz', 'docked-vs-land', 'all'],
  special_zone_of_control_rules: ['amphibious', 'lethal', 'aerial', 'not-from-inside', 'all'],
  land_transport_rules: ['load-onto-boat', 'join-army', 'no-defense-from-inside', 'no-escape'],
  special_helicopter_rules: ['allow-on-carriers', 'passenger-airdrop', 'no-defense-from-inside', 'no-escape'],
  enabled_seasons: ['summer', 'fall', 'winter', 'spring']
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
const C3X_RELEASE_BY_KEY = Object.freeze({
  city_limit: 'R25',
  allow_multipage_civilopedia_descriptions: 'R25',
  years_to_double_building_culture: 'R25',
  prevent_old_units_from_upgrading_past_ability_block: 'R25',
  tourism_time_scale_percent: 'R25',
  introduce_all_human_players_at_start_of_hotseat_game: 'R25',
  double_minimap_size: 'R25',
  convert_some_popups_into_online_mp_messages: 'R25',
  enable_debug_mode_switch: 'R25',
  show_territory_colors_on_water_tiles_in_minimap: 'R25',
  accentuate_cities_on_minimap: 'R25',
  share_wonders_in_hotseat: 'R24',
  enable_caravan_unit_ai: 'R24',
  delete_off_map_ai_units: 'R24',
  patch_premature_truncation_of_found_paths: 'R24',
  patch_zero_production_crash: 'R24',
  fix_overlapping_specialist_yield_icons: 'R24',
  ai_settler_perfume_on_founding: 'R23',
  ai_settler_perfume_on_founding_duration: 'R23',
  limit_unit_loading_to_one_transport_per_turn: 'R23',
  rebase_range_multiplier: 'R23',
  city_work_radius: 'R22',
  work_area_limit: 'R22',
  do_not_unassign_workers_from_polluted_tiles: 'R22',
  limit_units_per_tile: 'R21',
  chance_for_nukes_to_destroy_max_one_hp_units: 'R21',
  limited_railroads_work_like_fast_roads: 'R21',
  allow_sale_of_aqueducts_and_hospitals: 'R21',
  no_cross_shore_detection: 'R21',
  remove_city_improvement_limit: 'R20',
  production_perfume: 'R20',
  technology_perfume: 'R20',
  government_perfume: 'R20',
  patch_disease_stopping_tech_flag_bug: 'R20',
  show_hp_of_stealth_attack_options: 'R20',
  warn_when_chosen_building_would_replace_another: 'R20',
  exclude_invisible_units_from_stealth_attack: 'R20',
  compact_strategic_resource_display_on_city_screen: 'R20',
  convert_to_landmark_after_planting_forest: 'R20',
  ai_multi_city_start: 'R18',
  ai_multi_start_extra_palaces: 'R18',
  allow_upgrades_in_any_city: 'R18',
  do_not_generate_volcanos: 'R18',
  enable_trade_net_x: 'R17',
  civ_aliases_by_era: 'R17',
  leader_aliases_by_era: 'R17',
  allow_defensive_retreat_on_water: 'R17',
  extra_unit_maintenance_per_shields: 'R17',
  ai_worker_requirement_percent: 'R17',
  dont_escort_unflagged_units: 'R17',
  allow_airdrop_without_airport: 'R17',
  allow_bombard_of_other_improvs_on_occupied_airfield: 'R17',
  optimize_improvement_loops: 'R16',
  show_untradable_techs_on_trade_screen: 'R16',
  no_elvis_easter_egg: 'R16',
  replay_ai_moves_in_hotseat_games: 'R15',
  enable_stealth_attack_via_bombardment: 'R15',
  ptw_like_artillery_targeting: 'R15',
  intercept_recon_missions: 'R15',
  charge_one_move_for_recon_and_interception: 'R15',
  immunize_aircraft_against_bombardment: 'R15',
  aggressively_penalize_bankruptcy: 'R14',
  strengthen_forbidden_palace_ocn_effect: 'R13',
  allow_military_leaders_to_hurry_wonders: 'R13',
  ai_research_multiplier: 'R13',
  building_prereqs_for_units: 'R11',
  buildings_generating_resources: 'R11',
  dont_end_units_turn_after_airdrop: 'R10',
  disable_worker_automation: 'R9',
  compact_luxury_display_on_city_screen: 'R17',
  minimum_city_separation: 'R7',
  ai_build_artillery_ratio: 'R6',
  enable_stack_unit_commands: 'R5',
  skip_repeated_tile_improv_replacement_asks: 'R5',
  enable_stack_bombard: 'R1',
  prevent_autorazing: 'R1',
  prevent_razing_by_players: 'R1',
  enable_districts: 'R26',
  allow_sale_of_small_wonders: 'R26',
  allow_unload_from_army: 'R26',
  no_land_anti_air_from_inside_naval_transport: 'R26',
  prevent_enslaving_by_bombardment: 'R26',
  land_transport_rules: 'R26',
  allow_adjacent_resources_of_different_types: 'R26',
  luxury_randomized_appearance_rate_percent: 'R26',
  tiles_per_non_luxury_resource: 'R26',
  neighborhood_needed_message_frequency: 'R26',
  show_message_when_building_received_by_mutual_district: 'R26',
  special_helicopter_rules: 'R27',
  aircraft_victory_animation: 'R27',
  unit_cycle_search_criteria: 'R27',
  show_armies_performing_defensive_bombard: 'R27',
  exclude_types_from_units_per_tile_limit: 'R27',
  limit_defensive_retreat_on_water_to_types: 'R27',
  enable_custom_animations: 'R27',
  day_night_cycle_mode: 'R25',
  elapsed_minutes_per_day_night_hour_transition: 'R25',
  fixed_hours_per_turn_for_day_night_cycle: 'R25',
  pinned_hour_for_day_night_cycle: 'R25',
  seasonal_cycle_mode: 'R28',
  enabled_seasons: 'R28',
  pinned_season_for_seasonal_cycle: 'R28',
  elapsed_minutes_per_season_transition: 'R28',
  fixed_turns_per_season: 'R28',
  transition_season_on_day_night_hour: 'R28',
  add_natural_wonders_to_scenarios_if_none: 'R27',
  show_natural_wonder_name_on_map: 'R26',
  enable_neighborhood_districts: 'R26',
  enable_wonder_districts: 'R26',
  enable_distribution_hub_districts: 'R26',
  enable_aerodrome_districts: 'R26',
  enable_port_districts: 'R27',
  enable_bridge_districts: 'R27',
  enable_canal_districts: 'R27',
  enable_central_rail_hub_districts: 'R27',
  enable_energy_grid_districts: 'R27',
  enable_great_wall_districts: 'R27',
  cities_with_mutual_district_receive_buildings: 'R26',
  cities_with_mutual_district_receive_wonders: 'R26',
  show_message_when_building_lost_to_destroyed_district: 'R26',
  air_units_use_aerodrome_districts_not_cities: 'R26',
  naval_units_use_port_districts_not_cities: 'R27',
  maximum_pop_before_neighborhood_needed: 'R26',
  per_neighborhood_pop_growth_enabled: 'R26',
  destroying_neighborhood_reduces_pop: 'R27',
  completed_wonder_districts_can_be_destroyed: 'R26',
  destroyed_wonders_can_be_built_again: 'R26',
  distribution_hub_yield_division_mode: 'R27',
  ai_distribution_hub_build_strategy: 'R27',
  distribution_hub_food_yield_divisor: 'R26',
  distribution_hub_shield_yield_divisor: 'R26',
  ai_ideal_distribution_hub_count_per_100_cities: 'R26',
  max_distribution_hub_count_per_100_cities: 'R27',
  central_rail_hub_distribution_food_bonus_percent: 'R27',
  central_rail_hub_distribution_shield_bonus_percent: 'R27',
  expand_water_tile_checks_to_city_work_area: 'R27',
  workers_can_enter_coast: 'R27',
  max_contiguous_bridge_districts: 'R27',
  max_contiguous_canal_districts: 'R27',
  ai_canal_eval_min_bisected_land_tiles: 'R27',
  ai_bridge_canal_eval_block_size: 'R27',
  ai_bridge_eval_lake_tile_threshold: 'R27',
  ai_can_replace_existing_districts_with_canals: 'R27',
  ai_builds_bridges: 'R27',
  ai_builds_canals: 'R27',
  ai_defends_districts: 'R26',
  ai_city_district_max_build_wait_turns: 'R27',
  disable_great_wall_city_defense_bonus: 'R27',
  great_wall_districts_impassible_by_others: 'R27',
  auto_build_great_wall_around_territory: 'R27',
  great_wall_auto_build_wonder_name: 'R27',
  ai_auto_build_great_wall_strategy: 'R27',
  enable_city_work_radii_highlights: 'R26',
  enable_named_tiles: 'R27',
  enable_custom_animations: 'R28'
});
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
      { key: 'custom_width', label: 'Custom Width', desc: 'Optional custom district sprite width.', type: 'number' },
      { key: 'custom_height', label: 'Custom Height', desc: 'Optional custom district sprite height.', type: 'number' },
      { key: 'x_offset', label: 'X Offset', desc: 'Horizontal pixel offset for district art.', type: 'number' },
      { key: 'y_offset', label: 'Y Offset', desc: 'Vertical pixel offset for district art.', type: 'number' },
      { key: 'btn_tile_sheet_row', label: 'Button Tile Row', desc: 'Row index in district button sheet.', type: 'number' },
      { key: 'btn_tile_sheet_column', label: 'Button Tile Column', desc: 'Column index in district button sheet.', type: 'number' },
      { key: 'advance_prereqs', label: 'Tech Prerequisites', desc: 'List of required advances.', type: 'list' },
      { key: 'obsoleted_by', label: 'Obsoleted By', desc: 'Technology that disables this district.', type: 'list' },
      { key: 'dependent_improvs', label: 'Dependent Improvements', desc: 'List of city improvements this district unlocks.', type: 'list' },
      { key: 'buildable_on', label: 'Buildable Terrain', desc: 'Allowed terrain list.', type: 'list', options: [...TERRAIN_OPTIONS, 'lake'] },
      { key: 'buildable_adjacent_to', label: 'Adjacency Requirement', desc: 'Required adjacent terrain/city list.', type: 'list', options: [...TERRAIN_OPTIONS, 'lake', 'city'] },
      { key: 'align_to_coast', label: 'Align To Coast', desc: 'Use coastline-oriented district art variants.', type: 'bool' },
      { key: 'auto_add_road', label: 'Auto Add Road', desc: 'Automatically add roads when district is placed.', type: 'bool' },
      { key: 'auto_add_railroad', label: 'Auto Add Railroad', desc: 'Automatically add railroads when district is placed.', type: 'bool' },
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
      { key: 'name', label: 'Wonder Name', desc: 'Must match the in-game wonder improvement name.', type: 'select', required: true },
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
      { key: 'enable_img_alt_dir', label: 'Enable Alt Direction Art', desc: 'Use alternate directional art set.', type: 'bool' },
      { key: 'img_alt_dir_construct_row', label: 'Alt Construct Row', desc: 'Alternate-direction construction art row index.', type: 'number' },
      { key: 'img_alt_dir_construct_column', label: 'Alt Construct Column', desc: 'Alternate-direction construction art column index.', type: 'number' },
      { key: 'img_alt_dir_row', label: 'Alt Completed Row', desc: 'Alternate-direction completed art row index.', type: 'number' },
      { key: 'img_alt_dir_column', label: 'Alt Completed Column', desc: 'Alternate-direction completed art column index.', type: 'number' },
      { key: 'custom_width', label: 'Custom Width', desc: 'Override wonder sprite width in pixels.', type: 'number' },
      { key: 'custom_height', label: 'Custom Height', desc: 'Override wonder sprite height in pixels.', type: 'number' }
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

const SPECIAL_DISTRICT_DEFAULTS = [
  {
    name: 'Neighborhood',
    fields: {
      name: 'Neighborhood',
      display_name: 'Neighborhood',
      tooltip: 'Build Neighborhood',
      img_paths: 'Neighborhood_AMER.pcx, Neighborhood_EURO.pcx, Neighborhood_ROMAN.pcx, Neighborhood_MIDEAST.pcx, Neighborhood_ASIAN.pcx',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '1',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '0',
      culture_bonus: '1',
      science_bonus: '1',
      gold_bonus: '1',
      defense_bonus_percent: '25'
    }
  },
  {
    name: 'Wonder District',
    fields: {
      name: 'Wonder District',
      display_name: 'Wonder District',
      tooltip: 'Build Wonder District',
      img_paths: 'WonderDistrict.pcx',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill, coast, mountain',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '1'
    }
  },
  {
    name: 'Distribution Hub',
    fields: {
      name: 'Distribution Hub',
      display_name: 'Distribution Hub',
      tooltip: 'Build Distribution Hub',
      advance_prereqs: 'Construction',
      img_paths: 'DistributionHub.pcx',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '2'
    }
  },
  {
    name: 'Aerodrome',
    fields: {
      name: 'Aerodrome',
      display_name: 'Aerodrome',
      tooltip: 'Build Aerodrome',
      advance_prereqs: 'Flight',
      img_paths: 'Aerodrome.pcx',
      dependent_improvs: 'Airport',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '3'
    }
  },
  {
    name: 'Port',
    fields: {
      name: 'Port',
      display_name: 'Port',
      tooltip: 'Build Port',
      advance_prereqs: 'Map Making',
      img_paths: 'Port_NW.pcx, Port_NE.pcx, Port_SE.pcx, Port_SW.pcx',
      dependent_improvs: 'Harbor, Commercial Dock',
      buildable_on: 'coast',
      align_to_coast: '1',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '4'
    }
  },
  {
    name: 'Central Rail Hub',
    fields: {
      name: 'Central Rail Hub',
      display_name: 'Central Rail Hub',
      tooltip: 'Build Central Rail Hub',
      advance_prereqs: 'Steam Power',
      resource_prereqs: 'Iron, Coal',
      img_paths: 'CentralRailHub_AMER.pcx, CentralRailHub_EURO.pcx, CentralRailHub_ROMAN.pcx, CentralRailHub_MIDEAST.pcx, CentralRailHub_ASIAN.pcx',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill',
      auto_add_road: '1',
      auto_add_railroad: '1',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '5'
    }
  },
  {
    name: 'Energy Grid',
    fields: {
      name: 'Energy Grid',
      display_name: 'Energy Grid',
      tooltip: 'Build Energy Grid',
      advance_prereqs: 'Industrialization',
      img_paths: 'EnergyGrid.pcx',
      dependent_improvs: 'Coal Plant, Hydro Plant, Nuclear Plant, Solar Plant',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill',
      custom_height: '84',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '6',
      shield_bonus: '2'
    }
  },
  {
    name: 'Bridge',
    fields: {
      name: 'Bridge',
      display_name: 'Bridge',
      tooltip: 'Build Bridge',
      advance_prereqs: 'Industrialization',
      img_paths: 'Bridge.pcx',
      buildable_on: 'coast',
      custom_width: '176',
      custom_height: '112',
      x_offset: '0',
      y_offset: '24',
      auto_add_road: '1',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '7'
    }
  },
  {
    name: 'Canal',
    fields: {
      name: 'Canal',
      display_name: 'Canal',
      tooltip: 'Build Canal',
      advance_prereqs: 'Industrialization',
      img_paths: 'Canal.pcx',
      buildable_on: 'desert, plains, grassland, tundra, floodplain',
      custom_width: '176',
      custom_height: '112',
      x_offset: '0',
      y_offset: '24',
      allow_multiple: '1',
      vary_img_by_era: '1',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '8'
    }
  },
  {
    name: 'Great Wall',
    fields: {
      name: 'Great Wall',
      display_name: 'Great Wall',
      tooltip: 'Build Great Wall',
      obsoleted_by: 'Metallurgy',
      img_paths: 'GreatWall.pcx',
      wonder_prereqs: 'The Great Wall',
      buildable_on: 'desert, plains, grassland, tundra, floodplain, hill, mountain, forest, swamp, jungle, volcano',
      custom_height: '88',
      draw_over_resources: '1',
      allow_multiple: '1',
      vary_img_by_era: '0',
      vary_img_by_culture: '0',
      btn_tile_sheet_row: '0',
      btn_tile_sheet_column: '9',
      defense_bonus_percent: '50'
    }
  }
];

function findSpecialDistrictDefaultByName(name) {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return null;
  return SPECIAL_DISTRICT_DEFAULTS.find((entry) => String(entry && entry.name || '').trim().toLowerCase() === target) || null;
}

function applySpecialDistrictDefaultsToSections(sections) {
  if (!Array.isArray(sections)) return;
  const findSectionByName = (needle) => sections.find((section) => {
    const sectionName = String(getFieldValue(section, 'name') || '').trim().toLowerCase();
    return sectionName && sectionName === needle;
  }) || null;
  SPECIAL_DISTRICT_DEFAULTS.forEach((entry) => {
    const needle = String(entry && entry.name || '').trim().toLowerCase();
    if (!needle) return;
    let section = findSectionByName(needle);
    if (!section) {
      section = { marker: '#District', fields: [], comments: [] };
      sections.push(section);
    }
    Object.entries(entry.fields || {}).forEach(([key, value]) => {
      const existing = section.fields.filter((field) => field && field.key === key);
      const hasValue = existing.some((field) => String(field.value || '').trim() !== '');
      if (!hasValue) {
        section.fields.push({ key, value: String(value || '').trim() });
      }
    });
  });
}

function getExpectedDistrictImagePathCount(section, parsedPaths = null) {
  const values = Array.isArray(parsedPaths)
    ? parsedPaths.map((v) => String(v || '').trim()).filter(Boolean)
    : tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths')).map((v) => String(v || '').trim()).filter(Boolean);
  if (getFieldValue(section, 'vary_img_by_culture') === '1') return 5;
  if (getFieldValue(section, 'align_to_coast') === '1') return 4;
  const preset = findSpecialDistrictDefaultByName(getFieldValue(section, 'name'));
  if (preset) {
    return tokenizeListPreservingQuotes(String(preset.fields && preset.fields.img_paths || '')).map((v) => String(v || '').trim()).filter(Boolean).length || 1;
  }
  return values.length > 1 ? values.length : 1;
}

function setStatus(text, isError = false) {
  if (!el.status) return;
  el.status.textContent = text;
  el.status.style.color = isError ? '#a13514' : '';
}

function normalizePathForCompare(value) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function getPathBaseNameLower(pathValue) {
  const text = String(pathValue || '').trim();
  if (!text) return '';
  const parts = text.split(/[\\/]/).filter(Boolean);
  return String(parts[parts.length - 1] || '').toLowerCase();
}

function getPathBaseName(pathValue) {
  const text = String(pathValue || '').trim();
  if (!text) return '';
  const parts = text.split(/[\\/]/).filter(Boolean);
  return String(parts[parts.length - 1] || '');
}

function isOpenableFilesReadPath(pathValue) {
  const p = String(pathValue || '').trim().toLowerCase();
  return p.endsWith('.txt') || p.endsWith('.ini');
}

function pathIsSameOrChild(pathValue, rootValue) {
  const pathNorm = normalizePathForCompare(pathValue);
  const rootNorm = normalizePathForCompare(rootValue);
  if (!pathNorm || !rootNorm) return false;
  return pathNorm === rootNorm || pathNorm.startsWith(`${rootNorm}/`);
}

function collectActiveReferenceReadPaths() {
  const out = new Set();
  if (!state.bundle || !state.bundle.tabs) return out;
  Object.values(state.bundle.tabs).forEach((tab) => {
    if (!tab || tab.type !== 'reference' || !Array.isArray(tab.entries)) return;
    tab.entries.forEach((entry) => {
      const sourceMeta = entry && entry.sourceMeta;
      if (!sourceMeta || typeof sourceMeta !== 'object') return;
      Object.values(sourceMeta).forEach((meta) => {
        const readPath = String(meta && meta.readPath || '').trim();
        if (readPath) out.add(readPath);
      });
    });
    const diplomacyActive = String((tab.sourceDetails && tab.sourceDetails.diplomacyActive) || '').trim();
    if (diplomacyActive) out.add(diplomacyActive);
  });
  return out;
}

function shouldSuppressCoreFallbackEntry(pathValue, activeReadPaths) {
  if (!state.settings || state.settings.mode !== 'scenario') return false;
  const scope = classifyReadFilePath(pathValue).scope;
  if (scope !== 'core') return false;
  const baseName = getPathBaseNameLower(pathValue);
  const fallbackTracked = new Set(['civilopedia.txt', 'pediaicons.txt', 'diplomacy.txt']);
  if (!fallbackTracked.has(baseName)) return false;
  const scenarioEntryExists = Array.isArray(state.bundle && state.bundle.readFiles)
    && state.bundle.readFiles.some((candidate) => {
      const c = String(candidate || '').trim();
      return classifyReadFilePath(c).scope === 'scenario' && getPathBaseNameLower(c) === baseName;
    });
  if (!scenarioEntryExists) return false;
  const needed = Array.from(activeReadPaths || []).some((readPath) => {
    const r = String(readPath || '').trim();
    return getPathBaseNameLower(r) === baseName && classifyReadFilePath(r).scope === 'core';
  });
  return !needed;
}

function classifyReadFilePath(filePath) {
  const p = String(filePath || '').trim();
  const bundle = state.bundle || {};
  const settings = state.settings || {};
  const scenarioRoots = [];
  if (bundle.scenarioPath) scenarioRoots.push(bundle.scenarioPath);
  if (Array.isArray(bundle.scenarioSearchPaths)) {
    bundle.scenarioSearchPaths.forEach((pathValue) => {
      if (pathValue) scenarioRoots.push(pathValue);
    });
  }
  const inScenario = scenarioRoots.some((root) => pathIsSameOrChild(p, root));
  if (inScenario) {
    return {
      scope: 'scenario',
      title: 'Scenario'
    };
  }
  if (settings.c3xPath && pathIsSameOrChild(p, settings.c3xPath)) {
    return {
      scope: 'c3x',
      title: 'C3X'
    };
  }
  if (settings.civ3Path && pathIsSameOrChild(p, settings.civ3Path)) {
    return {
      scope: 'core',
      title: 'Standard Game'
    };
  }
  return {
    scope: 'external',
    title: 'External'
  };
}

function isProtectedC3xDefaultPathLocal(filePath) {
  const c3xRoot = String((state.settings && state.settings.c3xPath) || '').trim();
  const target = String(filePath || '').trim();
  if (!c3xRoot || !target) return false;
  if (!pathIsSameOrChild(target, c3xRoot)) return false;
  return getPathBaseNameLower(target).startsWith('default.');
}

function getFilesEntryKind(pathValue, classification) {
  if (!classification) return 'read-only';
  if (classification.scope === 'core') return 'read-only';
  if (classification.scope === 'scenario') return 'write';
  if (classification.scope === 'c3x') {
    return isProtectedC3xDefaultPathLocal(pathValue) ? 'read-only' : 'write';
  }
  return 'read-only';
}

function collectPendingWritePathsFromDirtyTabs() {
  const pending = new Set();
  if (!state.isDirty || !state.bundle || !state.bundle.tabs) return pending;
  const tabs = state.bundle.tabs || {};
  const addPath = (rawPath) => {
    const p = String(rawPath || '').trim();
    if (p) pending.add(p);
  };
  ['base', 'districts', 'wonders', 'naturalWonders', 'animations'].forEach((tabKey) => {
    if (getTabDirtyCount(tabKey) <= 0) return;
    const tab = tabs[tabKey];
    addPath(tab && tab.targetPath);
  });

  const normalizeRefList = (value) => (Array.isArray(value) ? value.map((v) => String(v || '')) : []);
  const normalizeBiqFields = (fields) => (Array.isArray(fields) ? fields.map((field) => ({
    key: String(field && (field.baseKey || field.key) || '').toLowerCase(),
    value: String(field && field.value || ''),
    multiValues: Array.isArray(field && field.multiValues) ? field.multiValues.map((v) => String(v || '')) : []
  })) : []);
  const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  Object.keys(tabs).forEach((tabKey) => {
    if (getTabDirtyCount(tabKey) <= 0) return;
    const tab = tabs[tabKey];
    if (!tab) return;
    if (tab.type === 'biqStructure' || tab.type === 'biq') {
      addPath((state.bundle.biq && state.bundle.biq.sourcePath) || tab.sourcePath || (state.settings && state.settings.scenarioPath));
      return;
    }
    if (tab.type !== 'reference' || !Array.isArray(tab.entries)) return;
    tab.entries.forEach((entry) => {
      const key = String((entry && entry.civilopediaKey) || '').toUpperCase();
      const cleanEntry = key ? getCleanReferenceEntry(tabKey, key) : null;
      if (!hasReferenceEntryChangedFromClean(entry, cleanEntry)) return;
      const meta = entry && entry.sourceMeta ? entry.sourceMeta : {};
      const changedOverview = !isEqual(String(entry && entry.overview || ''), String(cleanEntry && cleanEntry.overview || ''));
      const changedDescription = !isEqual(String(entry && entry.description || ''), String(cleanEntry && cleanEntry.description || ''));
      const changedIconPaths = !isEqual(normalizeRefList(entry && entry.iconPaths), normalizeRefList(cleanEntry && cleanEntry.iconPaths));
      const changedAnimationName = !isEqual(String(entry && entry.animationName || ''), String(cleanEntry && cleanEntry.animationName || ''));
      const changedRacePaths = !isEqual(normalizeRefList(entry && entry.racePaths), normalizeRefList(cleanEntry && cleanEntry.racePaths));
      const changedBiq = !isEqual(normalizeBiqFields(entry && entry.biqFields), normalizeBiqFields(cleanEntry && cleanEntry.biqFields));

      if (changedOverview || changedDescription) {
        addPath(meta && meta.overview && meta.overview.writePath);
        addPath(meta && meta.description && meta.description.writePath);
      }
      if (changedIconPaths || changedAnimationName || changedRacePaths) {
        addPath(meta && meta.iconPaths && meta.iconPaths.writePath);
        addPath(meta && meta.animationName && meta.animationName.writePath);
      }
      if (changedBiq) {
        addPath(meta && meta.biq && meta.biq.writePath);
      }
    });
    if (tabKey === 'civilizations') {
      const cleanTabs = getCleanTabsObject();
      const cleanTab = cleanTabs && cleanTabs.civilizations ? cleanTabs.civilizations : null;
      const currentRaw = String(tab && tab.diplomacyText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const cleanRaw = String(cleanTab && cleanTab.diplomacyText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      if (currentRaw !== cleanRaw) {
        const sourceDetails = (tab && tab.sourceDetails) || {};
        addPath(sourceDetails.diplomacyScenarioWrite || sourceDetails.diplomacyScenario || sourceDetails.diplomacyActive || '');
      }
    }
  });

  return pending;
}

function getFilesEntryChangeCategory(entry, access) {
  if (!entry) return '';
  if (!state.isDirty) return '';
  if (entry.isPrimaryBaseTarget && !entry.baseDirty) return '';
  const explicitCategory = String(entry.changeCategory || '').trim().toLowerCase();
  if (entry.potentialWrite) {
    if (access && !access.exists) return 'new';
    if (explicitCategory) return explicitCategory;
    return 'changed';
  }
  if (explicitCategory) return explicitCategory;
  return '';
}

function collectFilesModalEntries() {
  const out = [];
  const byPath = new Map();
  const activeReadPaths = collectActiveReferenceReadPaths();
  const readFiles = Array.isArray(state.bundle && state.bundle.readFiles) ? state.bundle.readFiles : [];
  readFiles.forEach((filePath) => {
    const pathValue = String(filePath || '').trim();
    if (!pathValue) return;
    if (shouldSuppressCoreFallbackEntry(pathValue, activeReadPaths)) return;
    const classification = classifyReadFilePath(pathValue);
    const entry = {
      path: pathValue,
      kind: getFilesEntryKind(pathValue, classification),
      note: 'Loaded during bundle read',
      animationIni: isAnimationIniPath(pathValue)
    };
    out.push(entry);
    byPath.set(pathValue, entry);
  });

  const scenarioMode = !!(state.settings && state.settings.mode === 'scenario');
  const unitEntries = (state.bundle && state.bundle.tabs && state.bundle.tabs.units && Array.isArray(state.bundle.tabs.units.entries))
    ? state.bundle.tabs.units.entries
    : [];
  if (unitEntries.length > 0) {
    const seenAnimSource = new Set();
    unitEntries.forEach((entry) => {
      const animationName = String(entry && entry.animationName || '').trim();
      if (!animationName) return;
      const candidates = Array.from(new Set([
        String(entry && entry.unitIniEditor && entry.unitIniEditor.iniPath || '').trim(),
        ...getUnitIniSourceCandidates(animationName)
      ].filter(Boolean)));
      if (!candidates.length) return;
      let resolved = candidates.find((candidate) => byPath.has(candidate)) || '';
      if (!resolved) {
        resolved = candidates.find((candidate) => {
          const access = state.filesReadAccessByPath[String(candidate || '').trim()];
          return !!(access && access.exists);
        }) || '';
      }
      if (!resolved) return;
      if (!resolved || seenAnimSource.has(resolved)) return;
      seenAnimSource.add(resolved);
      const existing = byPath.get(resolved);
      if (existing) {
        existing.animationIni = true;
        if (!existing.note) existing.note = 'Animation INI source';
        return;
      }
      const classification = classifyReadFilePath(resolved);
      const sourceEntry = {
        path: resolved,
        kind: getFilesEntryKind(resolved, classification),
        note: 'Animation INI source',
        animationIni: true
      };
      out.push(sourceEntry);
      byPath.set(resolved, sourceEntry);
    });
  }
  if (scenarioMode && unitEntries.length > 0) {
    const seenPotential = new Set();
    unitEntries.forEach((entry) => {
      const animationName = String(entry && entry.animationName || '').trim();
      if (!animationName) return;
      const sourceCandidates = Array.from(new Set([
        String(entry && entry.unitIniEditor && entry.unitIniEditor.iniPath || '').trim(),
        ...getUnitIniSourceCandidates(animationName)
      ].filter(Boolean)));
      const hasPendingIniChange = !!extractUnitIniDirtyPayload(entry && entry.unitIniEditor);
      if (!hasPendingIniChange) return;
      const targetPath = getUnitIniTargetPath(animationName);
      if (!targetPath || seenPotential.has(targetPath)) return;
      seenPotential.add(targetPath);
      const existing = byPath.get(targetPath);
      if (existing) {
        existing.potentialWrite = true;
        existing.kind = 'write';
        existing.sourceCandidates = sourceCandidates;
        existing.changeCategory = 'changed';
        existing.animationIni = true;
        existing.note = 'Changed Unit INI target';
        return;
      }
      const potential = {
        path: targetPath,
        kind: 'write',
        note: 'Changed Unit INI save target',
        potentialWrite: true,
        sourceCandidates,
        changeCategory: 'changed',
        animationIni: true
      };
      out.push(potential);
      byPath.set(targetPath, potential);
    });
  }

  collectPendingWritePathsFromDirtyTabs().forEach((pathValue) => {
    const existing = byPath.get(pathValue);
    if (existing) {
      existing.potentialWrite = true;
      existing.changeCategory = existing.changeCategory || '';
      if (!existing.note) existing.note = 'Pending save target';
      return;
    }
    const classification = classifyReadFilePath(pathValue);
    const pendingEntry = {
      path: pathValue,
      kind: getFilesEntryKind(pathValue, classification),
      note: 'Pending save target',
      changeCategory: '',
      potentialWrite: true,
      animationIni: isAnimationIniPath(pathValue)
    };
    out.push(pendingEntry);
    byPath.set(pathValue, pendingEntry);
  });

  const baseTargetPath = getActiveBaseTargetPath();
  if (baseTargetPath) {
    const baseExisting = byPath.get(baseTargetPath);
    const baseDirty = getTabDirtyCount('base') > 0;
    const baseEntry = baseExisting || {
      path: baseTargetPath,
      kind: 'write',
      note: 'Primary C3X base save target',
      potentialWrite: true,
      isPrimaryBaseTarget: true
    };
    baseEntry.kind = 'write';
    baseEntry.note = baseEntry.note || 'Primary C3X base save target';
    baseEntry.potentialWrite = !!baseDirty;
    baseEntry.isPrimaryBaseTarget = true;
    baseEntry.baseDirty = baseDirty;
    baseEntry.changeCategory = '';
    if (!baseExisting) {
      out.push(baseEntry);
      byPath.set(baseTargetPath, baseEntry);
    }
  }

  return out.sort((a, b) => {
    const aAccess = state.filesReadAccessByPath[String(a && a.path || '').trim()] || null;
    const bAccess = state.filesReadAccessByPath[String(b && b.path || '').trim()] || null;
    const aChange = getFilesEntryChangeCategory(a, aAccess);
    const bChange = getFilesEntryChangeCategory(b, bAccess);
    const changePriority = (value) => {
      if (value === 'new') return 0;
      if (value === 'changed') return 1;
      return 2;
    };
    const aChangePri = changePriority(aChange);
    const bChangePri = changePriority(bChange);
    if (aChangePri !== bChangePri) return aChangePri - bChangePri;

    const scopePriority = { core: 0, scenario: 1, c3x: 2, external: 3 };
    const aScope = classifyReadFilePath(a.path).scope;
    const bScope = classifyReadFilePath(b.path).scope;
    const aScopePri = Object.prototype.hasOwnProperty.call(scopePriority, aScope) ? scopePriority[aScope] : 9;
    const bScopePri = Object.prototype.hasOwnProperty.call(scopePriority, bScope) ? scopePriority[bScope] : 9;
    if (aScopePri !== bScopePri) return aScopePri - bScopePri;
    return String(a.path || '').localeCompare(String(b.path || ''), 'en', { sensitivity: 'base' });
  });
}

function markFilesReadEntriesDirty() {
  state.filesReadEntriesCacheDirty = true;
}

function getFilesModalEntriesCached() {
  if (!state.filesReadEntriesCacheDirty && Array.isArray(state.filesReadEntriesCache)) {
    return state.filesReadEntriesCache;
  }
  const next = collectFilesModalEntries();
  state.filesReadEntriesCache = next;
  state.filesReadEntriesCacheDirty = false;
  return next;
}

function scheduleFilesReadModalRender(delayMs = 0) {
  if (state.filesReadRenderTimer) {
    window.clearTimeout(state.filesReadRenderTimer);
    state.filesReadRenderTimer = null;
  }
  state.filesReadRenderTimer = window.setTimeout(() => {
    state.filesReadRenderTimer = null;
    renderFilesReadModal();
  }, Math.max(0, Number(delayMs) || 0));
}

function shouldWarnForAccessIssue(entry, classification, access) {
  if (!classification || !access || classification.scope === 'core') return false;
  if (isProtectedC3xDefaultPathLocal(entry && entry.path)) return false;
  if (classification.scope !== 'scenario' && classification.scope !== 'c3x') return false;
  if (access.exists) return !access.writable;
  if (entry && entry.potentialWrite) return access.parentWritable === false;
  return false;
}

function getDefaultFilesReadFiltersForMode(mode) {
  const scenarioMode = String(mode || '').toLowerCase() === 'scenario';
  return {
    locationCore: !scenarioMode,
    locationScenario: scenarioMode,
    locationC3x: true,
    locationExternal: false,
    typeConfigIni: true,
    typeAnimationIni: false,
    typeText: true,
    typeBiq: true,
    statusNew: false,
    statusChanged: false,
    statusUnchanged: false,
    statusRisk: false
  };
}

function resetFilesReadFiltersForCurrentMode() {
  const mode = state.settings && state.settings.mode ? state.settings.mode : 'global';
  state.filesReadFilters = getDefaultFilesReadFiltersForMode(mode);
}

function buildFilesRowTooltip(entry, classification, access) {
  const lines = [];
  const hasExistingSource = !!(entry && entry.potentialWrite && Array.isArray(entry.sourceCandidates)
    && entry.sourceCandidates.some((candidate) => {
      const a = state.filesReadAccessByPath[String(candidate || '').trim()];
      return !!(a && a.exists);
    }));
  lines.push(`Scope: ${classification && classification.title ? classification.title : 'Unknown'}`);
  if (entry && entry.note) lines.push(`Note: ${entry.note}`);
  if (entry && entry.isPrimaryBaseTarget) {
    lines.push(`Active C3X Save Target: ${getActiveBaseTargetName()}`);
    lines.push(`Override Chain: ${getActiveBaseChainLine()}`);
  }
  const changeCategory = getFilesEntryChangeCategory(entry, access);
  if (classification && (classification.scope === 'core' || isProtectedC3xDefaultPathLocal(entry && entry.path))) {
    lines.push('Access: Read-Only');
  } else if (access && access.exists) {
    lines.push(`Disk Access: ${access.writable ? 'Writable' : 'Read-only'}`);
  } else if (access && !access.exists) {
    if (entry && entry.potentialWrite && changeCategory === 'new' && access.parentPath) {
      lines.push('Category: New');
      lines.push('Target Missing: yes');
      lines.push(`Create Location: ${access.parentPath}`);
      lines.push(`Create Access: ${access.parentWritable ? 'allowed' : 'blocked (read-only)'}`);
      if (hasExistingSource) {
        const sourcePath = entry.sourceCandidates.find((candidate) => {
          const a = state.filesReadAccessByPath[String(candidate || '').trim()];
          return !!(a && a.exists);
        });
        if (sourcePath) lines.push(`Existing Source: ${sourcePath}`);
      }
    } else if (entry && entry.isPrimaryBaseTarget) {
      lines.push('State: Not created yet');
      lines.push('This override file is optional until Base settings are edited and saved.');
    } else {
      lines.push('Disk Access: Missing');
    }
  } else {
    lines.push('Disk Access: Unknown');
  }
  lines.push(`Path: ${entry && entry.path ? entry.path : ''}`);
  return lines.join('\n');
}

function syncFilesReadFilterInputs() {
  if (el.filesFilterCore) el.filesFilterCore.checked = !!state.filesReadFilters.locationCore;
  if (el.filesFilterScenario) el.filesFilterScenario.checked = !!state.filesReadFilters.locationScenario;
  if (el.filesFilterC3x) el.filesFilterC3x.checked = !!state.filesReadFilters.locationC3x;
  if (el.filesFilterExternal) el.filesFilterExternal.checked = !!state.filesReadFilters.locationExternal;
  if (el.filesFilterTypeConfigIni) el.filesFilterTypeConfigIni.checked = !!state.filesReadFilters.typeConfigIni;
  if (el.filesFilterTypeAnimationIni) el.filesFilterTypeAnimationIni.checked = !!state.filesReadFilters.typeAnimationIni;
  if (el.filesFilterTypeText) el.filesFilterTypeText.checked = !!state.filesReadFilters.typeText;
  if (el.filesFilterTypeBiq) el.filesFilterTypeBiq.checked = !!state.filesReadFilters.typeBiq;
  if (el.filesFilterStatusNew) el.filesFilterStatusNew.checked = !!state.filesReadFilters.statusNew;
  if (el.filesFilterStatusChanged) el.filesFilterStatusChanged.checked = !!state.filesReadFilters.statusChanged;
  if (el.filesFilterStatusUnchanged) el.filesFilterStatusUnchanged.checked = !!state.filesReadFilters.statusUnchanged;
  if (el.filesFilterStatusRisk) el.filesFilterStatusRisk.checked = !!state.filesReadFilters.statusRisk;
}

function getFilesEntryFileType(entry, classification) {
  const pathValue = String(entry && entry.path || '').trim().toLowerCase();
  if (/\.biq$/i.test(pathValue)) return 'biq';
  if (isAnimationIniEntry(entry)) return 'animationIni';
  if (/\.txt$/i.test(pathValue)) return 'text';
  if (/\.ini$/i.test(pathValue) && classification && classification.scope === 'c3x') return 'configIni';
  return 'other';
}

function getFilesEntryStatuses(entry, classification, access) {
  const out = new Set();
  const changeCategory = getFilesEntryChangeCategory(entry, access);
  if (changeCategory === 'new') out.add('new');
  else if (changeCategory === 'changed') out.add('changed');
  else out.add('unchanged');
  if (shouldWarnForAccessIssue(entry, classification, access)) out.add('risk');
  return out;
}

function shouldIncludeFilesEntryByFilter(entry) {
  if (!entry) return false;
  const f = state.filesReadFilters || {};
  const query = String(state.filesReadSearchQuery || '').trim().toLowerCase();
  const access = state.filesReadAccessByPath[String(entry.path || '').trim()] || null;
  const classification = classifyReadFilePath(entry.path);
  const fileType = getFilesEntryFileType(entry, classification);
  const statuses = getFilesEntryStatuses(entry, classification, access);

  const selectedLocations = [];
  if (f.locationCore) selectedLocations.push('core');
  if (f.locationScenario) selectedLocations.push('scenario');
  if (f.locationC3x) selectedLocations.push('c3x');
  if (f.locationExternal) selectedLocations.push('external');
  if (selectedLocations.length > 0 && !selectedLocations.includes(classification.scope)) return false;

  const selectedTypes = [];
  if (f.typeConfigIni) selectedTypes.push('configIni');
  if (f.typeAnimationIni) selectedTypes.push('animationIni');
  if (f.typeText) selectedTypes.push('text');
  if (f.typeBiq) selectedTypes.push('biq');
  if (selectedTypes.length > 0 && !selectedTypes.includes(fileType)) return false;

  const selectedStatuses = [];
  if (f.statusNew) selectedStatuses.push('new');
  if (f.statusChanged) selectedStatuses.push('changed');
  if (f.statusUnchanged) selectedStatuses.push('unchanged');
  if (f.statusRisk) selectedStatuses.push('risk');
  if (selectedStatuses.length > 0) {
    const anyStatusMatch = selectedStatuses.some((status) => statuses.has(status));
    if (!anyStatusMatch) return false;
  }

  if (query) {
    const pathText = String(entry.path || '').toLowerCase();
    const compactPathText = String(compactPathFromCiv3Root(entry.path) || '').toLowerCase();
    const noteText = String(entry.note || '').toLowerCase();
    const scopeText = String(classification.scope || '').toLowerCase();
    const fileTypeText = String(fileType || '').toLowerCase();
    const statusText = Array.from(statuses).join(' ').toLowerCase();
    const haystack = `${pathText} ${compactPathText} ${noteText} ${scopeText} ${fileTypeText} ${statusText}`;
    if (!haystack.includes(query)) return false;
  }

  return true;
}

function updateFilesReadIssueBadge() {
  if (!el.filesReadToggle) return;
  const count = Number(state.filesReadIssueCount || 0);
  if (count > 0) {
    const label = count > 99 ? '99+' : String(count);
    el.filesReadToggle.classList.add('has-issue');
    el.filesReadToggle.setAttribute('data-issue-count', label);
    el.filesReadToggle.setAttribute('title', `Show files read (${count} potential save issue${count === 1 ? '' : 's'})`);
    return;
  }
  el.filesReadToggle.classList.remove('has-issue');
  el.filesReadToggle.removeAttribute('data-issue-count');
  el.filesReadToggle.setAttribute('title', 'Show files read');
}

function recomputeFilesReadIssueCount() {
  const files = getFilesModalEntriesCached();
  let count = 0;
  files.forEach((entry) => {
    const classification = classifyReadFilePath(entry.path);
    const access = state.filesReadAccessByPath[String(entry.path || '')];
    if (shouldWarnForAccessIssue(entry, classification, access)) count += 1;
  });
  state.filesReadIssueCount = count;
  updateFilesReadIssueBadge();
}

async function refreshFilesReadAccess() {
  const accessTargets = new Set();
  getFilesModalEntriesCached().forEach((entry) => {
    const classification = classifyReadFilePath(entry.path);
    if (classification.scope !== 'core' && !isProtectedC3xDefaultPathLocal(entry.path)) {
      accessTargets.add(entry.path);
    }
    if (entry && entry.potentialWrite && Array.isArray(entry.sourceCandidates)) {
      entry.sourceCandidates.forEach((candidate) => {
        const p = String(candidate || '').trim();
        if (!p) return;
        accessTargets.add(p);
      });
    }
  });
  const unitEntries = (state.bundle && state.bundle.tabs && state.bundle.tabs.units && Array.isArray(state.bundle.tabs.units.entries))
    ? state.bundle.tabs.units.entries
    : [];
  unitEntries.forEach((entry) => {
    const animationName = String(entry && entry.animationName || '').trim();
    if (!animationName) return;
    getUnitIniSourceCandidates(animationName).forEach((candidate) => {
      const p = String(candidate || '').trim();
      if (!p) return;
      accessTargets.add(p);
    });
  });
  const files = Array.from(accessTargets);
  if (!files.length || !window.c3xManager || typeof window.c3xManager.getPathAccess !== 'function') {
    state.filesReadAccessByPath = {};
    state.filesReadIssueCount = 0;
    updateFilesReadIssueBadge();
    return;
  }
  const requestId = Number(state.filesReadAccessRequestId || 0) + 1;
  state.filesReadAccessRequestId = requestId;
  try {
    const accessByPath = await window.c3xManager.getPathAccess(files);
    if (state.filesReadAccessRequestId !== requestId) return;
    state.filesReadAccessByPath = accessByPath && typeof accessByPath === 'object' ? accessByPath : {};
  } catch (_err) {
    if (state.filesReadAccessRequestId !== requestId) return;
    state.filesReadAccessByPath = {};
  }
  markFilesReadEntriesDirty();
  recomputeFilesReadIssueCount();
  if (el.filesReadModalOverlay && !el.filesReadModalOverlay.classList.contains('hidden')) {
    scheduleFilesReadModalRender();
  }
}

function renderFilesReadModal() {
  if (!el.filesReadList || !el.filesReadModalBody) return;
  syncFilesReadFilterInputs();
  if (el.filesReadSearchInput) {
    const nextSearch = String(state.filesReadSearchInputMirror || state.filesReadSearchQuery || '');
    if (el.filesReadSearchInput.value !== nextSearch) el.filesReadSearchInput.value = nextSearch;
  }
  const entries = getFilesModalEntriesCached();
  const filteredEntries = entries.filter((entry) => shouldIncludeFilesEntryByFilter(entry));
  const shownCount = filteredEntries.length;
  const totalCount = entries.length;
  const readCount = entries.filter((entry) => {
    const classification = classifyReadFilePath(entry.path);
    return classification.scope === 'core' || isProtectedC3xDefaultPathLocal(entry.path);
  }).length;
  const writeCount = entries.length - readCount;
  const modeLabel = (state.settings && state.settings.mode === 'scenario') ? 'Scenario' : 'Standard game';
  const baseTargetName = getActiveBaseTargetName();
  const baseTargetPath = getActiveBaseTargetPath();
  const baseTargetCompact = baseTargetPath ? (compactPathFromCiv3Root(baseTargetPath) || baseTargetPath) : '(not available)';
  const issueCount = Number(state.filesReadIssueCount || 0);
  const shownPrefix = `Showing ${shownCount} of ${totalCount} file${totalCount === 1 ? '' : 's'}. `;
  if (!state.bundle) {
    el.filesReadModalBody.textContent = 'Load configs to view files read.';
  } else if (issueCount > 0) {
    el.filesReadModalBody.textContent = `${shownPrefix}${modeLabel} loaded ${readCount} read-only file${readCount === 1 ? '' : 's'}${writeCount > 0 ? ` and ${writeCount} write target${writeCount === 1 ? '' : 's'}` : ''}. C3X base edits save to ${baseTargetName} (${baseTargetCompact}). ${issueCount} potential save issue${issueCount === 1 ? '' : 's'} detected (read-only on disk).`;
  } else {
    el.filesReadModalBody.textContent = `${shownPrefix}${modeLabel} loaded ${readCount} read-only file${readCount === 1 ? '' : 's'}${writeCount > 0 ? ` and ${writeCount} write target${writeCount === 1 ? '' : 's'}` : ''}. C3X base edits save to ${baseTargetName} (${baseTargetCompact}).`;
  }
  el.filesReadList.innerHTML = '';
  if (filteredEntries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'files-read-empty';
    empty.textContent = state.bundle ? 'No files match current filters.' : 'No loaded bundle yet.';
    el.filesReadList.appendChild(empty);
    return;
  }
  filteredEntries.forEach((entry) => {
    const li = document.createElement('li');
    const pathValue = String(entry.path || '');
    const access = state.filesReadAccessByPath[pathValue] || null;
    const classification = classifyReadFilePath(pathValue);
    const fileType = getFilesEntryFileType(entry, classification);
    const issue = shouldWarnForAccessIssue(entry, classification, access);
    const changeCategory = getFilesEntryChangeCategory(entry, access);
    li.className = `files-read-item scope-${classification.scope}${issue ? ' has-issue' : ''}${changeCategory === 'new' ? ' change-new' : ''}${changeCategory === 'changed' ? ' change-changed' : ''}`;

    const top = document.createElement('div');
    top.className = 'files-read-item-top';
    const pathEl = document.createElement('code');
    pathEl.className = 'files-read-path';
    pathEl.textContent = compactPathFromCiv3Root(pathValue) || pathValue;
    if (isOpenableFilesReadPath(pathValue) && window.c3xManager && typeof window.c3xManager.openFilePath === 'function') {
      pathEl.classList.add('clickable');
      pathEl.title = 'Open file';
      pathEl.addEventListener('click', async () => {
        const opened = await window.c3xManager.openFilePath(pathValue);
        if (!opened || !opened.ok) {
          setStatus(`Could not open file: ${(opened && opened.error) || 'unknown error'}`, true);
        }
      });
    }
    attachRichTooltip(pathEl, buildFilesRowTooltip(entry, classification, access));
    top.appendChild(pathEl);
    const lowerPath = String(pathValue || '').toLowerCase();
    if ((changeCategory === 'new' || changeCategory === 'changed')
      && (lowerPath.endsWith('.txt') || lowerPath.endsWith('.ini'))) {
      const diffBtn = document.createElement('button');
      diffBtn.type = 'button';
      diffBtn.className = 'files-read-diff-btn';
      diffBtn.innerHTML = '<span class="btn-icon">🧾</span>View Changes';
      diffBtn.title = 'Open line-by-line diff preview';
      diffBtn.addEventListener('click', () => {
        void openFileDiffModalForPath(pathValue);
      });
      top.appendChild(diffBtn);
    }
    if (issue) {
      const issueBadge = document.createElement('span');
      issueBadge.className = 'files-read-badge warn';
      issueBadge.textContent = 'Save Risk';
      top.appendChild(issueBadge);
    }

    const meta = document.createElement('div');
    meta.className = 'files-read-item-meta';
    const scopeBadge = document.createElement('span');
    scopeBadge.className = `files-read-badge scope-${classification.scope}`;
    scopeBadge.textContent = classification.title;
    meta.appendChild(scopeBadge);
    if (fileType === 'animationIni') {
      const typeBadge = document.createElement('span');
      typeBadge.className = 'files-read-badge type-animation-ini';
      typeBadge.textContent = 'Animation INI';
      meta.appendChild(typeBadge);
    }

    const changeBadge = document.createElement('span');
    if (changeCategory === 'new' || changeCategory === 'changed') {
      const isNew = changeCategory === 'new';
      changeBadge.className = `files-read-badge ${isNew ? 'change-new' : 'change-changed'}`;
      changeBadge.textContent = isNew ? 'New' : 'Changed';
      meta.appendChild(changeBadge);
    }

    const accessBadge = document.createElement('span');
    let showAccessBadge = true;
    if (classification.scope === 'core' || isProtectedC3xDefaultPathLocal(pathValue)) {
      accessBadge.className = 'files-read-badge neutral';
      accessBadge.textContent = 'Read-Only';
    } else if (access && access.exists) {
      accessBadge.className = `files-read-badge ${access.writable ? 'ok' : 'warn'}`;
      accessBadge.textContent = access.writable ? 'Writable' : 'Read-only on disk';
    } else if (access && !access.exists) {
      if (entry.potentialWrite && changeCategory === 'new' && access.parentPath) {
        if (access.parentWritable) {
          showAccessBadge = false;
        } else {
          accessBadge.className = 'files-read-badge warn';
          accessBadge.textContent = 'Cannot create';
        }
      } else if (entry.isPrimaryBaseTarget) {
        accessBadge.className = 'files-read-badge neutral';
        accessBadge.textContent = 'Not created yet';
      } else {
        accessBadge.className = 'files-read-badge neutral';
        accessBadge.textContent = 'Missing';
      }
    } else {
      accessBadge.className = 'files-read-badge neutral';
      accessBadge.textContent = 'Checking access';
    }
    if (showAccessBadge) meta.appendChild(accessBadge);

    li.appendChild(top);
    li.appendChild(meta);
    el.filesReadList.appendChild(li);
  });
}

function openFilesReadModal() {
  if (!el.filesReadModalOverlay) return;
  renderFilesReadModal();
  el.filesReadModalOverlay.classList.remove('hidden');
  el.filesReadModalOverlay.setAttribute('aria-hidden', 'false');
  void refreshFilesReadAccess();
}

function updateSaveButtonLabel() {
  if (!el.saveBtn) return;
  el.saveBtn.innerHTML = '<span class="btn-icon">💾</span>Save';
}

function closeFilesReadModal() {
  if (!el.filesReadModalOverlay) return;
  el.filesReadModalOverlay.classList.add('hidden');
  el.filesReadModalOverlay.setAttribute('aria-hidden', 'true');
}

function animateCopyDebugLogButton() {
  if (!el.copyDebugLog) return;
  el.copyDebugLog.classList.remove('copied');
  void el.copyDebugLog.offsetWidth;
  el.copyDebugLog.classList.add('copied');
  if (state.copyDebugFeedbackTimer) {
    window.clearTimeout(state.copyDebugFeedbackTimer);
  }
  state.copyDebugFeedbackTimer = window.setTimeout(() => {
    if (el.copyDebugLog) el.copyDebugLog.classList.remove('copied');
    state.copyDebugFeedbackTimer = null;
  }, 950);
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

function enableBooleanRowToggle(rowEl, checkEl) {
  if (!rowEl || !checkEl) return;
  if (rowEl.dataset.booleanRowToggle === '1') return;
  rowEl.dataset.booleanRowToggle = '1';
  rowEl.classList.add('bool-row-toggle');
  rowEl.addEventListener('click', (ev) => {
    if (checkEl.disabled) return;
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.bool-toggle')) return;
    if (target.closest('button, a, select, textarea')) return;
    if (target.closest('input')) return;
    checkEl.checked = !checkEl.checked;
    checkEl.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function refreshDirtyUi() {
  state.sectionValidationError = getSectionValidationError();
  if (el.saveBtn) el.saveBtn.classList.toggle('dirty', state.isDirty);
  updateSaveButtonLabel();
  if (el.saveBtn) {
    el.saveBtn.disabled = !state.isDirty || state.isLoading || !!state.sectionValidationError;
    el.saveBtn.title = state.sectionValidationError || '';
  }
  if (el.dirtyIndicator) el.dirtyIndicator.classList.toggle('hidden', !state.isDirty);
  if (el.undoBtn) el.undoBtn.disabled = !state.undoSnapshot || state.isLoading;
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
  state.cleanTabsCache = parseSnapshotTabs(state.cleanSnapshot);
  state.undoSnapshot = null;
  state.isDirty = false;
  clearDirtyTabCounts();
  refreshDirtyUi();
  refreshTabDirtyBadges();
  refreshActiveReferenceListDirtyBadges();
}

function setDirty(next) {
  markFilesReadEntriesDirty();
  if (state.isRendering || !state.trackDirty || state.suppressDirtyUntilInteraction) return;
  if (!next) {
    state.isDirty = false;
    clearDirtyTabCounts();
    refreshDirtyUi();
    refreshTabDirtyBadges();
    refreshActiveReferenceListDirtyBadges();
    return;
  }
  if (!state.isDirty) {
    const currentSnapshot = snapshotTabs();
    state.isDirty = currentSnapshot !== state.cleanSnapshot;
    if (!state.isDirty) {
      clearDirtyTabCounts();
    } else {
      updateActiveDirtyCaches();
    }
  } else {
    updateActiveDirtyCaches();
    state.isDirty = Object.keys(state.dirtyTabCounts || {}).length > 0;
    if (!state.isDirty) {
      state.undoSnapshot = null;
    }
  }
  refreshDirtyUi();
  refreshTabDirtyBadges();
  refreshActiveReferenceListDirtyBadges();
}

function parseSnapshotTabs(snapshotText) {
  const raw = String(snapshotText || '').trim();
  if (!raw || raw === 'null') return {};
  try {
    return JSON.parse(raw) || {};
  } catch (_err) {
    return {};
  }
}

function getCleanTabsObject() {
  if (state.cleanTabsCache && typeof state.cleanTabsCache === 'object') return state.cleanTabsCache;
  state.cleanTabsCache = parseSnapshotTabs(state.cleanSnapshot);
  return state.cleanTabsCache;
}

function hasChangedFromClean(currentValue, cleanValue) {
  return JSON.stringify(currentValue == null ? null : currentValue)
    !== JSON.stringify(cleanValue == null ? null : cleanValue);
}

function normalizeUnitIniActionsForDirty(actions) {
  return (Array.isArray(actions) ? actions : []).map((action) => ({
    key: String(action && action.key || '').trim().toUpperCase(),
    relativePath: String(action && action.relativePath || '').trim(),
    timingSeconds: Number.isFinite(Number(action && action.timingSeconds)) ? Number(action.timingSeconds) : null
  }));
}

function extractUnitIniDirtyPayload(editor) {
  if (!editor || typeof editor !== 'object') return null;
  const curTypeRows = cloneUnitTypeRows(Array.isArray(editor.typeRows) ? editor.typeRows : []);
  const curSections = cloneUnitIniSections(Array.isArray(editor.sections) ? editor.sections : []);
  const curActions = normalizeUnitIniActionsForDirty(editor.actions);
  const hasOriginals = Array.isArray(editor.originalTypeRows)
    || Array.isArray(editor.originalSections)
    || Array.isArray(editor.originalActions);
  if (!hasOriginals) return null;
  const origTypeRows = cloneUnitTypeRows(Array.isArray(editor.originalTypeRows) ? editor.originalTypeRows : []);
  const origSections = cloneUnitIniSections(Array.isArray(editor.originalSections) ? editor.originalSections : []);
  const origActions = normalizeUnitIniActionsForDirty(editor.originalActions);
  const typeChanged = JSON.stringify(curTypeRows) !== JSON.stringify(origTypeRows);
  const sectionsChanged = JSON.stringify(curSections) !== JSON.stringify(origSections);
  const actionsChanged = JSON.stringify(curActions) !== JSON.stringify(origActions);
  if (!typeChanged && !sectionsChanged && !actionsChanged) return null;
  return {
    typeRows: curTypeRows,
    sections: curSections,
    actions: curActions
  };
}

function normalizeReferenceEntryForDirty(entry) {
  if (!entry) return null;
  const normalized = JSON.parse(JSON.stringify(entry));
  const unitIniPayload = extractUnitIniDirtyPayload(entry.unitIniEditor);
  if (unitIniPayload) normalized.unitIniEditor = unitIniPayload;
  else delete normalized.unitIniEditor;
  return normalized;
}

function hasReferenceEntryChangedFromClean(currentEntry, cleanEntry) {
  return hasChangedFromClean(
    normalizeReferenceEntryForDirty(currentEntry),
    normalizeReferenceEntryForDirty(cleanEntry)
  );
}

function countCivilizationDiplomacySlotChanges(currentTab, cleanTab) {
  const currentSlots = (currentTab && Array.isArray(currentTab.diplomacySlots)) ? currentTab.diplomacySlots : [];
  const cleanSlots = (cleanTab && Array.isArray(cleanTab.diplomacySlots)) ? cleanTab.diplomacySlots : [];
  const cleanByIndex = new Map(cleanSlots.map((slot) => [Number(slot && slot.index), slot]));
  let changed = 0;
  currentSlots.forEach((slot) => {
    const idx = Number(slot && slot.index);
    if (!Number.isFinite(idx) || idx < 0) return;
    const cleanSlot = cleanByIndex.get(idx) || null;
    const firstContact = String(slot && slot.firstContact || '').trim();
    const cleanFirstContact = String(cleanSlot && cleanSlot.firstContact || '').trim();
    const firstDeal = String(slot && slot.firstDeal || '').trim();
    const cleanFirstDeal = String(cleanSlot && cleanSlot.firstDeal || '').trim();
    if (firstContact !== cleanFirstContact || firstDeal !== cleanFirstDeal) changed += 1;
    cleanByIndex.delete(idx);
  });
  cleanByIndex.forEach((slot) => {
    const firstContact = String(slot && slot.firstContact || '').trim();
    const firstDeal = String(slot && slot.firstDeal || '').trim();
    if (firstContact || firstDeal) changed += 1;
  });
  const currentRaw = String(currentTab && currentTab.diplomacyText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const cleanRaw = String(cleanTab && cleanTab.diplomacyText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawChanged = currentRaw !== cleanRaw;
  return rawChanged ? Math.max(1, changed) : changed;
}

function isTabDirty(tabKey) {
  if (!state.isDirty || !state.bundle || !state.bundle.tabs) return false;
  if (!EDITABLE_TAB_KEYS.includes(tabKey)) return false;
  const cleanTabs = getCleanTabsObject();
  return hasChangedFromClean(state.bundle.tabs[tabKey], cleanTabs[tabKey]);
}

function computeTabDirtyCount(tabKey) {
  if (!EDITABLE_TAB_KEYS.includes(tabKey)) return 0;
  if (!isTabDirty(tabKey) || !state.bundle || !state.bundle.tabs) return 0;
  const currentTab = state.bundle.tabs[tabKey];
  const cleanTabs = getCleanTabsObject();
  const cleanTab = cleanTabs[tabKey];
  if (!currentTab) return 0;

  if (currentTab.type === 'reference') {
    const cur = Array.isArray(currentTab.entries) ? currentTab.entries : [];
    const prev = cleanTab && Array.isArray(cleanTab.entries) ? cleanTab.entries : [];
    const prevByKey = new Map(prev.map((e) => [String((e && e.civilopediaKey) || '').toUpperCase(), e]));
    let changed = 0;
    cur.forEach((entry) => {
      const key = String((entry && entry.civilopediaKey) || '').toUpperCase();
      if (!key) return;
      if (hasReferenceEntryChangedFromClean(entry, prevByKey.get(key) || null)) changed += 1;
      prevByKey.delete(key);
    });
    changed += prevByKey.size;
    if (tabKey === 'civilizations') {
      changed += countCivilizationDiplomacySlotChanges(currentTab, cleanTab);
    }
    return changed;
  }

  if (currentTab.model && Array.isArray(currentTab.model.sections)) {
    const curSections = currentTab.model.sections;
    const prevSections = cleanTab && cleanTab.model && Array.isArray(cleanTab.model.sections) ? cleanTab.model.sections : [];
    const max = Math.max(curSections.length, prevSections.length);
    let changed = 0;
    for (let i = 0; i < max; i += 1) {
      if (hasChangedFromClean(curSections[i] || null, prevSections[i] || null)) changed += 1;
    }
    return changed;
  }

  if (currentTab.type === 'biqStructure' && Array.isArray(currentTab.sections)) {
    // BIQ structure tabs can contain thousands of records; keep badge computation fast.
    return 1;
  }

  if (tabKey === 'base' && Array.isArray(currentTab.rows)) {
    const curRows = currentTab.rows;
    const prevRows = cleanTab && Array.isArray(cleanTab.rows) ? cleanTab.rows : [];
    const prevByKey = new Map(prevRows.map((r) => [String(r.key || ''), r]));
    let changed = 0;
    curRows.forEach((row) => {
      const key = String(row && row.key || '');
      const prev = prevByKey.get(key) || null;
      if (hasChangedFromClean(row, prev)) changed += 1;
      prevByKey.delete(key);
    });
    changed += prevByKey.size;
    return changed;
  }

  return 1;
}

function getTabDirtyCount(tabKey) {
  if (!state.isDirty) return 0;
  return Number(state.dirtyTabCounts && state.dirtyTabCounts[tabKey] || 0);
}

function setTabDirtyCount(tabKey, count) {
  if (!tabKey) return;
  if (!state.dirtyTabCounts) state.dirtyTabCounts = {};
  const n = Number(count) || 0;
  if (n > 0) state.dirtyTabCounts[tabKey] = n;
  else delete state.dirtyTabCounts[tabKey];
}

function clearDirtyTabCounts() {
  state.dirtyTabCounts = {};
  state.dirtyReferenceKeysByTab = {};
  state.dirtySectionIndexesByTab = {};
}

function recomputeDirtyCountForTab(tabKey) {
  setTabDirtyCount(tabKey, computeTabDirtyCount(tabKey));
}

function getCleanReferenceEntry(tabKey, civilopediaKey) {
  const cleanTabs = getCleanTabsObject();
  const cleanTab = cleanTabs[tabKey];
  const cleanEntries = cleanTab && Array.isArray(cleanTab.entries) ? cleanTab.entries : [];
  const key = String(civilopediaKey || '').toUpperCase();
  return cleanEntries.find((e) => String((e && e.civilopediaKey) || '').toUpperCase() === key) || null;
}

function getCleanSectionByIndex(tabKey, sectionIndex) {
  const cleanTabs = getCleanTabsObject();
  const cleanTab = cleanTabs[tabKey];
  const cleanSections = cleanTab && cleanTab.model && Array.isArray(cleanTab.model.sections) ? cleanTab.model.sections : [];
  return cleanSections[sectionIndex] || null;
}

function ensureReferenceDirtySet(tabKey) {
  if (!state.dirtyReferenceKeysByTab[tabKey]) state.dirtyReferenceKeysByTab[tabKey] = new Set();
  return state.dirtyReferenceKeysByTab[tabKey];
}

function ensureSectionDirtySet(tabKey) {
  if (!state.dirtySectionIndexesByTab[tabKey]) state.dirtySectionIndexesByTab[tabKey] = new Set();
  return state.dirtySectionIndexesByTab[tabKey];
}

function updateActiveDirtyCaches() {
  if (!state.bundle || !state.bundle.tabs || !state.activeTab || !state.isDirty) return;
  const tabKey = state.activeTab;
  const tab = state.bundle.tabs[tabKey];
  if (!tab) return;

  if (tab.type === 'reference' && Array.isArray(tab.entries)) {
    const selectedIndex = Number(state.referenceSelection[tabKey] || 0);
    const entry = tab.entries[selectedIndex];
    if (!entry) return;
    const key = String(entry.civilopediaKey || '').toUpperCase();
    const set = ensureReferenceDirtySet(tabKey);
    const cleanEntry = getCleanReferenceEntry(tabKey, key);
    if (hasReferenceEntryChangedFromClean(entry, cleanEntry)) set.add(key);
    else set.delete(key);
    const cleanTabs = getCleanTabsObject();
    const cleanTab = cleanTabs[tabKey];
    const extra = tabKey === 'civilizations' ? countCivilizationDiplomacySlotChanges(tab, cleanTab) : 0;
    setTabDirtyCount(tabKey, set.size + extra);
    return;
  }

  if (tab.model && Array.isArray(tab.model.sections)) {
    const selectedIndex = Number(state.sectionSelection[tabKey] || 0);
    const section = tab.model.sections[selectedIndex];
    if (!section) return;
    const set = ensureSectionDirtySet(tabKey);
    const cleanSection = getCleanSectionByIndex(tabKey, selectedIndex);
    if (hasChangedFromClean(section, cleanSection)) set.add(selectedIndex);
    else set.delete(selectedIndex);
    setTabDirtyCount(tabKey, set.size);
    return;
  }

  if (EDITABLE_TAB_KEYS.includes(tabKey)) {
    setTabDirtyCount(tabKey, computeTabDirtyCount(tabKey));
  }
}

function rebuildDirtyTabCounts() {
  clearDirtyTabCounts();
  if (!state.isDirty || !state.bundle || !state.bundle.tabs) return;
  EDITABLE_TAB_KEYS.forEach((tabKey) => {
    const tab = state.bundle.tabs[tabKey];
    if (!tab) return;
    if (tab.type === 'reference' && Array.isArray(tab.entries)) {
      const set = ensureReferenceDirtySet(tabKey);
      tab.entries.forEach((entry) => {
        const key = String((entry && entry.civilopediaKey) || '').toUpperCase();
        if (!key) return;
        const cleanEntry = getCleanReferenceEntry(tabKey, key);
        if (hasReferenceEntryChangedFromClean(entry, cleanEntry)) set.add(key);
      });
      const cleanTabs = getCleanTabsObject();
      const cleanTab = cleanTabs[tabKey];
      const extra = tabKey === 'civilizations' ? countCivilizationDiplomacySlotChanges(tab, cleanTab) : 0;
      setTabDirtyCount(tabKey, set.size + extra);
      return;
    }
    if (tab.model && Array.isArray(tab.model.sections)) {
      const set = ensureSectionDirtySet(tabKey);
      tab.model.sections.forEach((section, idx) => {
        const cleanSection = getCleanSectionByIndex(tabKey, idx);
        if (hasChangedFromClean(section, cleanSection)) set.add(idx);
      });
      setTabDirtyCount(tabKey, set.size);
      return;
    }
    setTabDirtyCount(tabKey, computeTabDirtyCount(tabKey));
  });
}

function isReferenceEntryDirty(tabKey, entry) {
  if (!state.isDirty || !entry) return false;
  const key = String(entry.civilopediaKey || '').toUpperCase();
  const cleanEntry = getCleanReferenceEntry(tabKey, key);
  return hasReferenceEntryChangedFromClean(entry, cleanEntry);
}

function isSectionItemDirty(tabKey, sectionIndex, sectionObj) {
  if (!state.isDirty) return false;
  const set = state.dirtySectionIndexesByTab && state.dirtySectionIndexesByTab[tabKey];
  return !!(set && set.has(Number(sectionIndex)));
}

function isBiqRecordDirty(tabKey, sectionCode, recordObj) {
  if (!state.isDirty) return false;
  const cleanTabs = getCleanTabsObject();
  const cleanTab = cleanTabs[tabKey];
  const cleanSections = cleanTab && Array.isArray(cleanTab.sections) ? cleanTab.sections : [];
  const cleanSection = cleanSections.find((s) => String(s && s.code || '').toUpperCase() === String(sectionCode || '').toUpperCase()) || null;
  const cleanRecords = cleanSection && Array.isArray(cleanSection.records) ? cleanSection.records : [];
  const recordIndex = Number(recordObj && recordObj.index);
  const cleanRecord = cleanRecords.find((r) => Number(r && r.index) === recordIndex) || null;
  return hasChangedFromClean(recordObj, cleanRecord);
}

function appendDirtyBadge(target, label = 'Modified', count = null) {
  if (!target) return;
  const badge = document.createElement('span');
  const numeric = Number.isFinite(Number(count)) && Number(count) > 0;
  badge.className = numeric ? 'dirty-dot-badge dirty-count-badge' : 'dirty-dot-badge';
  badge.textContent = numeric ? String(count) : '•';
  badge.title = label;
  target.appendChild(badge);
}

function appendWarningCountBadge(target, label = 'Warnings', count = 0) {
  if (!target) return;
  const n = Number(count) || 0;
  if (n <= 0) return;
  const badge = document.createElement('span');
  badge.className = 'tab-warning-badge';
  badge.textContent = String(n);
  badge.title = label;
  target.appendChild(badge);
}

function applyDirtyBadgeToTabButton(button, key, tab) {
  if (!button) return;
  Array.from(button.querySelectorAll('.dirty-dot-badge')).forEach((node) => node.remove());
  Array.from(button.querySelectorAll('.tab-warning-badge')).forEach((node) => node.remove());

  if (key === 'districts') {
    const warningCount = collectDistrictIssueIndexes(tab).size;
    if (warningCount > 0) {
      appendWarningCountBadge(
        button,
        `Districts has ${warningCount} warning${warningCount === 1 ? '' : 's'}`,
        warningCount
      );
    }
  } else if (key === 'wonders') {
    const warningCount = collectWonderIssueIndexes(tab).size;
    if (warningCount > 0) {
      appendWarningCountBadge(
        button,
        `Wonder Districts has ${warningCount} warning${warningCount === 1 ? '' : 's'}`,
        warningCount
      );
    }
  }

  const dirtyCount = getTabDirtyCount(key);
  if (dirtyCount > 0) {
    appendDirtyBadge(button, `${tab.title} has ${dirtyCount} unsaved edit${dirtyCount === 1 ? '' : 's'}`, dirtyCount);
  }
}

function refreshTabDirtyBadges() {
  if (!el.tabs || !state.bundle || !state.bundle.tabs) return;
  const buttons = Array.from(el.tabs.querySelectorAll('.tab-btn[data-tab-key]'));
  buttons.forEach((button) => {
    const key = String(button.getAttribute('data-tab-key') || '');
    if (!key) return;
    const tab = state.bundle.tabs[key];
    if (!tab) return;
    applyDirtyBadgeToTabButton(button, key, tab);
  });
}

function refreshActiveReferenceListDirtyBadges() {
  if (!state.bundle || !state.bundle.tabs || !state.activeTab || !el.tabContent) return;
  const tabKey = state.activeTab;
  const tab = state.bundle.tabs[tabKey];
  if (!tab || tab.type !== 'reference' || !Array.isArray(tab.entries)) return;
  const listButtons = Array.from(el.tabContent.querySelectorAll('.entry-list-pane .entry-list-item[data-entry-key]'));
  if (listButtons.length === 0) return;
  const selectedIndex = Number(state.referenceSelection[tabKey] || 0);
  const activeEntry = tab.entries[selectedIndex] || null;
  const activeKey = String(activeEntry && activeEntry.civilopediaKey || '').toUpperCase();
  const dirtySet = state.dirtyReferenceKeysByTab && state.dirtyReferenceKeysByTab[tabKey];
  const hasDirtySet = !!(dirtySet && typeof dirtySet.has === 'function' && typeof dirtySet.add === 'function' && typeof dirtySet.delete === 'function');
  const byKey = new Map(tab.entries.map((entry) => [String((entry && entry.civilopediaKey) || '').toUpperCase(), entry]));
  listButtons.forEach((itemBtn) => {
    const key = String(itemBtn.getAttribute('data-entry-key') || '').toUpperCase();
    if (!key) return;
    const entry = byKey.get(key);
    let isDirty = false;
    if (hasDirtySet) {
      // Fast path for most rows: rely on the maintained dirty-key set.
      isDirty = dirtySet.has(key);
      // Keep active row precise during live typing.
      if (entry && key === activeKey) {
        const cleanEntry = getCleanReferenceEntry(tabKey, key);
        isDirty = hasReferenceEntryChangedFromClean(entry, cleanEntry);
        if (isDirty) dirtySet.add(key);
        else dirtySet.delete(key);
      }
    } else if (entry) {
      // Fallback for unexpected state; preserves previous behavior.
      isDirty = isReferenceEntryDirty(tabKey, entry);
    }
    Array.from(itemBtn.querySelectorAll('.dirty-dot-badge')).forEach((node) => node.remove());
    if (entry && isDirty) {
      appendDirtyBadge(itemBtn, `${entry.name || entry.civilopediaKey} has unsaved edits`);
    }
  });
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

function applyPerformanceModeRuntime(mode, options = {}) {
  const nextMode = String(mode || DEFAULT_PERFORMANCE_MODE).toLowerCase() === 'safe' ? 'safe' : 'high';
  if (state.settings) {
    state.settings.performanceMode = nextMode;
  }
  if (options.clearCaches !== false) {
    state.previewCache.clear();
  }
  document.body.classList.toggle('perf-safe', nextMode === 'safe');
  document.body.classList.toggle('perf-high', nextMode === 'high');
}

async function updatePerformanceMode(nextMode) {
  const normalized = String(nextMode || DEFAULT_PERFORMANCE_MODE).toLowerCase() === 'safe' ? 'safe' : 'high';
  applyPerformanceModeRuntime(normalized, { clearCaches: true });
  await window.c3xManager.setSettings(state.settings);
  const needsRestart = String(state.startupPerformanceMode || '') !== String(normalized);
  if (needsRestart) {
    const doRestart = window.confirm('Performance mode changed. Restart now to apply GPU rendering mode?');
    if (doRestart && window.c3xManager && typeof window.c3xManager.relaunch === 'function') {
      await window.c3xManager.relaunch();
      return;
    }
  } else {
    setStatus(`Performance mode set to ${normalized === 'safe' ? 'Safe' : 'High'}.`);
  }
  renderActiveTab({ preserveTabScroll: true });
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

function isLockedGameField(baseKey) {
  const key = String(baseKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return key === 'scenariosearchfolders' || key === 'scenariosearchfolder';
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

let scenarioNewActionMeasureCanvas = null;
function getScenarioNewActionMeasureContext() {
  if (!scenarioNewActionMeasureCanvas) scenarioNewActionMeasureCanvas = document.createElement('canvas');
  return scenarioNewActionMeasureCanvas.getContext('2d');
}

function resizeScenarioNewActionControl() {
  const selectEl = el.modeScenarioNewAction;
  if (!selectEl) return;
  const option = selectEl.options && selectEl.options[selectEl.selectedIndex];
  const label = String(option && option.textContent || 'New').trim() || 'New';
  const styles = window.getComputedStyle(selectEl);
  const ctx = getScenarioNewActionMeasureContext();
  if (!ctx) return;
  const fontSize = styles.fontSize || '14px';
  const fontFamily = styles.fontFamily || 'sans-serif';
  const fontWeight = styles.fontWeight || '700';
  const fontStyle = styles.fontStyle || 'normal';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  const textWidth = Math.ceil(ctx.measureText(label).width);
  const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
  const borderLeft = Number.parseFloat(styles.borderLeftWidth) || 0;
  const borderRight = Number.parseFloat(styles.borderRightWidth) || 0;
  const minWidth = 96;
  const maxWidth = 220;
  const measured = textWidth + paddingLeft + paddingRight + borderLeft + borderRight + 8;
  const finalWidth = Math.max(minWidth, Math.min(maxWidth, Math.ceil(measured)));
  selectEl.style.width = `${finalWidth}px`;
}

function resetScenarioNewActionControl() {
  if (!el.modeScenarioNewAction) return;
  el.modeScenarioNewAction.value = '';
  resizeScenarioNewActionControl();
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

function getDefaultScenarioParentDir() {
  const civ3Root = getCiv3InstallRoot();
  if (!civ3Root) return '';
  return `${civ3Root.replace(/\/+$/, '')}/Conquests/Scenarios`;
}

function buildScenarioSourceSelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Source scenario...';
  selectEl.appendChild(placeholder);
  const manual = document.createElement('option');
  manual.value = '__manual__';
  manual.textContent = 'Manual / Browse...';
  selectEl.appendChild(manual);
  const addGroup = (source, label) => {
    const groupItems = state.availableScenarios.filter((s) => String(s.source || '') === source);
    if (groupItems.length === 0) return;
    const group = document.createElement('optgroup');
    group.label = label;
    groupItems.forEach((item) => {
      const option = document.createElement('option');
      option.value = String(item.path || '');
      option.textContent = String(item.name || item.fileName || getPathTail(item.path));
      option.title = String(item.path || '');
      group.appendChild(option);
    });
    selectEl.appendChild(group);
  };
  addGroup('Conquests', 'Conquests Folder');
  addGroup('Scenarios', 'Scenarios Folder');
}

async function promptCreateScenarioFromBaseAction() {
  if (!el.entityModalOverlay || !el.entityModalContent) return null;
  if (el.entityModalTitle) el.entityModalTitle.textContent = 'Create Scenario: Base Game';
  if (el.entityModalBody) {
    el.entityModalBody.textContent = 'Create a new scenario folder by copying base game files and C3X defaults.';
  }
  if (el.entityModalConfirm) {
    el.entityModalConfirm.textContent = 'Create';
    el.entityModalConfirm.disabled = false;
  }
  el.entityModalContent.innerHTML = '';

  const form = document.createElement('div');
  form.className = 'entity-modal-content';
  const grid = document.createElement('div');
  grid.className = 'entity-form-grid';
  form.appendChild(grid);

  const nameField = document.createElement('div');
  nameField.className = 'entity-field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Scenario Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'My New Scenario';
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  grid.appendChild(nameField);

  const parentField = document.createElement('div');
  parentField.className = 'entity-field';
  const parentLabel = document.createElement('label');
  parentLabel.textContent = 'Scenario Folder';
  const parentRow = document.createElement('div');
  parentRow.className = 'art-path-row';
  const parentInput = document.createElement('input');
  parentInput.type = 'text';
  parentInput.placeholder = 'Folder where scenario directory will be created';
  parentInput.value = getDefaultScenarioParentDir();
  const parentPick = document.createElement('button');
  parentPick.type = 'button';
  parentPick.className = 'ghost';
  parentPick.textContent = 'Browse';
  parentPick.addEventListener('click', async () => {
    const selected = await window.c3xManager.pickDirectory();
    if (!selected) return;
    parentInput.value = selected;
  });
  parentRow.appendChild(parentInput);
  parentRow.appendChild(parentPick);
  parentField.appendChild(parentLabel);
  parentField.appendChild(parentRow);
  grid.appendChild(parentField);

  el.entityModalContent.appendChild(form);
  state.entityModal.open = true;
  el.entityModalOverlay.classList.remove('hidden');
  el.entityModalOverlay.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => nameInput.focus({ preventScroll: true }), 0);

  return new Promise((resolve) => {
    state.entityModal.resolve = resolve;
    const onConfirm = () => {
      const scenarioName = String(nameInput.value || '').trim();
      const scenarioParentDir = String(parentInput.value || '').trim();
      if (!scenarioName) {
        setStatus('Scenario name is required.', true);
        return;
      }
      if (!scenarioParentDir) {
        setStatus('Scenario folder is required.', true);
        return;
      }
      resolveEntityModal({ scenarioName, scenarioParentDir, template: 'base' });
    };
    const onCancel = () => resolveEntityModal(null);
    if (el.entityModalConfirm) el.entityModalConfirm.onclick = onConfirm;
    if (el.entityModalCancel) el.entityModalCancel.onclick = onCancel;
  });
}

async function promptCopyScenarioAction() {
  if (!el.entityModalOverlay || !el.entityModalContent) return null;
  if (el.entityModalTitle) el.entityModalTitle.textContent = 'Create Scenario: Copy Existing';
  if (el.entityModalBody) {
    el.entityModalBody.textContent = 'Copy an existing scenario folder and rename its BIQ for the new scenario.';
  }
  if (el.entityModalConfirm) {
    el.entityModalConfirm.textContent = 'Create Copy';
    el.entityModalConfirm.disabled = false;
  }
  el.entityModalContent.innerHTML = '';

  const form = document.createElement('div');
  form.className = 'entity-modal-content';
  const grid = document.createElement('div');
  grid.className = 'entity-form-grid';
  form.appendChild(grid);

  const sourceField = document.createElement('div');
  sourceField.className = 'entity-field';
  const sourceLabel = document.createElement('label');
  sourceLabel.textContent = 'Source Scenario';
  const sourceRow = document.createElement('div');
  sourceRow.className = 'art-path-row';
  const sourceSelect = document.createElement('select');
  buildScenarioSourceSelect(sourceSelect);
  const sourceBrowse = document.createElement('button');
  sourceBrowse.type = 'button';
  sourceBrowse.className = 'ghost';
  sourceBrowse.textContent = 'Browse';
  sourceRow.appendChild(sourceSelect);
  sourceRow.appendChild(sourceBrowse);
  sourceField.appendChild(sourceLabel);
  sourceField.appendChild(sourceRow);
  grid.appendChild(sourceField);

  const nameField = document.createElement('div');
  nameField.className = 'entity-field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'New Scenario Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'My Scenario Copy';
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  grid.appendChild(nameField);

  const parentField = document.createElement('div');
  parentField.className = 'entity-field';
  const parentLabel = document.createElement('label');
  parentLabel.textContent = 'Scenario Folder';
  const parentRow = document.createElement('div');
  parentRow.className = 'art-path-row';
  const parentInput = document.createElement('input');
  parentInput.type = 'text';
  parentInput.placeholder = 'Folder where scenario directory will be created';
  parentInput.value = getDefaultScenarioParentDir();
  const parentPick = document.createElement('button');
  parentPick.type = 'button';
  parentPick.className = 'ghost';
  parentPick.textContent = 'Browse';
  parentPick.addEventListener('click', async () => {
    const selected = await window.c3xManager.pickDirectory();
    if (!selected) return;
    parentInput.value = selected;
  });
  parentRow.appendChild(parentInput);
  parentRow.appendChild(parentPick);
  parentField.appendChild(parentLabel);
  parentField.appendChild(parentRow);
  grid.appendChild(parentField);

  el.entityModalContent.appendChild(form);
  state.entityModal.open = true;
  el.entityModalOverlay.classList.remove('hidden');
  el.entityModalOverlay.setAttribute('aria-hidden', 'false');

  let selectedSourcePath = '';
  let nameEdited = false;
  const syncDefaultNameFromSource = () => {
    if (nameEdited) return;
    const base = stripBiqExtension(getPathTail(selectedSourcePath));
    if (!base) return;
    nameInput.value = `${base} Copy`;
  };

  sourceSelect.addEventListener('change', async () => {
    const value = String(sourceSelect.value || '').trim();
    if (!value) return;
    if (value === '__manual__') {
      sourceBrowse.click();
      return;
    }
    selectedSourcePath = value;
    syncDefaultNameFromSource();
  });

  sourceBrowse.addEventListener('click', async () => {
    const filePath = await window.c3xManager.pickFile({
      filters: [{ name: 'BIQ Scenario Files', extensions: ['biq'] }]
    });
    if (!filePath) return;
    selectedSourcePath = filePath;
    const hasOption = Array.from(sourceSelect.options).some((opt) => String(opt.value || '') === filePath);
    sourceSelect.value = hasOption ? filePath : '__manual__';
    syncDefaultNameFromSource();
  });

  nameInput.addEventListener('input', () => {
    nameEdited = true;
  });
  window.setTimeout(() => sourceSelect.focus({ preventScroll: true }), 0);

  return new Promise((resolve) => {
    state.entityModal.resolve = resolve;
    const onConfirm = () => {
      const scenarioName = String(nameInput.value || '').trim();
      const scenarioParentDir = String(parentInput.value || '').trim();
      if (!selectedSourcePath) {
        setStatus('Source scenario is required.', true);
        return;
      }
      if (!scenarioName) {
        setStatus('Scenario name is required.', true);
        return;
      }
      if (!scenarioParentDir) {
        setStatus('Scenario folder is required.', true);
        return;
      }
      resolveEntityModal({
        template: 'copy',
        sourceScenarioPath: selectedSourcePath,
        scenarioName,
        scenarioParentDir
      });
    };
    const onCancel = () => resolveEntityModal(null);
    if (el.entityModalConfirm) el.entityModalConfirm.onclick = onConfirm;
    if (el.entityModalCancel) el.entityModalCancel.onclick = onCancel;
  });
}

async function runScenarioCreateFlow(kind = 'base') {
  if (!window.c3xManager || typeof window.c3xManager.createScenario !== 'function') {
    setStatus('Scenario creation API is unavailable in this build.', true);
    return false;
  }
  const actionLabel = kind === 'copy' ? 'creating a copied scenario' : 'creating a new scenario';
  const allow = await confirmResolveUnsavedChanges(actionLabel);
  if (!allow) return false;
  const details = kind === 'copy'
    ? await promptCopyScenarioAction()
    : await promptCreateScenarioFromBaseAction();
  if (!details) {
    updateScenarioSelectValue();
    resetScenarioNewActionControl();
    return false;
  }
  if (!state.settings || !state.settings.civ3Path) {
    setStatus('Set Civilization 3 folder before creating a scenario.', true);
    return false;
  }
  if (!state.settings.c3xPath) {
    setStatus('Set C3X folder before creating a scenario.', true);
    return false;
  }
  const created = await window.c3xManager.createScenario({
    dryRun: true,
    c3xPath: state.settings.c3xPath,
    civ3Path: state.settings.civ3Path,
    template: details.template || 'base',
    sourceScenarioPath: details.sourceScenarioPath || '',
    scenarioName: details.scenarioName,
    scenarioParentDir: details.scenarioParentDir
  });
  if (!created || !created.ok) {
    setStatus((created && created.error) || 'Could not prepare scenario creation.', true);
    updateScenarioSelectValue();
    resetScenarioNewActionControl();
    return false;
  }
  const writeRoots = Array.isArray(created.scenarioWriteRoots) ? created.scenarioWriteRoots : [created.scenarioDir];
  const preflightLines = [
    `Scenario: ${created.scenarioName || details.scenarioName}`,
    `Destination: ${created.scenarioDir || details.scenarioParentDir}`,
    '',
    'Writable roots:',
    ...writeRoots.map((p) => `- ${p}`)
  ];
  if (kind === 'copy' && Array.isArray(created.sourceSearchRoots) && created.sourceSearchRoots.length > 0) {
    preflightLines.push('', 'Source scenario search roots to isolate:');
    created.sourceSearchRoots.forEach((p) => preflightLines.push(`- ${p}`));
  }
  const proceed = window.confirm(`Create scenario with this plan?\n\n${preflightLines.join('\n')}`);
  if (!proceed) {
    updateScenarioSelectValue();
    resetScenarioNewActionControl();
    return false;
  }

  const committed = await window.c3xManager.createScenario({
    c3xPath: state.settings.c3xPath,
    civ3Path: state.settings.civ3Path,
    template: details.template || 'base',
    sourceScenarioPath: details.sourceScenarioPath || '',
    scenarioName: details.scenarioName,
    scenarioParentDir: details.scenarioParentDir
  });
  if (!committed || !committed.ok) {
    setStatus((committed && committed.error) || 'Could not create scenario.', true);
    updateScenarioSelectValue();
    resetScenarioNewActionControl();
    return false;
  }
  setMode('scenario');
  el.scenarioPath.value = String(committed.scenarioBiqPath || '');
  syncSettingsFromInputs();
  await refreshScenarioSelectOptions();
  updateScenarioSelectValue();
  updatePathsSummary();
  updateModeState();
  await window.c3xManager.setSettings(state.settings);
  await loadBundleAndRender({ loadingText: kind === 'copy' ? 'Loading copied scenario...' : 'Loading new scenario...' });
  const statusVerb = kind === 'copy' ? 'Copied' : 'Created';
  setStatus(`${statusVerb} scenario "${committed.scenarioName}" and loaded it.`);
  resetScenarioNewActionControl();
  return true;
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
    el.modeScenarioNewAction,
    el.fontDown,
    el.fontUp,
    el.c3xPath,
    el.civ3Path,
    el.scenarioPath,
    el.pickC3x,
    el.pickCiv3,
    el.pickScenario,
    el.pathsToggle,
    el.globalSearchBtn,
    el.backBtn,
    el.forwardBtn,
    el.saveBtn,
    el.undoBtn
  ];
  controls.forEach((control) => {
    if (control) control.disabled = state.isLoading;
  });
  refreshDirtyUi();
  updateNavButtons();
}

function updateScrollTopFab() {
  if (!el.scrollTopFab || !el.tabContent || !el.workspace) return;
  const canShow = !el.workspace.classList.contains('hidden') && el.tabContent.scrollTop > 220;
  el.scrollTopFab.classList.toggle('hidden', !canShow);
}

function clearBundleView() {
  closeFileDiffModal();
  state.bundle = null;
  state.trackDirty = false;
  state.baseFilter = '';
  state.cleanSnapshot = '';
  state.cleanTabsCache = null;
  state.undoSnapshot = null;
  state.isDirty = false;
  clearDirtyTabCounts();
  refreshDirtyUi();
  if (el.tabs) el.tabs.innerHTML = '';
  if (el.tabContent) el.tabContent.innerHTML = '';
  if (el.workspace) el.workspace.classList.add('hidden');
  state.navHistory = [];
  state.navHistoryIndex = -1;
  state.filesReadAccessByPath = {};
  state.filesReadIssueCount = 0;
  state.filesReadEntriesCache = null;
  state.filesReadEntriesCacheDirty = true;
  updateFilesReadIssueBadge();
  renderFilesReadModal();
  updateNavButtons();
  updateScrollTopFab();
}

function cloneStateMap(mapLike) {
  return Object.assign({}, mapLike || {});
}

function viewContextKey() {
  if (!state.settings) return '';
  return JSON.stringify({
    mode: String(state.settings.mode || ''),
    c3xPath: String(state.settings.c3xPath || ''),
    civ3Path: String(state.settings.civ3Path || ''),
    scenarioPath: String(state.settings.scenarioPath || '')
  });
}

function schedulePersistSettings(delayMs = 180) {
  if (!state.settings) return;
  if (state.settingsPersistTimer) {
    window.clearTimeout(state.settingsPersistTimer);
  }
  state.settingsPersistTimer = window.setTimeout(() => {
    state.settingsPersistTimer = null;
    void window.c3xManager.setSettings(state.settings);
  }, delayMs);
}

function persistCurrentViewSnapshot() {
  if (!state.settings || !state.bundle || !state.bundle.tabs) return;
  const snapshot = captureViewSnapshot();
  if (!snapshot) return;
  if (!state.settings.uiStateByContext || typeof state.settings.uiStateByContext !== 'object') {
    state.settings.uiStateByContext = {};
  }
  const key = viewContextKey();
  if (!key) return;
  state.settings.uiStateByContext[key] = snapshot;
  schedulePersistSettings(180);
}

function loadPersistedViewSnapshot() {
  if (!state.settings || !state.settings.uiStateByContext || typeof state.settings.uiStateByContext !== 'object') {
    return null;
  }
  const key = viewContextKey();
  if (!key) return null;
  const snapshot = state.settings.uiStateByContext[key];
  return snapshot && typeof snapshot === 'object' ? snapshot : null;
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
    techTreeEraSelectionByTab: cloneStateMap(state.techTreeEraSelectionByTab),
    techTreeSnapByTab: cloneStateMap(state.techTreeSnapByTab),
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
  persistCurrentViewSnapshot();
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
  persistCurrentViewSnapshot();
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
  state.techTreeEraSelectionByTab = cloneStateMap(snapshot.techTreeEraSelectionByTab);
  state.techTreeSnapByTab = cloneStateMap(snapshot.techTreeSnapByTab);
  state.biqMapSelectedTile = Number.isFinite(snapshot.biqMapSelectedTile) ? snapshot.biqMapSelectedTile : -1;
  state.biqMapLayer = String(snapshot.biqMapLayer || 'terrain');
  state.biqMapZoom = Number.isFinite(snapshot.biqMapZoom) ? snapshot.biqMapZoom : state.biqMapZoom;
  state.tabContentScrollTop = Number.isFinite(snapshot.tabContentScrollTop) ? snapshot.tabContentScrollTop : 0;
  renderTabs();
  renderActiveTab({ preserveTabScroll: true });
  updateNavButtons();
  persistCurrentViewSnapshot();
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
  if (!before || !after || before.activeTab !== after.activeTab) {
    renderTabs();
  }
  renderActiveTab(renderOptions);
  if (!state.isApplyingHistory && before && after && snapshotKey(before) !== snapshotKey(after)) {
    pushNavigationSnapshot(after);
  } else {
    updateNavButtons();
    persistCurrentViewSnapshot();
  }
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreSearchMatch(haystack, tokens, query) {
  if (!tokens || tokens.length === 0) return 0;
  let score = 0;
  for (const token of tokens) {
    const idx = haystack.indexOf(token);
    if (idx < 0) return -1;
    score += (idx === 0 ? 18 : Math.max(2, 10 - Math.min(idx, 8)));
  }
  if (haystack.startsWith(query)) score += 14;
  else if (haystack.includes(` ${query}`)) score += 8;
  return score;
}

function navigateToReferenceEntry(tabKey, entryOrKey, options = {}) {
  const targetTabKey = String(tabKey || '').trim();
  if (!targetTabKey || !state.bundle || !state.bundle.tabs) return false;
  const tab = state.bundle.tabs[targetTabKey];
  if (!tab || tab.type !== 'reference' || !Array.isArray(tab.entries)) return false;
  const rawKey = typeof entryOrKey === 'string'
    ? entryOrKey
    : String(entryOrKey && entryOrKey.civilopediaKey || '');
  const targetKey = String(rawKey || '').trim().toUpperCase();
  if (!targetKey) return false;
  const idx = tab.entries.findIndex((entry) => String(entry && entry.civilopediaKey || '').trim().toUpperCase() === targetKey);
  if (idx < 0) return false;
  navigateWithHistory(() => {
    state.activeTab = targetTabKey;
    state.referenceSelection[targetTabKey] = idx;
    state.referenceFilter[targetTabKey] = '';
  }, { preserveTabScroll: !!options.preserveTabScroll });
  return true;
}

function getReferenceEntrySearchTerms(tabKey, entry) {
  const terms = [];
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  fields.forEach((field) => {
    const label = String(field && field.label || '').trim();
    const baseKey = String(field && (field.baseKey || field.key) || '').trim();
    if (label) terms.push(label);
    if (baseKey) terms.push(baseKey);
  });
  if (tabKey === 'units') {
    terms.push('Unit Abilities');
    terms.push('Available To');
    terms.push('Stealth Attack Targets');
    terms.push('Ignore Movement Cost');
    terms.push('Legal Unit Telepads');
    terms.push('Legal Building Telepads');
    terms.push('Lists');
  }
  return terms.join(' ');
}

function getBiqRecordSearchTerms(sectionCode, record) {
  const terms = [];
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  fields.forEach((field) => {
    if (shouldHideBiqStructureField(sectionCode, field)) return;
    const label = String(field && field.label || '').trim();
    const baseKey = String(field && (field.baseKey || field.key) || '').trim();
    const value = String(field && field.value || '').trim();
    const group = getBiqStructureFieldGroup(sectionCode, field);
    if (group) terms.push(group);
    if (label) terms.push(label);
    if (baseKey) terms.push(baseKey);
    if (value && value.length <= 80) terms.push(value);
  });
  return terms.join(' ');
}

function collectGlobalSearchItems() {
  const items = [];
  if (!state.bundle || !state.bundle.tabs) return items;
  const tabs = state.bundle.tabs;
  const tabAliases = {
    terrain: 'worker actions worker jobs tfrm terrain types',
    gameConcepts: 'gcon concepts civlopedia concepts'
  };

  Object.entries(tabs).forEach(([tabKey, tab]) => {
    if (!tab) return;
    const tabTitle = String(tab.title || tabKey);
    items.push({
      kind: 'Tab',
      title: tabTitle,
      subtitle: `Open ${tabTitle} tab`,
      search: `${tabTitle} ${tabKey} ${tabAliases[tabKey] || ''}`,
      action: () => {
        navigateWithHistory(() => {
          state.activeTab = tabKey;
        }, { preserveTabScroll: false });
      }
    });

    if (tab.type === 'reference' && Array.isArray(tab.entries)) {
      tab.entries.forEach((entry, idx) => {
        const key = String(entry.civilopediaKey || '');
        const name = String(entry.name || key || `Entry ${idx + 1}`);
        const fieldSearch = getReferenceEntrySearchTerms(tabKey, entry);
        items.push({
          kind: 'Entry',
          title: `${tabTitle}: ${name}`,
          subtitle: key || tabTitle,
          search: `${tabTitle} ${name} ${key} ${fieldSearch}`,
          action: () => {
            navigateWithHistory(() => {
              state.activeTab = tabKey;
              state.referenceSelection[tabKey] = idx;
              state.referenceFilter[tabKey] = '';
            }, { preserveTabScroll: false });
          }
        });
      });
    }

    if (tabKey === 'base' && Array.isArray(tab.rows)) {
      tab.rows.forEach((row) => {
        const rawKey = String(row && row.key || '').trim();
        if (!rawKey) return;
        const friendlyName = toFriendlyKey(rawKey);
        const docs = String((tab.fieldDocs && tab.fieldDocs[rawKey]) || '').trim();
        const rowValue = String(row && row.value || '').trim();
        items.push({
          kind: 'C3X Field',
          title: `${tabTitle}: ${friendlyName}`,
          subtitle: rawKey,
          search: `${tabTitle} c3x base field setting ${friendlyName} ${rawKey} ${docs} ${rowValue}`,
          action: () => {
            navigateWithHistory(() => {
              state.activeTab = tabKey;
              state.baseFilter = rawKey;
            }, { preserveTabScroll: false });
          }
        });
      });
    }

    if (tab.type === 'biqStructure' && Array.isArray(tab.sections)) {
      tab.sections.forEach((section, sectionIndex) => {
        const sectionTitle = getFriendlyBiqSectionTitle(section);
        const sectionAlias = `${sectionTitle} ${section.code || ''}`;
        const panelSearch = String(section && section.code || '').toUpperCase() === 'GAME'
          ? GAME_PANEL_DEFINITIONS.map((panel) => `${panel.label} ${(panel.groups || []).join(' ')}`).join(' ')
          : '';
        items.push({
          kind: 'Section',
          title: `${tabTitle}: ${sectionTitle}`,
          subtitle: String(section.code || ''),
          search: `${tabTitle} ${sectionAlias} ${panelSearch}`,
          action: () => {
            navigateWithHistory(() => {
              state.activeTab = tabKey;
              state.biqSectionSelectionByTab[tabKey] = sectionIndex;
            }, { preserveTabScroll: false });
          }
        });
        if (String(section && section.code || '').toUpperCase() === 'GAME') {
          GAME_PANEL_DEFINITIONS.forEach((panel, panelIdx) => {
            items.push({
              kind: 'Panel',
              title: `${tabTitle}: ${panel.label}`,
              subtitle: sectionTitle,
              search: `${tabTitle} ${sectionTitle} ${panel.label} ${(panel.groups || []).join(' ')}`,
              action: () => {
                navigateWithHistory(() => {
                  state.activeTab = tabKey;
                  state.biqSectionSelectionByTab[tabKey] = sectionIndex;
                  state.biqSectionSelectionByTab[`${tabKey}:game-panel`] = panelIdx;
                }, { preserveTabScroll: false });
              }
            });
          });
        }
        const records = Array.isArray(section.records) ? section.records : [];
        records.forEach((record, recordIndex) => {
          const recordName = getDisplayBiqRecordName(section.code, record, recordIndex);
          const recordFieldTerms = getBiqRecordSearchTerms(section.code, record);
          items.push({
            kind: 'Record',
            title: `${sectionTitle}: ${recordName}`,
            subtitle: `${tabTitle} · ${section.code} #${recordIndex + 1}`,
            search: `${tabTitle} ${sectionAlias} ${panelSearch} ${recordName} ${recordFieldTerms}`,
            action: () => {
              navigateWithHistory(() => {
                state.activeTab = tabKey;
                state.biqSectionSelectionByTab[tabKey] = sectionIndex;
                state.biqRecordSelection[section.id] = recordIndex;
              }, { preserveTabScroll: false });
            }
          });
        });
      });
    }

    if (tabKey === 'terrain' && tab.civilopedia) {
      const groups = [
        { title: 'Terrain Civilopedia', entries: (tab.civilopedia.terrain && tab.civilopedia.terrain.entries) || [], aliases: 'terrain terr' },
        { title: 'Worker Actions', entries: (tab.civilopedia.workerActions && tab.civilopedia.workerActions.entries) || [], aliases: 'worker actions worker jobs tfrm' }
      ];
      groups.forEach((group) => {
        group.entries.forEach((entry) => {
          const name = String(entry.name || entry.civilopediaKey || '');
          const key = String(entry.civilopediaKey || '');
          const sectionCode = group.title === 'Worker Actions' ? 'TFRM' : 'TERR';
          items.push({
            kind: 'Civilopedia',
            title: `${group.title}: ${name}`,
            subtitle: key,
            search: `${group.title} ${group.aliases} ${name} ${key}`,
            action: () => {
              const hit = findTerrainRecordSelectionByEntry(sectionCode, entry)
                || findTerrainRecordSelectionByCivilopediaKey(key);
              navigateToTerrainRecordSelection(hit);
            }
          });
        });
      });
    }
  });
  return items;
}

function computeGlobalSearchResults(query) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const allItems = collectGlobalSearchItems();
  const withScore = allItems
    .map((item) => {
      const hay = normalizeSearchText(`${item.search || ''} ${item.title || ''} ${item.subtitle || ''}`);
      const score = tokens.length === 0 ? 1 : scoreSearchMatch(hay, tokens, normalizedQuery);
      return { item, score };
    })
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || String(a.item.title || '').localeCompare(String(b.item.title || ''), 'en', { sensitivity: 'base' }))
    .slice(0, 180)
    .map((row) => row.item);
  return withScore;
}

function renderGlobalSearchResults() {
  if (!el.globalSearchResults) return;
  const results = Array.isArray(state.globalSearch.results) ? state.globalSearch.results : [];
  const activeIndex = Math.max(0, Math.min(Number(state.globalSearch.activeIndex || 0), Math.max(0, results.length - 1)));
  state.globalSearch.activeIndex = activeIndex;
  el.globalSearchResults.innerHTML = '';
  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'global-search-empty';
    empty.textContent = 'No matches.';
    el.globalSearchResults.appendChild(empty);
    return;
  }
  results.forEach((result, idx) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'global-search-row';
    if (idx === activeIndex) row.classList.add('active');
    row.innerHTML = `
      <span class="global-search-row-kind">${result.kind || 'Result'}</span>
      <span class="global-search-row-title">${result.title || ''}</span>
      <span class="global-search-row-sub">${result.subtitle || ''}</span>
    `;
    row.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      state.globalSearch.activeIndex = idx;
      activateGlobalSearchSelection();
    });
    el.globalSearchResults.appendChild(row);
  });
  const activeEl = el.globalSearchResults.querySelector('.global-search-row.active');
  if (activeEl) {
    activeEl.scrollIntoView({ block: 'nearest' });
  }
}

function activateGlobalSearchSelection() {
  const results = state.globalSearch.results || [];
  const idx = Math.max(0, Math.min(Number(state.globalSearch.activeIndex || 0), Math.max(0, results.length - 1)));
  const selected = results[idx];
  if (!selected || typeof selected.action !== 'function') return;
  try {
    selected.action();
    closeGlobalSearchOverlay();
  } catch (err) {
    setStatus(`Search jump failed: ${err && err.message ? err.message : 'unknown error'}`, true);
  }
}

function refreshGlobalSearchResults() {
  state.globalSearch.results = computeGlobalSearchResults(state.globalSearch.query || '');
  state.globalSearch.activeIndex = 0;
  renderGlobalSearchResults();
}

function closeGlobalSearchOverlay() {
  state.globalSearch.open = false;
  if (el.globalSearchOverlay) {
    el.globalSearchOverlay.classList.add('hidden');
    el.globalSearchOverlay.setAttribute('aria-hidden', 'true');
  }
}

function openGlobalSearchOverlay(initialQuery = '') {
  if (!el.globalSearchOverlay || !el.globalSearchInput) return;
  state.globalSearch.open = true;
  state.globalSearch.query = String(initialQuery || '');
  state.globalSearch.activeIndex = 0;
  el.globalSearchOverlay.classList.remove('hidden');
  el.globalSearchOverlay.setAttribute('aria-hidden', 'false');
  el.globalSearchInput.value = state.globalSearch.query;
  refreshGlobalSearchResults();
  window.setTimeout(() => {
    el.globalSearchInput.focus({ preventScroll: true });
    el.globalSearchInput.setSelectionRange(el.globalSearchInput.value.length, el.globalSearchInput.value.length);
  }, 0);
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
  resetFilesReadFiltersForCurrentMode();
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
  updateSaveButtonLabel();
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

function lockPathInputs() {
  [el.c3xPath, el.civ3Path, el.scenarioPath].forEach((input) => {
    if (!input) return;
    input.readOnly = true;
    input.setAttribute('aria-readonly', 'true');
  });
}

function isBiqPath(value) {
  return /\.biq$/i.test(String(value || '').trim());
}

function prettySourceLabel(source) {
  if (!source) return 'unknown';
  return source.replace('+', ' -> ');
}

function getC3xBaseCustomPath() {
  const root = String((state.settings && state.settings.c3xPath) || '').trim();
  if (!root) return '';
  return `${root.replace(/[\\/]+$/, '')}/custom.c3x_config.ini`;
}

function getC3xBaseScenarioPath() {
  const scenarioDir = String((state.bundle && state.bundle.scenarioPath) || '').trim();
  if (!scenarioDir) return '';
  return `${scenarioDir.replace(/[\\/]+$/, '')}/scenario.c3x_config.ini`;
}

function getActiveBaseTargetName() {
  return isScenarioMode() ? 'scenario.c3x_config.ini' : 'custom.c3x_config.ini';
}

function getActiveBaseTargetPath() {
  const tabTarget = String((state.bundle && state.bundle.tabs && state.bundle.tabs.base && state.bundle.tabs.base.targetPath) || '').trim();
  if (tabTarget) return tabTarget;
  if (isScenarioMode()) return getC3xBaseScenarioPath();
  return getC3xBaseCustomPath();
}

function getActiveBaseChainLine() {
  if (isScenarioMode()) {
    return 'default.c3x_config.ini (read-only) -> custom.c3x_config.ini -> scenario.c3x_config.ini (editable)';
  }
  return 'default.c3x_config.ini (read-only) -> custom.c3x_config.ini (editable)';
}

function getBaseFieldSource(row) {
  if (!row || !row.source) return 'unknown';
  if (row.source === 'default') return 'default.c3x_config.ini';
  if (row.source === 'custom') return 'custom.c3x_config.ini';
  if (row.source === 'scenario') return 'scenario.c3x_config.ini';
  return String(row.source);
}

function toFriendlyKey(key) {
  return key.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function getC3xReleaseInfo(rawKey) {
  const key = String(rawKey || '').trim().toLowerCase();
  if (!key) {
    return { label: 'R1', confidence: 'assumed', note: 'Release unknown.' };
  }
  const exact = C3X_RELEASE_BY_KEY[key];
  if (exact) {
    return { label: exact, confidence: 'exact', note: `Introduced in ${exact} (changelog/direct mapping).` };
  }
  return {
    label: 'R1',
    confidence: 'assumed',
    note: 'Not explicitly mapped in changelog; assumed to be an older core setting.'
  };
}

function createBaseMeta(row, fieldDocs) {
  const meta = document.createElement('div');
  meta.className = 'field-meta-block';
  const desc = (fieldDocs && fieldDocs[row.key]) || BASE_FIELD_DETAILS[row.key] || '';
  const source = document.createElement('div');
  source.className = 'field-meta source';
  source.textContent = `Source: ${getBaseFieldSource(row)}`;
  meta.appendChild(source);
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

function normalizeConfigToken(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return '';
  return raw.replace(/^"(.*)"$/, '$1').trim();
}

function parseConfigInteger(value, fallback = 0) {
  const normalized = normalizeConfigToken(value);
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseConfigBool(value, fallback = false) {
  const normalized = normalizeConfigToken(value).toLowerCase();
  if (!normalized) return fallback;
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  const parsed = Number.parseInt(normalized, 10);
  if (Number.isFinite(parsed)) return parsed !== 0;
  return fallback;
}

function hasExplicitConfigInteger(value) {
  const raw = normalizeConfigToken(value);
  if (!raw) return false;
  return /^-?\d+$/.test(raw);
}

function quoteConfigToken(value) {
  const clean = normalizeConfigToken(value);
  if (!clean) return '';
  return `"${clean.replace(/"/g, '\\"')}"`;
}

function parseStructuredEntries(value) {
  let v = String(value || '').trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    v = v.slice(1, -1).trim();
  }
  if (!v) return [];
  if (/[,\r\n]/.test(v)) return tokenizeListPreservingQuotes(v);
  return tokenizeWhitespacePreservingQuotes(v);
}

function serializeStructuredEntries(entries) {
  const cleaned = entries.map((e) => String(e || '').trim()).filter(Boolean);
  return cleaned.length > 0 ? `[${cleaned.join(', ')}]` : '';
}

function serializeQuotedStructuredEntries(entries) {
  const cleaned = (Array.isArray(entries) ? entries : [])
    .map((e) => normalizeConfigToken(e))
    .filter(Boolean)
    .map((token) => quoteConfigToken(token));
  return cleaned.length > 0 ? `[${cleaned.join(', ')}]` : '';
}

function tokenizeWhitespacePreservingQuotes(text) {
  const input = String(text || '').trim();
  if (!input) return [];
  const parts = input.match(/"[^"]*"|\S+/g) || [];
  return parts.map((part) => String(part || '').trim()).filter(Boolean);
}

function parseBracketedOptionTokens(value) {
  let raw = String(value || '').trim();
  if (raw.startsWith('[') && raw.endsWith(']')) raw = raw.slice(1, -1).trim();
  if (!raw) return [];
  const hasCommaOrNewline = /[,\r\n]/.test(raw);
  const tokens = hasCommaOrNewline
    ? tokenizeListPreservingQuotes(raw)
    : tokenizeWhitespacePreservingQuotes(raw);
  return tokens.map((token) => normalizeConfigToken(token)).filter(Boolean);
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
    .map((it) => `${quoteConfigToken(it.name)}: ${it.amount}`);
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
      const building = quoteConfigToken(it.building);
      const units = it.units.map((u) => quoteConfigToken(u)).join(' ');
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
      const b = quoteConfigToken(it.building);
      const r = quoteConfigToken(it.resource);
      return `${b}: ${[...it.flags, r].join(' ')}`;
    });
  return serializeStructuredEntries(entries);
}

function quoteIfNeeded(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/[\s,:\[\]]/.test(v)) return `"${v}"`;
  return v;
}

function tokenizeSpaceAware(text) {
  const s = String(text || '').trim();
  const out = [];
  let cur = '';
  let inQuotes = false;
  let parenDepth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '(') parenDepth += 1;
      if (ch === ')' && parenDepth > 0) parenDepth -= 1;
      if ((ch === ' ' || ch === '\t') && parenDepth === 0) {
        const token = cur.trim();
        if (token) out.push(token);
        cur = '';
        continue;
      }
    }
    cur += ch;
  }
  const tail = cur.trim();
  if (tail) out.push(tail);
  return out;
}

function parseCivAliasesByEra(value) {
  return parseStructuredEntries(value).map((entry) => {
    const i = entry.indexOf(':');
    if (i < 0) return { source: entry.trim().replace(/^"(.*)"$/, '$1'), replacements: [] };
    const source = entry.slice(0, i).trim().replace(/^"(.*)"$/, '$1');
    const rhs = entry.slice(i + 1).trim();
    const replacements = tokenizeSpaceAware(rhs).map((t) => t.replace(/^"(.*)"$/, '$1')).filter(Boolean);
    return { source, replacements };
  });
}

function serializeCivAliasesByEra(items) {
  const entries = (Array.isArray(items) ? items : [])
    .map((item) => {
      const source = String(item && item.source || '').trim();
      const repls = (Array.isArray(item && item.replacements) ? item.replacements : [])
        .map((r) => String(r || '').trim())
        .filter(Boolean);
      if (!source || repls.length === 0) return '';
      return `${quoteIfNeeded(source)}: ${repls.map((r) => quoteIfNeeded(r)).join(' ')}`;
    })
    .filter(Boolean);
  return serializeStructuredEntries(entries);
}

function parseLeaderAliasToken(token) {
  const t = String(token || '').trim();
  if (!t) return { name: '', gender: '', title: '' };
  const match = t.match(/^(.*?)(?:\s*\(([^)]*)\))?$/);
  const rawName = String((match && match[1]) || t).trim().replace(/^"(.*)"$/, '$1');
  const meta = String((match && match[2]) || '').trim();
  let gender = '';
  let title = '';
  if (meta) {
    const parts = meta.split(',').map((p) => String(p || '').trim()).filter(Boolean);
    if (parts.length > 0) {
      const g = String(parts[0] || '').toUpperCase();
      if (g === 'M' || g === 'F') gender = g;
      else title = parts.join(', ');
      if (parts.length > 1) title = parts.slice(1).join(', ').trim();
    }
  }
  return { name: rawName, gender, title };
}

function parseLeaderAliasesByEra(value) {
  return parseStructuredEntries(value).map((entry) => {
    const i = entry.indexOf(':');
    if (i < 0) return { source: entry.trim().replace(/^"(.*)"$/, '$1'), replacements: [] };
    const source = entry.slice(0, i).trim().replace(/^"(.*)"$/, '$1');
    const rhs = entry.slice(i + 1).trim();
    const tokens = rhs.match(/"[^"]+"(?:\s*\([^)]*\))?|[^\s"]+(?:\s*\([^)]*\))?/g) || [];
    const replacements = tokens.map((tok) => parseLeaderAliasToken(tok)).filter((r) => r.name);
    return { source, replacements };
  });
}

function serializeLeaderAliasesByEra(items) {
  const entries = (Array.isArray(items) ? items : [])
    .map((item) => {
      const source = String(item && item.source || '').trim();
      const repls = Array.isArray(item && item.replacements) ? item.replacements : [];
      const chunks = repls
        .map((rep) => {
          const name = String(rep && rep.name || '').trim();
          if (!name) return '';
          const gender = String(rep && rep.gender || '').trim().toUpperCase();
          const title = String(rep && rep.title || '').trim();
          const namePart = quoteIfNeeded(name);
          if (!gender && !title) return namePart;
          if (gender && title) return `${namePart} (${gender}, ${title})`;
          if (gender) return `${namePart} (${gender})`;
          return `${namePart} (${title})`;
        })
        .filter(Boolean);
      if (!source || chunks.length === 0) return '';
      return `${quoteIfNeeded(source)}: ${chunks.join(' ')}`;
    })
    .filter(Boolean);
  return serializeStructuredEntries(entries);
}

function getNamedReferenceOptionsForTab(tabKey) {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
  if (!tab || !Array.isArray(tab.entries)) return [];
  const normalizedTabKey = String(tabKey || '').trim();
  const getEntryLabel = (entry) => {
    if (normalizedTabKey === 'improvements') {
      const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
      const nameField = fields.find((field) => String(field && (field.baseKey || field.key) || '').trim().toLowerCase() === 'name');
      const biqName = normalizeConfigToken(nameField && nameField.value);
      if (biqName) return biqName;
    }
    return String(entry && entry.name || '').trim();
  };
  return tab.entries
    .map((entry) => {
      const label = getEntryLabel(entry);
      return {
        value: label,
        label,
        entry
      };
    })
    .filter((opt) => !!opt.value)
    .sort((a, b) => String(a.label).localeCompare(String(b.label), 'en', { sensitivity: 'base' }));
}

function getFilteredImprovementOptions(filterKinds = []) {
  const allow = new Set((Array.isArray(filterKinds) ? filterKinds : []).map((k) => String(k || '').trim().toLowerCase()).filter(Boolean));
  const options = getNamedReferenceOptionsForTab('improvements');
  if (allow.size === 0) return options;
  return options.filter((opt) => {
    const kind = String(opt && opt.entry && opt.entry.improvementKind || '').trim().toLowerCase();
    return allow.has(kind);
  });
}

function getCivilizationNameSuggestions() {
  return getNamedReferenceOptionsForTab('civilizations').map((opt) => String(opt.value || '')).filter(Boolean);
}

function getLeaderNameSuggestions() {
  const out = new Set();
  const civTab = state.bundle && state.bundle.tabs && state.bundle.tabs.civilizations;
  const entries = civTab && Array.isArray(civTab.entries) ? civTab.entries : [];
  entries.forEach((entry) => {
    const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
    const leader = fields.find((f) => String(f && (f.baseKey || f.key) || '').toLowerCase() === 'leadername');
    const leaderName = String(leader && leader.value || '').trim();
    if (leaderName) out.add(leaderName);
  });
  return Array.from(out).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function attachSuggestions(input, suggestions) {
  if (!input || !Array.isArray(suggestions) || suggestions.length === 0) return null;
  const safe = suggestions.map((s) => String(s || '').trim()).filter(Boolean);
  if (safe.length === 0) return null;
  const listId = `suggest-${Math.random().toString(36).slice(2)}`;
  const dl = document.createElement('datalist');
  dl.id = listId;
  safe.forEach((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    dl.appendChild(opt);
  });
  input.setAttribute('list', listId);
  return dl;
}

function makeSegmentedChoiceControl(options, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'segmented-control';
  const opts = (Array.isArray(options) ? options : []).map((opt) => String(opt || '').trim()).filter(Boolean);
  const selected = String(value || '').trim();
  opts.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'segmented-control-btn';
    btn.textContent = opt;
    btn.classList.toggle('active', opt === selected);
    btn.addEventListener('click', () => {
      Array.from(wrap.querySelectorAll('.segmented-control-btn')).forEach((node) => node.classList.remove('active'));
      btn.classList.add('active');
      if (typeof onChange === 'function') onChange(opt);
    });
    wrap.appendChild(btn);
  });
  return wrap;
}

function makeNamedListPickerEditor(config) {
  const cfg = config || {};
  const tabKey = String(cfg.tabKey || '').trim();
  const onValuesChange = typeof cfg.onValuesChange === 'function' ? cfg.onValuesChange : null;
  const options = Array.isArray(cfg.options) ? cfg.options : getNamedReferenceOptionsForTab(tabKey);
  const wrap = document.createElement('div');
  wrap.className = 'structured-list';
  let values = Array.isArray(cfg.values) ? cfg.values.map((v) => normalizeConfigToken(v)).filter(Boolean) : [];
  if (values.length === 0) values = [''];
  const rerender = () => {
    wrap.innerHTML = '';
    values.forEach((value, idx) => {
      const line = document.createElement('div');
      line.className = 'kv-row compact';
      const opts = options.slice();
      if (value && !opts.some((opt) => normalizeConfigToken(opt.value) === value)) {
        opts.unshift({ value, label: value, entry: null });
      }
      const picker = createReferencePicker({
        options: opts,
        targetTabKey: tabKey,
        currentValue: value || '-1',
        searchPlaceholder: `Search ${toFriendlyKey(tabKey).replace(/s$/, '')}...`,
        noneLabel: '(none)',
        onSelect: (next) => {
          const normalized = normalizeConfigToken(next);
          values[idx] = normalized === '-1' ? '' : normalized;
          if (onValuesChange) onValuesChange(values.filter(Boolean));
          rerender();
        }
      });
      line.appendChild(picker);
      const del = document.createElement('button');
      del.type = 'button';
      withRemoveIcon(del, ' Remove');
      del.addEventListener('click', () => {
        values.splice(idx, 1);
        if (values.length === 0) values.push('');
        if (onValuesChange) onValuesChange(values.filter(Boolean));
        rerender();
      });
      line.appendChild(del);
      wrap.appendChild(line);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Add Item';
    add.addEventListener('click', () => {
      values.push('');
      if (onValuesChange) onValuesChange(values.filter(Boolean));
      rerender();
    });
    wrap.appendChild(add);
  };
  rerender();
  return wrap;
}

function makeNamedListTokenEditor(config) {
  const cfg = config || {};
  const tabKey = String(cfg.tabKey || '').trim();
  const onValuesChange = typeof cfg.onValuesChange === 'function' ? cfg.onValuesChange : null;
  const options = Array.isArray(cfg.options) ? cfg.options : getNamedReferenceOptionsForTab(tabKey);
  const wrap = document.createElement('div');
  wrap.className = 'structured-list';

  const optionByValue = new Map();
  const normalizedOptions = options.map((opt) => {
    const value = normalizeConfigToken(opt && opt.value);
    const label = String((opt && opt.label) || value);
    const entry = opt && opt.entry ? opt.entry : null;
    const normalized = { value, label, entry };
    optionByValue.set(value, normalized);
    return normalized;
  }).filter((opt) => !!opt.value);

  let values = Array.from(new Set((Array.isArray(cfg.values) ? cfg.values : []).map((v) => normalizeConfigToken(v)).filter(Boolean)));

  const chips = document.createElement('div');
  chips.className = 'segmented-multi-list';

  const emit = () => {
    if (onValuesChange) onValuesChange(values.slice());
  };

  const rerenderChips = () => {
    chips.innerHTML = '';
    if (values.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'field-meta';
      hint.textContent = '(none)';
      chips.appendChild(hint);
      return;
    }
    values.forEach((value) => {
      const opt = optionByValue.get(value);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segmented-multi-btn active';
      const text = document.createElement('span');
      text.textContent = opt ? opt.label : value;
      btn.appendChild(text);
      btn.title = 'Remove';
      btn.addEventListener('click', () => {
        values = values.filter((v) => v !== value);
        rerenderChips();
        emit();
      });
      chips.appendChild(btn);
    });
  };

  const picker = createReferencePicker({
    options: normalizedOptions,
    targetTabKey: tabKey,
    currentValue: '-1',
    searchPlaceholder: `Add ${toFriendlyKey(tabKey).replace(/s$/, '')}...`,
    noneLabel: 'Add item...',
    onSelect: (next) => {
      const normalized = normalizeConfigToken(next);
      if (!normalized || normalized === '-1') return;
      if (!values.includes(normalized)) {
        values.push(normalized);
        rerenderChips();
        emit();
      }
    }
  });
  wrap.appendChild(picker);
  wrap.appendChild(chips);
  rerenderChips();
  return wrap;
}

function makeInputForBaseRow(row, onChange) {
  if (row.key === 'limit_units_per_tile') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    const raw = String(row.value || '').trim();

    const MODE_OPTIONS = ['false', 'single', 'triple'];
    const MODE_LABELS = {
      false: 'No Limit',
      single: 'Single Value',
      triple: 'Land / Sea / Air'
    };
    let modeValue = 'false';

    const inputA = document.createElement('input');
    inputA.placeholder = 'value';
    const inputB = document.createElement('input');
    inputB.placeholder = 'land';
    const inputC = document.createElement('input');
    inputC.placeholder = 'sea';
    const inputD = document.createElement('input');
    inputD.placeholder = 'air';

    if (raw.startsWith('[') && raw.endsWith(']')) {
      modeValue = 'triple';
      const tokens = raw.slice(1, -1).trim().split(/\s+/);
      inputB.value = tokens[0] || '';
      inputC.value = tokens[1] || '';
      inputD.value = tokens[2] || '';
    } else if (raw === 'false' || raw === '') {
      modeValue = 'false';
    } else {
      modeValue = 'single';
      inputA.value = raw;
    }

    const recalc = () => {
      if (modeValue === 'false') onChange('false');
      else if (modeValue === 'single') onChange(String(inputA.value || '').trim());
      else onChange(`[${String(inputB.value || '').trim()} ${String(inputC.value || '').trim()} ${String(inputD.value || '').trim()}]`);
      rerender();
    };

    const rerender = () => {
      wrap.innerHTML = '';
      const segmented = makeSegmentedChoiceControl(MODE_OPTIONS, modeValue, (next) => {
        modeValue = String(next || '').trim();
        recalc();
      });
      const buttons = Array.from(segmented.querySelectorAll('.segmented-control-btn'));
      buttons.forEach((btn) => {
        const key = String(btn.textContent || '').trim();
        if (MODE_LABELS[key]) btn.textContent = MODE_LABELS[key];
      });
      wrap.appendChild(segmented);
      if (modeValue === 'single') wrap.appendChild(inputA);
      if (modeValue === 'triple') {
        const rowWrap = document.createElement('div');
        rowWrap.className = 'kv-row';
        rowWrap.appendChild(inputB);
        rowWrap.appendChild(inputC);
        rowWrap.appendChild(inputD);
        wrap.appendChild(rowWrap);
      }
    };

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

  if (BASE_REFERENCE_LIST_TAB_BY_KEY[row.key]) {
    const refTabKey = BASE_REFERENCE_LIST_TAB_BY_KEY[row.key];
    const initial = parseStructuredEntries(row.value);
    const editor = makeNamedListPickerEditor({
      tabKey: refTabKey,
      values: initial,
      onValuesChange: (values) => onChange(serializeQuotedStructuredEntries(values))
    });
    return editor;
  }

  if (row.key === 'unit_limits') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseNameAmountItems(row.value);
    if (items.length === 0) items = [{ name: '', amount: '' }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const block = document.createElement('div');
        block.className = 'structured-card';
        const unitOpts = getNamedReferenceOptionsForTab('units');
        if (item.name && !unitOpts.some((opt) => opt.value === item.name)) {
          unitOpts.unshift({ value: item.name, label: item.name, entry: null });
        }
        const unitPicker = createReferencePicker({
          options: unitOpts,
          targetTabKey: 'units',
          currentValue: item.name || '-1',
          searchPlaceholder: 'Search Unit...',
          noneLabel: '(none)',
          onSelect: (next) => {
            const normalized = String(next || '').trim();
            items[idx].name = normalized === '-1' ? '' : normalized;
            onChange(serializeNameAmountItems(items));
            rerender();
          }
        });
        block.appendChild(unitPicker);
        const formula = document.createElement('input');
        formula.placeholder = 'Limit formula (e.g. 3, 1 per-city, 5 + 2 per-city)';
        formula.value = item.amount;
        formula.addEventListener('input', () => {
          items[idx].amount = formula.value;
          onChange(serializeNameAmountItems(items));
        });
        block.appendChild(formula);
        const del = document.createElement('button');
        del.type = 'button';
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ name: '', amount: '' });
          onChange(serializeNameAmountItems(items));
          rerender();
        });
        block.appendChild(del);
        wrap.appendChild(block);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ name: '', amount: '' });
        rerender();
      });
      wrap.appendChild(add);
    };
    rerender();
    return wrap;
  }

  if (row.key === 'civ_aliases_by_era') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseCivAliasesByEra(row.value);
    if (items.length === 0) items = [{ source: '', replacements: ['', '', '', ''] }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const block = document.createElement('div');
        block.className = 'structured-card';
        const civSuggestions = getCivilizationNameSuggestions();
        const source = document.createElement('input');
        source.placeholder = 'Original civ name/adjective';
        source.value = item.source || '';
        source.addEventListener('input', () => {
          items[idx].source = source.value;
          onChange(serializeCivAliasesByEra(items));
        });
        block.appendChild(source);
        const sourceDl = attachSuggestions(source, civSuggestions);
        if (sourceDl) block.appendChild(sourceDl);
        const grid = document.createElement('div');
        grid.className = 'kv-grid';
        const repls = Array.isArray(item.replacements) ? item.replacements.slice(0, 4) : [];
        while (repls.length < 4) repls.push('');
        repls.forEach((rep, eraIdx) => {
          const era = document.createElement('input');
          era.placeholder = `Era ${eraIdx + 1} replacement`;
          era.value = rep;
          era.addEventListener('input', () => {
            if (!Array.isArray(items[idx].replacements)) items[idx].replacements = ['', '', '', ''];
            items[idx].replacements[eraIdx] = era.value;
            onChange(serializeCivAliasesByEra(items));
          });
          grid.appendChild(era);
          const eraDl = attachSuggestions(era, civSuggestions);
          if (eraDl) grid.appendChild(eraDl);
        });
        block.appendChild(grid);
        const del = document.createElement('button');
        del.type = 'button';
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ source: '', replacements: ['', '', '', ''] });
          onChange(serializeCivAliasesByEra(items));
          rerender();
        });
        block.appendChild(del);
        wrap.appendChild(block);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ source: '', replacements: ['', '', '', ''] });
        rerender();
      });
      wrap.appendChild(add);
    };
    rerender();
    return wrap;
  }

  if (row.key === 'leader_aliases_by_era') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseLeaderAliasesByEra(row.value);
    if (items.length === 0) items = [{ source: '', replacements: [{ name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }] }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const block = document.createElement('div');
        block.className = 'structured-card';
        const leaderSuggestions = getLeaderNameSuggestions();
        const source = document.createElement('input');
        source.placeholder = 'Original leader name';
        source.value = item.source || '';
        source.addEventListener('input', () => {
          items[idx].source = source.value;
          onChange(serializeLeaderAliasesByEra(items));
        });
        block.appendChild(source);
        const sourceDl = attachSuggestions(source, leaderSuggestions);
        if (sourceDl) block.appendChild(sourceDl);
        const repWrap = document.createElement('div');
        repWrap.className = 'structured-list';
        let reps = Array.isArray(item.replacements) ? item.replacements.slice(0, 4) : [];
        while (reps.length < 4) reps.push({ name: '', gender: '', title: '' });
        reps.forEach((rep, eraIdx) => {
          const rowWrap = document.createElement('div');
          rowWrap.className = 'kv-row';
          const name = document.createElement('input');
          name.placeholder = `Era ${eraIdx + 1} leader`;
          name.value = String(rep && rep.name || '');
          name.addEventListener('input', () => {
            if (!Array.isArray(items[idx].replacements)) items[idx].replacements = [];
            if (!items[idx].replacements[eraIdx]) items[idx].replacements[eraIdx] = { name: '', gender: '', title: '' };
            items[idx].replacements[eraIdx].name = name.value;
            onChange(serializeLeaderAliasesByEra(items));
          });
          rowWrap.appendChild(name);
          const nameDl = attachSuggestions(name, leaderSuggestions);
          if (nameDl) rowWrap.appendChild(nameDl);
          const gender = document.createElement('select');
          ['', 'M', 'F'].forEach((opt) => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt ? opt : 'Gender';
            gender.appendChild(o);
          });
          gender.value = String(rep && rep.gender || '').toUpperCase();
          gender.addEventListener('change', () => {
            if (!Array.isArray(items[idx].replacements)) items[idx].replacements = [];
            if (!items[idx].replacements[eraIdx]) items[idx].replacements[eraIdx] = { name: '', gender: '', title: '' };
            items[idx].replacements[eraIdx].gender = gender.value;
            onChange(serializeLeaderAliasesByEra(items));
          });
          rowWrap.appendChild(gender);
          const title = document.createElement('input');
          title.placeholder = 'Title (optional)';
          title.value = String(rep && rep.title || '');
          title.addEventListener('input', () => {
            if (!Array.isArray(items[idx].replacements)) items[idx].replacements = [];
            if (!items[idx].replacements[eraIdx]) items[idx].replacements[eraIdx] = { name: '', gender: '', title: '' };
            items[idx].replacements[eraIdx].title = title.value;
            onChange(serializeLeaderAliasesByEra(items));
          });
          rowWrap.appendChild(title);
          repWrap.appendChild(rowWrap);
        });
        block.appendChild(repWrap);
        const del = document.createElement('button');
        del.type = 'button';
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ source: '', replacements: [{ name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }] });
          onChange(serializeLeaderAliasesByEra(items));
          rerender();
        });
        block.appendChild(del);
        wrap.appendChild(block);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ source: '', replacements: [{ name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }, { name: '', gender: '', title: '' }] });
        rerender();
      });
      wrap.appendChild(add);
    };
    rerender();
    return wrap;
  }

  if (BASE_MULTI_CHOICE_LIST_OPTIONS[row.key]) {
    const wrap = document.createElement('div');
    wrap.className = 'segmented-multi-list';
    const options = BASE_MULTI_CHOICE_LIST_OPTIONS[row.key];
    const normalizedOptions = options.map((opt) => String(opt || '').trim().toLowerCase()).filter(Boolean);
    const parsed = parseBracketedOptionTokens(row.value).map((v) => String(v || '').trim().toLowerCase()).filter(Boolean);
    const selected = new Set(parsed.filter((token) => normalizedOptions.includes(token)));
    const sourceMisconfigured = parsed.length > 0 && selected.size === 0;
    if (!sourceMisconfigured && selected.size === 0 && normalizedOptions.length > 0) {
      if (normalizedOptions.includes('all')) selected.add('all');
      else selected.add(normalizedOptions[0]);
    }
    options.forEach((opt) => {
      const token = String(opt || '').trim();
      const key = token.toLowerCase();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segmented-multi-btn';
      btn.textContent = token;
      btn.classList.toggle('active', selected.has(key));
      btn.addEventListener('click', () => {
        if (selected.has(key)) {
          if (selected.size <= 1) return;
          selected.delete(key);
        } else selected.add(key);
        btn.classList.toggle('active', selected.has(key));
        const ordered = options.filter((x) => selected.has(String(x || '').trim().toLowerCase()));
        onChange(serializeStructuredEntries(ordered));
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  if (row.key === 'production_perfume' || row.key === 'perfume_specs' || row.key === 'technology_perfume' || row.key === 'government_perfume') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    const improvementOptions = getNamedReferenceOptionsForTab('improvements');
    const unitOptions = getNamedReferenceOptionsForTab('units');
    const techOptions = getNamedReferenceOptionsForTab('technologies');
    const govOptions = getNamedReferenceOptionsForTab('governments');
    const inferProductionKind = (name) => {
      const n = String(name || '').trim();
      if (!n) return 'improvements';
      if (improvementOptions.some((o) => o.value === n)) return 'improvements';
      if (unitOptions.some((o) => o.value === n)) return 'units';
      return 'custom';
    };
    let items = parseNameAmountItems(row.value).map((item) => {
      const kind = row.key === 'technology_perfume'
        ? 'technologies'
        : row.key === 'government_perfume'
          ? 'governments'
          : inferProductionKind(item.name);
      return { name: String(item.name || ''), amount: String(item.amount || ''), kind };
    });
    if (items.length === 0) items = [{ name: '', amount: '' }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const line = document.createElement('div');
        line.className = 'structured-card';
        const rowTop = document.createElement('div');
        rowTop.className = 'kv-row';
        if (row.key === 'production_perfume' || row.key === 'perfume_specs') {
          const kindSelect = document.createElement('select');
          [
            { value: 'improvements', label: 'Improvement' },
            { value: 'units', label: 'Unit' },
            { value: 'custom', label: 'Custom' }
          ].forEach((opt) => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            kindSelect.appendChild(o);
          });
          kindSelect.value = item.kind || inferProductionKind(item.name);
          kindSelect.addEventListener('change', () => {
            items[idx].kind = kindSelect.value;
            if (items[idx].kind !== 'custom' && items[idx].name === '-1') items[idx].name = '';
            onChange(serializeNameAmountItems(items));
            rerender();
          });
          rowTop.appendChild(kindSelect);
        }
        const targetKind = row.key === 'technology_perfume'
          ? 'technologies'
          : row.key === 'government_perfume'
            ? 'governments'
            : (item.kind || inferProductionKind(item.name));
        if (targetKind === 'custom') {
          const name = document.createElement('input');
          name.placeholder = 'Name';
          name.value = item.name;
          name.addEventListener('input', () => {
            items[idx].name = name.value;
            onChange(serializeNameAmountItems(items));
          });
          rowTop.appendChild(name);
        } else {
          const pickerOptions = targetKind === 'units'
            ? unitOptions
            : targetKind === 'technologies'
              ? techOptions
              : targetKind === 'governments'
                ? govOptions
                : improvementOptions;
          const pickerTab = targetKind;
          const opts = pickerOptions.slice();
          if (item.name && !opts.some((opt) => opt.value === item.name)) {
            opts.unshift({ value: item.name, label: item.name, entry: null });
          }
          const picker = createReferencePicker({
            options: opts,
            targetTabKey: pickerTab,
            currentValue: item.name || '-1',
            searchPlaceholder: `Search ${toFriendlyKey(pickerTab).replace(/s$/, '')}...`,
            noneLabel: '(none)',
            onSelect: (next) => {
              const normalized = String(next || '').trim();
              items[idx].name = normalized === '-1' ? '' : normalized;
              onChange(serializeNameAmountItems(items));
              rerender();
            }
          });
          rowTop.appendChild(picker);
        }
        const amount = document.createElement('input');
        amount.placeholder = 'amount (e.g. 20 or -50%)';
        amount.value = item.amount;
        amount.addEventListener('input', () => {
          items[idx].amount = amount.value;
          onChange(serializeNameAmountItems(items));
        });
        rowTop.appendChild(amount);
        const del = document.createElement('button');
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ name: '', amount: '', kind: 'improvements' });
          onChange(serializeNameAmountItems(items));
          rerender();
        });
        rowTop.appendChild(del);
        line.appendChild(rowTop);
        wrap.appendChild(line);
      });
      const add = document.createElement('button');
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        const nextKind = row.key === 'technology_perfume'
          ? 'technologies'
          : row.key === 'government_perfume'
            ? 'governments'
            : 'improvements';
        items.push({ name: '', amount: '', kind: nextKind });
        rerender();
      });
      wrap.appendChild(add);
    };
    rerender();
    return wrap;
  }

  if (row.key === 'work_area_improvements') {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';
    let items = parseNameAmountItems(row.value);
    if (items.length === 0) items = [{ name: '', amount: '' }];
    const rerender = () => {
      wrap.innerHTML = '';
      items.forEach((item, idx) => {
        const line = document.createElement('div');
        line.className = 'structured-card';
        const buildingOpts = getNamedReferenceOptionsForTab('improvements');
        if (item.name && !buildingOpts.some((opt) => opt.value === item.name)) {
          buildingOpts.unshift({ value: item.name, label: item.name, entry: null });
        }
        const buildingPicker = createReferencePicker({
          options: buildingOpts,
          targetTabKey: 'improvements',
          currentValue: item.name || '-1',
          searchPlaceholder: 'Search Improvement...',
          noneLabel: '(none)',
          onSelect: (next) => {
            const normalized = String(next || '').trim();
            items[idx].name = normalized === '-1' ? '' : normalized;
            onChange(serializeNameAmountItems(items));
            rerender();
          }
        });
        line.appendChild(buildingPicker);
        const amount = document.createElement('input');
        amount.placeholder = 'radius / bonus (e.g. 3 or 2 extra)';
        amount.value = item.amount;
        amount.addEventListener('input', () => {
          items[idx].amount = amount.value;
          onChange(serializeNameAmountItems(items));
        });
        line.appendChild(amount);
        const del = document.createElement('button');
        del.type = 'button';
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ name: '', amount: '' });
          onChange(serializeNameAmountItems(items));
          rerender();
        });
        line.appendChild(del);
        wrap.appendChild(line);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        items.push({ name: '', amount: '' });
        rerender();
      });
      wrap.appendChild(add);
    };
    rerender();
    return wrap;
  }

  if (row.key === 'great_wall_auto_build_wonder_name') {
    const normalizedCurrent = normalizeConfigToken(row.value);
    const normalizeWonderLookup = (value) => normalizeConfigToken(value).toLowerCase().replace(/^the\s+/i, '').replace(/\s+/g, ' ').trim();
    const currentLookup = normalizeWonderLookup(normalizedCurrent);
    const wonderOpts = getFilteredImprovementOptions(['wonder']);
    const matched = currentLookup
      ? wonderOpts.find((opt) => normalizeWonderLookup(opt.value) === currentLookup)
      : null;
    if (normalizedCurrent && !matched) {
      wonderOpts.unshift({ value: normalizedCurrent, label: normalizedCurrent, entry: null });
    }
    return createReferencePicker({
      options: wonderOpts,
      targetTabKey: 'improvements',
      currentValue: (matched && matched.value) || normalizedCurrent || '-1',
      searchPlaceholder: 'Search Wonder...',
      noneLabel: '(none)',
      onSelect: (next) => {
        const normalized = String(next || '').trim();
        onChange(normalized === '-1' ? '' : quoteConfigToken(normalized));
      }
    });
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
        const buildingOpts = getNamedReferenceOptionsForTab('improvements');
        if (item.building && !buildingOpts.some((opt) => opt.value === item.building)) {
          buildingOpts.unshift({ value: item.building, label: item.building, entry: null });
        }
        const buildingPicker = createReferencePicker({
          options: buildingOpts,
          targetTabKey: 'improvements',
          currentValue: item.building || '-1',
          searchPlaceholder: 'Search Building...',
          noneLabel: '(none)',
          onSelect: (next) => {
            const normalized = String(next || '').trim();
            items[idx].building = normalized === '-1' ? '' : normalized;
            onChange(serializeBuildingPrereqItems(items));
            rerender();
          }
        });
        block.appendChild(buildingPicker);
        const unitsEditor = makeNamedListPickerEditor({
          tabKey: 'units',
          values: Array.isArray(item.units) ? item.units : [],
          onValuesChange: (nextValues) => {
            items[idx].units = nextValues;
            onChange(serializeBuildingPrereqItems(items));
          }
        });
        block.appendChild(unitsEditor);
        const del = document.createElement('button');
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          if (items.length === 0) items.push({ building: '', units: [] });
          onChange(serializeBuildingPrereqItems(items));
          rerender();
        });
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

        const buildingOpts = getNamedReferenceOptionsForTab('improvements');
        if (item.building && !buildingOpts.some((opt) => opt.value === item.building)) {
          buildingOpts.unshift({ value: item.building, label: item.building, entry: null });
        }
        const buildingPicker = createReferencePicker({
          options: buildingOpts,
          targetTabKey: 'improvements',
          currentValue: item.building || '-1',
          searchPlaceholder: 'Search Building...',
          noneLabel: '(none)',
          onSelect: (next) => {
            const normalized = String(next || '').trim();
            items[idx].building = normalized === '-1' ? '' : normalized;
            onChange(serializeBuildingResourceItems(items));
            rerender();
          }
        });
        block.appendChild(buildingPicker);

        const resourceOpts = getNamedReferenceOptionsForTab('resources');
        if (item.resource && !resourceOpts.some((opt) => opt.value === item.resource)) {
          resourceOpts.unshift({ value: item.resource, label: item.resource, entry: null });
        }
        const resourcePicker = createReferencePicker({
          options: resourceOpts,
          targetTabKey: 'resources',
          currentValue: item.resource || '-1',
          searchPlaceholder: 'Search Resource...',
          noneLabel: '(none)',
          onSelect: (next) => {
            const normalized = String(next || '').trim();
            items[idx].resource = normalized === '-1' ? '' : normalized;
            onChange(serializeBuildingResourceItems(items));
            rerender();
          }
        });
        block.appendChild(resourcePicker);

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

  if (BASE_SEGMENTED_OPTIONS[row.key]) {
    return makeSegmentedChoiceControl(BASE_SEGMENTED_OPTIONS[row.key], row.value, (next) => onChange(next));
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
  const cleanTabs = getCleanTabsObject();
  const cleanBaseTab = cleanTabs && cleanTabs.base && Array.isArray(cleanTabs.base.rows) ? cleanTabs.base : null;
  const cleanValueByKey = new Map(
    (cleanBaseTab && Array.isArray(cleanBaseTab.rows) ? cleanBaseTab.rows : [])
      .map((row) => [String(row && row.key || ''), String(row && row.value || '')])
  );
  const initialValueByKey = new Map(
    (tab && Array.isArray(tab.rows) ? tab.rows : [])
      .map((row) => [String(row && row.key || ''), String(row && row.value || '')])
  );
  const activeOverrideSource = isScenarioMode() ? 'scenario' : 'custom';
  const isBaseRowDirty = (row) => {
    const key = String(row && row.key || '');
    if (!key) return false;
    if (cleanValueByKey.has(key)) {
      return String(row && row.value || '') !== String(cleanValueByKey.get(key) || '');
    }
    if (initialValueByKey.has(key)) {
      return String(row && row.value || '') !== String(initialValueByKey.get(key) || '');
    }
    return false;
  };
  const getDisplaySourceKey = (row) => {
    const dirty = isBaseRowDirty(row);
    if (dirty) return activeOverrideSource;
    return String(row && row.source || '').trim().toLowerCase();
  };

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS.base));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">editing: ${getActiveBaseTargetName()}</span>`);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = 'C3X core settings for this mode. default.c3x_config.ini is read-only; save writes only overrides to the active file.';
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
    const keyHead = document.createElement('div');
    keyHead.className = 'base-key-head';
    const keyName = document.createElement('span');
    keyName.textContent = toFriendlyKey(row.key);
    keyHead.appendChild(keyName);
    const dirtyBadge = document.createElement('span');
    dirtyBadge.className = 'base-dirty-badge';
    dirtyBadge.textContent = '•';
    dirtyBadge.title = 'Unsaved change';
    dirtyBadge.classList.toggle('hidden', !isBaseRowDirty(row));
    keyHead.appendChild(dirtyBadge);
    const releaseInfo = getC3xReleaseInfo(row.key);
    const releaseBadge = document.createElement('span');
    releaseBadge.className = `c3x-release-badge ${releaseInfo.confidence}`;
    releaseBadge.textContent = releaseInfo.label;
    releaseBadge.title = `${releaseInfo.note}\nField: ${row.key}`;
    releaseBadge.classList.toggle('hidden', releaseInfo.label === 'R1');
    keyHead.appendChild(releaseBadge);
    const sourceBadge = document.createElement('span');
    const refreshSourceBadge = () => {
      const sourceKey = getDisplaySourceKey(row);
      sourceBadge.className = `c3x-source-pill source-${sourceKey || 'unknown'}`;
      sourceBadge.textContent = sourceKey || 'unknown';
      sourceBadge.classList.toggle('hidden', sourceKey === 'default' || !sourceKey || sourceKey === 'unknown');
      if (sourceKey === 'custom') sourceBadge.title = 'Value shown from custom.c3x_config.ini';
      else if (sourceKey === 'scenario') sourceBadge.title = 'Value shown from scenario.c3x_config.ini';
      else sourceBadge.title = `Value shown from ${getBaseFieldSource(row)}`;
    };
    refreshSourceBadge();
    keyHead.appendChild(sourceBadge);
    keyTitle.appendChild(keyHead);
    keyWrap.appendChild(keyTitle);
    keyWrap.appendChild(createBaseMeta(row, tab.fieldDocs));

    r.appendChild(keyWrap);

    const input = makeInputForBaseRow(row, (newValue) => {
      rememberUndoSnapshot();
      row.value = String(newValue);
      dirtyBadge.classList.toggle('hidden', !isBaseRowDirty(row));
      refreshSourceBadge();
      setDirty(true);
    });
    if (row.type === 'boolean' && input instanceof Element) {
      const check = input.querySelector('input[type="checkbox"]');
      if (check) enableBooleanRowToggle(r, check);
    }
    r.appendChild(input);

    const groupInfo = groups.get(sectionName);
    groupInfo.rowsWrap.appendChild(r);
    groupInfo.rowCount += 1;
    const rawKey = String(row && row.key || '').trim();
    const friendlyName = toFriendlyKey(rawKey);
    const docs = String((tab.fieldDocs && tab.fieldDocs[rawKey]) || '').trim();
    const searchText = `${rawKey} ${friendlyName} ${docs}`.toLowerCase();
    rowElements.push({ key: rawKey.toLowerCase(), searchText, el: r, group: groupInfo.group });
  }

  const applyFilter = () => {
    const needle = filterInput.value.trim().toLowerCase();
    state.baseFilter = filterInput.value;
    rowElements.forEach((entry) => {
      const hay = String(entry.searchText || entry.key || '');
      entry.el.style.display = !needle || hay.includes(needle) ? '' : 'none';
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
  const customW = parseConfigInteger(getFieldValue(section, 'custom_width'), NaN);
  const customH = parseConfigInteger(getFieldValue(section, 'custom_height'), NaN);
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

const NATURAL_WONDER_ANIMATION_SPEC_ALIASES = new Map([
  ['ini', 'ini'],
  ['ini_path', 'ini'],
  ['frame_time_seconds', 'frame_time_seconds'],
  ['frame_time', 'frame_time_seconds'],
  ['x_offset', 'x_offset'],
  ['y_offset', 'y_offset'],
  ['offsets', 'offsets'],
  ['direction', 'direction'],
  ['hours', 'show_in_day_night_hours'],
  ['show_in_day_night_hours', 'show_in_day_night_hours'],
  ['day_night_hours', 'show_in_day_night_hours'],
  ['show_in_seasons', 'show_in_seasons'],
  ['seasons', 'show_in_seasons']
]);

function parseNaturalWonderAnimationSpec(spec) {
  const parsed = {
    ini: '',
    frame_time_seconds: '',
    x_offset: '',
    y_offset: '',
    direction: '',
    show_in_day_night_hours: '',
    show_in_seasons: '',
    extras: []
  };
  const chunks = String(spec || '')
    .split(';')
    .map((chunk) => String(chunk || '').trim())
    .filter(Boolean);
  chunks.forEach((chunk) => {
    const match = chunk.match(/^([^:=]+)\s*[:=]\s*(.*)$/);
    const rawKey = match ? String(match[1] || '').trim() : '';
    const rawValue = match ? String(match[2] || '').trim() : String(chunk || '').trim();
    const normalizedKey = normalizeConfigToken(rawKey).toLowerCase();
    const knownKey = NATURAL_WONDER_ANIMATION_SPEC_ALIASES.get(normalizedKey);
    const value = rawValue.replace(/^"(.*)"$/, '$1').trim();
    if (knownKey === 'offsets') {
      const offsetMatch = value.match(/^\s*(-?\d+)\s*,\s*(-?\d+)\s*$/);
      if (offsetMatch) {
        parsed.x_offset = offsetMatch[1];
        parsed.y_offset = offsetMatch[2];
      } else {
        parsed.extras.push({ key: rawKey || '', value });
      }
      return;
    }
    if (knownKey) {
      parsed[knownKey] = value;
      return;
    }
    if (!match && !parsed.ini) {
      parsed.ini = value;
      return;
    }
    parsed.extras.push({
      key: rawKey || '',
      value
    });
  });
  return parsed;
}

function serializeNaturalWonderAnimationSpec(spec) {
  const source = spec && typeof spec === 'object' ? spec : {};
  const parts = [];
  const pushIf = (key, value) => {
    const clean = String(value || '').trim();
    if (!clean) return;
    parts.push(`${key}=${clean}`);
  };
  pushIf('ini', source.ini);
  pushIf('frame_time_seconds', source.frame_time_seconds);
  pushIf('x_offset', source.x_offset);
  pushIf('y_offset', source.y_offset);
  pushIf('direction', source.direction);
  pushIf('show_in_day_night_hours', source.show_in_day_night_hours);
  pushIf('show_in_seasons', source.show_in_seasons);
  const extras = Array.isArray(source.extras) ? source.extras : [];
  extras.forEach((extra) => {
    const key = String(extra && extra.key || '').trim();
    const value = String(extra && extra.value || '').trim();
    if (!key || !value) return;
    parts.push(`${key}=${value}`);
  });
  return parts.join('; ');
}

function parseDayNightHoursSpec(text) {
  const selected = new Set();
  const tokens = String(text || '').split(',').map((part) => String(part || '').trim()).filter(Boolean);
  tokens.forEach((token) => {
    const range = token.match(/^(-?\d+)\s*-\s*(-?\d+)$/);
    if (range) {
      let start = Number.parseInt(range[1], 10);
      let end = Number.parseInt(range[2], 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return;
      start = ((start % 24) + 24) % 24;
      end = ((end % 24) + 24) % 24;
      if (start <= end) {
        for (let h = start; h <= end; h += 1) selected.add(h);
      } else {
        for (let h = start; h < 24; h += 1) selected.add(h);
        for (let h = 0; h <= end; h += 1) selected.add(h);
      }
      return;
    }
    const value = Number.parseInt(token, 10);
    if (!Number.isFinite(value)) return;
    selected.add(((value % 24) + 24) % 24);
  });
  return Array.from(selected).sort((a, b) => a - b);
}

function serializeDayNightHoursSpec(hours) {
  const list = Array.isArray(hours) ? hours : [];
  const unique = Array.from(new Set(list.map((h) => Number.parseInt(h, 10)).filter((h) => Number.isFinite(h) && h >= 0 && h <= 23))).sort((a, b) => a - b);
  if (unique.length === 0) return '';
  const ranges = [];
  let start = unique[0];
  let prev = unique[0];
  for (let i = 1; i < unique.length; i += 1) {
    const cur = unique[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push(start === prev ? String(start) : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  ranges.push(start === prev ? String(start) : `${start}-${prev}`);
  return ranges.join(', ');
}

function getNaturalWonderAnimationIniPath(spec) {
  const parsed = parseNaturalWonderAnimationSpec(spec);
  return String(parsed.ini || '').trim();
}

function syncNaturalWonderAnimationDirections(section) {
  const adjacencyDirection = String(getFieldValue(section, 'adjacency_dir') || '').trim();
  const specs = getFieldValuesRaw(section, 'animation');
  if (!adjacencyDirection || specs.length === 0) return;
  const nextSpecs = specs
    .map((raw) => {
      const parsed = parseNaturalWonderAnimationSpec(raw);
      parsed.direction = adjacencyDirection;
      return serializeNaturalWonderAnimationSpec(parsed);
    })
    .map((raw) => String(raw || '').trim())
    .filter(Boolean);
  setMultiFieldValues(section, 'animation', nextSpecs);
}

function parseFrameSecondsFromSpec(spec) {
  const parsed = parseNaturalWonderAnimationSpec(spec);
  const v = Number.parseFloat(parsed.frame_time_seconds);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

function getPreviewDelayMs(tabKey, section, title) {
  if (tabKey === 'animations' && title === 'Animation FLC') {
    const seconds = Number.parseFloat(getFieldValue(section, 'frame_time_seconds'));
    if (Number.isFinite(seconds) && seconds > 0) return Math.max(16, Math.round(seconds * 1000));
  }
  if (tabKey === 'naturalWonders' && title === 'Animation') {
    const spec = getFieldValuesRaw(section, 'animation').find((item) => getNaturalWonderAnimationIniPath(item)) || '';
    const seconds = parseFrameSecondsFromSpec(spec);
    if (seconds) return Math.max(16, Math.round(seconds * 1000));
  }
  return 100;
}

function renderRgbaPreview(container, preview, title, delayMsProvider, displayWidth = null, options = null) {
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
  if (options && options.softBlueFrame) {
    const frame = document.createElement('div');
    frame.className = 'section-art-soft-frame';
    frame.appendChild(canvas);
    card.appendChild(frame);
  } else {
    card.appendChild(canvas);
  }

  const meta = document.createElement('div');
  meta.className = 'preview-meta';
  const motion = preview.animated ? 'animated' : 'static';
  meta.textContent = `${preview.width}x${preview.height} - ${motion} - ${preview.sourcePath.split(/[\\\\/]/).pop()}`;
  card.appendChild(meta);
  container.appendChild(card);

  if (preview.animated && Array.isArray(preview.framesBase64) && preview.framesBase64.length > 0) {
    const onLoopStart = options && typeof options.onLoopStart === 'function' ? options.onLoopStart : null;
    const isPaused = options && typeof options.isPausedProvider === 'function'
      ? options.isPausedProvider
      : () => false;
    const maxFramesForRender = Number.isFinite(options && options.sampleMaxFrames)
      ? Math.max(0, Number(options.sampleMaxFrames))
      : getDefaultFrameSampleLimit();
    const sampledFrames = (maxFramesForRender > 0 && preview.framesBase64.length > maxFramesForRender)
      ? preview.framesBase64.filter((_f, idx) => (idx % Math.ceil(preview.framesBase64.length / maxFramesForRender)) === 0)
      : preview.framesBase64;
    const frames = [];
    const frameRunLengths = [];
    let prevB64 = null;
    sampledFrames.forEach((b64) => {
      if (prevB64 != null && b64 === prevB64 && frameRunLengths.length > 0) {
        frameRunLengths[frameRunLengths.length - 1] += 1;
      } else {
        frames.push(new ImageData(new Uint8ClampedArray(fromBase64ToUint8(b64)), preview.width, preview.height));
        frameRunLengths.push(1);
        prevB64 = b64;
      }
    });
    const isMagentaOrTransparentFrame = (imageData) => {
      const data = imageData && imageData.data;
      if (!data) return false;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b2 = data[i + 2];
        const a = data[i + 3];
        if (a === 0) continue;
        if (r === 255 && g === 0 && b2 === 255) continue;
        return false;
      }
      return true;
    };
    let skippedBlankFrames = 0;
    if (options && options.skipBlankMagentaFrames) {
      const keptFrames = [];
      const keptRuns = [];
      for (let i = 0; i < frames.length; i += 1) {
        if (isMagentaOrTransparentFrame(frames[i])) {
          skippedBlankFrames += 1;
          continue;
        }
        keptFrames.push(frames[i]);
        keptRuns.push(frameRunLengths[i]);
      }
      if (keptFrames.length > 0) {
        frames.length = 0;
        frameRunLengths.length = 0;
        keptFrames.forEach((f) => frames.push(f));
        keptRuns.forEach((n) => frameRunLengths.push(n));
      }
    }
    if (frames.length === 0) return;
    appendDebugLog('preview:animated:init', {
      title,
      frames: sampledFrames.length,
      uniqueFrames: frames.length,
      skippedBlankFrames,
      w: preview.width,
      h: preview.height,
      sourcePath: preview.sourcePath
    });
    let frameIdx = 0;
    let lastNow = performance.now();
    let accumulatorMs = 0;
    ctx.putImageData(frames[frameIdx], 0, 0);
    if (onLoopStart) onLoopStart();
    const step = () => {
      if (!canvas.isConnected) return;
      const delay = Math.max(16, Number(delayMsProvider ? delayMsProvider() : 100) || 100);
      const now = performance.now();
      if (!isPaused()) {
        const dt = Math.max(0, now - lastNow);
        accumulatorMs += dt;
        let guard = 0;
        let currentFrameDelay = Math.max(16, delay * Math.max(1, frameRunLengths[frameIdx] || 1));
        while (accumulatorMs >= currentFrameDelay && guard < frames.length * 4) {
          accumulatorMs -= currentFrameDelay;
          frameIdx = (frameIdx + 1) % frames.length;
          ctx.putImageData(frames[frameIdx], 0, 0);
          if (frameIdx === 0 && onLoopStart) onLoopStart();
          currentFrameDelay = Math.max(16, delay * Math.max(1, frameRunLengths[frameIdx] || 1));
          guard += 1;
        }
      } else {
        accumulatorMs = 0;
      }
      lastNow = now;
      window.requestAnimationFrame(step);
    };
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
  const previewOptions = (tabKey === 'wonders' || tabKey === 'naturalWonders')
    ? { softBlueFrame: true }
    : null;
  const getPreviewOptionsForTitle = (taskTitle) => {
    if (tabKey === 'naturalWonders' && String(taskTitle || '') === 'Animation') {
      return { ...(previewOptions || {}), skipBlankMagentaFrames: true };
    }
    return previewOptions;
  };
  if (state.previewCache.has(cacheKey)) {
    const cached = state.previewCache.get(cacheKey);
    appendDebugLog('preview:cache-hit', { tabKey, count: cached.length });
    let altWrap = null;
    cached.forEach((p) => {
      const lane = String(p && p.lane || 'base');
      if (tabKey === 'wonders' && lane === 'alt') {
        if (!altWrap) {
          altWrap = document.createElement('div');
          altWrap.className = 'preview-alt-group';
          const altTitle = document.createElement('div');
          altTitle.className = 'preview-alt-group-title';
          altTitle.textContent = 'Alt Direction Art';
          altWrap.appendChild(altTitle);
          previewWrap.appendChild(altWrap);
        }
      }
      renderRgbaPreview(
        (tabKey === 'wonders' && lane === 'alt' && altWrap) ? altWrap : previewWrap,
        p.preview,
        p.title,
        () => getPreviewDelayMs(tabKey, section, p.title),
        p.displayWidth,
        getPreviewOptionsForTitle(p.title)
      );
    });
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
    const fileName = normalizeConfigToken(getFieldValue(section, 'img_path')) || 'Wonders.pcx';
    const row = parseConfigInteger(getFieldValue(section, 'img_row'), 0);
    const col = parseConfigInteger(getFieldValue(section, 'img_column'), 0);
    const crop = getCropDimensions(section, { w: 128, h: 64 });
    tasks.push({
      title: 'Completed Wonder',
      lane: 'base',
      request: {
        kind: 'wonder',
        c3xPath: state.settings.c3xPath,
        fileName,
        crop: { row, col, w: crop.w, h: crop.h }
      }
    });
    const cr = parseConfigInteger(getFieldValue(section, 'img_construct_row'), 0);
    const cc = parseConfigInteger(getFieldValue(section, 'img_construct_column'), 0);
    tasks.push({
      title: 'Construction',
      lane: 'base',
      request: {
        kind: 'wonder',
        c3xPath: state.settings.c3xPath,
        fileName,
        crop: { row: cr, col: cc, w: crop.w, h: crop.h }
      }
    });
    const hasAltEnabled = parseConfigBool(getFieldValue(section, 'enable_img_alt_dir'));
    const hasAltCoords = hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_construct_row'))
      && hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_construct_column'))
      && hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_row'))
      && hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_column'));
    if (hasAltEnabled && hasAltCoords) {
      const altCr = parseConfigInteger(getFieldValue(section, 'img_alt_dir_construct_row'), 0);
      const altCc = parseConfigInteger(getFieldValue(section, 'img_alt_dir_construct_column'), 0);
      tasks.push({
        title: 'Alt Construction',
        lane: 'alt',
        request: {
          kind: 'wonder',
          c3xPath: state.settings.c3xPath,
          fileName,
          crop: { row: altCr, col: altCc, w: crop.w, h: crop.h }
        }
      });
      const altRow = parseConfigInteger(getFieldValue(section, 'img_alt_dir_row'), 0);
      const altCol = parseConfigInteger(getFieldValue(section, 'img_alt_dir_column'), 0);
      tasks.push({
        title: 'Alt Completed Wonder',
        lane: 'alt',
        request: {
          kind: 'wonder',
          c3xPath: state.settings.c3xPath,
          fileName,
          crop: { row: altRow, col: altCol, w: crop.w, h: crop.h }
        }
      });
    }
  } else if (tabKey === 'naturalWonders') {
    const fileName = normalizeConfigToken(getFieldValue(section, 'img_path'));
    const row = parseConfigInteger(getFieldValue(section, 'img_row'), 0);
    const col = parseConfigInteger(getFieldValue(section, 'img_column'), 0);
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
    const firstAnimationSpec = getFieldValuesRaw(section, 'animation').find((spec) => getNaturalWonderAnimationIniPath(spec));
    if (firstAnimationSpec) {
      const iniPath = getNaturalWonderAnimationIniPath(firstAnimationSpec);
      tasks.push({
        title: 'Animation',
        displayWidth: Math.max(120, Math.round(state.previewSize * 0.72)),
        request: { kind: 'animationIni', c3xPath: state.settings.c3xPath, iniPath }
      });
    }
  } else if (tabKey === 'animations') {
    const iniPath = getFieldValue(section, 'ini_path');
    tasks.push({
      title: 'Animation FLC',
      request: { kind: 'animationIni', c3xPath: state.settings.c3xPath, iniPath }
    });
  }

  const resolved = [];
  appendDebugLog('preview:load-start', { tabKey, taskCount: tasks.length });
  let altWrap = null;
  for (const task of tasks) {
    try {
      appendDebugLog('preview:request', { tabKey, title: task.title, request: task.request });
      const res = await window.c3xManager.getPreview(task.request);
      if (res && res.ok) {
        const prepared = (tabKey === 'animations')
          ? (() => {
              const dirIndex = resolveAnimationDirectionIndex(section);
              return Number.isInteger(dirIndex) ? sliceUnitPreviewByDirection(res, dirIndex) : res;
            })()
          : res;
        appendDebugLog('preview:response:ok', { tabKey, title: task.title, animated: !!res.animated, width: res.width, height: res.height, sourcePath: res.sourcePath, frames: res.framesBase64 ? res.framesBase64.length : 0, debug: res.debug || null });
        const lane = String(task && task.lane || 'base');
        if (tabKey === 'wonders' && lane === 'alt' && !altWrap) {
          altWrap = document.createElement('div');
          altWrap.className = 'preview-alt-group';
          const altTitle = document.createElement('div');
          altTitle.className = 'preview-alt-group-title';
          altTitle.textContent = 'Alt Direction Art';
          altWrap.appendChild(altTitle);
          previewWrap.appendChild(altWrap);
        }
        renderRgbaPreview(
          (tabKey === 'wonders' && lane === 'alt' && altWrap) ? altWrap : previewWrap,
          prepared,
          task.title,
          () => getPreviewDelayMs(tabKey, section, task.title),
          task.displayWidth,
          getPreviewOptionsForTitle(task.title)
        );
        resolved.push({ title: task.title, lane, preview: prepared, displayWidth: task.displayWidth || null });
      } else {
        appendDebugLog('preview:response:err', { tabKey, title: task.title, error: res && res.error });
      }
    } catch (err) {
      appendDebugLog('preview:response:exception', { tabKey, title: task.title, error: err && err.message });
    }
  }

  if (resolved.length > 0) {
    setPreviewCache(cacheKey, resolved);
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
  return tasks;
}

function sliceUnitPreviewByDirection(preview, directionIndex) {
  if (!preview || !preview.animated || !Array.isArray(preview.framesBase64)) return preview;
  const frames = preview.framesBase64;
  if (frames.length < 8) return preview;
  const perDir = Math.floor(frames.length / 8);
  if (perDir < 1) return preview;
  const dirBase = ((Number(directionIndex) % 8) + 8) % 8;
  const dir = (dirBase + UNIT_DIRECTION_SLICE_OFFSET) % 8;
  const start = dir * perDir;
  const end = dir === 7 ? frames.length : Math.min(frames.length, start + perDir);
  const subset = frames.slice(start, end);
  if (!subset.length) return preview;
  return {
    ...preview,
    framesBase64: subset
  };
}

function getUnitAnimationUiState(entry) {
  const key = String(entry && entry.civilopediaKey || '');
  if (!key) return { actionKey: '', direction: 0, previewSoundOn: false, previewPaused: false, unitTypesOpen: false };
  if (!state.unitAnimationUiByKey[key]) state.unitAnimationUiByKey[key] = { actionKey: '', direction: 0, previewSoundOn: false, previewPaused: false, unitTypesOpen: false };
  return state.unitAnimationUiByKey[key];
}

const UNIT_INI_TEMPLATE_SECTIONS = [
  {
    name: 'Speed',
    fields: [
      { key: 'Normal Speed', value: '225' },
      { key: 'Fast Speed', value: '225' }
    ]
  },
  { name: 'Animations', fields: [] },
  { name: 'Timing', fields: [] },
  { name: 'Sound Effects', fields: [] }
];
const UNIT_ALLOWED_ANIMATION_KEYS = [
  'BLANK', 'DEFAULT', 'WALK', 'RUN', 'ATTACK1', 'ATTACK2', 'ATTACK3', 'DEFEND', 'DEATH', 'DEAD',
  'FORTIFY', 'FORTIFYHOLD', 'FIDGET', 'VICTORY', 'TURNLEFT', 'TURNRIGHT', 'BUILD', 'ROAD', 'MINE',
  'IRRIGATE', 'FORTRESS', 'CAPTURE', 'STOP_AT_LAST_FRAME', 'PAUSEROAD', 'PAUSEMINE', 'PAUSEIRRIGATE',
  'JUNGLE', 'PAUSEJUNGLE', 'FOREST', 'PAUSEFOREST', 'PLANT'
];

function cloneUnitTypeRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    key: String(row && row.key || '').trim().toUpperCase(),
    relativePath: String(row && row.relativePath || '').trim(),
    timingSeconds: Number.isFinite(Number(row && row.timingSeconds)) && Number(row.timingSeconds) > 0
      ? Number(row.timingSeconds)
      : null,
    soundPath: String(row && row.soundPath || '').trim()
  })).filter((row) => !!row.key);
}

function cloneUnitIniSections(sections) {
  return (Array.isArray(sections) ? sections : [])
    .map((section) => ({
      name: String(section && section.name || '').trim(),
      fields: (Array.isArray(section && section.fields) ? section.fields : [])
        .map((field) => ({
          key: String(field && field.key || '').trim(),
          value: String(field && field.value || '')
        }))
        .filter((field) => !!field.key)
    }))
    .filter((section) => !!section.name);
}

function buildDefaultUnitIniSections() {
  return cloneUnitIniSections(UNIT_INI_TEMPLATE_SECTIONS);
}

function findUnitIniSection(sections, sectionName) {
  const target = String(sectionName || '').trim().toUpperCase();
  return (Array.isArray(sections) ? sections : []).find((section) => String(section && section.name || '').trim().toUpperCase() === target) || null;
}

function buildUnitIniDerivedData(sections, iniPath = '') {
  const out = {
    actions: [],
    defaultActionKey: '',
    normalSpeedMs: null,
    fastSpeedMs: null
  };
  const timingMap = new Map();
  const timingSection = findUnitIniSection(sections, 'Timing');
  (timingSection && Array.isArray(timingSection.fields) ? timingSection.fields : []).forEach((field) => {
    const key = String(field && field.key || '').trim().toUpperCase();
    const value = Number.parseFloat(String(field && field.value || '').trim());
    if (!key || !Number.isFinite(value) || value <= 0) return;
    timingMap.set(key, value);
  });
  const speedSection = findUnitIniSection(sections, 'Speed');
  (speedSection && Array.isArray(speedSection.fields) ? speedSection.fields : []).forEach((field) => {
    const key = String(field && field.key || '').trim().toUpperCase();
    const value = Number.parseFloat(String(field && field.value || '').trim());
    if (!Number.isFinite(value) || value <= 0) return;
    if (key === 'NORMAL SPEED') out.normalSpeedMs = value;
    if (key === 'FAST SPEED') out.fastSpeedMs = value;
  });
  const animationSection = findUnitIniSection(sections, 'Animations');
  const seen = new Set();
  (animationSection && Array.isArray(animationSection.fields) ? animationSection.fields : []).forEach((field) => {
    const key = String(field && field.key || '').trim().toUpperCase();
    const relativePath = String(field && field.value || '').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    if (!/\.flc$/i.test(relativePath)) return;
    const unitIniPath = String(iniPath || '').trim();
    const sourcePath = relativePath && unitIniPath
      ? `${getParentPath(unitIniPath)}/${normalizeRelativePath(relativePath)}`
      : '';
    out.actions.push({
      key,
      relativePath,
      timingSeconds: timingMap.has(key) ? timingMap.get(key) : null,
      exists: false,
      sourcePath
    });
  });
  if (out.actions.length > 0) {
    out.defaultActionKey = (out.actions.find((a) => a.key === 'DEFAULT') || out.actions[0]).key;
  }
  return out;
}

function buildUnitTypeRowsFromSections(sections) {
  const out = [];
  const timingMap = new Map();
  const soundMap = new Map();
  const timingSection = findUnitIniSection(sections, 'Timing');
  (timingSection && Array.isArray(timingSection.fields) ? timingSection.fields : []).forEach((field) => {
    const key = String(field && field.key || '').trim().toUpperCase();
    const value = Number.parseFloat(String(field && field.value || '').trim());
    if (!key || !Number.isFinite(value) || value <= 0) return;
    timingMap.set(key, value);
  });
  const soundSection = findUnitIniSection(sections, 'Sound Effects');
  (soundSection && Array.isArray(soundSection.fields) ? soundSection.fields : []).forEach((field) => {
    const key = String(field && field.key || '').trim().toUpperCase();
    if (!key) return;
    soundMap.set(key, String(field && field.value || '').trim());
  });
  const animationSection = findUnitIniSection(sections, 'Animations');
  const seen = new Set();
  (animationSection && Array.isArray(animationSection.fields) ? animationSection.fields : []).forEach((field) => {
    const key = String(field && field.key || '').trim().toUpperCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({
      key,
      relativePath: String(field && field.value || '').trim(),
      timingSeconds: timingMap.has(key) ? timingMap.get(key) : null,
      soundPath: soundMap.get(key) || ''
    });
  });
  return out;
}

function buildUnitSectionsFromTypeRows(rows, speedModel = {}) {
  const cleanRows = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = String(row && row.key || '').trim().toUpperCase();
    if (!key) return;
    cleanRows.push({
      key,
      relativePath: String(row && row.relativePath || '').trim(),
      timingSeconds: Number.isFinite(Number(row && row.timingSeconds)) && Number(row.timingSeconds) > 0
        ? Number(row.timingSeconds)
        : null,
      soundPath: String(row && row.soundPath || '').trim()
    });
  });
  return [
    {
      name: 'Speed',
      fields: [
        { key: 'Normal Speed', value: String(Number.isFinite(Number(speedModel.normalSpeedMs)) ? Math.round(Number(speedModel.normalSpeedMs)) : 225) },
        { key: 'Fast Speed', value: String(Number.isFinite(Number(speedModel.fastSpeedMs)) ? Math.round(Number(speedModel.fastSpeedMs)) : 225) }
      ]
    },
    {
      name: 'Animations',
      fields: cleanRows.map((row) => ({ key: row.key, value: row.relativePath }))
    },
    {
      name: 'Timing',
      fields: cleanRows
        .filter((row) => Number.isFinite(row.timingSeconds) && row.timingSeconds > 0)
        .map((row) => ({ key: row.key, value: Number(row.timingSeconds).toFixed(6) }))
    },
    {
      name: 'Sound Effects',
      fields: cleanRows
        .filter((row) => !!row.soundPath)
        .map((row) => ({ key: row.key, value: row.soundPath }))
    }
  ];
}

function isAbsoluteSlashPath(value) {
  const s = toSlashPath(value).trim();
  return /^([a-zA-Z]:\/|\/)/.test(s);
}

function getScenarioBiqStemFromState() {
  const raw = toSlashPath((state.bundle && state.bundle.scenarioInputPath)
    || (state.settings && state.settings.scenarioPath)
    || '').trim();
  if (!/\.biq$/i.test(raw)) return '';
  const base = raw.split('/').pop() || '';
  return base.replace(/\.biq$/i, '').trim();
}

function getActiveScenarioDir() {
  const bundlePath = toSlashPath(state.bundle && state.bundle.scenarioPath || '').trim();
  if (bundlePath) return bundlePath.replace(/\/+$/, '');
  const inferred = inferScenarioDirFromInput(state.settings && state.settings.scenarioPath || '');
  if (!inferred) return '';
  const stem = getScenarioBiqStemFromState();
  if (stem && /\/conquests\/scenarios$/i.test(inferred)) return `${inferred}/${stem}`;
  return inferred;
}

function getCiv3InstallRoot() {
  const raw = toSlashPath(state.settings && state.settings.civ3Path || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  if (/\/conquests$/i.test(raw) || /\/civ3ptw$/i.test(raw)) {
    return raw.replace(/\/[^/]+$/i, '');
  }
  return raw;
}

function isAnimationIniPath(filePath) {
  const p = toSlashPath(filePath).trim().toLowerCase();
  return p.endsWith('.ini') && p.includes('/art/units/');
}

function isAnimationIniEntry(entry) {
  if (!entry) return false;
  if (entry.animationIni) return true;
  return isAnimationIniPath(entry.path);
}

function getUnitIniTargetPath(animationName) {
  const name = String(animationName || '').trim();
  if (!name) return '';
  const scenarioDir = getActiveScenarioDir();
  if (scenarioDir) return `${scenarioDir.replace(/\/+$/, '')}/Art/Units/${name}/${name}.ini`;
  const civ3Root = getCiv3InstallRoot();
  if (civ3Root) return `${civ3Root}/Conquests/Art/Units/${name}/${name}.ini`;
  return '';
}

function getUnitIniSourceCandidates(animationName) {
  const name = String(animationName || '').trim();
  if (!name) return [];
  const out = [];
  const scenarioDir = getActiveScenarioDir();
  const civ3Root = getCiv3InstallRoot();
  if (scenarioDir) out.push(`${scenarioDir.replace(/\/+$/, '')}/Art/Units/${name}/${name}.ini`);
  if (civ3Root) {
    out.push(`${civ3Root}/Conquests/Art/Units/${name}/${name}.ini`);
    out.push(`${civ3Root}/civ3PTW/Art/Units/${name}/${name}.ini`);
    out.push(`${civ3Root}/Art/Units/${name}/${name}.ini`);
  }
  return Array.from(new Set(out.filter(Boolean)));
}

function resolveUnitIniValuePath(iniPath, value, fallbackIniPath = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (isAbsoluteSlashPath(raw)) return toSlashPath(raw);
  const baseIniPath = toSlashPath(iniPath || fallbackIniPath || '').trim();
  const baseDir = getParentPath(baseIniPath);
  if (!baseDir) return toSlashPath(raw);
  return `${baseDir}/${normalizeRelativePath(raw)}`;
}

function toUnitIniRelativePath(filePath, iniPath, fallbackIniPath = '') {
  const full = toSlashPath(filePath).trim();
  if (!full) return '';
  const baseIniPath = toSlashPath(iniPath || fallbackIniPath || '').trim();
  const baseDir = getParentPath(baseIniPath);
  if (baseDir && full.startsWith(`${baseDir}/`)) return full.slice(baseDir.length + 1);
  return full;
}

function toFileUrlFromPath(filePath) {
  const p = toSlashPath(filePath).trim();
  if (!p) return '';
  if (/^file:\/\//i.test(p)) return p;
  if (/^[a-zA-Z]:\//.test(p)) return encodeURI(`file:///${p}`);
  return encodeURI(`file://${p.startsWith('/') ? '' : '/'}${p}`);
}

async function resolvePlayableUnitSoundPath(soundPath) {
  const raw = toSlashPath(soundPath).trim();
  if (!raw) return '';
  if (/\.wav$/i.test(raw) || /\.mp3$/i.test(raw) || /\.ogg$/i.test(raw)) return raw;
  if (!/\.amb$/i.test(raw)) return '';
  try {
    const absAmb = raw;
    const parent = getParentPath(absAmb);
    const bytes = await fetch(toFileUrlFromPath(absAmb)).then((res) => (res.ok ? res.arrayBuffer() : null));
    if (!bytes) return '';
    const text = new TextDecoder('latin1').decode(bytes);
    const match = text.match(/([A-Za-z0-9 _-]+\.wav)/i);
    if (!match || !match[1]) return '';
    return `${parent}/${match[1]}`;
  } catch (_err) {
    return '';
  }
}

function parseEraVariantMeta(civilopediaKey) {
  const key = String(civilopediaKey || '').trim().toUpperCase();
  if (!key.startsWith('PRTO_')) return null;
  const eraIdx = key.indexOf('_ERAS_');
  if (eraIdx >= 0) {
    const familyKey = key.slice(0, eraIdx);
    const eraRaw = key.slice(eraIdx + 6);
    const eraLabel = eraRaw.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    return { familyKey, eraLabel };
  }
  return { familyKey: key, eraLabel: 'Base' };
}

function getEraVariantEntries(tab, entry) {
  const entries = Array.isArray(tab && tab.entries) ? tab.entries : [];
  const meta = parseEraVariantMeta(entry && entry.civilopediaKey);
  if (!meta) return [];
  const family = meta.familyKey;
  const variants = entries
    .map((candidate, idx) => ({ candidate, idx }))
    .filter(({ candidate }) => {
      const key = String(candidate && candidate.civilopediaKey || '').trim().toUpperCase();
      return key === family || key.startsWith(`${family}_ERAS_`);
    })
    .map(({ candidate, idx }) => {
      const parsed = parseEraVariantMeta(candidate && candidate.civilopediaKey);
      return {
        entry: candidate,
        baseIndex: idx,
        eraLabel: parsed ? parsed.eraLabel : 'Base'
      };
    });
  if (variants.length < 2) return [];
  variants.sort((a, b) => String(a.eraLabel || '').localeCompare(String(b.eraLabel || ''), 'en', { sensitivity: 'base' }));
  const baseIdx = variants.findIndex((v) => v.eraLabel === 'Base');
  if (baseIdx > 0) {
    const [base] = variants.splice(baseIdx, 1);
    variants.unshift(base);
  }
  return variants;
}

function makeUnitDirectionPad(selectedIndex, onPick) {
  const pad = document.createElement('div');
  pad.className = 'unit-direction-pad';
  UNIT_FACING_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'unit-direction-btn';
    btn.classList.add(`dir-${opt.key}`);
    btn.classList.toggle('active', Number(selectedIndex) === opt.index);
    btn.dataset.dir = String(opt.index);
    btn.title = `${opt.label} facing`;
    btn.setAttribute('aria-label', `${opt.label} facing`);
    btn.innerHTML = `<span>${opt.glyph}</span><small>${opt.label}</small>`;
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (typeof onPick === 'function') onPick(opt.index);
    });
    pad.appendChild(btn);
  });
  return pad;
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
    setPreviewCache(cacheKey, resolved);
  }
}

function drawPreviewFrameToCanvas(preview, canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !preview) return;
  let rgba;
  if (preview.rgbaBase64) {
    if (!preview._cachedRgbaBytes) {
      preview._cachedRgbaBytes = fromBase64ToUint8(preview.rgbaBase64);
    }
    rgba = preview._cachedRgbaBytes;
  } else if (preview.framesBase64 && preview.framesBase64[0]) {
    if (!preview._cachedFirstFrameBytes) {
      preview._cachedFirstFrameBytes = fromBase64ToUint8(preview.framesBase64[0]);
    }
    rgba = preview._cachedFirstFrameBytes;
  } else {
    return;
  }
  const scratch = getPreviewScratchCanvas(preview.width, preview.height);
  if (!scratch || !scratch.ctx || !scratch.canvas) return;
  scratch.ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), preview.width, preview.height), 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.min(canvas.width / preview.width, canvas.height / preview.height);
  const w = Math.max(1, Math.floor(preview.width * ratio));
  const h = Math.max(1, Math.floor(preview.height * ratio));
  const x = Math.floor((canvas.width - w) / 2);
  const y = Math.floor((canvas.height - h) / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scratch.canvas, x, y, w, h);
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
      setPreviewCache(key, res);
      if (holder.isConnected) paint(res);
    })
    .catch(() => {});
}

function renderUnitAnimationPanel(tabKey, entry, host, editable) {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
  const panel = document.createElement('div');
  panel.className = 'unit-animation-panel';
  const title = document.createElement('div');
  title.className = 'section-top';
  title.innerHTML = '<strong>Unit Animations</strong>';
  attachRichTooltip(title, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.animationName, 'PediaIcons'));
  panel.appendChild(title);

  const keyRow = document.createElement('div');
  keyRow.className = 'rule-row unit-animation-key-row';
  const keyLabel = document.createElement('label');
  keyLabel.className = 'field-meta';
  keyLabel.textContent = 'Animation Folder Key';
  keyRow.appendChild(keyLabel);
  const keyCtrl = document.createElement('div');
  keyCtrl.className = 'rule-control';
  const keyInput = document.createElement(editable ? 'input' : 'span');
  if (editable) {
    keyInput.type = 'text';
    keyInput.placeholder = 'e.g. Warrior';
    keyInput.value = String(entry.animationName || '');
  } else {
    keyInput.className = 'key-display-chip';
    keyInput.textContent = String(entry.animationName || '(none)');
  }
  keyCtrl.appendChild(keyInput);
  if (editable) {
    const browseBtn = document.createElement('button');
    browseBtn.type = 'button';
    browseBtn.className = 'ghost';
    browseBtn.textContent = 'Browse';
    browseBtn.title = 'Pick a unit animation folder and use its name';
    browseBtn.addEventListener('click', async () => {
      const dir = await window.c3xManager.pickDirectory();
      if (!dir) return;
      const folderName = getPathBaseName(dir);
      if (!folderName) return;
      keyInput.value = folderName;
      withUndo(() => {
        entry.animationName = folderName;
        entry.unitAnimationEdited = true;
        entry.unitIniEditor = null;
      });
      model = null;
      ui.actionKey = '';
      void loadManifest();
    });
    keyCtrl.appendChild(browseBtn);
  }
  keyRow.appendChild(keyCtrl);
  panel.appendChild(keyRow);

  const controls = document.createElement('div');
  controls.className = 'unit-animation-controls';
  const actionWrap = document.createElement('label');
  actionWrap.className = 'unit-animation-action';
  actionWrap.textContent = 'Preview Type';
  const actionSelect = document.createElement('select');
  actionWrap.appendChild(actionSelect);
  controls.appendChild(actionWrap);
  const soundToggle = document.createElement('button');
  soundToggle.type = 'button';
  soundToggle.className = 'ghost unit-preview-sound-toggle';
  controls.appendChild(soundToggle);
  const playPauseToggle = document.createElement('button');
  playPauseToggle.type = 'button';
  playPauseToggle.className = 'ghost unit-preview-play-toggle';
  controls.appendChild(playPauseToggle);
  const previewWrap = document.createElement('div');
  previewWrap.className = 'unit-animation-preview';
  const typesWrap = document.createElement('div');
  typesWrap.className = 'unit-ini-sections';

  const mainRow = document.createElement('div');
  mainRow.className = 'unit-animation-main';
  const leftCol = document.createElement('div');
  leftCol.className = 'unit-animation-left';
  leftCol.appendChild(controls);
  const dirWrap = document.createElement('div');
  dirWrap.className = 'unit-direction-wrap';
  const previewRow = document.createElement('div');
  previewRow.className = 'unit-animation-preview-row';
  previewRow.appendChild(previewWrap);
  previewRow.appendChild(dirWrap);
  leftCol.appendChild(previewRow);
  leftCol.appendChild(typesWrap);
  mainRow.appendChild(leftCol);
  panel.appendChild(mainRow);
  host.appendChild(panel);

  const ui = getUnitAnimationUiState(entry);
  let manifest = null;
  let model = null;
  let activePreview = null;
  let activeAction = '';
  let activeTimingSeconds = null;
  let activeSoundPath = '';
  let activePlayableSoundPath = '';
  let previewSoundAudio = null;
  let previewSoundUrl = '';

  const cloneTypeRows = (rows) => cloneUnitTypeRows(rows);

  const syncModelSections = () => {
    if (!model) return;
    model.sections = buildUnitSectionsFromTypeRows(model.typeRows, model);
    const derived = buildUnitIniDerivedData(model.sections, model.iniPath || getUnitIniTargetPath(model.animationName));
    model.actions = (Array.isArray(derived.actions) ? derived.actions : []).map((action) => ({
      ...action,
      soundPath: String((model.typeRows.find((row) => row.key === action.key) || {}).soundPath || '')
    }));
    model.defaultActionKey = String(derived.defaultActionKey || '');
  };

  const ensureEditorModel = () => {
    const animName = String(entry.animationName || '').trim();
    if (!entry.unitIniEditor || String(entry.unitIniEditor.animationName || '') !== animName || !Array.isArray(entry.unitIniEditor.typeRows)) {
      const sourceSections = cloneUnitIniSections(manifest && manifest.sections);
      const derived = buildUnitIniDerivedData(sourceSections, String((manifest && manifest.iniPath) || ''));
      const typeRows = cloneTypeRows(buildUnitTypeRowsFromSections(sourceSections));
      entry.unitIniEditor = {
        animationName: animName,
        iniPath: String((manifest && manifest.iniPath) || getUnitIniTargetPath(animName)),
        typeRows,
        originalTypeRows: cloneTypeRows(typeRows),
        normalSpeedMs: Number.isFinite(Number((manifest && manifest.normalSpeedMs) || derived.normalSpeedMs))
          ? Math.round(Number((manifest && manifest.normalSpeedMs) || derived.normalSpeedMs))
          : 225,
        fastSpeedMs: Number.isFinite(Number((manifest && manifest.fastSpeedMs) || derived.fastSpeedMs))
          ? Math.round(Number((manifest && manifest.fastSpeedMs) || derived.fastSpeedMs))
          : 225,
        sections: [],
        originalSections: [],
        actions: [],
        originalActions: []
      };
      model = entry.unitIniEditor;
      syncModelSections();
      model.originalSections = cloneUnitIniSections(model.sections);
      model.originalActions = (model.actions || []).map((action) => ({
        key: String(action.key || '').trim().toUpperCase(),
        relativePath: String(action.relativePath || '').trim(),
        timingSeconds: Number.isFinite(Number(action.timingSeconds)) ? Number(action.timingSeconds) : null
      }));
    } else {
      model = entry.unitIniEditor;
      syncModelSections();
    }
    return model;
  };

  const withUndo = (fn) => {
    rememberUndoSnapshot();
    fn();
    syncModelSections();
    setDirty(true);
  };

  const refreshSoundToggle = () => {
    const on = !!ui.previewSoundOn;
    soundToggle.textContent = on ? '🔊' : '🔇';
    soundToggle.title = on ? 'Preview sound on' : 'Preview sound off';
    soundToggle.setAttribute('aria-label', soundToggle.title);
    soundToggle.classList.toggle('active', on);
  };

  const refreshPlayPauseToggle = () => {
    const paused = !!ui.previewPaused;
    playPauseToggle.textContent = paused ? '▶' : '⏸';
    playPauseToggle.title = paused ? 'Play preview' : 'Pause preview';
    playPauseToggle.setAttribute('aria-label', playPauseToggle.title);
    playPauseToggle.classList.toggle('active', paused);
  };

  const playPreviewSound = () => {
    if (!ui.previewSoundOn || !activePlayableSoundPath) return;
    const url = toFileUrlFromPath(activePlayableSoundPath);
    if (!url) return;
    try {
      if (!previewSoundAudio || previewSoundUrl !== url) {
        previewSoundAudio = new Audio(url);
        previewSoundAudio.preload = 'auto';
        previewSoundUrl = url;
      }
      previewSoundAudio.currentTime = 0;
      const promise = previewSoundAudio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {});
      }
    } catch (_err) {}
  };

  const pickTypePath = async (row, isSound) => {
    const targetIniPath = String((model && model.iniPath) || getUnitIniTargetPath(entry.animationName) || '').trim();
    const currentValue = isSound ? row.soundPath : row.relativePath;
    const currentResolved = resolveUnitIniValuePath(targetIniPath, currentValue, getUnitIniTargetPath(entry.animationName));
    const fallbackDir = getParentPath(targetIniPath) || getParentPath(getUnitIniTargetPath(entry.animationName));
    const filePath = await window.c3xManager.pickFile({
      filters: isSound
        ? [{ name: 'Sound Files', extensions: ['wav', 'amb', 'mp3'] }, { name: 'All Files', extensions: ['*'] }]
        : [{ name: 'FLC Files', extensions: ['flc'] }, { name: 'All Files', extensions: ['*'] }],
      defaultPath: currentResolved || fallbackDir || undefined
    });
    if (!filePath) return;
    const nextRel = toUnitIniRelativePath(filePath, targetIniPath, getUnitIniTargetPath(entry.animationName));
    withUndo(() => {
      if (isSound) row.soundPath = nextRel;
      else row.relativePath = nextRel;
    });
    renderTypes();
    renderPreviewPicker();
    if (!isSound) {
      ui.actionKey = row.key;
      actionSelect.value = row.key;
      void loadActionPreview(row.key);
    }
  };

  const renderPreview = () => {
    previewWrap.innerHTML = '';
    if (!activePreview) return;
    const dir = Number.isFinite(ui.direction) ? ui.direction : 0;
    const subset = sliceUnitPreviewByDirection(activePreview, dir);
    const dirLabel = (UNIT_FACING_OPTIONS.find((d) => d.index === dir) || UNIT_FACING_OPTIONS[0]).label;
    let delayMs = 100;
    if (Number.isFinite(activePreview.speedField) && activePreview.speedField > 0) {
      delayMs = Math.max(16, Math.round(activePreview.speedField));
    } else if (Number.isFinite(activeTimingSeconds) && activeTimingSeconds > 0) {
      // Fallback for malformed FLC headers.
      const frameCount = Math.max(1, Array.isArray(subset.framesBase64) ? subset.framesBase64.length : 1);
      delayMs = Math.max(16, Math.round((activeTimingSeconds * 1000) / frameCount));
    }
    renderRgbaPreview(previewWrap, subset, `${activeAction || 'Animation'} - ${dirLabel}`, () => delayMs, Math.min(Number(subset.width) || 220, 320), {
      sampleMaxFrames: 0,
      onLoopStart: playPreviewSound,
      isPausedProvider: () => !!ui.previewPaused
    });
  };

  const renderDirectionPad = () => {
    const old = dirWrap.querySelector('.unit-direction-pad');
    if (old) old.remove();
    dirWrap.appendChild(makeUnitDirectionPad(ui.direction, (nextDir) => {
      ui.direction = nextDir;
      renderDirectionPad();
      renderPreview();
    }));
  };

  const loadActionPreview = async (actionKey) => {
    if (!actionKey || !entry.animationName) return;
    activeAction = actionKey;
    const activeRow = (model && Array.isArray(model.typeRows)) ? model.typeRows.find((row) => row.key === actionKey) : null;
    const relativeFlc = String(activeRow && activeRow.relativePath || '').trim();
    activeTimingSeconds = activeRow && Number.isFinite(activeRow.timingSeconds) ? Number(activeRow.timingSeconds) : null;
    const soundRel = String(activeRow && activeRow.soundPath || '').trim();
    if (!relativeFlc) {
      previewWrap.innerHTML = `<div class="hint">${actionKey} has no FLC path configured.</div>`;
      activePreview = null;
      activeSoundPath = '';
      activePlayableSoundPath = '';
      return;
    }
    const unitIniPath = String((model && model.iniPath) || (manifest && manifest.iniPath) || '').trim();
    activeSoundPath = resolveUnitIniValuePath(unitIniPath, soundRel, getUnitIniTargetPath(entry.animationName));
    activePlayableSoundPath = await resolvePlayableUnitSoundPath(activeSoundPath);
    const cacheKey = JSON.stringify({ kind: 'unitAnimationPath', unitIniPath, flcPath: relativeFlc });
    let res = state.previewCache.get(cacheKey);
    if (!res) {
      res = await window.c3xManager.getPreview({ kind: 'unitAnimationPath', unitIniPath, flcPath: relativeFlc });
      if (res && res.ok) setPreviewCache(cacheKey, res);
    }
    if (!res || !res.ok) {
      previewWrap.innerHTML = `<div class="hint">Unable to load ${actionKey}: ${res && res.error ? res.error : 'unknown error'}</div>`;
      activePreview = null;
      return;
    }
    activePreview = res;
    renderPreview();
  };

  const renderPreviewPicker = () => {
    actionSelect.innerHTML = '';
    const rows = (model && Array.isArray(model.typeRows)) ? model.typeRows.filter((row) => !!String(row.relativePath || '').trim()) : [];
    if (rows.length === 0) {
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = '(no configured types)';
      actionSelect.appendChild(empty);
      previewWrap.innerHTML = '<div class="hint">Add at least one animation type with an FLC to preview.</div>';
      return;
    }
    rows.forEach((row) => {
      const option = document.createElement('option');
      option.value = row.key;
      option.textContent = row.key;
      actionSelect.appendChild(option);
    });
    const selected = rows.find((row) => row.key === String(ui.actionKey || '').toUpperCase()) || rows[0];
    ui.actionKey = selected.key;
    actionSelect.value = selected.key;
    void loadActionPreview(selected.key);
  };

  const renderTypes = () => {
    typesWrap.innerHTML = '';
    const activeModel = ensureEditorModel();
    const typesCard = document.createElement('div');
    typesCard.className = 'unit-ini-section-card';
    const list = document.createElement('div');
    list.className = 'unit-type-list';
    const rows = Array.isArray(activeModel.typeRows) ? activeModel.typeRows : [];
    rows.forEach((row) => {
      const entryRow = document.createElement('div');
      entryRow.className = 'unit-type-row';

      const typeSelect = document.createElement('select');
      const used = new Set(rows.filter((candidate) => candidate !== row).map((candidate) => candidate.key));
      const optionValues = Array.from(new Set([...UNIT_ALLOWED_ANIMATION_KEYS, row.key].filter(Boolean)));
      optionValues.forEach((value) => {
        if (used.has(value) && value !== row.key) return;
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        typeSelect.appendChild(opt);
      });
      typeSelect.value = row.key;
      typeSelect.disabled = !editable;
      typeSelect.addEventListener('change', () => {
        const next = String(typeSelect.value || '').trim().toUpperCase();
        if (!next) return;
        withUndo(() => {
          row.key = next;
        });
        ui.actionKey = next;
        renderTypes();
        renderPreviewPicker();
      });
      entryRow.appendChild(typeSelect);

      const pathStack = document.createElement('div');
      pathStack.className = 'unit-type-path-stack';

      const soundRow = document.createElement('div');
      soundRow.className = 'unit-type-path-row';
      const soundChip = document.createElement('span');
      soundChip.className = 'key-display-chip unit-type-path-text';
      soundChip.textContent = row.soundPath || '(no sound)';
      soundRow.appendChild(soundChip);
      const soundBrowse = document.createElement('button');
      soundBrowse.type = 'button';
      soundBrowse.className = 'ghost unit-ini-browse-btn';
      soundBrowse.innerHTML = '<span class="btn-icon">🔊</span>Sound';
      soundBrowse.disabled = !editable;
      soundBrowse.addEventListener('click', () => { void pickTypePath(row, true); });
      soundRow.appendChild(soundBrowse);
      pathStack.appendChild(soundRow);

      const flcRow = document.createElement('div');
      flcRow.className = 'unit-type-path-row';
      const flcChip = document.createElement('span');
      flcChip.className = 'key-display-chip unit-type-path-text';
      flcChip.textContent = row.relativePath || '(no FLC)';
      flcRow.appendChild(flcChip);
      const flcBrowse = document.createElement('button');
      flcBrowse.type = 'button';
      flcBrowse.className = 'ghost unit-ini-browse-btn';
      flcBrowse.innerHTML = '<span class="btn-icon">🎞</span>FLC';
      flcBrowse.disabled = !editable;
      flcBrowse.addEventListener('click', () => { void pickTypePath(row, false); });
      flcRow.appendChild(flcBrowse);
      pathStack.appendChild(flcRow);

      entryRow.appendChild(pathStack);

      if (editable) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'ghost unit-ini-delete-btn';
        delBtn.innerHTML = '<span class="btn-icon">🗑</span>Delete';
        delBtn.addEventListener('click', () => {
          withUndo(() => {
            activeModel.typeRows = activeModel.typeRows.filter((candidate) => candidate !== row);
          });
          if (ui.actionKey === row.key) ui.actionKey = '';
          renderTypes();
          renderPreviewPicker();
        });
        entryRow.appendChild(delBtn);
      }
      list.appendChild(entryRow);
    });
    typesCard.appendChild(list);
    if (editable) {
      const addWrap = document.createElement('div');
      addWrap.className = 'unit-ini-add-row';
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'ghost';
      addBtn.textContent = 'Add Type';
      addBtn.disabled = UNIT_ALLOWED_ANIMATION_KEYS.every((key) => rows.some((row) => row.key === key));
      addBtn.addEventListener('click', () => {
        const used = new Set(rows.map((row) => row.key));
        const firstAvailable = UNIT_ALLOWED_ANIMATION_KEYS.find((key) => !used.has(key));
        if (!firstAvailable) return;
        withUndo(() => {
          activeModel.typeRows.unshift({ key: firstAvailable, relativePath: '', timingSeconds: null, soundPath: '' });
        });
        ui.actionKey = firstAvailable;
        renderTypes();
        renderPreviewPicker();
      });
      addWrap.appendChild(addBtn);
      typesCard.appendChild(addWrap);
    }
    const details = document.createElement('details');
    details.className = 'unit-types-collapse';
    details.open = !!ui.unitTypesOpen;
    const summary = document.createElement('summary');
    summary.textContent = 'Animation Types';
    details.appendChild(summary);
    details.appendChild(typesCard);
    details.addEventListener('toggle', () => {
      ui.unitTypesOpen = !!details.open;
    });
    typesWrap.appendChild(details);
  };

  actionSelect.addEventListener('change', () => {
    const next = String(actionSelect.value || '').trim().toUpperCase();
    if (!next) return;
    ui.actionKey = next;
    void loadActionPreview(next);
  });
  soundToggle.addEventListener('click', () => {
    ui.previewSoundOn = !ui.previewSoundOn;
    refreshSoundToggle();
  });
  playPauseToggle.addEventListener('click', () => {
    ui.previewPaused = !ui.previewPaused;
    refreshPlayPauseToggle();
  });

  const loadManifest = async () => {
    const animationName = String(entry.animationName || '').trim();
    if (!animationName) {
      actionSelect.innerHTML = '<option>(no animation folder)</option>';
      previewWrap.innerHTML = '';
      typesWrap.innerHTML = '<div class="hint">Set an animation folder key to edit unit INI data.</div>';
      return;
    }
    const res = await window.c3xManager.getPreview({
      kind: 'unitAnimationManifest',
      civ3Path: state.settings.civ3Path,
      scenarioPath: state.settings.scenarioPath,
      scenarioPaths: getScenarioPreviewPaths(),
      animationName
    });
    if (!res || !res.ok) {
      manifest = {
        iniPath: getUnitIniTargetPath(animationName),
        normalSpeedMs: 225,
        fastSpeedMs: 225,
        sections: buildDefaultUnitIniSections(),
        actions: [],
        defaultActionKey: ''
      };
      if (!editable) {
        typesWrap.innerHTML = `<div class="hint">Unable to load unit INI: ${res && res.error ? res.error : 'unknown error'}</div>`;
        actionSelect.innerHTML = '<option>(no data)</option>';
        previewWrap.innerHTML = '';
        return;
      }
    } else {
      manifest = res;
    }
    ensureEditorModel();
    renderTypes();
    renderPreviewPicker();
    renderDirectionPad();
  };

  if (editable) {
    keyInput.addEventListener('change', () => {
      withUndo(() => {
        entry.animationName = String(keyInput.value || '').trim();
        entry.unitAnimationEdited = true;
        entry.unitIniEditor = null;
      });
      model = null;
      ui.actionKey = '';
      void loadManifest();
    });
  }

  const variants = getEraVariantEntries(tab, entry);
  if (variants.length > 1) {
    const eraRow = document.createElement('div');
    eraRow.className = 'rule-row unit-animation-key-row';
    const eraLabel = document.createElement('label');
    eraLabel.className = 'field-meta';
    eraLabel.textContent = 'Era Variant';
    eraRow.appendChild(eraLabel);
    const eraCtrl = document.createElement('div');
    eraCtrl.className = 'rule-control';
    const eraSelect = document.createElement('select');
    variants.forEach((variant) => {
      const option = document.createElement('option');
      option.value = String(variant.baseIndex);
      const folder = String(variant.entry && variant.entry.animationName || '').trim();
      option.textContent = folder ? `${variant.eraLabel} (${folder})` : variant.eraLabel;
      option.selected = variant.entry === entry;
      eraSelect.appendChild(option);
    });
    eraSelect.addEventListener('change', () => {
      const nextIdx = Number.parseInt(String(eraSelect.value || ''), 10);
      if (!Number.isInteger(nextIdx)) return;
      navigateWithHistory(() => {
        state.referenceSelection[tabKey] = nextIdx;
      }, { preserveTabScroll: true });
    });
    eraCtrl.appendChild(eraSelect);
    eraRow.appendChild(eraCtrl);
    panel.insertBefore(eraRow, mainRow);
  }

  renderDirectionPad();
  refreshSoundToggle();
  refreshPlayPauseToggle();
  void loadManifest();
}

function getSectionTitle(section, schema, index) {
  const titleField = section.fields.find((f) => f.key === schema.titleKey);
  if (titleField && titleField.value) {
    return titleField.value;
  }
  return `${schema.entityName} ${index + 1}`;
}

function getSectionTabSourceMeta(tab) {
  const src = String(tab && tab.effectiveSource || '').trim() || 'effective';
  const readPath = String(tab && tab.sourceDetails && tab.sourceDetails.effectivePath || '').trim();
  const writePath = String(tab && tab.targetPath || '').trim();
  return {
    source: `C3X ${src}`,
    readPath,
    writePath
  };
}

function getDistrictSectionDisplay(section, index) {
  const name = normalizeConfigToken(getFieldValue(section, 'name'));
  const displayName = normalizeConfigToken(getFieldValue(section, 'display_name'));
  const tooltip = normalizeConfigToken(getFieldValue(section, 'tooltip'));
  return {
    primary: displayName || name || `District ${index + 1}`,
    secondary: displayName && name && displayName !== name ? name : '',
    tooltip: tooltip || ''
  };
}

function getSectionNamesFromTab(tabKey, fieldKey = 'name') {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
  if (!tab || !tab.model || !Array.isArray(tab.model.sections)) return [];
  const out = new Set();
  tab.model.sections.forEach((section) => {
    const value = normalizeConfigToken(getFieldValue(section, fieldKey));
    if (value) out.add(value);
  });
  return Array.from(out).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

const DISTRICT_TRAIT_OPTIONS = [
  'militaristic',
  'religious',
  'commercial',
  'industrious',
  'expansionist',
  'scientific',
  'agricultural',
  'seafaring'
];

const DISTRICT_CULTURE_OPTIONS = [
  'american',
  'european',
  'roman',
  'mideast',
  'asian'
];

function getConfiguredSectionListValues(tabKeys, fieldKey) {
  const seen = new Set();
  (Array.isArray(tabKeys) ? tabKeys : []).forEach((tabKey) => {
    const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
    const sections = tab && tab.model && Array.isArray(tab.model.sections) ? tab.model.sections : [];
    sections.forEach((section) => {
      const raw = String(getFieldValue(section, fieldKey) || '').trim();
      if (!raw) return;
      tokenizeListPreservingQuotes(raw).forEach((token) => {
        const clean = normalizeConfigToken(token).toLowerCase();
        if (clean) seen.add(clean);
      });
    });
  });
  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function mergeOptionLists(primaryOptions, discoveredOptions) {
  const seen = new Set();
  const out = [];
  [...(Array.isArray(primaryOptions) ? primaryOptions : []), ...(Array.isArray(discoveredOptions) ? discoveredOptions : [])].forEach((value) => {
    const clean = String(value || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(clean);
  });
  return out;
}

function getDynamicSectionFieldOptions(tabKey, schemaField, section) {
  const key = String(schemaField && schemaField.key || '').trim();
  if (!key) return [];
  if (tabKey === 'wonders' && key === 'name') {
    return getFilteredImprovementOptions(['wonder', 'small_wonder']).map((opt) => String(opt.value || '')).filter(Boolean);
  }
  if (tabKey === 'wonders' && key === 'buildable_by_civs') {
    return getNamedReferenceOptionsForTab('civilizations').map((opt) => String(opt.value || ''));
  }
  if (tabKey === 'wonders' && key === 'buildable_by_civ_govs') {
    return getNamedReferenceOptionsForTab('governments').map((opt) => String(opt.value || ''));
  }
  if (tabKey === 'wonders' && key === 'buildable_by_civ_traits') {
    const discovered = getConfiguredSectionListValues(['districts', 'wonders'], 'buildable_by_civ_traits');
    return mergeOptionLists(DISTRICT_TRAIT_OPTIONS, discovered);
  }
  if (tabKey === 'wonders' && key === 'buildable_by_civ_cultures') {
    const discovered = getConfiguredSectionListValues(['districts', 'wonders'], 'buildable_by_civ_cultures');
    return mergeOptionLists(DISTRICT_CULTURE_OPTIONS, discovered);
  }
  if (tabKey !== 'districts') return [];

  if (key === 'advance_prereqs' || key === 'obsoleted_by') {
    return getNamedReferenceOptionsForTab('technologies').map((opt) => String(opt.value || ''));
  }
  if (key === 'dependent_improvs' || key === 'wonder_prereqs') {
    return getNamedReferenceOptionsForTab('improvements').map((opt) => String(opt.value || ''));
  }
  if (key === 'resource_prereqs') {
    return getNamedReferenceOptionsForTab('resources').map((opt) => String(opt.value || ''));
  }
  if (key === 'buildable_by_civs') {
    return getNamedReferenceOptionsForTab('civilizations').map((opt) => String(opt.value || ''));
  }
  if (key === 'buildable_by_civ_govs') {
    return getNamedReferenceOptionsForTab('governments').map((opt) => String(opt.value || ''));
  }
  if (key === 'buildable_by_civ_traits') {
    const discovered = getConfiguredSectionListValues(['districts', 'wonders'], 'buildable_by_civ_traits');
    return mergeOptionLists(DISTRICT_TRAIT_OPTIONS, discovered);
  }
  if (key === 'buildable_by_civ_cultures') {
    const discovered = getConfiguredSectionListValues(['districts', 'wonders'], 'buildable_by_civ_cultures');
    return mergeOptionLists(DISTRICT_CULTURE_OPTIONS, discovered);
  }
  if (key === 'buildable_on_districts' || key === 'buildable_adjacent_to_districts') {
    const options = getSectionNamesFromTab('districts', 'name');
    const selfName = getFieldValue(section, 'name');
    return options.filter((name) => String(name || '') !== selfName);
  }
  if (key === 'natural_wonder_prereqs') {
    return getSectionNamesFromTab('naturalWonders', 'name');
  }
  return [];
}

function getReferenceTabForSectionField(tabKey, fieldKey) {
  const key = String(fieldKey || '').trim();
  if (tabKey === 'wonders') {
    if (key === 'buildable_by_civs') return 'civilizations';
    if (key === 'buildable_by_civ_govs') return 'governments';
    return '';
  }
  if (tabKey !== 'districts') return '';
  if (key === 'advance_prereqs' || key === 'obsoleted_by') return 'technologies';
  if (key === 'dependent_improvs' || key === 'wonder_prereqs') return 'improvements';
  if (key === 'resource_prereqs') return 'resources';
  if (key === 'buildable_by_civs') return 'civilizations';
  if (key === 'buildable_by_civ_govs') return 'governments';
  return '';
}

function getReferenceOptionsForSectionField(tabKey, fieldKey) {
  const key = String(fieldKey || '').trim();
  if (tabKey === 'districts' && key === 'wonder_prereqs') {
    return getFilteredImprovementOptions(['wonder', 'small_wonder']);
  }
  const refTabKey = getReferenceTabForSectionField(tabKey, key);
  return refTabKey ? getNamedReferenceOptionsForTab(refTabKey) : [];
}

function sanitizeStructuredFieldDescription(text) {
  return String(text || '')
    .replace(/comma[-\s]*delimited[^.]*\.?/gi, 'Use structured selections below.')
    .replace(/\b(1\s*or\s*0|0\s*or\s*1)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSectionFieldDescription(tabKey, schemaField, fieldDocs) {
  const rawDoc = (fieldDocs && fieldDocs[schemaField.key]) || '';
  const doc = sanitizeStructuredFieldDescription(rawDoc);
  const schemaDesc = sanitizeStructuredFieldDescription(schemaField.desc || '');
  const isStructured = schemaField.type === 'list' || schemaField.multi;
  if (isStructured) {
    const refTab = getReferenceTabForSectionField(tabKey, schemaField.key);
    if (refTab) return `Select one or more ${toFriendlyKey(refTab).toLowerCase()} entries.`;
    if (String(schemaField.key || '') === 'img_paths') return 'Select district image PCX files. Browse to add each path.';
    return schemaDesc || 'Select one or more values.';
  }
  if (schemaField.type === 'bool') {
    const noisyBoolDoc = /\b(1\s*or\s*0|0\s*or\s*1)\b/i;
    if (noisyBoolDoc.test(doc) || noisyBoolDoc.test(schemaDesc)) return '';
  }
  return doc || schemaDesc;
}

function orderSectionFieldsByDocs(schemaFields, fieldDocs) {
  const fields = Array.isArray(schemaFields) ? schemaFields.slice() : [];
  const docs = fieldDocs && typeof fieldDocs === 'object' ? fieldDocs : {};
  const docOrder = new Map();
  Object.keys(docs).forEach((key, idx) => docOrder.set(String(key || '').toLowerCase(), idx));
  return fields.sort((a, b) => {
    const aKey = String(a && a.key || '').toLowerCase();
    const bKey = String(b && b.key || '').toLowerCase();
    const ai = docOrder.has(aKey) ? docOrder.get(aKey) : Number.MAX_SAFE_INTEGER;
    const bi = docOrder.has(bKey) ? docOrder.get(bKey) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return 0;
  });
}

function applyPreferredSectionFieldOrder(tabKey, orderedFields) {
  const fields = Array.isArray(orderedFields) ? orderedFields.slice() : [];
  let priorityByKey = null;
  if (tabKey === 'wonders') {
    priorityByKey = new Map([
      ['name', 0],
      ['img_path', 1],
      ['img_construct_row', 2],
      ['img_construct_column', 3],
      ['img_row', 4],
      ['img_column', 5],
      ['enable_img_alt_dir', 6],
      ['img_alt_dir_construct_row', 7],
      ['img_alt_dir_construct_column', 8],
      ['img_alt_dir_row', 9],
      ['img_alt_dir_column', 10],
      ['custom_width', 11],
      ['custom_height', 12]
    ]);
  } else if (tabKey === 'naturalWonders') {
    priorityByKey = new Map([
      ['name', 0],
      ['img_path', 1],
      ['img_row', 2],
      ['img_column', 3],
      ['animation', 4],
      ['terrain_type', 5],
      ['adjacent_to', 6],
      ['adjacency_dir', 7]
    ]);
  } else {
    return fields;
  }
  return fields.sort((a, b) => {
    const aKey = String(a && a.key || '');
    const bKey = String(b && b.key || '');
    const ai = priorityByKey.has(aKey) ? priorityByKey.get(aKey) : Number.MAX_SAFE_INTEGER;
    const bi = priorityByKey.has(bKey) ? priorityByKey.get(bKey) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return 0;
  });
}

function shouldShowAnimationFieldForType(fieldKey, typeValue) {
  const key = String(fieldKey || '').trim().toLowerCase();
  const type = String(typeValue || '').trim().toLowerCase();
  if (key === 'resource_type') return type === 'resource';
  if (key === 'pcx_file' || key === 'pcx_index') return type === 'pcx';
  if (key === 'terrain_types' || key === 'adjacent_to') return type === 'terrain';
  if (key === 'direction') return true;
  return true;
}

function resolveAnimationDirectionIndex(section) {
  const direction = normalizeConfigToken(getFieldValue(section, 'direction')).toLowerCase();
  if (!direction) return null;
  const map = {
    northeast: 4,
    east: 3,
    southeast: 2,
    south: 1,
    southwest: 0,
    west: 7,
    northwest: 6,
    north: 5
  };
  return Number.isInteger(map[direction]) ? map[direction] : null;
}

const DISTRICT_DEPENDENCY_RULES = [
  { key: 'advance_prereqs', label: 'Tech Prerequisites', setKey: 'technologies' },
  { key: 'obsoleted_by', label: 'Obsoleted By', setKey: 'technologies' },
  { key: 'dependent_improvs', label: 'Dependent Improvements', setKey: 'improvements' },
  { key: 'wonder_prereqs', label: 'Wonder Prerequisites', setKey: 'improvements' },
  { key: 'resource_prereqs', label: 'Resource Prerequisites', setKey: 'resources' },
  { key: 'buildable_by_civs', label: 'Allowed Civs', setKey: 'civilizations' },
  { key: 'buildable_by_civ_govs', label: 'Allowed Governments', setKey: 'governments' },
  { key: 'natural_wonder_prereqs', label: 'Natural Wonder Prerequisites', setKey: 'naturalWonders' },
  { key: 'buildable_on_districts', label: 'Buildable On Districts', setKey: 'districts' },
  { key: 'buildable_adjacent_to_districts', label: 'Adjacent Districts', setKey: 'districts' }
];

const WONDER_DEPENDENCY_RULES = [
  { key: 'name', label: 'Wonder Name', setKey: 'wonders', single: true },
  { key: 'buildable_by_civs', label: 'Allowed Civs', setKey: 'civilizations' },
  { key: 'buildable_by_civ_govs', label: 'Allowed Governments', setKey: 'governments' },
  { key: 'buildable_by_civ_traits', label: 'Allowed Traits', setKey: 'traits' },
  { key: 'buildable_by_civ_cultures', label: 'Allowed Cultures', setKey: 'cultures' }
];

function getReferenceEntryDisplayName(tabKey, entry) {
  const normalizedTabKey = String(tabKey || '').trim();
  if (normalizedTabKey === 'improvements') {
    const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
    const nameField = fields.find((field) => String(field && (field.baseKey || field.key) || '').trim().toLowerCase() === 'name');
    const biqName = normalizeConfigToken(nameField && nameField.value);
    if (biqName) return biqName;
  }
  return String(entry && entry.name || '').trim();
}

function toNormalizedLookupSet(values) {
  const out = new Set();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const normalized = normalizeConfigToken(value).toLowerCase();
    if (normalized) out.add(normalized);
  });
  return out;
}

function getReferenceSetFromBundle(bundle, tabKey, filterFn = null) {
  const tabs = (bundle && bundle.tabs) || {};
  const tab = tabs[tabKey];
  if (!tab || !Array.isArray(tab.entries)) return new Set();
  const entries = typeof filterFn === 'function' ? tab.entries.filter((entry) => filterFn(entry)) : tab.entries;
  return toNormalizedLookupSet(entries.map((entry) => getReferenceEntryDisplayName(tabKey, entry)));
}

function buildDistrictCompatibilityContext(bundle, districtSectionsOverride = null) {
  const sourceBundle = bundle || state.bundle || {};
  const tabs = sourceBundle.tabs || {};
  const naturalWonderSections = (((tabs.naturalWonders || {}).model || {}).sections || []);
  const districtSections = Array.isArray(districtSectionsOverride)
    ? districtSectionsOverride
    : ((((tabs.districts || {}).model || {}).sections || []));
  const naturalWonders = toNormalizedLookupSet(naturalWonderSections.map((section) => getFieldValue(section, 'name')));
  const districts = toNormalizedLookupSet(districtSections.map((section) => getFieldValue(section, 'name')));
  return {
    technologies: getReferenceSetFromBundle(sourceBundle, 'technologies'),
    improvements: getReferenceSetFromBundle(sourceBundle, 'improvements'),
    resources: getReferenceSetFromBundle(sourceBundle, 'resources'),
    civilizations: getReferenceSetFromBundle(sourceBundle, 'civilizations'),
    governments: getReferenceSetFromBundle(sourceBundle, 'governments'),
    naturalWonders,
    districts
  };
}

function buildWonderCompatibilityContext(bundle) {
  const sourceBundle = bundle || state.bundle || {};
  return {
    wonders: getReferenceSetFromBundle(sourceBundle, 'improvements', (entry) => {
      const kind = String(entry && entry.improvementKind || '').trim().toLowerCase();
      return kind === 'wonder' || kind === 'small_wonder';
    }),
    civilizations: getReferenceSetFromBundle(sourceBundle, 'civilizations'),
    governments: getReferenceSetFromBundle(sourceBundle, 'governments'),
    traits: toNormalizedLookupSet(DISTRICT_TRAIT_OPTIONS),
    cultures: toNormalizedLookupSet(DISTRICT_CULTURE_OPTIONS)
  };
}

function collectDistrictDependencyIssues(section, index, context, districtNameOverrideSet = null) {
  const issues = [];
  const ctx = context || buildDistrictCompatibilityContext();
  DISTRICT_DEPENDENCY_RULES.forEach((rule) => {
    const tokenValues = tokenizeListPreservingQuotes(getFieldValue(section, rule.key))
      .map((value) => normalizeConfigToken(value))
      .filter(Boolean);
    if (tokenValues.length <= 0) return;
    const allowedSet = rule.setKey === 'districts'
      ? (districtNameOverrideSet || ctx.districts || new Set())
      : (ctx[rule.setKey] || new Set());
    if (!(allowedSet instanceof Set) || allowedSet.size <= 0) return;
    const invalidValues = tokenValues.filter((value) => !allowedSet.has(normalizeConfigToken(value).toLowerCase()));
    if (invalidValues.length <= 0) return;
    issues.push({
      key: rule.key,
      label: rule.label,
      invalidValues
    });
  });
  return issues;
}

function collectDistrictCompatibilityIssuesForTab(tab) {
  const districtTab = tab || (state.bundle && state.bundle.tabs && state.bundle.tabs.districts);
  const sections = districtTab && districtTab.model && Array.isArray(districtTab.model.sections)
    ? districtTab.model.sections
    : [];
  const context = buildDistrictCompatibilityContext(state.bundle, sections);
  const bySection = new Map();
  let totalIssues = 0;
  sections.forEach((section, idx) => {
    const issues = collectDistrictDependencyIssues(section, idx, context, context.districts);
    if (issues.length > 0) {
      bySection.set(idx, issues);
      totalIssues += issues.reduce((sum, issue) => sum + issue.invalidValues.length, 0);
    }
  });
  return {
    bySection,
    totalIssues,
    sectionCount: bySection.size
  };
}

function collectDistrictIssueIndexes(tab, compatibility = null) {
  const districtTab = tab || (state.bundle && state.bundle.tabs && state.bundle.tabs.districts);
  const sections = districtTab && districtTab.model && Array.isArray(districtTab.model.sections)
    ? districtTab.model.sections
    : [];
  const out = new Set();
  const bySection = compatibility && compatibility.bySection instanceof Map ? compatibility.bySection : null;
  sections.forEach((section, idx) => {
    if (bySection && bySection.has(idx)) {
      out.add(idx);
      return;
    }
    const validationError = validateDistrictSection(section, idx);
    if (validationError) out.add(idx);
  });
  return out;
}

function collectWonderDependencyIssues(section, index, context) {
  const issues = [];
  const ctx = context || buildWonderCompatibilityContext();
  WONDER_DEPENDENCY_RULES.forEach((rule) => {
    const tokenValues = rule.single
      ? [normalizeConfigToken(getFieldValue(section, rule.key))]
      : tokenizeListPreservingQuotes(getFieldValue(section, rule.key)).map((value) => normalizeConfigToken(value));
    const cleaned = tokenValues.filter(Boolean);
    if (cleaned.length <= 0) return;
    const allowedSet = ctx[rule.setKey] || new Set();
    if (!(allowedSet instanceof Set) || allowedSet.size <= 0) return;
    const invalidValues = cleaned.filter((value) => !allowedSet.has(normalizeConfigToken(value).toLowerCase()));
    if (invalidValues.length <= 0) return;
    issues.push({
      key: rule.key,
      label: rule.label,
      invalidValues
    });
  });
  return issues;
}

function collectWonderCompatibilityIssuesForTab(tab) {
  const wonderTab = tab || (state.bundle && state.bundle.tabs && state.bundle.tabs.wonders);
  const sections = wonderTab && wonderTab.model && Array.isArray(wonderTab.model.sections)
    ? wonderTab.model.sections
    : [];
  const context = buildWonderCompatibilityContext(state.bundle);
  const bySection = new Map();
  let totalIssues = 0;
  sections.forEach((section, idx) => {
    const issues = collectWonderDependencyIssues(section, idx, context);
    if (issues.length > 0) {
      bySection.set(idx, issues);
      totalIssues += issues.reduce((sum, issue) => sum + issue.invalidValues.length, 0);
    }
  });
  return {
    bySection,
    totalIssues,
    sectionCount: bySection.size
  };
}

function collectWonderIssueIndexes(tab, compatibility = null) {
  const wonderTab = tab || (state.bundle && state.bundle.tabs && state.bundle.tabs.wonders);
  const sections = wonderTab && wonderTab.model && Array.isArray(wonderTab.model.sections)
    ? wonderTab.model.sections
    : [];
  const out = new Set();
  const bySection = compatibility && compatibility.bySection instanceof Map ? compatibility.bySection : null;
  sections.forEach((section, idx) => {
    if (bySection && bySection.has(idx)) {
      out.add(idx);
      return;
    }
    const validationError = validateWonderSection(section, idx);
    if (validationError) out.add(idx);
  });
  return out;
}

function filterDistrictSectionsForScenarioFallback(bundle) {
  const b = bundle || state.bundle;
  if (!b || b.mode !== 'scenario' || !b.tabs || !b.tabs.districts) return;
  const districtTab = b.tabs.districts;
  const sourceDetails = districtTab.sourceDetails || {};
  const effectiveSource = String(districtTab.effectiveSource || '').toLowerCase();
  if (effectiveSource !== 'default' || sourceDetails.hasScenario) return;
  const sections = districtTab.model && Array.isArray(districtTab.model.sections)
    ? districtTab.model.sections
    : [];
  if (sections.length <= 0) return;

  let working = sections.slice();
  let changed = true;
  while (changed) {
    changed = false;
    const districtNameSet = toNormalizedLookupSet(working.map((section) => getFieldValue(section, 'name')));
    const context = buildDistrictCompatibilityContext(b, working);
    const next = [];
    working.forEach((section, idx) => {
      const issues = collectDistrictDependencyIssues(section, idx, context, districtNameSet);
      if (issues.length > 0) {
        changed = true;
      } else {
        next.push(section);
      }
    });
    working = next;
  }

  if (working.length === sections.length) return;
  districtTab.model.sections = working;
  districtTab.filteredFromDefault = {
    applied: true,
    removedCount: sections.length - working.length,
    keptCount: working.length,
    originalCount: sections.length
  };
}

function filterWonderSectionsForScenarioFallback(bundle) {
  const b = bundle || state.bundle;
  if (!b || b.mode !== 'scenario' || !b.tabs || !b.tabs.wonders) return;
  const wonderTab = b.tabs.wonders;
  const sourceDetails = wonderTab.sourceDetails || {};
  const effectiveSource = String(wonderTab.effectiveSource || '').toLowerCase();
  if (effectiveSource === 'scenario' || sourceDetails.hasScenario) return;
  const sections = wonderTab.model && Array.isArray(wonderTab.model.sections)
    ? wonderTab.model.sections
    : [];
  if (sections.length <= 0) return;

  const context = buildWonderCompatibilityContext(b);
  const kept = [];
  sections.forEach((section, idx) => {
    const issues = collectWonderDependencyIssues(section, idx, context);
    const validationError = validateWonderSection(section, idx);
    if (issues.length > 0 || validationError) return;
    kept.push(section);
  });
  if (kept.length === sections.length) return;
  wonderTab.model.sections = kept;
  wonderTab.filteredFromScenarioFallback = {
    applied: true,
    source: effectiveSource || 'effective',
    removedCount: sections.length - kept.length,
    keptCount: kept.length,
    originalCount: sections.length
  };
}

function validateDistrictSection(section, index) {
  const paths = tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths')).map((p) => String(p || '').trim()).filter(Boolean);
  const label = getDistrictSectionDisplay(section, index).primary;
  const expectedCount = getExpectedDistrictImagePathCount(section, paths);
  if (paths.length !== expectedCount) {
    if (getFieldValue(section, 'vary_img_by_culture') === '1') {
      return `${label}: Vary Art By Culture requires exactly 5 image paths (current: ${paths.length}).`;
    }
    if (getFieldValue(section, 'align_to_coast') === '1') {
      return `${label}: Align To Coast requires exactly 4 image paths (NW, NE, SE, SW) (current: ${paths.length}).`;
    }
    if (expectedCount === 1) {
      return `${label}: District requires exactly 1 image path (current: ${paths.length}).`;
    }
    return `${label}: District requires exactly ${expectedCount} image paths (current: ${paths.length}).`;
  }
  return '';
}

function validateWonderSection(section, index) {
  const name = normalizeConfigToken(getFieldValue(section, 'name'));
  const label = name || `Wonder District ${index + 1}`;
  if (!name) return `${label}: Wonder Name is required.`;
  if (parseConfigBool(getFieldValue(section, 'enable_img_alt_dir'))) {
    const missing = [];
    if (!hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_construct_row'))) missing.push('Alt Construct Row');
    if (!hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_construct_column'))) missing.push('Alt Construct Column');
    if (!hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_row'))) missing.push('Alt Completed Row');
    if (!hasExplicitConfigInteger(getFieldValue(section, 'img_alt_dir_column'))) missing.push('Alt Completed Column');
    if (missing.length > 0) {
      return `${label}: Enable Alt Direction Art requires values for ${missing.join(', ')}.`;
    }
  }
  return '';
}

function getSectionValidationError() {
  if (!state.bundle || !state.bundle.tabs) return '';
  if (getTabDirtyCount('districts') > 0) {
    const districtTab = state.bundle.tabs.districts;
    if (districtTab && districtTab.model && Array.isArray(districtTab.model.sections)) {
      for (let i = 0; i < districtTab.model.sections.length; i += 1) {
        const err = validateDistrictSection(districtTab.model.sections[i], i);
        if (err) return err;
      }
    }
  }
  if (getTabDirtyCount('wonders') > 0) {
    const wonderTab = state.bundle.tabs.wonders;
    if (wonderTab && wonderTab.model && Array.isArray(wonderTab.model.sections)) {
      for (let i = 0; i < wonderTab.model.sections.length; i += 1) {
        const err = validateWonderSection(wonderTab.model.sections[i], i);
        if (err) return err;
      }
    }
  }
  return '';
}

function getFilePickerOptionsForSectionField(schemaField, currentValue = '') {
  const key = String(schemaField && schemaField.key || '').toLowerCase();
  const normalizedValue = String(currentValue || '').trim();
  const picker = {};
  if (normalizedValue) {
    picker.defaultPath = normalizedValue;
  } else if (state.settings && state.settings.c3xPath) {
    picker.defaultPath = String(state.settings.c3xPath);
  } else if (state.settings && state.settings.civ3Path) {
    picker.defaultPath = String(state.settings.civ3Path);
  }
  if (key.includes('ini')) {
    picker.filters = [{ name: 'INI Files', extensions: ['ini'] }, { name: 'All Files', extensions: ['*'] }];
  } else if (key.includes('pcx') || key.includes('img_path') || key.includes('img_paths') || key.includes('path')) {
    picker.filters = [{ name: 'Art Files', extensions: ['pcx', 'flc', 'ini'] }, { name: 'All Files', extensions: ['*'] }];
  }
  return picker;
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
  const scenarioDir = getActiveScenarioDir();
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
  const scenarioDir = getActiveScenarioDir();
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

function normalizeHelpFieldKey(key) {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const FIELD_HELP_NOTES = {
  tabs: {
    civilizations: {
      civilizationgender: 'Grammar gender used by some in-game labels and text references for the civ.',
      defaultcolor: 'Palette slot index used as the civilization\'s default map/interface color.',
      diplomacytextindex: 'Selects which diplomacy.txt dialogue set this civilization uses.',
      favoritegovernment: 'AI preference: when changing governments, it tends to choose this if available.',
      shunnedgovernment: 'AI avoidance: this government is deprioritized when alternatives are available.',
      aggressionlevel: 'AI aggression setting. In practice, levels 4 and 5 behave nearly the same.'
    },
    units: {
      requiredtech: 'Technology that must be known before this unit can be built.',
      upgradeto: 'Unit this one upgrades into when upgrade conditions are met.'
    },
    improvements: {
      obsoleteby: 'Technology that obsoletes this improvement or wonder.',
      reqadvance: 'Technology required before this improvement or wonder can be built.'
    }
  },
  sections: {
    RULE: {
      minimumresearchtime: 'Hard lower bound on turns to complete research, regardless of cost.',
      maximumresearchtime: 'Hard upper bound on turns before research auto-completes.',
      futuretechcost: 'Base cost factor used when calculating repeated Future Tech research.',
      startingtreasury: 'Starting gold each civilization begins with before difficulty modifiers.',
      foodconsumptionpercitizen: 'Food consumed per population point each turn.',
      roadmovementrate: 'Controls road speed by setting how many road tiles one movement point can cover.',
      upgradecost: 'Gold cost factor for unit upgrades (based on shield cost difference).',
      maxcity1size: 'Population limit where a town must become a city.',
      maxcity2size: 'Population limit where a city must become a metropolis.',
      towndefencebonus: 'Defensive bonus percentage for towns.',
      citydefencebonus: 'Defensive bonus percentage for cities.',
      metropolisdefencebonus: 'Defensive bonus percentage for metropolises.',
      fortressdefencebonus: 'Defensive bonus percentage for units in fortresses.',
      fortificationsdefencebonus: 'Defensive bonus percentage for fortified units.'
    },
    RACE: {
      buildoften: 'AI preference flags for unit/improvement flavors to prioritize; more than a few flags can be set.',
      buildnever: 'AI exclusion flags for unit/improvement flavors to avoid building.'
    },
    WSIZ: {
      numberofcivs: 'Suggested civilization count for this world size preset.',
      distancebetweencivs: 'Starting-position spacing target used by map generation.',
      optimalnumberofcities: 'Reference city-count target used by AI/economy balancing formulas.',
      techrate: 'Research cost multiplier for this world size.'
    },
    GAME: {
      cityeliminationcount: 'Elimination threshold: 1 means a civ is eliminated when it loses its last city.',
      cityelimination: 'Elimination threshold: 1 means a civ is eliminated when it loses its last city.'
    },
    LEAD: {
      color: 'Palette slot index for this player\'s in-game color.'
    }
  }
};

function getFieldHelpNote({ tabKey = '', sectionCode = '', fieldKey = '' } = {}) {
  const key = normalizeHelpFieldKey(fieldKey);
  if (!key) return '';
  const byTab = FIELD_HELP_NOTES.tabs[String(tabKey || '').toLowerCase()];
  if (byTab && byTab[key]) return byTab[key];
  const bySection = FIELD_HELP_NOTES.sections[String(sectionCode || '').toUpperCase()];
  if (bySection && bySection[key]) return bySection[key];
  return '';
}

function withFieldHelp(baseText, context = {}) {
  const tip = String(baseText || '').trim();
  const note = getFieldHelpNote(context);
  if (!note) return tip;
  return `${tip}\nDescription: ${note}`;
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
    reqadvance: 'technologies',
    obsoleteby: 'technologies',
    reqresource1: 'resources',
    reqresource2: 'resources',
    unitproduced: 'units',
    gainineverycity: 'improvements',
    gainoncontinent: 'improvements',
    doubleshappiness: 'improvements'
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
    ],
    civilizationgender: [
      { value: '0', label: 'Masculine' },
      { value: '1', label: 'Feminine' },
      { value: '2', label: 'Neuter' }
    ],
    leadergender: [
      { value: '0', label: 'Male' },
      { value: '1', label: 'Female' }
    ],
    plurality: [
      { value: '0', label: 'Singular' },
      { value: '1', label: 'Plural' }
    ],
    defaultcolor: Array.from({ length: 32 }, (_v, idx) => ({ value: String(idx), label: `Color ${idx}` })),
    uniquecolor: Array.from({ length: 32 }, (_v, idx) => ({ value: String(idx), label: `Color ${idx}` }))
  },
  scenarioSettings: {
    basetimeunit: [
      { value: '0', label: 'Turns' },
      { value: '1', label: 'Years' },
      { value: '2', label: 'Months' },
      { value: '3', label: 'Weeks' }
    ],
    startmonth: [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ],
    alliancevictorytype: [
      { value: '0', label: 'Individual' },
      { value: '1', label: 'Coalition' }
    ]
  },
  players: {
    difficulty: [
      { value: 'Any', label: 'Any' },
      { value: '0', label: 'Difficulty 1' },
      { value: '1', label: 'Difficulty 2' },
      { value: '2', label: 'Difficulty 3' },
      { value: '3', label: 'Difficulty 4' },
      { value: '4', label: 'Difficulty 5' },
      { value: '5', label: 'Difficulty 6' },
      { value: '6', label: 'Difficulty 7' },
      { value: '7', label: 'Difficulty 8' },
      { value: '8', label: 'Difficulty 9' },
      { value: '9', label: 'Difficulty 10' }
    ],
    genderofleadername: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
      { value: '0', label: 'Male' },
      { value: '1', label: 'Female' }
    ]
  },
  rules: {
    defaultdifficultylevel: [
      { value: '0', label: 'Difficulty 1' },
      { value: '1', label: 'Difficulty 2' },
      { value: '2', label: 'Difficulty 3' },
      { value: '3', label: 'Difficulty 4' },
      { value: '4', label: 'Difficulty 5' },
      { value: '5', label: 'Difficulty 6' },
      { value: '6', label: 'Difficulty 7' },
      { value: '7', label: 'Difficulty 8' },
      { value: '8', label: 'Difficulty 9' },
      { value: '9', label: 'Difficulty 10' }
    ]
  }
};

const BIQ_FIELD_HIDDEN = {
  all: new Set(['byte_length', 'datalength', 'data_length', 'note']),
  resources: new Set(['icon', 'question_mark', 'prerequisite', 'name']),
  improvements: new Set(['question_mark', 'name']),
  units: new Set(['iconindex', 'question_mark', 'requiredtech', 'name']),
  technologies: new Set(['advanceicon', 'question_mark', 'name', 'prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4']),
  governments: new Set(['question_mark', 'name']),
  civilizations: new Set([
    'name',
    'question_mark',
    'bonuses',
    'c3cbonuses',
    'civilizationtraits',
    'build_often',
    'buildoften',
    'never_build',
    'buildnever',
    'governorsettings',
    'flavors',
    'uniquecivilizationcounter'
  ]),
  eras: new Set(['question_mark'])
};

const QUINT_UNIT_RULE_VISIBLE_KEYS = new Set([
  'name',
  'requiredresource1', 'requiredresource2', 'requiredresource3',
  'upgradeto',
  'unitclass',
  'attack', 'defence', 'movement', 'bombardstrength', 'bombardrange', 'rateoffire', 'airdefence',
  'hitpointbonus', 'operationalrange', 'capacity', 'populationcost', 'shieldcost', 'workerstrengthfloat',
  'requiressupport', 'zoneofcontrol', 'bombardeffects', 'createscraters',
  'offence', 'defencestrategy', 'explorestrategy', 'terraform', 'settle', 'king', 'artillery',
  'cruisemissileunit', 'icbm', 'tacticalnuke', 'leaderunit', 'armyunit', 'flagunit',
  'navalpower', 'navaltransport', 'navalcarrier', 'navalmissiletransport',
  'airbombard', 'airdefencestrategy', 'airtransport',
  'buildcity', 'buildcolony', 'buildroad', 'buildrailroad', 'buildmine', 'irrigate', 'buildfort',
  'clearforest', 'clearjungle', 'plantforest', 'clearpollution', 'automate', 'joincity',
  'ptwbuildairfield', 'ptwbuildradartower', 'ptwbuildoutpost',
  'load', 'unload', 'airlift', 'airdrop', 'pillage', 'bombard', 'buildarmy', 'finishimprovement', 'upgrade', 'enslaveresultsin',
  'skipturn', 'wait', 'goto', 'fortify', 'disband',
  'bomb', 'rebase', 'precisionbombing', 'recon', 'intercept',
  'allterrainasroads', 'amphibiousunit', 'army', 'blitz', 'cruisemissile', 'detectinvisible',
  'draftable', 'footsoldier', 'hiddennationality', 'immobile', 'infinitebombardrange', 'invisible',
  'leader', 'lethallandbombardment', 'lethalseabombardment', 'nuclearweapon', 'radar',
  'rangedattackanimations', 'requiresescort', 'rotatebeforeattack', 'sinksinocean', 'sinksinsea',
  'startsgoldenage', 'stealth', 'tacticalmissile', 'transportsonlyairunits', 'transportsonlyfootunits',
  'transportsonlytacticalmissiles', 'wheeled',
  'availableto', 'stealth_target'
]);

const QUINT_IMPROVEMENT_RULE_VISIBLE_KEYS = new Set([
  'civilopediaentry',
  'cost', 'maintenancecost', 'culture', 'production', 'pollution', 'wonder', 'smallwonder', 'improvement',
  'bombarddefence', 'navalbombarddefence', 'airpower', 'navalpower', 'defencebonus', 'navaldefencebonus',
  'veteranairunits', 'veteranunits', 'veteranseaunits',
  'stealthattackbarrier', 'allowsnuclearweapons', 'decreasessuccessofmissiles',
  'doublecombatvsbarbarians', 'buildarmieswithoutleader', 'buildlargerarmies',
  'increaseschanceofleaderappearance', 'safeseatravel', 'increasedshipmovement', 'plustwoshipmovement',
  'cheaperupgrades', 'allowshealinginenemyterritory', 'increasedarmyvalue', 'doublecitydefences',
  'increasesfoodinwater', 'doublescitygrowthrate', 'doublecitygrowth', 'allowcitylevel2', 'allowcitylevel3',
  'increasedresearch', 'doublesresearchoutput', 'twofreeadvances', 'gainanytechsknownbytwocivs',
  'gainineverycity', 'gainoncontinent', 'unitproduced', 'unitfrequency', 'obsoleteby',
  'reqimprovement', 'numreqbuildings', 'reqgovernment', 'reqadvance', 'mustbenearriver',
  'coastalinstallation', 'requiresvictoriousarmy', 'mustbenearwater', 'requireseliteship', 'armiesrequired',
  'reqresource1', 'reqresource2', 'goodsmustbeincityradius',
  'allowairtrade', 'allowwatertrade', 'capitalization', 'increasedtaxes', 'increasestradeinwater',
  'increasedtrade', 'reducescorruption', 'forbiddenpalace', 'paystrademaintenance', 'treasuryearnsinterest',
  'happy', 'happyall', 'unhappy', 'unhappyall', 'increasesluxurytrade', 'increasedluxuries',
  'doubleshappiness', 'reduceswarweariness', 'reducewarweariness', 'empirereduceswarweariness',
  'centerofempire', 'replacesotherwiththistag', 'removepoppollution', 'reducebldgpollution',
  'mayexplodeormeltdown', 'doublessacrifice', 'increasesshieldsinwater', 'resistanttobribery',
  'spaceshippart', 'buildspaceshipparts', 'touristattraction', 'allowspymissions', 'allowdiplomaticvictory',
  'militaristic', 'religious', 'commercial', 'industrious', 'expansionist', 'scientific', 'agricultural', 'seafaring',
  'charmbarrier', 'actsasgeneraltelepad',
  'flavor_1', 'flavor_2', 'flavor_3', 'flavor_4', 'flavor_5', 'flavor_6', 'flavor_7'
]);

const QUINT_GOVERNMENT_RULE_VISIBLE_KEYS = new Set([
  'civilopediaentry', 'prerequisitetechnology',
  'corruption',
  'sciencecap', 'workerrate', 'assimilationchance', 'draftlimit', 'militarypolicelimit',
  'defaulttype', 'transitiontype', 'requiresmaintenance', 'tilepenalty', 'commercebonus', 'xenophobic', 'forceresettlement',
  'diplomatlevel', 'spylevel', 'immuneto',
  'freeunits', 'costperunit', 'freeunitspertown', 'freeunitspercity', 'freeunitspermetropolis',
  'hurrying',
  'warweariness',
  'performance_of_this_government_versus_government_0',
  'performance_of_this_government_versus_government_1',
  'performance_of_this_government_versus_government_2',
  'performance_of_this_government_versus_government_3',
  'performance_of_this_government_versus_government_4',
  'performance_of_this_government_versus_government_5',
  'performance_of_this_government_versus_government_6',
  'performance_of_this_government_versus_government_7',
  'briberymodifier', 'resistancemodifier',
  'questionmarkone', 'questionmarktwo', 'questionmarkthree', 'questionmarkfour',
  'rulertitlepairsused',
  'malerulertitle1', 'malerulertitle2', 'malerulertitle3', 'malerulertitle4',
  'femalerulertitle1', 'femalerulertitle2', 'femalerulertitle3', 'femalerulertitle4'
]);

const QUINT_CIV_RULE_VISIBLE_KEYS = new Set([
  'civilopediaentry', 'noun', 'adjective', 'civilizationgender', 'plurality', 'culturegroup',
  'militaristic', 'religious', 'expansionist', 'agricultural', 'commercial', 'industrious', 'scientific', 'seafaring',
  'manyoffensivelandunits', 'nooffensivelandunits',
  'manydefensivelandunits', 'nodefensivelandunits',
  'manyartillery', 'noartillery',
  'manysettlers', 'nosettlers',
  'manyworkers', 'noworkers',
  'manyships', 'noships',
  'manyairunits', 'noairunits',
  'manygrowth', 'nogrowth',
  'manyproduction', 'noproduction',
  'manyhappiness', 'nohappiness',
  'manyscience', 'noscience',
  'manywealth', 'nowealth',
  'manytrade', 'notrade',
  'manyexploration', 'noexploration',
  'manyculture', 'noculture',
  'leadertitle', 'leadername', 'leadergender', 'kingunit',
  'favoritegovernment', 'shunnedgovernment', 'aggressionlevel',
  'numcitynames', 'numgreatleaders', 'numscientificleaders',
  'forwardfilename_for_era_0', 'forwardfilename_for_era_1', 'forwardfilename_for_era_2', 'forwardfilename_for_era_3',
  'reversefilename_for_era_0', 'reversefilename_for_era_1', 'reversefilename_for_era_2', 'reversefilename_for_era_3',
  'freetech1index', 'freetech2index', 'freetech3index', 'freetech4index',
  'managecitizens', 'manageproduction', 'nowonders', 'nosmallwonders', 'emphasizefood', 'emphasizeshields', 'emphasizetrade',
  'flavor_1', 'flavor_2', 'flavor_3', 'flavor_4', 'flavor_5', 'flavor_6', 'flavor_7',
  'uniquecolor', 'defaultcolor',
  'diplomacytextindex', 'questionmark'
]);

const QUINT_TECH_RULE_VISIBLE_KEYS = new Set([
  'civilopediaentry',
  'era', 'cost', 'advanceicon',
  'x', 'y',
  'prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4',
  'notrequiredforadvancement', 'enablesrecycling', 'bonustech', 'permitssacrifice', 'revealmap',
  'enablesdiplomats', 'enablesalliances', 'enablesrop', 'enablesmpp', 'enablestradeembargoes', 'enablesmaptrading', 'enablescommunicationtrading',
  'cannotbetraded', 'doubleswealth', 'enablesseatrade', 'enablesoceantrade',
  'enablesirrigationwithoutfreshwater', 'disablesfloodplaindisease', 'doublesworkrate',
  'enablesbridges', 'enablesconscription', 'enablesmobilizationlevels', 'enablesprecisionbombing',
  'flavor_1', 'flavor_2', 'flavor_3', 'flavor_4', 'flavor_5', 'flavor_6', 'flavor_7'
]);

const CIV_NOTE_LIST_COUNT_KEYS = new Set(['numcitynames', 'numgreatleaders', 'numscientificleaders']);

const UNIT_MULTI_VALUE_FIELD_KEYS = new Set(['stealthtarget']);

const UNIT_ABILITY_OPTION_KEYS = [
  'allterrainasroads', 'amphibiousunit', 'army', 'blitz', 'cruisemissile', 'detectinvisible',
  'draftable', 'flagunit', 'footsoldier', 'hiddennationality', 'immobile', 'infinitebombardrange',
  'invisible', 'king', 'leader', 'lethallandbombardment', 'lethalseabombardment', 'nuclearweapon',
  'radar', 'rangedattackanimations', 'requiresescort', 'rotatebeforeattack', 'sinksinocean',
  'sinksinsea', 'startsgoldenage', 'stealth', 'tacticalmissile', 'transportsonlyairunits',
  'transportsonlyfootunits', 'transportsonlytacticalmissiles', 'wheeled'
];

const UNIT_BOTTOM_LIST_HIDDEN_KEYS = new Set([
  ...UNIT_ABILITY_OPTION_KEYS,
  'availableto',
  'stealthtarget',
  'numstealthtargets',
  'telepadrange',
  'numlegalunittelepads',
  'numlegalbuildingtelepads'
]);

const BIQ_STRUCTURE_FIELD_HIDDEN = {
  all: new Set(['byte_length', 'data_length', 'datalength', 'note', 'civilopediaentry', 'possible_resources_mask']),
  GAME: new Set(['playable_civ_ids', 'numberofplayablecivs']),
  LEAD: new Set([]),
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

const GAME_PANEL_DEFINITIONS = [
  {
    id: 'scenario',
    label: 'Scenario',
    groups: ['Scenario', 'Map Options', 'Player Options', 'Game Options', 'Time Options', 'Base Unit of Time', 'Start Date', 'MP Timers', 'Time Scale']
  },
  {
    id: 'victory',
    label: 'Victory Point Limits',
    groups: ['Victory Point Winning Conditions', 'Victory Points']
  },
  {
    id: 'alliances',
    label: 'Locked Alliances',
    groups: ['No Alliances', 'Alliance 1', 'Alliance 2', 'Alliance 3', 'Alliance 4', 'Victory Type']
  },
  {
    id: 'players',
    label: 'Players',
    groups: []
  },
  {
    id: 'disasters',
    label: 'Disasters',
    groups: ['Plague Information', 'Volcanos']
  }
];

const BIQ_STRUCTURE_RULE_SCHEMAS = {
  GAME: {
    order: [
      'title', 'description', 'scenariosearchfolders',
      'debugmode',
      'numberofplayablecivs', 'playable_civ',
      'defaultvictoryconditions',
      'dominationenabled', 'spaceraceenabled', 'diplomacticenabled', 'conquestenabled', 'culturalenabled', 'wondervictoryenabled',
      'culturallylinkedstart', 'restartplayersenabled', 'preserverandomseed', 'acceleratedproduction', 'eliminationenabled', 'regicideenabled', 'massregicideenabled', 'allowculturalconversions',
      'autoplacekings', 'placecaptureunits', 'autoplacevictorylocations', 'mapvisible', 'retainculture',
      'usetimelimit', 'turntimelimit', 'minutetimelimit',
      'basetimeunit',
      'startyear', 'startmonth', 'startweek',
      'mpbasetime', 'mpunittime', 'mpcitytime',
      'turns_in_time_section_0', 'time_per_turn_in_time_section_0',
      'turns_in_time_section_1', 'time_per_turn_in_time_section_1',
      'turns_in_time_section_2', 'time_per_turn_in_time_section_2',
      'turns_in_time_section_3', 'time_per_turn_in_time_section_3',
      'turns_in_time_section_4', 'time_per_turn_in_time_section_4',
      'turns_in_time_section_5', 'time_per_turn_in_time_section_5',
      'turns_in_time_section_6', 'time_per_turn_in_time_section_6',
      'victorypointlimit', 'cityeliminationcount', 'onecityculturewinlimit', 'allcitiesculturewinlimit', 'dominationterrainpercent', 'dominationpopulationpercent', 'respawnflagunits', 'captureanyflag',
      'wondervp', 'defeatingopposingunitvp', 'advancementvp', 'cityconquestvp', 'victorypointvp', 'capturespecialunitvp', 'goldforcapture',
      'alliance0', 'alliance1', 'alliance2', 'alliance3', 'alliance4', 'alliancevictorytype',
      'permitplagues', 'plaugename', 'plaguename', 'plagueearlieststart', 'plaguevariation', 'plagueduration', 'plaguestrength', 'plaguegraceperiod', 'plaguemaxoccurance',
      'eruptionperiod'
    ],
    fields: {
      title: { group: 'Scenario', control: 'text' },
      description: { group: 'Scenario', control: 'text' },
      scenariosearchfolders: { group: 'Scenario', control: 'text', label: 'Scenario Search Folders' },
      debugmode: { group: 'Map Options', control: 'bool' },
      numberofplayablecivs: { group: 'Player Options', control: 'number', min: 1, max: 32, label: 'Number of Players' },
      playable_civ: { group: 'Player Options', control: 'reference', label: 'Playable Civilization' },
      defaultvictoryconditions: { group: 'Game Options', control: 'bool' },
      dominationenabled: { group: 'Game Options', control: 'bool' },
      spaceraceenabled: { group: 'Game Options', control: 'bool' },
      diplomacticenabled: { group: 'Game Options', control: 'bool' },
      conquestenabled: { group: 'Game Options', control: 'bool' },
      culturalenabled: { group: 'Game Options', control: 'bool' },
      wondervictoryenabled: { group: 'Game Options', control: 'bool' },
      culturallylinkedstart: { group: 'Game Options', control: 'bool' },
      restartplayersenabled: { group: 'Game Options', control: 'bool' },
      preserverandomseed: { group: 'Game Options', control: 'bool' },
      acceleratedproduction: { group: 'Game Options', control: 'bool' },
      eliminationenabled: { group: 'Game Options', control: 'bool' },
      regicideenabled: { group: 'Game Options', control: 'bool' },
      massregicideenabled: { group: 'Game Options', control: 'bool' },
      allowculturalconversions: { group: 'Game Options', control: 'bool' },
      autoplacekings: { group: 'Game Options', control: 'bool' },
      placecaptureunits: { group: 'Game Options', control: 'bool' },
      autoplacevictorylocations: { group: 'Game Options', control: 'bool' },
      mapvisible: { group: 'Game Options', control: 'bool' },
      retainculture: { group: 'Game Options', control: 'bool' },
      usetimelimit: { group: 'Time Options', control: 'bool' },
      turntimelimit: { group: 'Time Options', control: 'number', min: 0, label: 'Turns' },
      minutetimelimit: { group: 'Time Options', control: 'number', min: 0, label: 'Minutes' },
      basetimeunit: { group: 'Base Unit of Time', control: 'number' },
      startyear: { group: 'Start Date', control: 'number' },
      startmonth: { group: 'Start Date', control: 'select' },
      startweek: { group: 'Start Date', control: 'number', min: 0 },
      mpbasetime: { group: 'MP Timers', control: 'number', min: 0 },
      mpunittime: { group: 'MP Timers', control: 'number', min: 0 },
      mpcitytime: { group: 'MP Timers', control: 'number', min: 0 },
      victorypointlimit: { group: 'Victory Point Winning Conditions', control: 'number', min: 0 },
      cityeliminationcount: { group: 'Victory Point Winning Conditions', control: 'number', min: 0 },
      onecityculturewinlimit: { group: 'Victory Point Winning Conditions', control: 'number', min: 0, label: 'Culture Value for 1 City' },
      allcitiesculturewinlimit: { group: 'Victory Point Winning Conditions', control: 'number', min: 0, label: 'Culture Value for Civilization' },
      dominationterrainpercent: { group: 'Victory Point Winning Conditions', control: 'number', min: 0, max: 100, label: '% Terrain for Domination' },
      dominationpopulationpercent: { group: 'Victory Point Winning Conditions', control: 'number', min: 0, max: 100, label: '% Population for Domination' },
      respawnflagunits: { group: 'Victory Point Winning Conditions', control: 'bool' },
      captureanyflag: { group: 'Victory Point Winning Conditions', control: 'bool' },
      wondervp: { group: 'Victory Points', control: 'number', min: 0 },
      defeatingopposingunitvp: { group: 'Victory Points', control: 'number', min: 0 },
      advancementvp: { group: 'Victory Points', control: 'number', min: 0 },
      cityconquestvp: { group: 'Victory Points', control: 'number', min: 0 },
      victorypointvp: { group: 'Victory Points', control: 'number', min: 0 },
      capturespecialunitvp: { group: 'Victory Points', control: 'number', min: 0 },
      goldforcapture: { group: 'Victory Points', control: 'number', min: 0 },
      alliance0: { group: 'Alliance 1', control: 'text', label: 'Alliance Name' },
      alliance1: { group: 'Alliance 2', control: 'text', label: 'Alliance Name' },
      alliance2: { group: 'Alliance 3', control: 'text', label: 'Alliance Name' },
      alliance3: { group: 'Alliance 4', control: 'text', label: 'Alliance Name' },
      alliance4: { group: 'No Alliances', control: 'text', label: 'No Alliances' },
      alliancevictorytype: { group: 'Victory Type', control: 'select' },
      permitplagues: { group: 'Plague Information', control: 'bool' },
      plaugename: { group: 'Plague Information', control: 'text' },
      plaguename: { group: 'Plague Information', control: 'text' },
      plagueearlieststart: { group: 'Plague Information', control: 'number', min: 0 },
      plaguevariation: { group: 'Plague Information', control: 'number', min: 0 },
      plagueduration: { group: 'Plague Information', control: 'number', min: 0 },
      plaguestrength: { group: 'Plague Information', control: 'number', min: 0 },
      plaguegraceperiod: { group: 'Plague Information', control: 'number', min: 0 },
      plaguemaxoccurance: { group: 'Plague Information', control: 'number', min: 0 },
      eruptionperiod: { group: 'Volcanos', control: 'number', min: 0 }
    }
  },
  LEAD: {
    order: [
      'civ', 'leadername', 'genderofleadername', 'color',
      'startcash', 'government', 'initialera', 'difficulty', 'humanplayer', 'customcivdata', 'skipfirstturn', 'startembassies',
      'numberofdifferentstartunits',
      'starting_units_of_type_settler', 'starting_units_of_type_worker',
      'numberofstartingtechnologies'
    ],
    fields: {
      civ: { group: 'Player', control: 'reference', label: 'Civilization' },
      leadername: { group: 'Civilization Details', control: 'text', label: 'Leader Name' },
      genderofleadername: { group: 'Civilization Details', control: 'select', label: 'Gender' },
      color: { group: 'Civilization Details', control: 'number', min: 0, max: 31, label: 'Team Color' },
      startcash: { group: 'Player', control: 'number', min: 0, label: 'Starting Treasury' },
      government: { group: 'Player', control: 'reference', label: 'Government' },
      initialera: { group: 'Player', control: 'reference', label: 'Initial Era' },
      difficulty: { group: 'Player', control: 'select', label: 'Difficulty Level' },
      humanplayer: { group: 'Player', control: 'bool', label: 'Human Player' },
      customcivdata: { group: 'Player', control: 'bool', label: 'Civilization Defaults' },
      skipfirstturn: { group: 'Player', control: 'bool', label: 'Skip 1st Turn' },
      startembassies: { group: 'Player', control: 'bool', label: 'Starts with Embassies' },
      numberofdifferentstartunits: { group: 'Starting Units', control: 'number', min: 0, label: 'How Many Types' },
      numberofstartingtechnologies: { group: 'Free Techs', control: 'number', min: 0, label: 'How Many' }
    }
  },
  RULE: {
    order: [
      'slave', 'startunit1', 'startunit2', 'scout', 'battlecreatedunit', 'buildarmyunit', 'basicbarbarian', 'advancedbarbarian', 'barbarianseaunit', 'flagunit',
      'townname', 'cityname', 'metropolisname', 'maxcity1size', 'maxcity2size',
      'futuretechcost', 'minimumresearchtime', 'maximumresearchtime',
      'wltkdminimumpop', 'citizensaffectedbyhappyface', 'turnpenaltyforwhip', 'draftturnpenalty', 'chanceofrioting',
      'chancetointerceptairmissions', 'chancetointerceptstealthmissions', 'citiesforarmy',
      'citizenvalueinshields', 'shieldcostingold', 'basecapitalizationrate', 'forestvalueinshields', 'shieldvalueingold',
      'towndefencebonus', 'citydefencebonus', 'metropolisdefencebonus', 'fortressdefencebonus', 'riverdefensivebonus', 'fortificationsdefencebonus', 'citizendefensivebonus', 'buildingdefensivebonus',
      'numspaceshipparts',
      'roadmovementrate', 'upgradecost', 'foodconsumptionpercitizen', 'startingtreasury', 'goldenageduration', 'defaultdifficultylevel', 'defaultmoneyresource',
      'questionmark1', 'questionmark2', 'questionmark3', 'questionmark4'
    ],
    fields: {
      slave: { group: 'Default Units', control: 'reference' },
      startunit1: { group: 'Default Units', control: 'reference' },
      startunit2: { group: 'Default Units', control: 'reference' },
      scout: { group: 'Default Units', control: 'reference' },
      battlecreatedunit: { group: 'Default Units', control: 'reference' },
      buildarmyunit: { group: 'Default Units', control: 'reference' },
      basicbarbarian: { group: 'Default Units', control: 'reference' },
      advancedbarbarian: { group: 'Default Units', control: 'reference' },
      barbarianseaunit: { group: 'Default Units', control: 'reference' },
      flagunit: { group: 'Default Units', control: 'reference' },
      townname: { group: 'City Size Limits', control: 'text' },
      cityname: { group: 'City Size Limits', control: 'text' },
      metropolisname: { group: 'City Size Limits', control: 'text' },
      maxcity1size: { group: 'City Size Limits', control: 'number' },
      maxcity2size: { group: 'City Size Limits', control: 'number' },
      futuretechcost: { group: 'Technology', control: 'number' },
      minimumresearchtime: { group: 'Technology', control: 'number' },
      maximumresearchtime: { group: 'Technology', control: 'number' },
      wltkdminimumpop: { group: 'Citizen Mood', control: 'number' },
      citizensaffectedbyhappyface: { group: 'Citizen Mood', control: 'number' },
      turnpenaltyforwhip: { group: 'Citizen Mood', control: 'number' },
      draftturnpenalty: { group: 'Citizen Mood', control: 'number' },
      chanceofrioting: { group: 'Citizen Mood', control: 'number' },
      chancetointerceptairmissions: { group: 'Various Unit Abilities', control: 'number' },
      chancetointerceptstealthmissions: { group: 'Various Unit Abilities', control: 'number' },
      citiesforarmy: { group: 'Various Unit Abilities', control: 'number' },
      citizenvalueinshields: { group: 'Hurry Production/Wealth', control: 'number' },
      shieldcostingold: { group: 'Hurry Production/Wealth', control: 'number' },
      basecapitalizationrate: { group: 'Hurry Production/Wealth', control: 'number' },
      forestvalueinshields: { group: 'Hurry Production/Wealth', control: 'number' },
      shieldvalueingold: { group: 'Hurry Production/Wealth', control: 'number' },
      town_defence_bonus: { group: 'Defensive Bonuses', control: 'number' },
      towndefencebonus: { group: 'Defensive Bonuses', control: 'number' },
      city_defence_bonus: { group: 'Defensive Bonuses', control: 'number' },
      citydefencebonus: { group: 'Defensive Bonuses', control: 'number' },
      metropolis_defence_bonus: { group: 'Defensive Bonuses', control: 'number' },
      metropolisdefencebonus: { group: 'Defensive Bonuses', control: 'number' },
      fortress_defence_bonus: { group: 'Defensive Bonuses', control: 'number' },
      fortressdefencebonus: { group: 'Defensive Bonuses', control: 'number' },
      river_defensive_bonus: { group: 'Defensive Bonuses', control: 'number' },
      riverdefensivebonus: { group: 'Defensive Bonuses', control: 'number' },
      riverdefencebonus: { group: 'Defensive Bonuses', control: 'number' },
      fortifications_defence_bonus: { group: 'Defensive Bonuses', control: 'number' },
      fortificationsdefencebonus: { group: 'Defensive Bonuses', control: 'number' },
      citizendefensivebonus: { group: 'Defensive Bonuses', control: 'number' },
      buildingdefensivebonus: { group: 'Defensive Bonuses', control: 'number' },
      numspaceshipparts: { group: 'Spaceship Parts', control: 'number' },
      roadmovementrate: { group: 'Other', control: 'number' },
      upgradecost: { group: 'Other', control: 'number' },
      foodconsumptionpercitizen: { group: 'Other', control: 'number' },
      startingtreasury: { group: 'Other', control: 'number' },
      goldenageduration: { group: 'Other', control: 'number' },
      defaultdifficultylevel: { group: 'Other', control: 'reference' },
      defaultmoneyresource: { group: 'Other', control: 'reference' },
      questionmark1: { group: 'Unknowns', control: 'number' },
      questionmark2: { group: 'Unknowns', control: 'number' },
      questionmark3: { group: 'Unknowns', control: 'number' },
      questionmark4: { group: 'Unknowns', control: 'number' },
      questionmarkone: { group: 'Unknowns', control: 'number' },
      questionmarktwo: { group: 'Unknowns', control: 'number' },
      questionmarkthree: { group: 'Unknowns', control: 'number' },
      questionmarkfour: { group: 'Unknowns', control: 'number' }
    }
  },
  ESPN: {
    order: ['civilopediaentry', 'description', 'missionperformedby', 'basecost'],
    fields: {
      civilopediaentry: { group: 'General', control: 'text', label: 'Civilopedia Entry' },
      description: { group: 'General', control: 'text', label: 'Description' },
      missionperformedby: { group: 'General', control: 'mission_performed_by', label: 'Mission Performed By' },
      basecost: { group: 'General', control: 'number', min: 0, label: 'Base Cost' }
    }
  },
  TERR: {
    order: [
      'civilopediaentry',
      'food', 'landmarkfood',
      'shields', 'landmarkshields',
      'commerce', 'landmarkcommerce',
      'foodbonus', 'landmarkfoodbonus',
      'shieldsbonus', 'landmarkshieldsbonus',
      'commercebonus', 'landmarkcommercebonus',
      'movementcost', 'landmarkmovementcost',
      'defencebonus', 'landmarkdefencebonus',
      'landmarkname', 'landmarkenabled',
      'allowcities', 'allowcolonies', 'allowairfields', 'allowoutposts', 'allowradartowers', 'allowforts',
      'impassable', 'impassablebywheeled',
      'terrainflags', 'diseasestrength',
      'pollutioneffect', 'workerjob',
      '__terrain_possible_resources',
      'questionmark', 'questionmark2'
    ],
    fields: {
      food: { group: 'Terrain Values', control: 'number', label: 'Food' },
      landmarkfood: { group: 'Terrain Values', control: 'number', label: 'Landmark Food' },
      shields: { group: 'Terrain Values', control: 'number', label: 'Shields' },
      landmarkshields: { group: 'Terrain Values', control: 'number', label: 'Landmark Shields' },
      commerce: { group: 'Terrain Values', control: 'number', label: 'Commerce' },
      landmarkcommerce: { group: 'Terrain Values', control: 'number', label: 'Landmark Commerce' },
      foodbonus: { group: 'Terrain Values', control: 'number', label: 'Irrigation Bonus' },
      landmarkfoodbonus: { group: 'Terrain Values', control: 'number', label: 'Landmark Irrigation Bonus' },
      shieldsbonus: { group: 'Terrain Values', control: 'number', label: 'Mining Bonus' },
      landmarkshieldsbonus: { group: 'Terrain Values', control: 'number', label: 'Landmark Mining Bonus' },
      commercebonus: { group: 'Terrain Values', control: 'number', label: 'Trade Bonus' },
      landmarkcommercebonus: { group: 'Terrain Values', control: 'number', label: 'Landmark Trade Bonus' },
      movementcost: { group: 'Terrain Values', control: 'number', min: 0, label: 'Movement Cost' },
      landmarkmovementcost: { group: 'Terrain Values', control: 'number', min: 0, label: 'Landmark Movement Cost' },
      defencebonus: { group: 'Terrain Values', control: 'number', label: 'Defence Bonus' },
      landmarkdefencebonus: { group: 'Terrain Values', control: 'number', label: 'Landmark Defence Bonus' },
      landmarkname: { group: 'Terrain Values', control: 'text', label: 'Landmark Terrain Name' },
      landmarkenabled: { group: 'Terrain Values', control: 'bool', label: 'Landmark Enabled' },
      allowcities: { group: 'Flags', control: 'bool', label: 'Allow Cities' },
      allowcolonies: { group: 'Flags', control: 'bool', label: 'Allow Colonies' },
      allowairfields: { group: 'Flags', control: 'bool', label: 'Allow Airfields' },
      allowoutposts: { group: 'Flags', control: 'bool', label: 'Allow Outposts' },
      allowradartowers: { group: 'Flags', control: 'bool', label: 'Allow Radar Towers' },
      allowforts: { group: 'Flags', control: 'bool', label: 'Allow Forts' },
      impassable: { group: 'Flags', control: 'bool', label: 'Impassable' },
      impassablebywheeled: { group: 'Flags', control: 'bool', label: 'Impassable by Wheeled Units' },
      terrainflags: { group: 'Flags', control: 'number', min: 0, label: 'Terrain Flags' },
      diseasestrength: { group: 'Flags', control: 'number', min: 0, label: 'Strength' },
      pollutioneffect: { group: 'Pollution / Terraform', control: 'reference', label: 'Pollution Yields' },
      workerjob: { group: 'Pollution / Terraform', control: 'reference', label: 'Worker Terraform Action' },
      __terrain_possible_resources: { group: 'Possible Resources', control: 'multi_ref', label: 'Resource list' },
      questionmark: { group: 'Unknown Parameters', control: 'number', label: 'Unknown 1' },
      questionmark2: { group: 'Unknown Parameters', control: 'number', label: 'Unknown 2' }
    }
  },
  TFRM: {
    order: ['civilopediaentry', 'turnstocomplete', 'requiredadvance', 'requiredresource1', 'requiredresource2', 'order'],
    fields: {
      civilopediaentry: { group: 'General', control: 'text', label: 'Civilopedia Entry' },
      turnstocomplete: { group: 'General', control: 'number', min: 0, label: 'Turns To Complete' },
      requiredadvance: { group: 'Requirements', control: 'reference', label: 'Required Technology' },
      requiredresource1: { group: 'Requirements', control: 'reference', label: 'Required Resource 1' },
      requiredresource2: { group: 'Requirements', control: 'reference', label: 'Required Resource 2' },
      order: { group: 'General', control: 'text', label: 'Worker Order' }
    }
  },
  WSIZ: {
    order: ['numberofcivs', 'distancebetweencivs', 'width', 'height', 'optimalnumberofcities', 'techrate'],
    fields: {
      numberofcivs: { group: 'General', control: 'number', min: 0, max: 32, label: 'Number Of Civilizations' },
      distancebetweencivs: { group: 'General', control: 'number', min: 0, label: 'Distance Between Civilizations' },
      width: { group: 'Map Size', control: 'number', min: 66, max: 362, label: 'Map Width' },
      height: { group: 'Map Size', control: 'number', min: 66, max: 362, label: 'Map Height' },
      mapwidth: { group: 'Map Size', control: 'number', min: 66, max: 362, label: 'Map Width' },
      mapheight: { group: 'Map Size', control: 'number', min: 66, max: 362, label: 'Map Height' },
      optimalnumberofcities: { group: 'General', control: 'number', min: 0, label: 'Optimal Number Of Cities' },
      techrate: { group: 'General', control: 'number', min: 0, label: 'Tech Rate (%)' }
    }
  }
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
  const entryByCivilopediaKey = new Map();
  targetEntries.forEach((entry, fallbackIdx) => {
    const biqIndex = Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : fallbackIdx;
    entryByIndex.set(biqIndex, entry);
    const key = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
    if (!key) return;
    const prior = entryByCivilopediaKey.get(key);
    if (!prior || (!prior.thumbPath && entry.thumbPath)) {
      entryByCivilopediaKey.set(key, entry);
    }
  });
  const rawOptions = section.records.map((rec, idx) => {
    const recIndex = Number.isFinite(rec && rec.index) ? Number(rec.index) : idx;
    const recCivilopediaKey = String(getFieldByBaseKey(rec, 'civilopediaentry')?.value || '').trim().toUpperCase();
    const entry = entryByIndex.get(recIndex) || entryByCivilopediaKey.get(recCivilopediaKey) || null;
    const liveName = String(entry && entry.name || '').trim();
    const fallbackName = String(rec && rec.name || '').trim();
    const fallbackFromKey = recCivilopediaKey
      ? recCivilopediaKey
        .replace(/^[A-Z]+_/, '')
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
      : '';
    // BIQ record names are the authoritative scenario-facing labels for BIQ structure refs.
    const label = fallbackName || liveName || fallbackFromKey || `${code} ${recIndex + 1}`;
    return {
      value: String(oneBased ? (recIndex + 1) : recIndex),
      label,
      entry,
      recIndex
    };
  });
  const labelCounts = new Map();
  rawOptions.forEach((opt) => {
    const k = String(opt && opt.label || '').trim().toLowerCase();
    if (!k) return;
    labelCounts.set(k, Number(labelCounts.get(k) || 0) + 1);
  });
  return rawOptions.map((opt) => {
    const key = String(opt && opt.label || '').trim().toLowerCase();
    const hasDup = key && Number(labelCounts.get(key) || 0) > 1;
    if (!hasDup) return { value: opt.value, label: opt.label, entry: opt.entry };
    return {
      value: opt.value,
      label: `${opt.label} [ID ${opt.recIndex}]`,
      entry: opt.entry
    };
  });
}

function getBiqStructureRefSpec(sectionCode, baseKey) {
  const code = String(sectionCode || '').toUpperCase();
  const canon = String(baseKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const unitRefKeys = new Set([
    'advancedbarbarian', 'basicbarbarian', 'barbarianseaunit', 'battlecreatedunit', 'buildarmyunit',
    'scout', 'slave', 'startunit1', 'startunit2', 'flagunit'
  ]);
  if ((code === 'GAME' || code === 'RULE') && unitRefKeys.has(canon)) return { section: 'PRTO', oneBased: false };
  if ((code === 'GAME' || code === 'RULE') && canon === 'defaultmoneyresource') return { section: 'GOOD', oneBased: false };
  if ((code === 'GAME' || code === 'RULE') && canon === 'defaultdifficultylevel') return { section: 'DIFF', oneBased: false };
  if (code === 'GAME' && canon.startsWith('playableciv')) return { section: 'RACE', oneBased: false };
  if (code === 'LEAD' && canon === 'civ') return { section: 'RACE', oneBased: false };
  if (code === 'LEAD' && canon === 'government') return { section: 'GOVT', oneBased: false };
  if (code === 'LEAD' && canon === 'initialera') return { section: 'ERAS', oneBased: false };
  if (code === 'LEAD' && canon === 'difficulty') return { section: 'DIFF', oneBased: false };
  if (code === 'TERR' && canon === 'workerjob') return { section: 'TFRM', oneBased: false };
  if (code === 'TERR' && canon === 'pollutioneffect') return { section: 'TERR', oneBased: false };
  if (code === 'CTZN' && canon === 'prerequisite') return { section: 'TECH', oneBased: false };
  return null;
}

function getBiqStructureFieldSpec(sectionCode, field) {
  const code = String(sectionCode || '').toUpperCase();
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const schema = BIQ_STRUCTURE_RULE_SCHEMAS[code] || null;
  if (!schema || !schema.fields) return null;
  if (schema.fields[base]) return schema.fields[base];
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (!canon) return null;
  const keys = Object.keys(schema.fields);
  for (let i = 0; i < keys.length; i += 1) {
    const key = String(keys[i] || '');
    if (key.replace(/[^a-z0-9]/g, '') === canon) return schema.fields[key];
  }
  return null;
}

function getBiqStructureFieldGroup(sectionCode, field) {
  const code = String(sectionCode || '').toUpperCase();
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (code === 'GAME') {
    if (/^playable_civ$/.test(base)) return 'Player Options';
    if (/^turns_in_time_section_\d+$/.test(base) || /^time_per_turn_in_time_section_\d+$/.test(base)) return 'Time Scale';
    const allianceName = base.match(/^alliance(\d+)$/);
    if (allianceName) {
      const idx = Number.parseInt(allianceName[1], 10);
      if (Number.isFinite(idx) && idx >= 0 && idx <= 3) return `Alliance ${idx + 1}`;
      if (idx === 4) return 'No Alliances';
      return 'Locked Alliances';
    }
    const allianceMember = base.match(/^alliance(\d+)_member_\d+$/);
    if (allianceMember) {
      const idx = Number.parseInt(allianceMember[1], 10);
      if (Number.isFinite(idx) && idx >= 0 && idx <= 3) return `Alliance ${idx + 1}`;
      if (idx === 4) return 'No Alliances';
      return 'Locked Alliances';
    }
    const allianceWar = base.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_\d+$/);
    if (allianceWar) {
      const idx = Number.parseInt(allianceWar[1], 10);
      if (Number.isFinite(idx) && idx >= 0 && idx <= 3) return `Alliance ${idx + 1}`;
      return 'Locked Alliances';
    }
  }
  if (code === 'LEAD') {
    if (/^starting_units_of_type_/.test(base)) return 'Starting Units';
    if (/^starting_technolog/.test(base)) return 'Free Techs';
  }
  if (code === 'RULE') {
    if (/^number_of_parts_\d+_required$/.test(base)) return 'Spaceship Parts';
    if (/^questionmark(?:\d+|one|two|three|four)?$/.test(canon)) return 'Unknowns';
  }
  const spec = getBiqStructureFieldSpec(sectionCode, field);
  if (spec && spec.group) return spec.group;
  return 'Other';
}

function getBiqStructureFieldOrder(sectionCode, field) {
  const code = String(sectionCode || '').toUpperCase();
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const schema = BIQ_STRUCTURE_RULE_SCHEMAS[code] || null;
  if (code === 'GAME') {
    if (/^playable_civ$/.test(base)) return 60;
    const turnsMatch = base.match(/^turns_in_time_section_(\d+)$/);
    if (turnsMatch) return 260 + Number.parseInt(turnsMatch[1], 10) * 2;
    const perMatch = base.match(/^time_per_turn_in_time_section_(\d+)$/);
    if (perMatch) return 261 + Number.parseInt(perMatch[1], 10) * 2;
    const allianceMemberMatch = base.match(/^alliance(\d+)_member_(\d+)$/);
    if (allianceMemberMatch) {
      const allianceIdx = Number.parseInt(allianceMemberMatch[1], 10);
      const memberIdx = Number.parseInt(allianceMemberMatch[2], 10);
      return 430 + allianceIdx * 20 + memberIdx;
    }
    const allianceWarMatch = base.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_\d+$/);
    if (allianceWarMatch) {
      const allianceIdx = Number.parseInt(allianceWarMatch[1], 10);
      const enemyIdx = Number.parseInt(allianceWarMatch[2], 10);
      return 520 + allianceIdx * 10 + enemyIdx;
    }
  }
  if (code === 'LEAD') {
    if (/^starting_units_of_type_/.test(base)) return 200;
    const techMatch = base.match(/^starting_technology_(\d+)$/);
    if (techMatch) return 300 + Number.parseInt(techMatch[1], 10);
  }
  if (code === 'RULE') {
    const partReqMatch = base.match(/^number_of_parts_(\d+)_required$/);
    if (partReqMatch) {
      const partIdx = Number.parseInt(partReqMatch[1], 10);
      if (Number.isFinite(partIdx)) return 300 + partIdx;
      return 300;
    }
  }
  if (!schema || !Array.isArray(schema.order)) return Number.MAX_SAFE_INTEGER;
  const idx = schema.order.indexOf(base);
  if (idx >= 0) return idx;
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (!canon) return Number.MAX_SAFE_INTEGER;
  const canonIdx = schema.order.findIndex((key) => String(key || '').replace(/[^a-z0-9]/g, '') === canon);
  return canonIdx >= 0 ? canonIdx : Number.MAX_SAFE_INTEGER;
}

function parseEspionageMissionPerformedBy(value) {
  const parsed = parseIntFromDisplayValue(value);
  const raw = Number.isFinite(parsed) ? parsed : Number.parseInt(String(value || '').trim(), 10);
  if (!Number.isFinite(raw)) {
    const text = String(value || '').toLowerCase();
    return {
      diplomats: text.includes('diplomat'),
      spies: text.includes('spy')
    };
  }
  const mask = Math.max(0, Math.min(3, raw));
  return {
    diplomats: (mask & 1) !== 0,
    spies: (mask & 2) !== 0
  };
}

function formatEspionageMissionPerformedBy(value) {
  const stateValue = parseEspionageMissionPerformedBy(value);
  if (stateValue.diplomats && stateValue.spies) return 'Diplomats + Spies';
  if (stateValue.spies) return 'Spies';
  if (stateValue.diplomats) return 'Diplomats';
  return '(none)';
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
    order: [
      'civilopediaentry', 'era', 'cost', 'advanceicon',
      'x', 'y',
      'prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4',
      'notrequiredforadvancement', 'enablesrecycling', 'bonustech', 'permitssacrifice', 'revealmap',
      'enablesdiplomats', 'enablesalliances', 'enablesrop', 'enablesmpp', 'enablestradeembargoes', 'enablesmaptrading', 'enablescommunicationtrading',
      'cannotbetraded', 'doubleswealth', 'enablesseatrade', 'enablesoceantrade',
      'enablesirrigationwithoutfreshwater', 'disablesfloodplaindisease', 'doublesworkrate',
      'enablesbridges', 'enablesconscription', 'enablesmobilizationlevels', 'enablesprecisionbombing',
      'flavor_1', 'flavor_2', 'flavor_3', 'flavor_4', 'flavor_5', 'flavor_6', 'flavor_7'
    ],
    fields: {
      civilopediaentry: { group: 'General', control: 'text', label: 'Civilopedia Entry' },
      era: { group: 'General', control: 'reference', label: 'Era' },
      cost: { group: 'General', control: 'number', min: 0, label: 'Cost' },
      advanceicon: { group: 'General', control: 'number', min: 0, label: 'Icon' },
      x: { group: 'Tech Tree', control: 'number', min: 0, label: 'X' },
      y: { group: 'Tech Tree', control: 'number', min: 0, label: 'Y' },
      prerequisite1: { group: 'Prerequisites', control: 'reference' },
      prerequisite2: { group: 'Prerequisites', control: 'reference' },
      prerequisite3: { group: 'Prerequisites', control: 'reference' },
      prerequisite4: { group: 'Prerequisites', control: 'reference' },
      notrequiredforadvancement: { group: 'Flags', control: 'bool', label: 'Not Required for Era Advancement' },
      enablesrecycling: { group: 'Flags', control: 'bool', label: 'Enables Recycling' },
      bonustech: { group: 'Flags', control: 'bool', label: 'Bonus Technology Awarded' },
      permitssacrifice: { group: 'Flags', control: 'bool', label: 'Permits Sacrifice' },
      revealmap: { group: 'Flags', control: 'bool', label: 'Reveals World Map' },
      enablesdiplomats: { group: 'Diplomacy', control: 'bool', label: 'Enables Diplomats' },
      enablesalliances: { group: 'Diplomacy', control: 'bool', label: 'Enables Alliances' },
      enablesrop: { group: 'Diplomacy', control: 'bool', label: 'Enables Right of Passage' },
      enablesmpp: { group: 'Diplomacy', control: 'bool', label: 'Enables Mutual Protection Pacts' },
      enablestradeembargoes: { group: 'Diplomacy', control: 'bool', label: 'Enables Trade Embargos' },
      enablesmaptrading: { group: 'Diplomacy', control: 'bool', label: 'Enables Map Trading' },
      enablescommunicationtrading: { group: 'Diplomacy', control: 'bool', label: 'Enables Communication Trading' },
      cannotbetraded: { group: 'Trade', control: 'bool', label: 'Cannot Be Traded' },
      doubleswealth: { group: 'Trade', control: 'bool', label: 'Doubles effect of capitalization' },
      enablesseatrade: { group: 'Trade', control: 'bool', label: 'Enables Trade over Seas' },
      enablesoceantrade: { group: 'Trade', control: 'bool', label: 'Enables Trade over Oceans' },
      enablesirrigationwithoutfreshwater: { group: 'Terrain', control: 'bool', label: 'Enables irrigation without water' },
      disablesfloodplaindisease: { group: 'Terrain', control: 'bool', label: 'Disables Flood Plain Disease' },
      doublesworkrate: { group: 'Terrain', control: 'bool', label: 'Doubles worker work rate' },
      enablesbridges: { group: 'Military', control: 'bool', label: 'Enables Bridges' },
      enablesconscription: { group: 'Military', control: 'bool', label: 'Enables Conscription' },
      enablesmobilizationlevels: { group: 'Military', control: 'bool', label: 'Enables Mobilization Levels' },
      enablesprecisionbombing: { group: 'Military', control: 'bool', label: 'Enables Precision Bombing' },
      flavor_1: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor1' },
      flavor_2: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor2' },
      flavor_3: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor3' },
      flavor_4: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor4' },
      flavor_5: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor5' },
      flavor_6: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor6' },
      flavor_7: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor7' }
    }
  },
  improvements: {
    order: [
      'civilopediaentry',
      'cost', 'maintenancecost', 'culture', 'production', 'pollution', 'wonder', 'smallwonder', 'improvement',
      'bombarddefence', 'navalbombarddefence', 'airpower', 'navalpower', 'defencebonus', 'navaldefencebonus',
      'veteranairunits', 'veteranunits', 'veteranseaunits',
      'stealthattackbarrier', 'allowsnuclearweapons', 'decreasessuccessofmissiles',
      'doublecombatvsbarbarians', 'buildarmieswithoutleader', 'buildlargerarmies',
      'increaseschanceofleaderappearance', 'safeseatravel', 'increasedshipmovement', 'plustwoshipmovement',
      'cheaperupgrades', 'allowshealinginenemyterritory', 'increasedarmyvalue', 'doublecitydefences',
      'increasesfoodinwater', 'doublescitygrowthrate', 'doublecitygrowth', 'allowcitylevel2', 'allowcitylevel3',
      'increasedresearch', 'doublesresearchoutput', 'twofreeadvances', 'gainanytechsknownbytwocivs',
      'gainineverycity', 'gainoncontinent', 'unitproduced', 'unitfrequency', 'obsoleteby',
      'reqimprovement', 'numreqbuildings', 'reqgovernment', 'reqadvance', 'mustbenearriver',
      'coastalinstallation', 'requiresvictoriousarmy', 'mustbenearwater', 'requireseliteship', 'armiesrequired',
      'reqresource1', 'reqresource2', 'goodsmustbeincityradius',
      'allowairtrade', 'allowwatertrade', 'capitalization', 'increasedtaxes', 'increasestradeinwater',
      'increasedtrade', 'reducescorruption', 'forbiddenpalace', 'paystrademaintenance', 'treasuryearnsinterest',
      'happy', 'happyall', 'unhappy', 'unhappyall', 'increasesluxurytrade', 'increasedluxuries',
      'doubleshappiness', 'reduceswarweariness', 'reducewarweariness', 'empirereduceswarweariness',
      'centerofempire', 'replacesotherwiththistag', 'removepoppollution', 'reducebldgpollution',
      'mayexplodeormeltdown', 'doublessacrifice', 'increasesshieldsinwater', 'resistanttobribery',
      'spaceshippart', 'buildspaceshipparts', 'touristattraction', 'allowspymissions', 'allowdiplomaticvictory',
      'militaristic', 'religious', 'commercial', 'industrious', 'expansionist', 'scientific', 'agricultural', 'seafaring',
      'charmbarrier', 'actsasgeneraltelepad',
      'flavor_1', 'flavor_2', 'flavor_3', 'flavor_4', 'flavor_5', 'flavor_6', 'flavor_7'
    ],
    fields: {
      civilopediaentry: { group: 'Properties', control: 'text', label: 'Civilopedia Entry' },
      cost: { group: 'Properties', control: 'number', min: 0, label: 'Cost' },
      maintenancecost: { group: 'Properties', control: 'number', min: 0, label: 'Maintenance' },
      culture: { group: 'Properties', control: 'number', min: 0, label: 'Culture' },
      production: { group: 'Properties', control: 'number', min: 0, label: 'Production bonus' },
      pollution: { group: 'Properties', control: 'number', min: 0, label: 'Pollution' },
      wonder: { group: 'Properties', control: 'bool', label: 'Wonder' },
      smallwonder: { group: 'Properties', control: 'bool', label: 'Small Wonder' },
      improvement: { group: 'Properties', control: 'bool', label: 'Improvement' },
      bombarddefence: { group: 'Military', control: 'number', min: 0, label: 'Land Bombard' },
      navalbombarddefence: { group: 'Military', control: 'number', min: 0, label: 'Sea Bombard' },
      airpower: { group: 'Military', control: 'number', min: 0, label: 'Air attack' },
      navalpower: { group: 'Military', control: 'number', min: 0, label: 'Sea attack' },
      defencebonus: { group: 'Military', control: 'number', min: 0, label: 'Defence Bonus' },
      navaldefencebonus: { group: 'Military', control: 'number', min: 0, label: 'Naval defence' },
      veteranairunits: { group: 'Military', control: 'bool', label: 'Veteran: Air' },
      veteranunits: { group: 'Military', control: 'bool', label: 'Veteran: Land' },
      veteranseaunits: { group: 'Military', control: 'bool', label: 'Veteran: Sea' },
      stealthattackbarrier: { group: 'Military', control: 'bool', label: 'Stealth Barrier' },
      allowsnuclearweapons: { group: 'Military', control: 'bool', label: 'Nukes' },
      decreasessuccessofmissiles: { group: 'Military', control: 'bool', label: "75% defence vs ICBM's" },
      doublecombatvsbarbarians: { group: 'Military', control: 'bool', label: 'Double combat vs Barbarians' },
      buildarmieswithoutleader: { group: 'Military', control: 'bool', label: 'Armies without leader' },
      buildlargerarmies: { group: 'Military', control: 'bool', label: 'Larger armies' },
      increaseschanceofleaderappearance: { group: 'Military', control: 'bool', label: 'More leaders' },
      safeseatravel: { group: 'Military', control: 'bool', label: 'Safe at sea' },
      increasedshipmovement: { group: 'Military', control: 'bool', label: '+1 sea moves' },
      plustwoshipmovement: { group: 'Military', control: 'bool', label: '+2 sea moves' },
      cheaperupgrades: { group: 'Military', control: 'bool', label: 'Half cost upgrades' },
      allowshealinginenemyterritory: { group: 'Military', control: 'bool', label: 'Can heal in enemy territory' },
      increasedarmyvalue: { group: 'Military', control: 'bool', label: 'Stronger armies' },
      doublecitydefences: { group: 'Military', control: 'bool', label: 'Double city defences (global)' },
      increasesfoodinwater: { group: 'Food', control: 'bool', label: '+1 food in water' },
      doublescitygrowthrate: { group: 'Food', control: 'bool', label: 'Cities store food' },
      doublecitygrowth: { group: 'Food', control: 'bool', label: 'Cities gain +2 population instead of +1' },
      allowcitylevel2: { group: 'Food', control: 'bool', label: 'Allows city size 2' },
      allowcitylevel3: { group: 'Food', control: 'bool', label: 'Allows city size 3' },
      increasedresearch: { group: 'Science', control: 'bool', label: '+50% in city' },
      doublesresearchoutput: { group: 'Science', control: 'bool', label: '+100% in city' },
      twofreeadvances: { group: 'Science', control: 'bool', label: '2 free advances' },
      gainanytechsknownbytwocivs: { group: 'Science', control: 'bool', label: 'Gain any technology known by two civs' },
      gainineverycity: { group: 'Gain', control: 'reference', label: 'In every city' },
      gainoncontinent: { group: 'Gain', control: 'reference', label: 'In every city on this continent' },
      unitproduced: { group: 'Gain', control: 'reference', label: 'Unit' },
      unitfrequency: { group: 'Gain', control: 'number', min: 0, label: 'Frequency' },
      obsoleteby: { group: 'Gain', control: 'reference', label: 'Made obsolete by' },
      reqimprovement: { group: 'Requirements', control: 'reference', label: 'Building' },
      numreqbuildings: { group: 'Requirements', control: 'number', min: 0, label: 'Number' },
      reqgovernment: { group: 'Requirements', control: 'reference', label: 'Government' },
      reqadvance: { group: 'Requirements', control: 'reference', label: 'Technology' },
      mustbenearriver: { group: 'Requirements', control: 'bool', label: 'Near river' },
      coastalinstallation: { group: 'Requirements', control: 'bool', label: 'Coastal' },
      requiresvictoriousarmy: { group: 'Requirements', control: 'bool', label: 'Victorious army' },
      mustbenearwater: { group: 'Requirements', control: 'bool', label: 'By water' },
      requireseliteship: { group: 'Requirements', control: 'bool', label: 'Elite Ship' },
      armiesrequired: { group: 'Requirements', control: 'number', min: 0, label: 'Armies' },
      reqresource1: { group: 'Resources', control: 'reference', label: 'Resource slot 1' },
      reqresource2: { group: 'Resources', control: 'reference', label: 'Resource slot 2' },
      goodsmustbeincityradius: { group: 'Resources', control: 'bool', label: 'In city radius' },
      allowairtrade: { group: 'Trade', control: 'bool', label: 'Air trade' },
      allowwatertrade: { group: 'Trade', control: 'bool', label: 'Water trade' },
      capitalization: { group: 'Trade', control: 'bool', label: 'Capitalization' },
      increasedtaxes: { group: 'Trade', control: 'bool', label: '+50% tax revenue' },
      increasestradeinwater: { group: 'Trade', control: 'bool', label: 'Increased water trade' },
      increasedtrade: { group: 'Trade', control: 'bool', label: '+1 trade per tile' },
      reducescorruption: { group: 'Trade', control: 'bool', label: 'Reduces corruption: City' },
      forbiddenpalace: { group: 'Trade', control: 'bool', label: 'Reduces corruption: Empire' },
      paystrademaintenance: { group: 'Trade', control: 'bool', label: 'Pays trade maintenance' },
      treasuryearnsinterest: { group: 'Trade', control: 'bool', label: '5% treasury interest' },
      happy: { group: 'Happiness', control: 'number', min: 0, label: 'Content faces: City' },
      happyall: { group: 'Happiness', control: 'number', min: 0, label: 'Content faces: Global' },
      unhappy: { group: 'Happiness', control: 'number', min: 0, label: 'Unhappy faces: City' },
      unhappyall: { group: 'Happiness', control: 'number', min: 0, label: 'Unhappy faces: Global' },
      increasesluxurytrade: { group: 'Happiness', control: 'bool', label: 'More luxury happiness' },
      increasedluxuries: { group: 'Happiness', control: 'bool', label: '+50% luxury tax' },
      doubleshappiness: { group: 'Happiness', control: 'reference', label: 'Doubles happiness of' },
      reduceswarweariness: { group: 'Happiness', control: 'bool', label: 'Reduces war weariness: City' },
      reducewarweariness: { group: 'Happiness', control: 'bool', label: 'Reduces war weariness: Empire' },
      empirereduceswarweariness: { group: 'Happiness', control: 'bool', label: 'Reduces war weariness: Empire' },
      centerofempire: { group: 'Other', control: 'bool', label: 'Center of empire' },
      replacesotherwiththistag: { group: 'Other', control: 'bool', label: 'Replaces others with this flag' },
      removepoppollution: { group: 'Other', control: 'bool', label: 'No population pollution' },
      reducebldgpollution: { group: 'Other', control: 'bool', label: 'Less building pollution' },
      mayexplodeormeltdown: { group: 'Other', control: 'bool', label: 'Can meltdown' },
      doublessacrifice: { group: 'Other', control: 'bool', label: 'Doubles sacrifice' },
      increasesshieldsinwater: { group: 'Other', control: 'bool', label: 'More shields in water' },
      resistanttobribery: { group: 'Other', control: 'bool', label: 'Propaganda Resistance' },
      spaceshippart: { group: 'Other', control: 'number', min: -1, label: 'Spaceship part' },
      buildspaceshipparts: { group: 'Other', control: 'bool', label: 'Can build spaceship parts' },
      touristattraction: { group: 'Other', control: 'bool', label: 'Tourist Attraction' },
      allowspymissions: { group: 'Other', control: 'bool', label: 'Allows spies' },
      allowdiplomaticvictory: { group: 'Other', control: 'bool', label: 'Allows diplomatic victory' },
      militaristic: { group: 'Characteristics', control: 'bool', label: 'Militaristic' },
      religious: { group: 'Characteristics', control: 'bool', label: 'Religious' },
      commercial: { group: 'Characteristics', control: 'bool', label: 'Commercial' },
      industrious: { group: 'Characteristics', control: 'bool', label: 'Industrial' },
      expansionist: { group: 'Characteristics', control: 'bool', label: 'Expansionist' },
      scientific: { group: 'Characteristics', control: 'bool', label: 'Scientific' },
      agricultural: { group: 'Characteristics', control: 'bool', label: 'Agricultural' },
      seafaring: { group: 'Characteristics', control: 'bool', label: 'Seafaring' },
      charmbarrier: { group: 'Special Toggles', control: 'bool', label: 'Charm Barrier' },
      actsasgeneraltelepad: { group: 'Special Toggles', control: 'bool', label: 'General Telepad' },
      flavor_1: { group: 'Flavors', control: 'number', min: 0 },
      flavor_2: { group: 'Flavors', control: 'number', min: 0 },
      flavor_3: { group: 'Flavors', control: 'number', min: 0 },
      flavor_4: { group: 'Flavors', control: 'number', min: 0 },
      flavor_5: { group: 'Flavors', control: 'number', min: 0 },
      flavor_6: { group: 'Flavors', control: 'number', min: 0 },
      flavor_7: { group: 'Flavors', control: 'number', min: 0 }
    }
  },
  governments: {
    order: [
      'civilopediaentry', 'prerequisitetechnology',
      'corruption',
      'sciencecap', 'workerrate', 'assimilationchance', 'draftlimit', 'militarypolicelimit',
      'defaulttype', 'transitiontype', 'requiresmaintenance', 'tilepenalty', 'commercebonus', 'xenophobic', 'forceresettlement',
      'diplomatlevel', 'spylevel', 'immuneto',
      'freeunits', 'costperunit', 'freeunitspertown', 'freeunitspercity', 'freeunitspermetropolis',
      'hurrying',
      'warweariness',
      'performance_of_this_government_versus_government_0',
      'performance_of_this_government_versus_government_1',
      'performance_of_this_government_versus_government_2',
      'performance_of_this_government_versus_government_3',
      'performance_of_this_government_versus_government_4',
      'performance_of_this_government_versus_government_5',
      'performance_of_this_government_versus_government_6',
      'performance_of_this_government_versus_government_7',
      'resistancemodifier', 'briberymodifier',
      'questionmarkone', 'questionmarktwo', 'questionmarkthree', 'questionmarkfour',
      'rulertitlepairsused',
      'malerulertitle1', 'femalerulertitle1',
      'malerulertitle2', 'femalerulertitle2',
      'malerulertitle3', 'femalerulertitle3',
      'malerulertitle4', 'femalerulertitle4'
    ],
    fields: {
      civilopediaentry: { group: 'General', control: 'text', label: 'Civilopedia Entry' },
      prerequisitetechnology: { group: 'General', control: 'reference', label: 'Prerequisite' },
      corruption: { group: 'Corruption/Waste', control: 'select' },
      sciencecap: { group: 'Government Parameters', control: 'number', min: 0, label: 'Sci/Tax/Ent Cap' },
      workerrate: { group: 'Government Parameters', control: 'number', min: 0, label: 'Worker Rate' },
      assimilationchance: { group: 'Government Parameters', control: 'number', min: 0, label: 'Assimilation %' },
      draftlimit: { group: 'Government Parameters', control: 'number', min: 0, label: 'Draft Limit' },
      militarypolicelimit: { group: 'Government Parameters', control: 'number', min: 0, label: 'Military Police' },
      defaulttype: { group: 'Flags', control: 'bool', label: 'Default Type' },
      transitiontype: { group: 'Flags', control: 'bool', label: 'Transition Type' },
      requiresmaintenance: { group: 'Flags', control: 'bool', label: 'Requires Maintenance' },
      tilepenalty: { group: 'Flags', control: 'bool', label: '-1 Penalty on 3+ Food/Prod/Com' },
      commercebonus: { group: 'Flags', control: 'bool', label: '+1 Bonus on 1+ Commerce' },
      xenophobic: { group: 'Flags', control: 'bool', label: 'Xenophobia' },
      forceresettlement: { group: 'Flags', control: 'bool', label: 'Forced Resettlement' },
      diplomatlevel: { group: 'Espionage', control: 'select', label: 'Diplomats are' },
      spylevel: { group: 'Espionage', control: 'select', label: 'Spies are' },
      immuneto: { group: 'Espionage', control: 'select', label: 'Immune to' },
      freeunits: { group: 'Unit Support', control: 'number', label: 'Free Units (-1 = All Units Free)' },
      costperunit: { group: 'Unit Support', control: 'number', label: 'Cost Per Unit' },
      freeunitspertown: { group: 'Unit Support', control: 'number', label: 'Free units per: Town' },
      freeunitspercity: { group: 'Unit Support', control: 'number', label: 'Free units per: City' },
      freeunitspermetropolis: { group: 'Unit Support', control: 'number', label: 'Free units per: Metropolis' },
      hurrying: { group: 'Hurrying Labor', control: 'select' },
      warweariness: { group: 'War Weariness', control: 'select' },
      performance_of_this_government_versus_government_0: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_1: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_2: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_3: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_4: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_5: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_6: { group: 'Government Relations Table', control: 'text' },
      performance_of_this_government_versus_government_7: { group: 'Government Relations Table', control: 'text' },
      resistancemodifier: { group: 'Government Relations Table', control: 'number', label: 'Resistance Modifier' },
      briberymodifier: { group: 'Government Relations Table', control: 'number', label: 'Propaganda' },
      questionmarkone: { group: 'Unknown Parameters', control: 'number', label: 'Unknown 1' },
      questionmarktwo: { group: 'Unknown Parameters', control: 'number', label: 'Unknown 2' },
      questionmarkthree: { group: 'Unknown Parameters', control: 'number', label: 'Unknown 3' },
      questionmarkfour: { group: 'Unknown Parameters', control: 'number', label: 'Unknown 4' },
      rulertitlepairsused: { group: 'Ruler Titles', control: 'number', min: 0, max: 4, label: 'Enabled Rows' },
      malerulertitle1: { group: 'Ruler Titles', control: 'text', label: 'Masculine 1' },
      femalerulertitle1: { group: 'Ruler Titles', control: 'text', label: 'Feminine 1' },
      malerulertitle2: { group: 'Ruler Titles', control: 'text', label: 'Masculine 2' },
      femalerulertitle2: { group: 'Ruler Titles', control: 'text', label: 'Feminine 2' },
      malerulertitle3: { group: 'Ruler Titles', control: 'text', label: 'Masculine 3' },
      femalerulertitle3: { group: 'Ruler Titles', control: 'text', label: 'Feminine 3' },
      malerulertitle4: { group: 'Ruler Titles', control: 'text', label: 'Masculine 4' },
      femalerulertitle4: { group: 'Ruler Titles', control: 'text', label: 'Feminine 4' }
    }
  },
  civilizations: {
    order: [
      'civilopediaentry', 'noun', 'adjective', 'civilizationgender', 'plurality', 'culturegroup',
      'militaristic', 'religious', 'expansionist', 'agricultural', 'commercial', 'industrious', 'scientific', 'seafaring',
      'manyoffensivelandunits', 'nooffensivelandunits',
      'manydefensivelandunits', 'nodefensivelandunits',
      'manyartillery', 'noartillery',
      'manysettlers', 'nosettlers',
      'manyworkers', 'noworkers',
      'manyships', 'noships',
      'manyairunits', 'noairunits',
      'manygrowth', 'nogrowth',
      'manyproduction', 'noproduction',
      'manyhappiness', 'nohappiness',
      'manyscience', 'noscience',
      'manywealth', 'nowealth',
      'manytrade', 'notrade',
      'manyexploration', 'noexploration',
      'manyculture', 'noculture',
      'leadertitle', 'leadername', 'leadergender', 'kingunit',
      'favoritegovernment', 'shunnedgovernment', 'aggressionlevel',
      'numcitynames', 'numgreatleaders', 'numscientificleaders',
      'forwardfilename_for_era_0', 'reversefilename_for_era_0',
      'forwardfilename_for_era_1', 'reversefilename_for_era_1',
      'forwardfilename_for_era_2', 'reversefilename_for_era_2',
      'forwardfilename_for_era_3', 'reversefilename_for_era_3',
      'freetech1index', 'freetech2index', 'freetech3index', 'freetech4index',
      'managecitizens', 'manageproduction', 'nowonders', 'nosmallwonders', 'emphasizefood', 'emphasizeshields', 'emphasizetrade',
      'flavor_1', 'flavor_2', 'flavor_3', 'flavor_4', 'flavor_5', 'flavor_6', 'flavor_7',
      'uniquecolor', 'defaultcolor',
      'diplomacytextindex', 'questionmark'
    ],
    fields: {
      civilopediaentry: { group: 'Civilization Identity', control: 'text', label: 'Civilopedia Entry' },
      noun: { group: 'Civilization Identity', control: 'text', label: 'Noun' },
      adjective: { group: 'Civilization Identity', control: 'text', label: 'Adjective' },
      civilizationgender: { group: 'Civilization Identity', control: 'select', label: 'Gender' },
      plurality: { group: 'Civilization Identity', control: 'select', label: 'Number' },
      culturegroup: { group: 'Civilization Identity', control: 'select', label: 'Culture Group' },
      militaristic: { group: 'Traits', control: 'bool', label: 'Militaristic' },
      religious: { group: 'Traits', control: 'bool', label: 'Religious' },
      expansionist: { group: 'Traits', control: 'bool', label: 'Expansionist' },
      agricultural: { group: 'Traits', control: 'bool', label: 'Agricultural' },
      commercial: { group: 'Traits', control: 'bool', label: 'Commercial' },
      industrious: { group: 'Traits', control: 'bool', label: 'Industrious' },
      scientific: { group: 'Traits', control: 'bool', label: 'Scientific' },
      seafaring: { group: 'Traits', control: 'bool', label: 'Seafaring' },
      manyoffensivelandunits: { group: 'Build Often/Never', control: 'bool', label: 'Often: Offensive Land Units' },
      nooffensivelandunits: { group: 'Build Often/Never', control: 'bool', label: 'Never: Offensive Land Units' },
      manydefensivelandunits: { group: 'Build Often/Never', control: 'bool', label: 'Often: Defensive Land Units' },
      nodefensivelandunits: { group: 'Build Often/Never', control: 'bool', label: 'Never: Defensive Land Units' },
      manyartillery: { group: 'Build Often/Never', control: 'bool', label: 'Often: Artillery Units' },
      noartillery: { group: 'Build Often/Never', control: 'bool', label: 'Never: Artillery Units' },
      manysettlers: { group: 'Build Often/Never', control: 'bool', label: 'Often: Settlers' },
      nosettlers: { group: 'Build Often/Never', control: 'bool', label: 'Never: Settlers' },
      manyworkers: { group: 'Build Often/Never', control: 'bool', label: 'Often: Workers' },
      noworkers: { group: 'Build Often/Never', control: 'bool', label: 'Never: Workers' },
      manyships: { group: 'Build Often/Never', control: 'bool', label: 'Often: Naval Units' },
      noships: { group: 'Build Often/Never', control: 'bool', label: 'Never: Naval Units' },
      manyairunits: { group: 'Build Often/Never', control: 'bool', label: 'Often: Air Units' },
      noairunits: { group: 'Build Often/Never', control: 'bool', label: 'Never: Air Units' },
      manygrowth: { group: 'Build Often/Never', control: 'bool', label: 'Often: Growth' },
      nogrowth: { group: 'Build Often/Never', control: 'bool', label: 'Never: Growth' },
      manyproduction: { group: 'Build Often/Never', control: 'bool', label: 'Often: Production' },
      noproduction: { group: 'Build Often/Never', control: 'bool', label: 'Never: Production' },
      manyhappiness: { group: 'Build Often/Never', control: 'bool', label: 'Often: Happiness' },
      nohappiness: { group: 'Build Often/Never', control: 'bool', label: 'Never: Happiness' },
      manyscience: { group: 'Build Often/Never', control: 'bool', label: 'Often: Science' },
      noscience: { group: 'Build Often/Never', control: 'bool', label: 'Never: Science' },
      manywealth: { group: 'Build Often/Never', control: 'bool', label: 'Often: Capitalization' },
      nowealth: { group: 'Build Often/Never', control: 'bool', label: 'Never: Capitalization' },
      manytrade: { group: 'Build Often/Never', control: 'bool', label: 'Often: Trade' },
      notrade: { group: 'Build Often/Never', control: 'bool', label: 'Never: Trade' },
      manyexploration: { group: 'Build Often/Never', control: 'bool', label: 'Often: Exploration' },
      noexploration: { group: 'Build Often/Never', control: 'bool', label: 'Never: Exploration' },
      manyculture: { group: 'Build Often/Never', control: 'bool', label: 'Often: Culture' },
      noculture: { group: 'Build Often/Never', control: 'bool', label: 'Never: Culture' },
      leadertitle: { group: 'Leader', control: 'text', label: 'Title' },
      leadername: { group: 'Leader', control: 'text', label: 'Name' },
      leadergender: { group: 'Leader', control: 'select', label: 'Gender' },
      kingunit: { group: 'Leader', control: 'reference', label: 'Monarch unit' },
      favoritegovernment: { group: 'Personality', control: 'reference', label: 'Favorite Govt' },
      shunnedgovernment: { group: 'Personality', control: 'reference', label: 'Shunned Govt' },
      aggressionlevel: { group: 'Personality', control: 'range', min: -2, max: 2, label: 'Aggression' },
      numcitynames: { group: 'Cities', control: 'number', min: 0, label: 'City Names Count' },
      numgreatleaders: { group: 'Military Leaders', control: 'number', min: 0, label: 'Leader Names Count' },
      numscientificleaders: { group: 'Scientific Leaders', control: 'number', min: 0, label: 'Leader Names Count' },
      forwardfilename_for_era_0: { group: 'Animations', control: 'text', label: 'Ancient Fwd' },
      reversefilename_for_era_0: { group: 'Animations', control: 'text', label: 'Ancient Bwd' },
      forwardfilename_for_era_1: { group: 'Animations', control: 'text', label: 'Middle Ages Fwd' },
      reversefilename_for_era_1: { group: 'Animations', control: 'text', label: 'Middle Ages Bwd' },
      forwardfilename_for_era_2: { group: 'Animations', control: 'text', label: 'Industrial Fwd' },
      reversefilename_for_era_2: { group: 'Animations', control: 'text', label: 'Industrial Bwd' },
      forwardfilename_for_era_3: { group: 'Animations', control: 'text', label: 'Modern Fwd' },
      reversefilename_for_era_3: { group: 'Animations', control: 'text', label: 'Modern Bwd' },
      freetech1index: { group: 'Free Technologies', control: 'reference', label: 'Technology slot 1' },
      freetech2index: { group: 'Free Technologies', control: 'reference', label: 'Technology slot 2' },
      freetech3index: { group: 'Free Technologies', control: 'reference', label: 'Technology slot 3' },
      freetech4index: { group: 'Free Technologies', control: 'reference', label: 'Technology slot 4' },
      managecitizens: { group: 'Governor Settings', control: 'bool', label: 'Manage Citizens' },
      manageproduction: { group: 'Governor Settings', control: 'bool', label: 'Manage Production' },
      nowonders: { group: 'Governor Settings', control: 'bool', label: 'No Wonders' },
      nosmallwonders: { group: 'Governor Settings', control: 'bool', label: 'No Small Wonders' },
      emphasizefood: { group: 'Governor Settings', control: 'bool', label: 'Emphasize Food' },
      emphasizeshields: { group: 'Governor Settings', control: 'bool', label: 'Emphasize Production' },
      emphasizetrade: { group: 'Governor Settings', control: 'bool', label: 'Emphasize Trade' },
      flavor_1: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor1' },
      flavor_2: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor2' },
      flavor_3: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor3' },
      flavor_4: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor4' },
      flavor_5: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor5' },
      flavor_6: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor6' },
      flavor_7: { group: 'Flavors', control: 'number', min: 0, label: 'Flavor7' },
      uniquecolor: { group: 'Colors', control: 'select', label: 'Unique Color' },
      defaultcolor: { group: 'Colors', control: 'select', label: 'Default Color' },
      diplomacytextindex: { group: 'Misc Settings', control: 'reference', label: 'Diplomacy Text Index' },
      questionmark: { group: 'Misc Settings', control: 'number', label: 'Unknown' }
    }
  },
  units: {
    order: [
      'name',
      'requiredresource1', 'requiredresource2', 'requiredresource3', 'upgradeto',
      'attack', 'defence', 'movement', 'bombardstrength', 'bombardrange', 'rateoffire', 'airdefence',
      'hitpointbonus', 'operationalrange', 'capacity', 'populationcost', 'shieldcost', 'workerstrengthfloat',
      'requiressupport', 'zoneofcontrol', 'bombardeffects', 'createscraters',
      'offence', 'defencestrategy', 'explorestrategy', 'terraform', 'settle', 'king', 'artillery',
      'cruisemissileunit', 'icbm', 'tacticalnuke', 'leaderunit', 'armyunit', 'flagunit',
      'navalpower', 'navaltransport', 'navalcarrier', 'navalmissiletransport',
      'airbombard', 'airdefencestrategy', 'airtransport',
      'unitclass',
      'buildcity', 'buildcolony', 'buildroad', 'buildrailroad', 'buildmine', 'irrigate', 'buildfort',
      'clearforest', 'clearjungle', 'plantforest', 'clearpollution', 'automate', 'joincity',
      'ptwbuildairfield', 'ptwbuildradartower', 'ptwbuildoutpost',
      'load', 'unload', 'airlift', 'airdrop', 'pillage', 'bombard', 'buildarmy', 'finishimprovement', 'upgrade', 'enslaveresultsin',
      'skipturn', 'wait', 'goto', 'fortify', 'disband',
      'bomb', 'rebase', 'precisionbombing', 'recon', 'intercept',
      'allterrainasroads', 'amphibiousunit', 'army', 'blitz', 'cruisemissile', 'detectinvisible',
      'draftable', 'footsoldier', 'hiddennationality', 'immobile', 'infinitebombardrange', 'invisible',
      'leader', 'lethallandbombardment', 'lethalseabombardment', 'nuclearweapon', 'radar',
      'rangedattackanimations', 'requiresescort', 'rotatebeforeattack', 'sinksinocean', 'sinksinsea',
      'startsgoldenage', 'stealth', 'tacticalmissile', 'transportsonlyairunits', 'transportsonlyfootunits',
      'transportsonlytacticalmissiles', 'wheeled',
      'availableto', 'stealth_target'
    ],
    fields: {
      name: { group: 'Identity', control: 'text' },
      requiredresource1: { group: 'Prerequisites', control: 'reference' },
      requiredresource2: { group: 'Prerequisites', control: 'reference' },
      requiredresource3: { group: 'Prerequisites', control: 'reference' },
      upgradeto: { group: 'Prerequisites', control: 'reference' },
      unitclass: { group: 'Class', control: 'select' },
      attack: { group: 'Unit Statistics', control: 'number', min: 0 },
      defence: { group: 'Unit Statistics', control: 'number', min: 0 },
      movement: { group: 'Unit Statistics', control: 'number', min: 0 },
      bombardstrength: { group: 'Unit Statistics', control: 'number', min: 0 },
      bombardrange: { group: 'Unit Statistics', control: 'number', min: 0 },
      rateoffire: { group: 'Unit Statistics', control: 'number', min: 0 },
      airdefence: { group: 'Unit Statistics', control: 'number', min: 0 },
      hitpointbonus: { group: 'Unit Statistics', control: 'bool' },
      operationalrange: { group: 'Unit Statistics', control: 'number', min: 0 },
      capacity: { group: 'Unit Statistics', control: 'number', min: 0 },
      populationcost: { group: 'Unit Statistics', control: 'number', min: 0 },
      shieldcost: { group: 'Unit Statistics', control: 'number', min: 0 },
      workerstrengthfloat: { group: 'Unit Statistics', control: 'number', min: 0, label: 'Worker Strength' },
      requiressupport: { group: 'Unit Statistics', control: 'bool' },
      zoneofcontrol: { group: 'Unit Statistics', control: 'bool' },
      bombardeffects: { group: 'Unit Statistics', control: 'bool' },
      createscraters: { group: 'Unit Statistics', control: 'bool' },
      offence: { group: 'AI Strategies: Land', control: 'bool' },
      defencestrategy: { group: 'AI Strategies: Land', control: 'bool' },
      explorestrategy: { group: 'AI Strategies: Land', control: 'bool' },
      terraform: { group: 'AI Strategies: Land', control: 'bool' },
      settle: { group: 'AI Strategies: Land', control: 'bool' },
      king: { group: 'AI Strategies: Land', control: 'bool' },
      artillery: { group: 'AI Strategies: Land', control: 'bool' },
      cruisemissileunit: { group: 'AI Strategies: Land', control: 'bool' },
      icbm: { group: 'AI Strategies: Land', control: 'bool' },
      tacticalnuke: { group: 'AI Strategies: Land', control: 'bool' },
      leaderunit: { group: 'AI Strategies: Land', control: 'bool' },
      armyunit: { group: 'AI Strategies: Land', control: 'bool' },
      flagunit: { group: 'AI Strategies: Land', control: 'bool' },
      navalpower: { group: 'AI Strategies: Sea', control: 'bool' },
      navaltransport: { group: 'AI Strategies: Sea', control: 'bool' },
      navalcarrier: { group: 'AI Strategies: Sea', control: 'bool' },
      navalmissiletransport: { group: 'AI Strategies: Sea', control: 'bool' },
      airbombard: { group: 'AI Strategies: Air', control: 'bool' },
      airdefencestrategy: { group: 'AI Strategies: Air', control: 'bool' },
      airtransport: { group: 'AI Strategies: Air', control: 'bool' },
      buildcity: { group: 'Worker Actions', control: 'bool' },
      buildcolony: { group: 'Worker Actions', control: 'bool' },
      buildroad: { group: 'Worker Actions', control: 'bool' },
      buildrailroad: { group: 'Worker Actions', control: 'bool' },
      buildmine: { group: 'Worker Actions', control: 'bool' },
      irrigate: { group: 'Worker Actions', control: 'bool' },
      buildfort: { group: 'Worker Actions', control: 'bool' },
      clearforest: { group: 'Worker Actions', control: 'bool' },
      clearjungle: { group: 'Worker Actions', control: 'bool' },
      plantforest: { group: 'Worker Actions', control: 'bool' },
      clearpollution: { group: 'Worker Actions', control: 'bool' },
      automate: { group: 'Worker Actions', control: 'bool' },
      joincity: { group: 'Worker Actions', control: 'bool' },
      ptwbuildairfield: { group: 'Worker Actions', control: 'bool', label: 'Build Airfield' },
      ptwbuildradartower: { group: 'Worker Actions', control: 'bool', label: 'Build Radar Tower' },
      ptwbuildoutpost: { group: 'Worker Actions', control: 'bool', label: 'Build Outpost' },
      load: { group: 'Special Orders', control: 'bool' },
      unload: { group: 'Special Orders', control: 'bool' },
      airlift: { group: 'Special Orders', control: 'bool' },
      airdrop: { group: 'Special Orders', control: 'bool' },
      pillage: { group: 'Special Orders', control: 'bool' },
      bombard: { group: 'Special Orders', control: 'bool' },
      buildarmy: { group: 'Special Orders', control: 'bool' },
      finishimprovement: { group: 'Special Orders', control: 'bool' },
      upgrade: { group: 'Special Orders', control: 'bool' },
      enslaveresultsin: { group: 'Special Orders', control: 'reference' },
      skipturn: { group: 'Standard Orders', control: 'bool' },
      wait: { group: 'Standard Orders', control: 'bool' },
      goto: { group: 'Standard Orders', control: 'bool' },
      fortify: { group: 'Standard Orders', control: 'bool' },
      disband: { group: 'Standard Orders', control: 'bool' },
      bomb: { group: 'Air Missions', control: 'bool' },
      rebase: { group: 'Air Missions', control: 'bool' },
      precisionbombing: { group: 'Air Missions', control: 'bool' },
      recon: { group: 'Air Missions', control: 'bool' },
      intercept: { group: 'Air Missions', control: 'bool' },
      allterrainasroads: { group: 'Lists: Unit Abilities', control: 'bool' },
      amphibiousunit: { group: 'Lists: Unit Abilities', control: 'bool' },
      army: { group: 'Lists: Unit Abilities', control: 'bool' },
      blitz: { group: 'Lists: Unit Abilities', control: 'bool' },
      cruisemissile: { group: 'Lists: Unit Abilities', control: 'bool' },
      detectinvisible: { group: 'Lists: Unit Abilities', control: 'bool' },
      draftable: { group: 'Lists: Unit Abilities', control: 'bool' },
      footsoldier: { group: 'Lists: Unit Abilities', control: 'bool' },
      hiddennationality: { group: 'Lists: Unit Abilities', control: 'bool' },
      immobile: { group: 'Lists: Unit Abilities', control: 'bool' },
      infinitebombardrange: { group: 'Lists: Unit Abilities', control: 'bool' },
      invisible: { group: 'Lists: Unit Abilities', control: 'bool' },
      leader: { group: 'Lists: Unit Abilities', control: 'bool' },
      lethallandbombardment: { group: 'Lists: Unit Abilities', control: 'bool' },
      lethalseabombardment: { group: 'Lists: Unit Abilities', control: 'bool' },
      nuclearweapon: { group: 'Lists: Unit Abilities', control: 'bool' },
      radar: { group: 'Lists: Unit Abilities', control: 'bool' },
      rangedattackanimations: { group: 'Lists: Unit Abilities', control: 'bool' },
      requiresescort: { group: 'Lists: Unit Abilities', control: 'bool' },
      rotatebeforeattack: { group: 'Lists: Unit Abilities', control: 'bool' },
      sinksinocean: { group: 'Lists: Unit Abilities', control: 'bool' },
      sinksinsea: { group: 'Lists: Unit Abilities', control: 'bool' },
      startsgoldenage: { group: 'Lists: Unit Abilities', control: 'bool' },
      stealth: { group: 'Lists: Unit Abilities', control: 'bool' },
      tacticalmissile: { group: 'Lists: Unit Abilities', control: 'bool' },
      transportsonlyairunits: { group: 'Lists: Unit Abilities', control: 'bool' },
      transportsonlyfootunits: { group: 'Lists: Unit Abilities', control: 'bool' },
      transportsonlytacticalmissiles: { group: 'Lists: Unit Abilities', control: 'bool' },
      wheeled: { group: 'Lists: Unit Abilities', control: 'bool' },
      availableto: { group: 'Lists', control: 'number', label: 'Available To (bitmask)' },
      stealth_target: { group: 'Lists', control: 'unit-list', label: 'Stealth Attack Targets' }
    }
  }
};

function shouldHideBiqField(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (!base) return true;
  if ((BIQ_FIELD_HIDDEN.all && (BIQ_FIELD_HIDDEN.all.has(base) || BIQ_FIELD_HIDDEN.all.has(canon)))) return true;
  if (tabKey === 'units' && (UNIT_BOTTOM_LIST_HIDDEN_KEYS.has(base) || UNIT_BOTTOM_LIST_HIDDEN_KEYS.has(canon))) return true;
  if (tabKey === 'units' && !QUINT_UNIT_RULE_VISIBLE_KEYS.has(base) && !QUINT_UNIT_RULE_VISIBLE_KEYS.has(canon)) return true;
  if (tabKey === 'technologies' && !QUINT_TECH_RULE_VISIBLE_KEYS.has(base) && !QUINT_TECH_RULE_VISIBLE_KEYS.has(canon)) return true;
  if (tabKey === 'improvements' && !QUINT_IMPROVEMENT_RULE_VISIBLE_KEYS.has(base) && !QUINT_IMPROVEMENT_RULE_VISIBLE_KEYS.has(canon)) return true;
  if (tabKey === 'governments' && !QUINT_GOVERNMENT_RULE_VISIBLE_KEYS.has(base) && !QUINT_GOVERNMENT_RULE_VISIBLE_KEYS.has(canon)) return true;
  if (tabKey === 'civilizations' && !QUINT_CIV_RULE_VISIBLE_KEYS.has(base) && !QUINT_CIV_RULE_VISIBLE_KEYS.has(canon)) return true;
  const tabHidden = BIQ_FIELD_HIDDEN[tabKey];
  return !!(tabHidden && (tabHidden.has(base) || tabHidden.has(canon)));
}

function getRuleFieldSpec(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const schema = REFERENCE_RULE_SCHEMAS[tabKey] || null;
  if (!schema || !schema.fields) return null;
  return schema.fields[base] || null;
}

function getBiqFlavorNames() {
  const biq = state.bundle && state.bundle.biq;
  const sections = biq && Array.isArray(biq.sections) ? biq.sections : [];
  const flavSection = sections.find((section) => String(section && section.code || '').toUpperCase() === 'FLAV');
  const records = flavSection && Array.isArray(flavSection.records) ? flavSection.records : [];
  return records.map((record, idx) => {
    const fromRecord = String(record && record.name || '').trim();
    const fields = Array.isArray(record && record.fields) ? record.fields : [];
    const nameField = fields.find((field) => {
      const base = String(field && (field.baseKey || field.key) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return base === 'name' || base === 'description';
    });
    const fromField = String(nameField && nameField.value || '').trim();
    return fromField || fromRecord || `Flavor ${idx + 1}`;
  });
}

function getRuleFieldDisplayLabel(tabKey, field, spec) {
  const fallback = String((spec && spec.label) || field.label || field.key || '');
  if (tabKey !== 'civilizations' && tabKey !== 'technologies') return fallback;
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const m = base.match(/^flavor_(\d+)$/);
  if (!m) return fallback;
  const idx = Number.parseInt(m[1], 10);
  if (!Number.isFinite(idx) || idx <= 0) return fallback;
  const names = getBiqFlavorNames();
  const name = String(names[idx - 1] || '').trim();
  return name || fallback;
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

function canonicalBiqFieldKey(field) {
  return String(field && (field.baseKey || field.key) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function collapseUnitRuleFields(fields) {
  const out = [];
  const seen = new Set();
  const multiBuckets = new Map();
  (Array.isArray(fields) ? fields : []).forEach((field) => {
    const canon = canonicalBiqFieldKey(field);
    if (!canon) return;
    if (UNIT_MULTI_VALUE_FIELD_KEYS.has(canon)) {
      let bucket = multiBuckets.get(canon);
      if (!bucket) {
        bucket = { first: field, values: [] };
        multiBuckets.set(canon, bucket);
        out.push(bucket);
      }
      const value = String(field && field.value || '').trim();
      if (value) bucket.values.push(value);
      return;
    }
    if (seen.has(canon)) return;
    seen.add(canon);
    out.push(field);
  });
  return out.map((item) => {
    if (!item || !item.first) return item;
    return {
      ...item.first,
      value: item.values.join(', '),
      multiValues: item.values
    };
  });
}

function setUnitListFieldValues(entry, key, values) {
  if (!entry || !Array.isArray(entry.biqFields)) return;
  const targetKey = String(key || '').trim();
  const targetCanon = targetKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleaned = (Array.isArray(values) ? values : []).map((v) => String(v || '').trim()).filter(Boolean);
  let firstRemoved = null;
  let insertAt = -1;
  const kept = [];
  entry.biqFields.forEach((field) => {
    const canon = canonicalBiqFieldKey(field);
    if (canon === targetCanon) {
      if (!firstRemoved) firstRemoved = field;
      if (insertAt < 0) insertAt = kept.length;
      return;
    }
    kept.push(field);
  });
  if (insertAt < 0) insertAt = kept.length;
  const template = firstRemoved || { baseKey: targetKey, key: targetKey, label: toFriendlyKey(targetKey) };
  const nextFields = cleaned.map((value) => ({
    ...template,
    value
  }));
  kept.splice(insertAt, 0, ...nextFields);
  entry.biqFields = kept;
  if (targetCanon === 'stealthtarget') {
    const countField = entry.biqFields.find((field) => canonicalBiqFieldKey(field) === 'numstealthtargets');
    if (countField) countField.value = String(cleaned.length);
  }
  if (targetCanon === 'legalunittelepad') {
    const countField = entry.biqFields.find((field) => canonicalBiqFieldKey(field) === 'numlegalunittelepads');
    if (countField) countField.value = String(cleaned.length);
  }
  if (targetCanon === 'legalbuildingtelepad') {
    const countField = entry.biqFields.find((field) => canonicalBiqFieldKey(field) === 'numlegalbuildingtelepads');
    if (countField) countField.value = String(cleaned.length);
  }
}

function getUnitListFieldState(entry, candidateKeys, fallbackKey) {
  const aliases = (Array.isArray(candidateKeys) ? candidateKeys : []).map((k) => String(k || '').trim()).filter(Boolean);
  const wanted = aliases.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  let selectedKey = '';
  const values = [];
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  fields.forEach((field) => {
    const rawKey = String(field && (field.baseKey || field.key) || '').trim();
    const canon = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!canon || !wanted.includes(canon)) return;
    if (!selectedKey) selectedKey = rawKey;
    const value = String(field && field.value || '').trim();
    if (value) values.push(value);
  });
  return {
    key: selectedKey || String(fallbackKey || aliases[0] || '').trim(),
    values
  };
}

function getCivilizationNoteListState(entry, countKey) {
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  const targetCount = String(countKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let countIndex = -1;
  for (let i = 0; i < fields.length; i += 1) {
    if (canonicalBiqFieldKey(fields[i]) === targetCount) {
      countIndex = i;
      break;
    }
  }
  if (countIndex < 0) {
    return {
      countIndex: -1,
      notesStart: -1,
      notesEnd: -1,
      values: []
    };
  }
  const notesStart = countIndex + 1;
  if (notesStart >= fields.length || canonicalBiqFieldKey(fields[notesStart]) !== 'note') {
    return {
      countIndex,
      notesStart,
      notesEnd: notesStart,
      values: []
    };
  }
  let notesEnd = notesStart;
  while (notesEnd < fields.length && canonicalBiqFieldKey(fields[notesEnd]) === 'note') notesEnd += 1;
  const values = fields.slice(notesStart, notesEnd)
    .map((field) => String(field && field.value || '').trim())
    .filter(Boolean);
  return { countIndex, notesStart, notesEnd, values };
}

function setCivilizationNoteListValues(entry, countKey, values) {
  if (!entry) return;
  if (!Array.isArray(entry.biqFields)) entry.biqFields = [];
  const fields = entry.biqFields;
  const targetCount = String(countKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let countField = fields.find((field) => canonicalBiqFieldKey(field) === targetCount);
  if (!countField) {
    countField = ensureBiqFieldByBaseKey(entry, countKey, toFriendlyKey(countKey), '0');
  }
  const state = getCivilizationNoteListState(entry, countKey);
  const cleaned = (Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const start = state.notesStart < 0 ? Math.max(0, fields.indexOf(countField) + 1) : state.notesStart;
  const end = state.notesEnd < 0 ? start : state.notesEnd;
  const existingNotes = (start >= 0 && end > start) ? fields.slice(start, end) : [];
  const template = existingNotes[0] || {
    key: 'note',
    baseKey: 'note',
    label: 'Note',
    editable: true
  };
  const nextNotes = cleaned.map((value) => ({ ...template, value }));
  fields.splice(start, Math.max(0, end - start), ...nextNotes);
  countField.value = String(cleaned.length);
}

function getTerrainResourceOptions() {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs.resources;
  const entries = tab && Array.isArray(tab.entries) ? tab.entries : [];
  return entries
    .map((entry, idx) => ({
      value: String(Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : idx),
      label: String(entry && (entry.name || entry.civilopediaKey) || `Resource ${idx + 1}`),
      entry: entry || null
    }))
    .sort((a, b) => Number.parseInt(a.value, 10) - Number.parseInt(b.value, 10));
}

function parseTerrainMaskCsv(raw) {
  return String(raw || '')
    .split(/[,\s]+/)
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isFinite(n) && n !== 0 ? 1 : 0;
    });
}

function deriveTerrainMaskFromNotes(record) {
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  const countField = fields.find((field) => canonicalBiqFieldKey(field) === 'numpossibleresources');
  const declaredCount = Math.max(0, parseIntFromDisplayValue(countField && countField.value) || 0);
  const countIndex = countField ? fields.indexOf(countField) : -1;
  if (countIndex < 0) return [];
  let i = countIndex + 1;
  const mask = [];
  while (i < fields.length && canonicalBiqFieldKey(fields[i]) === 'note') {
    const v = Number.parseInt(String(fields[i] && fields[i].value || '').trim(), 10);
    mask.push(Number.isFinite(v) && v !== 0 ? 1 : 0);
    i += 1;
  }
  if (declaredCount > mask.length) {
    while (mask.length < declaredCount) mask.push(0);
  }
  return mask;
}

function getTerrainResourceMask(record) {
  if (!record || !Array.isArray(record.fields)) return [];
  const maskField = record.fields.find((field) => canonicalBiqFieldKey(field) === 'possibleresourcesmask');
  if (maskField && String(maskField.value || '').trim()) {
    return parseTerrainMaskCsv(maskField.value);
  }
  return deriveTerrainMaskFromNotes(record);
}

function ensureTerrainResourceMaskField(record) {
  if (!record) return null;
  if (!Array.isArray(record.fields)) record.fields = [];
  const existing = record.fields.find((field) => canonicalBiqFieldKey(field) === 'possibleresourcesmask');
  if (existing) return existing;
  const initial = getTerrainResourceMask(record);
  const csv = initial.join(',');
  const created = {
    key: 'possible_resources_mask',
    baseKey: 'possible_resources_mask',
    label: 'Possible Resources Mask',
    value: csv,
    originalValue: csv,
    editable: true
  };
  record.fields.push(created);
  return created;
}

function renderCivilizationNoteListEditor(entry, cfg, referenceEditable) {
  const wrap = document.createElement('div');
  wrap.className = 'structured-list';
  const state = getCivilizationNoteListState(entry, cfg.countKey);
  if (!referenceEditable) {
    const text = document.createElement('div');
    text.className = 'field-meta';
    text.textContent = state.values.length ? state.values.join(', ') : '(none)';
    wrap.appendChild(text);
    return wrap;
  }

  let items = state.values.slice();
  const list = document.createElement('div');
  list.className = 'structured-list';
  list.style.maxHeight = '180px';
  list.style.overflow = 'auto';
  list.style.paddingRight = '2px';

  const commit = () => {
    setCivilizationNoteListValues(entry, cfg.countKey, items);
    setDirty(true);
  };

  const rerender = () => {
    list.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'field-meta';
      empty.textContent = '(none)';
      list.appendChild(empty);
    } else {
      items.forEach((value, idx) => {
        const line = document.createElement('div');
        line.className = 'kv-row compact';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = cfg.placeholder;
        input.value = value;
        input.addEventListener('input', () => {
          rememberUndoSnapshot();
          items[idx] = input.value;
          commit();
        });
        const del = document.createElement('button');
        del.type = 'button';
        withRemoveIcon(del, ' Remove');
        del.addEventListener('click', () => {
          rememberUndoSnapshot();
          items.splice(idx, 1);
          commit();
          rerender();
        });
        line.appendChild(input);
        line.appendChild(del);
        list.appendChild(line);
      });
    }
  };

  const addRow = document.createElement('div');
  addRow.className = 'kv-row compact';
  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.placeholder = cfg.placeholder;
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = '+';
  addBtn.title = `Add ${cfg.label}`;
  const addItem = () => {
    const value = String(addInput.value || '').trim();
    if (!value) return;
    rememberUndoSnapshot();
    items.push(value);
    addInput.value = '';
    commit();
    rerender();
    const lastInput = list.querySelector('.kv-row.compact input:last-of-type');
    if (lastInput) lastInput.focus({ preventScroll: true });
  };
  addBtn.addEventListener('click', addItem);
  addInput.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    addItem();
  });
  addRow.appendChild(addInput);
  addRow.appendChild(addBtn);
  wrap.appendChild(addRow);
  wrap.appendChild(list);
  rerender();
  return wrap;
}

function setUnitAbilitySelections(entry, selectedValues) {
  if (!entry || !Array.isArray(entry.biqFields)) return;
  const wanted = new Set((Array.isArray(selectedValues) ? selectedValues : []).map((v) => String(v || '').trim().toLowerCase()).filter(Boolean));
  UNIT_ABILITY_OPTION_KEYS.forEach((key) => {
    const field = entry.biqFields.find((f) => canonicalBiqFieldKey(f) === key);
    if (!field) return;
    field.value = wanted.has(key) ? 'true' : 'false';
  });
}

function getUnitAbilitySelections(entry) {
  const out = [];
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  UNIT_ABILITY_OPTION_KEYS.forEach((key) => {
    const field = fields.find((f) => canonicalBiqFieldKey(f) === key);
    const on = String(field && field.value || '').trim().toLowerCase() === 'true';
    if (on) out.push(key);
  });
  return out;
}

function parseSigned32FromValue(value) {
  const n = parseIntFromDisplayValue(value);
  if (n == null) return 0;
  return n | 0;
}

function toSigned32StringFromUnsigned(unsigned32) {
  const u = Number(unsigned32) >>> 0;
  return u > 0x7fffffff ? String(u - 0x100000000) : String(u);
}

function decodeAvailableToIndices(rawValue) {
  const mask = parseSigned32FromValue(rawValue) >>> 0;
  const out = [];
  for (let i = 0; i < 32; i++) {
    if (((mask >>> i) & 1) === 1) out.push(i);
  }
  return out;
}

function encodeAvailableToFromIndices(indices) {
  let mask = 0 >>> 0;
  (Array.isArray(indices) ? indices : []).forEach((idx) => {
    const i = Number.parseInt(String(idx), 10);
    if (!Number.isFinite(i) || i < 0 || i > 31) return;
    mask = (mask | ((1 << i) >>> 0)) >>> 0;
  });
  return toSigned32StringFromUnsigned(mask);
}

function getCivilizationBitmaskOptions() {
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs.civilizations;
  const entries = tab && Array.isArray(tab.entries) ? tab.entries : [];
  return entries.map((entry, fallbackIdx) => {
    const idx = Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : fallbackIdx;
    return {
      value: String(idx),
      label: String(entry && entry.name || `Civilization ${idx}`),
      entry: entry || null
    };
  }).filter((opt) => Number.isFinite(Number.parseInt(opt.value, 10)) && Number.parseInt(opt.value, 10) >= 0 && Number.parseInt(opt.value, 10) < 32);
}

function isGovernmentRelationsField(field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  return /^performance_of_this_government_versus_government_\d+$/.test(base)
    || base === 'resistancemodifier'
    || base === 'briberymodifier'
    || base === 'canbribe';
}

function buildGovernmentRelationsRows(entry) {
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  const rows = [];
  let current = null;
  fields.forEach((field) => {
    const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
    const perfMatch = base.match(/^performance_of_this_government_versus_government_(\d+)$/);
    if (perfMatch) {
      const index = Number.parseInt(perfMatch[1], 10);
      const label = String(field && field.label || '').trim();
      const government = label.replace(/^Performance Vs\s*/i, '').trim() || `Government ${index + 1}`;
      current = { index, government, resistanceField: null, propagandaField: null };
      rows.push(current);
      return;
    }
    if (!current) return;
    if (base === 'resistancemodifier' && !current.resistanceField) {
      current.resistanceField = field;
      return;
    }
    if (base === 'briberymodifier' && !current.propagandaField) {
      current.propagandaField = field;
    }
  });
  return rows.sort((a, b) => a.index - b.index);
}

function renderGovernmentRelationsCard(entry, referenceEditable) {
  const rows = buildGovernmentRelationsRows(entry);
  if (rows.length === 0) return null;
  const card = document.createElement('div');
  card.className = 'rule-group-card';
  const title = document.createElement('div');
  title.className = 'rule-group-title';
  title.textContent = 'Government Relations Table';
  card.appendChild(title);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '12px';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  ['Government', 'Resistance Modifier', 'Propaganda'].forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.textAlign = 'left';
    th.style.padding = '6px 4px';
    th.style.borderBottom = '1px solid rgba(36, 25, 64, 0.2)';
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const tdGov = document.createElement('td');
    tdGov.textContent = row.government;
    tdGov.style.padding = '6px 4px';
    const tdResistance = document.createElement('td');
    if (referenceEditable && row.resistanceField) {
      const input = document.createElement('input');
      input.type = 'number';
      const n = parseIntFromDisplayValue(row.resistanceField.value);
      input.value = n == null ? '' : String(n);
      input.addEventListener('input', () => {
        rememberUndoSnapshot();
        row.resistanceField.value = input.value;
        setDirty(true);
      });
      tdResistance.appendChild(input);
    } else {
      tdResistance.textContent = formatFieldValueForDisplay('governments', row.resistanceField || { value: '' });
    }
    tdResistance.style.padding = '6px 4px';
    const tdProp = document.createElement('td');
    if (referenceEditable && row.propagandaField) {
      const input = document.createElement('input');
      input.type = 'number';
      const n = parseIntFromDisplayValue(row.propagandaField.value);
      input.value = n == null ? '' : String(n);
      input.addEventListener('input', () => {
        rememberUndoSnapshot();
        row.propagandaField.value = input.value;
        setDirty(true);
      });
      tdProp.appendChild(input);
    } else {
      tdProp.textContent = formatFieldValueForDisplay('governments', row.propagandaField || { value: '' });
    }
    tdProp.style.padding = '6px 4px';
    tr.appendChild(tdGov);
    tr.appendChild(tdResistance);
    tr.appendChild(tdProp);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

const CIV_BUILD_PRIORITY_ROWS = [
  { label: 'Offensive Land Units', often: 'manyoffensivelandunits', never: 'nooffensivelandunits' },
  { label: 'Defensive Land Units', often: 'manydefensivelandunits', never: 'nodefensivelandunits' },
  { label: 'Artillery Units', often: 'manyartillery', never: 'noartillery' },
  { label: 'Settlers', often: 'manysettlers', never: 'nosettlers' },
  { label: 'Workers', often: 'manyworkers', never: 'noworkers' },
  { label: 'Naval Units', often: 'manyships', never: 'noships' },
  { label: 'Air Units', often: 'manyairunits', never: 'noairunits' },
  { label: 'Growth', often: 'manygrowth', never: 'nogrowth' },
  { label: 'Production', often: 'manyproduction', never: 'noproduction' },
  { label: 'Happiness', often: 'manyhappiness', never: 'nohappiness' },
  { label: 'Science', often: 'manyscience', never: 'noscience' },
  { label: 'Capitalization', often: 'manywealth', never: 'nowealth' },
  { label: 'Trade', often: 'manytrade', never: 'notrade' },
  { label: 'Exploration', often: 'manyexploration', never: 'noexploration' },
  { label: 'Culture', often: 'manyculture', never: 'noculture' }
];

function isCivilizationBuildPriorityField(field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  return CIV_BUILD_PRIORITY_ROWS.some((row) => row.often === base || row.never === base);
}

function renderCivilizationBuildPriorityCard(entry, referenceEditable) {
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  const hasAny = CIV_BUILD_PRIORITY_ROWS.some((row) => {
    return fields.some((f) => {
      const base = String(f && (f.baseKey || f.key) || '').toLowerCase();
      return base === row.often || base === row.never;
    });
  });
  if (!hasAny) return null;
  const card = document.createElement('div');
  card.className = 'rule-group-card';
  const title = document.createElement('div');
  title.className = 'rule-group-title';
  title.textContent = 'Build Often/Never';
  card.appendChild(title);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.tableLayout = 'fixed';
  table.style.fontSize = '12px';
  const colgroup = document.createElement('colgroup');
  const colCategory = document.createElement('col');
  colCategory.style.width = 'auto';
  const colOften = document.createElement('col');
  colOften.style.width = '82px';
  const colNever = document.createElement('col');
  colNever.style.width = '82px';
  colgroup.appendChild(colCategory);
  colgroup.appendChild(colOften);
  colgroup.appendChild(colNever);
  table.appendChild(colgroup);
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  ['Category', 'Often', 'Never'].forEach((h, idx) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.textAlign = idx === 0 ? 'left' : 'center';
    th.style.padding = '6px 4px';
    th.style.borderBottom = '1px solid rgba(36, 25, 64, 0.2)';
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  CIV_BUILD_PRIORITY_ROWS.forEach((cfg) => {
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.textContent = cfg.label;
    tdLabel.style.padding = '6px 4px';
    const oftenField = getBiqFieldByBaseKey(entry, cfg.often);
    const neverField = getBiqFieldByBaseKey(entry, cfg.never);
    const tdOften = document.createElement('td');
    tdOften.style.padding = '6px 4px';
    tdOften.style.textAlign = 'center';
    const tdNever = document.createElement('td');
    tdNever.style.padding = '6px 4px';
    tdNever.style.textAlign = 'center';
    if (referenceEditable) {
      const oftenChk = document.createElement('input');
      oftenChk.type = 'checkbox';
      oftenChk.checked = String(oftenField && oftenField.value || '').toLowerCase() === 'true';
      oftenChk.addEventListener('change', () => {
        rememberUndoSnapshot();
        if (oftenField) oftenField.value = oftenChk.checked ? 'true' : 'false';
        setDirty(true);
      });
      tdOften.appendChild(oftenChk);
      const neverChk = document.createElement('input');
      neverChk.type = 'checkbox';
      neverChk.checked = String(neverField && neverField.value || '').toLowerCase() === 'true';
      neverChk.addEventListener('change', () => {
        rememberUndoSnapshot();
        if (neverField) neverField.value = neverChk.checked ? 'true' : 'false';
        setDirty(true);
      });
      tdNever.appendChild(neverChk);
    } else {
      tdOften.textContent = String(oftenField && oftenField.value || '').toLowerCase() === 'true' ? 'Yes' : 'No';
      tdNever.textContent = String(neverField && neverField.value || '').toLowerCase() === 'true' ? 'Yes' : 'No';
    }
    tr.appendChild(tdLabel);
    tr.appendChild(tdOften);
    tr.appendChild(tdNever);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

function isCivilizationNoteListCountField(field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  return CIV_NOTE_LIST_COUNT_KEYS.has(base);
}

function renderCivilizationNameListsCard(entry, referenceEditable) {
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  const hasAny = fields.some((field) => isCivilizationNoteListCountField(field));
  if (!hasAny) return null;
  const card = document.createElement('div');
  card.className = 'rule-group-card';
  const title = document.createElement('div');
  title.className = 'rule-group-title';
  title.textContent = 'Name Lists';
  card.appendChild(title);
  const rows = [
    { label: 'City Names', countKey: 'numcitynames', placeholder: 'City name' },
    { label: 'Military Leaders', countKey: 'numgreatleaders', placeholder: 'Military leader name' },
    { label: 'Scientific Leaders', countKey: 'numscientificleaders', placeholder: 'Scientific leader name' }
  ];
  rows.forEach((cfg) => {
    const row = document.createElement('div');
    row.className = 'rule-row';
    const label = document.createElement('label');
    label.className = 'field-meta';
    label.textContent = cfg.label;
    row.appendChild(label);
    const controlWrap = document.createElement('div');
    controlWrap.className = 'rule-control';
    controlWrap.appendChild(renderCivilizationNoteListEditor(entry, cfg, referenceEditable));
    row.appendChild(controlWrap);
    card.appendChild(row);
  });
  return card;
}

function rebuildCivilizationDiplomacyOptions(tab) {
  const slots = (tab && Array.isArray(tab.diplomacySlots)) ? tab.diplomacySlots : [];
  return slots.map((slot, idx) => {
    const index = Number.isFinite(Number(slot && slot.index)) ? Number(slot.index) : idx;
    let contact = String(slot && slot.firstContact || '').trim();
    let deal = String(slot && slot.firstDeal || '').trim();
    if (contact.length > 90) contact = `${contact.slice(0, 87)}...`;
    if (deal.length > 90) deal = `${deal.slice(0, 87)}...`;
    const parts = [];
    if (contact) parts.push(`First contact: ${contact}`);
    if (deal) parts.push(`Trade intro: ${deal}`);
    const preview = parts.join(' | ');
    return {
      value: String(index),
      label: preview ? `Slot ${index} - ${preview}` : `Slot ${index}`
    };
  });
}

function getCivilizationDiplomacySlotIndex(entry) {
  const field = getBiqFieldByBaseKey(entry, 'diplomacytextindex');
  const parsed = parseIntFromDisplayValue(field && field.value);
  return parsed == null || parsed < 0 ? null : parsed;
}

function findOrCreateDiplomacySlotForIndex(tab, slotIndex) {
  if (!tab || !Number.isFinite(slotIndex) || slotIndex < 0) return null;
  if (!Array.isArray(tab.diplomacySlots)) tab.diplomacySlots = [];
  let slot = tab.diplomacySlots.find((candidate) => Number(candidate && candidate.index) === slotIndex) || null;
  if (slot) return slot;
  slot = {
    index: slotIndex,
    firstContact: '',
    originalFirstContact: '',
    firstDeal: '',
    originalFirstDeal: ''
  };
  tab.diplomacySlots.push(slot);
  tab.diplomacySlots.sort((a, b) => Number(a && a.index) - Number(b && b.index));
  return slot;
}

function parseDiplomacySectionSlotLinesForUi(text, sectionName) {
  const src = String(text || '');
  if (!src.trim()) return [];
  const lines = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const slots = [];
  let inSection = false;
  let civ = null;
  let power = null;
  let mood = null;
  let random = null;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = String(lines[i] || '');
    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();
    if (upper === `#${String(sectionName || '').toUpperCase()}`) {
      inSection = true;
      civ = null;
      power = null;
      mood = null;
      random = null;
      continue;
    }
    if (!inSection) continue;
    if (trimmed.startsWith('#') && !upper.startsWith('#CIV ') && !upper.startsWith('#POWER ') && !upper.startsWith('#MOOD ') && !upper.startsWith('#RANDOM ')) {
      break;
    }
    if (upper.startsWith('#CIV ')) {
      civ = Number.parseInt(upper.slice(5).trim(), 10);
      continue;
    }
    if (upper.startsWith('#POWER ')) {
      power = Number.parseInt(upper.slice(7).trim(), 10);
      continue;
    }
    if (upper.startsWith('#MOOD ')) {
      mood = Number.parseInt(upper.slice(6).trim(), 10);
      continue;
    }
    if (upper.startsWith('#RANDOM ')) {
      random = Number.parseInt(upper.slice(8).trim(), 10);
      continue;
    }
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    if (!(civ === 1 && power === 0 && mood === 0 && random === 1)) continue;
    const textLine = trimmed
      .replace(/^["“”„«»]+/, '')
      .replace(/["“”„«»]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!textLine) continue;
    slots.push(textLine);
  }
  return slots;
}

function parseCivilizationDiplomacySlotsFromText(text) {
  const firstContact = parseDiplomacySectionSlotLinesForUi(text, 'AIFIRSTCONTACT');
  const firstDeal = parseDiplomacySectionSlotLinesForUi(text, 'AIFIRSTDEAL');
  const count = Math.max(firstContact.length, firstDeal.length);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      index: i,
      firstContact: String(firstContact[i] || ''),
      firstDeal: String(firstDeal[i] || '')
    });
  }
  return out;
}

function normalizeDiplomacyDialogueLineForUi(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function quoteDiplomacyDialogueLineForUi(value) {
  const text = normalizeDiplomacyDialogueLineForUi(value);
  if (!text) return '';
  return `"${text.replace(/"/g, '\\"')}"`;
}

const DIPLOMACY_EOF_SENTINEL_FOR_UI = '; THIS LINE MUST REMAIN AT END OF FILE';

function isDiplomacyEofSentinelKeyForUi(value) {
  const normalized = String(value || '')
    .replace(/^#+/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
  if (!normalized) return false;
  const withSemicolon = String(DIPLOMACY_EOF_SENTINEL_FOR_UI).trim().replace(/\s+/g, ' ').toUpperCase();
  const withoutSemicolon = withSemicolon.replace(/^;\s*/, '');
  return normalized === withSemicolon || normalized === withoutSemicolon;
}

function parseDiplomacyDocumentWithOrderForUi(text) {
  const src = String(text || '');
  const doc = { preamble: [], sections: [], hadTrailingNewline: /\r\n$|\n$|\r$/.test(src) };
  const lines = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let currentSection = null;
  lines.forEach((raw) => {
    const line = String(raw || '');
    const trimmed = line.trim();
    const isDirective = /^#(CIV|POWER|MOOD|RANDOM)\b/i.test(trimmed);
    const isSectionHeader = trimmed.startsWith('#') && !isDirective;
    if (isSectionHeader) {
      currentSection = {
        header: line,
        key: trimmed.slice(1).trim().toUpperCase(),
        lines: []
      };
      doc.sections.push(currentSection);
      return;
    }
    if (currentSection) currentSection.lines.push(line);
    else doc.preamble.push(line);
  });
  return doc;
}

function parseDiplomacyEditableBlocksForUi(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const sections = [];
  const blocks = [];
  let currentSection = null;
  let currentBlock = null;
  const sectionCounts = new Map();
  const finalizeBlock = (endLineExclusive) => {
    if (!currentBlock) return;
    currentBlock.endLineExclusive = Number(endLineExclusive);
    const count = Number(sectionCounts.get(currentBlock.sectionKey) || 0) + 1;
    sectionCounts.set(currentBlock.sectionKey, count);
    currentBlock.id = `${currentBlock.sectionKey}:${count}`;
    blocks.push(currentBlock);
    currentBlock = null;
  };
  const finalizeSection = (endLineExclusive) => {
    if (!currentSection) return;
    currentSection.endLineExclusive = Number(endLineExclusive);
    sections.push(currentSection);
    currentSection = null;
  };

  const isDirective = (upper) => upper.startsWith('#CIV ') || upper.startsWith('#POWER ') || upper.startsWith('#MOOD ') || upper.startsWith('#RANDOM ');

  for (let i = 0; i < lines.length; i += 1) {
    const line = String(lines[i] || '');
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    const isSectionHeader = trimmed.startsWith('#') && !isDirective(upper);
    if (isSectionHeader) {
      finalizeBlock(i);
      finalizeSection(i);
      const sectionKey = trimmed.slice(1).trim().toUpperCase();
      currentSection = {
        key: sectionKey,
        header: line,
        startLine: i,
        endLineExclusive: lines.length
      };
      continue;
    }
    if (!currentSection) continue;
    if (upper.startsWith('#CIV ')) {
      finalizeBlock(i);
      currentBlock = {
        id: '',
        sectionKey: currentSection.key,
        sectionHeader: currentSection.header,
        civ: Number.parseInt(upper.slice(5).trim(), 10),
        power: null,
        mood: null,
        random: null,
        firstSelectorLine: i,
        lastSelectorLine: i,
        dialogueLineIdxs: [],
        startLine: i,
        endLineExclusive: lines.length
      };
      continue;
    }
    if (!currentBlock) continue;
    if (upper.startsWith('#POWER ')) {
      currentBlock.power = Number.parseInt(upper.slice(7).trim(), 10);
      currentBlock.lastSelectorLine = i;
      continue;
    }
    if (upper.startsWith('#MOOD ')) {
      currentBlock.mood = Number.parseInt(upper.slice(6).trim(), 10);
      currentBlock.lastSelectorLine = i;
      continue;
    }
    if (upper.startsWith('#RANDOM ')) {
      currentBlock.random = Number.parseInt(upper.slice(8).trim(), 10);
      currentBlock.lastSelectorLine = i;
      continue;
    }
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    currentBlock.dialogueLineIdxs.push(i);
  }
  finalizeBlock(lines.length);
  finalizeSection(lines.length);
  return { lines, sections, blocks };
}

function serializeDiplomacyDocumentWithOrderForUi(doc) {
  const preamble = Array.isArray(doc && doc.preamble) ? doc.preamble : [];
  const sections = Array.isArray(doc && doc.sections) ? doc.sections : [];
  const out = [];
  preamble.forEach((line) => out.push(String(line || '')));
  sections.forEach((section) => {
    if (!section) return;
    const rawHeader = String(section.header || '');
    const key = String(section.key || '').trim().toUpperCase();
    if (!rawHeader && !key) return;
    const header = rawHeader
      ? (rawHeader.startsWith('#') ? rawHeader : `#${rawHeader}`)
      : `#${key}`;
    out.push(header);
    (Array.isArray(section.lines) ? section.lines : []).forEach((line) => out.push(String(line || '')));
  });
  const serialized = out.join('\n');
  return doc && doc.hadTrailingNewline ? (serialized.endsWith('\n') ? serialized : `${serialized}\n`) : serialized;
}

function applyDialogueLinesToDiplomacyBlockForUi(text, block, values) {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const desired = (Array.isArray(values) ? values : [])
    .map((line) => normalizeDiplomacyDialogueLineForUi(line))
    .filter(Boolean)
    .map((line) => quoteDiplomacyDialogueLineForUi(line));
  const idxs = Array.isArray(block && block.dialogueLineIdxs) ? block.dialogueLineIdxs.slice() : [];
  if (idxs.length > 0) {
    const capped = Math.min(idxs.length, desired.length);
    for (let i = 0; i < capped; i += 1) lines[idxs[i]] = desired[i];
    if (desired.length > idxs.length) {
      const insertAt = idxs[idxs.length - 1] + 1;
      lines.splice(insertAt, 0, ...desired.slice(idxs.length));
    } else if (desired.length < idxs.length) {
      for (let i = idxs.length - 1; i >= desired.length; i -= 1) lines.splice(idxs[i], 1);
    }
    return lines.join('\n');
  }
  const insertAt = Number.isFinite(Number(block && block.lastSelectorLine))
    ? (Number(block.lastSelectorLine) + 1)
    : (Number.isFinite(Number(block && block.startLine)) ? Number(block.startLine) + 1 : lines.length);
  lines.splice(insertAt, 0, ...desired);
  return lines.join('\n');
}

function applyDiplomacySectionSlotLinesForUi(section, values) {
  const target = section && Array.isArray(section.lines) ? section : null;
  if (!target) return false;
  const desired = (Array.isArray(values) ? values : [])
    .map((line) => normalizeDiplomacyDialogueLineForUi(line))
    .filter(Boolean)
    .map((line) => quoteDiplomacyDialogueLineForUi(line));
  const lines = target.lines.slice();
  const indices = [];
  let civ = null;
  let power = null;
  let mood = null;
  let random = null;
  let firstSelectorLine = -1;
  let lastMatchLine = -1;
  const isDialogueLine = (line) => {
    const trimmed = String(line || '').trim();
    return !!trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('#');
  };
  for (let i = 0; i < lines.length; i += 1) {
    const raw = String(lines[i] || '');
    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('#CIV ')) {
      civ = Number.parseInt(upper.slice(5).trim(), 10);
      continue;
    }
    if (upper.startsWith('#POWER ')) {
      power = Number.parseInt(upper.slice(7).trim(), 10);
      continue;
    }
    if (upper.startsWith('#MOOD ')) {
      mood = Number.parseInt(upper.slice(6).trim(), 10);
      continue;
    }
    if (upper.startsWith('#RANDOM ')) {
      random = Number.parseInt(upper.slice(8).trim(), 10);
      if (civ === 1 && power === 0 && mood === 0 && random === 1 && firstSelectorLine < 0) firstSelectorLine = i;
      continue;
    }
    if (trimmed.startsWith('#')) continue;
    const inTargetSelector = civ === 1 && power === 0 && mood === 0 && random === 1;
    if (!inTargetSelector) continue;
    lastMatchLine = i;
    if (isDialogueLine(trimmed)) indices.push(i);
  }
  const before = JSON.stringify(lines);
  if (indices.length > 0) {
    const capped = Math.min(indices.length, desired.length);
    for (let i = 0; i < capped; i += 1) lines[indices[i]] = desired[i];
    if (desired.length > indices.length) {
      const insertAt = (lastMatchLine >= 0 ? lastMatchLine + 1 : indices[indices.length - 1] + 1);
      lines.splice(insertAt, 0, ...desired.slice(indices.length));
    } else if (desired.length < indices.length) {
      for (let i = indices.length - 1; i >= desired.length; i -= 1) lines.splice(indices[i], 1);
    }
  } else if (firstSelectorLine >= 0) {
    lines.splice(firstSelectorLine + 1, 0, ...desired);
  } else {
    if (lines.length > 0 && String(lines[lines.length - 1] || '').trim()) lines.push('');
    lines.push('#CIV 1');
    lines.push('#POWER 0');
    lines.push('#MOOD 0');
    lines.push('#RANDOM 1');
    desired.forEach((line) => lines.push(line));
  }
  target.lines = lines;
  return JSON.stringify(lines) !== before;
}

function syncCivilizationDiplomacyTextFromSlots(tab) {
  if (!tab || !Array.isArray(tab.diplomacySlots)) return;
  const doc = parseDiplomacyDocumentWithOrderForUi(String(tab.diplomacyText || ''));
  const sectionByKey = new Map((Array.isArray(doc.sections) ? doc.sections : []).map((section) => [String(section && section.key || '').toUpperCase(), section]));
  const ensureSection = (key) => {
    const upper = String(key || '').toUpperCase();
    let section = sectionByKey.get(upper) || null;
    if (section) return section;
    section = { key: upper, header: `#${upper}`, lines: [] };
    doc.sections.push(section);
    sectionByKey.set(upper, section);
    return section;
  };
  const maxIndex = Math.max(-1, ...tab.diplomacySlots.map((slot) => Number(slot && slot.index)));
  const contact = [];
  const deal = [];
  for (let i = 0; i <= maxIndex; i += 1) {
    const slot = tab.diplomacySlots.find((candidate) => Number(candidate && candidate.index) === i) || {};
    contact.push(String(slot.firstContact || ''));
    deal.push(String(slot.firstDeal || ''));
  }
  applyDiplomacySectionSlotLinesForUi(ensureSection('AIFIRSTCONTACT'), contact);
  applyDiplomacySectionSlotLinesForUi(ensureSection('AIFIRSTDEAL'), deal);
  tab.diplomacyText = serializeDiplomacyDocumentWithOrderForUi(doc);
}

function applyDiplomacyTextToCivilizationSlots(tab) {
  if (!tab) return;
  const priorSlots = Array.isArray(tab.diplomacySlots) ? tab.diplomacySlots : [];
  const priorByIndex = new Map(priorSlots.map((slot) => [Number(slot && slot.index), slot]));
  const parsed = parseCivilizationDiplomacySlotsFromText(tab.diplomacyText);
  tab.diplomacySlots = parsed.map((slot) => {
    const prior = priorByIndex.get(Number(slot && slot.index)) || {};
    return {
      index: Number(slot && slot.index),
      firstContact: String(slot && slot.firstContact || ''),
      originalFirstContact: String(prior.originalFirstContact != null ? prior.originalFirstContact : (slot && slot.firstContact) || ''),
      firstDeal: String(slot && slot.firstDeal || ''),
      originalFirstDeal: String(prior.originalFirstDeal != null ? prior.originalFirstDeal : (slot && slot.firstDeal) || '')
    };
  });
  tab.diplomacyOptions = rebuildCivilizationDiplomacyOptions(tab);
}

function parseDiplomacySectionBlocksForUi(sectionLines) {
  const lines = Array.isArray(sectionLines) ? sectionLines : [];
  const blocks = [];
  const sectionNotes = [];
  let currentBlock = null;
  const pushBlock = () => {
    if (!currentBlock) return;
    blocks.push(currentBlock);
    currentBlock = null;
  };
  const ensureBlock = () => {
    if (currentBlock) return currentBlock;
    currentBlock = {
      civ: null,
      power: null,
      mood: null,
      random: null,
      selectors: [],
      dialogue: [],
      notes: []
    };
    return currentBlock;
  };
  lines.forEach((raw, idx) => {
    const line = String(raw || '');
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('#CIV ')) {
      pushBlock();
      const b = ensureBlock();
      b.civ = Number.parseInt(upper.slice(5).trim(), 10);
      b.selectors.push({ key: 'CIV', value: b.civ, line: line });
      return;
    }
    if (upper.startsWith('#POWER ')) {
      const b = ensureBlock();
      b.power = Number.parseInt(upper.slice(7).trim(), 10);
      b.selectors.push({ key: 'POWER', value: b.power, line: line });
      return;
    }
    if (upper.startsWith('#MOOD ')) {
      const b = ensureBlock();
      b.mood = Number.parseInt(upper.slice(6).trim(), 10);
      b.selectors.push({ key: 'MOOD', value: b.mood, line: line });
      return;
    }
    if (upper.startsWith('#RANDOM ')) {
      const b = ensureBlock();
      b.random = Number.parseInt(upper.slice(8).trim(), 10);
      b.selectors.push({ key: 'RANDOM', value: b.random, line: line });
      return;
    }
    const isComment = trimmed.startsWith(';');
    if (!currentBlock) {
      if (!trimmed && sectionNotes.length > 0) sectionNotes.push({ kind: 'blank', text: '', idx });
      else if (trimmed || isComment) sectionNotes.push({ kind: isComment ? 'comment' : 'text', text: line, idx });
      return;
    }
    if (!trimmed) {
      currentBlock.notes.push({ kind: 'blank', text: '', idx });
      return;
    }
    if (isComment) {
      currentBlock.notes.push({ kind: 'comment', text: line, idx });
      return;
    }
    if (trimmed.startsWith('#')) {
      currentBlock.notes.push({ kind: 'text', text: line, idx });
      return;
    }
    const cleaned = trimmed.replace(/^["“”„«»]+/, '').replace(/["“”„«»]+$/, '').trim();
    currentBlock.dialogue.push({ raw: line, text: cleaned, idx });
  });
  pushBlock();
  return { blocks, sectionNotes };
}

function replaceDiplomacySectionBodyForUi(tab, sectionKey, newSectionBodyText) {
  if (!tab) return;
  const doc = parseDiplomacyDocumentWithOrderForUi(String(tab.diplomacyText || ''));
  const key = String(sectionKey || '').trim().toUpperCase();
  if (!key) return;
  let section = (doc.sections || []).find((item) => String(item && item.key || '').trim().toUpperCase() === key) || null;
  if (!section) {
    section = { key, header: `#${key}`, lines: [] };
    doc.sections.push(section);
  }
  const normalized = String(newSectionBodyText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  section.lines = normalized.length === 0 ? [] : normalized.split('\n');
  tab.diplomacyText = serializeDiplomacyDocumentWithOrderForUi(doc);
  applyDiplomacyTextToCivilizationSlots(tab);
}

function renderCivilizationDiplomacySectionsCard(tab, referenceEditable) {
  const outer = document.createElement('details');
  outer.className = 'rule-group-card';
  const title = document.createElement('summary');
  title.className = 'rule-group-title';
  title.textContent = 'Diplomacy Text';
  const sourceMeta = (((tab && tab.sourceDetails) || {}).diplomacyActive || '').trim();
  const writePath = (((tab && tab.sourceDetails) || {}).diplomacyScenarioWrite || '').trim();
  attachRichTooltip(title, formatSourceInfo({ source: 'diplomacy.txt', readPath: sourceMeta, writePath }, 'diplomacy.txt'));
  outer.appendChild(title);

  const doc = parseDiplomacyDocumentWithOrderForUi(String((tab && tab.diplomacyText) || ''));
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  if (!sections.length) {
    const empty = document.createElement('div');
    empty.className = 'field-meta';
    empty.textContent = 'No diplomacy sections found.';
    outer.appendChild(empty);
    outer.open = true;
    return outer;
  }
  const totalNonEmptyLines = sections.reduce((sum, section) => {
    const lines = Array.isArray(section && section.lines) ? section.lines : [];
    return sum + lines.filter((line) => String(line || '').trim()).length;
  }, 0);
  const anySectionEditing = sections.some((section, sectionIdx) => {
    const key = String(section && section.key || '').trim().toUpperCase();
    if (!key) return false;
    return !!state.civilopediaEditorOpen[`DIPLOMACY_SECTION:${key}:${sectionIdx}`];
  });
  const shouldCollapseOuter = sections.length > 4 || totalNonEmptyLines > 48;
  outer.open = !shouldCollapseOuter || anySectionEditing;

  const bodyWrap = document.createElement('div');
  bodyWrap.style.marginTop = '8px';

  sections.forEach((section, sectionIdx) => {
    const key = String(section && section.key || '').trim().toUpperCase();
    if (!key) return;
    if (isDiplomacyEofSentinelKeyForUi(key) || isDiplomacyEofSentinelKeyForUi(section && section.header)) return;
    const editorKey = `DIPLOMACY_SECTION:${key}:${sectionIdx}`;
    const sectionLines = Array.isArray(section && section.lines) ? section.lines : [];
    const parsed = parseDiplomacySectionBlocksForUi(sectionLines);
    const blockCount = parsed.blocks.length;
    const lineCount = sectionLines.filter((line) => String(line || '').trim()).length;
    const isEditing = referenceEditable && !!state.civilopediaEditorOpen[editorKey];

    const details = document.createElement('details');
    details.className = 'section-card source-section';
    details.open = !!isEditing;
    const summary = document.createElement('summary');
    summary.className = 'section-top';
    const left = document.createElement('strong');
    left.textContent = key;
    summary.appendChild(left);
    const meta = document.createElement('span');
    meta.className = 'field-meta';
    meta.style.marginLeft = '10px';
    meta.textContent = `${lineCount} line${lineCount === 1 ? '' : 's'}`;
    summary.appendChild(meta);
    details.appendChild(summary);

    const body = document.createElement('div');
    body.style.marginTop = '8px';
    if (referenceEditable) {
      const controls = document.createElement('div');
      controls.className = 'civilopedia-editor-controls';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost civilopedia-edit-toggle';
      editBtn.textContent = isEditing ? '✓ Done' : '✎ Edit';
      editBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        state.civilopediaEditorOpen[editorKey] = !isEditing;
        renderActiveTab({ preserveTabScroll: true });
      });
      controls.appendChild(editBtn);
      body.appendChild(controls);
    }

    if (isEditing) {
      const hint = document.createElement('div');
      hint.className = 'field-meta';
      hint.textContent = 'Raw section body (line by line).';
      body.appendChild(hint);
      const editor = document.createElement('textarea');
      editor.className = 'civilopedia-editor';
      editor.rows = Math.min(16, Math.max(6, sectionLines.length + 2));
      editor.value = sectionLines.join('\n');
      editor.addEventListener('input', () => {
        rememberUndoSnapshot();
        replaceDiplomacySectionBodyForUi(tab, key, editor.value);
        setDirty(true);
      });
      body.appendChild(editor);
    } else {
      if (parsed.sectionNotes.length > 0) {
        const note = document.createElement('div');
        note.className = 'field-meta';
        note.textContent = `${parsed.sectionNotes.length} non-block line${parsed.sectionNotes.length === 1 ? '' : 's'} in this section.`;
        body.appendChild(note);
      }
      parsed.blocks.forEach((block, idx) => {
        const blockCard = document.createElement('div');
        blockCard.className = 'section-card diplomacy-block-card';
        blockCard.style.marginTop = '8px';
        const blockTop = document.createElement('div');
        blockTop.className = 'section-top';
        const blockTitle = document.createElement('strong');
        const civ = Number.isFinite(block.civ) ? block.civ : '?';
        const power = Number.isFinite(block.power) ? block.power : '?';
        const mood = Number.isFinite(block.mood) ? block.mood : '?';
        const random = Number.isFinite(block.random) ? block.random : '?';
        blockTitle.textContent = `Block ${idx + 1}: CIV ${civ}, POWER ${power}, MOOD ${mood}, RANDOM ${random}`;
        blockTop.appendChild(blockTitle);
        const blockMeta = document.createElement('span');
        blockMeta.className = 'field-meta';
        blockMeta.style.marginLeft = '10px';
        const dialogueCount = Array.isArray(block.dialogue) ? block.dialogue.length : 0;
        blockMeta.textContent = `${dialogueCount} line${dialogueCount === 1 ? '' : 's'}`;
        blockTop.appendChild(blockMeta);
        blockCard.appendChild(blockTop);

        const blockBody = document.createElement('div');
        blockBody.style.marginTop = '6px';
        const list = document.createElement('ol');
        list.style.margin = '8px 0 0 18px';
        list.style.padding = '0';
        const dialogue = Array.isArray(block.dialogue) ? block.dialogue : [];
        if (dialogue.length === 0) {
          const none = document.createElement('div');
          none.className = 'field-meta';
          none.textContent = '(no dialogue lines)';
          blockBody.appendChild(none);
        } else {
          dialogue.forEach((line) => {
            const li = document.createElement('li');
            li.textContent = String(line && line.text || '');
            list.appendChild(li);
          });
          blockBody.appendChild(list);
        }
        blockCard.appendChild(blockBody);
        body.appendChild(blockCard);
      });
      if (parsed.blocks.length === 0) {
        const none = document.createElement('div');
        none.className = 'field-meta';
        none.textContent = 'No selector blocks found in this section.';
        body.appendChild(none);
      }
    }
    details.appendChild(body);
    bodyWrap.appendChild(details);
  });

  outer.appendChild(bodyWrap);
  return outer;
}

function renderCivilizationDiplomacyCard(tab, entry, referenceEditable) {
  const slotIndex = getCivilizationDiplomacySlotIndex(entry);
  if (slotIndex == null) return null;
  const slot = referenceEditable
    ? findOrCreateDiplomacySlotForIndex(tab, slotIndex)
    : ((tab && Array.isArray(tab.diplomacySlots)) ? tab.diplomacySlots.find((candidate) => Number(candidate && candidate.index) === slotIndex) : null);
  if (!slot) return null;

  const card = document.createElement('div');
  card.className = 'rule-group-card';
  const title = document.createElement('div');
  title.className = 'rule-group-title';
  title.textContent = `Diplomacy Text (Slot ${slotIndex})`;
  card.appendChild(title);

  const sourceMeta = (((tab && tab.sourceDetails) || {}).diplomacyActive || '').trim();
  const writePath = (((tab && tab.sourceDetails) || {}).diplomacyScenarioWrite || '').trim();
  attachRichTooltip(
    title,
    formatSourceInfo({ source: 'diplomacy.txt', readPath: sourceMeta, writePath }, 'diplomacy.txt')
  );

  const makeRow = (labelText, key) => {
    const row = document.createElement('div');
    row.className = 'rule-row';
    const label = document.createElement('label');
    label.className = 'field-meta';
    label.textContent = labelText;
    row.appendChild(label);
    const controlWrap = document.createElement('div');
    controlWrap.className = 'rule-control';
    if (referenceEditable) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = String(slot[key] || '');
      input.placeholder = labelText;
      input.addEventListener('input', () => {
        rememberUndoSnapshot();
        slot[key] = input.value;
        tab.diplomacyOptions = rebuildCivilizationDiplomacyOptions(tab);
        syncCivilizationDiplomacyTextFromSlots(tab);
        setDirty(true);
      });
      controlWrap.appendChild(input);
    } else {
      const text = document.createElement('div');
      text.className = 'field-meta';
      text.textContent = String(slot[key] || '(none)');
      controlWrap.appendChild(text);
    }
    row.appendChild(controlWrap);
    card.appendChild(row);
  };

  makeRow('First Contact', 'firstContact');
  makeRow('Trade Intro', 'firstDeal');
  return card;
}

function renderUnitBottomListsCard(entry, referenceEditable) {
  const card = document.createElement('div');
  card.className = 'rule-group-card';
  const title = document.createElement('div');
  title.className = 'rule-group-title';
  title.textContent = 'Lists';
  card.appendChild(title);
  const rows = [
    { label: 'Unit Abilities', kind: 'abilities' },
    { label: 'Available To (Civs)', kind: 'availableTo' },
    { label: 'Stealth Attack Targets (Units)', kind: 'stealthTargets' },
    { label: 'Ignore Movement Cost (Terrains)', kind: 'ignoreMovement' },
    { label: 'Legal Unit Telepads (Units)', kind: 'legalUnitTelepads' },
    { label: 'Legal Building Telepads (Improvements)', kind: 'legalBuildingTelepads' }
  ];
  rows.forEach((cfg) => {
    const row = document.createElement('div');
    row.className = 'rule-row';
    const label = document.createElement('label');
    label.className = 'field-meta';
    label.textContent = cfg.label;
    row.appendChild(label);
    const controlWrap = document.createElement('div');
    controlWrap.className = 'rule-control';
    const stealthState = getUnitListFieldState(entry, ['stealth_target', 'stealthtarget'], 'stealth_target');
    const ignoreMoveState = getUnitListFieldState(entry, ['ignore_movement_cost', 'ignoremovementcost'], 'ignore_movement_cost');
    const legalUnitTelepadState = getUnitListFieldState(entry, ['legal_unit_telepad', 'legalunittelepad'], 'legal_unit_telepad');
    const legalBuildingTelepadState = getUnitListFieldState(entry, ['legal_building_telepad', 'legalbuildingtelepad'], 'legal_building_telepad');
    const civOptions = getCivilizationBitmaskOptions();
    const civNameByIdx = new Map(civOptions.map((opt) => [Number.parseInt(String(opt.value), 10), String(opt.label || '')]));
    const availableField = getBiqFieldByBaseKey(entry, 'availableto');
    if (!referenceEditable) {
      const text = document.createElement('div');
      text.className = 'field-meta';
      if (cfg.kind === 'abilities') {
        const selected = getUnitAbilitySelections(entry).map((k) => toFriendlyKey(k));
        text.textContent = selected.length ? selected.join(', ') : '(none)';
      } else if (cfg.kind === 'availableTo') {
        const selected = decodeAvailableToIndices(availableField && availableField.value);
        const labels = selected.map((idx) => civNameByIdx.get(idx) || `Civ ${idx}`).filter(Boolean);
        text.textContent = labels.length ? labels.join(', ') : '(none)';
      } else if (cfg.kind === 'stealthTargets') {
        text.textContent = stealthState.values.length ? stealthState.values.join(', ') : '(none)';
      } else if (cfg.kind === 'ignoreMovement') {
        text.textContent = ignoreMoveState.values.length ? ignoreMoveState.values.join(', ') : '(none)';
      } else if (cfg.kind === 'legalUnitTelepads') {
        text.textContent = legalUnitTelepadState.values.length ? legalUnitTelepadState.values.join(', ') : '(none)';
      } else if (cfg.kind === 'legalBuildingTelepads') {
        text.textContent = legalBuildingTelepadState.values.length ? legalBuildingTelepadState.values.join(', ') : '(none)';
      } else {
        text.textContent = '(none)';
      }
      controlWrap.appendChild(text);
      row.appendChild(controlWrap);
      card.appendChild(row);
      return;
    }
    if (cfg.kind === 'abilities') {
      const options = UNIT_ABILITY_OPTION_KEYS.map((key) => ({ value: key, label: toFriendlyKey(key) }));
      const editor = makeNamedListTokenEditor({
        tabKey: '',
        options,
        values: getUnitAbilitySelections(entry),
        onValuesChange: (values) => {
          rememberUndoSnapshot();
          setUnitAbilitySelections(entry, values);
          setDirty(true);
        }
      });
      controlWrap.appendChild(editor);
    } else if (cfg.kind === 'availableTo') {
      let field = availableField;
      if (!field) {
        if (!Array.isArray(entry.biqFields)) entry.biqFields = [];
        field = { key: 'availableto', baseKey: 'availableto', label: 'Available To', value: '0', originalValue: '0', editable: true };
        entry.biqFields.push(field);
      }
      const selectedIndices = decodeAvailableToIndices(field && field.value);
      const editor = makeNamedListTokenEditor({
        tabKey: 'civilizations',
        options: civOptions,
        values: selectedIndices.map((idx) => String(idx)),
        onValuesChange: (values) => {
          rememberUndoSnapshot();
          if (field) field.value = encodeAvailableToFromIndices(values);
          setDirty(true);
        }
      });
      controlWrap.appendChild(editor);
    } else if (cfg.kind === 'stealthTargets') {
      const editor = makeNamedListTokenEditor({
        tabKey: 'units',
        values: stealthState.values,
        onValuesChange: (values) => {
          rememberUndoSnapshot();
          setUnitListFieldValues(entry, stealthState.key, values);
          setDirty(true);
        }
      });
      controlWrap.appendChild(editor);
    } else if (cfg.kind === 'ignoreMovement') {
      const editor = makeNamedListTokenEditor({
        tabKey: 'terrain',
        values: ignoreMoveState.values,
        onValuesChange: (values) => {
          rememberUndoSnapshot();
          setUnitListFieldValues(entry, ignoreMoveState.key, values);
          setDirty(true);
        }
      });
      controlWrap.appendChild(editor);
    } else if (cfg.kind === 'legalUnitTelepads') {
      const editor = makeNamedListTokenEditor({
        tabKey: 'units',
        values: legalUnitTelepadState.values,
        onValuesChange: (values) => {
          rememberUndoSnapshot();
          setUnitListFieldValues(entry, legalUnitTelepadState.key, values);
          setDirty(true);
        }
      });
      controlWrap.appendChild(editor);
    } else if (cfg.kind === 'legalBuildingTelepads') {
      const editor = makeNamedListTokenEditor({
        tabKey: 'improvements',
        values: legalBuildingTelepadState.values,
        onValuesChange: (values) => {
          rememberUndoSnapshot();
          setUnitListFieldValues(entry, legalBuildingTelepadState.key, values);
          setDirty(true);
        }
      });
      controlWrap.appendChild(editor);
    }
    row.appendChild(controlWrap);
    card.appendChild(row);
  });
  return card;
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
  if (tabKey === 'civilizations' && base === 'diplomacytextindex') {
    const civTab = state.bundle && state.bundle.tabs && state.bundle.tabs.civilizations;
    let options = civTab && Array.isArray(civTab.diplomacyOptions) ? civTab.diplomacyOptions : [];
    if ((!options || options.length === 0) && civTab && Array.isArray(civTab.diplomacySlots)) {
      options = rebuildCivilizationDiplomacyOptions(civTab);
      civTab.diplomacyOptions = options;
    }
    return options.map((opt) => ({
      value: String(opt && opt.value != null ? opt.value : ''),
      label: String(opt && opt.label != null ? opt.label : '')
    })).filter((opt) => opt.value !== '' && opt.label);
  }
  const map = BIQ_FIELD_REFS[tabKey] || {};
  const target = map[base];
  if (!target) return [];
  if (target === 'eras') {
    const names = ['Ancient', 'Middle Ages', 'Industrial', 'Modern'];
    return names.map((name, idx) => ({ value: String(idx), label: `${name} (${idx})` }));
  }
  return makeIndexOptionsForTab(target);
}

function getRuleSectionIndexOptions(sectionCode, { includeNone = false } = {}) {
  const rulesTab = state.bundle && state.bundle.tabs && state.bundle.tabs.rules;
  const sections = rulesTab && Array.isArray(rulesTab.sections) ? rulesTab.sections : [];
  const section = sections.find((s) => String(s && s.code || '').toUpperCase() === String(sectionCode || '').toUpperCase());
  const records = section && Array.isArray(section.records) ? section.records : [];
  const out = records.map((record, idx) => ({
    value: String(Number.isFinite(record && record.index) ? record.index : idx),
    label: String(record && record.name || `${sectionCode} ${idx + 1}`)
  }));
  if (includeNone) {
    out.unshift({ value: '-1', label: 'None' });
  }
  return out;
}

function getEnumOptionsForField(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  if (tabKey === 'governments' && (base === 'diplomatlevel' || base === 'spylevel')) {
    return getRuleSectionIndexOptions('EXPR');
  }
  if (tabKey === 'governments' && base === 'immuneto') {
    return getRuleSectionIndexOptions('ESPN', { includeNone: true });
  }
  const enums = BIQ_FIELD_ENUMS[tabKey] || {};
  return enums[base] || [];
}

function getEnumOptionsForBiqStructureTab(tabKey, field) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  const canon = base.replace(/[^a-z0-9]/g, '');
  if (tabKey === 'rules' && canon === 'defaultdifficultylevel') {
    return getRuleSectionIndexOptions('DIFF');
  }
  if (tabKey === 'players' && canon === 'difficulty') {
    return [{ value: 'Any', label: 'Any' }].concat(getRuleSectionIndexOptions('DIFF'));
  }
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

function resolveTechIndexFromValue(rawValue) {
  const parsed = parseIntFromDisplayValue(rawValue);
  if (parsed != null) return parsed;
  const raw = String(rawValue || '').trim();
  if (!raw) return null;
  const normalized = raw.replace(/^name\s*:/i, '').trim();
  if (!normalized || /^none$/i.test(normalized) || normalized === '-1') return -1;
  const needle = normalized.toLowerCase();
  const tech = getTechEntries().find((entry, fallbackIdx) => {
    const name = String((entry && entry.name) || '').trim().toLowerCase();
    const key = String((entry && entry.civilopediaKey) || '').trim().toLowerCase();
    if (name && name === needle) return true;
    if (key && key === needle) return true;
    if (key && key === `tech_${needle.replace(/\s+/g, '_')}`) return true;
    const biqIdx = Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : fallbackIdx;
    return String(biqIdx) === needle;
  });
  if (!tech) return null;
  return Number.isFinite(tech.biqIndex) ? tech.biqIndex : getTechEntries().indexOf(tech);
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
  const normalized = normalizeConfigToken(value);
  if (!Array.isArray(options)) return null;
  return options.find((opt) => normalizeConfigToken(opt && opt.value) === normalized) || null;
}

function resolveReferenceEntryForPicker(targetTabKey, rawValue, options = []) {
  const tabKey = String(targetTabKey || '').trim();
  if (!tabKey) return null;
  const normalized = normalizeConfigToken(rawValue);
  if (!normalized || normalized === '-1') return null;
  const direct = findOptionByValue(options, normalized);
  if (direct && direct.entry) return direct.entry;
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
  if (!tab || !Array.isArray(tab.entries)) return null;
  const parsed = parseIntFromDisplayValue(normalized);
  if (parsed != null) {
    const byIndex = tab.entries.find((entry, fallbackIdx) => {
      const biqIdx = Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : fallbackIdx;
      return biqIdx === parsed;
    });
    if (byIndex) return byIndex;
  }
  const needle = String(normalized).toLowerCase();
  return tab.entries.find((entry) => {
    const name = String((entry && entry.name) || '').trim().toLowerCase();
    const key = String((entry && entry.civilopediaKey) || '').trim().toLowerCase();
    return (name && name === needle) || (key && key === needle);
  }) || null;
}

function createReferencePicker(config) {
  const opts = config || {};
  const options = Array.isArray(opts.options) ? opts.options : [];
  const targetTabKey = String(opts.targetTabKey || '').trim();
  const readOnly = !!opts.readOnly;
  const noneLabel = String(opts.noneLabel || '(none)');
  const searchPlaceholder = String(opts.searchPlaceholder || 'Search...');
  const showOptionThumbs = opts.showOptionThumbs !== false;
  const rawCurrentValue = String(opts.currentValue ?? '-1');
  const parsedCurrent = parseIntFromDisplayValue(rawCurrentValue);
  const currentValue = parsedCurrent == null ? rawCurrentValue : String(parsedCurrent);
  const onSelect = typeof opts.onSelect === 'function' ? opts.onSelect : null;

  const normalizedOptions = [];
  normalizedOptions.push({ value: '-1', label: noneLabel, entry: null });
  options.forEach((opt) => {
    if (!opt) return;
    const value = normalizeConfigToken(opt.value);
    if (value === '-1') return;
    normalizedOptions.push({
      value,
      label: String(opt.label || value),
      entry: opt.entry || null
    });
  });

  const wrap = document.createElement('div');
  wrap.className = 'tech-picker';
  if (readOnly) wrap.classList.add('read-only');
  const head = document.createElement('div');
  head.className = 'tech-picker-head';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tech-picker-btn';
  const selectedJumpBtn = document.createElement('button');
  selectedJumpBtn.type = 'button';
  selectedJumpBtn.className = 'tech-picker-selected-jump hidden';
  selectedJumpBtn.textContent = '↗';
  selectedJumpBtn.title = 'Open selected item';
  selectedJumpBtn.setAttribute('aria-label', 'Open selected item');
  const buttonThumb = document.createElement('span');
  buttonThumb.className = 'entry-thumb';
  const buttonText = document.createElement('span');
  buttonText.className = 'tech-picker-btn-label';
  let selectedJumpTarget = null;
  let selectedJumpLabel = '';
  const renderButton = (value) => {
    const normalizedValue = (() => {
      const parsed = parseIntFromDisplayValue(value);
      return parsed == null ? String(value ?? '') : String(parsed);
    })();
    const selected = findOptionByValue(normalizedOptions, normalizedValue) || normalizedOptions[0];
    const selectedLabel = selected ? String(selected.label || noneLabel) : noneLabel;
    selectedJumpLabel = selectedLabel;
    buttonText.textContent = selectedLabel;
    buttonText.title = selectedLabel;
    buttonThumb.innerHTML = '';
    selectedJumpTarget = null;
    selectedJumpBtn.classList.add('hidden');
    if (selected && targetTabKey) {
      selectedJumpTarget = selected.entry || resolveReferenceEntryForPicker(targetTabKey, normalizedValue, normalizedOptions);
      if (selectedJumpTarget) {
        loadReferenceListThumbnail(targetTabKey, selectedJumpTarget, buttonThumb);
      }
      if (!readOnly) {
        if (selectedJumpTarget) {
          selectedJumpBtn.classList.remove('hidden');
          selectedJumpBtn.title = `Open ${selectedLabel}`;
          selectedJumpBtn.setAttribute('aria-label', `Open ${selectedLabel}`);
        }
      }
      button.title = readOnly ? `Open ${selectedLabel}` : selectedLabel;
      button.setAttribute('aria-label', readOnly ? `Open ${selectedLabel}` : selectedLabel);
      if (readOnly) {
        appendDebugLog('ref-picker:readonly:resolve', {
          tab: targetTabKey,
          value: normalizedValue,
          label: selectedLabel,
          hasOptionEntry: !!(selected && selected.entry),
          hasResolvedTarget: !!selectedJumpTarget,
          targetKey: selectedJumpTarget ? String(selectedJumpTarget.civilopediaKey || '') : ''
        });
      }
    }
  };
  renderButton(currentValue);
  button.appendChild(buttonThumb);
  button.appendChild(buttonText);
  head.appendChild(button);
  if (!readOnly) head.appendChild(selectedJumpBtn);
  wrap.appendChild(head);

  if (readOnly) {
    button.addEventListener('click', (ev) => {
      ev.preventDefault();
      appendDebugLog('ref-picker:readonly:click', {
        tab: targetTabKey,
        label: selectedJumpLabel,
        hasTarget: !!selectedJumpTarget,
        targetKey: selectedJumpTarget ? String(selectedJumpTarget.civilopediaKey || '') : ''
      });
      if (!selectedJumpTarget || !targetTabKey) return;
      navigateToReferenceEntry(targetTabKey, selectedJumpTarget);
    });
    button.addEventListener('mouseenter', () => {
      appendDebugLog('ref-picker:readonly:hover', {
        tab: targetTabKey,
        label: selectedJumpLabel,
        hasTarget: !!selectedJumpTarget,
        targetKey: selectedJumpTarget ? String(selectedJumpTarget.civilopediaKey || '') : ''
      });
      if (!selectedJumpTarget || !selectedJumpTarget.civilopediaKey) return;
      showPediaLinkPreview(button, selectedJumpTarget.civilopediaKey, selectedJumpLabel);
    });
    button.addEventListener('mouseleave', () => {
      hidePediaLinkPreviewSoon();
    });
    button.addEventListener('focus', () => {
      if (!selectedJumpTarget || !selectedJumpTarget.civilopediaKey) return;
      showPediaLinkPreview(button, selectedJumpTarget.civilopediaKey, selectedJumpLabel);
    });
    button.addEventListener('blur', () => {
      hidePediaLinkPreviewSoon();
    });
    return wrap;
  }

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
  const pendingThumbNodes = [];
  const maybeLoadThumbForNode = (thumbNode) => {
    if (!thumbNode || thumbNode.dataset.thumbPending !== '1') return false;
    if (!showOptionThumbs || !targetTabKey) return false;
    const entry = thumbNode.__thumbEntry || null;
    if (!entry) return false;
    thumbNode.dataset.thumbPending = '0';
    loadReferenceListThumbnail(targetTabKey, entry, thumbNode);
    return true;
  };
  const hydrateVisibleOptionThumbs = (limit = 32) => {
    if (!showOptionThumbs || !targetTabKey) return;
    let remaining = Math.max(1, Number(limit) || 32);
    const menuRect = menu.getBoundingClientRect();
    for (let i = 0; i < pendingThumbNodes.length && remaining > 0; i += 1) {
      const node = pendingThumbNodes[i];
      if (!node || node.dataset.thumbPending !== '1') continue;
      const row = node.closest('.tech-picker-row');
      if (!row || row.classList.contains('hidden')) continue;
      const rowRect = row.getBoundingClientRect();
      if (rowRect.bottom < (menuRect.top - 42) || rowRect.top > (menuRect.bottom + 42)) continue;
      if (maybeLoadThumbForNode(node)) remaining -= 1;
    }
  };
  normalizedOptions.forEach((opt) => {
    const row = document.createElement('div');
    row.className = 'tech-picker-row';
    row.dataset.search = String(opt.label || '').toLowerCase();
    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'tech-picker-row-main';
    const thumb = document.createElement('span');
    thumb.className = 'entry-thumb';
    if (showOptionThumbs && opt.entry && targetTabKey) {
      thumb.dataset.thumbPending = '1';
      thumb.__thumbEntry = opt.entry;
      pendingThumbNodes.push(thumb);
    }
    selectBtn.appendChild(thumb);
    const text = document.createElement('span');
    text.textContent = String(opt.label || '');
    selectBtn.appendChild(text);
    selectBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      renderButton(opt.value);
      menu.classList.add('hidden');
      if (onSelect) onSelect(opt.value);
    });
    row.appendChild(selectBtn);
    if (opt.entry && targetTabKey) {
      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'tech-picker-row-jump';
      jumpBtn.textContent = '↗';
      jumpBtn.title = `Open ${opt.label}`;
      jumpBtn.setAttribute('aria-label', `Open ${opt.label}`);
      jumpBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        menu.classList.add('hidden');
        navigateToReferenceEntry(targetTabKey, opt.entry);
      });
      row.appendChild(jumpBtn);
    }
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
      hydrateVisibleOptionThumbs(28);
      requestAnimationFrame(() => hydrateVisibleOptionThumbs(28));
      search.focus();
    }
  });
  selectedJumpBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!selectedJumpTarget || !targetTabKey) return;
    menu.classList.add('hidden');
    navigateToReferenceEntry(targetTabKey, selectedJumpTarget);
  });
  search.addEventListener('input', () => {
    const needle = search.value.trim().toLowerCase();
    Array.from(listWrap.querySelectorAll('.tech-picker-row')).forEach((row) => {
      const hay = String(row.dataset.search || '');
      row.classList.toggle('hidden', !!needle && !hay.includes(needle));
    });
    hydrateVisibleOptionThumbs(28);
  });
  menu.addEventListener('scroll', () => {
    if (menu.classList.contains('hidden')) return;
    hydrateVisibleOptionThumbs(20);
  });
  document.addEventListener('click', (ev) => {
    if (!wrap.contains(ev.target)) menu.classList.add('hidden');
  });
  return wrap;
}

function createColorSlotPicker(config) {
  const opts = config || {};
  const max = Number.isFinite(opts.max) ? Math.max(1, Number(opts.max)) : 31;
  const onSelect = typeof opts.onSelect === 'function' ? opts.onSelect : null;
  const wrap = document.createElement('div');
  wrap.className = 'color-slot-picker';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'color-slot-picker-btn';
  const swatch = document.createElement('span');
  swatch.className = 'color-slot-swatch';
  const text = document.createElement('span');
  const parseValue = (value) => {
    const n = Number.parseInt(String(value ?? '').trim(), 10);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, n));
  };
  let current = parseValue(opts.currentValue);
  const renderBtn = () => {
    swatch.style.background = colorFromNumber(current);
    text.textContent = `Color ${current}`;
  };
  renderBtn();
  button.appendChild(swatch);
  button.appendChild(text);
  wrap.appendChild(button);

  const menu = document.createElement('div');
  menu.className = 'color-slot-picker-menu hidden';
  const grid = document.createElement('div');
  grid.className = 'color-slot-grid';
  for (let i = 0; i <= max; i += 1) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'color-slot-item';
    item.title = `Color ${i}`;
    item.setAttribute('aria-label', `Color ${i}`);
    item.style.background = colorFromNumber(i);
    if (i === current) item.classList.add('active');
    item.addEventListener('click', (ev) => {
      ev.preventDefault();
      current = i;
      renderBtn();
      Array.from(grid.querySelectorAll('.color-slot-item')).forEach((node, idx) => {
        node.classList.toggle('active', idx === current);
      });
      menu.classList.add('hidden');
      if (onSelect) onSelect(String(i));
    });
    grid.appendChild(item);
  }
  menu.appendChild(grid);
  wrap.appendChild(menu);

  button.addEventListener('click', (ev) => {
    ev.preventDefault();
    menu.classList.toggle('hidden');
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

function ensureBiqFieldByBaseKey(entry, baseKey, label = '', initialValue = '') {
  const target = String(baseKey || '').toLowerCase();
  if (!entry || !target) return null;
  let field = getBiqFieldByBaseKey(entry, target);
  if (field) return field;
  if (!Array.isArray(entry.biqFields)) entry.biqFields = [];
  field = {
    key: target,
    baseKey: target,
    label: label || toFriendlyKey(target),
    value: String(initialValue || ''),
    originalValue: '',
    editable: true
  };
  entry.biqFields.push(field);
  return field;
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
      const idx = resolveTechIndexFromValue(field.value);
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
  const parsedCurrent = resolveTechIndexFromValue(field && field.value);
  return createReferencePicker({
    options: techOptions,
    targetTabKey: 'technologies',
    currentValue: parsedCurrent == null ? '-1' : String(parsedCurrent),
    searchPlaceholder: 'Search tech...',
    noneLabel: '(none)',
    onSelect: (value) => {
      rememberUndoSnapshot();
      field.value = String(value);
      if (onChange) onChange();
    }
  });
}

const TECH_TREE_ERA_BACKGROUND_CANDIDATES = {
  0: ['Art/Advisors/science_ancient.pcx'],
  1: ['Art/Advisors/science_middle.pcx'],
  2: ['Art/Advisors/science_industrial_new.pcx', 'Art/Advisors/science_industrial.pcx'],
  3: ['Art/Advisors/science_modern.pcx']
};

function getEraOptionsForTechTree() {
  const fromBiq = makeBiqSectionIndexOptions('ERAS', false);
  if (Array.isArray(fromBiq) && fromBiq.length > 0) {
    return fromBiq.map((opt, idx) => ({
      value: String(opt.value),
      label: String(opt.label || `Era ${idx + 1}`)
    }));
  }
  const fallback = ['Ancient Times', 'Middle Ages', 'Industrial Age', 'Modern Times'];
  return fallback.map((name, idx) => ({ value: String(idx), label: name }));
}

function getTechField(entry, baseKey) {
  return getBiqFieldByBaseKey(entry, baseKey);
}

function getTechFieldInt(entry, baseKey, fallback = -1) {
  const field = getTechField(entry, baseKey);
  const n = parseIntFromDisplayValue(field && field.value);
  return (n == null) ? fallback : n;
}

function getTechPrereqFields(entry) {
  const fields = Array.isArray(entry && entry.biqFields) ? entry.biqFields : [];
  const keyed = fields.filter((field) => {
    const base = String(field && (field.baseKey || '')).toLowerCase();
    const key = String(field && (field.key || '')).toLowerCase();
    if (base === 'prerequisite' || base.startsWith('prerequisite')) return true;
    if (key === 'prerequisite' || key.startsWith('prerequisite')) return true;
    return false;
  });
  keyed.sort((a, b) => {
    const ak = String((a && a.key) || '').toLowerCase();
    const bk = String((b && b.key) || '').toLowerCase();
    const ai = Number.parseInt((ak.match(/(\d+)$/) || [])[1] || '0', 10) || 0;
    const bi = Number.parseInt((bk.match(/(\d+)$/) || [])[1] || '0', 10) || 0;
    if (ai !== bi) return ai - bi;
    return ak.localeCompare(bk);
  });
  return keyed.slice(0, 4);
}

function ensureTechField(entry, baseKey, label, initialValue = '0') {
  if (!entry) return null;
  let field = getTechField(entry, baseKey);
  if (field) return field;
  if (!Array.isArray(entry.biqFields)) entry.biqFields = [];
  field = {
    key: baseKey,
    baseKey,
    label: label || baseKey,
    value: String(initialValue),
    editable: true
  };
  entry.biqFields.push(field);
  return field;
}

function setTechFieldInt(entry, baseKey, label, value) {
  const field = ensureTechField(entry, baseKey, label, '0');
  if (!field) return;
  field.value = String(Number.isFinite(value) ? Math.round(value) : 0);
}

function ensureTechPrereqFieldAt(entry, slotIndex) {
  const idx = Math.max(0, Math.min(3, Number(slotIndex) || 0));
  const fields = getTechPrereqFields(entry);
  if (fields[idx]) return fields[idx];
  if (!entry) return null;
  if (!Array.isArray(entry.biqFields)) entry.biqFields = [];
  const suffix = entry.biqFields.filter((f) => {
    const k = String((f && (f.key || f.baseKey)) || '').toLowerCase();
    return k.startsWith('prerequisite');
  }).length + 1;
  const field = {
    key: suffix === 1 ? 'prerequisite' : `prerequisite_${suffix}`,
    baseKey: 'prerequisite',
    label: `Prerequisite ${suffix}`,
    value: '-1',
    editable: true
  };
  entry.biqFields.push(field);
  return field;
}

function getTechTreeData(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const nodes = list.map((entry, fallbackIdx) => {
    const id = Number.isFinite(entry && entry.biqIndex) ? entry.biqIndex : fallbackIdx;
    const era = getTechFieldInt(entry, 'era', 0);
    const x = Math.max(0, getTechFieldInt(entry, 'x', 0));
    const y = Math.max(0, getTechFieldInt(entry, 'y', 0));
    const prereqs = getTechPrereqFields(entry)
      .map((field) => resolveTechIndexFromValue(field && field.value))
      .filter((v, idx, arr) => v >= 0 && arr.indexOf(v) === idx);
    return {
      id,
      era,
      x,
      y,
      prereqs,
      entry,
      index: fallbackIdx
    };
  });
  const byId = new Map();
  nodes.forEach((node) => byId.set(node.id, node));
  const dependents = new Map();
  nodes.forEach((node) => {
    node.prereqs.forEach((pre) => {
      if (!dependents.has(pre)) dependents.set(pre, []);
      dependents.get(pre).push(node.id);
    });
  });
  return { nodes, byId, dependents };
}

function createTechLinkPills({ title, ids, byId, onJump }) {
  const wrap = document.createElement('div');
  wrap.className = 'tech-tree-links';
  const label = document.createElement('strong');
  label.textContent = `${title}:`;
  wrap.appendChild(label);
  const idsList = Array.isArray(ids) ? ids : [];
  if (idsList.length === 0) {
    const none = document.createElement('span');
    none.className = 'hint';
    none.textContent = '(none)';
    wrap.appendChild(none);
    return wrap;
  }
  idsList.forEach((id) => {
    const target = byId.get(id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tech-link-pill';
    const thumb = document.createElement('span');
    thumb.className = 'entry-thumb';
    if (target && target.entry) {
      loadReferenceListThumbnail('technologies', target.entry, thumb);
    }
    const label = document.createElement('span');
    label.textContent = target ? String(target.entry && target.entry.name || `Tech ${id}`) : `Tech ${id}`;
    btn.appendChild(thumb);
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      if (typeof onJump === 'function') onJump(id);
    });
    wrap.appendChild(btn);
  });
  return wrap;
}

function createTechTreePanel({
  tab,
  tabKey,
  selectedEntry,
  selectedBaseIndex,
  referenceEditable,
  onSelectBaseIndex
}) {
  const section = document.createElement('div');
  section.className = 'section-card source-section tech-tree-section';
  const top = document.createElement('div');
  top.className = 'section-top';
  top.innerHTML = '<strong>Tech Tree</strong>';
  section.appendChild(top);

  const allEntries = (tab && Array.isArray(tab.entries)) ? tab.entries : [];
  const eraOptions = getEraOptionsForTechTree();
  const selectedEraFromTech = getTechFieldInt(selectedEntry, 'era', 0);
  const initialEra = selectedEraFromTech;

  const controls = document.createElement('div');
  controls.className = 'tech-tree-controls';
  const eraLabel = document.createElement('label');
  eraLabel.textContent = 'Era';
  const eraSelect = document.createElement('select');
  eraOptions.forEach((opt) => {
    const o = document.createElement('option');
    o.value = String(opt.value);
    o.textContent = String(opt.label);
    eraSelect.appendChild(o);
  });
  const hasEra = eraOptions.some((opt) => Number.parseInt(String(opt.value), 10) === initialEra);
  eraSelect.value = hasEra ? String(initialEra) : String((eraOptions[0] && eraOptions[0].value) || '0');
  state.techTreeEraSelectionByTab[tabKey] = Number.parseInt(eraSelect.value, 10) || 0;
  eraLabel.appendChild(eraSelect);
  controls.appendChild(eraLabel);

  const snapSeed = state.techTreeSnapByTab[tabKey] && typeof state.techTreeSnapByTab[tabKey] === 'object'
    ? state.techTreeSnapByTab[tabKey]
    : { enabled: true };
  const snapWrap = document.createElement('label');
  snapWrap.className = 'tech-tree-snap-toggle';
  const snapCheck = document.createElement('input');
  snapCheck.type = 'checkbox';
  snapCheck.checked = !!snapSeed.enabled;
  const snapText = document.createElement('span');
  snapText.textContent = 'Snap to Grid';
  snapWrap.appendChild(snapCheck);
  snapWrap.appendChild(snapText);
  controls.appendChild(snapWrap);
  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'ghost tech-tree-inline-btn tech-tree-undo-btn';
  undoBtn.textContent = 'Undo';
  controls.appendChild(undoBtn);

  const dragHint = document.createElement('span');
  dragHint.className = 'hint';
  dragHint.textContent = referenceEditable
    ? 'Click to select. Drag the selected tech to update BIQ X/Y.'
    : 'Read-only preview of prerequisites and unlock paths.';
  controls.appendChild(dragHint);
  const alignmentHint = document.createElement('span');
  alignmentHint.className = 'hint hint-compact';
  alignmentHint.textContent = 'Note: this layout approximates Civ III and may not match exact in-game positions at every resolution.';
  controls.appendChild(alignmentHint);
  const coordsChip = document.createElement('span');
  coordsChip.className = 'tech-tree-live-coords';
  coordsChip.textContent = 'X: -, Y: -';
  controls.appendChild(coordsChip);
  section.appendChild(controls);

  const stageWrap = document.createElement('div');
  stageWrap.className = 'tech-tree-stage-wrap';
  const stage = document.createElement('div');
  stage.className = 'tech-tree-stage';
  const bg = document.createElement('div');
  bg.className = 'tech-tree-bg';
  const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  lines.classList.add('tech-tree-lines');
  const nodesLayer = document.createElement('div');
  nodesLayer.className = 'tech-tree-nodes';
  stage.appendChild(bg);
  stage.appendChild(lines);
  stage.appendChild(nodesLayer);
  stageWrap.appendChild(stage);
  section.appendChild(stageWrap);

  const { nodes, byId } = getTechTreeData(allEntries);
  let selectedId = Number.isFinite(selectedEntry && selectedEntry.biqIndex) ? selectedEntry.biqIndex : selectedBaseIndex;
  let bgRenderToken = 0;
  const NODE_W = 136;
  const NODE_H = 44;
  const setCoordsFromNode = (node) => {
    if (!node || !coordsChip) return;
    const x = Math.round(Number.isFinite(node.vx) ? node.vx : node.x);
    const y = Math.round(Number.isFinite(node.vy) ? node.vy : node.y);
    coordsChip.textContent = `X: ${x}, Y: ${y}`;
  };
  const setModalTitleForNode = (node) => {
    if (!techTreeModal.title || !node || !node.entry) return;
    techTreeModal.title.textContent = `Tech Tree - ${node.entry.name}`;
  };
  const refreshUndoButton = () => {
    if (undoBtn) undoBtn.disabled = !state.undoSnapshot;
  };
  const reopenForCurrentSelection = () => {
    const currentTab = state.bundle && state.bundle.tabs && state.bundle.tabs[tabKey];
    if (!currentTab || !Array.isArray(currentTab.entries) || currentTab.entries.length === 0) return;
    let baseIndex = Number(state.referenceSelection[tabKey]);
    if (!Number.isFinite(baseIndex) || baseIndex < 0 || baseIndex >= currentTab.entries.length) {
      baseIndex = Number.isFinite(selectedBaseIndex) ? selectedBaseIndex : 0;
    }
    if (baseIndex < 0 || baseIndex >= currentTab.entries.length) baseIndex = 0;
    const nextEntry = currentTab.entries[baseIndex];
    openTechTreeModal({
      tab: currentTab,
      tabKey,
      selectedEntry: nextEntry,
      selectedBaseIndex: baseIndex,
      referenceEditable,
      onSelectBaseIndex
    });
  };
  undoBtn.addEventListener('click', () => {
    if (!state.undoSnapshot) return;
    undoOneStep();
    refreshUndoButton();
    reopenForCurrentSelection();
  });
  refreshUndoButton();

  const renderForEra = async () => {
    const renderToken = ++bgRenderToken;
    const eraValue = Number.parseInt(eraSelect.value, 10) || 0;
    state.techTreeEraSelectionByTab[tabKey] = eraValue;
    persistCurrentViewSnapshot();
    nodesLayer.innerHTML = '';
    while (lines.firstChild) lines.removeChild(lines.firstChild);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'tech-tree-arrowhead');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', 'M 0 0 L 6 3 L 0 6 z');
    head.setAttribute('fill', '#cf4e20');
    marker.appendChild(head);
    defs.appendChild(marker);
    lines.appendChild(defs);

    let bgPreview = null;
    const candidates = TECH_TREE_ERA_BACKGROUND_CANDIDATES[eraValue] || [];
    for (const assetPath of candidates) {
      try {
        const res = await window.c3xManager.getPreview({
          kind: 'civilopediaIcon',
          civ3Path: state.settings.civ3Path,
          scenarioPath: state.settings.scenarioPath,
          scenarioPaths: getScenarioPreviewPaths(),
          assetPath
        });
        if (res && res.ok) {
          bgPreview = res;
          break;
        }
      } catch (_err) {
        // Try next candidate.
      }
    }
    if (renderToken !== bgRenderToken) return;

    let baseW = 1024;
    let baseH = 768;
    if (bgPreview && bgPreview.width && bgPreview.height) {
      baseW = Math.max(baseW, Number(bgPreview.width) || baseW);
      baseH = Math.max(baseH, Number(bgPreview.height) || baseH);
      bg.innerHTML = '';
      const c = document.createElement('canvas');
      c.width = Number(bgPreview.width) || baseW;
      c.height = Number(bgPreview.height) || baseH;
      c.className = 'tech-tree-bg-canvas';
      drawPreviewFrameToCanvas(bgPreview, c);
      bg.appendChild(c);
    } else {
      bg.innerHTML = '';
    }

    const eraNodes = nodes.filter((node) => node.era === eraValue);
    const overlapCounts = new Map();
    eraNodes.forEach((node) => {
      const key = `${Math.round(node.x)},${Math.round(node.y)}`;
      const n = overlapCounts.get(key) || 0;
      overlapCounts.set(key, n + 1);
      node.vx = node.x + ((n % 4) * 38);
      node.vy = node.y + (Math.floor(n / 4) * 30);
    });
    const maxNodeX = eraNodes.reduce((m, n) => Math.max(m, n.x + 180), 0);
    const maxNodeY = eraNodes.reduce((m, n) => Math.max(m, n.y + 80), 0);
    const contentW = Math.max(baseW, maxNodeX + 24);
    const contentH = Math.max(baseH, maxNodeY + 24);
    stage.style.width = `${contentW}px`;
    stage.style.height = `${contentH}px`;
    lines.setAttribute('width', String(contentW));
    lines.setAttribute('height', String(contentH));
    lines.setAttribute('viewBox', `0 0 ${contentW} ${contentH}`);

    const selectedNode = byId.get(selectedId) || null;
    if (selectedNode) {
      setCoordsFromNode(selectedNode);
      setModalTitleForNode(selectedNode);
    }

    const edgeByNodeId = new Map();
    const nodeElById = new Map();
    const allEdges = [];
    const registerEdge = (nodeId, edgeObj) => {
      if (!edgeByNodeId.has(nodeId)) edgeByNodeId.set(nodeId, []);
      edgeByNodeId.get(nodeId).push(edgeObj);
    };
    const refreshSelectedVisuals = (activeId) => {
      nodeElById.forEach((el, id) => {
        if (!el) return;
        el.classList.toggle('selected', id === activeId);
      });
      allEdges.forEach((edgeObj) => {
        const isSelectedEdge = edgeObj.source.id === activeId || edgeObj.target.id === activeId;
        edgeObj.path.setAttribute('class', isSelectedEdge ? 'tech-tree-link is-selected' : 'tech-tree-link');
      });
    };
    const selectNodeInPlace = (node) => {
      if (!node) return;
      selectedId = node.id;
      setCoordsFromNode(node);
      setModalTitleForNode(node);
      refreshSelectedVisuals(selectedId);
      if (typeof onSelectBaseIndex === 'function') onSelectBaseIndex(node.index);
    };
    const getNodeCenter = (node, nodeEl) => {
      if (nodeEl && nodeEl.isConnected) {
        const stageRect = stage.getBoundingClientRect();
        const rect = nodeEl.getBoundingClientRect();
        return {
          x: (rect.left - stageRect.left) + (rect.width / 2),
          y: (rect.top - stageRect.top) + (rect.height / 2)
        };
      }
      const nx = Number.isFinite(node.vx) ? node.vx : node.x;
      const ny = Number.isFinite(node.vy) ? node.vy : node.y;
      return { x: nx + (NODE_W / 2), y: ny + (NODE_H / 2) };
    };
    const placeEdge = (edgeObj) => {
      const src = edgeObj.source;
      const dst = edgeObj.target;
      const srcCenter = getNodeCenter(src, nodeElById.get(src.id));
      const dstCenter = getNodeCenter(dst, nodeElById.get(dst.id));
      const srcEl = nodeElById.get(src.id);
      const dstEl = nodeElById.get(dst.id);
      const srcW = srcEl && srcEl.isConnected ? srcEl.getBoundingClientRect().width : NODE_W;
      const dstW = dstEl && dstEl.isConnected ? dstEl.getBoundingClientRect().width : NODE_W;
      const dir = dstCenter.x >= srcCenter.x ? 1 : -1;
      const sx = srcCenter.x + (dir * (srcW / 2));
      const sy = srcCenter.y;
      const tx = dstCenter.x - (dir * (dstW / 2));
      const ty = dstCenter.y;
      const dx = tx - sx;
      const elbow = Math.max(18, Math.min(96, Math.abs(dx) * 0.42));
      const mx1 = sx + (elbow * dir);
      const mx2 = tx - (elbow * dir);
      const d = Math.abs(dx) < 28
        ? `M ${sx} ${sy} L ${(sx + tx) / 2} ${sy} L ${(sx + tx) / 2} ${ty} L ${tx} ${ty}`
        : `M ${sx} ${sy} L ${mx1} ${sy} L ${mx2} ${ty} L ${tx} ${ty}`;
      edgeObj.path.setAttribute('d', d);
    };
    const redrawLines = () => {
      const seen = new Set();
      edgeByNodeId.forEach((arr) => {
        arr.forEach((edgeObj) => {
          if (seen.has(edgeObj)) return;
          seen.add(edgeObj);
          placeEdge(edgeObj);
        });
      });
    };
    eraNodes.forEach((node) => {
      const elNode = document.createElement('button');
      elNode.type = 'button';
      elNode.className = 'tech-tree-node';
      if (node.id === selectedId) elNode.classList.add('selected');
      elNode.style.left = `${node.vx}px`;
      elNode.style.top = `${node.vy}px`;
      const thumb = document.createElement('span');
      thumb.className = 'entry-thumb';
      const label = document.createElement('span');
      label.className = 'tech-tree-node-label';
      label.textContent = String(node.entry && node.entry.name || `Tech ${node.id}`);
      elNode.appendChild(thumb);
      elNode.appendChild(label);
      loadReferenceListThumbnail('technologies', node.entry, thumb);
      nodeElById.set(node.id, elNode);

      let drag = null;
      elNode.addEventListener('pointerdown', (ev) => {
        if (ev.button !== 0) return;
        if (!referenceEditable) return;
        if (node.id !== selectedId) {
          selectNodeInPlace(node);
        }
        rememberUndoSnapshot();
        refreshUndoButton();
        drag = {
          pointerId: ev.pointerId,
          startX: ev.clientX,
          startY: ev.clientY,
          startLeft: Number.isFinite(node.vx) ? node.vx : node.x,
          startTop: Number.isFinite(node.vy) ? node.vy : node.y,
          moved: false
        };
        elNode.setPointerCapture(ev.pointerId);
      });
      elNode.addEventListener('pointermove', (ev) => {
        if (!drag || drag.pointerId !== ev.pointerId) return;
        const dx = ev.clientX - drag.startX;
        const dy = ev.clientY - drag.startY;
        const nextX = Math.max(0, Math.min(contentW - 140, drag.startLeft + dx));
        const nextY = Math.max(0, Math.min(contentH - 52, drag.startTop + dy));
        drag.moved = true;
        node.vx = nextX;
        node.vy = nextY;
        elNode.style.left = `${nextX}px`;
        elNode.style.top = `${nextY}px`;
        setCoordsFromNode(node);
        const linked = edgeByNodeId.get(node.id) || [];
        linked.forEach((edgeObj) => placeEdge(edgeObj));
      });
      const finishDrag = (ev) => {
        if (!drag || drag.pointerId !== ev.pointerId) return;
        const moved = drag.moved || Math.abs(ev.clientX - drag.startX) > 3 || Math.abs(ev.clientY - drag.startY) > 3;
        drag = null;
        if (moved) {
          elNode.dataset.dragged = '1';
          window.setTimeout(() => {
            if (elNode && elNode.dataset) delete elNode.dataset.dragged;
          }, 120);
        }
        if (!referenceEditable || !moved) return;
        const finalX = Math.round(Number.isFinite(node.vx) ? node.vx : node.x);
        const finalY = Math.round(Number.isFinite(node.vy) ? node.vy : node.y);
        let snappedX = finalX;
        let snappedY = finalY;
        const snapEnabled = !!snapCheck.checked;
        const gridSize = 16;
        if (snapEnabled) {
          snappedX = Math.round(finalX / gridSize) * gridSize;
          snappedY = Math.round(finalY / gridSize) * gridSize;
        }
        node.x = snappedX;
        node.y = snappedY;
        node.vx = finalX;
        node.vy = finalY;
        node.vx = snappedX;
        node.vy = snappedY;
        setTechFieldInt(node.entry, 'x', 'X Position', snappedX);
        setTechFieldInt(node.entry, 'y', 'Y Position', snappedY);
        elNode.style.left = `${snappedX}px`;
        elNode.style.top = `${snappedY}px`;
        setCoordsFromNode(node);
        const linked = edgeByNodeId.get(node.id) || [];
        linked.forEach((edgeObj) => placeEdge(edgeObj));
        setDirty(true);
      };
      elNode.addEventListener('pointerup', finishDrag);
      elNode.addEventListener('pointercancel', finishDrag);
      elNode.addEventListener('click', () => {
        if (elNode.dataset.dragged === '1') return;
        selectNodeInPlace(node);
      });
      elNode.addEventListener('dblclick', () => {
        if (elNode.dataset.dragged === '1') return;
        selectNodeInPlace(node);
        closeTechTreeModal();
      });
      nodesLayer.appendChild(elNode);
    });

    eraNodes.forEach((target) => {
      target.prereqs.forEach((sourceId) => {
        const source = byId.get(sourceId);
        if (!source || source.era !== eraValue) return;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', (selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id))
          ? 'tech-tree-link is-selected'
          : 'tech-tree-link');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#tech-tree-arrowhead)');
        const edgeObj = { source, target, path };
        placeEdge(edgeObj);
        registerEdge(source.id, edgeObj);
        registerEdge(target.id, edgeObj);
        allEdges.push(edgeObj);
        lines.appendChild(path);
      });
    });
    redrawLines();
  };

  eraSelect.addEventListener('change', () => {
    void renderForEra();
  });
  snapCheck.addEventListener('change', () => {
    state.techTreeSnapByTab[tabKey] = {
      enabled: !!snapCheck.checked
    };
    persistCurrentViewSnapshot();
  });
  void renderForEra();
  return section;
}

function ensureTechTreeModalNode() {
  if (techTreeModal.node && techTreeModal.node.isConnected) return techTreeModal.node;
  const overlay = document.createElement('div');
  overlay.className = 'tech-tree-modal-overlay hidden';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="tech-tree-modal-panel" role="dialog" aria-modal="true" aria-label="Tech Tree">
      <div class="tech-tree-modal-header">
        <strong id="tech-tree-modal-title">Tech Tree</strong>
        <button type="button" class="ghost" data-act="close">Close</button>
      </div>
      <div id="tech-tree-modal-body" class="tech-tree-modal-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  techTreeModal.node = overlay;
  techTreeModal.body = overlay.querySelector('#tech-tree-modal-body');
  techTreeModal.title = overlay.querySelector('#tech-tree-modal-title');
  const closeBtn = overlay.querySelector('[data-act="close"]');
  if (closeBtn) closeBtn.addEventListener('click', () => closeTechTreeModal());
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeTechTreeModal();
  });
  return overlay;
}

function closeTechTreeModal() {
  const overlay = ensureTechTreeModalNode();
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  if (techTreeModal.body) techTreeModal.body.innerHTML = '';
}

function openTechTreeModal(config) {
  const overlay = ensureTechTreeModalNode();
  if (techTreeModal.title) {
    const selected = config && config.selectedEntry;
    const label = selected && selected.name ? `Tech Tree - ${selected.name}` : 'Tech Tree';
    techTreeModal.title.textContent = label;
  }
  if (techTreeModal.body) {
    techTreeModal.body.innerHTML = '';
    const panel = createTechTreePanel(config || {});
    techTreeModal.body.appendChild(panel);
  }
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function ensureMapModalNode() {
  if (mapModal.node && mapModal.node.isConnected) return mapModal.node;
  const overlay = document.createElement('div');
  overlay.className = 'map-editor-modal-overlay hidden';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="map-editor-modal-panel" role="dialog" aria-modal="true" aria-label="Map Editor">
      <div class="map-editor-modal-header">
        <strong id="map-editor-modal-title">Map Editor</strong>
        <button type="button" class="ghost" data-act="close">Close</button>
      </div>
      <div id="map-editor-modal-body" class="map-editor-modal-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  mapModal.node = overlay;
  mapModal.body = overlay.querySelector('#map-editor-modal-body');
  mapModal.title = overlay.querySelector('#map-editor-modal-title');
  const closeBtn = overlay.querySelector('[data-act="close"]');
  if (closeBtn) closeBtn.addEventListener('click', () => closeMapModal());
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeMapModal();
  });
  return overlay;
}

function renderMapModalBody() {
  if (!mapModal.body || !mapModal.tab || !mapModal.tileSection) return;
  mapModal.body.innerHTML = '';
  try {
    mapModal.body.appendChild(renderBiqMapSection(mapModal.tab, mapModal.tileSection, { inModal: true }));
  } catch (err) {
    const card = document.createElement('div');
    card.className = 'section-card';
    const title = document.createElement('div');
    title.className = 'section-top';
    title.innerHTML = '<strong>Map Failed To Open</strong>';
    const note = document.createElement('p');
    note.className = 'warning';
    note.textContent = String(err && err.message || err || 'Unknown map modal render error');
    card.appendChild(title);
    card.appendChild(note);
    mapModal.body.appendChild(card);
    setStatus(`Map editor failed to render: ${String(err && err.message || err || 'unknown error')}`, true);
  }
}

function closeMapModal() {
  if (state.biqMapZoomAnimRaf) {
    window.cancelAnimationFrame(state.biqMapZoomAnimRaf);
    state.biqMapZoomAnimRaf = 0;
  }
  state.biqMapZoomAnim = null;
  const overlay = ensureMapModalNode();
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  if (mapModal.body) mapModal.body.innerHTML = '';
  mapModal.tab = null;
  mapModal.tileSection = null;
}

function openMapModal(config) {
  const cfg = config || {};
  const tab = cfg.tab || null;
  const tileSection = cfg.tileSection || null;
  if (!tab || !tileSection) return;
  const overlay = ensureMapModalNode();
  mapModal.tab = tab;
  mapModal.tileSection = tileSection;
  if (mapModal.title) {
    mapModal.title.textContent = String(cfg.title || `${tab.title || 'Map'} Editor`);
  }
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  renderMapModalBody();
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

function findTerrainRecordSelectionByEntry(sectionCode, entry) {
  const targetCode = String(sectionCode || '').toUpperCase();
  const terrainTab = state.bundle && state.bundle.tabs && state.bundle.tabs.terrain;
  if (!terrainTab || !Array.isArray(terrainTab.sections)) return null;
  const sectionIndex = terrainTab.sections.findIndex((section) => String(section && section.code || '').toUpperCase() === targetCode);
  if (sectionIndex < 0) return null;
  const section = terrainTab.sections[sectionIndex];
  const records = Array.isArray(section && section.records) ? section.records : [];
  const targetKey = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
  const targetName = normalizeSearchText(entry && entry.name || '');
  let recordIndex = records.findIndex((record) => normalizeTerrainCivilopediaKey(targetCode, record) === targetKey);
  if (recordIndex < 0 && targetName) {
    recordIndex = records.findIndex((record) => normalizeSearchText(record && record.name || '').includes(targetName));
  }
  if (recordIndex < 0) return null;
  return { section, sectionIndex, recordIndex };
}

function navigateToTerrainRecordSelection(hit) {
  if (!hit || !hit.section) return false;
  navigateWithHistory(() => {
    state.activeTab = 'terrain';
    state.biqSectionSelectionByTab.terrain = hit.sectionIndex;
    state.biqRecordSelection[hit.section.id] = hit.recordIndex;
  }, { preserveTabScroll: false });
  return true;
}

function navigateToCivilopediaKey(civilopediaKey) {
  if (!state.bundle || !state.bundle.tabs) return false;
  const tabKey = mapCivilopediaKeyToTabKey(civilopediaKey);
  if (!tabKey || !state.bundle.tabs[tabKey]) return false;
  if (tabKey === 'terrain') {
    const hit = findTerrainRecordSelectionByCivilopediaKey(civilopediaKey);
    return navigateToTerrainRecordSelection(hit);
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

function getCivilopediaEntryForKey(civilopediaKey) {
  const key = String(civilopediaKey || '').trim().toUpperCase();
  if (!key || !state.bundle || !state.bundle.tabs) return null;
  const tabKey = mapCivilopediaKeyToTabKey(key);
  if (!tabKey) return null;
  if (tabKey === 'terrain') {
    const terrainTab = state.bundle.tabs.terrain;
    const pedia = terrainTab && terrainTab.civilopedia;
    if (!pedia) return null;
    if (key.startsWith('TFRM_')) {
      const entries = (pedia.workerActions && pedia.workerActions.entries) || [];
      const entry = entries.find((item) => String(item && item.civilopediaKey || '').toUpperCase() === key) || null;
      return entry ? { tabKey: 'workerActions', entry } : null;
    }
    const entries = (pedia.terrain && pedia.terrain.entries) || [];
    const entry = entries.find((item) => String(item && item.civilopediaKey || '').toUpperCase() === key) || null;
    return entry ? { tabKey: 'terrainPedia', entry } : null;
  }
  const tab = state.bundle.tabs[tabKey];
  if (!tab || !Array.isArray(tab.entries)) return null;
  const entry = tab.entries.find((item) => String(item && item.civilopediaKey || '').toUpperCase() === key) || null;
  return entry ? { tabKey, entry } : null;
}

function plainCivilopediaText(raw) {
  if (CIVILOPEDIA_TEXT_UTILS && typeof CIVILOPEDIA_TEXT_UTILS.toPlainText === 'function') {
    return CIVILOPEDIA_TEXT_UTILS.toPlainText(raw);
  }
  return String(raw || '')
    .replace(/\$LINK<([^=<>]+)=([^<>]+)>/g, '$1')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCivilopediaPreviewSnippet(entry) {
  if (!entry) return '';
  const overview = plainCivilopediaText(String(entry.overview || ''));
  if (overview) {
    return overview.length > 220 ? `${overview.slice(0, 217)}...` : overview;
  }
  const desc = plainCivilopediaText(String(entry.description || ''));
  if (!desc) return 'No Civilopedia preview text available.';
  return desc.length > 220 ? `${desc.slice(0, 217)}...` : desc;
}

function positionPediaLinkPreview(anchor) {
  if (!anchor || !pediaLinkPreview.node) return;
  const panel = pediaLinkPreview.node;
  const rect = anchor.getBoundingClientRect();
  panel.style.left = '0px';
  panel.style.top = '0px';
  const panelRect = panel.getBoundingClientRect();
  const margin = 10;
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + panelRect.width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - panelRect.width - margin);
  }
  if (top + panelRect.height > window.innerHeight - margin) {
    top = rect.top - panelRect.height - 8;
  }
  if (top < margin) top = margin;
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function ensurePediaLinkPreviewNode() {
  if (pediaLinkPreview.node && pediaLinkPreview.node.isConnected) return pediaLinkPreview.node;
  const node = document.createElement('div');
  node.className = 'pedia-link-preview hidden';
  node.innerHTML = `
    <div class="pedia-link-preview-media">
      <canvas class="pedia-link-preview-canvas" width="128" height="96"></canvas>
    </div>
    <div class="pedia-link-preview-content">
      <strong class="pedia-link-preview-title"></strong>
      <p class="pedia-link-preview-text"></p>
    </div>
  `;
  document.body.appendChild(node);
  pediaLinkPreview.node = node;
  pediaLinkPreview.img = node.querySelector('.pedia-link-preview-canvas');
  pediaLinkPreview.title = node.querySelector('.pedia-link-preview-title');
  pediaLinkPreview.body = node.querySelector('.pedia-link-preview-text');
  return node;
}

function hidePediaLinkPreviewSoon(delay = 0) {
  if (!pediaLinkPreview.node) return;
  if (delay <= 0) {
    pediaLinkPreview.node.classList.remove('is-visible');
    pediaLinkPreview.activeKey = '';
    return;
  }
  window.setTimeout(() => {
    if (!pediaLinkPreview.node) return;
    pediaLinkPreview.node.classList.remove('is-visible');
    pediaLinkPreview.activeKey = '';
  }, delay);
}

function drawPediaLinkPreviewPlaceholder() {
  if (!pediaLinkPreview.img) return;
  const canvas = pediaLinkPreview.img;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(241, 245, 255, 0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(69, 84, 124, 0.24)';
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
}

function showPediaLinkPreview(anchor, civilopediaKey, fallbackLabel = '') {
  richTooltip.active = false;
  hideRichTooltip();
  const node = ensurePediaLinkPreviewNode();
  const found = getCivilopediaEntryForKey(civilopediaKey);
  const key = String(civilopediaKey || '').trim().toUpperCase();
  const title = found && found.entry
    ? String(found.entry.name || found.entry.civilopediaKey || fallbackLabel || key)
    : String(fallbackLabel || key || '(Unknown link)');
  const snippet = found && found.entry
    ? getCivilopediaPreviewSnippet(found.entry)
    : 'No local entry preview available.';
  if (pediaLinkPreview.title) pediaLinkPreview.title.textContent = title;
  if (pediaLinkPreview.body) pediaLinkPreview.body.textContent = snippet;
  const slots = found && found.entry ? buildReferenceArtSlots(found.tabKey, found.entry) : [];
  const primary = slots && slots.length > 0 ? slots[0] : null;
  const hasPreviewImage = !!(primary && primary.path);
  node.classList.toggle('no-image', !hasPreviewImage);
  if (hasPreviewImage) {
    drawPediaLinkPreviewPlaceholder();
  }
  node.classList.add('is-visible');
  pediaLinkPreview.activeKey = key;
  positionPediaLinkPreview(anchor);

  if (hasPreviewImage && state.settings && state.settings.civ3Path) {
    if (found && found.entry) {
      const request = getPreviewRequestForArtSlot(primary);
      if (request) {
        window.c3xManager.getPreview(request)
          .then((res) => {
            if (!res || !res.ok || pediaLinkPreview.activeKey !== key || !pediaLinkPreview.img) return;
            drawPreviewFrameToCanvas(res, pediaLinkPreview.img);
            positionPediaLinkPreview(anchor);
          })
          .catch(() => {});
      }
    }
  }
}

const CIVILOPEDIA_LINK_PATTERN = /\$LINK<([^=<>]+)=([^<>]+)>/g;

function appendCivilopediaInlineNodes(container, value) {
  const cleaned = String(value || '').replace(/\[([^\]]+)\]/g, '$1');
  let pos = 0;
  for (const match of cleaned.matchAll(CIVILOPEDIA_LINK_PATTERN)) {
    const index = match.index || 0;
    if (index > pos) {
      container.appendChild(document.createTextNode(cleaned.slice(pos, index)));
    }
    const label = match[1];
    const key = String(match[2] || '').trim();
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'pedia-link';
    a.textContent = label;
    a.addEventListener('mouseenter', () => {
      showPediaLinkPreview(a, key, label);
    });
    a.addEventListener('mouseleave', () => {
      hidePediaLinkPreviewSoon();
    });
    a.addEventListener('focus', () => {
      showPediaLinkPreview(a, key, label);
    });
    a.addEventListener('blur', () => {
      hidePediaLinkPreviewSoon();
    });
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!navigateToCivilopediaKey(key)) {
        setReferenceNotice(`No local entry for ${key}.`, true);
      }
    });
    container.appendChild(a);
    pos = index + match[0].length;
  }
  if (pos < cleaned.length) {
    container.appendChild(document.createTextNode(cleaned.slice(pos)));
  }
}

function renderCivilopediaRichText(container, text) {
  const blocks = CIVILOPEDIA_TEXT_UTILS && typeof CIVILOPEDIA_TEXT_UTILS.toReadBlocks === 'function'
    ? CIVILOPEDIA_TEXT_UTILS.toReadBlocks(text)
    : String(text || '')
      .split(/\n+/)
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .map((line) => ({ type: 'paragraph', text: line }));
  if (blocks.length === 0) {
    container.textContent = '(none)';
    return;
  }
  blocks.forEach((block) => {
    if (block && block.type === 'table' && Array.isArray(block.rows) && block.rows.length > 0) {
      const table = document.createElement('div');
      table.className = 'pedia-stat-table';
      block.rows.forEach((row) => {
        if (!row) return;
        if (row.type === 'pair') {
          const statRow = document.createElement('div');
          statRow.className = 'pedia-stat-row';
          const label = document.createElement('div');
          label.className = 'pedia-stat-label';
          appendCivilopediaInlineNodes(label, row.label);
          const value = document.createElement('div');
          value.className = 'pedia-stat-value';
          appendCivilopediaInlineNodes(value, row.value);
          statRow.appendChild(label);
          statRow.appendChild(value);
          table.appendChild(statRow);
          return;
        }
        const full = document.createElement('div');
        full.className = row.type === 'heading' ? 'pedia-stat-heading' : 'pedia-stat-note';
        appendCivilopediaInlineNodes(full, row.text || '');
        table.appendChild(full);
      });
      container.appendChild(table);
      return;
    }
    const p = document.createElement('p');
    p.className = 'pedia-paragraph';
    appendCivilopediaInlineNodes(p, block && block.text ? block.text : '');
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
  editBtn.textContent = isEditing ? '✓ Done' : '✎ Edit';
  editBtn.addEventListener('click', () => {
    state.tabContentScrollTop = el.tabContent ? el.tabContent.scrollTop : state.tabContentScrollTop;
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
  let livePreview = null;
  const refreshLivePreview = () => {
    if (!livePreview) return;
    livePreview.innerHTML = '';
    renderCivilopediaRichText(livePreview, String(entry[fieldKey] || ''));
  };
  editor.addEventListener('input', () => {
    rememberUndoSnapshot();
    entry[fieldKey] = editor.value;
    refreshLivePreview();
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
    livePreview = document.createElement('div');
    livePreview.className = 'civilopedia-preview';
    refreshLivePreview();
    block.appendChild(livePreview);
  }
  return block;
}

function createBiqTextEditorBlock({ editorKey, titleText, sourceInfo, value, onChange, multiline = false, emptyText = '(empty)', editable = true }) {
  const isEditing = editable && !!state.civilopediaEditorOpen[editorKey];
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
  if (editable) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'ghost civilopedia-edit-toggle';
    editBtn.textContent = isEditing ? '✓ Done' : '✎ Edit';
    editBtn.addEventListener('click', () => {
      state.tabContentScrollTop = el.tabContent ? el.tabContent.scrollTop : state.tabContentScrollTop;
      state.civilopediaEditorOpen[editorKey] = !isEditing;
      renderActiveTab({ preserveTabScroll: true });
    });
    controls.appendChild(editBtn);
  }
  title.appendChild(controls);
  attachRichTooltip(title, sourceInfo || '');
  block.appendChild(title);

  if (!isEditing) {
    const text = String(value || '').trim();
    if (text) {
      if (multiline) {
        renderCivilopediaRichText(block, text);
      } else {
        const p = document.createElement('p');
        p.className = 'pedia-paragraph';
        p.textContent = text;
        block.appendChild(p);
      }
    } else {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = emptyText;
      block.appendChild(hint);
    }
    return block;
  }

  const input = document.createElement(multiline ? 'textarea' : 'input');
  if (!multiline) {
    input.type = 'text';
    input.style.minHeight = 'unset';
  } else {
    input.rows = 7;
  }
  input.className = 'civilopedia-editor';
  input.value = String(value || '');
  input.addEventListener('input', () => onChange(input.value));
  block.appendChild(input);
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

function openArtFocusWithPreview(preview, title = 'Art Preview', metaText = '') {
  if (!preview || !preview.ok) return;
  const overlay = ensureArtFocusNode();
  if (artFocus.title) artFocus.title.textContent = String(title || 'Art Preview');
  if (artFocus.meta) {
    const sourceName = String(preview.sourcePath || '').trim();
    artFocus.meta.textContent = String(metaText || sourceName || '');
  }
  artFocus.preview = preview;
  artFocus.slot = null;
  artFocus.zoom = 1;
  renderArtFocusCanvas();
  overlay.classList.remove('hidden');
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

function buildReferenceArtSlots(tabKey, entry, options = {}) {
  const slots = [];
  const supportsIconArt = new Set(['civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'terrainPedia', 'workerActions']);
  if (!supportsIconArt.has(tabKey)) {
    return slots;
  }
  const ensureIconSlots = !!options.ensureIconSlots;
  const icons = Array.isArray(entry && entry.iconPaths) ? entry.iconPaths : [];
  const iconCount = icons.length > 0 ? Math.max(2, icons.length) : (ensureIconSlots ? 2 : 0);
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

function makeArtSlotCard({ tabKey, entry, slot, editable, onChanged, showTitle = false }) {
  const card = document.createElement('div');
  card.className = 'art-slot-card';
  if (!editable) card.classList.add('read-only');
  if (showTitle) {
    const title = document.createElement('div');
    title.className = 'art-slot-title';
    title.textContent = slot.label;
    card.appendChild(title);
  }
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
  const extractTextWithoutButtons = (node) => {
    if (!node) return '';
    const clone = node.cloneNode(true);
    Array.from(clone.querySelectorAll('button')).forEach((btn) => btn.remove());
    return String(clone.textContent || '').trim();
  };
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
        const groupTitle = extractTextWithoutButtons(groupCard.querySelector('.rule-group-title'));
        if (!groupTitle) return;
        const groupId = makeId(`${title}-${groupTitle}`);
        groupCard.id = groupId;
        sections.push({ id: groupId, label: groupTitle, level: 1 });
        const rows = Array.from(groupCard.querySelectorAll('.rule-row'));
        rows.forEach((row) => {
          const label = extractTextWithoutButtons(row.querySelector('label'));
          if (!label || label.toLowerCase() === 'open tech tree') return;
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

function buildBiqRecordSectionNav({ tabKey, sectionCode, rowsRoot, navHost }) {
  if (!rowsRoot || !navHost) return;
  const groupCards = Array.from(rowsRoot.querySelectorAll(':scope > .rule-group-card'));
  const hasGroups = groupCards.length > 0;
  const rows = hasGroups
    ? Array.from(rowsRoot.querySelectorAll('.rule-group-card .rule-row'))
    : Array.from(rowsRoot.querySelectorAll(':scope > .rule-row'));
  if (rows.length === 0 && !hasGroups) return;

  const usedIds = new Set();
  const makeId = (base) => {
    let id = `${tabKey}-${String(sectionCode || '').toLowerCase()}-${slugifySectionId(base)}`;
    let i = 2;
    while (usedIds.has(id) || document.getElementById(id)) {
      id = `${tabKey}-${String(sectionCode || '').toLowerCase()}-${slugifySectionId(base)}-${i}`;
      i += 1;
    }
    usedIds.add(id);
    return id;
  };

  const sections = [];
  if (hasGroups) {
    groupCards.forEach((groupCard) => {
      const groupTitle = String((groupCard.querySelector('.rule-group-title') || {}).textContent || '').trim() || 'Group';
      const groupId = makeId(groupTitle);
      groupCard.id = groupId;
      sections.push({ id: groupId, label: groupTitle, level: 0 });
      Array.from(groupCard.querySelectorAll(':scope .rule-row')).forEach((row) => {
        const label = String((row.querySelector('label') || {}).textContent || '').trim() || 'Field';
        const id = makeId(`${groupTitle}-${label}`);
        row.id = id;
        sections.push({ id, label, level: 1 });
      });
    });
  } else {
    rows.forEach((row) => {
      const label = String((row.querySelector('label') || {}).textContent || '').trim() || 'Field';
      const id = makeId(label);
      row.id = id;
      sections.push({ id, label, level: 0 });
    });
  }
  if (sections.length === 0) return;

  const nav = document.createElement('nav');
  nav.className = 'reference-section-nav';
  const search = document.createElement('input');
  search.type = 'search';
  search.classList.add('app-search-input');
  search.className = 'reference-section-nav-search';
  search.placeholder = 'Search fields...';
  nav.appendChild(search);
  const list = document.createElement('div');
  list.className = 'reference-section-nav-list';
  nav.appendChild(list);
  navHost.appendChild(nav);

  const btnById = new Map();
  const setActive = (id) => {
    btnById.forEach((btn, key) => btn.classList.toggle('active', key === id));
  };

  sections.forEach((sec) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `reference-section-nav-item level-${Number(sec.level) || 0}`;
    btn.textContent = sec.label;
    btn.dataset.targetId = sec.id;
    btn.addEventListener('click', () => {
      const target = document.getElementById(sec.id);
      if (!target) return;
      setActive(sec.id);
      const rootRect = el.tabContent.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const topOffset = 92;
      const nextTop = el.tabContent.scrollTop + (targetRect.top - rootRect.top) - topOffset;
      el.tabContent.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
      target.classList.remove('nav-jump-highlight');
      void target.offsetWidth;
      target.classList.add('nav-jump-highlight');
      window.setTimeout(() => target.classList.remove('nav-jump-highlight'), 1200);
    });
    list.appendChild(btn);
    btnById.set(sec.id, btn);
  });

  const applySearch = () => {
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
  search.addEventListener('input', applySearch);
  applySearch();

  const findActiveId = () => {
    const rootRect = el.tabContent.getBoundingClientRect();
    const anchor = rootRect.top + 152;
    let best = sections[0] && sections[0].id;
    let aboveId = best;
    let aboveTop = -Infinity;
    sections.forEach((sec) => {
      const node = document.getElementById(sec.id);
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (rect.top <= anchor && rect.top > aboveTop) {
        aboveTop = rect.top;
        aboveId = sec.id;
      }
    });
    return aboveId || best;
  };
  const syncActive = () => {
    const active = findActiveId();
    if (active) setActive(active);
  };
  syncActive();
  const onScroll = () => syncActive();
  el.tabContent.addEventListener('scroll', onScroll, { passive: true });
  const prevCleanup = state.referenceSectionNavCleanup;
  state.referenceSectionNavCleanup = () => {
    if (typeof prevCleanup === 'function') {
      try { prevCleanup(); } catch (_err) {}
    }
    el.tabContent.removeEventListener('scroll', onScroll);
  };
}

function ensureReferenceRecordOps(tab) {
  if (!tab) return [];
  if (!Array.isArray(tab.recordOps)) tab.recordOps = [];
  return tab.recordOps;
}

function ensureBiqStructureRecordOps(tab) {
  if (!tab) return [];
  if (!Array.isArray(tab.recordOps)) tab.recordOps = [];
  return tab.recordOps;
}

function getBiqTabByKey(tabKey) {
  const key = String(tabKey || '').trim();
  const tabs = state.bundle && state.bundle.tabs;
  if (!tabs || !key) return null;
  return tabs[key] || null;
}

function hasCustomPlayerData(bundle = state.bundle) {
  const tabs = bundle && bundle.tabs;
  if (!tabs) return false;
  const playersTab = tabs.players;
  const leadSection = getBiqSectionFromTab(playersTab, 'LEAD');
  return !!(leadSection && Array.isArray(leadSection.records) && leadSection.records.length > 0);
}

function getDisplayBiqRecordName(sectionCode, record, idxFallback = 0) {
  const code = String(sectionCode || '').toUpperCase();
  const idx = Number.isFinite(record && record.index) ? Number(record.index) : Number(idxFallback) || 0;
  const raw = String(record && record.name || '').trim();
  if (code === 'LEAD') {
    if (!raw) return `Player ${idx + 1}`;
    if (/^lead\b/i.test(raw) || /^lead\s*\d+$/i.test(raw)) return `Player ${idx + 1}`;
    return raw;
  }
  return raw || `${code} ${idx + 1}`;
}

function getLeadRecordCivEntry(record) {
  const civField = getFieldByBaseKey(record, 'civ');
  const civIdx = parseIntFromDisplayValue(civField && civField.value);
  if (!Number.isFinite(civIdx) || civIdx < 0) return null;
  const options = makeBiqSectionIndexOptions('RACE', false);
  const match = options.find((opt) => Number.parseInt(String(opt && opt.value || ''), 10) === civIdx);
  return match && match.entry ? match.entry : null;
}

function getBiqSectionFromTab(tab, code) {
  const sectionCode = String(code || '').trim().toUpperCase();
  if (!tab || !sectionCode || !Array.isArray(tab.sections)) return null;
  return tab.sections.find((section) => String(section && section.code || '').trim().toUpperCase() === sectionCode) || null;
}

function makeBlankBiqStructureRecord({ section, newRecordRef, displayName }) {
  const records = Array.isArray(section && section.records) ? section.records : [];
  const template = records[records.length - 1] || records[0] || { fields: [] };
  const maxIndex = records.reduce((max, rec) => {
    const idx = Number(rec && rec.index);
    return Number.isFinite(idx) ? Math.max(max, idx) : max;
  }, -1);
  const clonedFields = (Array.isArray(template.fields) ? template.fields : []).map((field) => {
    const value = makeDefaultBiqStructureFieldValue(field);
    return {
      ...field,
      value,
      originalValue: ''
    };
  });
  return {
    index: maxIndex + 1,
    name: String(displayName || `Record ${maxIndex + 2}`),
    newRecordRef: String(newRecordRef || '').trim().toUpperCase(),
    fields: clonedFields
  };
}

function syncLeadRecordCountToTarget(targetCountRaw) {
  const playersTab = getBiqTabByKey('players');
  const leadSection = getBiqSectionFromTab(playersTab, 'LEAD');
  if (!playersTab || !leadSection || !Array.isArray(leadSection.records)) return false;
  const parsed = Number.parseInt(String(targetCountRaw || '').trim(), 10);
  if (!Number.isFinite(parsed)) return false;
  const targetCount = Math.max(1, Math.min(32, parsed));
  const current = leadSection.records.length;
  if (current === targetCount) return false;
  const ops = ensureBiqStructureRecordOps(playersTab);
  if (targetCount > current) {
    for (let i = current; i < targetCount; i += 1) {
      const newRef = makeUniqueBiqStructureRecordRef(playersTab, 'LEAD');
      const newRecord = makeBlankBiqStructureRecord({
        section: leadSection,
        newRecordRef: newRef,
        displayName: `Player ${i + 1}`
      });
      leadSection.records.push(newRecord);
      ops.push({ op: 'add', sectionCode: 'LEAD', newRecordRef: newRef });
    }
    return true;
  }
  while (leadSection.records.length > targetCount) {
    const removed = leadSection.records.pop();
    const targetRef = getBiqStructureRecordRef(removed);
    if (!targetRef) continue;
    const target = String(targetRef).trim().toUpperCase();
    const hadCreate = ops.some((op) => String(op && op.newRecordRef || '').trim().toUpperCase() === target);
    playersTab.recordOps = ops.filter((op) => {
      const rec = String(op && op.recordRef || '').trim().toUpperCase();
      const src = String(op && op.sourceRef || '').trim().toUpperCase();
      const next = String(op && op.newRecordRef || '').trim().toUpperCase();
      return rec !== target && src !== target && next !== target;
    });
    if (!hadCreate) {
      ensureBiqStructureRecordOps(playersTab).push({ op: 'delete', sectionCode: 'LEAD', recordRef: target });
    }
  }
  return true;
}

function ensureCustomPlayerDataEnabled({ preferredCount } = {}) {
  const playersTab = getBiqTabByKey('players');
  const leadSection = getBiqSectionFromTab(playersTab, 'LEAD');
  if (!playersTab || !leadSection || !Array.isArray(leadSection.records)) return false;
  const current = leadSection.records.length;
  if (current > 0) return false;
  const parsed = Number.parseInt(String(preferredCount || '').trim(), 10);
  const target = Number.isFinite(parsed) ? Math.max(1, Math.min(32, parsed)) : 1;
  return syncLeadRecordCountToTarget(target);
}

function getPlayableCivilizationIdSet() {
  const scenarioTab = getBiqTabByKey('scenarioSettings');
  const gameSection = getBiqSectionFromTab(scenarioTab, 'GAME');
  const record = gameSection && Array.isArray(gameSection.records) ? gameSection.records[0] : null;
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  const out = new Set();
  fields.forEach((field) => {
    const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
    if (base !== 'playable_civ') return;
    const parsed = parseIntFromDisplayValue(field.value);
    if (Number.isFinite(parsed) && parsed >= 0) out.add(parsed);
  });
  return out;
}

function getGamePlayableCivFields(record) {
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  return fields.filter((field) => String(field && (field.baseKey || field.key) || '').toLowerCase() === 'playable_civ');
}

function getGamePlayableCivCountField(record) {
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  return fields.find((field) => String(field && (field.baseKey || field.key) || '').toLowerCase() === 'numberofplayablecivs') || null;
}

function syncNumberOfPlayableCivsField(record) {
  const playable = getGamePlayableCivFields(record);
  const countField = getGamePlayableCivCountField(record);
  const count = playable.length;
  if (countField) countField.value = String(count);
  return count;
}

function getBiqRecordCivilopediaKey(record) {
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  const field = fields.find((f) => canonicalBiqFieldKey(f) === 'civilopediaentry');
  return String(field && field.value || '').trim().toUpperCase();
}

function getBiqStructureRecordRef(record) {
  if (!record) return '';
  if (record.newRecordRef) return String(record.newRecordRef).trim().toUpperCase();
  const civKey = getBiqRecordCivilopediaKey(record);
  if (civKey) return civKey;
  const idx = Number(record.index);
  if (Number.isFinite(idx)) return `@INDEX:${idx}`;
  return '';
}

function makeUniqueBiqStructureRecordRef(tab, sectionCode) {
  const code = String(sectionCode || '').trim().toUpperCase() || 'REC';
  const existing = new Set();
  const sections = Array.isArray(tab && tab.sections) ? tab.sections : [];
  sections.forEach((section) => {
    if (String(section && section.code || '').toUpperCase() !== code) return;
    const records = Array.isArray(section && section.records) ? section.records : [];
    records.forEach((record) => {
      const ref = getBiqStructureRecordRef(record);
      if (ref) existing.add(ref);
    });
  });
  const ops = Array.isArray(tab && tab.recordOps) ? tab.recordOps : [];
  ops.forEach((op) => {
    if (String(op && op.sectionCode || '').toUpperCase() !== code) return;
    const newRef = String(op && op.newRecordRef || '').trim().toUpperCase();
    if (newRef) existing.add(newRef);
  });
  let i = 1;
  let next = `${code}_NEW_${i}`;
  while (existing.has(next)) {
    i += 1;
    next = `${code}_NEW_${i}`;
  }
  return next;
}

function makeDefaultBiqStructureFieldValue(field) {
  const raw = String(field && field.value || '').trim().toLowerCase();
  if (raw === 'true' || raw === 'false') return 'false';
  const n = parseIntFromDisplayValue(raw);
  if (n != null) return '0';
  return '';
}

function buildBiqStructureRecordFromSource({ section, sourceRecord, mode, newRecordRef }) {
  const base = sourceRecord
    ? JSON.parse(JSON.stringify(sourceRecord))
    : { index: -1, name: `${String(section && section.code || 'Record')} New`, fields: [] };
  const record = base && typeof base === 'object' ? base : { index: -1, name: 'New Record', fields: [] };
  if (!Array.isArray(record.fields)) record.fields = [];
  const code = String(section && section.code || '').toUpperCase();
  const maxIndex = (Array.isArray(section && section.records) ? section.records : []).reduce((max, rec) => {
    const idx = Number(rec && rec.index);
    return Number.isFinite(idx) ? Math.max(max, idx) : max;
  }, -1);
  record.index = maxIndex + 1;
  record.newRecordRef = String(newRecordRef || '').trim().toUpperCase();
  if (mode === 'blank') {
    record.fields = record.fields.map((field) => {
      const canon = canonicalBiqFieldKey(field);
      if (canon === 'note') return field;
      if (canon === 'civilopediaentry') {
        return { ...field, value: record.newRecordRef, originalValue: '' };
      }
      const value = makeDefaultBiqStructureFieldValue(field);
      return { ...field, value, originalValue: '' };
    });
  } else if (mode === 'copy') {
    record.fields = record.fields.map((field) => {
      const canon = canonicalBiqFieldKey(field);
      if (canon === 'civilopediaentry') return { ...field, value: record.newRecordRef, originalValue: record.newRecordRef };
      const value = String(field && field.value || '');
      return { ...field, originalValue: value };
    });
  } else {
    record.fields = record.fields.map((field) => {
      const canon = canonicalBiqFieldKey(field);
      if (canon === 'civilopediaentry') return { ...field, value: record.newRecordRef, originalValue: '' };
      return { ...field, originalValue: '' };
    });
  }
  const civKey = getBiqRecordCivilopediaKey(record);
  if (!civKey) {
    record.fields.unshift({
      key: 'civilopediaentry',
      baseKey: 'civilopediaentry',
      label: 'Civilopedia Entry',
      value: record.newRecordRef,
      originalValue: mode === 'copy' ? record.newRecordRef : ''
    });
  }
  const display = record.newRecordRef.replace(/^([A-Z0-9]+_)/, '').replace(/_/g, ' ').trim();
  record.name = display ? display.replace(/\b\w/g, (m) => m.toUpperCase()) : `${code} New`;
  return record;
}

function normalizeReferenceKeyToken(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function stripReferencePrefixToken(token) {
  const upper = String(token || '').toUpperCase();
  for (const prefix of ALL_REFERENCE_PREFIXES) {
    if (upper.startsWith(prefix)) return upper.slice(prefix.length);
  }
  return upper;
}

function inferReferenceNameFromKey(civilopediaKey, tabKey) {
  const prefix = REFERENCE_PREFIX_BY_TAB[tabKey] || '';
  const key = String(civilopediaKey || '').toUpperCase();
  const short = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
  return short
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim() || 'New Entry';
}

function makeUniqueReferenceCivilopediaKey(tab, tabKey, desiredName, excludeKey = '') {
  const prefix = REFERENCE_PREFIX_BY_TAB[tabKey] || '';
  const entries = (tab && Array.isArray(tab.entries)) ? tab.entries : [];
  const exclude = String(excludeKey || '').toUpperCase();
  const existing = new Set(
    entries
      .map((entry) => String(entry && entry.civilopediaKey || '').toUpperCase())
      .filter((key) => key && key !== exclude)
  );
  let token = normalizeReferenceKeyToken(desiredName);
  if (prefix) token = stripReferencePrefixToken(token);
  if (!token) token = `NEW_${Date.now()}`;
  let key = prefix ? `${prefix}${token}` : token;
  let i = 2;
  while (existing.has(key)) {
    key = prefix ? `${prefix}${token}_${i}` : `${token}_${i}`;
    i += 1;
  }
  return key;
}

function makeDefaultReferenceFieldValue(field, name) {
  const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
  if (base === 'name' || base === 'description' || base === 'civilizationname') return String(name || '');
  const raw = String(field && field.value || '').trim().toLowerCase();
  if (raw === 'true' || raw === 'false') return 'false';
  const n = parseIntFromDisplayValue(field && field.value);
  if (n != null) return '0';
  return '';
}

function buildNewReferenceEntryFromTemplate({ tabKey, sourceEntry, civilopediaKey, mode, displayName = '' }) {
  const src = sourceEntry ? JSON.parse(JSON.stringify(sourceEntry)) : {};
  const inferred = inferReferenceNameFromKey(civilopediaKey, tabKey);
  const name = String(displayName || '').trim() || inferred;
  const prefix = REFERENCE_PREFIX_BY_TAB[tabKey] || '';
  const shortId = prefix && civilopediaKey.startsWith(prefix) ? civilopediaKey.slice(prefix.length) : civilopediaKey;
  const entry = {
    ...src,
    id: shortId,
    civilopediaKey,
    biqIndex: null,
    name,
    isNew: true
  };
  if (!Array.isArray(entry.biqFields) && sourceEntry && Array.isArray(sourceEntry.biqFields)) {
    entry.biqFields = JSON.parse(JSON.stringify(sourceEntry.biqFields));
  }
  if (!Array.isArray(entry.biqFields)) entry.biqFields = [];
  if (mode === 'blank') {
    entry.overview = '';
    entry.description = '';
    entry.iconPaths = [];
    entry.racePaths = [];
    entry.animationName = '';
    entry.biqFields = entry.biqFields.map((field) => ({
      ...field,
      value: makeDefaultReferenceFieldValue(field, name),
      originalValue: ''
    }));
  } else if (mode === 'import') {
    entry.biqFields = entry.biqFields.map((field) => ({
      ...field,
      originalValue: ''
    }));
  } else {
    entry.biqFields = entry.biqFields.map((field) => ({
      ...field,
      originalValue: String(field && field.value || '')
    }));
  }
  entry.originalOverview = '';
  entry.originalDescription = '';
  entry.originalIconPaths = [];
  entry.originalRacePaths = [];
  entry.originalAnimationName = '';
  return entry;
}

function renamePendingReferenceEntryKey(tab, tabKey, entry, desiredKeyRaw) {
  if (!tab || !entry || !entry.isNew) return false;
  return renameReferenceEntryKey(tab, tabKey, entry, desiredKeyRaw, { allowExisting: false });
}

function renameReferenceEntryKey(tab, tabKey, entry, desiredKeyRaw, { allowExisting = false } = {}) {
  if (!tab || !entry) return false;
  if (!allowExisting && !entry.isNew) return false;
  const oldKey = String(entry.civilopediaKey || '').toUpperCase();
  const nextKey = makeUniqueReferenceCivilopediaKey(tab, tabKey, desiredKeyRaw, oldKey);
  if (!nextKey || nextKey === oldKey) return false;
  entry.civilopediaKey = nextKey;
  const prefix = REFERENCE_PREFIX_BY_TAB[tabKey] || '';
  entry.id = prefix && nextKey.startsWith(prefix) ? nextKey.slice(prefix.length) : nextKey;
  const ops = ensureReferenceRecordOps(tab);
  if (entry.isNew) {
    ops.forEach((op) => {
      if (!op) return;
      if (String(op.newRecordRef || '').toUpperCase() === oldKey) op.newRecordRef = nextKey;
      if (String(op.recordRef || '').toUpperCase() === oldKey) op.recordRef = nextKey;
    });
  } else {
    const hasDelete = ops.some((op) => String(op && op.op || '').toLowerCase() === 'delete' && String(op && op.recordRef || '').toUpperCase() === oldKey);
    if (!hasDelete) {
      ops.push({ op: 'delete', recordRef: oldKey });
    }
    ops.push({ op: 'rename', recordRef: oldKey, newRecordRef: nextKey });
  }
  const set = state.dirtyReferenceKeysByTab && state.dirtyReferenceKeysByTab[tabKey];
  if (set && set.has(oldKey)) {
    set.delete(oldKey);
    set.add(nextKey);
  }
  return true;
}

function hideEntityModal() {
  state.entityModal.open = false;
  if (el.entityModalOverlay) {
    el.entityModalOverlay.classList.add('hidden');
    el.entityModalOverlay.setAttribute('aria-hidden', 'true');
  }
  if (el.entityModalTitle) el.entityModalTitle.textContent = 'Manage Entry';
  if (el.entityModalBody) el.entityModalBody.textContent = '';
  if (el.entityModalContent) el.entityModalContent.innerHTML = '';
  if (el.entityModalConfirm) {
    el.entityModalConfirm.classList.remove('danger');
    el.entityModalConfirm.textContent = 'Confirm';
    el.entityModalConfirm.disabled = false;
    el.entityModalConfirm.onclick = null;
  }
  if (el.entityModalCancel) el.entityModalCancel.onclick = null;
}

function resolveEntityModal(payload) {
  const resolver = state.entityModal.resolve;
  state.entityModal.resolve = null;
  hideEntityModal();
  if (typeof resolver === 'function') resolver(payload || null);
}

async function loadImportEntriesForTab(tabKey, filePath) {
  const loaded = await window.c3xManager.loadBundle({
    mode: 'scenario',
    c3xPath: state.settings.c3xPath,
    civ3Path: state.settings.civ3Path,
    scenarioPath: filePath
  });
  if (!loaded || !loaded.tabs || !loaded.tabs[tabKey] || !Array.isArray(loaded.tabs[tabKey].entries)) {
    throw new Error('Could not load import source scenario.');
  }
  return loaded.tabs[tabKey].entries;
}

async function promptReferenceCreateAction({ tab, tabKey, selectedEntry, initialMode = 'blank', lockMode = false }) {
  if (!el.entityModalOverlay || !el.entityModalContent) return null;
  const entityName = String((tab && tab.title) || 'Entries').replace(/s$/, '') || 'entry';
  const defaultName = (initialMode === 'copy' && selectedEntry) ? `${selectedEntry.name || ''} Copy`.trim() : '';
  let keyEditedManually = false;
  let nameEditedManually = false;
  if (el.entityModalTitle) {
    el.entityModalTitle.textContent = (lockMode && initialMode === 'import')
      ? `${entityName}: Import From Scenario`
      : `${entityName}: Add / Copy / Import`;
  }
  if (el.entityModalBody) {
    el.entityModalBody.textContent = (lockMode && initialMode === 'import')
      ? 'Select a source scenario, pick an item, then confirm the Name and Key for the new item in this scenario.'
      : 'Choose how to create the new entry. Import copies an item from another scenario into this one.';
  }
  if (el.entityModalConfirm) {
    el.entityModalConfirm.textContent = 'Create';
    el.entityModalConfirm.disabled = false;
  }
  el.entityModalContent.innerHTML = '';

  const form = document.createElement('div');
  form.className = 'entity-modal-content';
  const grid = document.createElement('div');
  grid.className = 'entity-form-grid';
  form.appendChild(grid);

  const nameField = document.createElement('div');
  nameField.className = 'entity-field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = `New ${entityName} name`;
  nameInput.value = defaultName;
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);
  grid.appendChild(nameField);

  const keyField = document.createElement('div');
  keyField.className = 'entity-field';
  const keyLabel = document.createElement('label');
  keyLabel.textContent = 'Key';
  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = `${REFERENCE_PREFIX_BY_TAB[tabKey] || ''}...`;
  keyField.appendChild(keyLabel);
  keyField.appendChild(keyInput);
  grid.appendChild(keyField);

  const modeField = document.createElement('div');
  modeField.className = 'entity-field';
  const modeLabel = document.createElement('label');
  modeLabel.textContent = 'Create From';
  const modeSelect = document.createElement('select');
  const modeOptions = [
    { value: 'blank', label: 'Blank template' },
    { value: 'copy', label: selectedEntry ? 'Copy selected entry' : 'Copy selected entry (unavailable)', disabled: !selectedEntry },
    { value: 'import', label: 'Import from another scenario' }
  ];
  modeOptions.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    o.disabled = !!opt.disabled;
    modeSelect.appendChild(o);
  });
  modeField.appendChild(modeLabel);
  modeField.appendChild(modeSelect);
  if (modeOptions.some((opt) => opt.value === initialMode && !opt.disabled)) {
    modeSelect.value = initialMode;
  }
  modeSelect.disabled = !!lockMode;
  if (lockMode) modeField.classList.add('hidden');
  grid.appendChild(modeField);

  const importWrap = document.createElement('div');
  importWrap.className = 'entity-modal-content hidden';
  const importToolbar = document.createElement('div');
  importToolbar.className = 'entity-import-toolbar';
  const importScenarioSelect = document.createElement('select');
  importScenarioSelect.className = 'entity-import-scenario-select';
  const importPlaceholder = document.createElement('option');
  importPlaceholder.value = '';
  importPlaceholder.textContent = 'Import source scenario...';
  importScenarioSelect.appendChild(importPlaceholder);
  const importManual = document.createElement('option');
  importManual.value = '__manual__';
  importManual.textContent = 'Manual / Browse...';
  importScenarioSelect.appendChild(importManual);
  const addImportGroup = (source, label) => {
    const items = (state.availableScenarios || []).filter((s) => String(s && s.source || '') === source);
    if (!items.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = String(item.path || '');
      option.textContent = String(item.name || item.fileName || getPathTail(item.path || ''));
      option.title = String(item.path || '');
      group.appendChild(option);
    });
    importScenarioSelect.appendChild(group);
  };
  addImportGroup('Conquests', 'Conquests Folder');
  addImportGroup('Scenarios', 'Scenarios Folder');
  const pickBtn = document.createElement('button');
  pickBtn.type = 'button';
  pickBtn.className = 'ghost';
  pickBtn.textContent = 'Choose Scenario .biq';
  const importPath = document.createElement('span');
  importPath.className = 'entity-import-path';
  importPath.textContent = 'No source file selected';
  importToolbar.appendChild(importScenarioSelect);
  importToolbar.appendChild(pickBtn);
  importToolbar.appendChild(importPath);
  importWrap.appendChild(importToolbar);

  const importPickerHost = document.createElement('div');
  importPickerHost.className = 'entity-import-picker';
  importWrap.appendChild(importPickerHost);
  form.appendChild(importWrap);
  el.entityModalContent.appendChild(form);

  let importFilePath = '';
  let importEntries = [];
  let selectedImportKey = '';
  const loadImportSource = async (filePath) => {
    if (!filePath) return;
    importPath.textContent = 'Loading source entries...';
    importEntries = [];
    selectedImportKey = '';
    renderImportPicker();
    try {
      const loadedEntries = await loadImportEntriesForTab(tabKey, filePath);
      importFilePath = filePath;
      importEntries = loadedEntries;
      importPath.textContent = filePath;
      renderImportPicker();
      if (importEntries.length === 0) {
        setStatus('Selected scenario has no entries for this tab.', true);
      }
    } catch (err) {
      importPath.textContent = 'Could not load source scenario';
      setStatus(err && err.message ? err.message : 'Could not load import source scenario.', true);
    }
  };
  const renderImportPicker = () => {
    importPickerHost.innerHTML = '';
    if (importEntries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'Select a source scenario to load entries.';
      importPickerHost.appendChild(empty);
      return;
    }
    const picker = createReferencePicker({
      options: importEntries.slice(0, 400).map((entry) => ({
        value: String(entry && entry.civilopediaKey || '').toUpperCase(),
        label: `${String(entry && entry.name || entry && entry.civilopediaKey || '').trim()} (${String(entry && entry.civilopediaKey || '').trim()})`,
        entry
      })),
      targetTabKey: tabKey,
      currentValue: selectedImportKey || '-1',
      searchPlaceholder: `Search ${tab.title} in selected scenario...`,
      noneLabel: 'Choose item to import...',
      onSelect: (value) => {
        selectedImportKey = String(value || '').toUpperCase();
        const picked = importEntries.find((entry) => String(entry && entry.civilopediaKey || '').toUpperCase() === selectedImportKey);
        if (picked && !nameEditedManually) {
          nameInput.value = String(picked.name || inferReferenceNameFromKey(picked.civilopediaKey, tabKey));
          syncKeyFromName();
        }
      }
    });
    importPickerHost.appendChild(picker);
  };
  const updateModeVisibility = () => {
    importWrap.classList.toggle('hidden', modeSelect.value !== 'import');
  };
  const syncKeyFromName = () => {
    if (keyEditedManually) return;
    const name = String(nameInput.value || '').trim();
    keyInput.value = makeUniqueReferenceCivilopediaKey(tab, tabKey, name || `NEW_${Date.now()}`);
  };

  modeSelect.addEventListener('change', updateModeVisibility);
  nameInput.addEventListener('input', () => {
    nameEditedManually = true;
    syncKeyFromName();
  });
  keyInput.addEventListener('input', () => {
    keyEditedManually = true;
  });
  importScenarioSelect.addEventListener('change', async () => {
    const value = String(importScenarioSelect.value || '');
    if (!value) return;
    if (value === '__manual__') {
      pickBtn.click();
      return;
    }
    await loadImportSource(value);
  });
  pickBtn.addEventListener('click', async () => {
    const filePath = await window.c3xManager.pickFile({
      filters: [{ name: 'BIQ Scenario Files', extensions: ['biq'] }]
    });
    if (!filePath) return;
    const hasOption = Array.from(importScenarioSelect.options).some((opt) => String(opt.value || '') === filePath);
    if (hasOption) {
      importScenarioSelect.value = filePath;
    } else {
      importScenarioSelect.value = '__manual__';
    }
    await loadImportSource(filePath);
  });
  updateModeVisibility();
  syncKeyFromName();
  renderImportPicker();

  state.entityModal.open = true;
  el.entityModalOverlay.classList.remove('hidden');
  el.entityModalOverlay.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => nameInput.focus({ preventScroll: true }), 0);

  return new Promise((resolve) => {
    state.entityModal.resolve = resolve;
    const onConfirm = () => {
      const name = String(nameInput.value || '').trim();
      const mode = String(modeSelect.value || 'blank');
      const key = makeUniqueReferenceCivilopediaKey(tab, tabKey, keyInput.value || name || `NEW_${Date.now()}`);
      if (!name) {
        setStatus('Name is required.', true);
        return;
      }
      if (mode === 'import') {
        if (!importFilePath) {
          setStatus('Select an import scenario first.', true);
          return;
        }
        const picked = importEntries.find((entry) => String(entry && entry.civilopediaKey || '').toUpperCase() === selectedImportKey);
        if (!picked) {
          setStatus('Select one import entry from the list.', true);
          return;
        }
        resolveEntityModal({ mode, name, key, importedEntry: picked, importFilePath });
        return;
      }
      resolveEntityModal({ mode, name, key });
    };
    const onCancel = () => resolveEntityModal(null);
    if (el.entityModalConfirm) el.entityModalConfirm.onclick = onConfirm;
    if (el.entityModalCancel) el.entityModalCancel.onclick = onCancel;
  });
}

async function promptReferenceDeleteAction({ tab, selectedEntry }) {
  if (!el.entityModalOverlay || !selectedEntry) return false;
  if (el.entityModalTitle) el.entityModalTitle.textContent = `Delete ${String((tab && tab.title) || 'Entry').replace(/s$/, '')}`;
  if (el.entityModalBody) {
    el.entityModalBody.textContent = `Delete "${selectedEntry.name || selectedEntry.civilopediaKey}"? Related BIQ references will be relinked on save when supported by the BIQ format.`;
  }
  if (el.entityModalConfirm) {
    el.entityModalConfirm.textContent = 'Delete';
    el.entityModalConfirm.disabled = false;
  }
  if (el.entityModalContent) el.entityModalContent.innerHTML = '';
  state.entityModal.open = true;
  el.entityModalOverlay.classList.remove('hidden');
  el.entityModalOverlay.setAttribute('aria-hidden', 'false');
  if (el.entityModalConfirm) el.entityModalConfirm.classList.add('danger');
  if (el.entityModalCancel) el.entityModalCancel.focus({ preventScroll: true });
  return new Promise((resolve) => {
    state.entityModal.resolve = resolve;
    const cleanup = () => {
      if (el.entityModalConfirm) el.entityModalConfirm.classList.remove('danger');
    };
    if (el.entityModalConfirm) {
      el.entityModalConfirm.onclick = () => {
        cleanup();
        resolveEntityModal(true);
      };
    }
    if (el.entityModalCancel) {
      el.entityModalCancel.onclick = () => {
        cleanup();
        resolveEntityModal(false);
      };
    }
  });
}

async function promptBiqStructureDeleteAction({ sectionCode, sectionTitle, recordName }) {
  if (!el.entityModalOverlay) return false;
  const code = String(sectionCode || '').toUpperCase();
  const title = String(sectionTitle || code || 'Record');
  const name = String(recordName || '').trim() || '(unnamed)';
  if (el.entityModalTitle) el.entityModalTitle.textContent = `Delete ${title} Record`;
  if (el.entityModalBody) {
    el.entityModalBody.textContent = `Delete "${name}" from ${title}? This removes the record from this scenario when you save.`;
  }
  if (el.entityModalConfirm) {
    el.entityModalConfirm.textContent = 'Delete';
    el.entityModalConfirm.disabled = false;
  }
  if (el.entityModalContent) el.entityModalContent.innerHTML = '';
  state.entityModal.open = true;
  el.entityModalOverlay.classList.remove('hidden');
  el.entityModalOverlay.setAttribute('aria-hidden', 'false');
  if (el.entityModalConfirm) el.entityModalConfirm.classList.add('danger');
  if (el.entityModalCancel) el.entityModalCancel.focus({ preventScroll: true });
  return new Promise((resolve) => {
    state.entityModal.resolve = resolve;
    const cleanup = () => {
      if (el.entityModalConfirm) el.entityModalConfirm.classList.remove('danger');
    };
    if (el.entityModalConfirm) {
      el.entityModalConfirm.onclick = () => {
        cleanup();
        resolveEntityModal(true);
      };
    }
    if (el.entityModalCancel) {
      el.entityModalCancel.onclick = () => {
        cleanup();
        resolveEntityModal(false);
      };
    }
  });
}

function renderReferenceTab(tab, tabKey) {
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';
  const allEntries = tab.entries || [];

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[tabKey]));
  const referenceEditable = isScenarioMode();
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">${referenceEditable ? 'editable (scenario)' : 'read-only'}</span>`);
  wrap.appendChild(header);

  const controls = document.createElement('div');
  controls.className = 'reference-filter-row';
  controls.classList.add('sticky-search-row');
  const search = document.createElement('input');
  search.type = 'search';
  search.classList.add('app-search-input');
  search.placeholder = `Search ${tab.title}...`;
  search.value = state.referenceFilter[tabKey] || '';
  controls.appendChild(search);
  const controlsRight = document.createElement('div');
  controlsRight.className = 'reference-filter-right';
  controls.appendChild(controlsRight);

  let kindFilter = null;
  let techTreeBtn = null;
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
    controlsRight.appendChild(kindFilter);
  }
  if (tabKey === 'technologies') {
    techTreeBtn = document.createElement('button');
    techTreeBtn.type = 'button';
    techTreeBtn.className = 'ghost tech-tree-action-btn';
    const icon = document.createElement('span');
    icon.className = 'tech-tree-btn-icon';
    icon.textContent = '🌳';
    techTreeBtn.appendChild(icon);
    const label = document.createElement('span');
    label.textContent = 'Tech Tree';
    techTreeBtn.appendChild(label);
    controlsRight.appendChild(techTreeBtn);
  }
  if (referenceEditable && REFERENCE_MUTABLE_ENTITY_TABS.has(tabKey)) {
    const actionRow = document.createElement('div');
    actionRow.className = 'reference-entity-actions';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ghost action-add';
    addBtn.textContent = '＋ Add';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'ghost action-copy';
    copyBtn.textContent = '⧉ Copy';
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'ghost action-import';
    importBtn.textContent = '⇪ Import';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'ghost action-delete';
    deleteBtn.textContent = '🗑 Delete';
    const selectedEntry = allEntries[Math.max(0, Number(state.referenceSelection[tabKey] || 0))] || null;
    copyBtn.disabled = !selectedEntry;
    deleteBtn.disabled = !selectedEntry;

    addBtn.addEventListener('click', () => {
      const singular = String(tab.title || 'Entry').replace(/s$/, '') || 'Entry';
      const key = makeUniqueReferenceCivilopediaKey(tab, tabKey, `NEW_${tab.title.slice(0, 3)}_${Date.now()}`);
      const newEntry = buildNewReferenceEntryFromTemplate({
        tabKey,
        sourceEntry: selectedEntry || allEntries[0] || null,
        civilopediaKey: key,
        mode: 'blank',
        displayName: `New ${singular}`
      });
      const ops = ensureReferenceRecordOps(tab);
      ops.push({
        op: 'add',
        newRecordRef: key
      });
      rememberUndoSnapshot();
      tab.entries.unshift(newEntry);
      state.referenceSelection[tabKey] = 0;
      setDirty(true);
      setStatus(`Added new ${tab.title.slice(0, -1)}. Edit Name and Key, then save.`);
      renderActiveTab({ preserveTabScroll: true });
    });

    copyBtn.addEventListener('click', () => {
      if (!selectedEntry) return;
      const copyName = `${selectedEntry.name || inferReferenceNameFromKey(selectedEntry.civilopediaKey, tabKey)} Copy`;
      const key = makeUniqueReferenceCivilopediaKey(tab, tabKey, copyName);
      const newEntry = buildNewReferenceEntryFromTemplate({
        tabKey,
        sourceEntry: selectedEntry,
        civilopediaKey: key,
        mode: 'copy',
        displayName: copyName
      });
      const ops = ensureReferenceRecordOps(tab);
      ops.push({
        op: 'copy',
        sourceRef: String(selectedEntry.civilopediaKey || '').toUpperCase(),
        newRecordRef: key
      });
      rememberUndoSnapshot();
      tab.entries.unshift(newEntry);
      state.referenceSelection[tabKey] = 0;
      setDirty(true);
      setStatus(`Copied "${selectedEntry.name || selectedEntry.civilopediaKey}" to a new entry. Update Name/Key as needed.`);
      renderActiveTab({ preserveTabScroll: true });
    });

    importBtn.addEventListener('click', async () => {
      const result = await promptReferenceCreateAction({ tab, tabKey, selectedEntry, initialMode: 'import', lockMode: true });
      if (!result || result.mode !== 'import' || !result.importedEntry) return;
      const key = makeUniqueReferenceCivilopediaKey(tab, tabKey, result.key || result.name);
      const newEntry = buildNewReferenceEntryFromTemplate({
        tabKey,
        sourceEntry: result.importedEntry,
        civilopediaKey: key,
        mode: 'import',
        displayName: result.name
      });
      const ops = ensureReferenceRecordOps(tab);
      ops.push({
        op: 'add',
        newRecordRef: key
      });
      rememberUndoSnapshot();
      tab.entries.unshift(newEntry);
      state.referenceSelection[tabKey] = 0;
      setDirty(true);
      setStatus(`Imported "${result.importedEntry.name || result.importedEntry.civilopediaKey}" into this scenario as a new entry.`);
      renderActiveTab({ preserveTabScroll: true });
    });

    deleteBtn.addEventListener('click', async () => {
      if (!selectedEntry) return;
      const confirmed = await promptReferenceDeleteAction({ tab, selectedEntry });
      if (!confirmed) return;
      const targetKey = String(selectedEntry.civilopediaKey || '').toUpperCase();
      const ops = ensureReferenceRecordOps(tab);
      rememberUndoSnapshot();
      tab.entries = (tab.entries || []).filter((entry) => String(entry && entry.civilopediaKey || '').toUpperCase() !== targetKey);
      const hadCreateOp = ops.some((op) => String(op && op.newRecordRef || '').toUpperCase() === targetKey);
      tab.recordOps = ops.filter((op) => {
        const newRef = String(op && op.newRecordRef || '').toUpperCase();
        const srcRef = String(op && op.sourceRef || '').toUpperCase();
        const recRef = String(op && op.recordRef || '').toUpperCase();
        if (newRef === targetKey) return false;
        if (srcRef === targetKey) return false;
        if (recRef === targetKey) return false;
        return true;
      });
      if (!hadCreateOp) {
        ensureReferenceRecordOps(tab).push({ op: 'delete', recordRef: targetKey });
      }
      state.referenceSelection[tabKey] = 0;
      setDirty(true);
      renderActiveTab({ preserveTabScroll: true });
    });

    actionRow.appendChild(addBtn);
    actionRow.appendChild(copyBtn);
    actionRow.appendChild(importBtn);
    actionRow.appendChild(deleteBtn);
    controlsRight.appendChild(actionRow);
  }
  wrap.appendChild(controls);

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
  const filterText = String(state.referenceFilter[tabKey] || '').trim();
  const hasFilterText = !!filterText;
  let selectedFilteredIndex = filteredEntries.findIndex((x) => x.baseIndex === currentBaseIndex);
  if (selectedFilteredIndex < 0) selectedFilteredIndex = 0;
  if (filteredEntries.length > 0) {
    state.referenceSelection[tabKey] = filteredEntries[selectedFilteredIndex].baseIndex;
  }

  const layout = document.createElement('div');
  layout.className = 'entry-layout';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  const pendingListThumbs = [];
  const hydrateVisibleReferenceListThumbs = (limit = 24) => {
    let remaining = Math.max(1, Number(limit) || 24);
    if (remaining <= 0) return;
    const paneRect = listPane.getBoundingClientRect();
    for (let i = 0; i < pendingListThumbs.length && remaining > 0; i += 1) {
      const item = pendingListThumbs[i];
      if (!item || !item.thumb || item.thumb.dataset.thumbPending !== '1') continue;
      if (!item.thumb.isConnected) {
        item.thumb.dataset.thumbPending = '0';
        continue;
      }
      const row = item.thumb.closest('.entry-list-item');
      if (!row) {
        item.thumb.dataset.thumbPending = '0';
        continue;
      }
      const rowRect = row.getBoundingClientRect();
      if (rowRect.bottom < (paneRect.top - 48) || rowRect.top > (paneRect.bottom + 48)) continue;
      item.thumb.dataset.thumbPending = '0';
      loadReferenceListThumbnail(tabKey, item.entry, item.thumb);
      remaining -= 1;
    }
  };
  listPane.addEventListener('scroll', () => {
    state.referenceListScrollTop[tabKey] = listPane.scrollTop;
    hydrateVisibleReferenceListThumbs(hasFilterText ? 40 : 24);
  });

  const activeBaseIndex = filteredEntries[selectedFilteredIndex]
    ? filteredEntries[selectedFilteredIndex].baseIndex
    : -1;
  const isUnitEraVariantEntry = (entry) => {
    const key = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
    return tabKey === 'units' && key.startsWith('PRTO_') && key.includes('_ERAS_');
  };
  const getUnitFamilyKey = (entry) => {
    const key = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
    if (tabKey !== 'units') return key;
    const eraIdx = key.indexOf('_ERAS_');
    return eraIdx > 0 ? key.slice(0, eraIdx) : key;
  };

  const addListButton = ({ entry, baseIndex, isChild = false }) => {
    const itemBtn = document.createElement('button');
    itemBtn.className = 'entry-list-item';
    if (isChild) itemBtn.classList.add('entry-list-item-child');
    itemBtn.type = 'button';
    itemBtn.setAttribute('data-entry-key', String(entry.civilopediaKey || '').toUpperCase());
    itemBtn.classList.toggle('active', baseIndex === activeBaseIndex);
    const showListThumb = tabKey !== 'gameConcepts' && !isUnitEraVariantEntry(entry);
    if (!showListThumb) itemBtn.classList.add('no-thumb');
    const thumb = showListThumb ? document.createElement('span') : null;
    if (thumb) thumb.className = 'entry-thumb';
    const title = document.createElement('strong');
    title.textContent = entry.name;
    if (thumb) itemBtn.appendChild(thumb);
    itemBtn.appendChild(title);
    if (isReferenceEntryDirty(tabKey, entry)) {
      appendDirtyBadge(itemBtn, `${entry.name || entry.civilopediaKey} has unsaved edits`);
    }
    if (thumb) {
      if (baseIndex === activeBaseIndex) {
        thumb.dataset.thumbPending = '0';
        loadReferenceListThumbnail(tabKey, entry, thumb);
      } else {
        thumb.dataset.thumbPending = '1';
        pendingListThumbs.push({ thumb, entry });
      }
    }
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
  };

  if (tabKey !== 'units') {
    filteredEntries.forEach(({ entry, baseIndex }) => addListButton({ entry, baseIndex }));
  } else {
    const byKey = new Map(
      allEntries.map((entry, idx) => [String(entry && entry.civilopediaKey || '').trim().toUpperCase(), { entry, baseIndex: idx }])
    );
    const groups = [];
    const groupByFamily = new Map();
    filteredEntries.forEach((item) => {
      const familyKey = getUnitFamilyKey(item.entry);
      if (!groupByFamily.has(familyKey)) {
        const group = { familyKey, parent: null, children: [] };
        groupByFamily.set(familyKey, group);
        groups.push(group);
      }
      const group = groupByFamily.get(familyKey);
      const key = String(item.entry && item.entry.civilopediaKey || '').trim().toUpperCase();
      if (key === familyKey) group.parent = item;
      else group.children.push(item);
    });

    groups.forEach((group) => {
      const groupWrap = document.createElement('div');
      groupWrap.className = 'entry-list-group';
      if (group.parent) {
        addListButton({ entry: group.parent.entry, baseIndex: group.parent.baseIndex, isChild: false });
        const parentBtn = listPane.lastElementChild;
        if (parentBtn) groupWrap.appendChild(parentBtn);
      } else {
        const base = byKey.get(group.familyKey);
        if (base && base.entry) {
          const parentLabel = document.createElement('div');
          parentLabel.className = 'entry-list-item entry-list-item-parent-label no-thumb';
          const title = document.createElement('strong');
          title.textContent = String(base.entry.name || base.entry.civilopediaKey || group.familyKey);
          parentLabel.appendChild(title);
          groupWrap.appendChild(parentLabel);
        }
      }
      group.children.forEach((child) => {
        addListButton({ entry: child.entry, baseIndex: child.baseIndex, isChild: true });
        const childBtn = listPane.lastElementChild;
        if (childBtn) groupWrap.appendChild(childBtn);
      });
      if (groupWrap.children.length > 0) listPane.appendChild(groupWrap);
    });
  }
  layout.appendChild(listPane);
  requestAnimationFrame(() => hydrateVisibleReferenceListThumbs(hasFilterText ? 56 : 32));

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
    const selectedBaseIndex = filteredEntries[selectedFilteredIndex].baseIndex;
    const openCurrentTechTree = () => {
      openTechTreeModal({
        tab,
        tabKey,
        selectedEntry: entry,
        selectedBaseIndex,
        referenceEditable,
        onSelectBaseIndex: (baseIndex) => {
          const nextEntry = tab.entries && tab.entries[baseIndex];
          if (nextEntry) {
            state.techTreeEraSelectionByTab[tabKey] = getTechFieldInt(nextEntry, 'era', state.techTreeEraSelectionByTab[tabKey] || 0);
          }
          navigateWithHistory(() => {
            state.referenceSelection[tabKey] = baseIndex;
            state.tabContentScrollTop = el.tabContent.scrollTop;
          }, { preserveTabScroll: true });
        }
      });
    };
    const card = document.createElement('div');
    card.className = 'section-card';
    card.style.setProperty('--preview-size', `${state.previewSize}px`);

    const top = document.createElement('div');
    top.className = 'section-top';
    const topName = document.createElement('strong');
    topName.textContent = String(entry.name || '');
    top.appendChild(topName);
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
    const artSlots = buildReferenceArtSlots(tabKey, entry, {
      ensureIconSlots: referenceEditable && REFERENCE_MUTABLE_ENTITY_TABS.has(tabKey)
    });
    const primaryArtSlot = artSlots.length > 0 ? artSlots[0] : null;
    const secondaryArtSlots = artSlots.length > 1 ? artSlots.slice(1) : [];
    if (primaryArtSlot) {
      const sidebarArt = document.createElement('div');
      sidebarArt.className = 'section-card reference-sidebar-art';
      sidebarArt.appendChild(makeArtSlotCard({
        tabKey,
        entry,
        slot: primaryArtSlot,
        editable: referenceEditable,
        onChanged: () => renderActiveTab({ preserveTabScroll: true }),
        showTitle: false
      }));
      navCol.appendChild(sidebarArt);
    }

    if (tabKey === 'technologies' && techTreeBtn) {
      techTreeBtn.addEventListener('click', openCurrentTechTree);
    }

    const identityMeta = document.createElement('div');
    identityMeta.className = 'section-card source-section';
    const deferredInfoBlocks = [];
    const identityTitle = document.createElement('div');
    identityTitle.className = 'section-top';
    identityTitle.innerHTML = '<strong>Identity & Art</strong>';
    identityMeta.appendChild(identityTitle);
    const identityGrid = document.createElement('div');
    identityGrid.className = 'kv-grid';
    const showInlineReadonlyKey = REFERENCE_TOP_NAME_EDIT_TABS.has(tabKey);
    if (showInlineReadonlyKey) {
      const nameRow = document.createElement('div');
      nameRow.className = 'identity-key-row';
      const nameLabel = document.createElement('label');
      nameLabel.className = 'field-meta identity-key-label';
      nameLabel.textContent = 'Name';
      const nameControl = document.createElement('div');
      nameControl.className = 'identity-key-control';
      let inlineKeyChip = null;
      let editableKeyInput = null;
      if (referenceEditable) {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'key-input-inline';
        nameInput.value = String(entry.name || '');
        nameInput.addEventListener('input', () => {
          rememberUndoSnapshot();
          const next = String(nameInput.value || '');
          entry.name = next;
          topName.textContent = next;
          const activeName = listPane.querySelector('.entry-list-item.active strong');
          if (activeName) activeName.textContent = next;
          if (tabKey === 'gameConcepts') {
            const renamed = renameReferenceEntryKey(tab, tabKey, entry, next, { allowExisting: true });
            if (renamed) {
              if (editableKeyInput) editableKeyInput.value = String(entry.civilopediaKey || '');
              if (inlineKeyChip) inlineKeyChip.textContent = String(entry.civilopediaKey || '(none)');
            }
          } else {
            const nameField = ensureBiqFieldByBaseKey(entry, 'name', 'Name', next);
            if (nameField) nameField.value = next;
          }
          setDirty(true);
        });
        nameControl.appendChild(nameInput);
      } else {
        const nameDisplay = document.createElement('span');
        nameDisplay.className = 'key-display-chip';
        nameDisplay.textContent = String(entry.name || '(none)');
        nameControl.appendChild(nameDisplay);
      }
      const canEditKey = referenceEditable && !!entry.isNew;
      if (canEditKey) {
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.className = 'key-input-inline';
        keyInput.value = String(entry.civilopediaKey || '');
        keyInput.title = 'Record key (editable for new entries)';
        keyInput.addEventListener('change', () => {
          rememberUndoSnapshot();
          const changed = renamePendingReferenceEntryKey(tab, tabKey, entry, keyInput.value);
          if (!changed) {
            keyInput.value = String(entry.civilopediaKey || '');
            return;
          }
          setDirty(true);
          renderActiveTab({ preserveTabScroll: true });
        });
        editableKeyInput = keyInput;
        nameControl.appendChild(keyInput);
      } else {
        const inlineKey = document.createElement('span');
        inlineKey.className = 'key-display-chip';
        inlineKey.textContent = String(entry.civilopediaKey || '(none)');
        inlineKey.title = 'Existing record keys are currently locked.';
        inlineKeyChip = inlineKey;
        nameControl.appendChild(inlineKey);
      }
      nameRow.appendChild(nameLabel);
      nameRow.appendChild(nameControl);
      attachRichTooltip(nameRow, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ'));
      identityGrid.appendChild(nameRow);
    }
    if (!showInlineReadonlyKey) {
      const keyRow = document.createElement('div');
      keyRow.className = 'identity-key-row';
      const keyLabel = document.createElement('label');
      keyLabel.className = 'field-meta identity-key-label';
      keyLabel.textContent = 'Key';
      const keyControl = document.createElement('div');
      keyControl.className = 'identity-key-control';
      const canEditKey = referenceEditable && !!entry.isNew;
      if (canEditKey) {
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.className = 'key-input-inline';
        keyInput.value = String(entry.civilopediaKey || '');
        keyInput.addEventListener('change', () => {
          rememberUndoSnapshot();
          const changed = renamePendingReferenceEntryKey(tab, tabKey, entry, keyInput.value);
          if (!changed) {
            keyInput.value = String(entry.civilopediaKey || '');
            return;
          }
          setDirty(true);
          renderActiveTab({ preserveTabScroll: true });
        });
        keyControl.appendChild(keyInput);
      } else {
        const keyDisplay = document.createElement('span');
        keyDisplay.className = 'key-display-chip';
        keyDisplay.textContent = String(entry.civilopediaKey || '(none)');
        keyDisplay.title = 'Existing record keys are currently locked.';
        keyControl.appendChild(keyDisplay);
      }
      keyRow.appendChild(keyLabel);
      keyRow.appendChild(keyControl);
      attachRichTooltip(keyRow, formatSourceInfo({ source: 'Derived', readPath: '', writePath: '' }, 'Derived'));
      identityGrid.appendChild(keyRow);
    }
    const depsLine = document.createElement('div');
    depsLine.className = 'field-meta';
    const techCtx = buildIdentityTechContext(tabKey, entry);
    const identityValues = formatIdentityTechValues(techCtx);
    const hasIdentityTechInfo = techCtx.fields.length > 0 || identityValues.length > 0;
    if (hasIdentityTechInfo) {
      if (!referenceEditable) {
        const techData = getTechTreeData(getTechEntries());
        const ids = (techCtx.fields.length > 0 ? techCtx.fields : identityValues.map((value) => ({ value })))
          .map((fieldOrValue) => resolveTechIndexFromValue(fieldOrValue && fieldOrValue.value != null ? fieldOrValue.value : fieldOrValue))
          .filter((id, idx, arr) => Number.isFinite(id) && id >= 0 && arr.indexOf(id) === idx);
        if (ids.length > 0) {
          const links = createTechLinkPills({
            title: techCtx.label,
            ids,
            byId: techData.byId,
            onJump: (id) => {
              const node = techData.byId.get(id);
              appendDebugLog('identity-tech:click', {
                tab: tabKey,
                label: techCtx.label,
                id,
                targetKey: node && node.entry ? String(node.entry.civilopediaKey || '') : ''
              });
              if (node && node.entry) navigateToReferenceEntry('technologies', node.entry);
            }
          });
          const pills = Array.from(links.querySelectorAll('.tech-link-pill'));
          pills.forEach((btn, idx) => {
            const id = ids[idx];
            const node = techData.byId.get(id);
            btn.addEventListener('mouseenter', () => {
              appendDebugLog('identity-tech:hover', {
                tab: tabKey,
                label: techCtx.label,
                id,
                targetKey: node && node.entry ? String(node.entry.civilopediaKey || '') : ''
              });
              if (!node || !node.entry || !node.entry.civilopediaKey) return;
              showPediaLinkPreview(btn, node.entry.civilopediaKey, String(node.entry.name || ''));
            });
            btn.addEventListener('mouseleave', () => {
              hidePediaLinkPreviewSoon();
            });
            btn.addEventListener('focus', () => {
              if (!node || !node.entry || !node.entry.civilopediaKey) return;
              showPediaLinkPreview(btn, node.entry.civilopediaKey, String(node.entry.name || ''));
            });
            btn.addEventListener('blur', () => {
              hidePediaLinkPreviewSoon();
            });
          });
          attachRichTooltip(links, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ'));
          identityGrid.appendChild(links);
        } else {
          depsLine.innerHTML = `<strong>${techCtx.label}:</strong> ${formatReferenceList(identityValues)}`;
          attachRichTooltip(depsLine, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ'));
          identityGrid.appendChild(depsLine);
        }
      } else {
        depsLine.innerHTML = `<strong>${techCtx.label}:</strong>${techCtx.fields.length > 0 ? '' : ` ${formatReferenceList(identityValues)}`}`;
        attachRichTooltip(depsLine, formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ'));
        identityGrid.appendChild(depsLine);
      }
    }
    if (referenceEditable && techCtx.editable && techCtx.fields.length > 0) {
      const techEditRow = document.createElement('div');
      techEditRow.className = 'rule-control';
      const values = techCtx.fields.map((field) => resolveTechIndexFromValue(field.value));
      let lastUsedIndex = -1;
      values.forEach((value, idx) => {
        if (value != null && value >= 0) lastUsedIndex = idx;
      });
      const visibleCount = Math.max(1, Math.min(4, lastUsedIndex + 2));
      techCtx.fields.slice(0, visibleCount).forEach((field) => {
        const picker = createTechIdentityPicker(field, () => {
          const nextValues = formatIdentityTechValues(techCtx);
          depsLine.innerHTML = `<strong>${techCtx.label}:</strong> ${formatReferenceList(
            nextValues
          )}`;
          setDirty(true);
          renderActiveTab({ preserveTabScroll: true });
        });
        techEditRow.appendChild(picker);
      });
      identityGrid.appendChild(techEditRow);
    }
    identityMeta.appendChild(identityGrid);
    const artGrid = document.createElement('div');
    artGrid.className = 'kv-grid';
    if (secondaryArtSlots.length > 0) {
      const collapse = document.createElement('details');
      collapse.className = 'reference-art-collapse';
      const summary = document.createElement('summary');
      summary.textContent = `Other Art (${secondaryArtSlots.length})`;
      collapse.appendChild(summary);
      const artSlotsWrap = document.createElement('div');
      artSlotsWrap.className = 'art-slot-grid';
      secondaryArtSlots.forEach((slot) => {
        const cardSlot = makeArtSlotCard({
          tabKey,
          entry,
          slot,
          editable: referenceEditable,
          onChanged: () => renderActiveTab({ preserveTabScroll: true })
        });
        artSlotsWrap.appendChild(cardSlot);
      });
      collapse.appendChild(artSlotsWrap);
      artGrid.appendChild(collapse);
    }
    if (tabKey === 'units') {
      renderUnitAnimationPanel(tabKey, entry, artGrid, referenceEditable);
    }
    if (secondaryArtSlots.length > 0 || tabKey === 'units') {
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
      let visibleRuleFields = entry.biqFields
        .filter((field) => !shouldHideBiqField(tabKey, field))
        .sort((a, b) => {
          const ao = getRuleFieldOrder(tabKey, a);
          const bo = getRuleFieldOrder(tabKey, b);
          if (ao !== bo) return ao - bo;
          return String(a.label || a.key).localeCompare(String(b.label || b.key), 'en', { sensitivity: 'base' });
        });
      if (tabKey === 'units') {
        visibleRuleFields = collapseUnitRuleFields(visibleRuleFields);
      }
      if (tabKey === 'governments') {
        visibleRuleFields = visibleRuleFields.filter((field) => !isGovernmentRelationsField(field));
      }
      if (tabKey === 'civilizations') {
        visibleRuleFields = visibleRuleFields.filter((field) => !isCivilizationBuildPriorityField(field));
        visibleRuleFields = visibleRuleFields.filter((field) => !isCivilizationNoteListCountField(field));
      }
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
        if (tabKey === 'technologies' && groupName === 'Tech Tree') {
          const openBtn = document.createElement('button');
          openBtn.type = 'button';
          openBtn.className = 'ghost tech-tree-inline-btn tech-tree-action-btn';
          const icon = document.createElement('span');
          icon.className = 'tech-tree-btn-icon';
          icon.textContent = '🌳';
          openBtn.appendChild(icon);
          const txt = document.createElement('span');
          txt.textContent = 'Open Tech Tree';
          openBtn.appendChild(txt);
          openBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            openCurrentTechTree();
          });
          groupTitle.appendChild(openBtn);
        }
        groupCard.appendChild(groupTitle);
        fields.forEach((field) => {
          const spec = getRuleFieldSpec(tabKey, field) || {};
          const row = document.createElement('div');
          row.className = 'rule-row';
          const label = document.createElement('label');
          label.className = 'field-meta';
          const displayLabel = getRuleFieldDisplayLabel(tabKey, field, spec);
          label.textContent = displayLabel;
          const ruleFieldKey = String(field.baseKey || field.key || '');
          attachRichTooltip(
            label,
            withFieldHelp(
              `${formatSourceInfo(entry.sourceMeta && entry.sourceMeta.biq, 'BIQ')}\nField: ${ruleFieldKey}`,
              { tabKey, fieldKey: ruleFieldKey }
            )
          );
          row.appendChild(label);

          const controlWrap = document.createElement('div');
          controlWrap.className = 'rule-control';
          const enumOptions = getEnumOptionsForField(tabKey, field);
          const refOptions = getReferenceOptionsForField(tabKey, field);
          const desiredControl = spec.control || '';
          const baseKey = String(field.baseKey || field.key || '').toLowerCase();
          const useColorSlotPicker = tabKey === 'civilizations' && (baseKey === 'defaultcolor' || baseKey === 'uniquecolor');

          if (referenceEditable) {
            const hasEnumOptions = enumOptions.length > 0;
            const hasRefOptions = refOptions.length > 0;
            const useReferencePicker = hasRefOptions && (desiredControl === 'reference' || (!desiredControl && !hasEnumOptions));

            if (desiredControl === 'unit-list') {
              const initialValues = Array.isArray(field.multiValues)
                ? field.multiValues
                : String(field.value || '').split(',').map((v) => v.trim()).filter(Boolean);
              const editor = makeNamedListPickerEditor({
                tabKey: 'units',
                values: initialValues,
                onValuesChange: (values) => {
                  rememberUndoSnapshot();
                  setUnitListFieldValues(entry, String(field.baseKey || field.key || 'stealth_target'), values);
                  setDirty(true);
                  renderActiveTab({ preserveTabScroll: true });
                }
              });
              controlWrap.appendChild(editor);
            } else if (useColorSlotPicker) {
              const colorPicker = createColorSlotPicker({
                currentValue: field.value,
                max: 31,
                onSelect: (value) => {
                  rememberUndoSnapshot();
                  field.value = String(value);
                  setDirty(true);
                }
              });
              controlWrap.appendChild(colorPicker);
            } else if (useReferencePicker) {
              const labelText = String(field.label || field.key || 'value').trim();
              const isTechPrereqField = tabKey === 'technologies' && /^prerequisite/i.test(String(field.baseKey || field.key || ''));
              const normalizedCurrentValue = isTechPrereqField
                ? (() => {
                    const idx = resolveTechIndexFromValue(field.value);
                    return idx == null ? '-1' : String(idx);
                  })()
                : field.value;
              const picker = createReferencePicker({
                options: refOptions,
                targetTabKey: (BIQ_FIELD_REFS[tabKey] || {})[String(field.baseKey || field.key || '').toLowerCase()] || '',
                currentValue: normalizedCurrentValue,
                searchPlaceholder: `Search ${labelText}...`,
                noneLabel: '(none)',
                onSelect: (value) => {
                  rememberUndoSnapshot();
                  field.value = String(value);
                  setDirty(true);
                }
              });
              controlWrap.appendChild(picker);
            } else if (desiredControl === 'range') {
              const wrap = document.createElement('div');
              wrap.style.display = 'flex';
              wrap.style.alignItems = 'center';
              wrap.style.gap = '8px';
              const range = document.createElement('input');
              range.type = 'range';
              const min = Number.isFinite(spec.min) ? Number(spec.min) : 0;
              const max = Number.isFinite(spec.max) ? Number(spec.max) : 100;
              range.min = String(min);
              range.max = String(max);
              const current = parseIntFromDisplayValue(field.value);
              range.value = String(current == null ? min : Math.max(min, Math.min(max, current)));
              const valueText = document.createElement('span');
              valueText.className = 'field-meta';
              valueText.textContent = range.value;
              range.addEventListener('input', () => {
                valueText.textContent = range.value;
                rememberUndoSnapshot();
                field.value = String(range.value);
                setDirty(true);
              });
              wrap.appendChild(range);
              wrap.appendChild(valueText);
              controlWrap.appendChild(wrap);
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
              const isTechPrereqField = tabKey === 'technologies' && /^prerequisite/i.test(String(field.baseKey || field.key || ''));
              const parsed = isTechPrereqField ? resolveTechIndexFromValue(field.value) : parseIntFromDisplayValue(field.value);
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
              enableBooleanRowToggle(row, check);
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
            const hasEnumOptions = enumOptions.length > 0;
            const hasRefOptions = refOptions.length > 0;
            const useReferencePicker = hasRefOptions && (desiredControl === 'reference' || (!desiredControl && !hasEnumOptions));
            if (useReferencePicker) {
              const labelText = String(field.label || field.key || 'value').trim();
              const isTechPrereqField = tabKey === 'technologies' && /^prerequisite/i.test(String(field.baseKey || field.key || ''));
              const normalizedCurrentValue = isTechPrereqField
                ? (() => {
                    const idx = resolveTechIndexFromValue(field.value);
                    return idx == null ? '-1' : String(idx);
                  })()
                : field.value;
              const picker = createReferencePicker({
                options: refOptions,
                targetTabKey: (BIQ_FIELD_REFS[tabKey] || {})[String(field.baseKey || field.key || '').toLowerCase()] || '',
                currentValue: normalizedCurrentValue,
                searchPlaceholder: `Search ${labelText}...`,
                noneLabel: '(none)',
                showOptionThumbs: false,
                readOnly: true
              });
              controlWrap.appendChild(picker);
            } else {
              const text = document.createElement('div');
              text.className = 'field-meta';
              text.textContent = formatFieldValueForDisplay(tabKey, field);
              controlWrap.appendChild(text);
            }
          }
          row.appendChild(controlWrap);
          groupCard.appendChild(row);
        });
        rulesGrid.appendChild(groupCard);
      }
      if (tabKey === 'units') {
        rulesGrid.appendChild(renderUnitBottomListsCard(entry, referenceEditable));
      }
      if (tabKey === 'governments') {
        const relCard = renderGovernmentRelationsCard(entry, referenceEditable);
        if (relCard) rulesGrid.appendChild(relCard);
      }
      if (tabKey === 'civilizations') {
        const diplomacySectionsCard = renderCivilizationDiplomacySectionsCard(tab, referenceEditable);
        if (diplomacySectionsCard) rulesGrid.appendChild(diplomacySectionsCard);
        const buildCard = renderCivilizationBuildPriorityCard(entry, referenceEditable);
        if (buildCard) rulesGrid.appendChild(buildCard);
        const nameListsCard = renderCivilizationNameListsCard(entry, referenceEditable);
        if (nameListsCard) rulesGrid.appendChild(nameListsCard);
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

function parseCsvNumberLikeList(raw) {
  const text = String(raw == null ? '' : raw).trim();
  if (!text || text === '(none)') return [];
  return text.split(',').map((part) => String(part || '').trim());
}

function parseFiniteNumber(value) {
  const num = Number.parseFloat(String(value == null ? '' : value).trim());
  return Number.isFinite(num) ? num : null;
}

function formatScenarioYearLabel(value) {
  if (!Number.isFinite(value)) return '(unknown)';
  const rounded = Math.round(value * 100) / 100;
  const absVal = Math.abs(rounded);
  const display = Number.isInteger(absVal) ? String(absVal) : String(absVal);
  return rounded <= 0 ? `${display} BC` : `${display} AD`;
}

function getTimeProgressionYearRanges(rows, startYearRaw) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const startYear = parseFiniteNumber(startYearRaw);
  if (!Number.isFinite(startYear)) {
    return safeRows.map(() => '(unknown)');
  }
  let cursor = startYear;
  return safeRows.map((timeRow) => {
    const row = timeRow || {};
    const turns = parseFiniteNumber(row.turnsValue);
    const perTurn = parseFiniteNumber(row.perTurnValue);
    const delta = Number.isFinite(turns) && Number.isFinite(perTurn) ? (turns * perTurn) : 0;
    const startLabel = formatScenarioYearLabel(cursor);
    const endValue = cursor + delta;
    const endLabel = formatScenarioYearLabel(endValue);
    cursor = endValue;
    return `${startLabel} to ${endLabel}`;
  });
}

function extractTimeProgressionModel(groupFields) {
  const fields = Array.isArray(groupFields) ? groupFields : [];
  if (fields.length === 0) return null;

  const splitTurnsByIdx = new Map();
  const splitPerTurnByIdx = new Map();
  fields.forEach((field) => {
    const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
    const turnsMatch = base.match(/^turns_in_time_section_(\d+)$/);
    if (turnsMatch) {
      splitTurnsByIdx.set(Number.parseInt(turnsMatch[1], 10), field);
      return;
    }
    const perTurnMatch = base.match(/^time_per_turn_in_time_section_(\d+)$/);
    if (perTurnMatch) {
      splitPerTurnByIdx.set(Number.parseInt(perTurnMatch[1], 10), field);
    }
  });

  if (splitTurnsByIdx.size > 0 || splitPerTurnByIdx.size > 0) {
    const idxs = new Set([...splitTurnsByIdx.keys(), ...splitPerTurnByIdx.keys()]);
    const sorted = Array.from(idxs).sort((a, b) => a - b);
    return {
      mode: 'split',
      consumedFields: new Set([
        ...Array.from(splitTurnsByIdx.values()),
        ...Array.from(splitPerTurnByIdx.values())
      ]),
      rows: sorted.map((idx, rowIdx) => {
        const turnsField = splitTurnsByIdx.get(idx) || null;
        const perTurnField = splitPerTurnByIdx.get(idx) || null;
        return {
          section: rowIdx + 1,
          turnsField,
          perTurnField,
          turnsValue: String(turnsField && turnsField.value || '').trim(),
          perTurnValue: String(perTurnField && perTurnField.value || '').trim()
        };
      })
    };
  }

  let turnsCsvField = null;
  let perTurnCsvField = null;
  fields.forEach((field) => {
    const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
    if (base === 'turns_per_timescale_part') turnsCsvField = field;
    if (base === 'time_units_per_turn') perTurnCsvField = field;
  });
  if (!turnsCsvField && !perTurnCsvField) return null;

  const turnsVals = parseCsvNumberLikeList(turnsCsvField && turnsCsvField.value);
  const perTurnVals = parseCsvNumberLikeList(perTurnCsvField && perTurnCsvField.value);
  const rowCount = Math.max(turnsVals.length, perTurnVals.length, 1);
  const rows = [];
  for (let i = 0; i < rowCount; i += 1) {
    rows.push({
      section: i + 1,
      turnsValue: String(turnsVals[i] || '').trim(),
      perTurnValue: String(perTurnVals[i] || '').trim()
    });
  }
  return {
    mode: 'csv',
    turnsCsvField,
    perTurnCsvField,
    consumedFields: new Set([turnsCsvField, perTurnCsvField].filter(Boolean)),
    rows
  };
}

function serializeTimeProgressionList(rows, key) {
  const vals = rows.map((row) => String((row && row[key]) || '').trim());
  let last = vals.length - 1;
  while (last >= 0 && !vals[last]) last -= 1;
  return vals.slice(0, last + 1).join(', ');
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
  const selectedBase = sections[selectedSectionIndex];
  const selectedBaseCode = String(selectedBase && selectedBase.code || '').toUpperCase();
  const gamePanelStateKey = `${selectionKey}:game-panel`;
  const gamePanelDefinitions = selectedBaseCode === 'GAME' ? GAME_PANEL_DEFINITIONS : [];
  const gamePanelIndex = Math.max(0, Math.min(Number(state.biqSectionSelectionByTab[gamePanelStateKey] || 0), Math.max(0, gamePanelDefinitions.length - 1)));
  state.biqSectionSelectionByTab[gamePanelStateKey] = gamePanelIndex;
  const activeGamePanel = gamePanelDefinitions[gamePanelIndex] || null;
  let selected = selectedBase;
  let selectedCode = selectedBaseCode;
  let selectedSectionTab = tab;
  if (selectedBaseCode === 'GAME' && activeGamePanel && activeGamePanel.id === 'players') {
    const playersTab = getBiqTabByKey('players');
    const leadSection = getBiqSectionFromTab(playersTab, 'LEAD');
    if (playersTab && leadSection) {
      selected = leadSection;
      selectedCode = 'LEAD';
      selectedSectionTab = playersTab;
    }
  }
  const hideRecordList = selectedCode === 'RULE' || selectedCode === 'GAME';
  let stickySubtabRows = 0;

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
    stickySubtabRows += 1;
  }
  if (selectedBaseCode === 'GAME' && gamePanelDefinitions.length > 1) {
    const panelRow = document.createElement('div');
    panelRow.className = 'biq-subtabs';
    gamePanelDefinitions.forEach((panel, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'biq-subtab-btn';
      btn.classList.toggle('active', idx === gamePanelIndex);
      btn.textContent = panel.label;
      btn.addEventListener('click', () => {
        navigateWithHistory(() => {
          state.tabContentScrollTop = el.tabContent.scrollTop;
          state.biqSectionSelectionByTab[gamePanelStateKey] = idx;
        }, { preserveTabScroll: true });
      });
      panelRow.appendChild(btn);
    });
    wrap.appendChild(panelRow);
    stickySubtabRows += 1;
  }
  if (stickySubtabRows > 0) {
    wrap.classList.add('has-biq-subtabs');
    wrap.style.setProperty('--biq-subtabs-offset', `${stickySubtabRows * 52}px`);
  }

  const recordFilterRow = document.createElement('div');
  recordFilterRow.className = 'reference-filter-row sticky-search-row';
  const recordSearch = document.createElement('input');
  recordSearch.type = 'search';
  recordSearch.classList.add('app-search-input');
  recordSearch.placeholder = `Search ${getFriendlyBiqSectionTitle(selected).toLowerCase()}...`;
  const recordFilterKey = `${selectionKey}:${selected.id}`;
  recordSearch.value = state.biqRecordFilter[recordFilterKey] || '';
  recordFilterRow.appendChild(recordSearch);
  const controlsRight = document.createElement('div');
  controlsRight.className = 'reference-filter-right';
  recordFilterRow.appendChild(controlsRight);
  if (!hideRecordList) wrap.appendChild(recordFilterRow);

  const records = Array.isArray(selected.records) ? selected.records : [];

  if (selected.code === 'TILE') {
    const card = document.createElement('div');
    card.className = 'section-card';
    const top = document.createElement('div');
    top.className = 'section-top';
    top.innerHTML = '<strong>Map Editor</strong><span class="hint">Opens in modal</span>';
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'secondary';
    openBtn.textContent = 'Open Map';
    openBtn.addEventListener('click', () => {
      openMapModal({ tab, tileSection: selected, title: `${tab.title || 'Map'} Editor` });
    });
    top.appendChild(openBtn);
    card.appendChild(top);
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Pan, zoom, and tile inspection are now in a large modal workspace.';
    card.appendChild(hint);
    wrap.appendChild(card);
    window.requestAnimationFrame(() => {
      openMapModal({ tab, tileSection: selected, title: `${tab.title || 'Map'} Editor` });
    });
    return wrap;
  }

  const selectedRecordIndex = Math.max(
    0,
    Math.min(Number(state.biqRecordSelection[selected.id] || 0), Math.max(0, records.length - 1))
  );
  state.biqRecordSelection[selected.id] = selectedRecordIndex;
  const selectedRecord = records[selectedRecordIndex] || null;

  const structureMutable = !tab.readOnly && (selected.code === 'TFRM' || (selected.code === 'LEAD' && selectionKey === 'players'));
  if (structureMutable) {
    const actionRow = document.createElement('div');
    actionRow.className = 'reference-entity-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ghost action-add';
    addBtn.textContent = '＋ Add';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'ghost action-copy';
    copyBtn.textContent = '⧉ Copy';
    copyBtn.disabled = !selectedRecord;

    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'ghost action-import';
    importBtn.textContent = '⇪ Import';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'ghost action-delete';
    deleteBtn.textContent = '🗑 Delete';
    deleteBtn.disabled = !selectedRecord;

    addBtn.addEventListener('click', () => {
      const newRef = makeUniqueBiqStructureRecordRef(tab, selected.code);
      const newRecord = selected.code === 'LEAD'
        ? makeBlankBiqStructureRecord({
          section: selected,
          newRecordRef: newRef,
          displayName: `Player ${selected.records.length + 1}`
        })
        : buildBiqStructureRecordFromSource({
          section: selected,
          sourceRecord: selectedRecord || records[0] || null,
          mode: 'blank',
          newRecordRef: newRef
        });
      const ops = ensureBiqStructureRecordOps(tab);
      rememberUndoSnapshot();
      if (selected.code === 'LEAD') selected.records.push(newRecord);
      else selected.records.unshift(newRecord);
      ops.push({ op: 'add', sectionCode: selected.code, newRecordRef: newRef });
      state.biqRecordSelection[selected.id] = selected.code === 'LEAD'
        ? Math.max(0, selected.records.length - 1)
        : 0;
      setDirty(true);
      setStatus(`Added new ${selected.code} record.`);
      renderActiveTab({ preserveTabScroll: true });
    });

    copyBtn.addEventListener('click', () => {
      if (selected.code === 'LEAD') return;
      if (!selectedRecord) return;
      const sourceRef = getBiqStructureRecordRef(selectedRecord);
      if (!sourceRef) {
        setStatus('Could not resolve source record for copy.', true);
        return;
      }
      const newRef = makeUniqueBiqStructureRecordRef(tab, selected.code);
      const newRecord = buildBiqStructureRecordFromSource({
        section: selected,
        sourceRecord: selectedRecord,
        mode: 'copy',
        newRecordRef: newRef
      });
      const ops = ensureBiqStructureRecordOps(tab);
      rememberUndoSnapshot();
      selected.records.unshift(newRecord);
      ops.push({ op: 'copy', sectionCode: selected.code, sourceRef, newRecordRef: newRef });
      state.biqRecordSelection[selected.id] = Math.max(0, Math.min(
        Number(state.biqRecordSelection[selected.id] || 0),
        Math.max(0, selected.records.length - 1)
      ));
      setDirty(true);
      setStatus(`Copied ${selected.code} record.`);
      renderActiveTab({ preserveTabScroll: true });
    });

    importBtn.addEventListener('click', async () => {
      if (selected.code === 'LEAD') {
        return;
      }
      const importPath = await window.c3xManager.pickFile({
        filters: [{ name: 'BIQ Scenario Files', extensions: ['biq'] }]
      });
      if (!importPath) return;
      try {
        const loaded = await window.c3xManager.loadBundle({
          mode: 'scenario',
          c3xPath: state.settings.c3xPath,
          civ3Path: state.settings.civ3Path,
          scenarioPath: importPath
        });
        const importTab = loaded && loaded.tabs ? loaded.tabs[selectionKey] : null;
        const importSections = importTab && Array.isArray(importTab.sections) ? importTab.sections : [];
        const importSection = importSections.find((s) => String(s && s.code || '').toUpperCase() === selected.code);
        const importRecords = importSection && Array.isArray(importSection.records) ? importSection.records : [];
        if (importRecords.length === 0) {
          setStatus(`No ${selected.code} records found in import scenario.`, true);
          return;
        }
        const sourceIdx = Math.max(0, Math.min(selectedRecordIndex, importRecords.length - 1));
        const sourceRecord = importRecords[sourceIdx];
        const newRef = makeUniqueBiqStructureRecordRef(tab, selected.code);
        const newRecord = buildBiqStructureRecordFromSource({
          section: selected,
          sourceRecord,
          mode: 'import',
          newRecordRef: newRef
        });
        const ops = ensureBiqStructureRecordOps(tab);
        rememberUndoSnapshot();
        selected.records.unshift(newRecord);
        ops.push({ op: 'add', sectionCode: selected.code, newRecordRef: newRef });
        state.biqRecordSelection[selected.id] = 0;
        setDirty(true);
        setStatus(`Imported ${selected.code} record from scenario.`);
        renderActiveTab({ preserveTabScroll: true });
      } catch (err) {
        setStatus(err && err.message ? err.message : 'Import failed.', true);
      }
    });

    deleteBtn.addEventListener('click', async () => {
      if (!selectedRecord) return;
      const needsTerrainDeleteConfirm = selectionKey === 'terrain' && (selected.code === 'TERR' || selected.code === 'TFRM');
      if (needsTerrainDeleteConfirm) {
        const confirmed = await promptBiqStructureDeleteAction({
          sectionCode: selected.code,
          sectionTitle: getFriendlyBiqSectionTitle(selected),
          recordName: getDisplayBiqRecordName(selected.code, selectedRecord, selectedRecordIndex)
        });
        if (!confirmed) return;
      }
      const targetRef = getBiqStructureRecordRef(selectedRecord);
      if (!targetRef) {
        setStatus('Could not resolve record for delete.', true);
        return;
      }
      const target = String(targetRef).trim().toUpperCase();
      rememberUndoSnapshot();
      selected.records = selected.records.filter((record) => record !== selectedRecord);
      const ops = ensureBiqStructureRecordOps(tab);
      const hadCreate = ops.some((op) => String(op && op.newRecordRef || '').trim().toUpperCase() === target);
      tab.recordOps = ops.filter((op) => {
        const rec = String(op && op.recordRef || '').trim().toUpperCase();
        const src = String(op && op.sourceRef || '').trim().toUpperCase();
        const next = String(op && op.newRecordRef || '').trim().toUpperCase();
        return rec !== target && src !== target && next !== target;
      });
      if (!hadCreate) {
        ensureBiqStructureRecordOps(tab).push({ op: 'delete', sectionCode: selected.code, recordRef: target });
      }
      state.biqRecordSelection[selected.id] = 0;
      setDirty(true);
      setStatus(`Deleted ${selected.code} record.`);
      renderActiveTab({ preserveTabScroll: true });
    });

    actionRow.appendChild(addBtn);
    if (selected.code !== 'LEAD') {
      actionRow.appendChild(copyBtn);
      actionRow.appendChild(importBtn);
    }
    actionRow.appendChild(deleteBtn);
    controlsRight.appendChild(actionRow);
  }

  if (selected.recordsTruncated) {
    const title = document.createElement('p');
    title.className = 'hint';
    title.textContent = `Showing first ${records.length} records for performance.`;
    wrap.appendChild(title);
  }

  const layout = document.createElement('div');
  layout.className = 'entry-layout';
  if (hideRecordList) layout.style.gridTemplateColumns = '1fr';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  if (!hideRecordList) {
    const showTerrainThumbs = (selected.code === 'TERR' || selected.code === 'TFRM') && !!(tab && tab.civilopedia);
    const showLeadThumbs = selected.code === 'LEAD';
    const terrainThumbTabKey = selected.code === 'TFRM' ? 'workerActions' : 'terrainPedia';
    const recordNeedle = String(state.biqRecordFilter[recordFilterKey] || '').trim().toLowerCase();
    records.forEach((record, idx) => {
      const recordTitle = getDisplayBiqRecordName(selected.code, record, idx);
      if (recordNeedle && !recordTitle.toLowerCase().includes(recordNeedle)) return;
      const itemBtn = document.createElement('button');
      itemBtn.className = `entry-list-item${(showTerrainThumbs || showLeadThumbs) ? '' : ' no-thumb'}`;
      itemBtn.type = 'button';
      itemBtn.dataset.index = String(idx);
      itemBtn.classList.toggle('active', idx === selectedRecordIndex);
      const title = document.createElement('strong');
      title.textContent = recordTitle;
      if (showTerrainThumbs) {
        const thumb = document.createElement('span');
        thumb.className = 'entry-thumb';
        itemBtn.appendChild(thumb);
        const pediaEntry = getTerrainCivilopediaEntryForRecord(tab, selected.code, record);
        if (pediaEntry) {
          loadReferenceListThumbnail(terrainThumbTabKey, pediaEntry, thumb);
        }
      } else if (showLeadThumbs) {
        const thumb = document.createElement('span');
        thumb.className = 'entry-thumb';
        itemBtn.appendChild(thumb);
        const civEntry = getLeadRecordCivEntry(record);
        if (civEntry) loadReferenceListThumbnail('civilizations', civEntry, thumb);
      }
      itemBtn.appendChild(title);
      itemBtn.addEventListener('click', () => {
        navigateWithHistory(() => {
          state.biqRecordSelection[selected.id] = idx;
        }, { preserveTabScroll: true });
      });
      listPane.appendChild(itemBtn);
    });
    recordSearch.addEventListener('input', () => {
      state.biqRecordFilter[recordFilterKey] = recordSearch.value;
      renderActiveTab({ preserveTabScroll: true });
    });
    layout.appendChild(listPane);
  }

  const detailPane = document.createElement('div');
  detailPane.className = 'entry-detail-pane';
  if (records.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'section-card';
    empty.innerHTML = '<p class="hint">No records available for this section.</p>';
    detailPane.appendChild(empty);
  } else {
    const record = records[selectedRecordIndex];
    if (selected.code === 'GAME') {
      syncNumberOfPlayableCivsField(record);
    }
    const terrainPediaEntry = (selected.code === 'TERR' || selected.code === 'TFRM')
      ? getTerrainCivilopediaEntryForRecord(tab, selected.code, record)
      : null;
    const recordDisplayName = getDisplayBiqRecordName(selected.code, record, selectedRecordIndex);
    const card = document.createElement('div');
    card.className = 'section-card';
    if (selected.code === 'GAME') {
      card.innerHTML = `<div class="section-top"><strong>${tab.title || 'Scenario'}</strong></div>`;
    } else {
      card.innerHTML = `<div class="section-top"><strong>${recordDisplayName}</strong><span class="hint">${selected.code} | #${record.index + 1}</span></div>`;
    }
    const fallbackRecordName = selected.code === 'LEAD'
      ? `Player ${selectedRecordIndex + 1}`
      : `Record ${record.index + 1}`;
    const syncDisplayedRecordName = (nextNameRaw) => {
      const nextName = String(nextNameRaw || '').trim() || fallbackRecordName;
      record.name = nextName;
      const listTitle = listPane.querySelector(`.entry-list-item[data-index="${selectedRecordIndex}"] strong`);
      if (listTitle) listTitle.textContent = nextName;
      const detailTitle = card.querySelector('.section-top strong');
      if (detailTitle) detailTitle.textContent = nextName;
    };
    const maybeSyncRecordNameFromField = (field, nextValue) => {
      const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
      const canon = base.replace(/[^a-z0-9]/g, '');
      const label = String(field && field.label || '').trim().toLowerCase();
      const isFlavorNameField = String(selected && selected.code || '').toUpperCase() === 'FLAV' && canon === 'description';
      if (isFlavorNameField) {
        syncDisplayedRecordName(nextValue);
        return;
      }
      const isNameLike = canon === 'name' || canon.endsWith('name') || label === 'name' || label.endsWith(' name');
      const codeUpper = String(selected && selected.code || '').toUpperCase();
      const usesDescriptionAsName = canon === 'description' && ['FLAV', 'ESPN', 'CTZN', 'CULT', 'EXPR'].includes(codeUpper);
      if (isNameLike || usesDescriptionAsName) syncDisplayedRecordName(nextValue);
    };
    const detailLayout = document.createElement('div');
    detailLayout.className = 'reference-detail-layout';
    const textCol = document.createElement('div');
    textCol.className = 'reference-text-col';
    const navCol = document.createElement('div');
    navCol.className = 'reference-nav-col';
    detailLayout.appendChild(textCol);
    detailLayout.appendChild(navCol);
    card.appendChild(detailLayout);

    if (terrainPediaEntry) {
      const terrainArtTabKey = selected.code === 'TFRM' ? 'workerActions' : 'terrainPedia';
      const terrainArtSlots = buildReferenceArtSlots(terrainArtTabKey, terrainPediaEntry);
      const terrainPrimaryArtSlot = terrainArtSlots.length > 0 ? terrainArtSlots[0] : null;
      if (terrainPrimaryArtSlot) {
        const sidebarArt = document.createElement('div');
        sidebarArt.className = 'section-card reference-sidebar-art';
        sidebarArt.appendChild(makeArtSlotCard({
          tabKey: terrainArtTabKey,
          entry: terrainPediaEntry,
          slot: terrainPrimaryArtSlot,
          editable: isScenarioMode(),
          onChanged: () => renderActiveTab({ preserveTabScroll: true }),
          showTitle: false
        }));
        navCol.appendChild(sidebarArt);
      }
      const sourceBadge = document.createElement('div');
      sourceBadge.className = 'hint';
      sourceBadge.style.marginBottom = '6px';
      sourceBadge.textContent = selected.code === 'TFRM'
        ? 'Worker Action Civilopedia linked to this BIQ record.'
        : 'Terrain Civilopedia linked to this BIQ record.';
      textCol.appendChild(sourceBadge);
      if (isScenarioMode()) {
        textCol.appendChild(createCivilopediaEditorBlock({
          entry: terrainPediaEntry,
          fieldKey: 'overview',
          titleText: 'Overview',
          sourceMeta: terrainPediaEntry.sourceMeta && terrainPediaEntry.sourceMeta.overview,
          emptyText: 'Overview text'
        }));
        textCol.appendChild(createCivilopediaEditorBlock({
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
        attachRichTooltip(descTitle, formatSourceInfo(terrainPediaEntry.sourceMeta && terrainPediaEntry.sourceMeta.description, 'Civilopedia'));
        textBlock.appendChild(descTitle);
        renderCivilopediaRichText(textBlock, terrainPediaEntry.description || '(No Civilopedia body found)');
        textCol.appendChild(textBlock);
      }

    }

    let fields = (record.fields || [])
      .filter((field) => !shouldHideBiqStructureField(selected.code, field))
      .sort((a, b) => {
        const ao = getBiqStructureFieldOrder(selected.code, a);
        const bo = getBiqStructureFieldOrder(selected.code, b);
        if (ao !== bo) return ao - bo;
        return String(a.label || a.key).localeCompare(String(b.label || b.key), 'en', { sensitivity: 'base' });
      });
    if (selected.code === 'TERR') {
      fields = fields.filter((field) => {
        const canon = canonicalBiqFieldKey(field);
        return canon !== 'numpossibleresources' && canon !== 'note';
      });
      fields.push({
        key: '__terrain_possible_resources',
        baseKey: '__terrain_possible_resources',
        label: 'Possible Resources',
        value: ''
      });
      fields.sort((a, b) => {
        const ao = getBiqStructureFieldOrder(selected.code, a);
        const bo = getBiqStructureFieldOrder(selected.code, b);
        if (ao !== bo) return ao - bo;
        return String(a.label || a.key).localeCompare(String(b.label || b.key), 'en', { sensitivity: 'base' });
      });
    }
    if (fields.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'No user-facing fields for this record.';
      textCol.appendChild(empty);
    } else {
      const rows = document.createElement('div');
      rows.className = 'kv-grid';
      const grouped = new Map();
      fields.forEach((field) => {
        const group = getBiqStructureFieldGroup(selected.code, field);
        if (!grouped.has(group)) grouped.set(group, []);
        grouped.get(group).push(field);
      });
      const activeTabKey = String(state.activeTab || '').trim();
      const isAlliancePanel = selected.code === 'GAME' && activeGamePanel && activeGamePanel.id === 'alliances';
      let groupedEntries = Array.from(grouped.entries()).filter(([groupName]) => {
        if (selected.code !== 'GAME' || !activeGamePanel || !Array.isArray(activeGamePanel.groups)) return true;
        if (!activeGamePanel.groups.includes(groupName)) return false;
        if (isAlliancePanel && (groupName === 'No Alliances' || /^Alliance \d+$/.test(groupName))) return false;
        return true;
      });
      if (selected.code === 'GAME') {
        const startDateIdx = groupedEntries.findIndex(([groupName]) => groupName === 'Start Date');
        const timeScaleIdx = groupedEntries.findIndex(([groupName]) => groupName === 'Time Scale');
        if (startDateIdx >= 0 && timeScaleIdx >= 0 && timeScaleIdx !== startDateIdx + 1) {
          const [timeScaleEntry] = groupedEntries.splice(timeScaleIdx, 1);
          const insertAt = Math.min(startDateIdx + 1, groupedEntries.length);
          groupedEntries.splice(insertAt, 0, timeScaleEntry);
        }
      }
      const allianceNameByIndex = {};
      const playableCivIdSet = selected.code === 'GAME' ? getPlayableCivilizationIdSet() : new Set();
      if (selected.code === 'GAME') {
        fields.forEach((field) => {
          const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
          const m = base.match(/^alliance(\d+)$/);
          if (!m) return;
          const idx = Number.parseInt(m[1], 10);
          if (!Number.isFinite(idx)) return;
          const fallback = idx === 4 ? 'No Alliances' : `Alliance ${idx + 1}`;
          const value = String(field.value || '').trim();
          allianceNameByIndex[idx] = value || fallback;
        });
      }
      if (isAlliancePanel) {
        const boardCard = document.createElement('div');
        boardCard.className = 'rule-group-card';
        const memberFieldsByAllianceAndCiv = new Map();
        fields.forEach((field) => {
          const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
          const m = base.match(/^alliance(\d+)_member_(\d+)$/);
          if (!m) return;
          const allianceIdx = Number.parseInt(m[1], 10);
          const civIdx = Number.parseInt(m[2], 10);
          if (!Number.isFinite(allianceIdx) || !Number.isFinite(civIdx)) return;
          memberFieldsByAllianceAndCiv.set(`${allianceIdx}:${civIdx}`, field);
        });
        const findAllianceNameField = (idx) => {
          const target = `alliance${idx}`;
          return (Array.isArray(record.fields) ? record.fields : []).find((f) => String(f && (f.baseKey || f.key) || '').toLowerCase() === target) || null;
        };
        const civOptionsAll = makeBiqSectionIndexOptions('RACE', false);
        const civOptions = playableCivIdSet.size > 0
          ? civOptionsAll.filter((opt) => {
            const idx = Number.parseInt(String(opt && opt.value || ''), 10);
            return Number.isFinite(idx) && playableCivIdSet.has(idx);
          })
          : civOptionsAll;
        const boolish = (value) => {
          const raw = String(value || '').trim().toLowerCase();
          return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
        };
        const civToAlliance = new Map();
        civOptions.forEach((opt) => {
          const civIdx = Number.parseInt(String(opt.value || ''), 10);
          if (!Number.isFinite(civIdx)) return;
          let assigned = -1;
          for (let allianceIdx = 0; allianceIdx < 4; allianceIdx += 1) {
            const field = memberFieldsByAllianceAndCiv.get(`${allianceIdx}:${civIdx}`);
            if (field && boolish(field.value)) {
              assigned = allianceIdx;
              break;
            }
          }
          civToAlliance.set(civIdx, assigned);
        });
        const board = document.createElement('div');
        board.className = 'alliance-dnd-board';
        const ensureAllianceMemberField = (allianceIdx, civIdx) => {
          const key = `${allianceIdx}:${civIdx}`;
          const existing = memberFieldsByAllianceAndCiv.get(key);
          if (existing) return existing;
          if (!Array.isArray(record.fields)) record.fields = [];
          const baseKey = `alliance${allianceIdx}_member_${civIdx}`;
          const created = {
            key: baseKey,
            baseKey,
            label: `Alliance ${allianceIdx + 1} Member ${civIdx + 1}`,
            value: 'false',
            originalValue: ''
          };
          record.fields.push(created);
          memberFieldsByAllianceAndCiv.set(key, created);
          return created;
        };
        const moveCivToAlliance = (civIdx, targetAllianceIdx) => {
          rememberUndoSnapshot();
          if (targetAllianceIdx >= 0) ensureAllianceMemberField(targetAllianceIdx, civIdx);
          for (let allianceIdx = 0; allianceIdx < 4; allianceIdx += 1) {
            const memberField = memberFieldsByAllianceAndCiv.get(`${allianceIdx}:${civIdx}`);
            if (!memberField) continue;
            memberField.value = (targetAllianceIdx === allianceIdx) ? 'true' : 'false';
          }
          setDirty(true);
          renderActiveTab({ preserveTabScroll: true });
        };
        const makeColumn = (title, targetAllianceIdx) => {
          const col = document.createElement('div');
          col.className = 'alliance-dnd-col';
          const head = document.createElement('div');
          head.className = 'alliance-dnd-col-title';
          if (targetAllianceIdx >= 0 && !tab.readOnly) {
            const nameBtn = document.createElement('button');
            nameBtn.type = 'button';
            nameBtn.className = 'alliance-name-btn';
            const nameText = document.createElement('span');
            nameText.textContent = title;
            const editIcon = document.createElement('span');
            editIcon.className = 'alliance-name-edit-icon';
            editIcon.textContent = '✎';
            nameBtn.appendChild(nameText);
            nameBtn.appendChild(editIcon);
            nameBtn.addEventListener('click', () => {
              const input = document.createElement('input');
              input.type = 'text';
              input.className = 'alliance-name-input';
              input.value = title;
              const commit = () => {
                const next = String(input.value || '').trim() || `Alliance ${targetAllianceIdx + 1}`;
                const field = findAllianceNameField(targetAllianceIdx);
                if (field && String(field.value || '') !== next) {
                  rememberUndoSnapshot();
                  field.value = next;
                  setDirty(true);
                }
                renderActiveTab({ preserveTabScroll: true });
              };
              input.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') commit();
                if (ev.key === 'Escape') renderActiveTab({ preserveTabScroll: true });
              });
              input.addEventListener('blur', commit);
              head.innerHTML = '';
              head.appendChild(input);
              window.requestAnimationFrame(() => {
                input.focus();
                input.select();
              });
            });
            head.appendChild(nameBtn);
          } else {
            head.textContent = title;
          }
          col.appendChild(head);
          const body = document.createElement('div');
          body.className = 'alliance-dnd-dropzone';
          if (!tab.readOnly) {
            body.addEventListener('dragover', (ev) => {
              ev.preventDefault();
              body.classList.add('drag-over');
            });
            body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
            body.addEventListener('drop', (ev) => {
              ev.preventDefault();
              body.classList.remove('drag-over');
              const civRaw = String(ev.dataTransfer && ev.dataTransfer.getData('text/plain') || '');
              const civIdx = Number.parseInt(civRaw, 10);
              if (!Number.isFinite(civIdx)) return;
              moveCivToAlliance(civIdx, targetAllianceIdx);
            });
          }
          const civs = civOptions.filter((opt) => {
            const civIdx = Number.parseInt(String(opt.value || ''), 10);
            if (!Number.isFinite(civIdx)) return false;
            const assigned = civToAlliance.get(civIdx);
            return (targetAllianceIdx < 0 && assigned < 0) || assigned === targetAllianceIdx;
          });
          if (civs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'alliance-dnd-empty';
            empty.textContent = '(none)';
            body.appendChild(empty);
          } else {
            civs.forEach((opt) => {
              const chip = document.createElement('button');
              chip.type = 'button';
              chip.className = 'alliance-dnd-chip';
              const thumb = document.createElement('span');
              thumb.className = 'entry-thumb alliance-dnd-thumb';
              chip.appendChild(thumb);
              if (opt && opt.entry) loadReferenceListThumbnail('civilizations', opt.entry, thumb);
              const text = document.createElement('span');
              text.textContent = String(opt.label || opt.value);
              chip.appendChild(text);
              const civIdx = Number.parseInt(String(opt.value || ''), 10);
              if (!tab.readOnly) {
                chip.draggable = true;
                chip.addEventListener('dragstart', (ev) => {
                  if (!ev.dataTransfer) return;
                  ev.dataTransfer.effectAllowed = 'move';
                  ev.dataTransfer.setData('text/plain', String(civIdx));
                });
              } else {
                chip.disabled = true;
              }
              body.appendChild(chip);
            });
          }
          col.appendChild(body);
          return col;
        };
        board.appendChild(makeColumn('No Alliances', -1));
        for (let allianceIdx = 0; allianceIdx < 4; allianceIdx += 1) {
          const label = allianceNameByIndex[allianceIdx] || `Alliance ${allianceIdx + 1}`;
          board.appendChild(makeColumn(label, allianceIdx));
        }
        boardCard.appendChild(board);
        for (let allianceIdx = 0; allianceIdx < 4; allianceIdx += 1) {
          const warFields = fields.filter((field) => {
            const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
            return new RegExp(`^alliance${allianceIdx}_is_at_war_with_alliance\\d+_\\d+$`).test(base);
          });
          if (warFields.length === 0) continue;
          const warRow = document.createElement('div');
          warRow.className = 'rule-row';
          const label = document.createElement('label');
          label.className = 'field-meta';
          label.textContent = `${allianceNameByIndex[allianceIdx] || `Alliance ${allianceIdx + 1}`} At War With`;
          warRow.appendChild(label);
          const controlWrap = document.createElement('div');
          controlWrap.className = 'rule-control';
          const options = [];
          const selectedVals = [];
          warFields.forEach((f) => {
            const base = String(f.baseKey || f.key || '').toLowerCase();
            const m = base.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_\d+$/);
            if (!m) return;
            const enemyIdx = Number.parseInt(m[2], 10);
            if (!Number.isFinite(enemyIdx) || enemyIdx === allianceIdx) return;
            options.push({
              value: String(enemyIdx),
              label: allianceNameByIndex[enemyIdx] || `Alliance ${enemyIdx + 1}`
            });
            if (boolish(f.value)) selectedVals.push(String(enemyIdx));
          });
          if (!tab.readOnly) {
            const editor = makeNamedListPickerEditor({
              tabKey: 'scenarioSettings',
              options,
              values: selectedVals,
              onValuesChange: (nextValues) => {
                rememberUndoSnapshot();
                const nextSet = new Set((Array.isArray(nextValues) ? nextValues : []).map((v) => String(v)));
                warFields.forEach((f) => {
                  const base = String(f.baseKey || f.key || '').toLowerCase();
                  const m = base.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_\d+$/);
                  if (!m) return;
                  const enemyIdx = String(Number.parseInt(m[2], 10));
                  f.value = nextSet.has(enemyIdx) ? 'true' : 'false';
                });
                setDirty(true);
              }
            });
            controlWrap.appendChild(editor);
          } else {
            const labels = options
              .filter((opt) => selectedVals.includes(String(opt.value)))
              .map((opt) => String(opt.label || opt.value));
            const text = document.createElement('div');
            text.className = 'field-meta';
            text.textContent = labels.length ? labels.join(', ') : '(none)';
            controlWrap.appendChild(text);
          }
          warRow.appendChild(controlWrap);
          boardCard.appendChild(warRow);
        }
        rows.appendChild(boardCard);
      }
      for (const [groupName, groupFields] of groupedEntries) {
        const groupCard = document.createElement('div');
        groupCard.className = 'rule-group-card';
        const groupTitle = document.createElement('div');
        groupTitle.className = 'rule-group-title';
        groupTitle.textContent = groupName;
        groupCard.appendChild(groupTitle);
        const timeProgressionModel = selected.code === 'GAME'
          ? extractTimeProgressionModel(groupFields)
          : null;
        const consumedTimeFields = timeProgressionModel && timeProgressionModel.consumedFields
          ? timeProgressionModel.consumedFields
          : new Set();
        let refreshTimeProgressionYearRanges = null;
        const consumedSpecialFields = new Set();
        const consumedRichFields = new Set();
        if (selected.code === 'GAME') {
          groupFields.forEach((field) => {
            const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
            if (/^alliance\d+$/.test(base)) consumedSpecialFields.add(field);
          });
        }
        if (selected.code === 'GAME' && groupName === 'Scenario') {
          const titleField = groupFields.find((field) => String(field && (field.baseKey || field.key) || '').toLowerCase() === 'title');
          const descriptionField = groupFields.find((field) => String(field && (field.baseKey || field.key) || '').toLowerCase() === 'description');
          const richFields = [titleField, descriptionField].filter(Boolean);
          richFields.forEach((field) => {
            const base = String(field.baseKey || field.key || '').toLowerCase();
            consumedRichFields.add(field);
            const biqFieldKey = String(field.baseKey || field.key || '');
            const block = createBiqTextEditorBlock({
              editorKey: `BIQ:${selectionKey}:${selected.code}:${record.index}:${base}`,
              titleText: base === 'title' ? 'Title' : 'Description',
              sourceInfo: withFieldHelp(
                `Source: BIQ\nFile: ${compactPathFromCiv3Root(tab.sourcePath || '') || '(not available)'}\nSection: ${selected.title || selected.code}\nSection Code: ${selected.code}\nField: ${biqFieldKey}\nRecord: ${record.index + 1}`,
                { sectionCode: selected.code, fieldKey: biqFieldKey }
              ),
              value: field.value,
              multiline: base === 'description',
              emptyText: base === 'title' ? '(empty title)' : '(empty description)',
              editable: isScenarioMode() && !tab.readOnly,
              onChange: (nextValue) => {
                rememberUndoSnapshot();
                field.value = String(nextValue || '');
                setDirty(true);
              }
            });
            groupCard.appendChild(block);
          });
        }

        if (selected.code === 'GAME' && groupName === 'Player Options') {
          const actionsRow = document.createElement('div');
          actionsRow.className = 'rule-row';
          const actionsLabel = document.createElement('label');
          actionsLabel.className = 'field-meta';
          actionsLabel.textContent = 'Playable Civilizations';
          actionsRow.appendChild(actionsLabel);
          const actionsWrap = document.createElement('div');
          actionsWrap.className = 'rule-control';
          const playableFields = getGamePlayableCivFields(record);
          const countBadge = document.createElement('div');
          countBadge.className = 'field-meta';
          countBadge.textContent = `${playableFields.length} slots`;
          actionsWrap.appendChild(countBadge);
          if (!tab.readOnly) {
            const actionBtns = document.createElement('div');
            actionBtns.className = 'reference-entity-actions';
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'ghost action-add';
            addBtn.textContent = '＋ Add Slot';
            addBtn.addEventListener('click', () => {
              rememberUndoSnapshot();
              const allFields = Array.isArray(record.fields) ? record.fields : [];
              const currentPlayable = getGamePlayableCivFields(record);
              const lastPlayable = currentPlayable[currentPlayable.length - 1] || null;
              const newField = lastPlayable
                ? { ...lastPlayable, value: String(lastPlayable.value || '0'), originalValue: String(lastPlayable.originalValue || '') }
                : {
                  key: 'playable_civ',
                  baseKey: 'playable_civ',
                  label: 'Playable Civ',
                  value: '0',
                  originalValue: ''
                };
              const raceOptions = makeBiqSectionIndexOptions('RACE', false);
              const used = new Set(currentPlayable
                .map((f) => parseIntFromDisplayValue(f.value))
                .filter((n) => Number.isFinite(n)));
              const nextOpt = raceOptions.find((opt) => {
                const idx = Number.parseInt(String(opt && opt.value || ''), 10);
                return Number.isFinite(idx) && !used.has(idx);
              });
              if (nextOpt) newField.value = String(nextOpt.value);
              allFields.push(newField);
              record.fields = allFields;
              const count = syncNumberOfPlayableCivsField(record);
              syncLeadRecordCountToTarget(count);
              setDirty(true);
              setStatus('Added playable civilization slot.');
              renderActiveTab({ preserveTabScroll: true });
            });
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'ghost action-delete';
            removeBtn.textContent = '🗑 Remove Slot';
            removeBtn.disabled = playableFields.length <= 1;
            removeBtn.addEventListener('click', () => {
              const allFields = Array.isArray(record.fields) ? record.fields : [];
              let lastIdx = -1;
              for (let i = allFields.length - 1; i >= 0; i -= 1) {
                const base = String(allFields[i] && (allFields[i].baseKey || allFields[i].key) || '').toLowerCase();
                if (base === 'playable_civ') {
                  lastIdx = i;
                  break;
                }
              }
              if (lastIdx < 0) return;
              rememberUndoSnapshot();
              allFields.splice(lastIdx, 1);
              const count = syncNumberOfPlayableCivsField(record);
              syncLeadRecordCountToTarget(count);
              setDirty(true);
              setStatus('Removed playable civilization slot.');
              renderActiveTab({ preserveTabScroll: true });
            });
            actionBtns.appendChild(addBtn);
            actionBtns.appendChild(removeBtn);
            actionsWrap.appendChild(actionBtns);
          }
          actionsRow.appendChild(actionsWrap);
          groupCard.appendChild(actionsRow);
        }

        if (selected.code === 'GAME' && /^Alliance \d+$/.test(groupName)) {
          const allianceNum = Number.parseInt(groupName.replace('Alliance ', ''), 10);
          const allianceIdx = Number.isFinite(allianceNum) ? allianceNum - 1 : -1;
          if (allianceIdx >= 0) {
            const memberFields = groupFields.filter((field) => {
              const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
              return new RegExp(`^alliance${allianceIdx}_member_\\d+$`).test(base);
            });
            const warFields = groupFields.filter((field) => {
              const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
              return new RegExp(`^alliance${allianceIdx}_is_at_war_with_alliance\\d+_\\d+$`).test(base);
            });
            const boolish = (value) => {
              const raw = String(value || '').trim().toLowerCase();
              return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
            };
            memberFields.forEach((f) => consumedSpecialFields.add(f));

            if (warFields.length > 0) {
              const row = document.createElement('div');
              row.className = 'rule-row';
              const label = document.createElement('label');
              label.className = 'field-meta';
              label.textContent = 'At war with';
              row.appendChild(label);
              const controlWrap = document.createElement('div');
              controlWrap.className = 'rule-control';
              const options = [];
              const selectedVals = [];
              warFields.forEach((f) => {
                const base = String(f.baseKey || f.key || '').toLowerCase();
                const m = base.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_\d+$/);
                if (!m) return;
                const enemyIdx = Number.parseInt(m[2], 10);
                if (!Number.isFinite(enemyIdx) || enemyIdx === allianceIdx) return;
                options.push({
                  value: String(enemyIdx),
                  label: allianceNameByIndex[enemyIdx] || `Alliance ${enemyIdx + 1}`
                });
                if (boolish(f.value)) selectedVals.push(String(enemyIdx));
              });
              if (!tab.readOnly) {
                const editor = makeNamedListPickerEditor({
                  tabKey: 'scenarioSettings',
                  options,
                  values: selectedVals,
                  onValuesChange: (nextValues) => {
                    rememberUndoSnapshot();
                    const nextSet = new Set((Array.isArray(nextValues) ? nextValues : []).map((v) => String(v)));
                    warFields.forEach((f) => {
                      const base = String(f.baseKey || f.key || '').toLowerCase();
                      const m = base.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_\d+$/);
                      if (!m) return;
                      const enemyIdx = String(Number.parseInt(m[2], 10));
                      f.value = nextSet.has(enemyIdx) ? 'true' : 'false';
                    });
                    setDirty(true);
                  }
                });
                controlWrap.appendChild(editor);
              } else {
                const labels = options
                  .filter((opt) => selectedVals.includes(String(opt.value)))
                  .map((opt) => String(opt.label || opt.value));
                const text = document.createElement('div');
                text.className = 'field-meta';
                text.textContent = labels.length ? labels.join(', ') : '(none)';
                controlWrap.appendChild(text);
              }
              row.appendChild(controlWrap);
              groupCard.appendChild(row);
              warFields.forEach((f) => consumedSpecialFields.add(f));
            }
          }
        }
        if (timeProgressionModel && Array.isArray(timeProgressionModel.rows) && timeProgressionModel.rows.length > 0) {
          const tableRow = document.createElement('div');
          tableRow.className = 'rule-row';
          const tableLabel = document.createElement('label');
          tableLabel.className = 'field-meta';
          tableLabel.textContent = 'Time Progression';
          attachRichTooltip(
            tableLabel,
            `Source: BIQ\nFile: ${compactPathFromCiv3Root(tab.sourcePath || '') || '(not available)'}\nSection: ${selected.title || selected.code}\nSection Code: ${selected.code}\nField: Time progression`
          );
          tableRow.appendChild(tableLabel);

          const tableWrap = document.createElement('div');
          tableWrap.className = 'rule-control';
          const table = document.createElement('table');
          table.className = 'time-progression-table';
          const thead = document.createElement('thead');
          const headRow = document.createElement('tr');
          ['Section', 'Turns', 'Time / Turn', 'Year Range'].forEach((title) => {
            const th = document.createElement('th');
            th.textContent = title;
            headRow.appendChild(th);
          });
          thead.appendChild(headRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          const editable = !tab.readOnly;
          const rangeCells = [];
          const refreshYearRangeCells = () => {
            const ranges = getTimeProgressionYearRanges(timeProgressionModel.rows, getBiqRecordFieldValueByBaseKey(record, 'startyear'));
            rangeCells.forEach((cell, rowIdx) => {
              cell.textContent = String(ranges[rowIdx] || '(unknown)');
            });
          };
          refreshTimeProgressionYearRanges = refreshYearRangeCells;
          timeProgressionModel.rows.forEach((timeRow, idx) => {
            const tr = document.createElement('tr');
            const secTd = document.createElement('td');
            secTd.textContent = 'Next';
            tr.appendChild(secTd);
            const turnsTd = document.createElement('td');
            const perTurnTd = document.createElement('td');
            const rangeTd = document.createElement('td');
            rangeTd.className = 'field-meta';
            rangeCells.push(rangeTd);
            if (editable) {
              const turnsInput = document.createElement('input');
              turnsInput.type = 'number';
              turnsInput.value = String(timeRow.turnsValue || '');
              turnsInput.addEventListener('input', () => {
                rememberUndoSnapshot();
                timeRow.turnsValue = turnsInput.value;
                if (timeProgressionModel.mode === 'split') {
                  if (timeRow.turnsField) timeRow.turnsField.value = turnsInput.value;
                } else if (timeProgressionModel.turnsCsvField) {
                  timeProgressionModel.turnsCsvField.value = serializeTimeProgressionList(timeProgressionModel.rows, 'turnsValue');
                }
                setDirty(true);
                refreshYearRangeCells();
              });
              turnsTd.appendChild(turnsInput);

              const perInput = document.createElement('input');
              perInput.type = 'number';
              perInput.value = String(timeRow.perTurnValue || '');
              perInput.addEventListener('input', () => {
                rememberUndoSnapshot();
                timeRow.perTurnValue = perInput.value;
                if (timeProgressionModel.mode === 'split') {
                  if (timeRow.perTurnField) timeRow.perTurnField.value = perInput.value;
                } else if (timeProgressionModel.perTurnCsvField) {
                  timeProgressionModel.perTurnCsvField.value = serializeTimeProgressionList(timeProgressionModel.rows, 'perTurnValue');
                }
                setDirty(true);
                refreshYearRangeCells();
              });
              perTurnTd.appendChild(perInput);
            } else {
              turnsTd.textContent = String(timeRow.turnsValue || '(none)');
              perTurnTd.textContent = String(timeRow.perTurnValue || '(none)');
            }
            tr.appendChild(turnsTd);
            tr.appendChild(perTurnTd);
            tr.appendChild(rangeTd);
            tbody.appendChild(tr);
          });
          refreshYearRangeCells();
          table.appendChild(tbody);
          tableWrap.appendChild(table);
          tableRow.appendChild(tableWrap);
          groupCard.appendChild(tableRow);
        }
        groupFields.forEach((field, fieldIdx) => {
          if (consumedRichFields.has(field)) return;
          if (consumedTimeFields.has(field)) return;
          if (consumedSpecialFields.has(field)) return;
          const row = document.createElement('div');
          row.className = 'rule-row';
          const label = document.createElement('label');
          label.className = 'field-meta';
          const baseKeyRaw = String(field.baseKey || field.key || '').toLowerCase();
          let displayLabel = String(field.label || field.key);
          if (selected.code === 'GAME' && baseKeyRaw === 'playable_civ') {
            const playableIdx = groupFields
              .slice(0, fieldIdx + 1)
              .filter((f) => String(f.baseKey || f.key || '').toLowerCase() === 'playable_civ')
              .length;
            displayLabel = `Playable Civilization ${playableIdx}`;
          } else if (selected.code === 'LEAD' && /^starting_units_of_type_/.test(baseKeyRaw)) {
            const unitName = baseKeyRaw
              .replace(/^starting_units_of_type_/, '')
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (m) => m.toUpperCase());
            displayLabel = unitName ? `${unitName} Units` : displayLabel;
          } else if (selected.code === 'LEAD' && /^starting_technology_\d+$/.test(baseKeyRaw)) {
            const techIdx = Number.parseInt(baseKeyRaw.replace(/^starting_technology_/, ''), 10);
            if (Number.isFinite(techIdx)) displayLabel = `Free Technology ${techIdx + 1}`;
          }
          label.textContent = displayLabel;
          const biqFieldKey = String(field.baseKey || field.key || '');
          const lockNote = (selected.code === 'GAME' && isLockedGameField(baseKeyRaw))
            ? '\nLock: Managed by Add/Copy Scenario. Editing is locked to prevent broken search paths.'
            : '';
          attachRichTooltip(
            label,
            withFieldHelp(
              `Source: BIQ\nFile: ${compactPathFromCiv3Root(tab.sourcePath || '') || '(not available)'}\nSection: ${selected.title || selected.code}\nSection Code: ${selected.code}\nField: ${biqFieldKey}\nRecord: ${record.index + 1}${lockNote}`,
              { sectionCode: selected.code, fieldKey: biqFieldKey }
            )
          );
          row.appendChild(label);

          const controlWrap = document.createElement('div');
          controlWrap.className = 'rule-control';
          const editable = !tab.readOnly;
          const baseKey = String(field.baseKey || field.key || '').toLowerCase();
          if (selected.code === 'TERR' && baseKey === '__terrain_possible_resources') {
            const options = getTerrainResourceOptions();
            const currentMask = getTerrainResourceMask(record);
            const selectedValues = options
              .filter((opt) => {
                const idx = Number.parseInt(String(opt.value || ''), 10);
                return Number.isFinite(idx) && currentMask[idx] === 1;
              })
              .map((opt) => String(opt.value));
            if (editable) {
              const editor = makeNamedListPickerEditor({
                tabKey: 'resources',
                options,
                values: selectedValues,
                onValuesChange: (nextValues) => {
                  rememberUndoSnapshot();
                  const nextSet = new Set((Array.isArray(nextValues) ? nextValues : []).map((v) => String(v)));
                  const maxOptionIndex = options.reduce((max, opt) => {
                    const idx = Number.parseInt(String(opt.value || ''), 10);
                    return Number.isFinite(idx) ? Math.max(max, idx) : max;
                  }, -1);
                  const nextMask = getTerrainResourceMask(record).slice();
                  const targetLen = Math.max(nextMask.length, maxOptionIndex + 1);
                  while (nextMask.length < targetLen) nextMask.push(0);
                  options.forEach((opt) => {
                    const idx = Number.parseInt(String(opt.value || ''), 10);
                    if (!Number.isFinite(idx) || idx < 0) return;
                    nextMask[idx] = nextSet.has(String(opt.value)) ? 1 : 0;
                  });
                  const maskField = ensureTerrainResourceMaskField(record);
                  if (maskField) maskField.value = nextMask.join(',');
                  setDirty(true);
                }
              });
              controlWrap.appendChild(editor);
            } else {
              const selectedLabels = options
                .filter((opt) => selectedValues.includes(String(opt.value)))
                .map((opt) => String(opt.label || opt.value));
              const text = document.createElement('div');
              text.className = 'field-meta';
              text.textContent = selectedLabels.length ? selectedLabels.join(', ') : '(none)';
              controlWrap.appendChild(text);
            }
            row.appendChild(controlWrap);
            groupCard.appendChild(row);
            return;
          }
          if (selected.code === 'GAME' && isLockedGameField(baseKey)) {
            const locked = document.createElement('div');
            locked.className = 'key-display-chip';
            locked.textContent = String(field.value || '(none)');
            controlWrap.appendChild(locked);
            row.appendChild(controlWrap);
            groupCard.appendChild(row);
            return;
          }
          const refSpec = getBiqStructureRefSpec(selected.code, baseKey);
          let refOptions = refSpec ? makeBiqSectionIndexOptions(refSpec.section, !!refSpec.oneBased) : [];
          if (selected.code === 'LEAD' && baseKey === 'civ') {
            const playable = getPlayableCivilizationIdSet();
            if (playable.size > 0) {
              refOptions = refOptions.filter((opt) => {
                const idx = Number.parseInt(String(opt && opt.value || ''), 10);
                return Number.isFinite(idx) && playable.has(idx);
              });
            }
          }
          const refTargetTabKey = refSpec ? (BIQ_SECTION_TO_REFERENCE_TAB[String(refSpec.section || '').toUpperCase()] || '') : '';
          const parsed = parseIntFromDisplayValue(field.value);
          const rawText = String(field.value || '').trim();
          const looksNumeric = parsed != null && !/[A-Za-z]/.test(rawText.replace(/\(-?\d+\)\s*$/, ''));
          const boolRaw = rawText.toLowerCase();
          const looksBoolean = boolRaw === 'true' || boolRaw === 'false';
          const spec = getBiqStructureFieldSpec(selected.code, field) || {};
          const desiredControl = spec.control || '';
          const enumOptions = getEnumOptionsForBiqStructureTab(activeTabKey, field);
          const useColorSlotPicker = selected.code === 'LEAD' && baseKey === 'color';

          if (editable) {
            if (useColorSlotPicker) {
              const colorPicker = createColorSlotPicker({
                currentValue: field.value,
                max: 31,
                onSelect: (value) => {
                  rememberUndoSnapshot();
                  field.value = String(value);
                  setDirty(true);
                }
              });
              controlWrap.appendChild(colorPicker);
            } else if (refOptions.length > 0) {
              const picker = createReferencePicker({
                options: refOptions,
                targetTabKey: refTargetTabKey,
                currentValue: parsed == null ? '-1' : String(parsed),
                searchPlaceholder: `Search ${String(refSpec.section || '').toUpperCase()}...`,
                noneLabel: '(none)',
                onSelect: (value) => {
                  rememberUndoSnapshot();
                  field.value = String(value);
                  if (selected.code === 'LEAD' && baseKey === 'civ') {
                    const listItem = listPane.querySelector(`.entry-list-item[data-index="${selectedRecordIndex}"]`);
                    const thumbHost = listItem ? listItem.querySelector('.entry-thumb') : null;
                    if (thumbHost) {
                      thumbHost.innerHTML = '';
                      const civEntry = getLeadRecordCivEntry(record);
                      if (civEntry) loadReferenceListThumbnail('civilizations', civEntry, thumbHost);
                    }
                  }
                  setDirty(true);
                }
              });
              controlWrap.appendChild(picker);
            } else if (desiredControl === 'select' || enumOptions.length > 0) {
              const select = document.createElement('select');
              const hasNone = enumOptions.some((opt) => String(opt.value) === '-1');
              if (!hasNone) {
                const empty = document.createElement('option');
                empty.value = '-1';
                empty.textContent = '(none)';
                select.appendChild(empty);
              }
              enumOptions.forEach((opt) => {
                const o = document.createElement('option');
                o.value = String(opt.value);
                o.textContent = String(opt.label || opt.value);
                select.appendChild(o);
              });
              const selectValue = parsed == null ? String(field.value || '') : String(parsed);
              select.value = selectValue;
              select.addEventListener('change', () => {
                rememberUndoSnapshot();
                field.value = String(select.value);
                setDirty(true);
              });
              controlWrap.appendChild(select);
            } else if (desiredControl === 'mission_performed_by') {
              const parsedMission = parseEspionageMissionPerformedBy(field.value);
              const missionWrap = document.createElement('div');
              missionWrap.className = 'field-checkbox-list';
              const diplomatLabel = document.createElement('label');
              diplomatLabel.className = 'bool-toggle';
              const diplomatCheck = document.createElement('input');
              diplomatCheck.type = 'checkbox';
              diplomatCheck.checked = parsedMission.diplomats;
              const diplomatText = document.createElement('span');
              diplomatText.textContent = 'Diplomat';
              diplomatLabel.appendChild(diplomatCheck);
              diplomatLabel.appendChild(diplomatText);
              missionWrap.appendChild(diplomatLabel);
              const spyLabel = document.createElement('label');
              spyLabel.className = 'bool-toggle';
              const spyCheck = document.createElement('input');
              spyCheck.type = 'checkbox';
              spyCheck.checked = parsedMission.spies;
              const spyText = document.createElement('span');
              spyText.textContent = 'Spy';
              spyLabel.appendChild(spyCheck);
              spyLabel.appendChild(spyText);
              missionWrap.appendChild(spyLabel);
              const persistMissionValue = () => {
                rememberUndoSnapshot();
                const nextMask = (diplomatCheck.checked ? 1 : 0) + (spyCheck.checked ? 2 : 0);
                field.value = String(nextMask);
                setDirty(true);
              };
              diplomatCheck.addEventListener('change', persistMissionValue);
              spyCheck.addEventListener('change', persistMissionValue);
              controlWrap.appendChild(missionWrap);
            } else if (desiredControl === 'bool' || looksBoolean) {
              const toggle = document.createElement('label');
              toggle.className = 'bool-toggle';
              const check = document.createElement('input');
              check.type = 'checkbox';
              check.checked = boolRaw === 'true' || rawText === '1';
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
              enableBooleanRowToggle(row, check);
            } else if (desiredControl === 'number' || looksNumeric) {
              const input = document.createElement('input');
              input.type = 'number';
              if (Number.isFinite(spec.min)) input.min = String(spec.min);
              if (Number.isFinite(spec.max)) input.max = String(spec.max);
              input.value = parsed == null ? '' : String(parsed);
              input.addEventListener('input', () => {
                rememberUndoSnapshot();
                field.value = input.value;
                setDirty(true);
                if (selected.code === 'GAME' && baseKey === 'startyear' && typeof refreshTimeProgressionYearRanges === 'function') {
                  refreshTimeProgressionYearRanges();
                }
              });
              if (selected.code === 'GAME' && baseKey === 'numberofplayablecivs') {
                input.addEventListener('change', () => {
                  rememberUndoSnapshot();
                  const changed = syncLeadRecordCountToTarget(input.value);
                  if (changed) {
                    setDirty(true);
                    setStatus('Player list count synced to Number of Players.');
                  }
                });
              }
              controlWrap.appendChild(input);
            } else if (selected.code === 'GAME' && baseKey === 'description') {
              const input = document.createElement('textarea');
              input.value = String(field.value || '');
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
                maybeSyncRecordNameFromField(field, input.value);
                setDirty(true);
              });
              controlWrap.appendChild(input);
            }
          } else {
            const text = document.createElement('div');
            text.className = 'field-meta';
            if (desiredControl === 'mission_performed_by') text.textContent = formatEspionageMissionPerformedBy(field.value);
            else text.textContent = String(field.value || '(none)');
            controlWrap.appendChild(text);
          }

          row.appendChild(controlWrap);
          groupCard.appendChild(row);
        });
        rows.appendChild(groupCard);
      }
      textCol.appendChild(rows);
      buildBiqRecordSectionNav({
        tabKey: tab.key || state.activeTab || 'biq',
        sectionCode: selected.code,
        rowsRoot: rows,
        navHost: navCol
      });
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
  const card = document.createElement('div');
  card.className = 'section-card';
  const top = document.createElement('div');
  top.className = 'section-top';
  top.innerHTML = '<strong>Map Editor</strong><span class="hint">Opens in modal</span>';
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'secondary';
  openBtn.textContent = 'Open Map';
  openBtn.addEventListener('click', () => {
    openMapModal({ tab, tileSection, title: `${tab.title || 'Map'} Editor` });
  });
  top.appendChild(openBtn);
  card.appendChild(top);
  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent = 'Map editing now uses a full-screen modal for navigation and editing.';
  card.appendChild(note);
  wrap.appendChild(card);
  window.requestAnimationFrame(() => {
    openMapModal({ tab, tileSection, title: `${tab.title || 'Map'} Editor` });
  });
  return wrap;
}

function getFieldByBaseKey(record, baseKey) {
  if (!record || !Array.isArray(record.fields)) return null;
  const toCanonical = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetRaw = String(baseKey || '').trim().toLowerCase();
  const targetCanon = toCanonical(baseKey);
  return record.fields.find((f) => {
    const keyRaw = String(f && (f.baseKey || f.key) || '').trim().toLowerCase();
    if (keyRaw === targetRaw) return true;
    return toCanonical(keyRaw) === targetCanon;
  }) || null;
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

function getMapFieldValue(record, key, fallback = '') {
  if (mapCore && typeof mapCore.getField === 'function') {
    const field = mapCore.getField(record, key);
    if (field) return String(field.value || '');
  }
  const field = getFieldByBaseKey(record, key);
  if (!field) return String(fallback);
  return String(field.value || '');
}

function setMapFieldValue(record, key, value, label = '') {
  if (!record) return false;
  if (mapCore && typeof mapCore.setField === 'function') {
    mapCore.setField(record, key, value, label || toFriendlyKey(key));
    return true;
  }
  if (!Array.isArray(record.fields)) record.fields = [];
  const existing = getFieldByBaseKey(record, key);
  if (existing) {
    existing.value = String(value == null ? '' : value);
    return true;
  }
  record.fields.push({
    key: String(key || ''),
    baseKey: String(key || ''),
    label: String(label || toFriendlyKey(key)),
    value: String(value == null ? '' : value),
    originalValue: ''
  });
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

function colorFromCivSlot(slot, fallback = null) {
  const idx = ((Number(slot) % 32) + 32) % 32;
  const cached = state.biqMapNtpColorCache && state.biqMapNtpColorCache[idx];
  if (cached) return cached;
  const canvas = state.biqMapArtCache && state.biqMapArtCache[`ntp-${idx}`];
  if (canvas && typeof canvas.getContext === 'function') {
    try {
      const ctx = canvas.getContext('2d');
      const px = ctx.getImageData(0, 0, 1, 1).data;
      const css = `rgb(${px[0]}, ${px[1]}, ${px[2]})`;
      state.biqMapNtpColorCache[idx] = css;
      return css;
    } catch (_err) {
      // fall back below
    }
  }
  if (fallback) return fallback;
  return colorFromNumber(idx);
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

function requestBiqMapArtAsset(assetKey, assetPath, previewOptions = null) {
  if (!state.settings || !state.settings.civ3Path) return;
  if (state.biqMapArtCache[assetKey] || state.biqMapArtLoading[assetKey]) return;
  state.biqMapArtLoading[assetKey] = true;
  appendDebugLog('biq-map:asset-load-start', { assetKey, assetPath });
  window.c3xManager.getPreview({
    kind: 'civilopediaIcon',
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    scenarioPaths: getScenarioPreviewPaths(),
    assetPath,
    options: previewOptions || undefined
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
      const mapOverlay = ensureMapModalNode();
      if (mapModal.tab && mapModal.tileSection && !mapOverlay.classList.contains('hidden')) {
        renderMapModalBody();
        return;
      }
      if (!state.bundle || !state.bundle.tabs || !state.bundle.tabs[state.activeTab] || state.bundle.tabs[state.activeTab].type !== 'map') {
        return;
      }
      renderActiveTab({ preserveTabScroll: true });
    });
  });
}

function renderBiqMapSection(tab, tileSection, options = {}) {
  const container = document.createElement('div');
  container.className = 'biq-map-layout';
  const floatingUi = !!(options && options.inModal);
  if (floatingUi) container.classList.add('floating-ui');
  appendDebugLog('biq-map:open', { sectionId: tileSection && tileSection.id, sourcePath: tab && tab.sourcePath });
  const rerenderMapView = () => {
    if (options && options.inModal) {
      renderMapModalBody();
      return;
    }
    renderActiveTab({ preserveTabScroll: true });
  };

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
  const clampZoom = (z) => {
    const raw = Math.max(BIQ_MAP_ZOOM_MIN, Math.min(BIQ_MAP_ZOOM_MAX, Number(z) || state.biqMapZoom || 6));
    let best = BIQ_MAP_ZOOM_LEVELS[0];
    let bestDist = Math.abs(raw - best);
    for (let i = 1; i < BIQ_MAP_ZOOM_LEVELS.length; i += 1) {
      const candidate = BIQ_MAP_ZOOM_LEVELS[i];
      const dist = Math.abs(raw - candidate);
      if (dist < bestDist) {
        best = candidate;
        bestDist = dist;
      }
    }
    return best;
  };
  const stepZoomLevel = (currentZoom, direction) => {
    const current = clampZoom(currentZoom);
    const idx = BIQ_MAP_ZOOM_LEVELS.indexOf(current);
    const safeIdx = idx >= 0 ? idx : 0;
    if (direction > 0) {
      return BIQ_MAP_ZOOM_LEVELS[Math.min(BIQ_MAP_ZOOM_LEVELS.length - 1, safeIdx + 1)];
    }
    return BIQ_MAP_ZOOM_LEVELS[Math.max(0, safeIdx - 1)];
  };

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
    rerenderMapView();
  });
  layerLabel.appendChild(layerSelect);
  const layerIconByValue = {
    terrain: { glyph: '🗺', tone: 'natural' },
    resource: { glyph: '💎', tone: 'resource' },
    owner: { glyph: '👑', tone: 'civ' },
    continent: { glyph: '🌍', tone: 'world' }
  };
  attachMapSelectIcon(layerLabel, layerSelect, (value) => {
    const spec = layerIconByValue[value] || { glyph: '•', tone: 'neutral' };
    return makeMapGlyphIcon(spec.glyph, `Layer: ${value}`, spec.tone);
  });
  controls.appendChild(layerLabel);

  const gridWrap = document.createElement('label');
  gridWrap.className = 'bool-toggle';
  const grid = document.createElement('input');
  grid.type = 'checkbox';
  grid.checked = !!state.biqMapShowGrid;
  grid.addEventListener('change', () => {
    state.biqMapShowGrid = grid.checked;
    appendDebugLog('biq-map:grid-toggle', { enabled: state.biqMapShowGrid });
    rerenderMapView();
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
    rerenderMapView();
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
    rerenderMapView();
  });
  const namesText = document.createElement('span');
  namesText.textContent = 'City Names';
  namesWrap.appendChild(names);
  namesWrap.appendChild(namesText);
  controls.appendChild(namesWrap);

  const hint = document.createElement('span');
  hint.className = 'hint';
  hint.textContent = isScenarioMode()
    ? 'Wheel to zoom. Drag to pan. Shortcuts: S/T/O/F/D/C/U tools, 1/3/5/7 brush, +/- zoom.'
    : 'Wheel to zoom. Standard Game BIQ is read-only.';
  controls.appendChild(hint);

  if (!floatingUi) container.appendChild(controls);

  const tool = state.mapEditorTool || (state.mapEditorTool = {});
  if (!tool.mode) tool.mode = 'select';
  if (!Number.isFinite(Number(tool.diameter))) tool.diameter = 1;
  if (!Number.isFinite(Number(tool.terrainCode))) tool.terrainCode = 0;
  if (!tool.overlayType) tool.overlayType = 'road';
  if (!tool.fogMode) tool.fogMode = 'add';
  if (!Number.isFinite(Number(tool.districtType))) tool.districtType = 0;
  if (!Number.isFinite(Number(tool.districtState))) tool.districtState = 1;
  if (!Number.isFinite(Number(tool.ownerType))) tool.ownerType = 1;
  if (!Number.isFinite(Number(tool.owner))) tool.owner = 0;
  if (!Number.isFinite(Number(tool.unitType))) tool.unitType = 0;

  function makeMapGlyphIcon(glyph, title = '', tone = '') {
    const icon = document.createElement('span');
    icon.className = 'map-select-icon map-select-icon-glyph';
    if (tone) icon.dataset.tone = tone;
    icon.textContent = glyph || '•';
    if (title) icon.title = title;
    return icon;
  }
  function makeMapColorIcon(seed, title = '') {
    const icon = document.createElement('span');
    icon.className = 'map-select-icon map-select-icon-color';
    icon.style.background = colorFromNumber(seed);
    if (title) icon.title = title;
    return icon;
  }
  function makeMapAtlasSpriteIcon(assetKey, spriteW, spriteH, spriteIndex, title = '') {
    const holder = document.createElement('span');
    holder.className = 'map-select-icon map-select-icon-atlas';
    if (title) holder.title = title;
    const atlas = state.biqMapArtCache && state.biqMapArtCache[assetKey];
    if (!atlas || !Number.isFinite(spriteIndex) || spriteIndex < 0) {
      holder.appendChild(makeMapGlyphIcon('?', title || '', 'neutral'));
      return holder;
    }
    const cols = Math.max(1, Math.floor(atlas.width / spriteW));
    const row = Math.floor(spriteIndex / cols);
    const col = spriteIndex % cols;
    const sx = col * spriteW;
    const sy = row * spriteH;
    if (sx + spriteW > atlas.width || sy + spriteH > atlas.height) {
      holder.appendChild(makeMapGlyphIcon('?', title || '', 'neutral'));
      return holder;
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'entry-thumb-canvas';
    canvas.width = 14;
    canvas.height = 14;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(atlas, sx, sy, spriteW, spriteH, 0, 0, canvas.width, canvas.height);
    }
    holder.innerHTML = '';
    holder.appendChild(canvas);
    return holder;
  }
  function attachMapSelectIcon(labelWrap, select, iconRenderer) {
    if (!labelWrap || !select || typeof iconRenderer !== 'function') return;
    const iconHost = document.createElement('span');
    iconHost.className = 'map-select-icon-host';
    const refresh = () => {
      iconHost.innerHTML = '';
      const iconNode = iconRenderer(String(select.value || '')) || makeMapGlyphIcon('•');
      iconHost.appendChild(iconNode);
    };
    if (select.parentNode === labelWrap) {
      labelWrap.insertBefore(iconHost, select);
    } else {
      labelWrap.appendChild(iconHost);
    }
    refresh();
    select.addEventListener('change', refresh);
  }

  const toolRow = document.createElement('div');
  toolRow.className = 'biq-map-toolbar map-tool-row';

  const modeWrap = document.createElement('label');
  modeWrap.className = 'hint';
  modeWrap.textContent = 'Tool';
  const modeSelect = document.createElement('select');
  [
    { value: 'select', label: 'Select' },
    { value: 'terrain', label: 'Terrain Paint' },
    { value: 'overlay', label: 'Overlay Paint' },
    { value: 'fog', label: 'Fog Paint' },
    { value: 'district', label: 'District Paint' },
    { value: 'city', label: 'City' },
    { value: 'unit', label: 'Unit' }
  ].forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    modeSelect.appendChild(o);
  });
  modeSelect.value = String(tool.mode || 'select');
  modeSelect.addEventListener('change', () => {
    state.mapEditorTool.mode = modeSelect.value;
    rerenderMapView();
  });
  modeWrap.appendChild(modeSelect);
  const toolIconByValue = {
    select: { glyph: '🖱', tone: 'neutral' },
    terrain: { glyph: '🗺', tone: 'natural' },
    overlay: { glyph: '🛠', tone: 'resource' },
    fog: { glyph: '🌫', tone: 'world' },
    district: { glyph: '🏙', tone: 'civ' },
    city: { glyph: '🏛', tone: 'civ' },
    unit: { glyph: '⚔', tone: 'resource' }
  };
  attachMapSelectIcon(modeWrap, modeSelect, (value) => {
    const spec = toolIconByValue[value] || { glyph: '•', tone: 'neutral' };
    return makeMapGlyphIcon(spec.glyph, `Tool: ${value}`, spec.tone);
  });
  toolRow.appendChild(modeWrap);

  const sizeWrap = document.createElement('label');
  sizeWrap.className = 'hint';
  sizeWrap.textContent = 'Brush';
  const sizeSelect = document.createElement('select');
  [1, 3, 5, 7].forEach((size) => {
    const o = document.createElement('option');
    o.value = String(size);
    o.textContent = `${size}x${size}`;
    sizeSelect.appendChild(o);
  });
  sizeSelect.value = String(Number(tool.diameter) || 1);
  sizeSelect.addEventListener('change', () => {
    state.mapEditorTool.diameter = parseIntLoose(sizeSelect.value, 1);
  });
  sizeWrap.appendChild(sizeSelect);
  toolRow.appendChild(sizeWrap);

  const terrainWrap = document.createElement('label');
  terrainWrap.className = 'hint';
  terrainWrap.textContent = 'Terrain';
  const terrainSelect = document.createElement('select');
  const terrainSectionForPicker = (tab.sections || []).find((s) => s.code === 'TERR');
  const terrainRecordsForPicker = terrainSectionForPicker && Array.isArray(terrainSectionForPicker.records) ? terrainSectionForPicker.records : [];
  terrainRecordsForPicker.forEach((record, idx) => {
    const o = document.createElement('option');
    o.value = String(idx);
    o.textContent = String(record && record.name || `Terrain ${idx}`);
    terrainSelect.appendChild(o);
  });
  terrainSelect.value = String(Number(tool.terrainCode) || 0);
  terrainSelect.addEventListener('change', () => {
    state.mapEditorTool.terrainCode = parseIntLoose(terrainSelect.value, 0);
  });
  terrainWrap.appendChild(terrainSelect);
  attachMapSelectIcon(terrainWrap, terrainSelect, (value) => {
    const idx = parseIntLoose(value, -1);
    const record = terrainRecordsForPicker[idx] || null;
    if (record) return makeTerrainOptionPreviewIcon(String(record.name || `Terrain ${idx}`));
    return makeMapGlyphIcon('🗺', 'Terrain', 'natural');
  });
  toolRow.appendChild(terrainWrap);

  const overlayWrap = document.createElement('label');
  overlayWrap.className = 'hint';
  overlayWrap.textContent = 'Overlay';
  const overlaySelect = document.createElement('select');
  [
    { value: 'road', label: 'Road' },
    { value: 'railroad', label: 'Railroad' },
    { value: 'mine', label: 'Mine' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'fort', label: 'Fort' },
    { value: 'barricade', label: 'Barricade' },
    { value: 'barbariancamp', label: 'Barbarian Camp' },
    { value: 'goodyhut', label: 'Goody Hut' },
    { value: 'pollution', label: 'Pollution' },
    { value: 'crater', label: 'Crater' },
    { value: 'airfield', label: 'Airfield' },
    { value: 'radartower', label: 'Radar Tower' },
    { value: 'outpost', label: 'Outpost' },
    { value: 'colony', label: 'Colony' },
    { value: 'victorypoint', label: 'Victory Point' },
    { value: 'ruins', label: 'Ruins' },
    { value: 'startinglocation', label: 'Starting Location' }
  ].forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    overlaySelect.appendChild(o);
  });
  overlaySelect.value = String(tool.overlayType || 'road');
  overlaySelect.addEventListener('change', () => {
    state.mapEditorTool.overlayType = overlaySelect.value;
  });
  overlayWrap.appendChild(overlaySelect);
  const overlayIconByValue = {
    road: '🛣',
    railroad: '🚆',
    mine: '⛏',
    irrigation: '💧',
    fort: '🛡',
    barricade: '🚧',
    barbariancamp: '⚑',
    goodyhut: '🎁',
    pollution: '☣',
    crater: '🕳',
    airfield: '🛩',
    radartower: '📡',
    outpost: '🏕',
    colony: '🏴',
    victorypoint: '⭐',
    ruins: '🏚',
    startinglocation: '📍'
  };
  attachMapSelectIcon(overlayWrap, overlaySelect, (value) => makeMapGlyphIcon(overlayIconByValue[value] || '🧱', `Overlay: ${value}`, 'resource'));
  toolRow.appendChild(overlayWrap);

  const fogWrap = document.createElement('label');
  fogWrap.className = 'hint';
  fogWrap.textContent = 'Fog';
  const fogSelect = document.createElement('select');
  [{ value: 'add', label: 'Add Fog' }, { value: 'remove', label: 'Remove Fog' }].forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    fogSelect.appendChild(o);
  });
  fogSelect.value = String(tool.fogMode || 'add');
  fogSelect.addEventListener('change', () => {
    state.mapEditorTool.fogMode = fogSelect.value;
  });
  fogWrap.appendChild(fogSelect);
  attachMapSelectIcon(fogWrap, fogSelect, (value) => makeMapGlyphIcon(value === 'remove' ? '☀' : '🌫', `Fog: ${value}`, 'world'));
  toolRow.appendChild(fogWrap);

  const districtWrap = document.createElement('label');
  districtWrap.className = 'hint';
  districtWrap.textContent = 'District';
  const districtSelect = document.createElement('select');
  const districtSections = (((state.bundle && state.bundle.tabs && state.bundle.tabs.districts && state.bundle.tabs.districts.model) || {}).sections || []);
  const districtEntries = districtSections.map((section, idx) => ({
    idx,
    name: String(getFieldValue(section, 'name') || `District ${idx + 1}`)
  }));
  districtEntries.forEach((entry) => {
    const o = document.createElement('option');
    o.value = String(entry.idx);
    o.textContent = entry.name;
    districtSelect.appendChild(o);
  });
  if (districtEntries.length === 0) {
    const o = document.createElement('option');
    o.value = '0';
    o.textContent = '(none)';
    districtSelect.appendChild(o);
  }
  districtSelect.value = String(Number(tool.districtType) || 0);
  districtSelect.addEventListener('change', () => {
    state.mapEditorTool.districtType = parseIntLoose(districtSelect.value, 0);
  });
  districtWrap.appendChild(districtSelect);
  attachMapSelectIcon(districtWrap, districtSelect, (value) => {
    const idx = parseIntLoose(value, -1);
    const entry = districtEntries[idx] || null;
    if (entry && entry.name) return makeDistrictOptionPreviewIcon(entry.name);
    return makeMapGlyphIcon('🏙', 'District', 'civ');
  });
  toolRow.appendChild(districtWrap);

  const ownerWrap = document.createElement('label');
  ownerWrap.className = 'hint';
  ownerWrap.textContent = 'Owner';
  const ownerSelect = document.createElement('select');
  const leadSectionForOwner = (tab.sections || []).find((s) => s.code === 'LEAD');
  const leadRecordsForOwner = leadSectionForOwner && Array.isArray(leadSectionForOwner.records) ? leadSectionForOwner.records : [];
  leadRecordsForOwner.forEach((record, idx) => {
    const o = document.createElement('option');
    o.value = String(idx);
    o.textContent = String(record && record.name || `Player ${idx + 1}`);
    ownerSelect.appendChild(o);
  });
  if (leadRecordsForOwner.length === 0) {
    const o = document.createElement('option');
    o.value = '0';
    o.textContent = 'Owner 0';
    ownerSelect.appendChild(o);
  }
  ownerSelect.value = String(Number(tool.owner) || 0);
  ownerSelect.addEventListener('change', () => {
    state.mapEditorTool.owner = parseIntLoose(ownerSelect.value, 0);
  });
  ownerWrap.appendChild(ownerSelect);
  attachMapSelectIcon(ownerWrap, ownerSelect, (value) => {
    const idx = parseIntLoose(value, 0);
    const rec = leadRecordsForOwner[idx] || null;
    const title = rec ? String(rec.name || `Owner ${idx}`) : `Owner ${idx}`;
    return makeMapColorIcon(idx + 1, title);
  });
  toolRow.appendChild(ownerWrap);

  const ownerTypeWrap = document.createElement('label');
  ownerTypeWrap.className = 'hint';
  ownerTypeWrap.textContent = 'Owner Type';
  const ownerTypeSelect = document.createElement('select');
  [
    { value: '0', label: 'None' },
    { value: '1', label: 'Barbarians' },
    { value: '3', label: 'Player' },
    { value: '2', label: 'Civilization' }
  ].forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    ownerTypeSelect.appendChild(o);
  });
  ownerTypeSelect.value = String(parseIntLoose(tool.ownerType, 1));
  ownerTypeSelect.addEventListener('change', () => {
    state.mapEditorTool.ownerType = parseIntLoose(ownerTypeSelect.value, 1);
  });
  ownerTypeWrap.appendChild(ownerTypeSelect);
  const ownerTypeIconByValue = {
    '0': { glyph: '∅', tone: 'neutral' },
    '1': { glyph: '⚔', tone: 'resource' },
    '3': { glyph: '👤', tone: 'civ' },
    '2': { glyph: '🏛', tone: 'civ' }
  };
  attachMapSelectIcon(ownerTypeWrap, ownerTypeSelect, (value) => {
    const spec = ownerTypeIconByValue[value] || { glyph: '?', tone: 'neutral' };
    return makeMapGlyphIcon(spec.glyph, `Owner type: ${value}`, spec.tone);
  });
  toolRow.appendChild(ownerTypeWrap);

  const unitWrap = document.createElement('label');
  unitWrap.className = 'hint';
  unitWrap.textContent = 'Unit Type';
  const unitSelect = document.createElement('select');
  const unitSectionForPicker = (tab.sections || []).find((s) => s.code === 'PRTO');
  const unitRecordsForPicker = unitSectionForPicker && Array.isArray(unitSectionForPicker.records) ? unitSectionForPicker.records : [];
  const mapToolUnitIconById = {};
  unitRecordsForPicker.forEach((record, idx) => {
    const o = document.createElement('option');
    o.value = String(idx);
    o.textContent = String(record && record.name || `Unit ${idx}`);
    unitSelect.appendChild(o);
    mapToolUnitIconById[idx] = parseIntLoose(getFieldByBaseKey(record, 'iconindex')?.value, -1);
  });
  if (unitRecordsForPicker.length === 0) {
    const o = document.createElement('option');
    o.value = '0';
    o.textContent = 'Unit 0';
    unitSelect.appendChild(o);
    mapToolUnitIconById[0] = -1;
  }
  unitSelect.value = String(Number(tool.unitType) || 0);
  unitSelect.addEventListener('change', () => {
    state.mapEditorTool.unitType = parseIntLoose(unitSelect.value, 0);
  });
  unitWrap.appendChild(unitSelect);
  attachMapSelectIcon(unitWrap, unitSelect, (value) => {
    const idx = parseIntLoose(value, 0);
    const rec = unitRecordsForPicker[idx] || null;
    const title = rec ? String(rec.name || `Unit ${idx}`) : `Unit ${idx}`;
    const iconIdx = mapToolUnitIconById[idx];
    if (Number.isFinite(iconIdx) && iconIdx >= 0) {
      return makeMapAtlasSpriteIcon('units32', 32, 32, iconIdx, title);
    }
    return makeMapGlyphIcon('⚔', title, 'resource');
  });
  toolRow.appendChild(unitWrap);

  const removeToggle = document.createElement('label');
  removeToggle.className = 'bool-toggle';
  const removeCheck = document.createElement('input');
  removeCheck.type = 'checkbox';
  removeCheck.checked = !!tool.remove;
  const removeText = document.createElement('span');
  removeText.textContent = removeCheck.checked ? 'Remove Mode' : 'Add Mode';
  removeCheck.addEventListener('change', () => {
    state.mapEditorTool.remove = removeCheck.checked;
    removeText.textContent = removeCheck.checked ? 'Remove Mode' : 'Add Mode';
  });
  removeToggle.appendChild(removeCheck);
  removeToggle.appendChild(removeText);
  toolRow.appendChild(removeToggle);

  const showForMode = (elNode, modes) => {
    elNode.classList.toggle('hidden', !modes.includes(String(state.mapEditorTool.mode || 'select')));
  };
  showForMode(terrainWrap, ['terrain']);
  showForMode(overlayWrap, ['overlay']);
  showForMode(fogWrap, ['fog']);
  showForMode(districtWrap, ['district']);
  showForMode(ownerWrap, ['city', 'unit']);
  showForMode(ownerTypeWrap, ['city', 'unit']);
  showForMode(unitWrap, ['unit']);

  if (!floatingUi) container.appendChild(toolRow);

  const mapFrame = document.createElement('div');
  mapFrame.className = 'biq-map-frame';
  mapFrame.style.width = '100%';
  let floatingTopLeft = null;
  let floatingRight = null;
  if (floatingUi) {
    floatingTopLeft = document.createElement('div');
    floatingTopLeft.className = 'biq-map-floating-panel biq-map-floating-top-left';
    floatingTopLeft.appendChild(controls);
    floatingTopLeft.appendChild(toolRow);
    mapFrame.appendChild(floatingTopLeft);
  }
  const mapPane = document.createElement('div');
  mapPane.className = 'biq-map-canvas-wrap';
  mapPane.style.width = '100%';
  container.tabIndex = 0;
  let isDraggingMap = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragMoved = false;
  let horizontalWrapEnabled = false;
  let horizontalWrapSpan = 0;
  let horizontalWrapCenter = 0;
  let lastDragLogTs = 0;
  const DRAG_THRESHOLD = 4;
  const getPaneMetrics = () => {
    const clientWidth = Math.max(0, Math.round(mapPane.clientWidth || 0));
    const clientHeight = Math.max(0, Math.round(mapPane.clientHeight || 0));
    const scrollWidth = Math.max(0, Math.round(mapPane.scrollWidth || 0));
    const scrollHeight = Math.max(0, Math.round(mapPane.scrollHeight || 0));
    const maxLeft = Math.max(0, scrollWidth - clientWidth);
    const maxTop = Math.max(0, scrollHeight - clientHeight);
    return {
      clientWidth,
      clientHeight,
      scrollWidth,
      scrollHeight,
      maxLeft,
      maxTop
    };
  };
  const setMapPaneScroll = (nextLeft, nextTop, reason) => {
    const metrics = getPaneMetrics();
    const clampedLeft = Math.max(0, Math.min(metrics.maxLeft, Number(nextLeft) || 0));
    const clampedTop = Math.max(0, Math.min(metrics.maxTop, Number(nextTop) || 0));
    mapPane.scrollLeft = clampedLeft;
    mapPane.scrollTop = clampedTop;
    if (reason && reason.logWhenNoHorizontal && metrics.maxLeft <= 0) {
      appendDebugLog('biq-map:horizontal-range-zero', {
        reason: reason.reason || 'unknown',
        ...metrics
      });
    }
  };
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
    setMapPaneScroll(
      mapPane.scrollLeft - dx,
      mapPane.scrollTop - dy,
      { reason: 'drag', logWhenNoHorizontal: true }
    );
    dragLastX = ev.clientX;
    dragLastY = ev.clientY;
    const now = Date.now();
    if (now - lastDragLogTs > 120) {
      lastDragLogTs = now;
      appendDebugLog('biq-map:drag-move', {
        dx,
        dy,
        totalDx,
        totalDy,
        left: mapPane.scrollLeft,
        top: mapPane.scrollTop
      });
    }
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
    container.focus({ preventScroll: true });
    if (ev.button !== 0) return;
    const mode = String(state.mapEditorTool && state.mapEditorTool.mode || 'select');
    if (isScenarioMode() && mode !== 'select') {
      appendDebugLog('biq-map:drag-blocked', { reason: 'tool-mode', mode });
      return;
    }
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
    const metrics = getPaneMetrics();
    appendDebugLog('biq-map:drag-start', {
      mode,
      left: mapPane.scrollLeft,
      top: mapPane.scrollTop,
      ...metrics
    });
  });
  mapPane.addEventListener('pointermove', onDragMove);
  mapPane.addEventListener('pointerup', onDragEnd);
  mapPane.addEventListener('pointercancel', onDragEnd);
  mapPane.addEventListener('scroll', () => {
    if (horizontalWrapEnabled && horizontalWrapSpan > 0) {
      const minLeft = horizontalWrapCenter - horizontalWrapSpan;
      const maxLeft = horizontalWrapCenter + horizontalWrapSpan;
      if (mapPane.scrollLeft < minLeft) {
        mapPane.scrollLeft += horizontalWrapSpan;
        appendDebugLog('biq-map:wrap-shift', { dir: 'right', left: mapPane.scrollLeft, minLeft, maxLeft });
      } else if (mapPane.scrollLeft > maxLeft) {
        mapPane.scrollLeft -= horizontalWrapSpan;
        appendDebugLog('biq-map:wrap-shift', { dir: 'left', left: mapPane.scrollLeft, minLeft, maxLeft });
      }
    }
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
    if (Math.abs(clamped - fromZoom) < 0.001) return;
    const safePaneX = Number.isFinite(paneX) ? paneX : Math.floor(mapPane.clientWidth / 2);
    const safePaneY = Number.isFinite(paneY) ? paneY : Math.floor(mapPane.clientHeight / 2);
    const contentX = anchorContent && Number.isFinite(anchorContent.x)
      ? anchorContent.x
      : mapPane.scrollLeft + safePaneX;
    const contentY = anchorContent && Number.isFinite(anchorContent.y)
      ? anchorContent.y
      : mapPane.scrollTop + safePaneY;
    state.biqMapZoomAnchor = { fromZoom, paneX: safePaneX, paneY: safePaneY, contentX, contentY };
    state.biqMapZoom = clamped;
    appendDebugLog('biq-map:zoom-change', { zoom: state.biqMapZoom, source });
    rerenderMapView();
  };
  mapPane.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const paneRect = mapPane.getBoundingClientRect();
    const paneX = ev.clientX - paneRect.left;
    const paneY = ev.clientY - paneRect.top;
    const canvasRect = canvas.getBoundingClientRect();
    const canvasX = ((ev.clientX - canvasRect.left) / Math.max(1, canvasRect.width)) * canvas.width;
    const canvasY = ((ev.clientY - canvasRect.top) / Math.max(1, canvasRect.height)) * canvas.height;
    const hovered = typeof findTileAtCanvasPx === 'function'
      ? findTileAtCanvasPx(canvasX, canvasY, false)
      : null;
    const anchorContent = {
      x: mapPane.scrollLeft + paneX,
      y: mapPane.scrollTop + paneY
    };
    const direction = ev.deltaY < 0 ? 1 : -1;
    if (hovered) {
      appendDebugLog('biq-map:zoom-anchor', {
        index: hovered.index,
        metric: Number(hovered.metric || 0).toFixed(3),
        centerX: Math.round(hovered.centerX),
        centerY: Math.round(hovered.centerY)
      });
    }
    const target = stepZoomLevel(Number(state.biqMapZoom || 6), direction);
    setMapZoom(target, 'wheel', paneX, paneY, anchorContent);
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
    setMapZoom(stepZoomLevel(Number(state.biqMapZoom || 6), 1), 'button+');
  });
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'biq-map-zoom-btn';
  zoomOutBtn.type = 'button';
  zoomOutBtn.textContent = '-';
  zoomOutBtn.title = 'Zoom out';
  zoomOutBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setMapZoom(stepZoomLevel(Number(state.biqMapZoom || 6), -1), 'button-');
  });
  zoomControls.appendChild(zoomInBtn);
  zoomControls.appendChild(zoomOutBtn);

  const setToolMode = (mode) => {
    const nextMode = String(mode || 'select');
    if (state.mapEditorTool.mode === nextMode) return;
    state.mapEditorTool.mode = nextMode;
    modeSelect.value = nextMode;
    rerenderMapView();
  };
  const setBrushDiameter = (diameter) => {
    const next = parseIntLoose(diameter, 1);
    if (![1, 3, 5, 7].includes(next)) return;
    if (parseIntLoose(state.mapEditorTool.diameter, 1) === next) return;
    state.mapEditorTool.diameter = next;
    sizeSelect.value = String(next);
    rerenderMapView();
  };
  const hotkeyMap = {
    s: 'select',
    t: 'terrain',
    o: 'overlay',
    d: 'district',
    c: 'city',
    u: 'unit'
  };
  container.addEventListener('keydown', (ev) => {
    const target = ev.target;
    if (target && (
      target.tagName === 'INPUT'
      || target.tagName === 'SELECT'
      || target.tagName === 'TEXTAREA'
      || target.isContentEditable
    )) return;
    const key = String(ev.key || '').toLowerCase();
    if (hotkeyMap[key]) {
      ev.preventDefault();
      setToolMode(hotkeyMap[key]);
      return;
    }
    if (key === 'f') {
      ev.preventDefault();
      if (state.mapEditorTool.mode !== 'fog') {
        setToolMode('fog');
        state.mapEditorTool.fogMode = 'add';
      } else {
        state.mapEditorTool.fogMode = String(state.mapEditorTool.fogMode || 'add') === 'add' ? 'remove' : 'add';
      }
      rerenderMapView();
      return;
    }
    if (key === '1' || key === '3' || key === '5' || key === '7') {
      ev.preventDefault();
      setBrushDiameter(parseIntLoose(key, 1));
      return;
    }
    if (key === '+' || key === '=') {
      ev.preventDefault();
      setMapZoom(stepZoomLevel(Number(state.biqMapZoom || 6), 1), 'hotkey+');
      return;
    }
    if (key === '-' || key === '_') {
      ev.preventDefault();
      setMapZoom(stepZoomLevel(Number(state.biqMapZoom || 6), -1), 'hotkey-');
    }
  });

  const scaleForZoom = (z) => Math.max(0.18, clampZoom(z) / 16);
  const readBoolField = (record, keys) => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < list.length; i += 1) {
      const key = String(list[i] || '').trim();
      if (!key) continue;
      const field = getFieldByBaseKey(record, key);
      if (!field) continue;
      const raw = String(field.value == null ? '' : field.value).trim().toLowerCase();
      if (!raw) continue;
      if (raw === 'true' || raw === 'yes' || raw === 'on') return true;
      if (raw === 'false' || raw === 'no' || raw === 'off') return false;
      const parsed = parseIntLoose(raw, NaN);
      if (Number.isFinite(parsed)) return parsed !== 0;
    }
    return null;
  };
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
  const xWrapFromField = readBoolField(wmapRecord, ['xwrapping', 'x_wrapping', 'x wrapping', 'xwrap']);
  const wmapFlags = parseIntLoose(getFieldByBaseKey(wmapRecord, 'flags')?.value, 0);
  const xWrap = xWrapFromField == null ? ((wmapFlags & 0x1) === 0x1) : !!xWrapFromField;
  const wrapCopyRadius = xWrap ? 2 : 0;
  const wrapCenterOffset = xWrap ? worldWrapSpan * wrapCopyRadius : 0;
  horizontalWrapEnabled = !!xWrap;
  horizontalWrapSpan = worldWrapSpan;
  horizontalWrapCenter = wrapCenterOffset;

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
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
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
  requestBiqMapArtAsset('roads', 'Art/Terrain/roads.pcx');
  requestBiqMapArtAsset('railroads', 'Art/Terrain/railroads.pcx');
  requestBiqMapArtAsset('irrigationGrass', 'Art/Terrain/irrigation.pcx');
  requestBiqMapArtAsset('irrigationPlains', 'Art/Terrain/irrigation PLAINS.pcx');
  requestBiqMapArtAsset('irrigationDesert', 'Art/Terrain/irrigation DESETT.pcx');
  requestBiqMapArtAsset('irrigationTundra', 'Art/Terrain/irrigation TUNDRA.pcx');
  requestBiqMapArtAsset('grasslandForests', 'Art/Terrain/grassland forests.pcx');
  requestBiqMapArtAsset('plainsForests', 'Art/Terrain/plains forests.pcx');
  requestBiqMapArtAsset('tundraForests', 'Art/Terrain/tundra forests.pcx');
  requestBiqMapArtAsset('territory', 'Art/Terrain/Territory.pcx', { transparentIndexes: [1, 255] });
  requestBiqMapArtAsset('hills', 'Art/Terrain/xhills.pcx');
  requestBiqMapArtAsset('lmHills', 'Art/Terrain/LMHills.pcx');
  requestBiqMapArtAsset('forestHills', 'Art/Terrain/hill forests.pcx');
  requestBiqMapArtAsset('jungleHills', 'Art/Terrain/hill jungle.pcx');
  requestBiqMapArtAsset('mountains', 'Art/Terrain/Mountains.pcx');
  requestBiqMapArtAsset('snowMountains', 'Art/Terrain/Mountains-snow.pcx');
  requestBiqMapArtAsset('lmMountains', 'Art/Terrain/LMMountains.pcx');
  requestBiqMapArtAsset('forestMountains', 'Art/Terrain/mountain forests.pcx');
  requestBiqMapArtAsset('jungleMountains', 'Art/Terrain/mountain jungles.pcx');
  requestBiqMapArtAsset('volcanos', 'Art/Terrain/Volcanos.pcx');
  requestBiqMapArtAsset('forestVolcanos', 'Art/Terrain/Volcanos forests.pcx');
  requestBiqMapArtAsset('jungleVolcanos', 'Art/Terrain/Volcanos jungles.pcx');
  requestBiqMapArtAsset('mtnRivers', 'Art/Terrain/mtnRivers.pcx');
  requestBiqMapArtAsset('deltaRivers', 'Art/Terrain/deltaRivers.pcx');
  requestBiqMapArtAsset('cityAmerc', 'Art/Cities/rAMER.pcx');
  requestBiqMapArtAsset('cityEuro', 'Art/Cities/rEURO.pcx');
  requestBiqMapArtAsset('cityRoman', 'Art/Cities/rROMAN.pcx');
  requestBiqMapArtAsset('cityMidEast', 'Art/Cities/rMIDEAST.pcx');
  requestBiqMapArtAsset('cityAsian', 'Art/Cities/rASIAN.pcx');
  requestBiqMapArtAsset('cityAmercWall', 'Art/Cities/AMERWALL.pcx');
  requestBiqMapArtAsset('cityEuroWall', 'Art/Cities/EUROWALL.pcx');
  requestBiqMapArtAsset('cityRomanWall', 'Art/Cities/ROMANWALL.pcx');
  requestBiqMapArtAsset('cityMidEastWall', 'Art/Cities/MIDEASTWALL.pcx');
  requestBiqMapArtAsset('cityAsianWall', 'Art/Cities/ASIANWALL.pcx');
  for (let i = 0; i < 32; i += 1) {
    const key = `ntp-${i}`;
    const file = `Art/Units/Palettes/ntp${String(i).padStart(2, '0')}.pcx`;
    requestBiqMapArtAsset(key, file);
  }

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
  const cityRecordByCoord = new Map();
  (citySection?.records || []).forEach((record, idx) => {
    const ref = Number.isFinite(Number(record && record.index)) ? Number(record.index) : idx;
    cityRecordById[ref] = record;
    const cx = parseIntLoose(getFieldByBaseKey(record, 'x')?.value, NaN);
    const cy = parseIntLoose(getFieldByBaseKey(record, 'y')?.value, NaN);
    if (Number.isFinite(cx) && Number.isFinite(cy)) {
      cityRecordByCoord.set(`${cx},${cy}`, record);
    }
  });
  const unitSection = (tab.sections || []).find((s) => s.code === 'UNIT');
  const unitRecordById = {};
  const unitRecordsByCoord = new Map();
  (unitSection?.records || []).forEach((record, idx) => {
    const ref = Number.isFinite(Number(record && record.index)) ? Number(record.index) : idx;
    unitRecordById[ref] = record;
    const ux = parseIntLoose(getFieldByBaseKey(record, 'x')?.value, NaN);
    const uy = parseIntLoose(getFieldByBaseKey(record, 'y')?.value, NaN);
    if (Number.isFinite(ux) && Number.isFinite(uy)) {
      const key = `${ux},${uy}`;
      if (!unitRecordsByCoord.has(key)) unitRecordsByCoord.set(key, []);
      unitRecordsByCoord.get(key).push(record);
    }
  });
  const raceSection = (tab.sections || []).find((s) => s.code === 'RACE');
  const raceCultureById = {};
  const raceDefaultColorById = {};
  const raceIdByName = {};
  const getFieldRawValue = (record, baseKey) => {
    const field = getFieldByBaseKey(record, baseKey);
    if (!field) return '';
    const raw = String(field.originalValue == null ? '' : field.originalValue).trim();
    if (raw) return raw;
    return String(field.value == null ? '' : field.value).trim();
  };
  const getFieldDisplayValue = (record, baseKey) => {
    const field = getFieldByBaseKey(record, baseKey);
    if (!field) return '';
    return String(field.value == null ? '' : field.value).trim();
  };
  const parseFieldInt = (record, baseKey, fallback = NaN) => {
    const raw = getFieldRawValue(record, baseKey);
    const n = parseIntLoose(raw, NaN);
    if (Number.isFinite(n)) return n;
    const display = getFieldDisplayValue(record, baseKey);
    const m = parseIntLoose(display, NaN);
    return Number.isFinite(m) ? m : fallback;
  };
  const parseCultureGroup = (raw) => {
    const text = String(raw || '').trim();
    const lower = text.toLowerCase();
    const n = parseIntLoose(text, NaN);
    if (Number.isFinite(n)) return n;
    if (lower.includes('none')) return -1;
    if (lower.includes('american')) return 0;
    if (lower.includes('europe')) return 1;
    if (lower.includes('roman') || lower.includes('mediter')) return 2;
    if (lower.includes('middle')) return 3;
    if (lower.includes('asian')) return 4;
    return 0;
  };
  (raceSection?.records || []).forEach((record, idx) => {
    const raceName = String(record && record.name || '').trim();
    if (raceName) raceIdByName[raceName.toLowerCase()] = idx;
    const cultureRaw = parseFieldInt(record, 'culturegroup', NaN);
    raceCultureById[idx] = Number.isFinite(cultureRaw)
      ? cultureRaw
      : parseCultureGroup(getFieldDisplayValue(record, 'culturegroup'));
    raceDefaultColorById[idx] = parseFieldInt(record, 'defaultcolor', NaN);
  });
  const leadSection = (tab.sections || []).find((s) => s.code === 'LEAD');
  const erasSection = (tab.sections || []).find((s) => s.code === 'ERAS');
  const eraIdByName = {};
  (erasSection?.records || []).forEach((record, idx) => {
    const eraName = String(record && record.name || '').trim();
    if (eraName) eraIdByName[eraName.toLowerCase()] = idx;
  });
  const ruleSection = (tab.sections || []).find((s) => s.code === 'RULE');
  const ruleRecord = ruleSection && Array.isArray(ruleSection.records) ? (ruleSection.records[0] || null) : null;
  const maxCity1Size = parseIntLoose(getFieldByBaseKey(ruleRecord, 'maxcity1size')?.value, 6);
  const maxCity2Size = parseIntLoose(getFieldByBaseKey(ruleRecord, 'maxcity2size')?.value, 12);
  const playerCivById = {};
  const playerEraById = {};
  const playerIdByName = {};
  const civEraById = {};
  const parseOwnerType = (raw) => {
    const text = String(raw || '').trim().toLowerCase();
    if (!text) return NaN;
    if (text.includes('barbar')) return 1;
    if (text.includes('player')) return 3;
    if (text.includes('civ')) return 2;
    if (text === 'none' || text === 'no owner') return 0;
    return parseIntLoose(raw, NaN);
  };
  const parseEraIndex = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return 0;
    let era = parseIntLoose(text, NaN);
    if (!Number.isFinite(era)) era = eraIdByName[text.toLowerCase()];
    if (!Number.isFinite(era)) era = 0;
    return Math.max(0, Math.min(3, era === 4 ? 3 : era));
  };
  const parseIndexedRef = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return NaN;
    const parenLike = text.match(/\((\d+)\)\s*$/);
    if (parenLike) return Number.parseInt(parenLike[1], 10);
    return parseIntLoose(raw, NaN);
  };
  const parseLeadRef = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return NaN;
    const leadLike = text.match(/lead\s+(\d+)/i);
    if (!leadLike) return NaN;
    return Number.parseInt(leadLike[1], 10) - 1;
  };
  const parseIndexCandidates = (raw) => {
    const out = [];
    const seen = new Set();
    const push = (n) => {
      if (!Number.isFinite(n)) return;
      const v = Number(n) | 0;
      if (seen.has(v)) return;
      seen.add(v);
      out.push(v);
    };
    const leadRef = parseLeadRef(raw);
    const parsed = parseIndexedRef(raw);
    push(leadRef);
    push(parsed);
    if (Number.isFinite(parsed)) push(parsed - 1);
    return out;
  };
  const stripRefSuffix = (raw) => String(raw || '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/\blead\s+\d+\b/ig, '')
    .trim()
    .toLowerCase();
  const firstValidIndex = (candidates, upperBoundExclusive) => {
    for (let i = 0; i < candidates.length; i += 1) {
      const v = candidates[i];
      if (!Number.isFinite(v)) continue;
      if (v < 0) continue;
      if (Number.isFinite(upperBoundExclusive) && v >= upperBoundExclusive) continue;
      return v;
    }
    return NaN;
  };
  const resolvePlayerIdFromOwnerRaw = (ownerRaw) => {
    const text = String(ownerRaw || '').trim().toLowerCase();
    const stripped = stripRefSuffix(ownerRaw);
    if (stripped && Number.isFinite(playerIdByName[stripped])) return playerIdByName[stripped];
    if (text && Number.isFinite(playerIdByName[text])) return playerIdByName[text];
    const candidates = parseIndexCandidates(ownerRaw);
    // Parenthetical refs in our UI are often one-based.
    if (/\(\d+\)\s*$/.test(String(ownerRaw || ''))) {
      const oneBased = [];
      for (let i = 0; i < candidates.length; i += 1) {
        const c = candidates[i];
        if (!Number.isFinite(c)) continue;
        oneBased.push(c - 1);
      }
      oneBased.forEach((v) => candidates.push(v));
    }
    for (let i = 0; i < candidates.length; i += 1) {
      const playerId = candidates[i];
      if (playerId < 0) continue;
      if (playerId >= (leadSection?.records || []).length) continue;
      if (Number.isFinite(parseIntLoose(playerCivById[playerId], NaN))) return playerId;
    }
    return firstValidIndex(candidates, (leadSection?.records || []).length);
  };
  const resolveCivIdFromRaw = (ownerRaw) => {
    const text = String(ownerRaw || '').trim();
    const stripped = stripRefSuffix(ownerRaw);
    const byRaceName = raceIdByName[stripped] ?? raceIdByName[text.toLowerCase()];
    if (Number.isFinite(byRaceName)) return byRaceName;
    const parsed = parseIndexedRef(ownerRaw);
    const candidates = [];
    const seen = new Set();
    const push = (n) => {
      if (!Number.isFinite(n)) return;
      const v = Number(n) | 0;
      if (seen.has(v)) return;
      seen.add(v);
      candidates.push(v);
    };
    // For OWNER_CIV, prioritize the explicit numeric reference, not LEAD textual prefixes.
    push(parsed);
    if (Number.isFinite(parsed)) push(parsed - 1);
    for (let i = 0; i < candidates.length; i += 1) {
      const civId = candidates[i];
      if (civId < 0) continue;
      if (civId >= (raceSection?.records || []).length) continue;
      if (Number.isFinite(parseIntLoose(raceCultureById[civId], NaN)) || Number.isFinite(parseIntLoose(raceDefaultColorById[civId], NaN))) return civId;
    }
    const byLeadName = playerIdByName[stripped];
    if (Number.isFinite(byLeadName) && Number.isFinite(parseIntLoose(playerCivById[byLeadName], NaN))) {
      return parseIntLoose(playerCivById[byLeadName], -1);
    }
    return firstValidIndex(candidates, (raceSection?.records || []).length);
  };
  (leadSection?.records || []).forEach((record, idx) => {
    const playerName = String(record && record.name || '').trim();
    if (playerName) playerIdByName[playerName.toLowerCase()] = idx;
    const civRaw = String(getFieldRawValue(record, 'civ') || getFieldDisplayValue(record, 'civ') || '').trim();
    let civId = parseIntLoose(civRaw, NaN);
    if (!Number.isFinite(civId)) civId = raceIdByName[civRaw.toLowerCase()];
    if (!Number.isFinite(civId)) {
      const leadRef = parseIndexedRef(civRaw);
      if (Number.isFinite(leadRef) && Number.isFinite(raceDefaultColorById[leadRef])) civId = leadRef;
    }
    if (!Number.isFinite(civId)) civId = -1;
    const era = parseEraIndex(getFieldRawValue(record, 'initialera') || getFieldDisplayValue(record, 'initialera'));
    playerCivById[idx] = civId;
    playerEraById[idx] = era;
    if (civId >= 0 && !Number.isFinite(civEraById[civId])) {
      civEraById[civId] = era;
    }
  });
  const resolveCivIdFromOwnership = (ownerTypeRaw, ownerRaw) => {
    const ownerType = parseOwnerType(ownerTypeRaw);
    const ownerText = String(ownerRaw || '').trim();
    if (ownerType === 2) {
      const civId = resolveCivIdFromRaw(ownerRaw);
      if (Number.isFinite(civId) && civId >= 0) return civId;
      const playerId = resolvePlayerIdFromOwnerRaw(ownerRaw);
      if (Number.isFinite(playerId)) return parseIntLoose(playerCivById[playerId], -1);
      return -1;
    }
    if (ownerType === 3) {
      let playerId = resolvePlayerIdFromOwnerRaw(ownerRaw);
      if (!Number.isFinite(playerId)) playerId = playerIdByName[ownerText.toLowerCase()];
      if (!Number.isFinite(playerId)) return -1;
      return parseIntLoose(playerCivById[playerId], -1);
    }
    return -1;
  };
  const resolveTileOwnerInfo = (tileRecord) => {
    const ownerRaw = String(getFieldRawValue(tileRecord, 'owner') || getFieldDisplayValue(tileRecord, 'owner') || '').trim();
    const ownerTypeRaw = String(getFieldRawValue(tileRecord, 'ownertype') || getFieldDisplayValue(tileRecord, 'ownertype') || '').trim();
    if (!ownerRaw || ownerRaw.toLowerCase() === 'none') return { hasOwner: false, ownerKey: '', civId: -1, ownerType: 0, ownerId: -1 };
    let ownerType = parseOwnerType(ownerTypeRaw);
    let ownerId = NaN;
    const ownerName = ownerRaw.toLowerCase();
    if (!Number.isFinite(ownerType)) {
      if (Number.isFinite(raceIdByName[ownerName])) ownerType = 2;
      else if (Number.isFinite(playerIdByName[ownerName]) || /^lead\s+\d+/i.test(ownerRaw)) ownerType = 3;
      else ownerType = 2;
    }
    if (ownerType === 2) ownerId = resolveCivIdFromRaw(ownerRaw);
    else if (ownerType === 3) ownerId = resolvePlayerIdFromOwnerRaw(ownerRaw);
    if (!Number.isFinite(ownerId)) ownerId = ownerType === 2 ? raceIdByName[ownerName] : playerIdByName[ownerName];
    const civId = resolveCivIdFromOwnership(ownerTypeRaw || ownerType, ownerRaw);
    const ownerKey = Number.isFinite(ownerId) ? `${ownerType}:${ownerId}` : `${ownerType}:${ownerName}`;
    return {
      hasOwner: ownerKey !== '',
      ownerKey,
      civId: Number.isFinite(civId) ? civId : -1,
      ownerType: Number.isFinite(ownerType) ? ownerType : 0,
      ownerId: Number.isFinite(ownerId) ? ownerId : -1
    };
  };
  const cityCivIdByRef = {};
  const cityRefByName = {};
  Object.keys(cityRecordById).forEach((refKey) => {
    const cityRecord = cityRecordById[refKey];
    if (!cityRecord) return;
    const ownerTypeRaw = String(getFieldRawValue(cityRecord, 'ownertype') || getFieldDisplayValue(cityRecord, 'ownertype') || '');
    const ownerRaw = String(getFieldRawValue(cityRecord, 'owner') || getFieldDisplayValue(cityRecord, 'owner') || '');
    cityCivIdByRef[refKey] = resolveCivIdFromOwnership(ownerTypeRaw, ownerRaw);
    const cityName = String(getFieldByBaseKey(cityRecord, 'name')?.value || cityRecord.name || '').trim().toLowerCase();
    if (cityName) cityRefByName[cityName] = refKey;
  });
  const borderTagToCivVotes = {};
  const bumpBorderVote = (borderTag, civId) => {
    if (!Number.isFinite(borderTag) || borderTag <= 0 || !Number.isFinite(civId) || civId < 0) return;
    const key = String(borderTag);
    if (!borderTagToCivVotes[key]) borderTagToCivVotes[key] = {};
    borderTagToCivVotes[key][civId] = (borderTagToCivVotes[key][civId] || 0) + 1;
  };
  tiles.forEach((tileRecord) => {
    if (!tileRecord) return;
    const borderTag = parseFieldInt(tileRecord, 'border', 0);
    if (!Number.isFinite(borderTag) || borderTag <= 0) return;
    const cityRefText = String(getFieldRawValue(tileRecord, 'city') || getFieldDisplayValue(tileRecord, 'city') || '').trim();
    let cityRef = parseIndexedRef(cityRefText);
    if (!Number.isFinite(cityRef) || cityRef < 0) {
      const cityName = cityRefText.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
      const fromName = cityRefByName[cityName];
      if (String(fromName || '').trim()) cityRef = parseIntLoose(fromName, NaN);
    }
    if (!Number.isFinite(cityRef) || cityRef < 0) return;
    const civId = parseIntLoose(cityCivIdByRef[String(cityRef)], -1);
    bumpBorderVote(borderTag, civId);
  });
  const borderTagToCivId = {};
  Object.keys(borderTagToCivVotes).forEach((borderTag) => {
    const votes = borderTagToCivVotes[borderTag] || {};
    let bestCiv = -1;
    let bestCount = -1;
    Object.keys(votes).forEach((civKey) => {
      const civId = parseIntLoose(civKey, -1);
      const count = parseIntLoose(votes[civKey], 0);
      if (count > bestCount) {
        bestCount = count;
        bestCiv = civId;
      }
    });
    if (bestCiv >= 0) borderTagToCivId[borderTag] = bestCiv;
  });
  const resolveTileTerritoryInfo = (tileRecord) => {
    const ownerInfo = resolveTileOwnerInfo(tileRecord);
    const borderTag = parseFieldInt(tileRecord, 'border', 0);
    if (ownerInfo.hasOwner) return { ...ownerInfo, borderTag };
    if (!Number.isFinite(borderTag) || borderTag <= 0) return { hasOwner: false, ownerKey: '', civId: -1, borderTag: 0 };
    const civId = parseIntLoose(borderTagToCivId[String(borderTag)], -1);
    return {
      hasOwner: true,
      ownerKey: `border:${borderTag}`,
      civId: Number.isFinite(civId) ? civId : -1,
      borderTag
    };
  };
  const tileRecordByCoord = new Map();
  for (let i = 0; i < tileGeom.length; i += 1) {
    const geom = tileGeom[i];
    if (!geom || !tiles[i]) continue;
    tileRecordByCoord.set(`${geom.xPos},${geom.yPos}`, tiles[i]);
  }

  const uniqueRecordRef = (sectionCode) => makeUniqueBiqStructureRecordRef(tab, sectionCode);
  const pushStructureAddOp = (sectionCode, newRecordRef) => {
    const ops = ensureBiqStructureRecordOps(tab);
    ops.push({ op: 'add', sectionCode, newRecordRef });
  };
  const pushStructureDeleteOp = (sectionCode, recordRef) => {
    const section = String(sectionCode || '').trim().toUpperCase();
    const ref = String(recordRef || '').trim().toUpperCase();
    if (!section || !ref) return;
    const ops = ensureBiqStructureRecordOps(tab);
    const addIdx = ops.findIndex((op) => {
      const kind = String(op && op.op || '').toLowerCase();
      if (kind !== 'add' && kind !== 'copy') return false;
      if (String(op && op.sectionCode || '').trim().toUpperCase() !== section) return false;
      return String(op && op.newRecordRef || '').trim().toUpperCase() === ref;
    });
    if (addIdx >= 0) {
      ops.splice(addIdx, 1);
      return;
    }
    const alreadyQueued = ops.some((op) => {
      if (String(op && op.op || '').toLowerCase() !== 'delete') return false;
      if (String(op && op.sectionCode || '').trim().toUpperCase() !== section) return false;
      return String(op && op.recordRef || '').trim().toUpperCase() === ref;
    });
    if (!alreadyQueued) ops.push({ op: 'delete', sectionCode: section, recordRef: ref });
  };
  const removeCityByIndex = (cityIndex) => {
    const idx = Number(cityIndex);
    if (!Number.isFinite(idx) || idx < 0 || !citySection || !Array.isArray(citySection.records)) return false;
    const target = citySection.records.find((record) => Number(record && record.index) === idx);
    if (!target) return false;
    const ref = getBiqStructureRecordRef(target);
    if (ref) pushStructureDeleteOp('CITY', ref);
    citySection.records = citySection.records.filter((record) => record !== target);
    tiles.forEach((candidateTile) => {
      if (!candidateTile) return;
      const candidateValue = parseIntLoose(getMapFieldValue(candidateTile, 'city', '-1'), -1);
      if (candidateValue === idx) setMapFieldValue(candidateTile, 'city', '-1', 'City');
    });
    return true;
  };
  const removeUnitByIndex = (unitIndex) => {
    const idx = Number(unitIndex);
    if (!Number.isFinite(idx) || idx < 0 || !unitSection || !Array.isArray(unitSection.records)) return false;
    const target = unitSection.records.find((record) => Number(record && record.index) === idx);
    if (!target) return false;
    const tx = parseIntLoose(getFieldByBaseKey(target, 'x')?.value, NaN);
    const ty = parseIntLoose(getFieldByBaseKey(target, 'y')?.value, NaN);
    const ref = getBiqStructureRecordRef(target);
    if (ref) pushStructureDeleteOp('UNIT', ref);
    unitSection.records = unitSection.records.filter((record) => record !== target);
    let replacementIndex = -1;
    if (Number.isFinite(tx) && Number.isFinite(ty)) {
      const replacement = unitSection.records.find((record) => {
        const ux = parseIntLoose(getFieldByBaseKey(record, 'x')?.value, NaN);
        const uy = parseIntLoose(getFieldByBaseKey(record, 'y')?.value, NaN);
        return ux === tx && uy === ty;
      });
      if (replacement) replacementIndex = Number(replacement.index);
    }
    tiles.forEach((candidateTile) => {
      if (!candidateTile) return;
      const candidateValue = parseIntLoose(getMapFieldValue(candidateTile, 'unit_on_tile', '-1'), -1);
      if (candidateValue === idx) {
        setMapFieldValue(candidateTile, 'unit_on_tile', replacementIndex >= 0 ? String(replacementIndex) : '', 'Unit On Tile');
      }
    });
    return true;
  };
  const findTileIndexByCoords = (xPos, yPos) => {
    for (let i = 0; i < tileGeom.length; i += 1) {
      const g = tileGeom[i];
      if (!g) continue;
      if (Number(g.xPos) === Number(xPos) && Number(g.yPos) === Number(yPos)) return i;
    }
    return -1;
  };
  const listUnitsAtCoords = (xPos, yPos) => {
    if (!unitSection || !Array.isArray(unitSection.records)) return [];
    return unitSection.records.filter((record) => {
      const ux = parseIntLoose(getFieldByBaseKey(record, 'x')?.value, NaN);
      const uy = parseIntLoose(getFieldByBaseKey(record, 'y')?.value, NaN);
      return ux === Number(xPos) && uy === Number(yPos);
    });
  };
  const relocateCityToTile = (cityIndex, destinationTileIndex, withUnits) => {
    if (!citySection || !Array.isArray(citySection.records)) return false;
    const cityIdx = Number(cityIndex);
    const toIdx = Number(destinationTileIndex);
    const destinationTile = tiles[toIdx];
    const destinationGeom = tileGeom[toIdx];
    if (!Number.isFinite(cityIdx) || cityIdx < 0 || !destinationTile || !destinationGeom) return false;
    const cityRecord = citySection.records.find((record) => Number(record && record.index) === cityIdx);
    if (!cityRecord) return false;
    const fromX = parseIntLoose(getFieldByBaseKey(cityRecord, 'x')?.value, NaN);
    const fromY = parseIntLoose(getFieldByBaseKey(cityRecord, 'y')?.value, NaN);
    const fromTileIdx = Number.isFinite(fromX) && Number.isFinite(fromY) ? findTileIndexByCoords(fromX, fromY) : -1;
    setMapFieldValue(cityRecord, 'x', String(destinationGeom.xPos), 'X');
    setMapFieldValue(cityRecord, 'y', String(destinationGeom.yPos), 'Y');
    if (fromTileIdx >= 0 && tiles[fromTileIdx]) {
      setMapFieldValue(tiles[fromTileIdx], 'city', '-1', 'City');
    }
    setMapFieldValue(destinationTile, 'city', String(cityIdx), 'City');
    if (withUnits && Number.isFinite(fromX) && Number.isFinite(fromY) && unitSection && Array.isArray(unitSection.records)) {
      const moved = unitSection.records.filter((record) => {
        const ux = parseIntLoose(getFieldByBaseKey(record, 'x')?.value, NaN);
        const uy = parseIntLoose(getFieldByBaseKey(record, 'y')?.value, NaN);
        return ux === fromX && uy === fromY;
      });
      moved.forEach((record) => {
        setMapFieldValue(record, 'x', String(destinationGeom.xPos), 'X');
        setMapFieldValue(record, 'y', String(destinationGeom.yPos), 'Y');
      });
      if (fromTileIdx >= 0 && tiles[fromTileIdx]) {
        setMapFieldValue(tiles[fromTileIdx], 'unit_on_tile', '', 'Unit On Tile');
      }
      if (moved.length > 0) {
        setMapFieldValue(destinationTile, 'unit_on_tile', String(Number(moved[0].index)), 'Unit On Tile');
      }
    }
    state.biqMapSelectedTile = toIdx;
    return true;
  };
  const tileCount = tiles.length;
  const applyBrushAtIndex = (centerIndex) => {
    if (!isScenarioMode()) return false;
    const mode = String(state.mapEditorTool && state.mapEditorTool.mode || 'select');
    if (mode === 'select') return false;
    const diameter = parseIntLoose(state.mapEditorTool && state.mapEditorTool.diameter, 1) || 1;
    const indices = (mapCore && typeof mapCore.computeBrushTileIndexes === 'function')
      ? mapCore.computeBrushTileIndexes(width, tileCount, centerIndex, diameter)
      : [centerIndex];
    if (indices.length === 0) return false;
    if (mode === 'terrain') {
      const terrainCode = parseIntLoose(state.mapEditorTool && state.mapEditorTool.terrainCode, 0);
      const packedTerrain = ((terrainCode & 0x0f) << 4) | (terrainCode & 0x0f);
      if (mapCore && typeof mapCore.applyTerrain === 'function') {
        mapCore.applyTerrain(tiles, indices, terrainCode);
      } else {
        indices.forEach((idx) => {
          setMapFieldValue(tiles[idx], 'baserealterrain', String(packedTerrain), 'Base Real Terrain');
          setMapFieldValue(tiles[idx], 'c3cbaserealterrain', String(packedTerrain), 'C3C Base Real Terrain');
        });
      }
      return true;
    }
    if (mode === 'overlay') {
      const overlayType = String(state.mapEditorTool && state.mapEditorTool.overlayType || 'road');
      const enabled = !(state.mapEditorTool && state.mapEditorTool.remove);
      if (mapCore && typeof mapCore.applyOverlay === 'function') {
        mapCore.applyOverlay(tiles, indices, overlayType, enabled);
      }
      return true;
    }
    if (mode === 'fog') {
      const addFog = String(state.mapEditorTool && state.mapEditorTool.fogMode || 'add') !== 'remove';
      if (mapCore && typeof mapCore.applyFog === 'function') {
        mapCore.applyFog(tiles, indices, addFog);
      } else {
        indices.forEach((idx) => setMapFieldValue(tiles[idx], 'fogofwar', addFog ? '0' : '1', 'Fog Of War'));
      }
      return true;
    }
    if (mode === 'district') {
      const enabled = !(state.mapEditorTool && state.mapEditorTool.remove);
      const type = parseIntLoose(state.mapEditorTool && state.mapEditorTool.districtType, 0);
      const dState = parseIntLoose(state.mapEditorTool && state.mapEditorTool.districtState, 1);
      if (mapCore && typeof mapCore.applyDistrict === 'function') {
        mapCore.applyDistrict(tiles, indices, type, dState, enabled);
      }
      return true;
    }
    if (mode === 'city') {
      const owner = parseIntLoose(state.mapEditorTool && state.mapEditorTool.owner, 0);
      const ownerType = parseIntLoose(state.mapEditorTool && state.mapEditorTool.ownerType, 1);
      const remove = !!(state.mapEditorTool && state.mapEditorTool.remove);
      let changed = false;
      indices.forEach((idx) => {
        const tile = tiles[idx];
        if (!tile) return;
        const g = tileGeom[idx];
        if (!g) return;
        if (remove) {
          const cityValue = parseIntLoose(getMapFieldValue(tile, 'city', '-1'), -1);
          setMapFieldValue(tile, 'city', '-1', 'City');
          if (cityValue >= 0) removeCityByIndex(cityValue);
          changed = true;
          return;
        }
        const cityValue = parseIntLoose(getMapFieldValue(tile, 'city', '-1'), -1);
        if (cityValue >= 0) return;
        if (!citySection) return;
        const ref = uniqueRecordRef('CITY');
        if (mapCore && typeof mapCore.addCity === 'function') {
          mapCore.addCity(citySection, tile, g.xPos, g.yPos, owner, ownerType, `City ${citySection.records.length + 1}`, ref);
          pushStructureAddOp('CITY', ref);
          changed = true;
        }
      });
      return changed;
    }
    if (mode === 'unit') {
      const owner = parseIntLoose(state.mapEditorTool && state.mapEditorTool.owner, 0);
      const ownerType = parseIntLoose(state.mapEditorTool && state.mapEditorTool.ownerType, 1);
      const prtoNumber = parseIntLoose(state.mapEditorTool && state.mapEditorTool.unitType, 0);
      const remove = !!(state.mapEditorTool && state.mapEditorTool.remove);
      let changed = false;
      indices.forEach((idx) => {
        const tile = tiles[idx];
        if (!tile) return;
        const g = tileGeom[idx];
        if (!g) return;
        if (remove) {
          const unitValue = parseIntLoose(getMapFieldValue(tile, 'unit_on_tile', '-1'), -1);
          setMapFieldValue(tile, 'unit_on_tile', '', 'Unit On Tile');
          if (unitValue >= 0) removeUnitByIndex(unitValue);
          changed = true;
          return;
        }
        if (!unitSection) return;
        const ref = uniqueRecordRef('UNIT');
        if (mapCore && typeof mapCore.addUnit === 'function') {
          mapCore.addUnit(unitSection, tile, g.xPos, g.yPos, owner, ownerType, prtoNumber, ref);
          pushStructureAddOp('UNIT', ref);
          changed = true;
        }
      });
      return changed;
    }
    return false;
  };

  const drawTerrainSprite = (record, _geom, sx, sy) => {
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

  const getTileAtCoord = (xPos, yPos) => {
    let x = Number(xPos);
    const y = Number(yPos);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    // Quint's calculateTileIndex always wraps X regardless of map x-wrap flag.
    // Keep neighbor lookup behavior aligned for hills/roads/irrigation/rivers/borders.
    if (width > 0) {
      x = ((x % width) + width) % width;
    }
    return tileRecordByCoord.get(`${x},${y}`) || null;
  };

  const overlayMask = (record, mask) => {
    if (!record) return false;
    const c3cOverlays = parseIntLoose(getFieldByBaseKey(record, 'c3coverlays')?.value, 0) >>> 0;
    return (c3cOverlays & mask) === mask;
  };

  const decodePackedTerrain = (rawValue) => {
    const parsed = parseIntLoose(rawValue, NaN);
    if (!Number.isFinite(parsed)) return { baseTerrain: BIQ_TERRAIN.GRASSLAND, realTerrain: BIQ_TERRAIN.GRASSLAND };
    const packed = parsed & 0xff;
    if (packed >= 0 && packed <= 0x0f) return { baseTerrain: packed, realTerrain: packed };
    return {
      baseTerrain: packed & 0x0f,
      realTerrain: (packed >>> 4) & 0x0f
    };
  };

  const terrainInfo = (record) => {
    const c3cPacked = getFieldByBaseKey(record, 'c3cbaserealterrain')?.value;
    const legacyPacked = getFieldByBaseKey(record, 'baserealterrain')?.value;
    if (String(c3cPacked || '').trim()) return decodePackedTerrain(c3cPacked);
    if (String(legacyPacked || '').trim()) return decodePackedTerrain(legacyPacked);
    return { baseTerrain: BIQ_TERRAIN.GRASSLAND, realTerrain: BIQ_TERRAIN.GRASSLAND };
  };

  const isHillyTerrain = (terrainCode) => (
    terrainCode === BIQ_TERRAIN.HILLS
    || terrainCode === BIQ_TERRAIN.MOUNTAIN
    || terrainCode === BIQ_TERRAIN.VOLCANO
  );

  const isWaterTerrain = (terrainCode) => (
    terrainCode === BIQ_TERRAIN.COAST
    || terrainCode === BIQ_TERRAIN.SEA
    || terrainCode === BIQ_TERRAIN.OCEAN
  );

  const calculateRoadImageIndex = (geom, mask) => {
    let idx = 0;
    if (overlayMask(getTileAtCoord(geom.xPos + 1, geom.yPos - 1), mask)) idx += 1;
    if (overlayMask(getTileAtCoord(geom.xPos + 2, geom.yPos), mask)) idx += 2;
    if (overlayMask(getTileAtCoord(geom.xPos + 1, geom.yPos + 1), mask)) idx += 4;
    if (overlayMask(getTileAtCoord(geom.xPos, geom.yPos + 2), mask)) idx += 8;
    if (overlayMask(getTileAtCoord(geom.xPos - 1, geom.yPos + 1), mask)) idx += 16;
    if (overlayMask(getTileAtCoord(geom.xPos - 2, geom.yPos), mask)) idx += 32;
    if (overlayMask(getTileAtCoord(geom.xPos - 1, geom.yPos - 1), mask)) idx += 64;
    if (overlayMask(getTileAtCoord(geom.xPos, geom.yPos - 2), mask)) idx += 128;
    return idx;
  };

  const calculateIrrigationIndex = (geom) => {
    let idx = 0;
    if (overlayMask(getTileAtCoord(geom.xPos + 1, geom.yPos - 1), 0x00000008)) idx += 2;
    if (overlayMask(getTileAtCoord(geom.xPos - 1, geom.yPos + 1), 0x00000008)) idx += 4;
    if (!overlayMask(getTileAtCoord(geom.xPos + 1, geom.yPos + 1), 0x00000008)) idx += 8;
    if (!overlayMask(getTileAtCoord(geom.xPos - 1, geom.yPos - 1), 0x00000008)) idx += 1;
    return idx;
  };

  const drawSheetSprite = (sheet, cols, rows, index, dx, dy) => {
    if (!sheet || !Number.isFinite(index) || index < 0) return false;
    const col = index % cols;
    const row = Math.floor(index / cols);
    if (row >= rows) return false;
    const srcW = Math.max(1, Math.floor(sheet.width / cols));
    const srcH = Math.max(1, Math.floor(sheet.height / rows));
    ctx.drawImage(sheet, col * srcW, row * srcH, srcW, srcH, dx, dy, tileW, tileH);
    return true;
  };

  const drawSheetSpriteScaled = (sheet, cols, rows, index, dx, dy, drawW, drawH) => {
    if (!sheet || !Number.isFinite(index) || index < 0) return false;
    const col = index % cols;
    const row = Math.floor(index / cols);
    if (row >= rows) return false;
    const srcW = Math.max(1, Math.floor(sheet.width / cols));
    const srcH = Math.max(1, Math.floor(sheet.height / rows));
    ctx.drawImage(sheet, col * srcW, row * srcH, srcW, srcH, dx, dy, drawW, drawH);
    return true;
  };

  const drawResourceOverlay = (record, sx, sy) => {
    const atlas = state.biqMapArtCache.resources;
    if (!atlas) return;
    const resourceId = parseIntLoose(getFieldByBaseKey(record, 'resource')?.value, -1);
    if (resourceId < 0) return;
    const iconIdx = goodIconById[resourceId];
    if (!Number.isFinite(iconIdx) || iconIdx < 0) return;
    // Quint slices resources.pcx as fixed 50x50 cells in 6 columns.
    const cols = 6;
    const cellW = 50;
    const cellH = 50;
    const col = iconIdx % cols;
    const row = Math.floor(iconIdx / cols);
    if ((col * cellW + cellW) > atlas.width || (row * cellH + cellH) > atlas.height) return;
    const tileScale = tileW / 128;
    const size = Math.max(8, Math.round(44 * tileScale));
    const dx = sx + Math.round(40 * tileScale);
    const dy = sy + Math.round(10 * tileScale);
    ctx.drawImage(atlas, col * cellW, row * cellH, cellW, cellH, dx, dy, size, size);
  };

  const drawUnitOverlay = (record, geom, screenX, screenY) => {
    const atlas = state.biqMapArtCache.units32;
    if (!atlas) return;
    const coordKey = geom ? `${geom.xPos},${geom.yPos}` : '';
    const stack = coordKey ? (unitRecordsByCoord.get(coordKey) || []) : [];
    let unitId = NaN;
    if (stack.length > 0) {
      unitId = parseIntLoose(getFieldByBaseKey(stack[0], 'prtonumber')?.value, NaN);
    }
    if (!Number.isFinite(unitId)) {
      const rawUnit = String(getFieldByBaseKey(record, 'unit_on_tile')?.value || '').trim();
      if (!rawUnit) return;
      const unitName = rawUnit.replace(/\s*\(\d+\)\s*$/, '').trim().toLowerCase();
      unitId = prtoIndexByName[unitName];
      if (!Number.isFinite(unitId)) unitId = parseIntLoose(rawUnit, NaN);
    }
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
    const tileScale = tileW / 128;
    const size = Math.max(12, Math.round(40 * tileScale));
    const dx = screenX + Math.round(48 * tileScale);
    const dy = screenY + Math.round(7 * tileScale);

    let ownerTypeRaw = '';
    let ownerRaw = '';
    if (stack.length > 0) {
      ownerTypeRaw = String(getFieldRawValue(stack[0], 'ownertype') || getFieldDisplayValue(stack[0], 'ownertype') || '');
      ownerRaw = String(getFieldRawValue(stack[0], 'owner') || getFieldDisplayValue(stack[0], 'owner') || '');
    }
    if (!ownerTypeRaw.trim()) ownerTypeRaw = String(getFieldRawValue(record, 'ownertype') || getFieldDisplayValue(record, 'ownertype') || '');
    if (!ownerRaw.trim()) ownerRaw = String(getFieldRawValue(record, 'owner') || getFieldDisplayValue(record, 'owner') || '');
    const owner = parseIndexedRef(ownerRaw);
    const civId = resolveCivIdFromOwnership(ownerTypeRaw, ownerRaw);
    const civColorIdx = Number.isFinite(raceDefaultColorById[civId]) ? raceDefaultColorById[civId] : NaN;
    const tileBorderColorIdx = parseFieldInt(record, 'bordercolor', NaN);
    const ownerSlot = Number.isFinite(civColorIdx) ? civColorIdx : (Number.isFinite(tileBorderColorIdx) ? tileBorderColorIdx : (Number.isFinite(owner) ? owner : 0));
    const ownerColor = colorFromCivSlot(ownerSlot);
    const rgbMatch = String(ownerColor || '').match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    const rgba = rgbMatch
      ? { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) }
      : { r: 170, g: 170, b: 170 };

    const unitCanvas = document.createElement('canvas');
    unitCanvas.width = cellW;
    unitCanvas.height = cellH;
    const unitCtx = unitCanvas.getContext('2d');
    unitCtx.drawImage(atlas, srcX, srcY, cellW, cellH, 0, 0, cellW, cellH);
    unitCtx.globalCompositeOperation = 'source-atop';
    unitCtx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0.48)`;
    unitCtx.fillRect(0, 0, cellW, cellH);
    unitCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(unitCanvas, 0, 0, cellW, cellH, dx, dy, size, size);

    if (size >= 10) {
      const dot = Math.max(3, Math.round(size * 0.15));
      ctx.fillStyle = `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
      ctx.beginPath();
      ctx.arc(dx + dot + 1, dy + dot + 1, dot, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (stack.length > 1 && size >= 14) {
      const label = String(stack.length);
      ctx.font = `${Math.max(8, Math.round(size * 0.36))}px sans-serif`;
      const tx = dx + size - Math.max(8, Math.round(size * 0.24));
      const ty = dy + size - 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText(label, tx, ty);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, tx, ty);
    }
  };

  const getCityRecordForTile = (record, geom) => {
    const cityId = parseIntLoose(getFieldByBaseKey(record, 'city')?.value, -1);
    if (cityId >= 0 && cityRecordById[cityId]) return cityRecordById[cityId];
    return geom ? (cityRecordByCoord.get(`${geom.xPos},${geom.yPos}`) || null) : null;
  };

  const drawCityOverlay = (record, geom, sx, sy) => {
    const cityRecord = getCityRecordForTile(record, geom);
    if (!cityRecord) return;
    const cityLevel = parseIntLoose(getFieldByBaseKey(cityRecord, 'citylevel')?.value, 0);
    const citySize = parseIntLoose(getFieldByBaseKey(cityRecord, 'size')?.value, cityLevel + 1);
    const hasWalls = parseIntLoose(getFieldByBaseKey(cityRecord, 'haswalls')?.value, 0) !== 0;
    const ownerTypeRaw = String(getFieldRawValue(cityRecord, 'ownertype') || getFieldDisplayValue(cityRecord, 'ownertype') || '');
    const ownerRaw = String(getFieldRawValue(cityRecord, 'owner') || getFieldDisplayValue(cityRecord, 'owner') || '');
    const ownerType = parseOwnerType(ownerTypeRaw);
    const owner = parseIndexedRef(ownerRaw);
    let civId = resolveCivIdFromOwnership(ownerTypeRaw, ownerRaw);
    let era = 0;
    if (ownerType === 2 && civId >= 0) {
      era = parseIntLoose(civEraById[civId], 0);
    } else if (ownerType === 3) {
      era = parseIntLoose(playerEraById[owner], 0);
    }
    const culture = Number.isFinite(raceCultureById[civId]) ? raceCultureById[civId] : 2;
    let citySizeBucket = citySize > maxCity2Size ? 2 : (citySize > maxCity1Size ? 1 : 0);
    const hasPalace = parseIntLoose(getFieldByBaseKey(cityRecord, 'haspalace')?.value, 0) !== 0;
    if (citySizeBucket < 2 && hasPalace) citySizeBucket += 1;
    const cityAge = Math.max(0, Math.min(3, era === 4 ? 3 : era));
    const cityCulture = culture < 0 ? 0 : Math.max(0, Math.min(4, culture));
    const noWallKeys = ['cityAmerc', 'cityEuro', 'cityRoman', 'cityMidEast', 'cityAsian'];
    const wallKeys = ['cityAmercWall', 'cityEuroWall', 'cityRomanWall', 'cityMidEastWall', 'cityAsianWall'];
    const sheet = state.biqMapArtCache[hasWalls ? wallKeys[cityCulture] : noWallKeys[cityCulture]];
    let drewCity = false;
    if (sheet) {
      const tileScale = tileW / 128;
      let srcX = 0;
      let srcY = 0;
      let srcW = sheet.width;
      let srcH = sheet.height;
      if (hasWalls) {
        srcH = Math.max(1, Math.floor(sheet.height / 4));
        srcY = srcH * cityAge;
      } else {
        srcW = Math.max(1, Math.floor(sheet.width / 3));
        srcH = Math.max(1, Math.floor(sheet.height / 4));
        srcX = srcW * citySizeBucket;
        srcY = srcH * cityAge;
      }
      if (srcX + srcW <= sheet.width && srcY + srcH <= sheet.height) {
        const drawW = Math.max(1, Math.round(srcW * tileScale));
        const drawH = Math.max(1, Math.round(srcH * tileScale));
        const widthOffset = Math.max(0, Math.floor((srcW - 167) / 2));
        const heightOffset = Math.max(0, Math.floor((srcH - 95) / 2));
        const dx = sx - Math.round((18 + widthOffset) * tileScale);
        const dy = sy - Math.round((18 + heightOffset) * tileScale);
        ctx.drawImage(sheet, srcX, srcY, srcW, srcH, dx, dy, drawW, drawH);
        drewCity = true;
      }
    }
  };

  const drawCityNameOverlay = (record, geom, sx, sy) => {
    if (!state.biqMapShowCityNames || tilePx < 8) return;
    const cityRecord = getCityRecordForTile(record, geom);
    if (!cityRecord) return;
    const cityName = String(getFieldByBaseKey(cityRecord, 'name')?.value || '').trim();
    if (!cityName) return;
    const tileScale = tileW / 128;
    ctx.font = `${Math.max(8, Math.round(10 * tileScale))}px sans-serif`;
    const tx = sx + Math.round(40 * tileScale);
    const ty = sy + Math.round(64 * tileScale);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeText(cityName, tx, ty);
    ctx.fillStyle = '#f3f6ff';
    ctx.fillText(cityName, tx, ty);
  };

  const parseRgbCss = (css) => {
    const m = String(css || '').match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (!m) return null;
    return { r: Number(m[1]) | 0, g: Number(m[2]) | 0, b: Number(m[3]) | 0 };
  };
  const brighterRgb = (rgb) => {
    if (!rgb) return { r: 255, g: 255, b: 255 };
    const scale = 1 / 0.7; // Java Color.brighter() scale factor.
    const minNonZero = 3;
    let r = rgb.r | 0;
    let g = rgb.g | 0;
    let b = rgb.b | 0;
    if (r === 0 && g === 0 && b === 0) return { r: minNonZero, g: minNonZero, b: minNonZero };
    if (r > 0 && r < minNonZero) r = minNonZero;
    if (g > 0 && g < minNonZero) g = minNonZero;
    if (b > 0 && b < minNonZero) b = minNonZero;
    return {
      r: Math.min(255, Math.floor(r * scale)),
      g: Math.min(255, Math.floor(g * scale)),
      b: Math.min(255, Math.floor(b * scale))
    };
  };
  const getTerritoryEdgesForColor = (slot) => {
    const cacheKey = `slot:${slot}`;
    if (state.biqMapTerritoryEdgeCache.has(cacheKey)) return state.biqMapTerritoryEdgeCache.get(cacheKey);
    const territorySheet = state.biqMapArtCache.territory;
    const ntpSheet = state.biqMapArtCache[`ntp-${slot}`];
    if (!territorySheet || !ntpSheet) return null;
    const ownerRgb = parseRgbCss(colorFromCivSlot(slot));
    if (!ownerRgb) return null;
    const brightRgb = brighterRgb(ownerRgb);
    const recolorCanvas = document.createElement('canvas');
    recolorCanvas.width = territorySheet.width;
    recolorCanvas.height = territorySheet.height;
    const recolorCtx = recolorCanvas.getContext('2d');
    recolorCtx.drawImage(territorySheet, 0, 0);
    const imageData = recolorCtx.getImageData(0, 0, recolorCanvas.width, recolorCanvas.height);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      if (r === 177 && g === 177 && b === 177) {
        px[i + 3] = 0;
        continue;
      }
      if (r === 255 && g === 0 && b === 0) {
        px[i] = ownerRgb.r; px[i + 1] = ownerRgb.g; px[i + 2] = ownerRgb.b; px[i + 3] = 255;
        continue;
      }
      if (r === 236 && g === 255 && b === 0) {
        px[i] = brightRgb.r; px[i + 1] = brightRgb.g; px[i + 2] = brightRgb.b; px[i + 3] = 255;
        continue;
      }
      if (r === 255 && g === 163 && b === 255) {
        px[i] = 0; px[i + 1] = 93; px[i + 2] = 0; px[i + 3] = 112;
        continue;
      }
      if (r === 255 && g === 218 && b === 255) {
        px[i] = 0; px[i + 1] = 36; px[i + 2] = 0; px[i + 3] = 112;
      }
    }
    recolorCtx.putImageData(imageData, 0, 0);
    const edges = new Array(8).fill(null);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const edge = document.createElement('canvas');
        edge.width = 128;
        edge.height = 72;
        const edgeCtx = edge.getContext('2d');
        edgeCtx.drawImage(recolorCanvas, col * 128, row * 72, 128, 72, 0, 0, 128, 72);
        edges[row * 2 + col] = edge;
      }
    }
    state.biqMapTerritoryEdgeCache.set(cacheKey, edges);
    return edges;
  };

  const drawTileFeatureOverlays = (record, geom, sx, sy) => {
    if (!record || !geom) return;
    const c3cOverlays = parseIntLoose(getFieldByBaseKey(record, 'c3coverlays')?.value, 0) >>> 0;
    const c3cBonuses = parseIntLoose(getFieldByBaseKey(record, 'c3cbonuses')?.value, 0) >>> 0;
    const hasRoad = (c3cOverlays & 0x00000001) === 0x00000001;
    const hasRailroad = (c3cOverlays & 0x00000002) === 0x00000002;
    const hasIrrigation = (c3cOverlays & 0x00000008) === 0x00000008;
    const hasMine = (c3cOverlays & 0x00000004) === 0x00000004;
    const hasFort = (c3cOverlays & 0x00000010) === 0x00000010;
    const riverMask = parseIntLoose(
      (getFieldByBaseKey(record, 'riverconnectioninfo') || getFieldByBaseKey(record, 'river_connection_info'))?.value,
      0
    ) >>> 0;
    const terrain = terrainInfo(record);
    const realTerrain = terrain.realTerrain;
    const baseTerrain = terrain.baseTerrain;

    const useForestOrJungleHillVariant = () => {
      const neighbors = [
        getTileAtCoord(geom.xPos + 1, geom.yPos - 1),
        getTileAtCoord(geom.xPos + 1, geom.yPos + 1),
        getTileAtCoord(geom.xPos - 1, geom.yPos + 1),
        getTileAtCoord(geom.xPos - 1, geom.yPos - 1)
      ];
      let hillyNeighborCount = 0;
      let forestNeighborCount = 0;
      let jungleNeighborCount = 0;
      neighbors.forEach((neighborRecord) => {
        if (!neighborRecord) return;
        const neighborTerrain = terrainInfo(neighborRecord).realTerrain;
        if (isHillyTerrain(neighborTerrain)) hillyNeighborCount += 1;
        else if (neighborTerrain === BIQ_TERRAIN.FOREST) forestNeighborCount += 1;
        else if (neighborTerrain === BIQ_TERRAIN.JUNGLE) jungleNeighborCount += 1;
      });
      if (forestNeighborCount === 0 && jungleNeighborCount === 0) return -1;
      if ((forestNeighborCount + jungleNeighborCount + hillyNeighborCount) < 4) return -1;
      if (forestNeighborCount > jungleNeighborCount) return BIQ_TERRAIN.FOREST;
      if (jungleNeighborCount > forestNeighborCount) return BIQ_TERRAIN.JUNGLE;
      return (geom.xPos % 2 === 0) ? BIQ_TERRAIN.FOREST : BIQ_TERRAIN.JUNGLE;
    };

    const getMountainIndex = () => {
      let idx = 0;
      const nw = getTileAtCoord(geom.xPos - 1, geom.yPos - 1);
      const ne = getTileAtCoord(geom.xPos + 1, geom.yPos - 1);
      const sw = getTileAtCoord(geom.xPos - 1, geom.yPos + 1);
      const se = getTileAtCoord(geom.xPos + 1, geom.yPos + 1);
      if (nw && isHillyTerrain(terrainInfo(nw).realTerrain)) idx += 1;
      if (ne && isHillyTerrain(terrainInfo(ne).realTerrain)) idx += 2;
      if (sw && isHillyTerrain(terrainInfo(sw).realTerrain)) idx += 4;
      if (se && isHillyTerrain(terrainInfo(se).realTerrain)) idx += 8;
      return idx;
    };

    const drawHillyTerrainOverlay = () => {
      if (!isHillyTerrain(realTerrain)) return;
      const graphicsIndex = getMountainIndex();
      const forestJungleVariant = useForestOrJungleHillVariant();
      const isLandmark = (c3cBonuses & BIQ_TILE_BONUS.LANDMARK) === BIQ_TILE_BONUS.LANDMARK;
      if (realTerrain === BIQ_TERRAIN.HILLS) {
        const drawH = Math.max(1, Math.round(72 * scale));
        const drawY = sy - Math.round(12 * scale);
        let hillSheet = state.biqMapArtCache.hills;
        if (isLandmark) hillSheet = state.biqMapArtCache.lmHills || hillSheet;
        else if (forestJungleVariant === BIQ_TERRAIN.FOREST) hillSheet = state.biqMapArtCache.forestHills || hillSheet;
        else if (forestJungleVariant === BIQ_TERRAIN.JUNGLE) hillSheet = state.biqMapArtCache.jungleHills || hillSheet;
        drawSheetSpriteScaled(hillSheet, 4, 4, graphicsIndex, sx, drawY, tileW, drawH);
        return;
      }
      const drawH = Math.max(1, Math.round(88 * scale));
      const drawY = sy - Math.round(24 * scale);
      if (realTerrain === BIQ_TERRAIN.VOLCANO) {
        let volcanoSheet = state.biqMapArtCache.volcanos;
        if (forestJungleVariant === BIQ_TERRAIN.FOREST) volcanoSheet = state.biqMapArtCache.forestVolcanos || volcanoSheet;
        else if (forestJungleVariant === BIQ_TERRAIN.JUNGLE) volcanoSheet = state.biqMapArtCache.jungleVolcanos || volcanoSheet;
        drawSheetSpriteScaled(volcanoSheet, 4, 4, graphicsIndex, sx, drawY, tileW, drawH);
        return;
      }
      let mountainSheet = state.biqMapArtCache.mountains;
      if (isLandmark) mountainSheet = state.biqMapArtCache.lmMountains || mountainSheet;
      else if ((c3cBonuses & BIQ_TILE_BONUS.SNOW_CAPPED_MOUNTAIN) === BIQ_TILE_BONUS.SNOW_CAPPED_MOUNTAIN) mountainSheet = state.biqMapArtCache.snowMountains || mountainSheet;
      else if (forestJungleVariant === BIQ_TERRAIN.FOREST) mountainSheet = state.biqMapArtCache.forestMountains || mountainSheet;
      else if (forestJungleVariant === BIQ_TERRAIN.JUNGLE) mountainSheet = state.biqMapArtCache.jungleMountains || mountainSheet;
      drawSheetSpriteScaled(mountainSheet, 4, 4, graphicsIndex, sx, drawY, tileW, drawH);
    };

    const drawWoodlandOverlay = () => {
      if (realTerrain !== BIQ_TERRAIN.FOREST && realTerrain !== BIQ_TERRAIN.JUNGLE) return;
      const tileVariant = (geom.xPos + geom.yPos) | 0;
      const drawH = Math.max(1, Math.round(88 * scale));
      const srcFromSheet = (sheet, cols, startRow, idx, cellW = 128, cellH = 88) => {
        if (!sheet) return false;
        if (!Number.isFinite(cellW) || !Number.isFinite(cellH) || cellW <= 0 || cellH <= 0) return false;
        const totalRows = Math.max(1, Math.floor(sheet.height / cellH));
        const rowOffset = startRow + Math.floor(idx / cols);
        const col = idx % cols;
        if (rowOffset < 0 || rowOffset >= totalRows) return false;
        const srcX = col * cellW;
        const srcY = rowOffset * cellH;
        if (srcX + cellW > sheet.width || srcY + cellH > sheet.height) return false;
        ctx.drawImage(sheet, srcX, srcY, cellW, cellH, sx, sy, tileW, drawH);
        return true;
      };
      if (realTerrain === BIQ_TERRAIN.JUNGLE) {
        // Quint uses the first 2x4 block from grassland forests for large jungle.
        const jungleIdx = tileVariant % 8;
        srcFromSheet(state.biqMapArtCache.grasslandForests, 4, 0, jungleIdx);
        return;
      }
      const isPine = (c3cBonuses & BIQ_TILE_BONUS.PINE_FOREST) === BIQ_TILE_BONUS.PINE_FOREST;
      if (isPine) {
        const pineIdx = tileVariant % 12;
        if (baseTerrain === BIQ_TERRAIN.PLAINS) {
          if (srcFromSheet(state.biqMapArtCache.plainsForests, 6, 8, pineIdx)) return;
        } else if (baseTerrain === BIQ_TERRAIN.TUNDRA) {
          if (srcFromSheet(state.biqMapArtCache.tundraForests, 6, 8, pineIdx)) return;
        }
        srcFromSheet(state.biqMapArtCache.grasslandForests, 6, 8, pineIdx);
        return;
      }
      const forestIdx = tileVariant % 8;
      if (baseTerrain === BIQ_TERRAIN.PLAINS) {
        if (srcFromSheet(state.biqMapArtCache.plainsForests, 4, 4, forestIdx)) return;
      } else if (baseTerrain === BIQ_TERRAIN.TUNDRA) {
        if (srcFromSheet(state.biqMapArtCache.tundraForests, 4, 4, forestIdx)) return;
      }
      srcFromSheet(state.biqMapArtCache.grasslandForests, 4, 4, forestIdx);
    };

    const hasRiverConnection = (tileRecord, directionMask) => {
      if (!tileRecord) return false;
      const rawMask = parseIntLoose(
        (getFieldByBaseKey(tileRecord, 'riverconnectioninfo') || getFieldByBaseKey(tileRecord, 'river_connection_info'))?.value,
        0
      ) >>> 0;
      return (rawMask & directionMask) === directionMask;
    };

    const getRiverImageIndex = (northTile, eastTile, westTile, southTile) => {
      let idx = 0;
      if (northTile && hasRiverConnection(northTile, 32)) idx += 1;
      if (eastTile && hasRiverConnection(eastTile, 128)) idx += 2;
      if (westTile && hasRiverConnection(westTile, 8)) idx += 4;
      if (southTile && hasRiverConnection(southTile, 2)) idx += 8;
      return idx;
    };

    const isRiverDelta = (riverImageIndex, westTile, northTile, eastTile, southTile) => {
      if (riverImageIndex !== 1 && riverImageIndex !== 2 && riverImageIndex !== 4 && riverImageIndex !== 8) return false;
      if (!westTile || !northTile || !eastTile || !southTile) return false;
      const westWater = isWaterTerrain(terrainInfo(westTile).realTerrain);
      const northWater = isWaterTerrain(terrainInfo(northTile).realTerrain);
      const eastWater = isWaterTerrain(terrainInfo(eastTile).realTerrain);
      const southWater = isWaterTerrain(terrainInfo(southTile).realTerrain);
      if (riverImageIndex === 1) return eastWater && southWater;
      if (riverImageIndex === 2) return westWater && southWater;
      if (riverImageIndex === 4) return northWater && eastWater;
      return westWater && northWater;
    };

    const drawRivers = () => {
      if (riverMask === 0) return;
      if (geom.xPos === 1) {
        const northTile = getTileAtCoord(geom.xPos - 1, geom.yPos - 1);
        const eastTile = record;
        const southTile = getTileAtCoord(geom.xPos - 1, geom.yPos + 1);
        const riverImageIndex = getRiverImageIndex(northTile, eastTile, null, southTile);
        if (riverImageIndex !== 0) {
          drawSheetSprite(state.biqMapArtCache.mtnRivers, 4, 4, riverImageIndex, sx - stepX, sy);
        }
      }
      {
        const northTile = getTileAtCoord(geom.xPos + 1, geom.yPos - 1);
        const eastTile = getTileAtCoord(geom.xPos + 2, geom.yPos);
        const southTile = getTileAtCoord(geom.xPos + 1, geom.yPos + 1);
        const westTile = record;
        const riverImageIndex = getRiverImageIndex(northTile, eastTile, westTile, southTile);
        if (riverImageIndex !== 0) {
          const isDelta = isRiverDelta(riverImageIndex, westTile, northTile, eastTile, southTile);
          drawSheetSprite(
            isDelta ? (state.biqMapArtCache.deltaRivers || state.biqMapArtCache.mtnRivers) : state.biqMapArtCache.mtnRivers,
            4,
            4,
            riverImageIndex,
            sx + stepX,
            sy
          );
        }
      }
    };

  const drawTerritoryBorders = () => {
      const ownerInfo = resolveTileTerritoryInfo(record);
      if (!ownerInfo.hasOwner) return;
      const borderRaw = getFieldRawValue(record, 'bordercolor') || getFieldDisplayValue(record, 'bordercolor');
      let borderColorId = parseIntLoose(borderRaw, NaN);
      const derivedFromBorderTag = String(ownerInfo.ownerKey || '').startsWith('border:');
      if (derivedFromBorderTag && borderColorId === 0) borderColorId = NaN;
      if (!Number.isFinite(borderColorId) && ownerInfo.civId >= 0) borderColorId = parseIntLoose(raceDefaultColorById[ownerInfo.civId], NaN);
      if (!Number.isFinite(borderColorId) && Number.isFinite(ownerInfo.borderTag) && ownerInfo.borderTag > 0) borderColorId = ownerInfo.borderTag % 32;
      if (!Number.isFinite(borderColorId)) borderColorId = 0;
      borderColorId = ((borderColorId % 32) + 32) % 32;
      const hasDifferentOwner = (neighborRecord) => {
        if (!neighborRecord) return false;
        const neighborInfo = resolveTileTerritoryInfo(neighborRecord);
        if (!neighborInfo.hasOwner) return true;
        return neighborInfo.ownerKey !== ownerInfo.ownerKey;
      };
      const nwBorder = hasDifferentOwner(getTileAtCoord(geom.xPos - 1, geom.yPos - 1));
      const neBorder = hasDifferentOwner(getTileAtCoord(geom.xPos + 1, geom.yPos - 1));
      const swBorder = hasDifferentOwner(getTileAtCoord(geom.xPos - 1, geom.yPos + 1));
      const seBorder = hasDifferentOwner(getTileAtCoord(geom.xPos + 1, geom.yPos + 1));
      if (!nwBorder && !neBorder && !swBorder && !seBorder) return;
      const edges = getTerritoryEdgesForColor(borderColorId);
      if (!edges) return;
      const drawY = sy - Math.round(12 * scale);
      const drawH = Math.max(1, Math.round(72 * scale));
      if (nwBorder && edges[0]) ctx.drawImage(edges[0], 0, 0, 128, 72, sx, drawY, tileW, drawH);
      if (neBorder && edges[2]) ctx.drawImage(edges[2], 0, 0, 128, 72, sx, drawY, tileW, drawH);
      if (swBorder && edges[4]) ctx.drawImage(edges[4], 0, 0, 128, 72, sx, drawY, tileW, drawH);
      if (seBorder && edges[6]) ctx.drawImage(edges[6], 0, 0, 128, 72, sx, drawY, tileW, drawH);
    };

    drawWoodlandOverlay();
    drawHillyTerrainOverlay();
    if (hasRoad) {
      const idx = calculateRoadImageIndex(geom, 0x00000001);
      drawSheetSprite(state.biqMapArtCache.roads, 16, 16, idx, sx, sy);
    }
    if (hasRailroad) {
      const idx = calculateRoadImageIndex(geom, 0x00000002);
      drawSheetSprite(state.biqMapArtCache.railroads || state.biqMapArtCache.roads, 16, 16, idx, sx, sy);
    }
    if (hasIrrigation) {
      const idx = calculateIrrigationIndex(geom);
      let key = 'irrigationGrass';
      if (baseTerrain === BIQ_TERRAIN.DESERT) key = 'irrigationDesert';
      else if (baseTerrain === BIQ_TERRAIN.PLAINS) key = 'irrigationPlains';
      else if (baseTerrain === BIQ_TERRAIN.TUNDRA) key = 'irrigationTundra';
      drawSheetSprite(state.biqMapArtCache[key], 4, 4, idx, sx, sy);
    }
    if (hasMine || hasFort) {
      const sheet = state.biqMapArtCache.terrainBuildings;
      if (sheet) {
        const cols = sheet.width >= 512 ? 4 : 3;
        const rows = 4;
        if (hasMine) drawSheetSprite(sheet, cols, rows, 6, sx, sy);
        if (hasFort) drawSheetSprite(sheet, cols, rows, 0, sx, sy);
      }
    }
    drawRivers();
    drawTerritoryBorders();
  };

  const drawDistrictOverlay = (record, sx, sy) => {
    const districtRaw = getMapFieldValue(record, 'district', '');
    if (!districtRaw) return;
    const parts = districtRaw.split(',').map((p) => parseIntLoose(p, 0));
    const districtType = Number.isFinite(parts[0]) ? parts[0] : 0;
    const cx = sx + Math.floor(tileW / 2);
    const cy = sy + Math.floor(tileH / 2);
    const radius = Math.max(3, Math.floor(tilePx / 4));
    ctx.fillStyle = `hsl(${(districtType * 47) % 360} 70% 52% / 0.85)`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 18, 36, 0.85)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawFogOverlay = (record, sx, sy) => {
    const fog = parseIntLoose(getMapFieldValue(record, 'fogofwar', '1'), 1);
    if (fog !== 0) return;
    ctx.fillStyle = 'rgba(20, 26, 40, 0.34)';
    ctx.beginPath();
    ctx.moveTo(sx + Math.floor(tileW / 2), sy);
    ctx.lineTo(sx + tileW, sy + Math.floor(tileH / 2));
    ctx.lineTo(sx + Math.floor(tileW / 2), sy + tileH);
    ctx.lineTo(sx, sy + Math.floor(tileH / 2));
    ctx.closePath();
    ctx.fill();
  };

  const selGeom = tileGeom[state.biqMapSelectedTile] || { xPos: 0, yPos: 0 };
  const selPosRaw = tileToScreenTopLeft(selGeom.xPos, selGeom.yPos);
  const selPos = { sx: selPosRaw.sx + originX, sy: selPosRaw.sy + originY };
  const drawWrapOffsets = xWrap
    ? Array.from({ length: (wrapCopyRadius * 2) + 1 }, (_v, i) => (i - wrapCopyRadius) * worldWrapSpan)
    : [0];
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

  const overlayPassItems = [];
  for (let i = 0; i <= maxIdx; i += 1) {
    const record = tiles[i];
    const geom = tileGeom[i];
    const basePosRaw = tileToScreenTopLeft(geom.xPos, geom.yPos);
    const basePos = { sx: basePosRaw.sx + originX, sy: basePosRaw.sy + originY };
    const terrain = terrainInfo(record).baseTerrain;
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
      if (state.biqMapLayer === 'terrain') drewSprite = drawTerrainSprite(record, geom, sx, sy);
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
      overlayPassItems.push({ record, geom, sx, sy });
    }
  }

  for (let i = 0; i < overlayPassItems.length; i += 1) {
    const item = overlayPassItems[i];
    if (state.biqMapLayer === 'terrain' && tilePx >= 4 && state.biqMapShowOverlays) {
      drawTileFeatureOverlays(item.record, item.geom, item.sx, item.sy);
      drawCityOverlay(item.record, item.geom, item.sx, item.sy);
      drawResourceOverlay(item.record, item.sx, item.sy);
      drawDistrictOverlay(item.record, item.sx, item.sy);
      drawUnitOverlay(item.record, item.geom, item.sx, item.sy);
      drawFogOverlay(item.record, item.sx, item.sy);
    }
    if (state.biqMapShowGrid && tilePx >= 5) {
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(item.sx + Math.floor(tileW / 2), item.sy);
      ctx.lineTo(item.sx + tileW, item.sy + Math.floor(tileH / 2));
      ctx.lineTo(item.sx + Math.floor(tileW / 2), item.sy + tileH);
      ctx.lineTo(item.sx, item.sy + Math.floor(tileH / 2));
      ctx.closePath();
      ctx.stroke();
    }
  }

  if (state.biqMapLayer === 'terrain' && tilePx >= 4 && state.biqMapShowOverlays) {
    for (let i = 0; i < overlayPassItems.length; i += 1) {
      const item = overlayPassItems[i];
      drawCityNameOverlay(item.record, item.geom, item.sx, item.sy);
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

  let paintStroke = null;
  const readHitFromPointer = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    return findTileAtCanvasPx(px, py, true);
  };
  const applyAtPointer = (ev) => {
    const hit = readHitFromPointer(ev);
    if (!hit) return false;
    if (!paintStroke) paintStroke = { touched: new Set(), didEdit: false };
    if (paintStroke.touched.has(hit.index)) return false;
    paintStroke.touched.add(hit.index);
    const didEdit = applyBrushAtIndex(hit.index);
    if (didEdit) {
      state.biqMapSelectedTile = hit.index;
      paintStroke.didEdit = true;
    }
    return didEdit;
  };

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    const mode = String(state.mapEditorTool && state.mapEditorTool.mode || 'select');
    if (!isScenarioMode() || mode === 'select') return;
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    paintStroke = { touched: new Set(), didEdit: false };
    rememberUndoSnapshot();
    const changed = applyAtPointer(ev);
    if (changed) rerenderMapView();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!paintStroke) return;
    ev.preventDefault();
    const changed = applyAtPointer(ev);
    if (changed) rerenderMapView();
  });
  const onPaintEnd = (ev) => {
    if (!paintStroke) return;
    if (paintStroke.didEdit) setDirty(true);
    paintStroke = null;
    if (ev && typeof ev.pointerId === 'number') {
      try { canvas.releasePointerCapture(ev.pointerId); } catch (_err) {}
    }
  };
  canvas.addEventListener('pointerup', onPaintEnd);
  canvas.addEventListener('pointercancel', onPaintEnd);

  canvas.addEventListener('click', (ev) => {
    if (Date.now() < (state.biqMapSuppressClickUntilTs || 0)) {
      return;
    }
    const mode = String(state.mapEditorTool && state.mapEditorTool.mode || 'select');
    const hit = readHitFromPointer(ev);
    if (isScenarioMode() && mode === 'relocate_city') {
      if (hit && Number.isFinite(state.mapEditorTool.relocateCityIndex)) {
        rememberUndoSnapshot();
        if (relocateCityToTile(state.mapEditorTool.relocateCityIndex, hit.index, false)) {
          state.mapEditorTool.mode = 'select';
          delete state.mapEditorTool.relocateCityIndex;
          setDirty(true);
          rerenderMapView();
        }
      }
      return;
    }
    if (isScenarioMode() && mode === 'relocate_city_units') {
      if (hit && Number.isFinite(state.mapEditorTool.relocateCityIndex)) {
        rememberUndoSnapshot();
        if (relocateCityToTile(state.mapEditorTool.relocateCityIndex, hit.index, true)) {
          state.mapEditorTool.mode = 'select';
          delete state.mapEditorTool.relocateCityIndex;
          setDirty(true);
          rerenderMapView();
        }
      }
      return;
    }
    if (isScenarioMode() && mode !== 'select') return;
    if (hit) {
      state.biqMapSelectedTile = hit.index;
      const g = tileGeom[hit.index] || null;
      appendDebugLog('biq-map:tile-select', { index: hit.index, xPos: g ? g.xPos : null, yPos: g ? g.yPos : null });
    } else {
      appendDebugLog('biq-map:tile-select-miss', {});
    }
    rerenderMapView();
  });
  canvas.addEventListener('dblclick', (ev) => {
    ev.preventDefault();
    const paneRect = mapPane.getBoundingClientRect();
    const paneX = ev.clientX - paneRect.left;
    const paneY = ev.clientY - paneRect.top;
    const canvasRect = canvas.getBoundingClientRect();
    const canvasX = ((ev.clientX - canvasRect.left) / Math.max(1, canvasRect.width)) * canvas.width;
    const canvasY = ((ev.clientY - canvasRect.top) / Math.max(1, canvasRect.height)) * canvas.height;
    const hovered = typeof findTileAtCanvasPx === 'function'
      ? findTileAtCanvasPx(canvasX, canvasY, false)
      : null;
    const anchorContent = hovered
      ? { x: hovered.centerX, y: hovered.centerY }
      : null;
    setMapZoom(stepZoomLevel(Number(state.biqMapZoom || 6), 1), 'double-click', paneX, paneY, anchorContent);
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
      setMapPaneScroll(targetLeft, targetTop, { reason: 'zoom-anchor', logWhenNoHorizontal: true });
      state.biqMapScrollLeft = mapPane.scrollLeft;
      state.biqMapScrollTop = mapPane.scrollTop;
      state.biqMapZoomAnchor = null;
      return;
    }
    if (Number.isFinite(state.biqMapScrollLeft) && Number.isFinite(state.biqMapScrollTop)) {
      setMapPaneScroll(state.biqMapScrollLeft, state.biqMapScrollTop, { reason: 'restore-scroll' });
      return;
    }
    const targetLeft = Math.max(0, sx + Math.floor(tileW / 2) - Math.floor(mapPane.clientWidth / 2));
    const targetTop = Math.max(0, sy + Math.floor(tileH / 2) - Math.floor(mapPane.clientHeight / 2));
    setMapPaneScroll(targetLeft, targetTop, { reason: 'init-scroll' });
    state.biqMapScrollLeft = mapPane.scrollLeft;
    state.biqMapScrollTop = mapPane.scrollTop;
    appendDebugLog('biq-map:init-scroll', {
      left: mapPane.scrollLeft,
      top: mapPane.scrollTop,
      ...getPaneMetrics()
    });
  });

  if (floatingUi) {
    return container;
  }

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
      rememberUndoSnapshot();
      setMapFieldValue(selectedTile, key, input.value.trim(), label);
      setDirty(true);
      rerenderMapView();
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
  const riverMaskField = getFieldByBaseKey(selectedTile, 'riverconnectioninfo') || getFieldByBaseKey(selectedTile, 'river_connection_info');
  const bonusesField = getFieldByBaseKey(selectedTile, 'c3cbonuses') || getFieldByBaseKey(selectedTile, 'c3c_bonuses');
  const riverMaskValue = parseIntLoose(riverMaskField && riverMaskField.value, 0);
  const bonusesValue = parseIntLoose(bonusesField && bonusesField.value, 0);
  const riverCard = document.createElement('div');
  riverCard.className = 'section-card';
  const riverHeader = document.createElement('div');
  riverHeader.className = 'section-top';
  riverHeader.innerHTML = '<strong>Rivers</strong><span class="hint">Edge and standalone river flags</span>';
  riverCard.appendChild(riverHeader);
  const riverGrid = document.createElement('div');
  riverGrid.className = 'kv-grid';
  const addRiverToggle = (label, sourceKey, mask) => {
    const row = document.createElement('label');
    row.className = 'bool-toggle';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = sourceKey === 'riverconnectioninfo'
      ? (riverMaskValue & mask) === mask
      : (bonusesValue & mask) === mask;
    check.disabled = !isScenarioMode();
    const text = document.createElement('span');
    text.textContent = label;
    check.addEventListener('change', () => {
      if (!isScenarioMode()) return;
      rememberUndoSnapshot();
      const current = parseIntLoose(getMapFieldValue(selectedTile, sourceKey, '0'), 0);
      const next = check.checked ? (current | mask) : (current & ~mask);
      setMapFieldValue(selectedTile, sourceKey, String(next), label);
      setDirty(true);
      rerenderMapView();
    });
    row.appendChild(check);
    row.appendChild(text);
    riverGrid.appendChild(row);
  };
  addRiverToggle('Border NW', 'riverconnectioninfo', 128);
  addRiverToggle('Border NE', 'riverconnectioninfo', 2);
  addRiverToggle('Border SW', 'riverconnectioninfo', 32);
  addRiverToggle('Border SE', 'riverconnectioninfo', 8);
  addRiverToggle('Standalone North', 'c3cbonuses', 256);
  addRiverToggle('Standalone East', 'c3cbonuses', 1024);
  addRiverToggle('Standalone South', 'c3cbonuses', 2048);
  addRiverToggle('Standalone West', 'c3cbonuses', 512);
  riverCard.appendChild(riverGrid);
  inspector.appendChild(fieldsGrid);
  inspector.appendChild(riverCard);

  const addLinkedRecordEditor = (sectionCode, tileKey, displayName, editableFields, onDelete, onRenderExtra) => {
    const section = (tab.sections || []).find((s) => s.code === sectionCode);
    const rawRef = parseIntLoose(getMapFieldValue(selectedTile, tileKey, '-1'), -1);
    if (!section || rawRef < 0) return;
    const records = Array.isArray(section.records) ? section.records : [];
    const record = records.find((entry) => Number(entry && entry.index) === rawRef);
    if (!record) return;
    const card = document.createElement('div');
    card.className = 'section-card';
    const top = document.createElement('div');
    top.className = 'section-top';
    const title = String(getFieldByBaseKey(record, 'name')?.value || `${displayName} ${rawRef}`);
    top.innerHTML = `<strong>${displayName}: ${title}</strong><span class="hint">Index ${rawRef}</span>`;
    card.appendChild(top);
    const grid = document.createElement('div');
    grid.className = 'kv-grid';
    editableFields.forEach(({ key, label, type }) => {
      const row = document.createElement('div');
      row.className = 'kv-row compact';
      const name = document.createElement('div');
      name.className = 'field-meta';
      name.textContent = label;
      let input;
      if (type === 'select' && key === 'ownertype') {
        input = document.createElement('select');
        [
          { value: '0', label: 'None' },
          { value: '1', label: 'Barbarians' },
          { value: '3', label: 'Player' },
          { value: '2', label: 'Civilization' }
        ].forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          input.appendChild(o);
        });
      } else {
        input = document.createElement('input');
        input.type = type === 'number' ? 'number' : 'text';
      }
      input.value = String(getFieldByBaseKey(record, key)?.value || '');
      input.disabled = !isScenarioMode();
      input.addEventListener('change', () => {
        if (!isScenarioMode()) return;
        rememberUndoSnapshot();
        setMapFieldValue(record, key, input.value.trim(), label);
        setDirty(true);
        rerenderMapView();
      });
      row.appendChild(name);
      row.appendChild(input);
      grid.appendChild(row);
    });
    card.appendChild(grid);
    if (typeof onRenderExtra === 'function') {
      onRenderExtra({ card, record, rawRef, grid });
    }
    if (isScenarioMode() && typeof onDelete === 'function') {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger';
      deleteBtn.textContent = `Delete ${displayName}`;
      deleteBtn.addEventListener('click', () => {
        rememberUndoSnapshot();
        if (onDelete(rawRef)) {
          setDirty(true);
          rerenderMapView();
        }
      });
      card.appendChild(deleteBtn);
    }
    inspector.appendChild(card);
  };
  addLinkedRecordEditor(
    'CITY',
    'city',
    'City',
    [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'size', label: 'Size', type: 'number' },
      { key: 'culture', label: 'Culture', type: 'number' },
      { key: 'owner', label: 'Owner', type: 'number' },
      { key: 'ownertype', label: 'Owner Type', type: 'select' },
      { key: 'citylevel', label: 'City Level', type: 'number' }
    ],
    removeCityByIndex,
    ({ card, record, rawRef }) => {
      if (!isScenarioMode()) return;
      const actions = document.createElement('div');
      actions.className = 'inline-btn-row';
      const relocateCityBtn = document.createElement('button');
      relocateCityBtn.type = 'button';
      relocateCityBtn.className = 'ghost';
      relocateCityBtn.textContent = 'Relocate City';
      relocateCityBtn.addEventListener('click', () => {
        state.mapEditorTool.mode = 'relocate_city';
        state.mapEditorTool.relocateCityIndex = rawRef;
      });
      const relocateStackBtn = document.createElement('button');
      relocateStackBtn.type = 'button';
      relocateStackBtn.className = 'ghost';
      relocateStackBtn.textContent = 'Relocate City + Units';
      relocateStackBtn.addEventListener('click', () => {
        state.mapEditorTool.mode = 'relocate_city_units';
        state.mapEditorTool.relocateCityIndex = rawRef;
      });
      actions.appendChild(relocateCityBtn);
      actions.appendChild(relocateStackBtn);
      card.appendChild(actions);

      const bldgSection = (tab.sections || []).find((s) => s.code === 'BLDG');
      const bldgRecords = bldgSection && Array.isArray(bldgSection.records) ? bldgSection.records : [];
      if (bldgRecords.length === 0) return;
      const currentSet = new Set(
        (Array.isArray(record.fields) ? record.fields : [])
          .filter((field) => String((field.baseKey || field.key) || '').trim().toLowerCase() === 'building')
          .map((field) => parseIntLoose(field.value, -1))
          .filter((value) => value >= 0)
      );
      const wrap = document.createElement('div');
      wrap.className = 'section-card';
      wrap.innerHTML = '<div class="section-top"><strong>City Improvements</strong><span class="hint">Toggle buildings present in this city</span></div>';
      const chips = document.createElement('div');
      chips.className = 'segmented-multi-list';
      const applyBuildings = () => {
        if (!isScenarioMode()) return;
        const chosen = Array.from(currentSet).sort((a, b) => a - b);
        const baseFields = (Array.isArray(record.fields) ? record.fields : []).filter((field) => {
          const key = String((field.baseKey || field.key) || '').trim().toLowerCase();
          return key !== 'building';
        });
        chosen.forEach((buildingId) => {
          baseFields.push({
            key: 'building',
            baseKey: 'building',
            label: 'Building',
            value: String(buildingId),
            originalValue: ''
          });
        });
        record.fields = baseFields;
        setMapFieldValue(record, 'numbuildings', String(chosen.length), 'Number of Buildings');
        setMapFieldValue(record, 'buildings', chosen.join(','), 'Buildings');
      };
      bldgRecords.forEach((buildingRecord, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'segmented-multi-btn';
        btn.classList.toggle('active', currentSet.has(idx));
        btn.textContent = String(buildingRecord && buildingRecord.name || `Building ${idx}`);
        btn.addEventListener('click', () => {
          if (!isScenarioMode()) return;
          rememberUndoSnapshot();
          if (currentSet.has(idx)) currentSet.delete(idx);
          else currentSet.add(idx);
          btn.classList.toggle('active', currentSet.has(idx));
          applyBuildings();
          setDirty(true);
        });
        chips.appendChild(btn);
      });
      wrap.appendChild(chips);
      card.appendChild(wrap);
    }
  );
  addLinkedRecordEditor(
    'UNIT',
    'unit_on_tile',
    'Unit',
    [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'prtonumber', label: 'Unit Type Index', type: 'number' },
      { key: 'owner', label: 'Owner', type: 'number' },
      { key: 'ownertype', label: 'Owner Type', type: 'select' },
      { key: 'experiencelevel', label: 'Experience', type: 'number' }
    ],
    removeUnitByIndex
  );
  const unitsAtTile = listUnitsAtCoords(inspectorPos.xPos, inspectorPos.yPos);
  if (unitSection && Array.isArray(unitSection.records)) {
    const unitListCard = document.createElement('div');
    unitListCard.className = 'section-card';
    unitListCard.innerHTML = `<div class="section-top"><strong>Units On Tile</strong><span class="hint">${unitsAtTile.length} unit(s)</span></div>`;
    const list = document.createElement('div');
    list.className = 'kv-grid';
    const prtoSection = (tab.sections || []).find((s) => s.code === 'PRTO');
    const prtoRecords = prtoSection && Array.isArray(prtoSection.records) ? prtoSection.records : [];
    unitsAtTile.forEach((unitRecord, rowIdx) => {
      const idx = Number(unitRecord && unitRecord.index);
      const row = document.createElement('div');
      row.className = 'kv-row';
      const label = document.createElement('div');
      label.className = 'field-meta';
      label.textContent = `Unit ${rowIdx + 1} (#${idx})`;
      row.appendChild(label);
      const controls = document.createElement('div');
      controls.className = 'inline-btn-row';
      const unitTypeSelectWrap = document.createElement('div');
      unitTypeSelectWrap.className = 'map-inline-select';
      const typeSelect = document.createElement('select');
      prtoRecords.forEach((prto, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = String(prto && prto.name || `Unit ${i}`);
        typeSelect.appendChild(o);
      });
      typeSelect.value = String(parseIntLoose(getFieldByBaseKey(unitRecord, 'prtonumber')?.value, 0));
      typeSelect.disabled = !isScenarioMode();
      typeSelect.addEventListener('change', () => {
        if (!isScenarioMode()) return;
        rememberUndoSnapshot();
        setMapFieldValue(unitRecord, 'prtonumber', typeSelect.value, 'Unit');
        setDirty(true);
      });
      unitTypeSelectWrap.appendChild(typeSelect);
      attachMapSelectIcon(unitTypeSelectWrap, typeSelect, (value) => {
        const unitIdx = parseIntLoose(value, 0);
        const rec = prtoRecords[unitIdx] || null;
        const title = rec ? String(rec.name || `Unit ${unitIdx}`) : `Unit ${unitIdx}`;
        const iconIdx = parseIntLoose(getFieldByBaseKey(rec, 'iconindex')?.value, -1);
        if (Number.isFinite(iconIdx) && iconIdx >= 0) {
          return makeMapAtlasSpriteIcon('units32', 32, 32, iconIdx, title);
        }
        return makeMapGlyphIcon('⚔', title, 'resource');
      });
      controls.appendChild(unitTypeSelectWrap);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'danger';
      del.textContent = 'Delete';
      del.disabled = !isScenarioMode();
      del.addEventListener('click', () => {
        if (!isScenarioMode()) return;
        rememberUndoSnapshot();
        if (removeUnitByIndex(idx)) {
          setDirty(true);
          rerenderMapView();
        }
      });
      controls.appendChild(del);
      row.appendChild(controls);
      list.appendChild(row);
    });
    if (isScenarioMode()) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'secondary';
      add.textContent = 'Add Unit Here';
      add.addEventListener('click', () => {
        rememberUndoSnapshot();
        const ref = uniqueRecordRef('UNIT');
        const owner = parseIntLoose(state.mapEditorTool && state.mapEditorTool.owner, 0);
        const ownerType = parseIntLoose(state.mapEditorTool && state.mapEditorTool.ownerType, 1);
        const prtoNumber = parseIntLoose(state.mapEditorTool && state.mapEditorTool.unitType, 0);
        if (mapCore && typeof mapCore.addUnit === 'function') {
          mapCore.addUnit(unitSection, selectedTile, inspectorPos.xPos, inspectorPos.yPos, owner, ownerType, prtoNumber, ref);
          pushStructureAddOp('UNIT', ref);
          setDirty(true);
          rerenderMapView();
        }
      });
      unitListCard.appendChild(add);
    }
    unitListCard.appendChild(list);
    inspector.appendChild(unitListCard);
  }
  if (floatingUi && floatingRight) {
    floatingRight.appendChild(inspector);
  } else {
    container.appendChild(inspector);
  }

  return container;
}

function createFieldInput(schemaField, value, onChange) {
  if (schemaField.type === 'bool') {
    const wrap = document.createElement('label');
    wrap.className = 'bool-toggle';
    const check = document.createElement('input');
    check.type = 'checkbox';
    const normalized = String(value == null ? '' : value).trim().toLowerCase();
    check.checked = normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
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
    const formatSelectOptionLabel = (optValue) => {
      const raw = String(optValue == null ? '' : optValue).trim();
      if (!raw) return raw;
      if (state.activeTab === 'animations' && String(schemaField && schemaField.key || '').trim() === 'type') {
        return raw
          .split(/[-_\s]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      }
      return raw;
    };
    const options = schemaField.options || [];
    options.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = formatSelectOptionLabel(opt);
      select.appendChild(o);
    });
    const hasCurrent = options.some((opt) => String(opt) === String(value || ''));
    if (!hasCurrent && value) {
      const current = document.createElement('option');
      current.value = value;
      current.textContent = formatSelectOptionLabel(value);
      select.appendChild(current);
    }
    select.value = value || '';
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  const keyLower = String(schemaField && schemaField.key || '').toLowerCase();
  const isPathField = keyLower.includes('path') || keyLower.includes('file');
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
    browse.textContent = 'Browse';
    browse.addEventListener('click', async () => {
      const pickerOptions = getFilePickerOptionsForSectionField(schemaField, input.value);
      const filePath = await window.c3xManager.pickFile(pickerOptions);
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

function makeSegmentedMultiValueEditor(options, values, onValuesChange, fieldKey = '', config = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'segmented-multi-list';
  const showTokenIcon = config.showTokenIcon !== false;
  const iconRenderer = typeof config.iconRenderer === 'function' ? config.iconRenderer : null;
  const baseOptions = Array.isArray(options) ? options.map((opt) => String(opt || '').trim()).filter(Boolean) : [];
  const selectedValues = (Array.isArray(values) ? values : []).map((v) => String(v || '').trim()).filter(Boolean);
  const optionSet = new Set(baseOptions);
  selectedValues.forEach((value) => optionSet.add(value));
  const optionList = Array.from(optionSet);
  const selected = new Set(selectedValues);
  optionList.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'segmented-multi-btn';
    const text = document.createElement('span');
    text.textContent = opt;
    if (iconRenderer) {
      const customIcon = iconRenderer(opt, fieldKey);
      if (customIcon) btn.appendChild(customIcon);
    } else if (showTokenIcon) {
      const icon = document.createElement('span');
      icon.className = 'segmented-multi-icon';
      icon.style.background = getTokenColor(opt, fieldKey);
      btn.appendChild(icon);
    }
    btn.appendChild(text);
    btn.classList.toggle('active', selected.has(opt));
    btn.addEventListener('click', () => {
      if (selected.has(opt)) selected.delete(opt);
      else selected.add(opt);
      btn.classList.toggle('active', selected.has(opt));
      if (onValuesChange) onValuesChange(optionList.filter((entry) => selected.has(entry)));
    });
    wrap.appendChild(btn);
  });
  return wrap;
}

function makeSegmentedSingleValueEditor(options, value, onValueChange, fieldKey = '', config = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'segmented-multi-list';
  const showTokenIcon = config.showTokenIcon !== false;
  const iconRenderer = typeof config.iconRenderer === 'function' ? config.iconRenderer : null;
  const includeEmpty = config.includeEmpty !== false;
  const emptyLabel = String(config.emptyLabel || '(not set)');
  const selected = String(value || '').trim();
  const optionSet = new Set((Array.isArray(options) ? options : []).map((opt) => String(opt || '').trim()).filter(Boolean));
  if (selected) optionSet.add(selected);
  const optionList = Array.from(optionSet);
  if (includeEmpty) optionList.unshift('');
  optionList.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'segmented-multi-btn';
    const text = document.createElement('span');
    text.textContent = opt || emptyLabel;
    if (opt) {
      let usedCustomIcon = false;
      if (iconRenderer) {
        const customIcon = iconRenderer(opt, fieldKey);
        if (customIcon) {
          btn.appendChild(customIcon);
          usedCustomIcon = true;
        }
      }
      if (!usedCustomIcon && showTokenIcon) {
        const icon = document.createElement('span');
        icon.className = 'segmented-multi-icon';
        icon.style.background = getTokenColor(opt, fieldKey);
        btn.appendChild(icon);
      }
    }
    btn.appendChild(text);
    btn.classList.toggle('active', opt === selected);
    btn.addEventListener('click', () => {
      Array.from(wrap.querySelectorAll('.segmented-multi-btn')).forEach((node) => node.classList.remove('active'));
      btn.classList.add('active');
      if (onValueChange) onValueChange(opt);
    });
    wrap.appendChild(btn);
  });
  return wrap;
}

function makeDistrictImagePathPreview(pathValue) {
  const holder = document.createElement('button');
  holder.type = 'button';
  holder.className = 'inline-path-preview';
  holder.title = 'Open preview';
  const canvas = document.createElement('canvas');
  canvas.className = 'entry-thumb-canvas';
  canvas.width = 30;
  canvas.height = 30;
  holder.appendChild(canvas);
  const cleanedPath = String(pathValue || '').trim().replace(/^"|"$/g, '');
  if (!cleanedPath) {
    holder.disabled = true;
    return holder;
  }
  window.c3xManager.getPreview({
    kind: 'district',
    c3xPath: state.settings && state.settings.c3xPath,
    fileName: cleanedPath
  }).then((res) => {
    if (!res || !res.ok || !holder.isConnected) return;
    drawPreviewFrameToCanvas(res, canvas);
    holder.disabled = false;
    holder.addEventListener('click', (ev) => {
      ev.preventDefault();
      openArtFocusWithPreview(res, cleanedPath, res.sourcePath || cleanedPath);
    });
  }).catch(() => {
    holder.disabled = true;
  });
  return holder;
}

function getTokenColor(token, fieldKey = '') {
  const seed = `${String(fieldKey || '').toLowerCase()}|${String(token || '').toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 48%)`;
}

function getDistrictPreviewSpec(section) {
  const firstPath = tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths'))
    .map((v) => String(v || '').trim().replace(/^"|"$/g, ''))
    .find(Boolean);
  if (!firstPath) return null;
  const customW = Number.parseInt(getFieldValue(section, 'custom_width') || '', 10);
  const customH = Number.parseInt(getFieldValue(section, 'custom_height') || '', 10);
  const cellW = Number.isFinite(customW) && customW > 0 ? customW : 128;
  const cellH = Number.isFinite(customH) && customH > 0 ? customH : 64;
  const varyByEra = getFieldValue(section, 'vary_img_by_era') === '1';
  return { fileName: firstPath, cellW, cellH, varyByEra };
}

function findLastNonTransparentDistrictRow(preview, spec) {
  if (!preview || !preview.ok || !preview.rgbaBase64 || !spec) return 0;
  const rgba = fromBase64ToUint8(preview.rgbaBase64);
  const width = Number(preview.width) || 0;
  const height = Number(preview.height) || 0;
  if (!width || !height) return 0;
  const maxRowsFromImage = Math.max(1, Math.floor(height / spec.cellH));
  const rowsToCheck = spec.varyByEra ? Math.min(4, maxRowsFromImage) : maxRowsFromImage;
  const sampleW = Math.max(1, Math.min(spec.cellW, width));
  for (let row = rowsToCheck - 1; row >= 0; row -= 1) {
    const y0 = row * spec.cellH;
    const y1 = Math.min(y0 + spec.cellH, height);
    let hasOpaque = false;
    for (let y = y0; y < y1 && !hasOpaque; y += 1) {
      const rowOff = y * width * 4;
      for (let x = 0; x < sampleW; x += 1) {
        const alpha = rgba[rowOff + x * 4 + 3];
        if (alpha > 0) {
          hasOpaque = true;
          break;
        }
      }
    }
    if (hasOpaque) return row;
  }
  return 0;
}

function findRightMostNonTransparentDistrictColumn(preview, spec, row) {
  if (!preview || !preview.ok || !preview.rgbaBase64 || !spec) return 0;
  const rgba = fromBase64ToUint8(preview.rgbaBase64);
  const width = Number(preview.width) || 0;
  const height = Number(preview.height) || 0;
  if (!width || !height) return 0;
  const maxColsFromImage = Math.max(1, Math.floor(width / spec.cellW));
  const rowIndex = Math.max(0, Number(row) || 0);
  const y0 = rowIndex * spec.cellH;
  const y1 = Math.min(y0 + spec.cellH, height);
  for (let col = maxColsFromImage - 1; col >= 0; col -= 1) {
    const x0 = col * spec.cellW;
    const x1 = Math.min(x0 + spec.cellW, width);
    let hasOpaque = false;
    for (let y = y0; y < y1 && !hasOpaque; y += 1) {
      const rowOff = y * width * 4;
      for (let x = x0; x < x1; x += 1) {
        const alpha = rgba[rowOff + x * 4 + 3];
        if (alpha > 0) {
          hasOpaque = true;
          break;
        }
      }
    }
    if (hasOpaque) return col;
  }
  return 0;
}

async function fetchDistrictRepresentativePreview(section) {
  const spec = getDistrictPreviewSpec(section);
  if (!spec || !state.settings || !state.settings.c3xPath) return null;
  const autoKey = JSON.stringify({
    kind: 'district-representative-auto',
    c3xPath: state.settings.c3xPath,
    fileName: spec.fileName,
    w: spec.cellW,
    h: spec.cellH,
    varyByEra: !!spec.varyByEra
  });
  const cachedAuto = state.previewCache.get(autoKey) || null;
  if (cachedAuto) return cachedAuto;
  if (state.districtRepresentativePreviewPending.has(autoKey)) {
    return state.districtRepresentativePreviewPending.get(autoKey);
  }
  const pending = (async () => {
  const fullKey = JSON.stringify({
    kind: 'district-full',
    c3xPath: state.settings.c3xPath,
    fileName: spec.fileName
  });
  let fullPreview = state.previewCache.get(fullKey) || null;
  if (!fullPreview) {
    const full = await window.c3xManager.getPreview({
      kind: 'district',
      c3xPath: state.settings.c3xPath,
      fileName: spec.fileName
    });
    if (!full || !full.ok) return null;
    fullPreview = full;
    setPreviewCache(fullKey, fullPreview);
  }
  const row = findLastNonTransparentDistrictRow(fullPreview, spec);
  const col = findRightMostNonTransparentDistrictColumn(fullPreview, spec, row);
  const cropKey = JSON.stringify({
    kind: 'district-representative',
    c3xPath: state.settings.c3xPath,
    fileName: spec.fileName,
    row,
    col,
    w: spec.cellW,
    h: spec.cellH
  });
  const cachedCrop = state.previewCache.get(cropKey) || null;
  if (cachedCrop) return cachedCrop;
  const cropped = await window.c3xManager.getPreview({
    kind: 'district',
    c3xPath: state.settings.c3xPath,
    fileName: spec.fileName,
    crop: { row, col, w: spec.cellW, h: spec.cellH }
  });
  if (!cropped || !cropped.ok) return null;
  setPreviewCache(autoKey, cropped);
  setPreviewCache(cropKey, cropped);
  return cropped;
  })();
  state.districtRepresentativePreviewPending.set(autoKey, pending);
  try {
    return await pending;
  } finally {
    state.districtRepresentativePreviewPending.delete(autoKey);
  }
}

function loadDistrictRepresentativePreview(section, holder, canvasSize = 28, onLoaded = null) {
  if (!holder) return;
  holder.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  canvas.className = 'entry-thumb-canvas';
  holder.appendChild(canvas);
  fetchDistrictRepresentativePreview(section)
    .then((preview) => {
      if (!preview || !holder.isConnected) return;
      drawPreviewFrameToCanvas(preview, canvas);
      if (typeof onLoaded === 'function') onLoaded(preview);
    })
    .catch(() => {});
}

function loadWonderCompletedThumbnail(section, holder, canvasSize = 35) {
  if (!holder) return;
  holder.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  canvas.className = 'entry-thumb-canvas';
  holder.appendChild(canvas);
  if (!state.settings || !state.settings.c3xPath) return;
  const fileName = normalizeConfigToken(getFieldValue(section, 'img_path') || 'Wonders.pcx');
  const row = parseConfigInteger(getFieldValue(section, 'img_row'), 0);
  const col = parseConfigInteger(getFieldValue(section, 'img_column'), 0);
  const crop = getCropDimensions(section, { w: 128, h: 64 });
  const cacheKey = JSON.stringify({
    kind: 'wonder-list-thumb',
    c3xPath: state.settings.c3xPath,
    fileName,
    row,
    col,
    w: crop.w,
    h: crop.h
  });
  const paint = (preview) => {
    if (!preview) return;
    drawPreviewFrameToCanvas(preview, canvas);
  };
  if (state.previewCache.has(cacheKey)) {
    paint(state.previewCache.get(cacheKey));
    return;
  }
  window.c3xManager.getPreview({
    kind: 'wonder',
    c3xPath: state.settings.c3xPath,
    fileName,
    crop: { row, col, w: crop.w, h: crop.h }
  }).then((res) => {
    if (!res || !res.ok) return;
    setPreviewCache(cacheKey, res);
    paint(res);
  }).catch(() => {});
}

function loadNaturalWonderThumbnail(section, holder, canvasSize = 35) {
  if (!holder) return;
  holder.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  canvas.className = 'entry-thumb-canvas';
  holder.appendChild(canvas);
  if (!state.settings || !state.settings.c3xPath) return;
  const fileName = normalizeConfigToken(getFieldValue(section, 'img_path') || '');
  if (!fileName) return;
  const row = parseConfigInteger(getFieldValue(section, 'img_row'), 0);
  const col = parseConfigInteger(getFieldValue(section, 'img_column'), 0);
  const crop = getCropDimensions(section, { w: 128, h: 88 });
  const cacheKey = JSON.stringify({
    kind: 'natural-wonder-list-thumb',
    c3xPath: state.settings.c3xPath,
    fileName,
    row,
    col,
    w: crop.w,
    h: crop.h
  });
  const paint = (preview) => {
    if (!preview) return;
    drawPreviewFrameToCanvas(preview, canvas);
  };
  if (state.previewCache.has(cacheKey)) {
    paint(state.previewCache.get(cacheKey));
    return;
  }
  window.c3xManager.getPreview({
    kind: 'naturalWonder',
    c3xPath: state.settings.c3xPath,
    fileName,
    crop: { row, col, w: crop.w, h: crop.h }
  }).then((res) => {
    if (!res || !res.ok) return;
    setPreviewCache(cacheKey, res);
    paint(res);
  }).catch(() => {});
}

function renderDistrictRepresentativePreviewCard(section, previewWrap, titleForFocus = 'District Art') {
  if (!previewWrap) return;
  const card = document.createElement('div');
  card.className = 'preview-card district-representative-preview-card';
  const frame = document.createElement('div');
  frame.className = 'section-art-soft-frame';
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  canvas.className = 'preview-canvas';
  canvas.style.width = `${state.previewSize}px`;
  canvas.style.height = 'auto';
  frame.appendChild(canvas);
  card.appendChild(frame);
  previewWrap.appendChild(card);
  let loadedPreview = null;
  fetchDistrictRepresentativePreview(section)
    .then((preview) => {
      if (!preview || !canvas.isConnected) return;
      loadedPreview = preview;
      canvas.width = preview.width;
      canvas.height = preview.height;
      drawPreviewFrameToCanvas(preview, canvas);
    })
    .catch(() => {});
  card.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (!loadedPreview) return;
    openArtFocusWithPreview(loadedPreview, titleForFocus, loadedPreview.sourcePath || '');
  });
}

function normalizeOptionLookupToken(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findTerrainPreviewEntry(optionName) {
  const token = normalizeOptionLookupToken(optionName);
  if (!token) return null;
  const terrainTab = state.bundle && state.bundle.tabs && state.bundle.tabs.terrain;
  const pedia = terrainTab && terrainTab.civilopedia;
  if (!pedia) return null;
  const pools = [
    { tabKey: 'terrainPedia', entries: (pedia.terrain && pedia.terrain.entries) || [] },
    { tabKey: 'workerActions', entries: (pedia.workerActions && pedia.workerActions.entries) || [] }
  ];
  for (const pool of pools) {
    const hit = pool.entries.find((entry) => {
      const name = normalizeOptionLookupToken(entry && entry.name);
      const key = normalizeOptionLookupToken(entry && entry.civilopediaKey);
      return name === token
        || key === token
        || (name && (name.includes(token) || token.includes(name)))
        || (key && (key.includes(token) || token.includes(key)));
    });
    if (hit) return { tabKey: pool.tabKey, entry: hit };
  }
  return null;
}

function makeTerrainOptionPreviewIcon(optionName) {
  const holder = document.createElement('span');
  holder.className = 'terrain-option-chip-thumb';
  const found = findTerrainPreviewEntry(optionName);
  if (!found) return holder;
  loadReferenceListThumbnail(found.tabKey, found.entry, holder);
  return holder;
}

function findDistrictSectionByName(name) {
  const target = normalizeConfigToken(name).toLowerCase();
  if (!target) return null;
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs.districts;
  if (!tab || !tab.model || !Array.isArray(tab.model.sections)) return null;
  return tab.model.sections.find((section, index) => {
    const internalName = normalizeConfigToken(getFieldValue(section, 'name')).toLowerCase();
    const displayName = normalizeConfigToken(getDistrictSectionDisplay(section, index).primary).toLowerCase();
    return internalName === target || displayName === target;
  }) || null;
}

function makeDistrictOptionPreviewIcon(optionName) {
  const holder = document.createElement('span');
  holder.className = 'terrain-option-chip-thumb district-option-chip-thumb';
  const section = findDistrictSectionByName(optionName);
  if (!section) return holder;
  loadDistrictRepresentativePreview(section, holder, 14);
  return holder;
}

function findNaturalWonderSectionByName(name) {
  const target = normalizeConfigToken(name);
  if (!target) return null;
  const tab = state.bundle && state.bundle.tabs && state.bundle.tabs.naturalWonders;
  if (!tab || !tab.model || !Array.isArray(tab.model.sections)) return null;
  return tab.model.sections.find((section) => normalizeConfigToken(getFieldValue(section, 'name')) === target) || null;
}

function buildNaturalWonderChipButton(name, selected, onToggle) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'segmented-multi-btn natural-wonder-chip';
  btn.classList.toggle('active', !!selected);
  const thumb = document.createElement('span');
  thumb.className = 'natural-wonder-chip-thumb';
  const text = document.createElement('span');
  text.textContent = name;
  btn.appendChild(thumb);
  btn.appendChild(text);
  btn.addEventListener('click', () => onToggle());
  const section = findNaturalWonderSectionByName(name);
  if (!section) return btn;
  const fileName = normalizeConfigToken(getFieldValue(section, 'img_path'));
  const row = parseConfigInteger(getFieldValue(section, 'img_row'), 0);
  const col = parseConfigInteger(getFieldValue(section, 'img_column'), 0);
  window.c3xManager.getPreview({
    kind: 'naturalWonder',
    c3xPath: state.settings && state.settings.c3xPath,
    fileName,
    crop: { row, col, w: 128, h: 88 }
  }).then((res) => {
    if (!res || !res.ok || !thumb.isConnected) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'entry-thumb-canvas';
    canvas.width = 24;
    canvas.height = 24;
    drawPreviewFrameToCanvas(res, canvas);
    thumb.innerHTML = '';
    thumb.appendChild(canvas);
  }).catch(() => {});
  return btn;
}

function renderNaturalWonderPrereqEditor(options, values, onValuesChange) {
  const wrap = document.createElement('div');
  wrap.className = 'segmented-multi-list';
  const optionList = Array.isArray(options) ? options.map((opt) => String(opt || '').trim()).filter(Boolean) : [];
  const selectedValues = (Array.isArray(values) ? values : []).map((v) => String(v || '').trim()).filter(Boolean);
  const optionSet = new Set(optionList);
  selectedValues.forEach((value) => optionSet.add(value));
  const merged = Array.from(optionSet);
  const selected = new Set(selectedValues);
  merged.forEach((name) => {
    const btn = buildNaturalWonderChipButton(name, selected.has(name), () => {
      if (selected.has(name)) selected.delete(name);
      else selected.add(name);
      btn.classList.toggle('active', selected.has(name));
      if (onValuesChange) onValuesChange(merged.filter((entry) => selected.has(entry)));
    });
    wrap.appendChild(btn);
  });
  return wrap;
}

function renderDistrictImagePathsEditor(section, onValueChange) {
  const wrap = document.createElement('div');
  wrap.className = 'district-image-paths-wrap';
  const rawValues = tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths')).map((v) => String(v || '').trim());
  const expectedCount = getExpectedDistrictImagePathCount(section, rawValues);
  const cultureSlots = ['American', 'European', 'Roman', 'Mideast', 'Asian'];
  const coastalSlots = ['NW', 'NE', 'SE', 'SW'];

  const commit = (values) => {
    const cleaned = (Array.isArray(values) ? values : []).map((v) => String(v || '').trim()).filter(Boolean);
    setSingleFieldValue(section, 'img_paths', cleaned.join(', '));
    if (onValueChange) onValueChange('img_paths', cleaned.join(', '));
  };

  if (expectedCount > 1) {
    const grid = document.createElement('div');
    grid.className = 'district-image-grid vertical';
    for (let i = 0; i < expectedCount; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'district-image-cell';
      const title = document.createElement('div');
      title.className = 'district-image-cell-title';
      if (expectedCount === 5) title.textContent = cultureSlots[i] || `Path ${i + 1}`;
      else if (expectedCount === 4) title.textContent = coastalSlots[i] || `Path ${i + 1}`;
      else title.textContent = `Path ${i + 1}`;
      const row = document.createElement('div');
      row.className = 'district-image-row';
      const current = rawValues[i] || '';
      const fileName = document.createElement('div');
      fileName.className = 'district-image-file-name';
      fileName.textContent = current ? getPathTail(current) : '(not set)';
      fileName.title = current || '(not set)';
      const preview = makeDistrictImagePathPreview(current);
      preview.classList.add('inline-path-preview-inline');
      const browse = document.createElement('button');
      browse.type = 'button';
      browse.textContent = 'Browse';
      browse.addEventListener('click', async () => {
        const filePath = await window.c3xManager.pickFile(getFilePickerOptionsForSectionField({ key: 'img_paths' }, current));
        if (!filePath) return;
        const next = rawValues.slice(0, expectedCount);
        while (next.length < expectedCount) next.push('');
        next[i] = filePath;
        commit(next);
        renderActiveTab({ preserveTabScroll: true });
      });
      const actions = document.createElement('div');
      actions.className = 'district-image-actions';
      actions.appendChild(browse);
      row.appendChild(preview);
      row.appendChild(fileName);
      row.appendChild(actions);
      cell.appendChild(title);
      cell.appendChild(row);
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  const table = document.createElement('div');
  table.className = 'district-image-table';
  const current = rawValues[0] || '';
  const row = document.createElement('div');
  row.className = 'district-image-row';
  const fileName = document.createElement('div');
  fileName.className = 'district-image-file-name';
  fileName.textContent = current ? getPathTail(current) : '(not set)';
  fileName.title = current || '(not set)';
  const preview = makeDistrictImagePathPreview(current);
  preview.classList.add('inline-path-preview-inline');
  const browse = document.createElement('button');
  browse.type = 'button';
  browse.textContent = 'Browse';
  browse.addEventListener('click', async () => {
    const filePath = await window.c3xManager.pickFile(getFilePickerOptionsForSectionField({ key: 'img_paths' }, current));
    if (!filePath) return;
    commit([filePath]);
    renderActiveTab({ preserveTabScroll: true });
  });
  const actions = document.createElement('div');
  actions.className = 'district-image-actions';
  actions.appendChild(browse);
  row.appendChild(preview);
  row.appendChild(fileName);
  row.appendChild(actions);
  table.appendChild(row);
  wrap.appendChild(table);
  return wrap;
}

function parseAnimationAdjacentToToken(token) {
  const raw = normalizeConfigToken(token);
  if (!raw) return { terrain: '', direction: '' };
  const splitAt = raw.indexOf(':');
  if (splitAt < 0) return { terrain: raw, direction: '' };
  const terrain = raw.slice(0, splitAt).trim();
  const direction = raw.slice(splitAt + 1).trim().toLowerCase();
  return { terrain, direction };
}

function serializeAnimationAdjacentToToken(entry) {
  const terrain = normalizeConfigToken(entry && entry.terrain);
  const direction = normalizeConfigToken(entry && entry.direction).toLowerCase();
  if (!terrain) return '';
  return direction ? `${terrain}:${direction}` : terrain;
}

function renderAnimationAdjacentToEditor(section, onValueChange) {
  const wrap = document.createElement('div');
  wrap.className = 'structured-list';
  const terrainBase = [...TERRAIN_OPTIONS, 'land', 'river', 'lake', 'coast', 'sea', 'ocean'];
  const rawTokens = tokenizeListPreservingQuotes(getFieldValue(section, 'adjacent_to'));
  const rows = rawTokens.map((token) => parseAnimationAdjacentToToken(token)).filter((entry) => !!entry.terrain);
  if (rows.length === 0) rows.push({ terrain: '', direction: '' });

  const commit = () => {
    const serialized = rows
      .map((entry) => serializeAnimationAdjacentToToken(entry))
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    setSingleFieldValue(section, 'adjacent_to', serialized.join(', '));
    if (onValueChange) onValueChange('adjacent_to', serialized.join(', '));
  };

  const renderRows = () => {
    wrap.innerHTML = '';
    rows.forEach((entry, idx) => {
      const line = document.createElement('div');
      line.className = 'kv-row compact';

      const terrainSelect = document.createElement('select');
      const terrainOpts = Array.from(new Set([...terrainBase, ...rows.map((item) => normalizeConfigToken(item.terrain)).filter(Boolean)]));
      const terrainEmpty = document.createElement('option');
      terrainEmpty.value = '';
      terrainEmpty.textContent = 'Terrain...';
      terrainSelect.appendChild(terrainEmpty);
      terrainOpts.forEach((opt) => {
        const node = document.createElement('option');
        node.value = opt;
        node.textContent = opt;
        terrainSelect.appendChild(node);
      });
      terrainSelect.value = normalizeConfigToken(entry.terrain);
      terrainSelect.addEventListener('change', () => {
        rows[idx].terrain = terrainSelect.value;
        commit();
      });
      line.appendChild(terrainSelect);

      const dirSelect = document.createElement('select');
      const dirEmpty = document.createElement('option');
      dirEmpty.value = '';
      dirEmpty.textContent = '(any direction)';
      dirSelect.appendChild(dirEmpty);
      const dirOptions = Array.from(new Set([...DIRECTION_OPTIONS, ...rows.map((item) => normalizeConfigToken(item.direction).toLowerCase()).filter(Boolean)]));
      dirOptions.forEach((opt) => {
        const node = document.createElement('option');
        node.value = opt;
        node.textContent = opt;
        dirSelect.appendChild(node);
      });
      dirSelect.value = normalizeConfigToken(entry.direction).toLowerCase();
      dirSelect.addEventListener('change', () => {
        rows[idx].direction = dirSelect.value;
        commit();
      });
      line.appendChild(dirSelect);

      const del = document.createElement('button');
      del.type = 'button';
      withRemoveIcon(del, ' Remove');
      del.addEventListener('click', () => {
        rows.splice(idx, 1);
        if (rows.length === 0) rows.push({ terrain: '', direction: '' });
        commit();
        renderRows();
      });
      line.appendChild(del);
      wrap.appendChild(line);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Add Adjacent Rule';
    add.addEventListener('click', () => {
      rows.push({ terrain: '', direction: '' });
      renderRows();
    });
    wrap.appendChild(add);
  };

  renderRows();
  return wrap;
}

function renderNaturalWonderAnimationSpecsEditor(section, onValueChange) {
  const wrap = document.createElement('div');
  wrap.className = 'natural-animation-spec-list';
  const rawSpecs = getFieldValuesRaw(section, 'animation');
  const specs = rawSpecs.map((raw) => parseNaturalWonderAnimationSpec(raw));
  const adjacencyDirection = String(getFieldValue(section, 'adjacency_dir') || '').trim();
  if (adjacencyDirection) {
    specs.forEach((entry) => {
      entry.direction = adjacencyDirection;
    });
  }

  const commit = (config = null) => {
    const shouldNotify = !(config && config.notify === false);
    if (adjacencyDirection) {
      specs.forEach((entry) => {
        entry.direction = adjacencyDirection;
      });
    }
    const serialized = specs
      .map((entry) => serializeNaturalWonderAnimationSpec(entry))
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
    setMultiFieldValues(section, 'animation', serialized);
    if (shouldNotify && onValueChange) onValueChange('animation', serialized.join('\n'));
  };

  const addExtraRow = (entry, extrasWrap, valueChangeHook) => {
    const extra = { key: '', value: '' };
    entry.extras.push(extra);
    valueChangeHook();
    const row = document.createElement('div');
    row.className = 'kv-row compact';
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.placeholder = 'key';
    keyInput.value = '';
    keyInput.addEventListener('input', () => {
      extra.key = keyInput.value;
      valueChangeHook();
    });
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'value';
    valueInput.value = '';
    valueInput.addEventListener('input', () => {
      extra.value = valueInput.value;
      valueChangeHook();
    });
    const del = document.createElement('button');
    del.type = 'button';
    withRemoveIcon(del, ' Remove');
    del.addEventListener('click', () => {
      const idx = entry.extras.indexOf(extra);
      if (idx >= 0) entry.extras.splice(idx, 1);
      valueChangeHook();
      row.remove();
    });
    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(del);
    extrasWrap.appendChild(row);
  };

  if (specs.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'No animation specs configured.';
    wrap.appendChild(hint);
  }

  specs.forEach((entry, idx) => {
    const card = document.createElement('div');
    card.className = 'section-card natural-animation-spec-card';

    const top = document.createElement('div');
    top.className = 'section-top';
    top.innerHTML = `<strong>Animation ${idx + 1}</strong><span class="hint">Rendered from this natural wonder tile</span>`;
    card.appendChild(top);

    const iniWrap = document.createElement('div');
    iniWrap.className = 'path-input-with-btn';
    const iniInput = document.createElement('input');
    iniInput.type = 'text';
    iniInput.placeholder = 'Art\\Animations\\...\\*.ini';
    iniInput.value = entry.ini || '';
    iniInput.addEventListener('input', () => {
      entry.ini = iniInput.value;
      commit();
    });
    const iniBrowse = document.createElement('button');
    iniBrowse.type = 'button';
    iniBrowse.textContent = 'Browse';
    iniBrowse.addEventListener('click', async () => {
      const filePath = await window.c3xManager.pickFile(getFilePickerOptionsForSectionField({ key: 'ini_path' }, iniInput.value));
      if (!filePath) return;
      iniInput.value = filePath;
      entry.ini = filePath;
      commit();
    });
    iniWrap.appendChild(iniInput);
    iniWrap.appendChild(iniBrowse);
    card.appendChild(iniWrap);

    const grid = document.createElement('div');
    grid.className = 'kv-grid natural-animation-spec-grid';

    const frameWrap = document.createElement('label');
    frameWrap.className = 'hint';
    frameWrap.textContent = 'Frame Time (seconds)';
    const frameRow = document.createElement('div');
    frameRow.style.display = 'grid';
    frameRow.style.gridTemplateColumns = 'minmax(0, 1fr) auto';
    frameRow.style.gap = '8px';
    frameRow.style.alignItems = 'center';
    const frameInput = document.createElement('input');
    frameInput.type = 'range';
    frameInput.min = '0.02';
    frameInput.max = '1.00';
    frameInput.step = '0.01';
    const parsedFrame = Number.parseFloat(entry.frame_time_seconds);
    const frameValue = Number.isFinite(parsedFrame) ? Math.max(0.02, Math.min(1.00, parsedFrame)) : 0.12;
    frameInput.value = frameValue.toFixed(2);
    const frameValueText = document.createElement('span');
    frameValueText.className = 'field-meta';
    frameValueText.textContent = `${frameInput.value}s`;
    frameInput.addEventListener('input', () => {
      const next = Number.parseFloat(frameInput.value);
      const clamped = Number.isFinite(next) ? Math.max(0.02, Math.min(1.00, next)) : 0.12;
      frameValueText.textContent = `${clamped.toFixed(2)}s`;
    });
    frameInput.addEventListener('change', () => {
      const next = Number.parseFloat(frameInput.value);
      const clamped = Number.isFinite(next) ? Math.max(0.02, Math.min(1.00, next)) : 0.12;
      entry.frame_time_seconds = clamped.toFixed(2);
      frameValueText.textContent = `${entry.frame_time_seconds}s`;
      commit({ notify: false });
    });
    frameRow.appendChild(frameInput);
    frameRow.appendChild(frameValueText);
    frameWrap.appendChild(frameRow);
    grid.appendChild(frameWrap);

    const xWrap = document.createElement('label');
    xWrap.className = 'hint';
    xWrap.textContent = 'X Offset';
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.value = entry.x_offset || '';
    xInput.addEventListener('input', () => {
      entry.x_offset = xInput.value;
      commit();
    });
    xWrap.appendChild(xInput);
    grid.appendChild(xWrap);

    const yWrap = document.createElement('label');
    yWrap.className = 'hint';
    yWrap.textContent = 'Y Offset';
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.value = entry.y_offset || '';
    yInput.addEventListener('input', () => {
      entry.y_offset = yInput.value;
      commit();
    });
    yWrap.appendChild(yInput);
    grid.appendChild(yWrap);

    const dirWrap = document.createElement('div');
    dirWrap.className = 'hint';
    dirWrap.textContent = 'Direction (from Adjacency Direction)';
    const dirChips = makeSegmentedSingleValueEditor(
      DIRECTION_OPTIONS,
      adjacencyDirection || entry.direction || '',
      null,
      'direction',
      { includeEmpty: true, showTokenIcon: false }
    );
    dirChips.classList.add('natural-animation-readonly-chips');
    Array.from(dirChips.querySelectorAll('button')).forEach((btn) => {
      btn.disabled = true;
      btn.tabIndex = -1;
    });
    dirWrap.appendChild(dirChips);
    grid.appendChild(dirWrap);

    const dayNightWrap = document.createElement('div');
    dayNightWrap.className = 'hint';
    dayNightWrap.textContent = 'Day/Night Hours';
    const hourState = new Set(parseDayNightHoursSpec(entry.show_in_day_night_hours));
    const quickActions = document.createElement('div');
    quickActions.className = 'inline-btn-row';
    const allHoursBtn = document.createElement('button');
    allHoursBtn.type = 'button';
    allHoursBtn.className = 'ghost';
    allHoursBtn.textContent = 'All';
    allHoursBtn.addEventListener('click', () => {
      hourState.clear();
      for (let h = 0; h < 24; h += 1) hourState.add(h);
      entry.show_in_day_night_hours = serializeDayNightHoursSpec(Array.from(hourState));
      commit();
      renderActiveTab({ preserveTabScroll: true });
    });
    const clearHoursBtn = document.createElement('button');
    clearHoursBtn.type = 'button';
    clearHoursBtn.className = 'ghost';
    clearHoursBtn.textContent = 'None';
    clearHoursBtn.addEventListener('click', () => {
      hourState.clear();
      entry.show_in_day_night_hours = '';
      commit();
      renderActiveTab({ preserveTabScroll: true });
    });
    quickActions.appendChild(allHoursBtn);
    quickActions.appendChild(clearHoursBtn);
    dayNightWrap.appendChild(quickActions);
    const hoursGrid = document.createElement('div');
    hoursGrid.className = 'natural-animation-hours-grid';
    for (let h = 0; h < 24; h += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segmented-multi-btn';
      btn.textContent = String(h);
      btn.classList.toggle('active', hourState.has(h));
      btn.addEventListener('click', () => {
        if (hourState.has(h)) hourState.delete(h);
        else hourState.add(h);
        btn.classList.toggle('active', hourState.has(h));
        entry.show_in_day_night_hours = serializeDayNightHoursSpec(Array.from(hourState));
        commit();
      });
      hoursGrid.appendChild(btn);
    }
    dayNightWrap.appendChild(hoursGrid);
    grid.appendChild(dayNightWrap);

    const seasonsWrap = document.createElement('div');
    seasonsWrap.className = 'hint';
    seasonsWrap.textContent = 'Seasons';
    const seasonValues = tokenizeListPreservingQuotes(entry.show_in_seasons || '').map((v) => String(v || '').trim()).filter(Boolean);
    const seasonChips = makeSegmentedMultiValueEditor(['spring', 'summer', 'fall', 'winter'], seasonValues, (nextValues) => {
      entry.show_in_seasons = nextValues.join(', ');
      commit();
    }, 'show_in_seasons', {
      showTokenIcon: false
    });
    seasonsWrap.appendChild(seasonChips);
    grid.appendChild(seasonsWrap);
    card.appendChild(grid);

    const extrasBlock = document.createElement('div');
    extrasBlock.className = 'multi-value-group';
    const extrasTitle = document.createElement('div');
    extrasTitle.className = 'hint';
    extrasTitle.textContent = 'Extra Parameters';
    extrasBlock.appendChild(extrasTitle);
    const extrasRows = document.createElement('div');
    extrasRows.className = 'kv-grid';
    const refreshExtras = () => {
      commit();
    };
    (Array.isArray(entry.extras) ? entry.extras : []).forEach((extra) => {
      const row = document.createElement('div');
      row.className = 'kv-row compact';
      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.placeholder = 'key';
      keyInput.value = String(extra && extra.key || '');
      keyInput.addEventListener('input', () => {
        extra.key = keyInput.value;
        refreshExtras();
      });
      const valueInput = document.createElement('input');
      valueInput.type = 'text';
      valueInput.placeholder = 'value';
      valueInput.value = String(extra && extra.value || '');
      valueInput.addEventListener('input', () => {
        extra.value = valueInput.value;
        refreshExtras();
      });
      const del = document.createElement('button');
      del.type = 'button';
      withRemoveIcon(del, ' Remove');
      del.addEventListener('click', () => {
        const extraIdx = entry.extras.indexOf(extra);
        if (extraIdx >= 0) entry.extras.splice(extraIdx, 1);
        refreshExtras();
        row.remove();
      });
      row.appendChild(keyInput);
      row.appendChild(valueInput);
      row.appendChild(del);
      extrasRows.appendChild(row);
    });
    extrasBlock.appendChild(extrasRows);
    const addExtra = document.createElement('button');
    addExtra.type = 'button';
    addExtra.textContent = 'Add Extra Param';
    addExtra.addEventListener('click', () => {
      addExtraRow(entry, extrasRows, refreshExtras);
    });
    extrasBlock.appendChild(addExtra);
    card.appendChild(extrasBlock);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.innerHTML = '<span class="btn-icon">🗑</span>Remove Animation';
    remove.addEventListener('click', () => {
      specs.splice(idx, 1);
      commit();
      renderActiveTab({ preserveTabScroll: true });
    });
    card.appendChild(remove);
    wrap.appendChild(card);
  });

  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = 'Add Animation';
  add.addEventListener('click', () => {
    specs.push({
      ini: '',
      frame_time_seconds: '',
      x_offset: '',
      y_offset: '',
      direction: '',
      show_in_day_night_hours: '',
      show_in_seasons: '',
      extras: []
    });
    commit();
    renderActiveTab({ preserveTabScroll: true });
  });
  wrap.appendChild(add);

  return wrap;
}

function renderKnownField(section, schemaField, fieldDocs, onValueChange) {
  const dynamicOptions = getDynamicSectionFieldOptions(state.activeTab, schemaField, section);
  const effectiveOptions = dynamicOptions.length > 0 ? dynamicOptions : (schemaField.options || []);
  const effectiveField = effectiveOptions === schemaField.options
    ? schemaField
    : { ...schemaField, options: effectiveOptions };
  const refTabKey = getReferenceTabForSectionField(state.activeTab, effectiveField.key);

  const row = document.createElement('div');
  row.className = 'rule-row section-rule-row';

  const labelWrap = document.createElement('div');
  labelWrap.className = 'section-rule-label';
  const label = document.createElement('label');
  label.className = 'field-label section-rule-title';
  label.textContent = effectiveField.label + (effectiveField.required ? ' *' : '');
  labelWrap.appendChild(label);

  const tooltipLines = [formatSourceInfo(getSectionTabSourceMeta(state.bundle && state.bundle.tabs[state.activeTab]), 'C3X Config')];
  tooltipLines.push(`Field: ${effectiveField.label}`);
  tooltipLines.push(`Key: ${effectiveField.key}`);
  const fullDesc = getSectionFieldDescription(state.activeTab, effectiveField, fieldDocs);
  if (fullDesc) tooltipLines.push(`Notes: ${fullDesc}`);
  const tooltip = withFieldHelp(tooltipLines.join('\n'), { tabKey: state.activeTab, fieldKey: effectiveField.key });
  attachRichTooltip(labelWrap, tooltip);
  row.appendChild(labelWrap);

  const controlWrap = document.createElement('div');
  controlWrap.className = 'rule-control section-rule-control';

  const values = getFieldValues(section, effectiveField.key);
  const serializeListValues = (nextValues) => {
    const cleaned = (Array.isArray(nextValues) ? nextValues : []).map((v) => String(v || '').trim()).filter(Boolean);
    if (effectiveField.type === 'list' && !effectiveField.multi) {
      setSingleFieldValue(section, effectiveField.key, cleaned.join(', '));
    } else {
      setMultiFieldValues(section, effectiveField.key, cleaned);
    }
    if (onValueChange) onValueChange(effectiveField.key, cleaned.join(', '));
  };

  if (state.activeTab === 'naturalWonders' && effectiveField.key === 'animation') {
    controlWrap.appendChild(renderNaturalWonderAnimationSpecsEditor(section, onValueChange));
    row.appendChild(controlWrap);
    return row;
  }

  if (state.activeTab === 'animations' && effectiveField.key === 'adjacent_to') {
    controlWrap.appendChild(renderAnimationAdjacentToEditor(section, onValueChange));
    row.appendChild(controlWrap);
    return row;
  }

  if (effectiveField.multi || effectiveField.type === 'list') {
    const list = (effectiveField.type === 'list' && !effectiveField.multi)
      ? (values[0] ? tokenizeListPreservingQuotes(values[0]) : [''])
      : (values.length > 0 ? values : ['']);

    if (refTabKey) {
      const refOptions = getReferenceOptionsForSectionField(state.activeTab, effectiveField.key);
      const editor = makeNamedListPickerEditor({
        tabKey: refTabKey,
        options: refOptions,
        values: list.filter(Boolean),
        onValuesChange: (nextValues) => serializeListValues(nextValues)
      });
      controlWrap.appendChild(editor);
      row.appendChild(controlWrap);
      return row;
    }

    if (effectiveField.options && effectiveField.options.length > 0) {
      if (effectiveField.key === 'natural_wonder_prereqs') {
        const chips = renderNaturalWonderPrereqEditor(effectiveField.options, list.filter(Boolean), (nextValues) => {
          serializeListValues(nextValues);
        });
        controlWrap.appendChild(chips);
        row.appendChild(controlWrap);
        return row;
      }
      const noColorIconKeys = new Set(['buildable_on_districts', 'buildable_adjacent_to_districts']);
      const terrainPreviewIconKeys = new Set([
        'buildable_on',
        'buildable_on_overlays',
        'buildable_without_removal',
        'buildable_adjacent_to',
        'buildable_adjacent_to_overlays',
        'terrain_types'
      ]);
      const districtPreviewIconKeys = new Set(['buildable_on_districts', 'buildable_adjacent_to_districts']);
      const chips = makeSegmentedMultiValueEditor(effectiveField.options, list.filter(Boolean), (nextValues) => {
        serializeListValues(nextValues);
      }, effectiveField.key, {
        showTokenIcon: !noColorIconKeys.has(effectiveField.key),
        iconRenderer: terrainPreviewIconKeys.has(effectiveField.key)
          ? ((optionName) => makeTerrainOptionPreviewIcon(optionName))
          : (districtPreviewIconKeys.has(effectiveField.key) ? ((optionName) => makeDistrictOptionPreviewIcon(optionName)) : null)
      });
      controlWrap.appendChild(chips);
      row.appendChild(controlWrap);
      return row;
    }

    if (state.activeTab === 'districts' && effectiveField.key === 'img_paths') {
      controlWrap.appendChild(renderDistrictImagePathsEditor(section, onValueChange));
      row.appendChild(controlWrap);
      return row;
    }

    const multiWrap = document.createElement('div');
    multiWrap.className = 'multi-value-group';
    list.forEach((current, idx) => {
      const line = document.createElement('div');
      line.className = 'kv-row compact';

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'item';
      input.value = current;
      input.addEventListener('input', () => {
        const next = [...list];
        next[idx] = input.value;
        serializeListValues(next);
      });
      line.appendChild(input);

      const keyLower = String(effectiveField.key || '').toLowerCase();
      const isPathLikeMultiField = keyLower.includes('path') || keyLower.includes('file');
      if (isPathLikeMultiField) {
        line.classList.add('section-list-line');
        if (state.activeTab === 'districts' && keyLower === 'img_paths') {
          line.appendChild(makeDistrictImagePathPreview(current));
        }
        const browse = document.createElement('button');
        browse.textContent = 'Browse';
        browse.type = 'button';
        browse.addEventListener('click', async () => {
          const pickerOptions = getFilePickerOptionsForSectionField(effectiveField, input.value);
          const filePath = await window.c3xManager.pickFile(pickerOptions);
          if (!filePath) return;
          input.value = filePath;
          const next = [...list];
          next[idx] = filePath;
          serializeListValues(next);
          renderActiveTab({ preserveTabScroll: true });
        });
        line.appendChild(browse);
      }

      const del = document.createElement('button');
      withRemoveIcon(del, ' Remove');
      del.addEventListener('click', () => {
        const next = [...list];
        next.splice(idx, 1);
        serializeListValues(next);
        renderActiveTab({ preserveTabScroll: true });
      });
      line.appendChild(del);
      multiWrap.appendChild(line);
    });

    const add = document.createElement('button');
    add.textContent = 'Add Item';
    add.addEventListener('click', () => {
      const next = [...list, ''];
      serializeListValues(next);
      renderActiveTab({ preserveTabScroll: true });
    });
    multiWrap.appendChild(add);
    controlWrap.appendChild(multiWrap);
    row.appendChild(controlWrap);
    return row;
  }

  if (state.activeTab === 'wonders' && effectiveField.key === 'name') {
    const normalizedCurrent = normalizeConfigToken(values[0] || '');
    const wonderOptions = getFilteredImprovementOptions(['wonder', 'small_wonder']).slice();
    const hasCurrent = wonderOptions.some((opt) => String(opt && opt.value || '').trim() === normalizedCurrent);
    if (normalizedCurrent && !hasCurrent) {
      wonderOptions.unshift({ value: normalizedCurrent, label: normalizedCurrent, entry: null });
    }
    const picker = createReferencePicker({
      options: wonderOptions,
      targetTabKey: 'improvements',
      currentValue: normalizedCurrent || '-1',
      searchPlaceholder: 'Search Wonder...',
      noneLabel: '(not set)',
      onSelect: (next) => {
        const selected = String(next || '').trim();
        const value = selected === '-1' ? '' : selected;
        setSingleFieldValue(section, effectiveField.key, value);
        if (onValueChange) onValueChange(effectiveField.key, value);
      }
    });
    controlWrap.appendChild(picker);
    row.appendChild(controlWrap);
    return row;
  }

  const naturalWonderSingleChoiceKeys = new Set(['terrain_type', 'adjacent_to', 'adjacency_dir']);
  if (state.activeTab === 'naturalWonders' && naturalWonderSingleChoiceKeys.has(effectiveField.key) && Array.isArray(effectiveField.options) && effectiveField.options.length > 0) {
    const key = String(effectiveField.key || '');
    const allowTerrainThumbs = key === 'terrain_type' || key === 'adjacent_to';
    const terrainOptionSet = new Set(TERRAIN_OPTIONS.map((opt) => String(opt || '').trim()));
    const chips = makeSegmentedSingleValueEditor(
      effectiveField.options,
      values[0] || '',
      (nextValue) => {
        const value = String(nextValue || '').trim();
        setSingleFieldValue(section, effectiveField.key, value);
        if (onValueChange) onValueChange(effectiveField.key, value);
      },
      effectiveField.key,
      {
        showTokenIcon: key !== 'terrain_type',
        iconRenderer: allowTerrainThumbs
          ? ((optionName) => (terrainOptionSet.has(String(optionName || '').trim()) ? makeTerrainOptionPreviewIcon(optionName) : null))
          : null,
        includeEmpty: !effectiveField.required
      }
    );
    controlWrap.appendChild(chips);
    row.appendChild(controlWrap);
    return row;
  }

  if (state.activeTab === 'animations' && effectiveField.key === 'direction') {
    const chips = makeSegmentedSingleValueEditor(
      DIRECTION_OPTIONS,
      values[0] || '',
      (nextValue) => {
        const normalized = String(nextValue || '').trim();
        setSingleFieldValue(section, effectiveField.key, normalized);
        if (onValueChange) onValueChange(effectiveField.key, normalized);
      },
      effectiveField.key,
      {
        includeEmpty: true,
        emptyLabel: '(not set)',
        showTokenIcon: false
      }
    );
    controlWrap.appendChild(chips);
    row.appendChild(controlWrap);
    return row;
  }

  if (state.activeTab === 'animations' && effectiveField.key === 'frame_time_seconds') {
    const parsed = Number.parseFloat(String(values[0] || '').trim());
    const min = 0.02;
    const max = 1.0;
    const step = 0.01;
    const fallback = 0.1;
    const current = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    const sliderValue = Math.min(max, Math.max(min, current));

    const wrap = document.createElement('div');
    wrap.className = 'preview-tools';
    const label = document.createElement('span');
    label.className = 'preview-size-label';
    label.textContent = 'Frame Time';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = sliderValue.toFixed(2);
    const valueLabel = document.createElement('span');
    valueLabel.className = 'preview-size-value';
    const syncValueLabel = (seconds) => {
      const ms = Math.round(Math.max(0, seconds) * 1000);
      valueLabel.textContent = `${seconds.toFixed(2)}s (${ms}ms)`;
    };
    syncValueLabel(sliderValue);

    slider.addEventListener('input', () => {
      const next = Number.parseFloat(slider.value);
      const seconds = Number.isFinite(next) ? next : fallback;
      const serialized = seconds.toFixed(2).replace(/\.00$/, '');
      syncValueLabel(seconds);
      setSingleFieldValue(section, effectiveField.key, serialized);
      if (onValueChange) onValueChange(effectiveField.key, serialized);
    });

    wrap.appendChild(label);
    wrap.appendChild(slider);
    wrap.appendChild(valueLabel);
    controlWrap.appendChild(wrap);
    row.appendChild(controlWrap);
    return row;
  }

  if (state.activeTab === 'animations' && effectiveField.key === 'resource_type') {
    const normalizedCurrent = normalizeConfigToken(values[0] || '');
    const resourceOptions = getNamedReferenceOptionsForTab('resources').slice();
    const hasCurrent = resourceOptions.some((opt) => String(opt && opt.value || '').trim() === normalizedCurrent);
    if (normalizedCurrent && !hasCurrent) {
      resourceOptions.unshift({ value: normalizedCurrent, label: normalizedCurrent, entry: null });
    }
    const picker = createReferencePicker({
      options: resourceOptions,
      targetTabKey: 'resources',
      currentValue: normalizedCurrent || '-1',
      searchPlaceholder: 'Search Resource...',
      noneLabel: '(not set)',
      onSelect: (next) => {
        const selected = String(next || '').trim();
        const value = selected === '-1' ? '' : selected;
        setSingleFieldValue(section, effectiveField.key, value);
        if (onValueChange) onValueChange(effectiveField.key, value);
      }
    });
    controlWrap.appendChild(picker);
    row.appendChild(controlWrap);
    return row;
  }

  const input = createFieldInput(effectiveField, values[0] || '', (newValue) => {
    setSingleFieldValue(section, effectiveField.key, String(newValue || '').trim());
    if (onValueChange) onValueChange(effectiveField.key, String(newValue || '').trim());
  });
  if (effectiveField.type === 'bool' && input instanceof Element) {
    const check = input.querySelector('input[type="checkbox"]');
    if (check) enableBooleanRowToggle(row, check);
  }
  controlWrap.appendChild(input);
  row.appendChild(controlWrap);

  return row;
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

function deleteSelectedSection(tab, tabKey) {
  if (!tab || !tab.model || !Array.isArray(tab.model.sections) || tab.model.sections.length <= 0) return;
  const selectedIndex = Math.max(0, Math.min(state.sectionSelection[tabKey] || 0, tab.model.sections.length - 1));
  rememberUndoSnapshot();
  tab.model.sections.splice(selectedIndex, 1);
  state.sectionSelection[tabKey] = Math.max(0, selectedIndex - 1);
  setDirty(true);
  renderActiveTab();
}

function syncSectionStickyOffsets(container, header) {
  if (!container || !header) return;
  window.requestAnimationFrame(() => {
    if (!container.isConnected || !header.isConnected) return;
    const headerHeight = Math.ceil(header.getBoundingClientRect().height || 0);
    const stickyInsetPx = 3;
    if (headerHeight > 0) {
      container.style.setProperty('--sticky-search-top', `${headerHeight + stickyInsetPx}px`);
    } else {
      container.style.removeProperty('--sticky-search-top');
    }
  });
}

function renderSectionTab(tab, tabKey) {
  const schema = SECTION_SCHEMAS[tabKey];
  const useCompactEntityActions = tabKey === 'districts' || tabKey === 'wonders' || tabKey === 'naturalWonders';
  const sourceMeta = getSectionTabSourceMeta(tab);
  const sourceFile = compactPathFromCiv3Root(sourceMeta.readPath || sourceMeta.writePath) || '(not found)';
  const districtCompatibility = tabKey === 'districts' ? collectDistrictCompatibilityIssuesForTab(tab) : null;
  const districtIssueIndexes = tabKey === 'districts' ? collectDistrictIssueIndexes(tab, districtCompatibility) : null;
  const wonderCompatibility = tabKey === 'wonders' ? collectWonderCompatibilityIssuesForTab(tab) : null;
  const wonderIssueIndexes = tabKey === 'wonders' ? collectWonderIssueIndexes(tab, wonderCompatibility) : null;
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[tabKey]));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`);

  if (useCompactEntityActions) {
    const actionRow = document.createElement('div');
    actionRow.className = 'reference-entity-actions section-header-actions';
    const addSectionBtn = document.createElement('button');
    addSectionBtn.type = 'button';
    addSectionBtn.className = 'ghost action-add';
    addSectionBtn.textContent = '+ Add';
    addSectionBtn.addEventListener('click', () => addSection(tab, tabKey));
    actionRow.appendChild(addSectionBtn);

    const deleteSectionBtn = document.createElement('button');
    deleteSectionBtn.type = 'button';
    deleteSectionBtn.className = 'ghost action-delete';
    deleteSectionBtn.innerHTML = '<span class="btn-icon">🗑</span>Delete';
    deleteSectionBtn.disabled = !tab.model || !Array.isArray(tab.model.sections) || tab.model.sections.length <= 0;
    deleteSectionBtn.addEventListener('click', () => deleteSelectedSection(tab, tabKey));
    actionRow.appendChild(deleteSectionBtn);
    header.appendChild(actionRow);
  } else {
    const addSectionBtn = document.createElement('button');
    addSectionBtn.textContent = `Add ${schema.entityName}`;
    addSectionBtn.className = 'add-section';
    addSectionBtn.addEventListener('click', () => addSection(tab, tabKey));
    header.appendChild(addSectionBtn);
  }
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  if (tabKey === 'districts') {
    helper.textContent = `${tab.title} editor. Using ${sourceFile}. Saving writes ${isScenarioMode() ? 'scenario.districts_config.txt' : 'user.districts_config.txt'}.`;
  } else {
    helper.textContent = `${tab.title} editor. Saving writes ${isScenarioMode() ? 'scenario.*' : 'user.*'} files for this tab.`;
  }
  wrap.appendChild(helper);

  if (tabKey === 'districts') {
    if (tab.filteredFromDefault && tab.filteredFromDefault.applied) {
      const filtered = document.createElement('p');
      filtered.className = 'warning';
      filtered.textContent = `Scenario fallback filtered incompatible default districts: kept ${tab.filteredFromDefault.keptCount} of ${tab.filteredFromDefault.originalCount}.`;
      wrap.appendChild(filtered);
    }
  } else if (tabKey === 'wonders') {
    if (tab.filteredFromScenarioFallback && tab.filteredFromScenarioFallback.applied) {
      const filtered = document.createElement('p');
      filtered.className = 'warning';
      const sourceLabel = String(tab.filteredFromScenarioFallback.source || '').trim() || 'effective';
      filtered.textContent = `Scenario fallback filtered incompatible ${sourceLabel} wonder districts: kept ${tab.filteredFromScenarioFallback.keptCount} of ${tab.filteredFromScenarioFallback.originalCount}.`;
      wrap.appendChild(filtered);
    }
  }

  const listFilterRow = document.createElement('div');
  listFilterRow.className = 'reference-filter-row sticky-search-row';
  const listSearch = document.createElement('input');
  listSearch.type = 'search';
  listSearch.classList.add('app-search-input');
  listSearch.placeholder = `Search ${schema.entityName.toLowerCase()}...`;
  listSearch.value = state.sectionFilter[tabKey] || '';
  listFilterRow.appendChild(listSearch);
  wrap.appendChild(listFilterRow);

  const selectedIndex = Math.max(0, Math.min(state.sectionSelection[tabKey] || 0, Math.max(0, tab.model.sections.length - 1)));
  state.sectionSelection[tabKey] = selectedIndex;

  const layout = document.createElement('div');
  layout.className = 'entry-layout';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  const pendingSectionThumbs = [];
  const hydrateVisibleSectionThumbs = (limit = 20) => {
    let remaining = Math.max(1, Number(limit) || 20);
    if (remaining <= 0) return;
    const paneRect = listPane.getBoundingClientRect();
    for (let i = 0; i < pendingSectionThumbs.length && remaining > 0; i += 1) {
      const item = pendingSectionThumbs[i];
      if (!item || !item.thumb || item.thumb.dataset.thumbPending !== '1') continue;
      if (!item.thumb.isConnected) {
        item.thumb.dataset.thumbPending = '0';
        continue;
      }
      const row = item.thumb.closest('.entry-list-item');
      if (!row) {
        item.thumb.dataset.thumbPending = '0';
        continue;
      }
      const rowRect = row.getBoundingClientRect();
      if (rowRect.bottom < (paneRect.top - 48) || rowRect.top > (paneRect.bottom + 48)) continue;
      item.thumb.dataset.thumbPending = '0';
      item.load();
      remaining -= 1;
    }
  };
  const savedListTop = state.sectionListScrollTop[tabKey] || 0;
  listPane.addEventListener('scroll', () => {
    state.sectionListScrollTop[tabKey] = listPane.scrollTop;
    hydrateVisibleSectionThumbs(20);
  });
  const sectionNeedle = String(state.sectionFilter[tabKey] || '').trim().toLowerCase();
  const sectionEntries = tab.model.sections
    .map((section, sectionIndex) => {
      const sectionTitle = getSectionTitle(section, schema, sectionIndex);
      const districtDisplay = tabKey === 'districts' ? getDistrictSectionDisplay(section, sectionIndex) : null;
      const sortLabel = tabKey === 'districts'
        ? String(districtDisplay && districtDisplay.primary || sectionTitle || '').trim()
        : String(sectionTitle || '').trim();
      return { section, sectionIndex, sectionTitle, districtDisplay, sortLabel };
    })
    .filter(({ sectionTitle, districtDisplay }) => {
      const districtHay = districtDisplay ? `${districtDisplay.primary} ${districtDisplay.secondary} ${districtDisplay.tooltip}`.toLowerCase() : '';
      if (!sectionNeedle) return true;
      return String(sectionTitle).toLowerCase().includes(sectionNeedle)
        || (districtHay && districtHay.includes(sectionNeedle));
    })
    .sort((a, b) => String(a.sortLabel || '').localeCompare(String(b.sortLabel || ''), 'en', { sensitivity: 'base' }));
  sectionEntries.forEach(({ section, sectionIndex, sectionTitle, districtDisplay }) => {
    const itemBtn = document.createElement('button');
    const showSectionThumb = tabKey === 'districts' || tabKey === 'wonders' || tabKey === 'naturalWonders';
    itemBtn.className = showSectionThumb ? 'entry-list-item district-entry-item' : 'entry-list-item no-thumb';
    if (tabKey === 'wonders' || tabKey === 'naturalWonders') {
      itemBtn.classList.add('section-entry-item-large-thumb');
    }
    itemBtn.dataset.index = String(sectionIndex);
    itemBtn.classList.toggle('active', sectionIndex === selectedIndex);
    itemBtn.type = 'button';
    if (tabKey === 'districts') {
      const hasDistrictIssue = !!(districtIssueIndexes && districtIssueIndexes.has(sectionIndex));
      if (hasDistrictIssue) itemBtn.classList.add('district-entry-item-has-issue');
      const thumb = document.createElement('span');
      thumb.className = 'entry-thumb district-entry-thumb';
      itemBtn.appendChild(thumb);
      if (sectionIndex === selectedIndex) {
        thumb.dataset.thumbPending = '0';
        loadDistrictRepresentativePreview(section, thumb, 35);
      } else {
        thumb.dataset.thumbPending = '1';
        pendingSectionThumbs.push({
          thumb,
          load: () => loadDistrictRepresentativePreview(section, thumb, 35)
        });
      }
      const primary = document.createElement('strong');
      primary.className = 'district-entry-primary';
      primary.textContent = districtDisplay.primary;
      itemBtn.appendChild(primary);
      if (hasDistrictIssue) {
        const issueBadge = document.createElement('span');
        issueBadge.className = 'district-issue-badge';
        issueBadge.textContent = '⚠';
        issueBadge.title = 'This district has unresolved config references.';
        itemBtn.appendChild(issueBadge);
      }
      attachRichTooltip(
        itemBtn,
        `${formatSourceInfo(getSectionTabSourceMeta(tab), 'C3X Config')}\nDisplay Name: ${districtDisplay.primary}\nInternal Name: ${districtDisplay.secondary || '(same as display)'}\nTooltip: ${districtDisplay.tooltip || '(not set)'}`
      );
    } else if (tabKey === 'wonders' || tabKey === 'naturalWonders') {
      const hasSectionIssue = tabKey === 'wonders' && !!(wonderIssueIndexes && wonderIssueIndexes.has(sectionIndex));
      if (hasSectionIssue) itemBtn.classList.add('district-entry-item-has-issue');
      const thumb = document.createElement('span');
      thumb.className = 'entry-thumb district-entry-thumb section-entry-thumb-large';
      itemBtn.appendChild(thumb);
      if (sectionIndex === selectedIndex) {
        thumb.dataset.thumbPending = '0';
        if (tabKey === 'wonders') loadWonderCompletedThumbnail(section, thumb, 44);
        else loadNaturalWonderThumbnail(section, thumb, 44);
      } else {
        thumb.dataset.thumbPending = '1';
        pendingSectionThumbs.push({
          thumb,
          load: () => {
            if (tabKey === 'wonders') loadWonderCompletedThumbnail(section, thumb, 44);
            else loadNaturalWonderThumbnail(section, thumb, 44);
          }
        });
      }
      itemBtn.insertAdjacentHTML('beforeend', `<strong>${sectionTitle}</strong>`);
      if (hasSectionIssue) {
        const issueBadge = document.createElement('span');
        issueBadge.className = 'district-issue-badge';
        issueBadge.textContent = '⚠';
        issueBadge.title = 'This wonder district has unresolved config references.';
        itemBtn.appendChild(issueBadge);
      }
    } else {
      itemBtn.innerHTML = `<strong>${sectionTitle}</strong>`;
    }
    if (isSectionItemDirty(tabKey, sectionIndex, section)) {
      appendDirtyBadge(itemBtn, `${getSectionTitle(section, schema, sectionIndex)} has unsaved edits`);
    }
    itemBtn.addEventListener('mousedown', () => {
      state.tabContentScrollTop = el.tabContent.scrollTop;
    });
    itemBtn.addEventListener('click', () => {
      listPane.querySelectorAll('.entry-list-item.active').forEach((elNode) => elNode.classList.remove('active'));
      itemBtn.classList.add('active');
      navigateWithHistory(() => {
        state.tabContentScrollTop = el.tabContent.scrollTop;
        state.sectionListScrollTop[tabKey] = listPane.scrollTop;
        state.sectionSelection[tabKey] = sectionIndex;
      }, { preserveTabScroll: true });
    });
    listPane.appendChild(itemBtn);
  });
  listSearch.addEventListener('input', () => {
    state.sectionFilter[tabKey] = listSearch.value;
    state.sectionListScrollTop[tabKey] = 0;
    renderActiveTab({ preserveTabScroll: true });
  });
  layout.appendChild(listPane);
  requestAnimationFrame(() => hydrateVisibleSectionThumbs(28));

  const detailPane = document.createElement('div');
  detailPane.className = 'entry-detail-pane';
  const savedDetailTop = state.sectionDetailScrollTop[tabKey] || 0;
  detailPane.addEventListener('scroll', () => {
    state.sectionDetailScrollTop[tabKey] = detailPane.scrollTop;
  });

  if (tab.model.sections.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'section-card';
    empty.innerHTML = `<p class="hint">No ${schema.entityName.toLowerCase()} entries yet.</p>`;
    const addFirst = document.createElement('button');
    if (useCompactEntityActions) {
      addFirst.className = 'ghost action-add';
      addFirst.textContent = '+ Add';
    } else {
      addFirst.textContent = `Add ${schema.entityName}`;
    }
    addFirst.addEventListener('click', () => addSection(tab, tabKey));
    empty.appendChild(addFirst);
    detailPane.appendChild(empty);
  } else {
    const section = tab.model.sections[selectedIndex];
    const card = document.createElement('div');
    card.className = 'section-card';
    if (tabKey === 'districts') card.classList.add('district-detail-card');
    card.style.setProperty('--preview-size', `${state.previewSize}px`);

    const districtDisplay = tabKey === 'districts' ? getDistrictSectionDisplay(section, selectedIndex) : null;
    const top = document.createElement('div');
    top.className = 'section-top';
    const topTitle = document.createElement('strong');
    let topHint = null;
    topTitle.textContent = tabKey === 'districts'
      ? districtDisplay.primary
      : getSectionTitle(section, schema, selectedIndex);
    top.appendChild(topTitle);
    if (tabKey === 'districts') {
      topHint = document.createElement('span');
      topHint.className = 'hint';
      topHint.textContent = districtDisplay.secondary || districtDisplay.tooltip || '';
      if (topHint.textContent) top.appendChild(topHint);
      attachRichTooltip(
        top,
        `${formatSourceInfo(getSectionTabSourceMeta(tab), 'C3X Config')}\nDisplay Name: ${districtDisplay.primary}\nInternal Name: ${districtDisplay.secondary || '(same as display)'}\nTooltip: ${districtDisplay.tooltip || '(not set)'}`
      );
    }

    card.appendChild(top);
    if (tabKey === 'districts') {
      const warningLines = [];
      const districtValidationError = validateDistrictSection(section, selectedIndex);
      if (districtValidationError) {
        warningLines.push(districtValidationError);
      }
      const sectionIssues = districtCompatibility && districtCompatibility.bySection
        ? districtCompatibility.bySection.get(selectedIndex)
        : null;
      if (sectionIssues && sectionIssues.length > 0) {
        sectionIssues.forEach((issue) => {
          warningLines.push(`${issue.label}: ${issue.invalidValues.join(', ')}`);
        });
      }
      if (warningLines.length > 0) {
        const warningBox = document.createElement('div');
        warningBox.className = 'district-warning-box';
        const warningTitle = document.createElement('div');
        warningTitle.className = 'district-warning-title';
        warningTitle.textContent = 'Warning';
        warningBox.appendChild(warningTitle);
        const warningList = document.createElement('ul');
        warningList.className = 'district-warning-list';
        warningLines.forEach((line) => {
          const item = document.createElement('li');
          item.textContent = line;
          warningList.appendChild(item);
        });
        warningBox.appendChild(warningList);
        card.appendChild(warningBox);
      }
    } else if (tabKey === 'wonders') {
      const warningLines = [];
      const wonderValidationError = validateWonderSection(section, selectedIndex);
      if (wonderValidationError) {
        warningLines.push(wonderValidationError);
      }
      const sectionIssues = wonderCompatibility && wonderCompatibility.bySection
        ? wonderCompatibility.bySection.get(selectedIndex)
        : null;
      if (sectionIssues && sectionIssues.length > 0) {
        sectionIssues.forEach((issue) => {
          warningLines.push(`${issue.label}: ${issue.invalidValues.join(', ')}`);
        });
      }
      if (warningLines.length > 0) {
        const warningBox = document.createElement('div');
        warningBox.className = 'district-warning-box';
        const warningTitle = document.createElement('div');
        warningTitle.className = 'district-warning-title';
        warningTitle.textContent = 'Warning';
        warningBox.appendChild(warningTitle);
        const warningList = document.createElement('ul');
        warningList.className = 'district-warning-list';
        warningLines.forEach((line) => {
          const item = document.createElement('li');
          item.textContent = line;
          warningList.appendChild(item);
        });
        warningBox.appendChild(warningList);
        card.appendChild(warningBox);
      }
    }

    const refreshPreviews = (() => {
      const previewWrap = document.createElement('div');
      previewWrap.className = 'preview-wrap';
      if (tabKey === 'naturalWonders') previewWrap.classList.add('natural-wonder-preview-wrap');
      card.appendChild(previewWrap);
      if (tabKey === 'districts') {
        const refreshDistrict = () => {
          previewWrap.innerHTML = '';
          renderDistrictRepresentativePreviewCard(section, previewWrap, `${districtDisplay.primary} Art`);
        };
        refreshDistrict();
        return refreshDistrict;
      }
      const refresh = () => {
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
      refresh();
      return refresh;
    })();

    const previewFieldKeysByTab = {
      districts: new Set(['img_paths', 'custom_width', 'custom_height']),
      wonders: new Set(['img_path', 'img_row', 'img_column', 'img_construct_row', 'img_construct_column', 'enable_img_alt_dir', 'img_alt_dir_construct_row', 'img_alt_dir_construct_column', 'img_alt_dir_row', 'img_alt_dir_column', 'custom_width', 'custom_height']),
      naturalWonders: new Set(['img_path', 'img_row', 'img_column', 'animation', 'custom_width', 'custom_height']),
      animations: new Set(['ini_path', 'frame_time_seconds'])
    };
    const previewFields = previewFieldKeysByTab[tabKey] || new Set();

    const form = document.createElement('div');
    form.className = 'form-grid';
    let orderedSchemaFields = orderSectionFieldsByDocs(schema.fields, tab.fieldDocs);
    orderedSchemaFields = applyPreferredSectionFieldOrder(tabKey, orderedSchemaFields);
    if (tabKey === 'wonders' && !parseConfigBool(getFieldValue(section, 'enable_img_alt_dir'))) {
      const hiddenAltKeys = new Set([
        'img_alt_dir_construct_row',
        'img_alt_dir_construct_column',
        'img_alt_dir_row',
        'img_alt_dir_column'
      ]);
      orderedSchemaFields = orderedSchemaFields.filter((field) => !hiddenAltKeys.has(String(field && field.key || '')));
    }
    if (tabKey === 'animations') {
      const animationType = normalizeConfigToken(getFieldValue(section, 'type')).toLowerCase();
      orderedSchemaFields = orderedSchemaFields.filter((field) => shouldShowAnimationFieldForType(field && field.key, animationType));
    }
    orderedSchemaFields
      .forEach((schemaField) => {
      form.appendChild(renderKnownField(section, schemaField, tab.fieldDocs, (key, value) => {
        if (key === schema.titleKey) {
          const titleEl = listPane.querySelector(`.entry-list-item[data-index="${selectedIndex}"] strong`);
          if (titleEl) {
            titleEl.textContent = value || `${schema.entityName}`;
          }
        }
        if (tabKey === 'districts' && (key === 'name' || key === 'display_name' || key === 'tooltip')) {
          const listItem = listPane.querySelector(`.entry-list-item[data-index="${selectedIndex}"]`);
          const nextDisplay = getDistrictSectionDisplay(section, selectedIndex);
          if (listItem) {
            const primary = listItem.querySelector('.district-entry-primary');
            if (primary) primary.textContent = nextDisplay.primary;
          }
          topTitle.textContent = nextDisplay.primary;
          if (topHint) {
            topHint.textContent = nextDisplay.secondary || nextDisplay.tooltip || '';
            topHint.classList.toggle('hidden', !topHint.textContent);
          }
        }
        if (tabKey === 'districts' && key === 'vary_img_by_culture') {
          const existing = tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths')).map((v) => String(v || '').trim()).filter(Boolean);
          const expectedCount = getExpectedDistrictImagePathCount(section, existing);
          const next = existing.slice(0, expectedCount);
          while (next.length < expectedCount) next.push('');
          setSingleFieldValue(section, 'img_paths', next.join(', '));
          renderActiveTab({ preserveTabScroll: true });
          return;
        }
        if (tabKey === 'districts' && key === 'align_to_coast') {
          const existing = tokenizeListPreservingQuotes(getFieldValue(section, 'img_paths')).map((v) => String(v || '').trim()).filter(Boolean);
          const expectedCount = getExpectedDistrictImagePathCount(section, existing);
          const next = existing.slice(0, expectedCount);
          while (next.length < expectedCount) next.push('');
          setSingleFieldValue(section, 'img_paths', next.join(', '));
          renderActiveTab({ preserveTabScroll: true });
          return;
        }
        if (tabKey === 'districts' && key === 'vary_img_by_era') {
          renderActiveTab({ preserveTabScroll: true });
          return;
        }
        if (tabKey === 'wonders' && key === 'enable_img_alt_dir') {
          renderActiveTab({ preserveTabScroll: true });
          return;
        }
        if (tabKey === 'animations' && key === 'type') {
          state.tabContentScrollTop = el.tabContent ? el.tabContent.scrollTop : state.tabContentScrollTop;
          renderActiveTab({ preserveTabScroll: true });
          return;
        }
        if (tabKey === 'naturalWonders' && key === 'adjacency_dir') {
          syncNaturalWonderAnimationDirections(section);
          refreshPreviews();
          renderActiveTab({ preserveTabScroll: true });
          return;
        }
        if (previewFields.has(key)) {
          refreshPreviews();
        }
        setDirty(true);
      }));
      });
    card.appendChild(form);
    detailPane.appendChild(card);
  }

  layout.appendChild(detailPane);
  wrap.appendChild(layout);
  window.requestAnimationFrame(() => {
    listPane.scrollTop = savedListTop;
    detailPane.scrollTop = savedDetailTop;
  });

  syncSectionStickyOffsets(wrap, header);
  return wrap;
}

function renderTabs() {
  el.tabs.innerHTML = '';
  if (state.activeTab === 'players' && !hasCustomPlayerData()) {
    state.activeTab = state.bundle.tabs.scenarioSettings ? 'scenarioSettings' : (Object.keys(state.bundle.tabs)[0] || 'base');
  }
  if (state.activeTab === 'players' && state.bundle.tabs.scenarioSettings) {
    state.activeTab = 'scenarioSettings';
  }
  TAB_GROUPS.forEach((group) => {
    const present = group.keys.filter((key) => {
      if (!state.bundle.tabs[key]) return false;
      if (key === 'players') return false;
      return true;
    });
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
      button.dataset.tabKey = key;
      button.appendChild(createIcon(TAB_ICONS[key]));
      const text = document.createElement('span');
      text.textContent = tab.title;
      button.appendChild(text);
      applyDirtyBadgeToTabButton(button, key, tab);
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
  const resetScrollToTop = !!options.resetScrollToTop;
  if (state.referenceSectionNavCleanup) {
    try { state.referenceSectionNavCleanup(); } catch (_err) {}
    state.referenceSectionNavCleanup = null;
  }
  if (resetScrollToTop) {
    state.tabContentScrollTop = 0;
  } else if (!preserveTabScroll) {
    state.tabContentScrollTop = 0;
  }
  state.isRendering = true;
  hideRichTooltip();
  el.tabContent.innerHTML = '';
  if (state.activeTab === 'players' && state.bundle.tabs.scenarioSettings) {
    state.activeTab = 'scenarioSettings';
  }
  const tab = state.bundle.tabs[state.activeTab];
  if (!tab) {
    state.isRendering = false;
    return;
  }
  if (state.activeTab !== 'technologies' && techTreeModal.node && !techTreeModal.node.classList.contains('hidden')) {
    closeTechTreeModal();
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
  updateSaveButtonLabel();
  const targetTop = state.tabContentScrollTop || 0;
  window.requestAnimationFrame(() => {
    el.tabContent.scrollTop = targetTop;
    updateScrollTopFab();
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
    if (bundle && bundle.tabs && bundle.tabs.districts && bundle.tabs.districts.model && Array.isArray(bundle.tabs.districts.model.sections)) {
      // Always backfill known district defaults first so fallback scenarios retain expected art/flags.
      applySpecialDistrictDefaultsToSections(bundle.tabs.districts.model.sections);
    }
    if (bundle && state.settings.mode === 'scenario') {
      filterDistrictSectionsForScenarioFallback(bundle);
      filterWonderSectionsForScenarioFallback(bundle);
    }

    const previousActiveTab = state.activeTab;
    const shouldUsePersistedView = options && options.usePersistedView === true;
    const persistedView = shouldUsePersistedView ? loadPersistedViewSnapshot() : null;
    state.bundle = bundle;
    state.filesReadEntriesCache = null;
    state.filesReadEntriesCacheDirty = true;
    state.isDirty = false;
    state.undoSnapshot = null;
    clearDirtyTabCounts();
    refreshDirtyUi();
    state.activeTab = bundle.tabs[previousActiveTab]
      ? previousActiveTab
      : (Object.keys(bundle.tabs)[0] || 'base');
    if (persistedView && bundle.tabs[persistedView.activeTab]) {
      state.activeTab = persistedView.activeTab;
      state.sectionSelection = Object.assign({}, state.sectionSelection, cloneStateMap(persistedView.sectionSelection));
      state.referenceSelection = cloneStateMap(persistedView.referenceSelection);
      state.referenceFilter = cloneStateMap(persistedView.referenceFilter);
      state.referenceImprovementKind = cloneStateMap(persistedView.referenceImprovementKind);
      state.biqSectionSelectionByTab = cloneStateMap(persistedView.biqSectionSelectionByTab);
      state.biqRecordSelection = cloneStateMap(persistedView.biqRecordSelection);
      state.techTreeEraSelectionByTab = cloneStateMap(persistedView.techTreeEraSelectionByTab);
      state.techTreeSnapByTab = cloneStateMap(persistedView.techTreeSnapByTab);
      state.biqMapSelectedTile = Number.isFinite(persistedView.biqMapSelectedTile) ? persistedView.biqMapSelectedTile : -1;
      state.biqMapLayer = String(persistedView.biqMapLayer || 'terrain');
      state.biqMapZoom = Number.isFinite(persistedView.biqMapZoom) ? persistedView.biqMapZoom : state.biqMapZoom;
      state.tabContentScrollTop = Number.isFinite(persistedView.tabContentScrollTop) ? persistedView.tabContentScrollTop : 0;
    } else {
      state.tabContentScrollTop = 0;
    }
    state.baseFilter = '';
    state.biqMapArtCache = {};
    state.biqMapArtLoading = {};
    state.biqMapTerritoryEdgeCache = new Map();
    state.biqMapNtpColorCache = {};
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
    renderFilesReadModal();
    void refreshFilesReadAccess();
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

function getTabsForSavePayload() {
  const tabsToSave = {};
  ['base', 'districts', 'wonders', 'naturalWonders', 'animations', 'civilizations', 'technologies', 'resources', 'improvements', 'governments', 'units', 'gameConcepts', 'terrainPedia', 'workerActions', 'scenarioSettings', 'players', 'terrain', 'world', 'rules'].forEach((key) => {
    if (state.bundle && state.bundle.tabs && state.bundle.tabs[key]) tabsToSave[key] = state.bundle.tabs[key];
  });
  return tabsToSave;
}

function buildQuickUnifiedDiffText(oldText, newText) {
  const a = String(oldText || '').replace(/\r\n/g, '\n').split('\n');
  const b = String(newText || '').replace(/\r\n/g, '\n').split('\n');
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1;
  let aTail = a.length - 1;
  let bTail = b.length - 1;
  while (aTail >= prefix && bTail >= prefix && a[aTail] === b[bTail]) {
    aTail -= 1;
    bTail -= 1;
  }
  if (prefix > aTail && prefix > bTail) {
    return 'No textual differences.';
  }
  const out = [];
  out.push('--- Current');
  out.push('+++ Pending Save');
  out.push(`@@ -${prefix + 1},${Math.max(0, aTail - prefix + 1)} +${prefix + 1},${Math.max(0, bTail - prefix + 1)} @@`);
  const contextBeforeStart = Math.max(0, prefix - 3);
  for (let i = contextBeforeStart; i < prefix; i += 1) out.push(` ${a[i]}`);
  for (let i = prefix; i <= aTail; i += 1) out.push(`-${a[i]}`);
  for (let i = prefix; i <= bTail; i += 1) out.push(`+${b[i]}`);
  const contextAfterEnd = Math.min(b.length, bTail + 1 + 3);
  for (let i = bTail + 1; i < contextAfterEnd; i += 1) out.push(` ${b[i]}`);
  if (out.length > 2400) return `${out.slice(0, 2400).join('\n')}\n... (diff truncated)`;
  return out.join('\n');
}

function escapeHtml(raw) {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderUnifiedDiffHtml(diffText) {
  const lines = String(diffText || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let oldLine = 0;
  let newLine = 0;
  lines.forEach((line) => {
    const raw = String(line || '');
    if (!raw) return;
    if (raw.startsWith('diff --git ') || raw.startsWith('index ') || raw.startsWith('--- ') || raw.startsWith('+++ ')) return;
    const hunk = raw.match(/^@@\s+\-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    if (hunk) {
      oldLine = Number.parseInt(hunk[1], 10) || 0;
      newLine = Number.parseInt(hunk[2], 10) || 0;
      out.push(`<div class="file-diff-line hunk"><span class="ln old"></span><span class="ln new"></span><span class="txt">${escapeHtml(raw)}</span></div>`);
      return;
    }
    if (raw.startsWith('+')) {
      const lineNoNew = newLine;
      newLine += 1;
      out.push(`<div class="file-diff-line add"><span class="ln old"></span><span class="ln new">${lineNoNew}</span><span class="txt">${escapeHtml(raw)}</span></div>`);
      return;
    }
    if (raw.startsWith('-')) {
      const lineNoOld = oldLine;
      oldLine += 1;
      out.push(`<div class="file-diff-line del"><span class="ln old">${lineNoOld}</span><span class="ln new"></span><span class="txt">${escapeHtml(raw)}</span></div>`);
      return;
    }
    if (raw.startsWith(' ')) {
      const lineNoOld = oldLine;
      const lineNoNew = newLine;
      oldLine += 1;
      newLine += 1;
      out.push(`<div class="file-diff-line ctx"><span class="ln old">${lineNoOld}</span><span class="ln new">${lineNoNew}</span><span class="txt">${escapeHtml(raw)}</span></div>`);
      return;
    }
    out.push(`<div class="file-diff-line meta"><span class="ln old"></span><span class="ln new"></span><span class="txt">${escapeHtml(raw)}</span></div>`);
  });
  return out.join('');
}

function renderUnifiedDiffRowsHtml(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return '';
  return list.map((row) => {
    const kind = String(row && row.kind || 'meta');
    const oldLine = Number.isFinite(Number(row && row.oldLine)) ? String(Number(row.oldLine)) : '';
    const newLine = Number.isFinite(Number(row && row.newLine)) ? String(Number(row.newLine)) : '';
    const text = String(row && row.text || '');
    return `<div class="file-diff-line ${kind}"><span class="ln old">${escapeHtml(oldLine)}</span><span class="ln new">${escapeHtml(newLine)}</span><span class="txt">${escapeHtml(text)}</span></div>`;
  }).join('');
}

function closeFileDiffModal() {
  if (!el.fileDiffModalOverlay) return;
  state.fileDiffOpen = false;
  el.fileDiffModalOverlay.classList.add('hidden');
  el.fileDiffModalOverlay.setAttribute('aria-hidden', 'true');
}

async function openFileDiffModalForPath(targetPath) {
  if (!state.bundle || !window.c3xManager || typeof window.c3xManager.previewFileDiff !== 'function') {
    setStatus('Load configs before viewing file changes.', true);
    return;
  }
  const pathValue = String(targetPath || '').trim();
  if (!pathValue) return;
  if (!el.fileDiffModalOverlay || !el.fileDiffContent || !el.fileDiffModalBody) return;
  state.fileDiffOpen = true;
  el.fileDiffModalOverlay.classList.remove('hidden');
  el.fileDiffModalOverlay.setAttribute('aria-hidden', 'false');
  if (el.fileDiffModalTitle) el.fileDiffModalTitle.textContent = 'File Changes';
  el.fileDiffModalBody.textContent = `Computing pending changes for ${compactPathFromCiv3Root(pathValue) || pathValue}...`;
  el.fileDiffContent.classList.add('loading');
  el.fileDiffContent.innerHTML = '<div class="file-diff-loading"><span class="file-diff-loading-spinner" aria-hidden="true"></span><span>Computing diff preview...</span></div>';
  try {
    const res = await window.c3xManager.previewFileDiff({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      civ3Path: state.settings.civ3Path,
      scenarioPath: state.settings.scenarioPath,
      tabs: getTabsForSavePayload(),
      targetPath: pathValue
    });
    el.fileDiffContent.classList.remove('loading');
    if (!res || !res.ok) {
      el.fileDiffModalBody.textContent = `Could not compute diff: ${(res && res.error) || 'unknown error'}`;
      el.fileDiffContent.textContent = '';
      return;
    }
    if (!res.found) {
      el.fileDiffModalBody.textContent = 'No pending text/INI write found for this file.';
      el.fileDiffContent.textContent = '';
      return;
    }
    const compact = compactPathFromCiv3Root(res.path) || res.path;
    if (el.fileDiffModalTitle) el.fileDiffModalTitle.textContent = `File Changes: ${getPathTail(res.path)}`;
    el.fileDiffModalBody.textContent = `${compact} | ${res.exists ? 'Existing file' : 'New file'} | ${String(res.kind || '').toUpperCase() || 'TEXT'}`;
    if (Array.isArray(res.diffRows) && res.diffRows.length > 0) {
      el.fileDiffContent.innerHTML = renderUnifiedDiffRowsHtml(res.diffRows);
    } else if (res.diffText) {
      el.fileDiffContent.innerHTML = renderUnifiedDiffHtml(res.diffText);
    } else {
      el.fileDiffContent.textContent = buildQuickUnifiedDiffText(res.oldText, res.newText);
    }
  } catch (err) {
    el.fileDiffContent.classList.remove('loading');
    el.fileDiffContent.textContent = '';
    el.fileDiffModalBody.textContent = `Could not compute diff: ${err.message}`;
  }
}

function clearSaveToastTimer() {
  if (state.saveUi && state.saveUi.toastTimer) {
    window.clearTimeout(state.saveUi.toastTimer);
    state.saveUi.toastTimer = null;
  }
}

function hideSaveToast() {
  if (!el.saveToast) return;
  clearSaveToastTimer();
  el.saveToast.classList.add('hidden');
  el.saveToast.classList.remove('saving', 'success', 'failure');
  if (state.saveUi) state.saveUi.toastPhase = 'idle';
}

function showSaveToast({ phase = 'saving', title = '', body = '', autoHideMs = 0 } = {}) {
  if (!el.saveToast || !el.saveToastTitle || !el.saveToastBody) return;
  clearSaveToastTimer();
  el.saveToast.classList.remove('hidden', 'saving', 'success', 'failure');
  el.saveToast.classList.add(phase === 'success' ? 'success' : phase === 'failure' ? 'failure' : 'saving');
  el.saveToastTitle.textContent = title || (phase === 'saving' ? 'Saving files...' : 'Save update');
  el.saveToastBody.textContent = body || '';
  if (state.saveUi) state.saveUi.toastPhase = phase;
  if (autoHideMs > 0) {
    state.saveUi.toastTimer = window.setTimeout(() => {
      hideSaveToast();
    }, autoHideMs);
  }
}

function buildSavePayload({ tabsToSave, dirtyTabs }) {
  return {
    mode: state.settings.mode,
    c3xPath: state.settings.c3xPath,
    civ3Path: state.settings.civ3Path,
    scenarioPath: state.settings.scenarioPath,
    dirtyTabs,
    tabs: tabsToSave
  };
}

function mapSaveKindLabel(kind) {
  const key = String(kind || '').trim().toLowerCase();
  if (!key) return 'File';
  if (key === 'base') return 'Base Config';
  if (key === 'districts') return 'Districts';
  if (key === 'wonders') return 'Wonder Districts';
  if (key === 'naturalwonders') return 'Natural Wonders';
  if (key === 'animations') return 'Tile Animations';
  if (key === 'biq') return 'BIQ';
  if (key === 'unitini') return 'Unit INI';
  if (key === 'pediaicons') return 'PediaIcons';
  if (key === 'civilopedia') return 'Civilopedia';
  if (key === 'diplomacy') return 'Diplomacy';
  return key.toUpperCase();
}

function dedupeSaveItems(items) {
  const byPath = new Map();
  (items || []).forEach((item) => {
    const pathValue = String(item && item.path || '').trim();
    if (!pathValue) return;
    byPath.set(pathValue, {
      path: pathValue,
      kind: String(item && item.kind || ''),
      isNew: !!(item && item.isNew),
      status: String(item && item.status || 'pending'),
      note: String(item && item.note || '')
    });
  });
  return Array.from(byPath.values());
}

function buildFallbackSaveItems() {
  return dedupeSaveItems(
    Array.from(collectPendingWritePathsFromDirtyTabs()).map((pathValue) => ({
      path: String(pathValue || ''),
      kind: '',
      isNew: false,
      status: 'pending',
      note: 'Pending write'
    }))
  );
}

async function previewSaveItems(payload) {
  const fallbackItems = buildFallbackSaveItems();
  if (!window.c3xManager || typeof window.c3xManager.previewSavePlan !== 'function') return fallbackItems;
  try {
    const preview = await window.c3xManager.previewSavePlan(payload);
    if (!preview || !preview.ok || !Array.isArray(preview.writes)) return fallbackItems;
    const items = preview.writes.map((entry) => ({
      path: String(entry && entry.path || ''),
      kind: String(entry && entry.kind || ''),
      isNew: !entry.exists,
      status: 'pending',
      note: mapSaveKindLabel(entry && entry.kind)
    }));
    return dedupeSaveItems(items);
  } catch (_err) {
    return fallbackItems;
  }
}

function setSaveDetailState({ items, summary, rollbackSummary = '', rollbackHasWarning = false }) {
  state.saveUi.detailItems = dedupeSaveItems(items || []);
  state.saveUi.detailSummary = String(summary || '');
  state.saveUi.rollbackSummary = String(rollbackSummary || '');
  state.saveUi.rollbackHasWarning = !!rollbackHasWarning;
  if (state.saveUi.detailOpen) renderSaveProgressModal();
}

function buildSaveOutcome(preparedItems, res, fallbackError = '') {
  const baseItems = dedupeSaveItems(preparedItems || []);
  const byPath = new Map();
  baseItems.forEach((item) => byPath.set(item.path, { ...item }));
  const ensureItem = (pathValue) => {
    const pathText = String(pathValue || '').trim();
    if (!pathText) return null;
    if (!byPath.has(pathText)) {
      byPath.set(pathText, {
        path: pathText,
        kind: '',
        isNew: false,
        status: 'pending',
        note: 'Pending write'
      });
    }
    return byPath.get(pathText);
  };
  const writeResults = Array.isArray(res && res.writeResults) ? res.writeResults : [];
  const rollback = res && typeof res.rollback === 'object' ? res.rollback : null;
  const rollbackByPath = new Map();
  if (rollback && Array.isArray(rollback.results)) {
    rollback.results.forEach((entry) => {
      const pathValue = String(entry && entry.path || '').trim();
      if (!pathValue) return;
      rollbackByPath.set(pathValue, entry);
      ensureItem(pathValue);
    });
  }
  writeResults.forEach((entry) => {
    const item = ensureItem(entry && entry.path);
    if (!item) return;
    item.kind = item.kind || String(entry && entry.kind || '');
    if (String(entry && entry.status || '') === 'failed') {
      item.status = 'failed';
      item.note = String(entry && entry.error || 'Write failed');
    } else if (rollbackByPath.has(item.path)) {
      const rb = rollbackByPath.get(item.path);
      if (String(rb && rb.status || '') === 'rollbackFailed') {
        item.status = 'failed';
        item.note = `Rollback failed: ${String(rb && rb.error || 'unknown error')}`;
      } else {
        item.status = 'rolled-back';
        item.note = 'Rolled back after save failure';
      }
    } else {
      item.status = 'success';
      item.note = item.note || 'Saved';
    }
  });
  if (res && res.ok) {
    byPath.forEach((item) => {
      item.status = 'success';
      item.note = item.isNew ? 'Created' : 'Saved';
    });
    const filesSaved = byPath.size;
    return {
      phase: 'success',
      title: filesSaved > 0 ? `Saved ${filesSaved} file${filesSaved === 1 ? '' : 's'}` : 'No file changes',
      body: 'Click to view save details',
      summary: filesSaved > 0
        ? `Saved ${filesSaved} file${filesSaved === 1 ? '' : 's'} successfully.`
        : 'No files required changes.',
      items: Array.from(byPath.values()),
      rollbackSummary: '',
      rollbackHasWarning: false
    };
  }
  byPath.forEach((item) => {
    if (item.status === 'pending') {
      item.status = 'failed';
      item.note = item.note || 'Not saved';
    }
  });
  let rollbackSummary = '';
  let rollbackHasWarning = false;
  if (rollback) {
    const attempted = Number(rollback.attempted || 0);
    const failed = Number(rollback.failed || 0);
    if (attempted > 0 && failed === 0) {
      rollbackSummary = `Rollback complete: ${attempted} file${attempted === 1 ? '' : 's'} restored or removed.`;
    } else if (attempted > 0) {
      rollbackSummary = `Rollback encountered ${failed} issue${failed === 1 ? '' : 's'} across ${attempted} file${attempted === 1 ? '' : 's'}.`;
      rollbackHasWarning = true;
    }
  }
  const errorText = String((res && res.error) || fallbackError || 'Save failed.');
  return {
    phase: 'failure',
    title: rollbackHasWarning ? 'Save failed with rollback issues' : 'Save failed',
    body: rollbackSummary || 'Click to view save details',
    summary: errorText,
    items: Array.from(byPath.values()),
    rollbackSummary,
    rollbackHasWarning
  };
}

function renderSaveProgressModal() {
  if (!el.saveProgressList || !el.saveProgressModalBody || !el.saveProgressRollback) return;
  const items = Array.isArray(state.saveUi.detailItems) ? state.saveUi.detailItems : [];
  el.saveProgressModalBody.textContent = state.saveUi.detailSummary || 'Save status details are shown below.';
  el.saveProgressList.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('li');
    empty.className = 'files-read-empty';
    empty.textContent = 'No save operations to display.';
    el.saveProgressList.appendChild(empty);
  } else {
    items.forEach((item) => {
      const li = document.createElement('li');
      const statusKey = String(item && item.status || 'pending');
      const statusClass = statusKey === 'success'
        ? 'success'
        : statusKey === 'rolled-back'
          ? 'rolled-back'
          : statusKey === 'failed'
            ? 'failed'
            : 'pending';
      li.className = `save-progress-item ${statusClass}`;

      const icon = document.createElement('span');
      icon.className = 'save-progress-item-icon';
      li.appendChild(icon);

      const main = document.createElement('div');
      main.className = 'save-progress-item-main';
      const pathEl = document.createElement('code');
      pathEl.className = 'save-progress-item-path';
      pathEl.textContent = compactPathFromCiv3Root(item.path) || item.path;
      pathEl.title = item.path;
      main.appendChild(pathEl);
      const note = document.createElement('div');
      note.className = 'save-progress-item-note';
      note.textContent = String(item.note || mapSaveKindLabel(item.kind) || '');
      main.appendChild(note);
      li.appendChild(main);

      const status = document.createElement('span');
      status.className = 'save-progress-item-status';
      status.textContent = statusClass === 'success'
        ? 'Saved'
        : statusClass === 'rolled-back'
          ? 'Rolled Back'
          : statusClass === 'failed'
            ? 'Failed'
            : 'Saving';
      li.appendChild(status);
      el.saveProgressList.appendChild(li);
    });
  }
  const rollbackText = String(state.saveUi.rollbackSummary || '').trim();
  if (rollbackText) {
    el.saveProgressRollback.classList.remove('hidden');
    el.saveProgressRollback.classList.toggle('warn', !!state.saveUi.rollbackHasWarning);
    el.saveProgressRollback.textContent = rollbackText;
  } else {
    el.saveProgressRollback.classList.add('hidden');
    el.saveProgressRollback.classList.remove('warn');
    el.saveProgressRollback.textContent = '';
  }
}

function openSaveProgressModal() {
  if (!el.saveProgressModalOverlay) return;
  state.saveUi.detailOpen = true;
  renderSaveProgressModal();
  el.saveProgressModalOverlay.classList.remove('hidden');
  el.saveProgressModalOverlay.setAttribute('aria-hidden', 'false');
}

function closeSaveProgressModal() {
  if (!el.saveProgressModalOverlay) return;
  state.saveUi.detailOpen = false;
  el.saveProgressModalOverlay.classList.add('hidden');
  el.saveProgressModalOverlay.setAttribute('aria-hidden', 'true');
}

async function saveCurrentBundle() {
  if (!state.bundle) {
    setStatus('Load configs before saving.', true);
    return false;
  }
  const validationError = getSectionValidationError();
  if (validationError) {
    setStatus(`Save blocked: ${validationError}`, true);
    refreshDirtyUi();
    return false;
  }

  syncSettingsFromInputs();
  await window.c3xManager.setSettings(state.settings);

  const tabsToSave = getTabsForSavePayload();
  const dirtyTabs = Object.keys((state.bundle && state.bundle.tabs) || {}).filter((key) => getTabDirtyCount(key) > 0);
  const payload = buildSavePayload({ tabsToSave, dirtyTabs });
  const preparedItems = await previewSaveItems(payload);
  setSaveDetailState({
    items: preparedItems,
    summary: `Saving ${preparedItems.length} file${preparedItems.length === 1 ? '' : 's'}...`,
    rollbackSummary: '',
    rollbackHasWarning: false
  });
  showSaveToast({
    phase: 'saving',
    title: 'Saving files...',
    body: `Writing ${preparedItems.length} file${preparedItems.length === 1 ? '' : 's'}`
  });

  try {
    const res = await window.c3xManager.saveBundle(payload);
    const outcome = buildSaveOutcome(preparedItems, res);
    setSaveDetailState({
      items: outcome.items,
      summary: outcome.summary,
      rollbackSummary: outcome.rollbackSummary,
      rollbackHasWarning: outcome.rollbackHasWarning
    });
    showSaveToast({
      phase: outcome.phase,
      title: outcome.title,
      body: outcome.body,
      autoHideMs: outcome.phase === 'success' ? 14000 : 20000
    });

    if (!res.ok) {
      setStatus(`Save failed: ${res.error || 'unknown error'}`, true);
      return false;
    }

    const paths = res.saveReport.map((r) => r.path).join(' | ');
    const biqReport = res.saveReport.find((r) => r.kind === 'biq');
    markReferenceTabsAsSaved();
    captureCleanSnapshot();
    if (biqReport && (Number(biqReport.skipped || 0) > 0 || String(biqReport.warning || '').trim())) {
      const warningText = friendlyBiqWarningText(String(biqReport.warning || ''));
      const suffix = warningText ? ` ${warningText}` : '';
      setStatus(`Saved ${res.saveReport.length} file(s): ${paths} | BIQ applied ${biqReport.applied || 0}, skipped ${biqReport.skipped || 0}.${suffix}`, true);
    } else {
      setStatus(`Saved ${res.saveReport.length} file(s): ${paths}`);
    }
    return true;
  } catch (err) {
    const outcome = buildSaveOutcome(preparedItems, { ok: false, error: err.message }, err.message);
    setSaveDetailState({
      items: outcome.items,
      summary: outcome.summary,
      rollbackSummary: outcome.rollbackSummary,
      rollbackHasWarning: outcome.rollbackHasWarning
    });
    showSaveToast({
      phase: outcome.phase,
      title: outcome.title,
      body: outcome.body,
      autoHideMs: 20000
    });
    setStatus(`Failed to save: ${err.message}`, true);
    return false;
  }
}

function friendlyBiqWarningText(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const parts = text.split(';').map((p) => p.trim()).filter(Boolean);
  const out = [];
  parts.forEach((p) => {
    const lower = p.toLowerCase();
    if (lower.includes('cannot delete') && lower.includes('custom map data exists')) {
      out.push('Some deletes were blocked because this scenario has custom map data (cities/units/tiles).');
      return;
    }
    if (lower.startsWith('missing record')) {
      out.push('Some requested records were not found at save time.');
      return;
    }
    if (lower.startsWith('unknown section')) {
      out.push('Some BIQ operations were ignored due to unknown section codes.');
      return;
    }
    if (lower.startsWith('no setter for field')) {
      out.push('Some field updates were skipped because the BIQ bridge has no writer for those fields.');
      return;
    }
  });
  const unique = Array.from(new Set(out));
  return unique.join(' ');
}

function markReferenceTabEntryOriginals(tab) {
  if (!tab || !Array.isArray(tab.entries)) return;
  tab.recordOps = [];
  if (Object.prototype.hasOwnProperty.call(tab, 'diplomacyText')) {
    tab.originalDiplomacyText = String(tab.diplomacyText || '');
  }
  if (Array.isArray(tab.diplomacySlots)) {
    tab.diplomacySlots.forEach((slot, idx) => {
      if (!slot) return;
      if (!Number.isFinite(Number(slot.index))) slot.index = idx;
      slot.originalFirstContact = String(slot.firstContact || '');
      slot.originalFirstDeal = String(slot.firstDeal || '');
    });
    tab.diplomacyOptions = rebuildCivilizationDiplomacyOptions(tab);
  }
  tab.entries.forEach((entry) => {
    if (!entry) return;
    entry.isNew = false;
    entry.originalOverview = String(entry.overview || '');
    entry.originalDescription = String(entry.description || '');
    entry.originalIconPaths = Array.isArray(entry.iconPaths) ? [...entry.iconPaths] : [];
    entry.originalRacePaths = Array.isArray(entry.racePaths) ? [...entry.racePaths] : [];
    entry.originalAnimationName = String(entry.animationName || '');
    entry.unitAnimationEdited = false;
    entry.unitFolderCloneSource = '';
    if (entry.unitIniEditor) {
      entry.unitIniEditor.originalActions = Array.isArray(entry.unitIniEditor.actions) ? entry.unitIniEditor.actions.map((row) => ({
        key: String(row && row.key || '').trim().toUpperCase(),
        relativePath: String(row && row.relativePath || '').trim(),
        timingSeconds: Number.isFinite(Number(row && row.timingSeconds)) ? Number(row.timingSeconds) : null
      })) : [];
      if (Array.isArray(entry.unitIniEditor.typeRows)) {
        entry.unitIniEditor.originalTypeRows = cloneUnitTypeRows(entry.unitIniEditor.typeRows);
      }
      if (Array.isArray(entry.unitIniEditor.sections)) {
        entry.unitIniEditor.originalSections = cloneUnitIniSections(entry.unitIniEditor.sections);
      }
      entry.unitIniEditor.animationName = String(entry.animationName || '').trim();
    }
    if (Array.isArray(entry.biqFields)) {
      entry.biqFields.forEach((field) => {
        if (!field) return;
        field.originalValue = String(field.value || '');
      });
    }
  });
}

function markReferenceTabsAsSaved() {
  if (!state.bundle || !state.bundle.tabs) return;
  Object.values(state.bundle.tabs).forEach((tab) => {
    if (!tab) return;
    if (tab.type === 'reference') {
      markReferenceTabEntryOriginals(tab);
      return;
    }
    if (tab.type === 'biq') {
      tab.recordOps = [];
      const sections = Array.isArray(tab.sections) ? tab.sections : [];
      sections.forEach((section) => {
        const records = Array.isArray(section && section.records) ? section.records : [];
        records.forEach((record) => {
          if (!record) return;
          delete record.newRecordRef;
          const fields = Array.isArray(record.fields) ? record.fields : [];
          fields.forEach((field) => {
            if (!field) return;
            field.originalValue = String(field.value || '');
          });
        });
      });
      return;
    }
    if (tab.key === 'terrain' && tab.civilopedia) {
      markReferenceTabEntryOriginals(tab.civilopedia.terrain);
      markReferenceTabEntryOriginals(tab.civilopedia.workerActions);
    }
  });
}

function hideUnsavedChangesModal() {
  state.unsavedModal.open = false;
  if (el.unsavedModalOverlay) {
    el.unsavedModalOverlay.classList.add('hidden');
    el.unsavedModalOverlay.setAttribute('aria-hidden', 'true');
  }
}

function resolveUnsavedChangesModal(choice) {
  const resolver = state.unsavedModal.resolve;
  state.unsavedModal.resolve = null;
  hideUnsavedChangesModal();
  if (typeof resolver === 'function') resolver(choice || 'cancel');
}

function promptUnsavedChanges(actionLabel) {
  if (!el.unsavedModalOverlay) return Promise.resolve('cancel');
  const label = String(actionLabel || 'continue');
  if (el.unsavedModalBody) {
    el.unsavedModalBody.textContent = `You have unsaved changes. Choose how to proceed before ${label}.`;
  }
  state.unsavedModal.open = true;
  el.unsavedModalOverlay.classList.remove('hidden');
  el.unsavedModalOverlay.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    if (el.unsavedSaveContinue) {
      el.unsavedSaveContinue.focus({ preventScroll: true });
    }
  }, 0);
  return new Promise((resolve) => {
    state.unsavedModal.resolve = resolve;
  });
}

async function confirmResolveUnsavedChanges(actionLabel) {
  if (!state.isDirty) return true;
  const choice = await promptUnsavedChanges(actionLabel || 'continuing');
  if (choice === 'save') {
    const ok = await saveCurrentBundle();
    return !!ok;
  }
  if (choice === 'discard') {
    return true;
  }
  return false;
}

function undoOneStep() {
  if (!state.bundle || !state.undoSnapshot) {
    setStatus('No unsaved changes to undo.');
    return;
  }
  try {
    const restoredEditableTabs = JSON.parse(state.undoSnapshot);
    const currentTabs = state.bundle && state.bundle.tabs ? state.bundle.tabs : {};
    const mergedTabs = Object.assign({}, currentTabs);
    EDITABLE_TAB_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(restoredEditableTabs, key)) {
        mergedTabs[key] = restoredEditableTabs[key];
      } else {
        delete mergedTabs[key];
      }
    });
    state.bundle.tabs = mergedTabs;
    state.undoSnapshot = null;
    state.civilopediaEditorOpen = {};
    state.civilopediaPreviewVisible = {};
    // Undo restores the captured pre-edit snapshot (current single-step model),
    // so we can mark clean directly and avoid expensive whole-bundle diffs.
    state.isDirty = false;
    clearDirtyTabCounts();
    markFilesReadEntriesDirty();
    recomputeFilesReadIssueCount();
    refreshDirtyUi();
    renderTabs();
    renderActiveTab({ preserveTabScroll: true });
    if (el.filesReadModalOverlay && !el.filesReadModalOverlay.classList.contains('hidden')) {
      renderFilesReadModal();
    }
    setStatus('Undid unsaved changes.');
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
    const allow = await confirmResolveUnsavedChanges('switching scenarios');
    if (!allow) return;
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
  if (!state.settings.performanceMode) {
    state.settings.performanceMode = DEFAULT_PERFORMANCE_MODE;
  }
  state.startupPerformanceMode = String(state.settings.performanceMode || DEFAULT_PERFORMANCE_MODE);
  applyPerformanceModeRuntime(state.settings.performanceMode, { clearCaches: false });
  applyUiFontScale(state.settings.uiFontScale || 1);
  state.trackDirty = false;
  state.suppressDirtyUntilInteraction = true;
  refreshDirtyUi();
  updateFilesReadIssueBadge();
  renderFilesReadModal();
  updateNavButtons();
  fillInputsFromSettings();
  lockPathInputs();
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
    const allow = await confirmResolveUnsavedChanges('switching to Standard Game');
    if (!allow) return;
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
      const allow = await confirmResolveUnsavedChanges('switching scenarios');
      if (!allow) {
        updateScenarioSelectValue();
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
  if (el.modeScenarioNewAction) {
    resizeScenarioNewActionControl();
    el.modeScenarioNewAction.addEventListener('change', async () => {
      resizeScenarioNewActionControl();
      const selected = String(el.modeScenarioNewAction.value || '');
      if (!selected) return;
      if (selected === '__copy_existing__') {
        await runScenarioCreateFlow('copy');
        return;
      }
      if (selected === '__create_base__') {
        await runScenarioCreateFlow('base');
        return;
      }
      resetScenarioNewActionControl();
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

  if (window.c3xManager && typeof window.c3xManager.onPerformanceModeMenuSelect === 'function') {
    state.performanceMenuUnsubscribe = window.c3xManager.onPerformanceModeMenuSelect((nextMode) => {
      void updatePerformanceMode(nextMode);
    });
    window.addEventListener('beforeunload', () => {
      if (state.performanceMenuUnsubscribe) {
        state.performanceMenuUnsubscribe();
        state.performanceMenuUnsubscribe = null;
      }
    }, { once: true });
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
      if (input === el.scenarioPath) {
        return;
      }
      queueAutoReload('Reloading after path edit...');
    });
    input.addEventListener('blur', async () => {
      if (input === el.civ3Path) {
        void refreshScenarioSelectOptions();
      }
      if (input === el.scenarioPath) {
        const allow = await confirmResolveUnsavedChanges('switching scenarios');
        if (!allow) return;
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
  if (el.backBtn) {
    el.backBtn.addEventListener('click', navigateBack);
  }
  if (el.forwardBtn) {
    el.forwardBtn.addEventListener('click', navigateForward);
  }
  if (el.globalSearchBtn) {
    el.globalSearchBtn.addEventListener('click', () => {
      openGlobalSearchOverlay('');
    });
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
  if (el.filesReadToggle) {
    el.filesReadToggle.addEventListener('click', () => {
      openFilesReadModal();
    });
  }
  if (el.filesReadClose) {
    el.filesReadClose.addEventListener('click', () => {
      closeFilesReadModal();
    });
  }
  if (el.fileDiffClose) {
    el.fileDiffClose.addEventListener('click', () => {
      closeFileDiffModal();
    });
  }
  if (el.saveToastButton) {
    el.saveToastButton.addEventListener('click', () => {
      openSaveProgressModal();
    });
  }
  if (el.saveProgressClose) {
    el.saveProgressClose.addEventListener('click', () => {
      closeSaveProgressModal();
    });
  }
  if (el.filesReadModalOverlay) {
    el.filesReadModalOverlay.addEventListener('click', (ev) => {
      if (ev.target === el.filesReadModalOverlay) {
        closeFilesReadModal();
      }
    });
  }
  if (el.fileDiffModalOverlay) {
    el.fileDiffModalOverlay.addEventListener('click', (ev) => {
      if (ev.target === el.fileDiffModalOverlay) {
        closeFileDiffModal();
      }
    });
  }
  if (el.saveProgressModalOverlay) {
    el.saveProgressModalOverlay.addEventListener('click', (ev) => {
      if (ev.target === el.saveProgressModalOverlay) {
        closeSaveProgressModal();
      }
    });
  }
  [
    ['locationCore', el.filesFilterCore],
    ['locationScenario', el.filesFilterScenario],
    ['locationC3x', el.filesFilterC3x],
    ['locationExternal', el.filesFilterExternal],
    ['typeConfigIni', el.filesFilterTypeConfigIni],
    ['typeAnimationIni', el.filesFilterTypeAnimationIni],
    ['typeText', el.filesFilterTypeText],
    ['typeBiq', el.filesFilterTypeBiq],
    ['statusNew', el.filesFilterStatusNew],
    ['statusChanged', el.filesFilterStatusChanged],
    ['statusUnchanged', el.filesFilterStatusUnchanged],
    ['statusRisk', el.filesFilterStatusRisk]
  ].forEach(([key, checkbox]) => {
    if (!checkbox) return;
    checkbox.addEventListener('change', () => {
      state.filesReadFilters[key] = !!checkbox.checked;
      scheduleFilesReadModalRender(0);
    });
  });
  if (el.filesReadSearchInput) {
    el.filesReadSearchInput.addEventListener('input', () => {
      state.filesReadSearchInputMirror = String(el.filesReadSearchInput.value || '');
      state.filesReadSearchQuery = state.filesReadSearchInputMirror;
      scheduleFilesReadModalRender(70);
    });
  }
  if (el.copyDebugLog) {
    el.copyDebugLog.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(el.debugLog.textContent || '');
        animateCopyDebugLogButton();
        setStatus('Debug log copied.');
      } catch (_err) {
        setStatus('Could not copy debug log.', true);
      }
    });
  }
  if (el.unsavedSaveContinue) {
    el.unsavedSaveContinue.addEventListener('click', () => {
      resolveUnsavedChangesModal('save');
    });
  }
  if (el.unsavedDiscard) {
    el.unsavedDiscard.addEventListener('click', () => {
      resolveUnsavedChangesModal('discard');
    });
  }
  if (el.unsavedCancel) {
    el.unsavedCancel.addEventListener('click', () => {
      resolveUnsavedChangesModal('cancel');
    });
  }
  if (el.unsavedModalOverlay) {
    el.unsavedModalOverlay.addEventListener('click', (ev) => {
      if (ev.target === el.unsavedModalOverlay) {
        resolveUnsavedChangesModal('cancel');
      }
    });
  }
  if (el.entityModalOverlay) {
    el.entityModalOverlay.addEventListener('click', (ev) => {
      if (ev.target === el.entityModalOverlay) {
        resolveEntityModal(null);
      }
    });
  }
  if (el.scrollTopFab && el.tabContent) {
    el.scrollTopFab.addEventListener('click', () => {
      el.tabContent.scrollTo({ top: 0, behavior: 'smooth' });
    });
    el.tabContent.addEventListener('scroll', () => {
      state.tabContentScrollTop = el.tabContent.scrollTop;
      persistCurrentViewSnapshot();
      updateScrollTopFab();
    }, { passive: true });
  }
  if (el.globalSearchInput) {
    el.globalSearchInput.addEventListener('input', () => {
      state.globalSearch.query = el.globalSearchInput.value;
      refreshGlobalSearchResults();
    });
  }
  if (el.globalSearchOverlay) {
    el.globalSearchOverlay.addEventListener('click', (ev) => {
      if (ev.target === el.globalSearchOverlay) {
        closeGlobalSearchOverlay();
      }
    });
  }
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && techTreeModal.node && !techTreeModal.node.classList.contains('hidden')) {
      closeTechTreeModal();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if (state.unsavedModal.open && ev.key === 'Escape') {
      resolveUnsavedChangesModal('cancel');
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if (el.fileDiffModalOverlay && !el.fileDiffModalOverlay.classList.contains('hidden') && ev.key === 'Escape') {
      closeFileDiffModal();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if (el.saveProgressModalOverlay && !el.saveProgressModalOverlay.classList.contains('hidden') && ev.key === 'Escape') {
      closeSaveProgressModal();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if (el.filesReadModalOverlay && !el.filesReadModalOverlay.classList.contains('hidden') && ev.key === 'Escape') {
      if (document.activeElement === el.filesReadSearchInput && el.filesReadSearchInput) {
        if (el.filesReadSearchInput.value) {
          el.filesReadSearchInput.value = '';
          state.filesReadSearchInputMirror = '';
          state.filesReadSearchQuery = '';
          scheduleFilesReadModalRender(0);
        }
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      closeFilesReadModal();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if (state.entityModal.open && ev.key === 'Escape') {
      resolveEntityModal(null);
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    const key = String(ev.key || '').toLowerCase();
    if ((ev.metaKey || ev.ctrlKey) && key === 'k') {
      ev.preventDefault();
      ev.stopPropagation();
      openGlobalSearchOverlay('');
      return;
    }
    if (state.globalSearch.open) {
      if (ev.key === 'Escape') {
        closeGlobalSearchOverlay();
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      if (ev.key === 'ArrowDown') {
        const max = Math.max(0, (state.globalSearch.results || []).length - 1);
        state.globalSearch.activeIndex = Math.min(max, Number(state.globalSearch.activeIndex || 0) + 1);
        renderGlobalSearchResults();
        ev.preventDefault();
        return;
      }
      if (ev.key === 'ArrowUp') {
        state.globalSearch.activeIndex = Math.max(0, Number(state.globalSearch.activeIndex || 0) - 1);
        renderGlobalSearchResults();
        ev.preventDefault();
        return;
      }
      if (ev.key === 'Enter') {
        activateGlobalSearchSelection();
        ev.preventDefault();
        return;
      }
    }
    if (ev.key === 'Escape' && state.globalSearch.open) {
      closeGlobalSearchOverlay();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
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

  window.addEventListener('beforeunload', () => {
    persistCurrentViewSnapshot();
    if (state.settingsPersistTimer) {
      window.clearTimeout(state.settingsPersistTimer);
      state.settingsPersistTimer = null;
    }
    if (state.settings) {
      void window.c3xManager.setSettings(state.settings);
    }
  });

  setStatus('Auto-reload is enabled. Changing mode or paths reloads configs.');
  updateScrollTopFab();

  if (await shouldAutoLoad()) {
    await loadBundleAndRender({ usePersistedView: true });
  }
}

init();
