const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const { loadBundle, saveBundle } = require('../src/configCore');
const mapCore = require('../src/mapEditorCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-biq-test-'));
}

function ensureDefaultC3xFiles(root) {
  fs.writeFileSync(path.join(root, 'default.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_config.txt'), '#District\nname = Base\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_wonders_config.txt'), '#Wonder\nname = W\nimg_row = 0\nimg_column = 0\nimg_construct_row = 0\nimg_construct_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_natural_wonders_config.txt'), '#Wonder\nname = N\nterrain_type = grassland\nimg_row = 0\nimg_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.tile_animations.txt'), '#Animation\nname = A\nini_path = Art\\Units\\Warrior\\Warrior.ini\ntype = terrain\nterrain_types = grassland\n', 'utf8');
}

function findSampleBiqPath() {
  const envPath = String(process.env.C3X_TEST_BIQ || '').trim();
  const candidates = [
    envPath,
    path.resolve(__dirname, '..', '..', 'conquests.biq'),
    '/Users//fun/Civilization III Complete/Conquests/conquests.biq'
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || '';
}

function findSampleMapBiqPath() {
  const envPath = String(process.env.C3X_TEST_MAP_BIQ || '').trim();
  const candidates = [
    envPath,
    '/Users//fun/Civilization III Complete/Conquests/Scenarios/2 MP Rise of Rome.biq',
    '/Users//fun/Civilization III Complete/Conquests/Scenarios/3 MP Fall of Rome.biq',
    '/Users//fun/Civilization III Complete/Conquests/Scenarios/8 MP Napoleonic Europe.biq',
    '/Users//fun/Civilization III Complete/Conquests/Scenarios/9 MP WWII in the Pacific.biq'
  ].filter((p) => p && fs.existsSync(p));
  return candidates[0] || '';
}

function resolveCiv3RootFromBiq(biqPath) {
  return path.resolve(path.dirname(biqPath), '..');
}

function findField(entry, key) {
  if (!entry || !Array.isArray(entry.biqFields)) return null;
  const needle = String(key || '').trim().toLowerCase();
  return entry.biqFields.find((f) => String(f.baseKey || f.key || '').trim().toLowerCase() === needle) || null;
}

function findPrimaryNameField(entry) {
  return findField(entry, 'name') || findField(entry, 'leadername') || findField(entry, 'civilizationname');
}

function findMatrixEditableField(tab, entry) {
  if (tab === 'civilizations') return findField(entry, 'adjective') || findField(entry, 'noun') || findField(entry, 'leadername');
  return findPrimaryNameField(entry);
}

function biqSectionHasCivilopediaKey(bundle, sectionCode, wantedKey) {
  const biq = bundle && bundle.biq;
  const sections = biq && Array.isArray(biq.sections) ? biq.sections : [];
  const section = sections.find((s) => String(s.code || '').toUpperCase() === String(sectionCode || '').toUpperCase());
  if (!section || !Array.isArray(section.records)) return false;
  const target = String(wantedKey || '').trim().toUpperCase();
  return section.records.some((record) => {
    const fields = Array.isArray(record && record.fields) ? record.fields : [];
    const civField = fields.find((f) => String(f.baseKey || f.key || '').toLowerCase() === 'civilopediaentry');
    return String(civField && civField.value || '').trim().toUpperCase() === target;
  });
}

function getEntryByCivKey(entries, civKey) {
  const target = String(civKey || '').trim().toUpperCase();
  return (Array.isArray(entries) ? entries : []).find((entry) => String(entry.civilopediaKey || '').trim().toUpperCase() === target) || null;
}

function getSection(tab, code) {
  const sections = tab && Array.isArray(tab.sections) ? tab.sections : [];
  return sections.find((section) => String(section && section.code || '').toUpperCase() === String(code || '').toUpperCase()) || null;
}

function getRecordField(record, key) {
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  const target = String(key || '').trim().toLowerCase();
  return fields.find((field) => String(field && (field.baseKey || field.key) || '').trim().toLowerCase() === target) || null;
}

function getRecordInt(record, key, fallback) {
  const field = getRecordField(record, key);
  const parsed = mapCore.parseIntLoose(field && field.value, fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildTileLookup(tileSection) {
  const lookup = new Map();
  const records = (tileSection && Array.isArray(tileSection.records)) ? tileSection.records : [];
  records.forEach((record) => {
    const x = getRecordInt(record, 'xpos', NaN);
    const y = getRecordInt(record, 'ypos', NaN);
    if (Number.isFinite(x) && Number.isFinite(y)) lookup.set(`${x},${y}`, record);
  });
  return lookup;
}

function getMapSectionsOrSkip(t, mapTab) {
  const tileSection = getSection(mapTab, 'TILE');
  const citySection = getSection(mapTab, 'CITY');
  const unitSection = getSection(mapTab, 'UNIT');
  if (!(tileSection && citySection && unitSection)) {
    t.skip('Sample BIQ map tab is missing TILE/CITY/UNIT sections.');
    return null;
  }
  if (!Array.isArray(tileSection.records) || tileSection.records.length < 2) {
    t.skip('Sample BIQ has insufficient TILE records.');
    return null;
  }
  if (!Array.isArray(citySection.records) || citySection.records.length < 1) {
    t.skip('Sample BIQ has insufficient CITY records.');
    return null;
  }
  if (!Array.isArray(unitSection.records) || unitSection.records.length < 1) {
    t.skip('Sample BIQ has insufficient UNIT records.');
    return null;
  }
  return { tileSection, citySection, unitSection };
}

function getScenarioSettingsField(bundle, key) {
  const tab = bundle && bundle.tabs && bundle.tabs.scenarioSettings;
  const section = getSection(tab, 'GAME');
  const record = section && Array.isArray(section.records) ? section.records[0] : null;
  return getRecordField(record, key);
}

test('BIQ round-trip persists tech tree coordinate edits on scenario copy', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);
  const beforeMagic = fs.readFileSync(scenarioBiq).subarray(0, 4).toString('latin1');

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  assert.equal(Boolean(bundle && bundle.tabs && bundle.tabs.technologies), true);

  const tech = bundle.tabs.technologies.entries.find((entry) => entry.civilopediaKey === 'TECH_MAP_MAKING')
    || bundle.tabs.technologies.entries.find((entry) => findField(entry, 'x') && findField(entry, 'y'));
  assert.ok(tech, 'expected at least one tech with x/y BIQ coordinates');

  const xField = findField(tech, 'x');
  assert.ok(xField, 'expected tech X field');
  const original = Number(String(xField.value || '').replace(/[^\d-]+/g, ''));
  assert.ok(Number.isFinite(original), 'expected numeric original x value');
  xField.value = String(original + 9);

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const afterMagic = fs.readFileSync(scenarioBiq).subarray(0, 4).toString('latin1');
  if (!beforeMagic.startsWith('BIC')) {
    assert.ok(afterMagic.startsWith('BIC'), 'compressed BIQ should be inflated and saved in editable BIQ form');
  }

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reTech = reloaded.tabs.technologies.entries.find((entry) => entry.civilopediaKey === tech.civilopediaKey);
  assert.ok(reTech, 'expected edited tech to exist after save/reload');
  const reX = findField(reTech, 'x');
  assert.ok(reX, 'expected reloaded tech X field');
  assert.equal(Number(String(reX.value || '').replace(/[^\d-]+/g, '')), original + 9);
});

test('BIQ round-trip ignores Scenario Search Folders edits from UI payload', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const before = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const beforeField = getScenarioSettingsField(before, 'scenariosearchfolders');
  if (!beforeField) {
    t.skip('Sample BIQ has no Scenario Search Folders field.');
    return;
  }
  const originalValue = String(beforeField.value || '');
  beforeField.value = '__C3X_SHOULD_NOT_PERSIST__';

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: before.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const afterField = getScenarioSettingsField(reloaded, 'scenariosearchfolders');
  assert.ok(afterField, 'expected Scenario Search Folders field after reload');
  assert.equal(String(afterField.value || ''), originalValue);
});

