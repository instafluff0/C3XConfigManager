'use strict';

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseIntLoose(value, fallback = 0) {
  const match = String(value == null ? '' : value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBit(value, bit) {
  return ((((value >>> 0) >>> bit) & 1) === 1);
}

function boolString(value) {
  return value ? 'true' : 'false';
}

function boolNumberString(value) {
  return value ? '1' : '0';
}

function parseBoolishIntString(raw, fallback = 0) {
  const text = String(raw == null ? '' : raw).trim().toLowerCase();
  if (!text) return fallback;
  if (text === 'true' || text === 'yes' || text === 'on') return 1;
  if (text === 'false' || text === 'no' || text === 'off') return 0;
  return parseIntLoose(raw, fallback);
}

function isTruthy(raw) {
  const text = String(raw == null ? '' : raw).trim().toLowerCase();
  return text === '1' || text === 'true' || text === 'yes' || text === 'on';
}

function toSignedIntString(value) {
  return String(value | 0);
}

const DIRECT_FIELD_SPECS = [
  { uiKey: 'name', rawKey: 'name', defaultValue: '' },
  { uiKey: 'requiredtech', rawKey: 'requiredTech', defaultValue: '-1' },
  { uiKey: 'requiredresource1', rawKey: 'requiredResource1', defaultValue: '-1' },
  { uiKey: 'requiredresource2', rawKey: 'requiredResource2', defaultValue: '-1' },
  { uiKey: 'requiredresource3', rawKey: 'requiredResource3', defaultValue: '-1' },
  { uiKey: 'upgradeto', rawKey: 'upgradeTo', defaultValue: '-1' },
  { uiKey: 'attack', rawKey: 'attack', defaultValue: '0' },
  { uiKey: 'defence', rawKey: 'defence', defaultValue: '0' },
  { uiKey: 'movement', rawKey: 'movement', defaultValue: '0' },
  { uiKey: 'bombardstrength', rawKey: 'bombardStrength', defaultValue: '0' },
  { uiKey: 'bombardrange', rawKey: 'bombardRange', defaultValue: '0' },
  { uiKey: 'rateoffire', rawKey: 'rateOfFire', defaultValue: '0' },
  { uiKey: 'airdefence', rawKey: 'airDefence', defaultValue: '0' },
  { uiKey: 'hitpointbonus', rawKey: 'hitPointBonus', defaultValue: '0' },
  { uiKey: 'operationalrange', rawKey: 'operationalRange', defaultValue: '0' },
  { uiKey: 'capacity', rawKey: 'capacity', defaultValue: '0' },
  { uiKey: 'populationcost', rawKey: 'populationCost', defaultValue: '0' },
  { uiKey: 'shieldcost', rawKey: 'shieldCost', defaultValue: '0' },
  { uiKey: 'workerstrengthfloat', rawKey: 'workerStrengthFloat', defaultValue: '0' },
  { uiKey: 'unitclass', rawKey: 'unitClass', defaultValue: '0' },
  { uiKey: 'availableto', rawKey: 'availableTo', defaultValue: '0' },
  { uiKey: 'enslaveresultsin', rawKey: 'enslaveResultsIn', defaultValue: '-1' },
  { uiKey: 'iconindex', rawKey: 'iconIndex', defaultValue: '0' },
  { uiKey: 'otherstrategy', rawKey: 'otherStrategy', defaultValue: '-1' },
  { uiKey: 'telepadrange', rawKey: 'telepadRange', defaultValue: '0' },
  { uiKey: 'useexactcost', rawKey: 'useExactCost', defaultValue: '7' },
  { uiKey: 'questionmark3', rawKey: 'questionMark3', defaultValue: '1' },
  { uiKey: 'questionmark5', rawKey: 'questionMark5', defaultValue: '1' },
  { uiKey: 'questionmark6', rawKey: 'questionMark6', defaultValue: '1' },
  { uiKey: 'questionmark8', rawKey: 'questionMark8', defaultValue: '0' },
  { uiKey: 'standardordersspecialactions', rawKey: 'standardOrdersSpecialActions', defaultValue: '0' },
  { uiKey: 'airmissions', rawKey: 'airMissions', defaultValue: '0' },
  { uiKey: 'ptwactionsmix', rawKey: 'PTWActionsMix', defaultValue: '0' },
  { uiKey: 'numstealthtargets', rawKey: 'numStealthTargets', defaultValue: '0' },
  { uiKey: 'numlegalunittelepads', rawKey: 'numLegalUnitTelepads', defaultValue: '0' },
  { uiKey: 'numlegalbuildingtelepads', rawKey: 'numLegalBuildingTelepads', defaultValue: '0' }
];

const BOOL_INT_FIELDS = [
  { uiKey: 'zoneofcontrol', rawKey: 'zoneOfControl' },
  { uiKey: 'requiressupport', rawKey: 'requiresSupport' },
  { uiKey: 'bombardeffects', rawKey: 'bombardEffects' },
  { uiKey: 'createscraters', rawKey: 'createsCraters' }
];

const UNIT_ABILITY_BITS = {
  wheeled: 0,
  footsoldier: 1,
  blitz: 2,
  cruisemissile: 3,
  allterrainasroads: 4,
  radar: 5,
  amphibiousunit: 6,
  invisible: 7,
  transportsonlyairunits: 8,
  draftable: 9,
  immobile: 10,
  sinksinsea: 11,
  sinksinocean: 12,
  flagunit: 13,
  transportsonlyfootunits: 14,
  startsgoldenage: 15,
  nuclearweapon: 16,
  hiddennationality: 17,
  army: 18,
  leader: 19,
  infinitebombardrange: 20,
  stealth: 21,
  detectinvisible: 22,
  tacticalmissile: 23,
  transportsonlytacticalmissiles: 24,
  rangedattackanimations: 25,
  rotatebeforeattack: 26,
  lethallandbombardment: 27,
  lethalseabombardment: 28,
  king: 29,
  requiresescort: 30
};

const AI_STRATEGY_BITS = {
  offence: 0,
  defencestrategy: 1,
  artillery: 2,
  explorestrategy: 3,
  armyunit: 4,
  cruisemissileunit: 5,
  airbombard: 6,
  airdefencestrategy: 7,
  navalpower: 8,
  airtransport: 9,
  navaltransport: 10,
  navalcarrier: 11,
  terraform: 12,
  settle: 13,
  leaderunit: 14,
  tacticalnuke: 15,
  icbm: 16,
  navalmissiletransport: 17,
  flagstrategy: 18,
  kingstrategy: 19
};

const PTW_STANDARD_ORDER_BITS = {
  skipturn: 0,
  wait: 1,
  fortify: 2,
  disband: 3,
  goto: 4,
  exploreorder: 5,
  sentry: 6
};

const PTW_SPECIAL_ACTION_BITS = {
  load: 0,
  unload: 1,
  airlift: 2,
  pillage: 3,
  bombard: 4,
  airdrop: 5,
  buildarmy: 6,
  finishimprovement: 7,
  upgrade: 8,
  capture: 9,
  telepad: 14,
  teleportable: 15,
  stealthattack: 16,
  charm: 17,
  enslave: 18,
  collateraldamage: 19,
  sacrifice: 20,
  scienceage: 21
};

const PTW_WORKER_ACTION_BITS = {
  buildcolony: 0,
  buildcity: 1,
  buildroad: 2,
  buildrailroad: 3,
  buildfort: 4,
  buildmine: 5,
  irrigate: 6,
  clearforest: 7,
  clearjungle: 8,
  plantforest: 9,
  clearpollution: 10,
  automate: 11,
  joincity: 12,
  ptwbuildairfield: 13,
  ptwbuildradartower: 14,
  ptwbuildoutpost: 15,
  buildbarricade: 16
};

const PTW_AIR_MISSION_BITS = {
  bomb: 0,
  recon: 1,
  intercept: 2,
  rebase: 3,
  precisionbombing: 4
};

function buildFieldLookup(rawFields) {
  const byRaw = new Map();
  (Array.isArray(rawFields) ? rawFields : []).forEach((field) => {
    const rawKey = String(field && (field.baseKey || field.key) || '').trim();
    if (!rawKey) return;
    const norm = normalizeKey(rawKey);
    if (!byRaw.has(norm)) byRaw.set(norm, []);
    byRaw.get(norm).push(field);
  });
  return byRaw;
}

function firstRawField(lookup, rawKey) {
  const hits = lookup.get(normalizeKey(rawKey));
  return Array.isArray(hits) && hits.length ? hits[0] : null;
}

function readRawField(lookup, rawKey, fallbackValue) {
  const hit = firstRawField(lookup, rawKey);
  if (!hit) {
    return {
      value: String(fallbackValue),
      originalValue: String(fallbackValue),
      editable: true
    };
  }
  return {
    value: String(hit.value == null ? '' : hit.value),
    originalValue: String(hit.originalValue == null ? hit.value : hit.originalValue),
    editable: !!hit.editable
  };
}

function readRawList(lookup, rawKey) {
  const hits = lookup.get(normalizeKey(rawKey)) || [];
  return hits.map((field) => ({
    value: String(field && field.value == null ? '' : field.value),
    originalValue: String(field && (field.originalValue == null ? field.value : field.originalValue)),
    editable: !!(field && field.editable)
  })).filter((field) => field.value || field.originalValue);
}

function projectUnitBiqFields({ rawFields, civilopediaEntry }) {
  const lookup = buildFieldLookup(rawFields);
  const projected = [];
  const pushField = (baseKey, value, originalValue, editable = true, label = baseKey) => {
    projected.push({
      key: baseKey,
      baseKey,
      label,
      value: String(value),
      originalValue: String(originalValue),
      editable
    });
  };

  pushField('civilopediaentry', civilopediaEntry || '', civilopediaEntry || '', false);

  DIRECT_FIELD_SPECS.forEach((spec) => {
    const raw = readRawField(lookup, spec.rawKey, spec.defaultValue);
    const editable = spec.uiKey === 'otherstrategy' ? false : raw.editable;
    pushField(spec.uiKey, raw.value || spec.defaultValue, raw.originalValue || spec.defaultValue, editable);
  });

  BOOL_INT_FIELDS.forEach((spec) => {
    const raw = readRawField(lookup, spec.rawKey, '0');
    pushField(
      spec.uiKey,
      boolString(parseBoolishIntString(raw.value, 0) !== 0),
      boolString(parseBoolishIntString(raw.originalValue, 0) !== 0),
      raw.editable
    );
  });

  const abilityBits = parseIntLoose(readRawField(lookup, 'unitAbilities', 0).value, 0);
  const abilityBitsOriginal = parseIntLoose(readRawField(lookup, 'unitAbilities', 0).originalValue, 0);
  Object.entries(UNIT_ABILITY_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(abilityBits, bit)), boolString(readBit(abilityBitsOriginal, bit)));
  });

  const aiBits = parseIntLoose(readRawField(lookup, 'AIStrategy', 0).value, 0);
  const aiBitsOriginal = parseIntLoose(readRawField(lookup, 'AIStrategy', 0).originalValue, 0);
  Object.entries(AI_STRATEGY_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(aiBits, bit)), boolString(readBit(aiBitsOriginal, bit)));
  });

  const ptwStandardBits = parseIntLoose(readRawField(lookup, 'PTWStandardOrders', 0).value, 0);
  const ptwStandardBitsOriginal = parseIntLoose(readRawField(lookup, 'PTWStandardOrders', 0).originalValue, 0);
  Object.entries(PTW_STANDARD_ORDER_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(ptwStandardBits, bit)), boolString(readBit(ptwStandardBitsOriginal, bit)));
  });

  const ptwSpecialBits = parseIntLoose(readRawField(lookup, 'PTWSpecialActions', 0).value, 0);
  const ptwSpecialBitsOriginal = parseIntLoose(readRawField(lookup, 'PTWSpecialActions', 0).originalValue, 0);
  Object.entries(PTW_SPECIAL_ACTION_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(ptwSpecialBits, bit)), boolString(readBit(ptwSpecialBitsOriginal, bit)));
  });

  const ptwWorkerBits = parseIntLoose(readRawField(lookup, 'PTWWorkerActions', 0).value, 0);
  const ptwWorkerBitsOriginal = parseIntLoose(readRawField(lookup, 'PTWWorkerActions', 0).originalValue, 0);
  Object.entries(PTW_WORKER_ACTION_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(ptwWorkerBits, bit)), boolString(readBit(ptwWorkerBitsOriginal, bit)));
  });

  const ptwAirBits = parseIntLoose(readRawField(lookup, 'PTWAirMissions', 0).value, 0);
  const ptwAirBitsOriginal = parseIntLoose(readRawField(lookup, 'PTWAirMissions', 0).originalValue, 0);
  Object.entries(PTW_AIR_MISSION_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(ptwAirBits, bit)), boolString(readBit(ptwAirBitsOriginal, bit)));
  });

  const listSpecs = [
    { rawKey: 'stealthTarget', uiKey: 'stealth_target', countKey: 'numstealthtargets' },
    { rawKey: 'ignoreMovementCost', uiKey: 'ignore_movement_cost', countKey: null },
    { rawKey: 'legalUnitTelepad', uiKey: 'legal_unit_telepad', countKey: 'numlegalunittelepads' },
    { rawKey: 'legalBuildingTelepad', uiKey: 'legal_building_telepad', countKey: 'numlegalbuildingtelepads' }
  ];
  listSpecs.forEach((spec) => {
    const values = readRawList(lookup, spec.rawKey);
    values.forEach((field) => pushField(spec.uiKey, field.value, field.originalValue, field.editable));
    if (spec.countKey) {
      const countField = readRawField(lookup, spec.countKey, String(values.length));
      pushField(spec.countKey, countField.value || String(values.length), countField.originalValue || String(values.length), countField.editable);
    }
  });

  return projected;
}

