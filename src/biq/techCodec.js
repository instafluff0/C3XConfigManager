'use strict';

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseIntLoose(value, fallback = 0) {
  const match = String(value == null ? '' : value).match(/-?\d+/);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBit(value, bit) {
  return ((((value >>> 0) >>> bit) & 1) === 1);
}

function boolString(value) {
  return value ? 'true' : 'false';
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
  { uiKey: 'cost', rawKey: 'cost', defaultValue: 0 },
  { uiKey: 'era', rawKey: 'era', defaultValue: '' },
  { uiKey: 'advanceicon', rawKey: 'advanceicon', defaultValue: 0 },
  { uiKey: 'x', rawKey: 'x', defaultValue: 0 },
  { uiKey: 'y', rawKey: 'y', defaultValue: 0 },
  { uiKey: 'prerequisite1', rawKey: 'prerequisite1', defaultValue: 'None' },
  { uiKey: 'prerequisite2', rawKey: 'prerequisite2', defaultValue: 'None' },
  { uiKey: 'prerequisite3', rawKey: 'prerequisite3', defaultValue: 'None' },
  { uiKey: 'prerequisite4', rawKey: 'prerequisite4', defaultValue: 'None' },
  { uiKey: 'questionmark', rawKey: 'questionmark', defaultValue: 1 }
];

const TECH_FLAG_BITS = {
  enablesdiplomats: 0,
  enablesirrigationwithoutfreshwater: 1,
  enablesbridges: 2,
  disablesfloodplaindisease: 3,
  enablesconscription: 4,
  enablesmobilizationlevels: 5,
  enablesrecycling: 6,
  enablesprecisionbombing: 7,
  enablesmpp: 8,
  enablesrop: 9,
  enablesalliances: 10,
  enablestradeembargoes: 11,
  doubleswealth: 12,
  enablesseatrade: 13,
  enablesoceantrade: 14,
  enablesmaptrading: 15,
  enablescommunicationtrading: 16,
  notrequiredforadvancement: 17,
  doublesworkrate: 18,
  cannotbetraded: 19,
  permitssacrifice: 20,
  bonustech: 21,
  revealmap: 22
};

function buildFieldLookup(rawFields) {
  const byRaw = new Map();
  (Array.isArray(rawFields) ? rawFields : []).forEach((field) => {
    const rawKey = String(field && (field.baseKey || field.key) || '').trim();
    if (!rawKey) return;
    byRaw.set(normalizeKey(rawKey), field);
  });
  return byRaw;
}

function projectTechnologyBiqFields({ rawFields, civilopediaEntry, flavorCount = 0 }) {
  const lookup = buildFieldLookup(rawFields);
  const projected = [];
  const pushField = (baseKey, value, originalValue, editable = true) => {
    projected.push({
      key: baseKey,
      baseKey,
      label: baseKey,
      value: String(value),
      originalValue: String(originalValue),
      editable
    });
  };
  const readRawField = (rawKey, fallbackValue) => {
    const hit = lookup.get(normalizeKey(rawKey));
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
  };

  pushField('civilopediaentry', civilopediaEntry || '', civilopediaEntry || '', false);

  DIRECT_FIELD_SPECS.forEach((spec) => {
    const raw = readRawField(spec.rawKey, spec.defaultValue);
    if (typeof spec.defaultValue === 'string') {
      pushField(spec.uiKey, raw.value || spec.defaultValue, raw.originalValue || spec.defaultValue, raw.editable);
      return;
    }
    pushField(spec.uiKey, raw.value || String(spec.defaultValue), raw.originalValue || String(spec.defaultValue), raw.editable);
  });

  const flagsValue = parseIntLoose(readRawField('flags', 0).value, 0);
  const flagsOriginal = parseIntLoose(readRawField('flags', 0).originalValue, 0);
  Object.entries(TECH_FLAG_BITS).forEach(([uiKey, bit]) => {
    pushField(uiKey, boolString(readBit(flagsValue, bit)), boolString(readBit(flagsOriginal, bit)));
  });

  const flavorsValue = parseIntLoose(readRawField('flavors', 0).value, 0);
  const flavorsOriginal = parseIntLoose(readRawField('flavors', 0).originalValue, 0);
  for (let idx = 0; idx < flavorCount; idx += 1) {
    pushField(`flavor_${idx + 1}`, boolString(readBit(flavorsValue, idx)), boolString(readBit(flavorsOriginal, idx)));
  }

  return projected;
}

function collapseTechnologyBiqFields(fields, flavorCount = 0, valueKey = 'value') {
  const byKey = new Map();
  (Array.isArray(fields) ? fields : []).forEach((field) => {
    const key = normalizeKey(field && (field.baseKey || field.key));
    if (!key) return;
    byKey.set(key, field);
  });
  const readText = (key, fallbackValue = '') => {
    const hit = byKey.get(normalizeKey(key));
    if (!hit) return String(fallbackValue);
    return String(hit && hit[valueKey] == null ? '' : hit[valueKey]);
  };
  const readNumber = (key, fallbackValue = 0) => parseIntLoose(readText(key, fallbackValue), fallbackValue);
  const readBool = (key) => isTruthy(readText(key, 'false'));
  const encodeBits = (bitMap) => Object.entries(bitMap).reduce((sum, [key, bit]) => (
    readBool(key) ? (sum | (2 ** bit)) : sum
  ), 0);

  const raw = {};
  DIRECT_FIELD_SPECS.forEach((spec) => {
    if (typeof spec.defaultValue === 'string') {
      raw[spec.rawKey] = readText(spec.uiKey, spec.defaultValue);
      return;
    }
    raw[spec.rawKey] = String(readNumber(spec.uiKey, spec.defaultValue));
  });
  raw.flags = toSignedIntString(encodeBits(TECH_FLAG_BITS));
  let flavors = 0;
  for (let idx = 0; idx < flavorCount; idx += 1) {
    if (readBool(`flavor_${idx + 1}`)) flavors |= (2 ** idx);
  }
  raw.flavors = toSignedIntString(flavors);
  if (byKey.has('name')) raw.name = readText('name', '');
  return raw;
}

module.exports = {
  DIRECT_FIELD_SPECS,
  TECH_FLAG_BITS,
  projectTechnologyBiqFields,
  collapseTechnologyBiqFields
};
