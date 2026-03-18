'use strict';

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const DIRECT_FIELD_SPECS = [
  { uiKey: 'name', rawKey: 'name', defaultValue: '' },
  { uiKey: 'type', rawKey: 'type', defaultValue: '0' },
  { uiKey: 'appearanceratio', rawKey: 'appearanceratio', defaultValue: '0' },
  { uiKey: 'disapperanceprobability', rawKey: 'disapperanceprobability', defaultValue: '0' },
  { uiKey: 'icon', rawKey: 'icon', defaultValue: '0' },
  { uiKey: 'prerequisite', rawKey: 'prerequisite', defaultValue: '-1' },
  { uiKey: 'foodbonus', rawKey: 'foodbonus', defaultValue: '0' },
  { uiKey: 'shieldsbonus', rawKey: 'shieldsbonus', defaultValue: '0' },
  { uiKey: 'commercebonus', rawKey: 'commercebonus', defaultValue: '0' }
];

function buildFieldLookup(rawFields) {
  const byRaw = new Map();
  (Array.isArray(rawFields) ? rawFields : []).forEach((field) => {
    const rawKey = String(field && (field.baseKey || field.key) || '').trim();
    if (!rawKey) return;
    byRaw.set(normalizeKey(rawKey), field);
  });
  return byRaw;
}

function projectResourceBiqFields({ rawFields, civilopediaEntry }) {
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
    pushField(spec.uiKey, raw.value || spec.defaultValue, raw.originalValue || spec.defaultValue, raw.editable);
  });
  return projected;
}

function collapseResourceBiqFields(fields, valueKey = 'value') {
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

  const raw = {};
  DIRECT_FIELD_SPECS.forEach((spec) => {
    raw[spec.rawKey] = readText(spec.uiKey, spec.defaultValue);
  });
  return raw;
}

module.exports = {
  DIRECT_FIELD_SPECS,
  projectResourceBiqFields,
  collapseResourceBiqFields
};