test('BIQ round-trip supports add/copy/delete record ops for technology section', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const importedRef = 'TECH_C3X_TEST_IMPORTED';
  const copiedRef = 'TECH_C3X_TEST_COPIED';

  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      technologies: {
        recordOps: [
          { op: 'add', newRecordRef: importedRef },
          { op: 'copy', sourceRef: 'TECH_POTTERY', newRecordRef: copiedRef }
        ]
      }
    }
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'save add/copy failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  assert.equal(biqSectionHasCivilopediaKey(afterAdd, 'TECH', importedRef), true);
  assert.equal(biqSectionHasCivilopediaKey(afterAdd, 'TECH', copiedRef), true);

  const deleteSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      technologies: {
        recordOps: [
          { op: 'delete', recordRef: importedRef },
          { op: 'delete', recordRef: copiedRef }
        ]
      }
    }
  });
  assert.equal(deleteSave.ok, true, String(deleteSave.error || 'save delete failed'));

  const afterDelete = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  assert.equal(biqSectionHasCivilopediaKey(afterDelete, 'TECH', importedRef), false);
  assert.equal(biqSectionHasCivilopediaKey(afterDelete, 'TECH', copiedRef), false);
});

test('BIQ matrix set test persists edits across core reference sections', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const firstCivilizationEntry = Array.isArray(bundle.tabs.civilizations && bundle.tabs.civilizations.entries)
    ? bundle.tabs.civilizations.entries[0]
    : null;
  assert.ok(firstCivilizationEntry && firstCivilizationEntry.civilopediaKey, 'expected at least one civilization entry in scenario bundle');
  const matrix = [
    { tab: 'civilizations', key: firstCivilizationEntry.civilopediaKey },
    { tab: 'technologies', key: 'TECH_POTTERY' },
    { tab: 'resources', key: 'GOOD_ALUMINUM' },
    { tab: 'improvements', key: 'BLDG_BARRACKS' },
    { tab: 'governments', key: 'GOVT_DESPOTISM' },
    { tab: 'units', key: 'PRTO_WARRIOR' }
  ];

  const edits = [];
  matrix.forEach(({ tab, key }) => {
    const tabData = bundle.tabs[tab];
    const entry = getEntryByCivKey(tabData && tabData.entries, key)
      || (tabData && Array.isArray(tabData.entries) ? tabData.entries.find((e) => findField(e, 'name')) : null);
    assert.ok(entry, `expected entry for ${tab}:${key}`);
    const nameField = findMatrixEditableField(tab, entry);
    assert.ok(nameField, `expected name field for ${tab}:${entry.civilopediaKey}`);
    const original = String(nameField.value || '').trim();
    const next = `${original} X`;
    nameField.value = next;
    edits.push({ tab, civKey: entry.civilopediaKey, expectedName: next });
  });

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  edits.forEach(({ tab, civKey, expectedName }) => {
    const entry = getEntryByCivKey(reloaded.tabs[tab] && reloaded.tabs[tab].entries, civKey);
    assert.ok(entry, `expected reloaded entry for ${tab}:${civKey}`);
    const nameField = findMatrixEditableField(tab, entry);
    assert.ok(nameField, `expected reloaded name field for ${tab}:${civKey}`);
    assert.equal(String(nameField.value || '').trim(), expectedName, `expected persisted name for ${tab}:${civKey}`);
  });
});

