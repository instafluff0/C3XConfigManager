(function mapEditorCoreFactory(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MapEditorCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function mapEditorCoreInit() {
  function canonicalKey(raw) {
    return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function parseIntLoose(value, fallback) {
    var s = String(value == null ? '' : value).trim();
    var m = s.match(/-?\d+/);
    if (!m) return Number.isFinite(fallback) ? fallback : 0;
    return Number.parseInt(m[0], 10);
  }

  function getField(record, key) {
    if (!record || !Array.isArray(record.fields)) return null;
    var target = canonicalKey(key);
    for (var i = 0; i < record.fields.length; i += 1) {
      var field = record.fields[i];
      if (canonicalKey(field && (field.baseKey || field.key)) === target) return field;
    }
    return null;
  }

  function ensureField(record, key, label, value) {
    if (!record) return null;
    if (!Array.isArray(record.fields)) record.fields = [];
    var field = getField(record, key);
    if (field) return field;
    field = {
      key: String(key || ''),
      baseKey: String(key || ''),
      label: String(label || key || ''),
      value: String(value == null ? '' : value),
      originalValue: ''
    };
    record.fields.push(field);
    return field;
  }

  function setField(record, key, value, label) {
    var field = ensureField(record, key, label || key, value);
    if (!field) return;
    field.value = String(value == null ? '' : value);
  }

  function tileCoordsByIndex(width, index) {
    var pairY = Math.floor(index / width) * 2;
    var rem = index % width;
    var half = Math.floor(width / 2);
    if (rem < half) return { xPos: rem * 2, yPos: pairY };
    return { xPos: ((rem - half) * 2) + 1, yPos: pairY + 1 };
  }

  function computeBrushTileIndexes(width, tileCount, centerIndex, diameter) {
    var out = [];
    var radius = Math.max(0, (Math.max(1, Number(diameter) || 1) - 1) / 2);
    var center = tileCoordsByIndex(width, centerIndex);
    for (var i = 0; i < tileCount; i += 1) {
      var p = tileCoordsByIndex(width, i);
      var dx = Math.abs(p.xPos - center.xPos);
      var dy = Math.abs(p.yPos - center.yPos);
      if (Math.max(dx, dy) <= radius * 2) out.push(i);
    }
    return out;
  }

  function applyTerrain(records, indexes, terrainCode) {
    var code = Number.parseInt(String(terrainCode), 10);
    if (!Number.isFinite(code) || code < 0) return;
    var packed = ((code & 0x0f) << 4) | (code & 0x0f);
    indexes.forEach(function (idx) {
      var tile = records[idx];
      if (!tile) return;
      setField(tile, 'baserealterrain', String(packed), 'Base Real Terrain');
      setField(tile, 'c3cbaserealterrain', String(packed), 'C3C Base Real Terrain');
    });
  }

  function overlayFieldKey(overlayType) {
    var key = String(overlayType || '').trim().toLowerCase();
    var map = {
      road: 'road',
      railroad: 'railroad',
      mine: 'mined',
      irrigate: 'irrigated',
      irrigation: 'irrigated',
      fort: 'fort',
      barricade: 'barricade',
      barbariancamp: 'barbariancamp',
      goodyhut: 'goodyhut',
      pollution: 'pollution',
      crater: 'crater',
      airfield: 'airfield',
      radartower: 'radartower',
      outpost: 'outpost',
      colony: 'colony',
      ruins: 'ruin',
      victorypoint: 'victorypointlocation',
      startinglocation: 'startinglocation'
    };
    return map[key] || '';
  }

  function applyOverlay(records, indexes, overlayType, enabled) {
    var fieldKey = overlayFieldKey(overlayType);
    if (!fieldKey) return;
    indexes.forEach(function (idx) {
      var tile = records[idx];
      if (!tile) return;
      if (fieldKey === 'ruin') {
        setField(tile, fieldKey, enabled ? '1' : '0', 'Ruin');
        return;
      }
      if (fieldKey === 'victorypointlocation') {
        setField(tile, fieldKey, enabled ? '1' : '0', 'Victory Point Location');
        return;
      }
      setField(tile, fieldKey, enabled ? 'true' : 'false', fieldKey);
    });
  }

  function applyFog(records, indexes, addFog) {
    indexes.forEach(function (idx) {
      var tile = records[idx];
      if (!tile) return;
      setField(tile, 'fogofwar', addFog ? '0' : '1', 'Fog Of War');
    });
  }

  function applyDistrict(records, indexes, districtType, districtState, enabled) {
    var type = Number.parseInt(String(districtType), 10);
    var state = Number.parseInt(String(districtState), 10);
    if (!enabled) {
      indexes.forEach(function (idx) {
        var tile = records[idx];
        if (!tile) return;
        setField(tile, 'district', '', 'District');
      });
      return;
    }
    if (!Number.isFinite(type) || type < 0) return;
    if (!Number.isFinite(state) || state < 0) state = 1;
    indexes.forEach(function (idx) {
      var tile = records[idx];
      if (!tile) return;
      setField(tile, 'district', String(type) + ',' + String(state), 'District');
    });
  }

  function makeRecordFromTemplate(section, newRecordRef) {
    var records = Array.isArray(section && section.records) ? section.records : [];
    var template = records.length > 0 ? JSON.parse(JSON.stringify(records[0])) : { fields: [] };
    if (!Array.isArray(template.fields)) template.fields = [];
    template.newRecordRef = String(newRecordRef || '').trim().toUpperCase();
    template.index = records.reduce(function (max, rec) {
      var idx = Number(rec && rec.index);
      return Number.isFinite(idx) ? Math.max(max, idx) : max;
    }, -1) + 1;
    template.fields = template.fields.map(function (field) {
      var canon = canonicalKey(field && (field.baseKey || field.key));
      if (canon === 'name') return Object.assign({}, field, { value: template.newRecordRef });
      if (canon === 'x' || canon === 'y' || canon === 'owner' || canon === 'ownertype' || canon === 'citylevel' || canon === 'size' || canon === 'culture') {
        return Object.assign({}, field, { value: '0', originalValue: '' });
      }
      return Object.assign({}, field, { originalValue: '' });
    });
    return template;
  }

  function addCity(section, tileRecord, x, y, owner, ownerType, name, newRecordRef) {
    var city = makeRecordFromTemplate(section, newRecordRef);
    setField(city, 'name', name || 'New City', 'Name');
    setField(city, 'x', String(x), 'X');
    setField(city, 'y', String(y), 'Y');
    setField(city, 'owner', String(owner), 'Owner');
    setField(city, 'ownertype', String(ownerType), 'Owner Type');
    setField(city, 'size', '1', 'Size');
    setField(city, 'citylevel', '0', 'City Level');
    setField(city, 'culture', '0', 'Culture');
    if (!Array.isArray(section.records)) section.records = [];
    section.records.push(city);
    setField(tileRecord, 'city', String(city.index), 'City');
    return city;
  }

  function addUnit(section, tileRecord, x, y, owner, ownerType, prtoNumber, newRecordRef) {
    var unit = makeRecordFromTemplate(section, newRecordRef);
    setField(unit, 'x', String(x), 'X');
    setField(unit, 'y', String(y), 'Y');
    setField(unit, 'owner', String(owner), 'Owner');
    setField(unit, 'ownertype', String(ownerType), 'Owner Type');
    setField(unit, 'prtonumber', String(prtoNumber), 'Unit');
    if (!Array.isArray(section.records)) section.records = [];
    section.records.push(unit);
    setField(tileRecord, 'unit_on_tile', String(unit.index), 'Unit On Tile');
    return unit;
  }

  return {
    canonicalKey: canonicalKey,
    parseIntLoose: parseIntLoose,
    getField: getField,
    ensureField: ensureField,
    setField: setField,
    tileCoordsByIndex: tileCoordsByIndex,
    computeBrushTileIndexes: computeBrushTileIndexes,
    applyTerrain: applyTerrain,
    applyOverlay: applyOverlay,
    applyFog: applyFog,
    applyDistrict: applyDistrict,
    addCity: addCity,
    addUnit: addUnit
  };
}));
