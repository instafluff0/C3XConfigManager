'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadBundle, saveBundle } = require('../src/configCore');

const CIV3_ROOT = process.env.C3X_CIV3_ROOT || path.resolve(__dirname, '..', '..', '..');
const TIDES_BIQ = path.join(CIV3_ROOT, 'Conquests', 'Scenarios', 'TIDES OF CRIMSON.biq');

function loadScenarioBundle(scenarioPath = TIDES_BIQ) {
  if (!fs.existsSync(scenarioPath)) return null;
  return loadBundle({
    mode: 'scenario',
    civ3Path: CIV3_ROOT,
    scenarioPath
  });
}

function getTerrainSection(bundle, code, source = 'tab') {
  if (source === 'raw') {
    return ((((bundle || {}).biq || {}).sections) || []).find((section) => {
      return String(section && section.code || '').toUpperCase() === String(code || '').toUpperCase();
    }) || null;
  }
  return (((bundle || {}).tabs || {}).terrain || {}).sections.find((section) => {
    return String(section && section.code || '').toUpperCase() === String(code || '').toUpperCase();
  }) || null;
}

function getRecordByCivilopediaKey(section, civilopediaKey) {
  return ((section && section.records) || []).find((record) => {
    return ((record && record.fields) || []).some((field) => {
      return String(field && (field.baseKey || field.key) || '').toLowerCase() === 'civilopediaentry'
        && String(field && field.value || '').toUpperCase() === String(civilopediaKey || '').toUpperCase();
    });
  }) || null;
}

function getField(record, key) {
  return ((record && record.fields) || []).find((field) => {
    return String(field && (field.baseKey || field.key) || '').toLowerCase() === String(key || '').toLowerCase();
  }) || null;
}

function getFieldMap(record) {
  const map = new Map();
  ((record && record.fields) || []).forEach((field) => {
    map.set(String(field && (field.baseKey || field.key) || '').toLowerCase(), String(field && field.value || ''));
  });
  return map;
}

test('Desert in TIDES projects TERR fields with correct landmark strings, flags, and resources', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Scenario fixture not present: ${TIDES_BIQ}`);
  const bundle = loadScenarioBundle();
  const terrSection = getTerrainSection(bundle, 'TERR');
  const desert = getRecordByCivilopediaKey(terrSection, 'TERR_Desert');
  assert.ok(desert, 'Expected Desert terrain record');

  const fieldKeys = new Set((desert.fields || []).map((field) => String(field.baseKey || field.key || '').toLowerCase()));
  assert.ok(fieldKeys.has('civilopediaentry'));
  assert.ok(fieldKeys.has('landmarkname'));
  assert.ok(fieldKeys.has('landmarkcivilopediaentry'));
  assert.ok(fieldKeys.has('workerjob'));
  assert.ok(fieldKeys.has('pollutioneffect'));
  assert.ok(fieldKeys.has('terrainflags'));
  assert.ok(fieldKeys.has('diseasestrength'));

  assert.equal(getField(desert, 'name').value, 'Desert');
  assert.equal(getField(desert, 'civilopediaentry').value, 'TERR_Desert');
  assert.equal(getField(desert, 'landmarkname').value, 'LM Desert');
  assert.equal(getField(desert, 'landmarkcivilopediaentry').value, 'TERR_Desert');
  assert.equal(getField(desert, 'workerjob').value, 'None');
  assert.equal(getField(desert, 'pollutioneffect').value, 'None');
  assert.equal(getField(desert, 'terrainflags').value, '0');
  assert.equal(getField(desert, 'diseasestrength').value, '50');
  assert.equal(getField(desert, 'landmarkenabled').value, 'true');
  assert.equal(getField(desert, 'allowcities').value, 'true');
  assert.equal(getField(desert, 'allowcolonies').value, 'true');
  assert.equal(getField(desert, 'allowforts').value, 'true');

});

test('Grassland in TIDES keeps TERR landmark and transform references aligned to named UI values', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Scenario fixture not present: ${TIDES_BIQ}`);
  const bundle = loadScenarioBundle();
  const terrSection = getTerrainSection(bundle, 'TERR');
  const grassland = getRecordByCivilopediaKey(terrSection, 'TERR_Grassland');
  assert.ok(grassland, 'Expected Grassland terrain record');

  assert.equal(getField(grassland, 'landmarkname').value, 'Draeko Mushrooms');
  assert.equal(getField(grassland, 'landmarkcivilopediaentry').value, 'TERR_Grassland');
  assert.equal(getField(grassland, 'workerjob').value, 'Plant Forest (5)');
  assert.equal(getField(grassland, 'pollutioneffect').value, 'Plains (1)');
});