test('BIQ matrix copy/delete test works for multiple sections', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const base = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const copyPlan = [
    { tab: 'technologies', section: 'TECH', prefix: 'TECH', seed: 'TECH_POTTERY' },
    { tab: 'resources', section: 'GOOD', prefix: 'GOOD', seed: 'GOOD_ALUMINUM' },
    { tab: 'improvements', section: 'BLDG', prefix: 'BLDG', seed: 'BLDG_BARRACKS' },
    { tab: 'governments', section: 'GOVT', prefix: 'GOVT', seed: 'GOVT_DESPOTISM' }
  ];

  const addTabs = {};
  const createdRefs = [];
  copyPlan.forEach((spec) => {
    const entries = (base.tabs[spec.tab] && base.tabs[spec.tab].entries) || [];
    const source = getEntryByCivKey(entries, spec.seed) || entries[0];
    assert.ok(source, `expected source entry for ${spec.tab}`);
    const newRef = `${spec.prefix}_C3X_TEST_${Date.now()}_${Math.floor(Math.random() * 10000)}`.toUpperCase();
    addTabs[spec.tab] = {
      recordOps: [
        { op: 'copy', sourceRef: String(source.civilopediaKey || '').toUpperCase(), newRecordRef: newRef }
      ]
    };
    createdRefs.push({ section: spec.section, tab: spec.tab, ref: newRef });
  });

  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: addTabs
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'copy save failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  createdRefs.forEach((item) => {
    assert.equal(biqSectionHasCivilopediaKey(afterAdd, item.section, item.ref), true, `expected copied ref ${item.ref}`);
  });

  const delTabs = {};
  createdRefs.forEach((item) => {
    delTabs[item.tab] = {
      recordOps: [{ op: 'delete', recordRef: item.ref }]
    };
  });

  const delSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: delTabs
  });
  assert.equal(delSave.ok, true, String(delSave.error || 'delete save failed'));

  const afterDelete = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  createdRefs.forEach((item) => {
    assert.equal(biqSectionHasCivilopediaKey(afterDelete, item.section, item.ref), false, `expected deleted ref ${item.ref}`);
  });
});