function collapseUnitBiqFields(fields, valueKey = 'value') {
  const byKey = new Map();
  const byCanonical = new Map();
  (Array.isArray(fields) ? fields : []).forEach((field) => {
    const key = normalizeKey(field && (field.baseKey || field.key));
    if (!key) return;
    byKey.set(key, field);
    if (!byCanonical.has(key)) byCanonical.set(key, []);
    byCanonical.get(key).push(field);
  });
  const readText = (key, fallbackValue = '') => {
    const hit = byKey.get(normalizeKey(key));
    if (!hit) return String(fallbackValue);
    return String(hit && hit[valueKey] == null ? '' : hit[valueKey]);
  };
  const readBool = (key) => isTruthy(readText(key, 'false'));
  const encodeBits = (bitMap) => Object.entries(bitMap).reduce((sum, [key, bit]) => (
    readBool(key) ? (sum | (2 ** bit)) : sum
  ), 0);
  const readList = (key) => (byCanonical.get(normalizeKey(key)) || [])
    .map((field) => String(field && field[valueKey] == null ? '' : field[valueKey]).trim())
    .filter(Boolean);

  const raw = {};
  DIRECT_FIELD_SPECS.forEach((spec) => {
    raw[spec.rawKey] = readText(spec.uiKey, spec.defaultValue);
  });
  BOOL_INT_FIELDS.forEach((spec) => {
    raw[spec.rawKey] = boolNumberString(readBool(spec.uiKey));
  });
  raw.unitAbilities = toSignedIntString(encodeBits(UNIT_ABILITY_BITS));
  raw.AIStrategy = toSignedIntString(encodeBits(AI_STRATEGY_BITS));
  raw.PTWStandardOrders = toSignedIntString(encodeBits(PTW_STANDARD_ORDER_BITS));
  raw.PTWSpecialActions = toSignedIntString(encodeBits(PTW_SPECIAL_ACTION_BITS));
  raw.PTWWorkerActions = toSignedIntString(encodeBits(PTW_WORKER_ACTION_BITS));
  raw.PTWAirMissions = toSignedIntString(encodeBits(PTW_AIR_MISSION_BITS));

  const stealthTargets = readList('stealth_target');
  raw.numStealthTargets = String(stealthTargets.length);
  raw.stealthTarget = stealthTargets;

  const ignoreMovementCost = readList('ignore_movement_cost');
  raw.ignoreMovementCost = ignoreMovementCost;

  const legalUnitTelepads = readList('legal_unit_telepad');
  raw.numLegalUnitTelepads = String(legalUnitTelepads.length);
  raw.legalUnitTelepad = legalUnitTelepads;

  const legalBuildingTelepads = readList('legal_building_telepad');
  raw.numLegalBuildingTelepads = String(legalBuildingTelepads.length);
  raw.legalBuildingTelepad = legalBuildingTelepads;

  return raw;
}

module.exports = {
  DIRECT_FIELD_SPECS,
  UNIT_ABILITY_BITS,
  AI_STRATEGY_BITS,
  PTW_STANDARD_ORDER_BITS,
  PTW_SPECIAL_ACTION_BITS,
  PTW_WORKER_ACTION_BITS,
  PTW_AIR_MISSION_BITS,
  projectUnitBiqFields,
  collapseUnitBiqFields
};