test('Mine in TIDES projects TFRM worker job fields with Quint-style references and resources', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Scenario fixture not present: ${TIDES_BIQ}`);
  const bundle = loadScenarioBundle();
  const tfrmSection = getTerrainSection(bundle, 'TFRM');
  const mine = getRecordByCivilopediaKey(tfrmSection, 'TFRM_Mine');
  assert.ok(mine, 'Expected Mine worker job record');

  const fieldKeys = new Set((mine.fields || []).map((field) => String(field.baseKey || field.key || '').toLowerCase()));
  ['civilopediaentry', 'order', 'turnstocomplete', 'requiredadvance', 'requiredresource1', 'requiredresource2'].forEach((key) => {
    assert.ok(fieldKeys.has(key), `Expected TFRM field ${key}`);
  });

  assert.equal(getField(mine, 'civilopediaentry').value, 'TFRM_Mine');
  assert.equal(getField(mine, 'order').value, 'Build Mine');
  assert.equal(getField(mine, 'turnstocomplete').value, '100');
  assert.equal(getField(mine, 'requiredadvance').value, 'Mining (0)');
  assert.equal(getField(mine, 'requiredresource1').value, 'None');
  assert.equal(getField(mine, 'requiredresource2').value, 'None');
});

test('Terrain save pipeline round-trips TERR and TFRM raw storage exactly on a copied BIQ fixture', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Scenario fixture not present: ${TIDES_BIQ}`);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-terrain-parity-'));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

  const tempScenario = path.join(tempRoot, 'TIDES OF CRIMSON copy.biq');
  fs.copyFileSync(TIDES_BIQ, tempScenario);

  const bundle = loadScenarioBundle(tempScenario);
  const terrRawSection = getTerrainSection(bundle, 'TERR', 'raw');
  const tfrmRawSection = getTerrainSection(bundle, 'TFRM', 'raw');
  const beforeDesert = getFieldMap(getRecordByCivilopediaKey(terrRawSection, 'TERR_Desert'));
  const beforeGrassland = getFieldMap(getRecordByCivilopediaKey(terrRawSection, 'TERR_Grassland'));
  const beforeMine = getFieldMap(getRecordByCivilopediaKey(tfrmRawSection, 'TFRM_Mine'));

  const saveResult = saveBundle(bundle, { skipTextWrite: true });
  assert.equal(saveResult.ok, true, saveResult.error || 'Expected terrain fixture save to succeed');

  const reloaded = loadScenarioBundle(tempScenario);
  const afterTerrRawSection = getTerrainSection(reloaded, 'TERR', 'raw');
  const afterTfrmRawSection = getTerrainSection(reloaded, 'TFRM', 'raw');
  const afterDesert = getFieldMap(getRecordByCivilopediaKey(afterTerrRawSection, 'TERR_Desert'));
  const afterGrassland = getFieldMap(getRecordByCivilopediaKey(afterTerrRawSection, 'TERR_Grassland'));
  const afterMine = getFieldMap(getRecordByCivilopediaKey(afterTfrmRawSection, 'TFRM_Mine'));

  ['civilopediaentry', 'landmarkname', 'landmarkcivilopediaentry', 'terrainflags', 'diseasestrength', 'workerjob', 'pollutioneffect'].forEach((key) => {
    assert.equal(afterDesert.get(key), beforeDesert.get(key), `Expected Desert raw TERR ${key} to round-trip exactly`);
  });
  ['civilopediaentry', 'landmarkname', 'landmarkcivilopediaentry', 'workerjob', 'pollutioneffect'].forEach((key) => {
    assert.equal(afterGrassland.get(key), beforeGrassland.get(key), `Expected Grassland raw TERR ${key} to round-trip exactly`);
  });
  ['civilopediaentry', 'order', 'turnstocomplete', 'requiredadvance', 'requiredresource1', 'requiredresource2'].forEach((key) => {
    assert.equal(afterMine.get(key), beforeMine.get(key), `Expected Mine raw TFRM ${key} to round-trip exactly`);
  });
});