test('BIQ map round-trip supports map painting + adding city/unit records', (t) => {
  const sampleBiq = findSampleMapBiqPath();
  if (!sampleBiq) t.skip('No map-enabled BIQ available. Set C3X_TEST_MAP_BIQ to run this test.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const mapTab = bundle && bundle.tabs && bundle.tabs.map;
  if (!mapTab) {
    t.skip('Sample BIQ has no map tab.');
    return;
  }
  const sections = getMapSectionsOrSkip(t, mapTab);
  if (!sections) return;
  const { tileSection, citySection, unitSection } = sections;

  const tile = tileSection.records[0];
  mapCore.setField(tile, 'baserealterrain', '0', 'Base Real Terrain');
  mapCore.setField(tile, 'c3cbaserealterrain', '0', 'C3C Base Real Terrain');
  mapCore.setField(tile, 'fogofwar', '1', 'Fog Of War');
  const seededTerrain = String(getRecordField(tile, 'baserealterrain') && getRecordField(tile, 'baserealterrain').value || '');
  const seededFog = String(getRecordField(tile, 'fogofwar') && getRecordField(tile, 'fogofwar').value || '');
  mapCore.applyTerrain(tileSection.records, [0], 2);
  mapCore.applyOverlay(tileSection.records, [0], 'road', true);
  mapCore.applyFog(tileSection.records, [0], true);
  mapCore.applyDistrict(tileSection.records, [0], 1, 1, true);

  const x = mapCore.parseIntLoose(mapCore.getField(tile, 'xpos') && mapCore.getField(tile, 'xpos').value, 0);
  const y = mapCore.parseIntLoose(mapCore.getField(tile, 'ypos') && mapCore.getField(tile, 'ypos').value, 0);

  if (!Array.isArray(mapTab.recordOps)) mapTab.recordOps = [];
  const cityRef = `CITY_C3X_TEST_${Date.now()}`.toUpperCase();
  const unitRef = `UNIT_C3X_TEST_${Date.now()}`.toUpperCase();
  mapCore.addCity(citySection, tile, x, y, 0, 1, 'C3X Test City', cityRef);
  mapCore.addUnit(unitSection, tile, x, y, 0, 1, 0, unitRef);
  mapTab.recordOps.push({ op: 'add', sectionCode: 'CITY', newRecordRef: cityRef });
  mapTab.recordOps.push({ op: 'add', sectionCode: 'UNIT', newRecordRef: unitRef });

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reMap = reloaded.tabs.map;
  const reTileSection = getSection(reMap, 'TILE');
  const reCitySection = getSection(reMap, 'CITY');
  const reUnitSection = getSection(reMap, 'UNIT');
  assert.ok(reTileSection && reTileSection.records.length > 0);
  const reTile = reTileSection.records[0];
  const afterTerrain = String(mapCore.getField(reTile, 'baserealterrain') && mapCore.getField(reTile, 'baserealterrain').value || '');
  const afterFog = String(mapCore.getField(reTile, 'fogofwar') && mapCore.getField(reTile, 'fogofwar').value || '');
  assert.notEqual(afterTerrain, seededTerrain, 'expected terrain field to change after paint/save');
  assert.notEqual(afterFog, seededFog, 'expected fog field to change after paint/save');
  const roadField = mapCore.getField(reTile, 'road') || mapCore.getField(reTile, 'overlays');
  assert.ok(roadField, 'expected road/overlay data on tile after save');
  const districtField = mapCore.getField(reTile, 'district') || mapCore.getField(reTile, 'c3coverlays');
  assert.ok(districtField, 'expected district/c3coverlays data on tile after save');
  assert.ok((reCitySection && reCitySection.records && reCitySection.records.length) >= citySection.records.length);
  assert.ok((reUnitSection && reUnitSection.records && reUnitSection.records.length) >= unitSection.records.length);
});

test('mixed BIQ + text save failure rolls back all committed changes', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  const scenarioDir = path.join(tmp, 'scenario');
  fs.mkdirSync(c3x, { recursive: true });
  fs.mkdirSync(scenarioDir, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(scenarioDir, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const scenarioBasePath = path.join(scenarioDir, 'scenario.c3x_config.ini');
  const originalBaseText = 'flag = true\nkeep = baseline\n';
  fs.writeFileSync(scenarioBasePath, originalBaseText, 'utf8');

  const beforeBiqHash = crypto.createHash('sha256').update(fs.readFileSync(scenarioBiq)).digest('hex');
  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const tech = getEntryByCivKey(bundle.tabs.technologies.entries, 'TECH_MAP_MAKING')
    || bundle.tabs.technologies.entries.find((entry) => findField(entry, 'x'));
  assert.ok(tech, 'expected a tech entry');
  const xField = findField(tech, 'x');
  assert.ok(xField, 'expected tech x field');
  const oldX = Number(String(xField.value || '').replace(/[^\d-]+/g, ''));
  xField.value = String(oldX + 4);

  const flagRow = bundle.tabs.base.rows.find((row) => row.key === 'flag');
  assert.ok(flagRow, 'expected base flag row');
  flagRow.value = 'false';

  const blocker = path.join(scenarioDir, 'not-a-dir');
  fs.writeFileSync(blocker, 'x', 'utf8');
  const invalidPediaPath = path.join(blocker, 'PediaIcons.txt');
  const civEntries = (bundle.tabs.civilizations && bundle.tabs.civilizations.entries) || [];
  const targetCivKey = String((civEntries[0] && civEntries[0].civilopediaKey) || '').toUpperCase();
  assert.ok(targetCivKey, 'expected at least one civilization entry');
  bundle.tabs.civilizations = {
    ...(bundle.tabs.civilizations || {}),
    sourceDetails: {
      ...((bundle.tabs.civilizations && bundle.tabs.civilizations.sourceDetails) || {}),
      pediaIconsScenarioWrite: invalidPediaPath
    },
    entries: civEntries.map((entry) => {
      if (String(entry.civilopediaKey || '').toUpperCase() !== targetCivKey) return entry;
      return {
        ...entry,
        iconPaths: ['Art\\civilopedia\\icons\\races\\test-large.pcx'],
        originalIconPaths: Array.isArray(entry.originalIconPaths) ? entry.originalIconPaths : []
      };
    })
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /rolled back/i);

  const afterBiqHash = crypto.createHash('sha256').update(fs.readFileSync(scenarioBiq)).digest('hex');
  assert.equal(afterBiqHash, beforeBiqHash, 'expected BIQ file to be unchanged after rollback');
  assert.equal(fs.readFileSync(scenarioBasePath, 'utf8'), originalBaseText, 'expected scenario base file rollback');
});

test('BIQ map round-trip persists city relocation and city improvements edits', (t) => {
  const sampleBiq = findSampleMapBiqPath();
  if (!sampleBiq) t.skip('No map-enabled BIQ available. Set C3X_TEST_MAP_BIQ to run this test.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);
  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const mapTab = bundle && bundle.tabs && bundle.tabs.map;
  if (!mapTab) {
    t.skip('Map tab unavailable in sample BIQ.');
    return;
  }
  const sections = getMapSectionsOrSkip(t, mapTab);
  if (!sections) return;
  const { tileSection, citySection } = sections;
  const tileRecords = tileSection.records || [];
  const tileLookup = buildTileLookup(tileSection);
  const city = citySection.records[0];
  const sourceTile = tileRecords[0];
  const destinationTile = tileRecords[1];
  const destinationTileIndex = Number(destinationTile && destinationTile.index);
  const sourceX = getRecordInt(sourceTile, 'xpos', 0);
  const sourceY = getRecordInt(sourceTile, 'ypos', 0);
  const destX = getRecordInt(destinationTile, 'xpos', sourceX + 1);
  const destY = getRecordInt(destinationTile, 'ypos', sourceY + 1);

  const cityIndex = Number(city.index);
  assert.ok(Number.isFinite(cityIndex), 'expected finite city index');
  mapCore.setField(city, 'x', String(sourceX), 'X');
  mapCore.setField(city, 'y', String(sourceY), 'Y');
  mapCore.setField(sourceTile, 'city', String(cityIndex), 'City');
  mapCore.setField(destinationTile, 'city', '-1', 'City');
  getRecordField(city, 'x').value = String(destX);
  getRecordField(city, 'y').value = String(destY);
  mapCore.setField(sourceTile, 'city', '-1', 'City');
  mapCore.setField(destinationTile, 'city', String(cityIndex), 'City');
  mapCore.setField(city, 'numbuildings', '1', 'Number of Buildings');
  mapCore.setField(city, 'buildings', '0', 'Buildings');

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reMap = reloaded.tabs.map;
  const reTile = getSection(reMap, 'TILE');
  const reCity = getSection(reMap, 'CITY');
  const reCityRecord = (reCity.records || []).find((record) => Number(record && record.index) === cityIndex);
  assert.ok(reCityRecord, 'expected relocated city record');
  assert.equal(Number(getRecordField(reCityRecord, 'x').value), destX);
  assert.equal(Number(getRecordField(reCityRecord, 'y').value), destY);
  const bCount = Number(getRecordField(reCityRecord, 'numbuildings') && getRecordField(reCityRecord, 'numbuildings').value);
  assert.ok(Number.isFinite(bCount) && bCount >= 1, 'expected persisted city improvement data');
  const reDestinationTile = (reTile.records || []).find((record) => Number(record && record.index) === destinationTileIndex);
  assert.ok(reDestinationTile, 'expected destination tile after reload');
  const reDestinationCity = String((getRecordField(reDestinationTile, 'city') && getRecordField(reDestinationTile, 'city').value) || '');
  assert.match(reDestinationCity, new RegExp(`\\(${cityIndex}\\)$`), 'expected destination tile city field to reference relocated city index');
});

test('BIQ map round-trip persists multi-unit edits on same tile', (t) => {
  const sampleBiq = findSampleMapBiqPath();
  if (!sampleBiq) t.skip('No map-enabled BIQ available. Set C3X_TEST_MAP_BIQ to run this test.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);
  const scenarioBiq = path.join(tmp, 'scenario-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const mapTab = bundle && bundle.tabs && bundle.tabs.map;
  if (!mapTab) {
    t.skip('Map tab unavailable in sample BIQ.');
    return;
  }
  const sections = getMapSectionsOrSkip(t, mapTab);
  if (!sections) return;
  const { unitSection, tileSection } = sections;
  const seed = unitSection.records[0];
  const tile = tileSection.records[0];
  const sx = getRecordInt(tile, 'xpos', 0);
  const sy = getRecordInt(tile, 'ypos', 0);
  mapCore.setField(seed, 'x', String(sx), 'X');
  mapCore.setField(seed, 'y', String(sy), 'Y');
  const sameTileUnits = unitSection.records.filter((record) => {
    const ux = Number(getRecordField(record, 'x') && getRecordField(record, 'x').value);
    const uy = Number(getRecordField(record, 'y') && getRecordField(record, 'y').value);
    return ux === sx && uy === sy;
  });
  const beforeCount = sameTileUnits.length;
  const owner = Number(getRecordField(seed, 'owner') && getRecordField(seed, 'owner').value) || 0;
  const ownerType = Number(getRecordField(seed, 'ownertype') && getRecordField(seed, 'ownertype').value) || 1;
  const prto = Number(getRecordField(seed, 'prtonumber') && getRecordField(seed, 'prtonumber').value)
    || Number(getRecordField(seed, 'unit_type') && getRecordField(seed, 'unit_type').value)
    || 0;

  const addRef = `UNIT_C3X_MULTI_${Date.now()}`.toUpperCase();
  const added = mapCore.addUnit(unitSection, tile, sx, sy, owner, ownerType, prto, addRef);
  if (!Array.isArray(mapTab.recordOps)) mapTab.recordOps = [];
  mapTab.recordOps.push({ op: 'add', sectionCode: 'UNIT', newRecordRef: addRef });
  assert.ok(added && Number.isFinite(Number(added.index)), 'expected added unit');

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reMap = reloaded.tabs.map;
  const reUnits = getSection(reMap, 'UNIT').records || [];
  const afterSameTile = reUnits.filter((record) => {
    const ux = Number(getRecordField(record, 'x') && getRecordField(record, 'x').value);
    const uy = Number(getRecordField(record, 'y') && getRecordField(record, 'y').value);
    return ux === sx && uy === sy;
  });
  assert.ok(afterSameTile.length >= beforeCount + 1, 'expected additional unit on same tile after save/reload');
});
