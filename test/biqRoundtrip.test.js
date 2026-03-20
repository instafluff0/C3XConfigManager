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
    path.resolve(__dirname, '..', '..', 'conquests.biq')
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || '';
}

function findSampleMapBiqPath() {
  const envPath = String(process.env.C3X_TEST_MAP_BIQ || '').trim();
  const civ3Root = path.resolve(__dirname, '..', '..', '..');
  const candidates = [
    envPath,
    path.join(civ3Root, 'Conquests', 'Scenarios', '2 MP Rise of Rome.biq'),
    path.join(civ3Root, 'Conquests', 'Scenarios', '3 MP Fall of Rome.biq'),
    path.join(civ3Root, 'Conquests', 'Scenarios', '8 MP Napoleonic Europe.biq'),
    path.join(civ3Root, 'Conquests', 'Scenarios', '9 MP WWII in the Pacific.biq')
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

function getBiqSectionRecordIndex(bundle, sectionCode, wantedKey) {
  const biq = bundle && bundle.biq;
  const sections = biq && Array.isArray(biq.sections) ? biq.sections : [];
  const section = sections.find((s) => String(s.code || '').toUpperCase() === String(sectionCode || '').toUpperCase());
  if (!section || !Array.isArray(section.records)) return -1;
  const target = String(wantedKey || '').trim().toUpperCase();
  return section.records.findIndex((record) => {
    const fields = Array.isArray(record && record.fields) ? record.fields : [];
    const civField = fields.find((f) => String(f.baseKey || f.key || '').toLowerCase() === 'civilopediaentry');
    return String(civField && civField.value || '').trim().toUpperCase() === target;
  });
}

function getBiqSectionRecordKeyByIndex(bundle, sectionCode, wantedIndex) {
  const biq = bundle && bundle.biq;
  const sections = biq && Array.isArray(biq.sections) ? biq.sections : [];
  const section = sections.find((s) => String(s.code || '').toUpperCase() === String(sectionCode || '').toUpperCase());
  if (!section || !Array.isArray(section.records)) return '';
  const record = section.records[Number(wantedIndex)];
  if (!record) return '';
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  const civField = fields.find((f) => String(f.baseKey || f.key || '').toLowerCase() === 'civilopediaentry');
  return String(civField && civField.value || '').trim().toUpperCase();
}

function getEntryByCivKey(entries, civKey) {
  const target = String(civKey || '').trim().toUpperCase();
  return (Array.isArray(entries) ? entries : []).find((entry) => String(entry.civilopediaKey || '').trim().toUpperCase() === target) || null;
}

function parseDisplayedReferenceIndex(value, fallback = -1) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return fallback;
  if (/^none$/i.test(text)) return -1;
  const parenMatch = text.match(/\((-?\d+)\)\s*$/);
  if (parenMatch) {
    const parsed = Number.parseInt(parenMatch[1], 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return mapCore.parseIntLoose(text, fallback);
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

function getRecordFields(record, key) {
  const fields = Array.isArray(record && record.fields) ? record.fields : [];
  const target = String(key || '').trim().toLowerCase();
  return fields.filter((field) => String(field && (field.baseKey || field.key) || '').trim().toLowerCase() === target);
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

function getScenarioSettingsRecord(bundle) {
  const tab = bundle && bundle.tabs && bundle.tabs.scenarioSettings;
  const section = getSection(tab, 'GAME');
  return section && Array.isArray(section.records) ? section.records[0] : null;
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

test('BIQ round-trip persists Scenario Search Folder edits from UI payload', (t) => {
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
  assert.notEqual(String(afterField.value || ''), originalValue);
  assert.equal(String(afterField.value || ''), '__C3X_SHOULD_NOT_PERSIST__');
});

test('scenario save auto-creates a sibling search folder for BIQs under shared Scenarios root', (t) => {
  const sampleBiq = findSampleBiqPath();
  if (!sampleBiq) t.skip('No sample BIQ available. Set C3X_TEST_BIQ to run BIQ integration tests.');

  const tmp = mkTmpDir();
  const civ3Root = path.join(tmp, 'Civ3');
  const scenariosRoot = path.join(civ3Root, 'Conquests', 'Scenarios');
  fs.mkdirSync(scenariosRoot, { recursive: true });
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(scenariosRoot, 'AutoFolderScenario.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const searchField = getScenarioSettingsField(bundle, 'scenariosearchfolders');
  if (!searchField) {
    t.skip('Sample BIQ has no Scenario Search Folder field.');
    return;
  }
  searchField.value = '';
  const flag = bundle.tabs.base.rows.find((row) => String(row && row.key || '').trim().toLowerCase() === 'flag');
  assert.ok(flag, 'expected base flag field');
  flag.value = 'false';

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const inferredDir = path.join(scenariosRoot, 'AutoFolderScenario');
  assert.equal(fs.existsSync(inferredDir), true);
  assert.equal(fs.statSync(inferredDir).isDirectory(), true);
  assert.equal(fs.existsSync(path.join(inferredDir, 'scenario.c3x_config.ini')), true);

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const field = getScenarioSettingsField(reloaded, 'scenariosearchfolders');
  assert.ok(field, 'expected Scenario Search Folder field after auto-localize save');
  assert.equal(String(field.value || '').trim(), 'AutoFolderScenario');
});

test('BIQ round-trip persists deterministic playable civilization list rewrites', (t) => {
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
  const gameRecord = getScenarioSettingsRecord(bundle);
  if (!gameRecord) {
    t.skip('Sample BIQ has no GAME record.');
    return;
  }

  const fields = Array.isArray(gameRecord.fields) ? gameRecord.fields : [];
  const countField = getRecordField(gameRecord, 'numberofplayablecivs') || getRecordField(gameRecord, 'number_of_playable_civs');
  assert.ok(countField, 'expected GAME numberofplayablecivs field');

  const originalPlayable = fields
    .filter((field) => /^playable_civ(?:_\d+)?$/.test(String(field && (field.baseKey || field.key) || '').toLowerCase()))
    .map((field) => Number.parseInt(String(field.value || ''), 10))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  if (originalPlayable.length < 2) {
    t.skip('Sample BIQ does not have enough playable civilizations to rewrite deterministically.');
    return;
  }

  const replacement = Array.from(new Set([originalPlayable[1], originalPlayable[0], 0])).sort((a, b) => a - b);
  const preserved = fields.filter((field) => !/^playable_civ(?:_\d+)?$/.test(String(field && (field.baseKey || field.key) || '').toLowerCase()));
  const insertAt = Math.max(0, preserved.indexOf(countField) + 1);
  const rewrittenPlayable = replacement.map((id, idx) => ({
    key: `playable_civ_${idx}`,
    baseKey: `playable_civ_${idx}`,
    label: 'Playable Civilization',
    value: String(id),
    originalValue: '',
    editable: true
  }));
  preserved.splice(insertAt, 0, ...rewrittenPlayable);
  gameRecord.fields = preserved;
  countField.value = String(replacement.length);

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reGameRecord = getScenarioSettingsRecord(reloaded);
  assert.ok(reGameRecord, 'expected reloaded GAME record');
  const reCountField = getRecordField(reGameRecord, 'numberofplayablecivs') || getRecordField(reGameRecord, 'number_of_playable_civs');
  assert.ok(reCountField, 'expected reloaded count field');
  assert.equal(String(reCountField.value || ''), String(replacement.length));

  const rePlayable = (Array.isArray(reGameRecord.fields) ? reGameRecord.fields : [])
    .filter((field) => /^playable_civ(?:_\d+)?$/.test(String(field && (field.baseKey || field.key) || '').toLowerCase()))
    .map((field) => Number.parseInt(String(field.value || ''), 10))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  assert.deepEqual(rePlayable, replacement);
});

test('BIQ round-trip persists array-backed projected and synthetic BIQ fields', (t) => {
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

  const techOptions = ((bundle.tabs.technologies && bundle.tabs.technologies.entries) || [])
    .filter((entry) => Number.isFinite(Number(entry && entry.biqIndex)));
  if (techOptions.length < 4) t.skip('Sample BIQ does not expose enough technology references for matrix edits.');

  const civEntry = ((bundle.tabs.civilizations && bundle.tabs.civilizations.entries) || []).find((entry) => findField(entry, 'freetech1index'));
  assert.ok(civEntry, 'expected civilization entry with free tech fields');
  const civFreeTech1 = findField(civEntry, 'freetech1index');
  const civFreeTech2 = findField(civEntry, 'freetech2index');
  assert.ok(civFreeTech1 && civFreeTech2, 'expected civilization free tech slots');
  civFreeTech1.value = String(techOptions[1].biqIndex);
  civFreeTech2.value = String(techOptions[2].biqIndex);

  const techEntry = ((bundle.tabs.technologies && bundle.tabs.technologies.entries) || []).find((entry) => findField(entry, 'prerequisite1'));
  assert.ok(techEntry, 'expected technology entry with prerequisite fields');
  const prereq1 = findField(techEntry, 'prerequisite1');
  const prereq2 = findField(techEntry, 'prerequisite2');
  assert.ok(prereq1 && prereq2, 'expected prerequisite fields');
  prereq1.value = String(techOptions[0].biqIndex);
  prereq2.value = String(techOptions[3].biqIndex);

  const govEntry = ((bundle.tabs.governments && bundle.tabs.governments.entries) || []).find((entry) => findField(entry, 'malerulertitle1'));
  assert.ok(govEntry, 'expected government entry with ruler title fields');
  const maleTitle1 = findField(govEntry, 'malerulertitle1');
  const femaleTitle1 = findField(govEntry, 'femalerulertitle1');
  assert.ok(maleTitle1 && femaleTitle1, 'expected ruler title fields');
  maleTitle1.value = 'Chief Tester';
  femaleTitle1.value = 'Chief Testeress';
  const canBribeFields = getRecordFields({ fields: govEntry.biqFields }, 'canbribe');
  const briberyFields = getRecordFields({ fields: govEntry.biqFields }, 'briberymodifier');
  const resistanceFields = getRecordFields({ fields: govEntry.biqFields }, 'resistancemodifier');
  if (canBribeFields[0]) canBribeFields[0].value = canBribeFields[0].value === '1' ? '0' : '1';
  if (briberyFields[0]) briberyFields[0].value = '33';
  if (resistanceFields[0]) resistanceFields[0].value = '44';

  const gameRecord = getScenarioSettingsRecord(bundle);
  assert.ok(gameRecord, 'expected GAME record');
  const gameFields = Array.isArray(gameRecord.fields) ? gameRecord.fields : [];
  const countField = getRecordField(gameRecord, 'numberofplayablecivs') || getRecordField(gameRecord, 'number_of_playable_civs');
  assert.ok(countField, 'expected GAME playable civ count field');
  const originalPlayable = gameFields
    .filter((field) => /^playable_civ(?:_\d+)?$/.test(String(field && (field.baseKey || field.key) || '').toLowerCase()))
    .map((field) => Number.parseInt(String(field.value || ''), 10))
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (originalPlayable.length < 2) {
    t.skip('Sample BIQ does not have enough playable civilizations.');
    return;
  }
  const playableReplacement = Array.from(new Set([originalPlayable[1], originalPlayable[0], 0])).sort((a, b) => a - b);
  const preservedPlayableFields = gameFields.filter((field) => !/^playable_civ(?:_\d+)?$/.test(String(field && (field.baseKey || field.key) || '').toLowerCase()));
  const insertAt = Math.max(0, preservedPlayableFields.indexOf(countField) + 1);
  const rewrittenPlayable = playableReplacement.map((id, idx) => ({
    key: `playable_civ_${idx}`,
    baseKey: `playable_civ_${idx}`,
    label: 'Playable Civilization',
    value: String(id),
    originalValue: '',
    editable: true
  }));
  preservedPlayableFields.splice(insertAt, 0, ...rewrittenPlayable);
  gameRecord.fields = preservedPlayableFields;
  countField.value = String(playableReplacement.length);
  const turnsField0 = getRecordField(gameRecord, 'turns_in_time_section_0');
  const perTurnField0 = getRecordField(gameRecord, 'time_per_turn_in_time_section_0');
  assert.ok(turnsField0 && perTurnField0, 'expected time scale fields');
  const expectedTurns = String((Number.parseInt(String(turnsField0.value || '0'), 10) || 0) + 5);
  const expectedPerTurn = String((Number.parseInt(String(perTurnField0.value || '0'), 10) || 0) + 1);
  turnsField0.value = expectedTurns;
  perTurnField0.value = expectedPerTurn;

  const terrTab = bundle.tabs.terrain;
  const terrSection = getSection(terrTab, 'TERR');
  assert.ok(terrSection && Array.isArray(terrSection.records) && terrSection.records.length > 0, 'expected TERR section');
  const terrRecord = terrSection.records[0];
  let terrMaskField = getRecordField(terrRecord, 'possible_resources_mask') || getRecordField(terrRecord, 'possibleResourcesMask');
  if (!terrMaskField) {
    terrMaskField = {
      key: 'possible_resources_mask',
      baseKey: 'possible_resources_mask',
      label: 'Possible Resources Mask',
      value: '1,0,0,0',
      originalValue: '0,0,0,0',
      editable: true
    };
    terrRecord.fields.push(terrMaskField);
  }
  const originalMask = String(terrMaskField.value || '').split(/[,\s]+/).filter(Boolean).map((part) => Number.parseInt(part, 10) ? 1 : 0);
  while (originalMask.length < 4) originalMask.push(0);
  originalMask[0] = originalMask[0] ? 0 : 1;
  originalMask[1] = originalMask[1] ? 0 : 1;
  const expectedMask = originalMask.join(',');
  terrMaskField.value = expectedMask;

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: bundle.tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });

  const reloadedCivEntry = getEntryByCivKey(reloaded.tabs.civilizations.entries, civEntry.civilopediaKey);
  assert.ok(reloadedCivEntry, 'expected reloaded civilization entry');
  assert.equal(parseDisplayedReferenceIndex(findField(reloadedCivEntry, 'freetech1index')?.value, -1), Number(techOptions[1].biqIndex));
  assert.equal(parseDisplayedReferenceIndex(findField(reloadedCivEntry, 'freetech2index')?.value, -1), Number(techOptions[2].biqIndex));

  const reloadedTechEntry = getEntryByCivKey(reloaded.tabs.technologies.entries, techEntry.civilopediaKey);
  assert.ok(reloadedTechEntry, 'expected reloaded technology entry');
  assert.equal(parseDisplayedReferenceIndex(findField(reloadedTechEntry, 'prerequisite1')?.value, -1), Number(techOptions[0].biqIndex));
  assert.equal(parseDisplayedReferenceIndex(findField(reloadedTechEntry, 'prerequisite2')?.value, -1), Number(techOptions[3].biqIndex));

  const reloadedGovEntry = getEntryByCivKey(reloaded.tabs.governments.entries, govEntry.civilopediaKey);
  assert.ok(reloadedGovEntry, 'expected reloaded government entry');
  assert.equal(String(findField(reloadedGovEntry, 'malerulertitle1')?.value || ''), 'Chief Tester');
  assert.equal(String(findField(reloadedGovEntry, 'femalerulertitle1')?.value || ''), 'Chief Testeress');
  if (canBribeFields[0]) {
    const reloadedCanBribe = getRecordFields({ fields: reloadedGovEntry.biqFields }, 'canbribe');
    assert.ok(reloadedCanBribe[0], 'expected reloaded canbribe field');
    assert.equal(String(reloadedCanBribe[0].value || ''), String(canBribeFields[0].value || ''));
  }
  if (briberyFields[0]) {
    const reloadedBribery = getRecordFields({ fields: reloadedGovEntry.biqFields }, 'briberymodifier');
    assert.ok(reloadedBribery[0], 'expected reloaded bribery field');
    assert.equal(String(reloadedBribery[0].value || ''), '33');
  }
  if (resistanceFields[0]) {
    const reloadedResistance = getRecordFields({ fields: reloadedGovEntry.biqFields }, 'resistancemodifier');
    assert.ok(reloadedResistance[0], 'expected reloaded resistance field');
    assert.equal(String(reloadedResistance[0].value || ''), '44');
  }

  const reGameRecord = getScenarioSettingsRecord(reloaded);
  assert.ok(reGameRecord, 'expected reloaded GAME record');
  const rePlayable = (Array.isArray(reGameRecord.fields) ? reGameRecord.fields : [])
    .filter((field) => /^playable_civ(?:_\d+)?$/.test(String(field && (field.baseKey || field.key) || '').toLowerCase()))
    .map((field) => Number.parseInt(String(field.value || ''), 10))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  assert.deepEqual(rePlayable, playableReplacement);
  assert.equal(String((getRecordField(reGameRecord, 'turns_in_time_section_0') || {}).value || ''), expectedTurns);
  assert.equal(String((getRecordField(reGameRecord, 'time_per_turn_in_time_section_0') || {}).value || ''), expectedPerTurn);

  const reTerrSection = getSection(reloaded.tabs.terrain, 'TERR');
  assert.ok(reTerrSection && reTerrSection.records[0], 'expected reloaded TERR record');
  const reTerrMaskField = getRecordField(reTerrSection.records[0], 'possibleResourcesMask');
  assert.ok(reTerrMaskField, 'expected reloaded terrain possible-resources mask field');
  assert.equal(String(reTerrMaskField.value || ''), expectedMask);
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

test('BIQ delete cascade reindexes supported technology references end-to-end', (t) => {
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

  const techDeleteRef = 'TECH_C3X_DEL_A';
  const techShiftRef = 'TECH_C3X_DEL_B';

  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      technologies: {
        recordOps: [
          { op: 'add', newRecordRef: techDeleteRef },
          { op: 'add', newRecordRef: techShiftRef }
        ]
      }
    }
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'save add failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const deleteTechIndex = getBiqSectionRecordIndex(afterAdd, 'TECH', techDeleteRef);
  const shiftTechIndex = getBiqSectionRecordIndex(afterAdd, 'TECH', techShiftRef);
  assert.ok(deleteTechIndex >= 0, 'expected delete-target tech with BIQ index');
  assert.ok(shiftTechIndex >= 0, 'expected shift-target tech with BIQ index');

  const techHost = (afterAdd.tabs.technologies && afterAdd.tabs.technologies.entries || []).find((entry) =>
    entry && entry.civilopediaKey !== techDeleteRef && entry.civilopediaKey !== techShiftRef && findField(entry, 'prerequisite1')
  );
  if (!techHost) {
    t.skip('Sample BIQ did not expose enough editable TECH references.');
    return;
  }

  findField(techHost, 'prerequisite1').value = String(deleteTechIndex);
  findField(techHost, 'prerequisite2').value = String(shiftTechIndex);

  const setSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: afterAdd.tabs
  });
  assert.equal(setSave.ok, true, String(setSave.error || 'save setup refs failed'));

  const deleteSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      technologies: {
        recordOps: [{ op: 'delete', recordRef: techDeleteRef }]
      }
    }
  });
  assert.equal(deleteSave.ok, true, String(deleteSave.error || 'delete cascade save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reloadedShiftTechIndex = getBiqSectionRecordIndex(reloaded, 'TECH', techShiftRef);
  assert.ok(reloadedShiftTechIndex >= 0, 'expected surviving tech after delete');
  const reTechHost = getEntryByCivKey(reloaded.tabs.technologies.entries, techHost.civilopediaKey);
  assert.equal(String(findField(reTechHost, 'prerequisite1').value), 'None', 'deleted self-tech prereq should clear to None');
  assert.equal(parseDisplayedReferenceIndex(findField(reTechHost, 'prerequisite2').value, -1), reloadedShiftTechIndex, 'higher self-tech prereq should decrement');
});

test('BIQ delete cascade reindexes supported resource references end-to-end', (t) => {
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

  const deleteGoodRef = 'GOOD_C3X_DEL_A';
  const shiftGoodRef = 'GOOD_C3X_DEL_B';

  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      resources: {
        recordOps: [
          { op: 'add', newRecordRef: deleteGoodRef },
          { op: 'add', newRecordRef: shiftGoodRef }
        ]
      }
    }
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'save add failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const deleteGoodIndex = getBiqSectionRecordIndex(afterAdd, 'GOOD', deleteGoodRef);
  const shiftGoodIndex = getBiqSectionRecordIndex(afterAdd, 'GOOD', shiftGoodRef);
  assert.ok(deleteGoodIndex >= 0, 'expected delete-target resource with BIQ index');
  assert.ok(shiftGoodIndex >= 0, 'expected shift-target resource with BIQ index');

  const unitHost = (afterAdd.tabs.units && afterAdd.tabs.units.entries || []).find((entry) =>
    entry && findField(entry, 'requiredresource1') && findField(entry, 'requiredresource2')
  );
  if (!unitHost) {
    t.skip('Sample BIQ did not expose enough editable unit resource references.');
    return;
  }

  findField(unitHost, 'requiredresource1').value = String(deleteGoodIndex);
  findField(unitHost, 'requiredresource2').value = String(shiftGoodIndex);

  const setSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: afterAdd.tabs
  });
  assert.equal(setSave.ok, true, String(setSave.error || 'save setup refs failed'));

  const deleteSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      resources: {
        recordOps: [{ op: 'delete', recordRef: deleteGoodRef }]
      }
    }
  });
  assert.equal(deleteSave.ok, true, String(deleteSave.error || 'delete cascade save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reloadedShiftGoodIndex = getBiqSectionRecordIndex(reloaded, 'GOOD', shiftGoodRef);
  assert.ok(reloadedShiftGoodIndex >= 0, 'expected surviving resource after delete');
  const reUnitHost = getEntryByCivKey(reloaded.tabs.units.entries, unitHost.civilopediaKey);
  assert.equal(String(findField(reUnitHost, 'requiredresource1').value), 'None', 'deleted unit resource prerequisite should clear to None');
  assert.equal(parseDisplayedReferenceIndex(findField(reUnitHost, 'requiredresource2').value, -1), reloadedShiftGoodIndex, 'higher unit resource prerequisite should decrement');
});

test('BIQ delete cascade reindexes supported government references end-to-end', (t) => {
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

  const deleteGovRef = 'GOVT_C3X_DEL_A';
  const shiftGovRef = 'GOVT_C3X_DEL_B';

  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      governments: {
        recordOps: [
          { op: 'add', newRecordRef: deleteGovRef },
          { op: 'add', newRecordRef: shiftGovRef }
        ]
      }
    }
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'save add failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const deleteGovIndex = getBiqSectionRecordIndex(afterAdd, 'GOVT', deleteGovRef);
  const shiftGovIndex = getBiqSectionRecordIndex(afterAdd, 'GOVT', shiftGovRef);
  assert.ok(deleteGovIndex >= 0, 'expected delete-target government with BIQ index');
  assert.ok(shiftGovIndex >= 0, 'expected shift-target government with BIQ index');

  const civHost = (afterAdd.tabs.civilizations && afterAdd.tabs.civilizations.entries || []).find((entry) =>
    entry && findField(entry, 'favoritegovernment') && findField(entry, 'shunnedgovernment')
  );
  if (!civHost) {
    t.skip('Sample BIQ did not expose enough editable civilization government references.');
    return;
  }

  findField(civHost, 'favoritegovernment').value = String(deleteGovIndex);
  findField(civHost, 'shunnedgovernment').value = String(shiftGovIndex);

  const setSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: afterAdd.tabs
  });
  assert.equal(setSave.ok, true, String(setSave.error || 'save setup refs failed'));

  const deleteSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      governments: {
        recordOps: [{ op: 'delete', recordRef: deleteGovRef }]
      }
    }
  });
  assert.equal(deleteSave.ok, true, String(deleteSave.error || 'delete cascade save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reloadedShiftGovIndex = getBiqSectionRecordIndex(reloaded, 'GOVT', shiftGovRef);
  assert.ok(reloadedShiftGovIndex >= 0, 'expected surviving government after delete');
  const reCivHost = getEntryByCivKey(reloaded.tabs.civilizations.entries, civHost.civilopediaKey);
  assert.equal(String(findField(reCivHost, 'favoritegovernment').value), 'None', 'deleted favorite government should clear to None');
  assert.equal(parseDisplayedReferenceIndex(findField(reCivHost, 'shunnedgovernment').value, -1), reloadedShiftGovIndex, 'higher shunned government should decrement');
});

test('BIQ delete cascade reindexes supported building references end-to-end', (t) => {
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

  const deleteBldgRef = 'BLDG_C3X_DEL_A';
  const shiftBldgRef = 'BLDG_C3X_DEL_B';

  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      improvements: {
        recordOps: [
          { op: 'add', newRecordRef: deleteBldgRef },
          { op: 'add', newRecordRef: shiftBldgRef }
        ]
      }
    }
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'save add failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const deleteBldgIndex = getBiqSectionRecordIndex(afterAdd, 'BLDG', deleteBldgRef);
  const shiftBldgIndex = getBiqSectionRecordIndex(afterAdd, 'BLDG', shiftBldgRef);
  assert.ok(deleteBldgIndex >= 0, 'expected delete-target building with BIQ index');
  assert.ok(shiftBldgIndex >= 0, 'expected shift-target building with BIQ index');

  const bldgHost = (afterAdd.tabs.improvements && afterAdd.tabs.improvements.entries || []).find((entry) =>
    entry && findField(entry, 'reqimprovement') && findField(entry, 'doubleshappiness')
  );
  if (!bldgHost) {
    t.skip('Sample BIQ did not expose enough editable building references.');
    return;
  }

  findField(bldgHost, 'reqimprovement').value = String(deleteBldgIndex);
  findField(bldgHost, 'doubleshappiness').value = String(shiftBldgIndex);

  const setSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: afterAdd.tabs
  });
  assert.equal(setSave.ok, true, String(setSave.error || 'save setup refs failed'));

  const deleteSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      improvements: {
        recordOps: [{ op: 'delete', recordRef: deleteBldgRef }]
      }
    }
  });
  assert.equal(deleteSave.ok, true, String(deleteSave.error || 'delete cascade save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reloadedShiftBldgIndex = getBiqSectionRecordIndex(reloaded, 'BLDG', shiftBldgRef);
  assert.ok(reloadedShiftBldgIndex >= 0, 'expected surviving building after delete');
  const reBldgHost = getEntryByCivKey(reloaded.tabs.improvements.entries, bldgHost.civilopediaKey);
  assert.equal(parseDisplayedReferenceIndex(findField(reBldgHost, 'reqimprovement').value, -1), 0, 'deleted required improvement should reset to zero sentinel');
  assert.equal(parseDisplayedReferenceIndex(findField(reBldgHost, 'doubleshappiness').value, -1), reloadedShiftBldgIndex, 'higher doubles-happiness building should decrement');
});

test('BIQ delete cascade reindexes supported unit references end-to-end', (t) => {
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

  const unitEntries = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq }).tabs.units.entries || [];
  const unitSeed = unitEntries.find((entry) => String(entry && entry.civilopediaKey || '').trim());
  if (!unitSeed) {
    t.skip('Sample BIQ did not expose a unit seed for copy tests.');
    return;
  }

  const deleteUnitRef = 'PRTO_C3X_DEL_A';
  const shiftUnitRef = 'PRTO_C3X_DEL_B';
  const addSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      units: {
        recordOps: [
          { op: 'copy', sourceRef: String(unitSeed.civilopediaKey || '').toUpperCase(), newRecordRef: deleteUnitRef },
          { op: 'copy', sourceRef: String(unitSeed.civilopediaKey || '').toUpperCase(), newRecordRef: shiftUnitRef }
        ]
      }
    }
  });
  assert.equal(addSave.ok, true, String(addSave.error || 'save add failed'));

  const afterAdd = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const deleteUnitIndex = getBiqSectionRecordIndex(afterAdd, 'PRTO', deleteUnitRef);
  const shiftUnitIndex = getBiqSectionRecordIndex(afterAdd, 'PRTO', shiftUnitRef);
  assert.ok(deleteUnitIndex >= 0, 'expected delete-target unit with BIQ index');
  assert.ok(shiftUnitIndex >= 0, 'expected shift-target unit with BIQ index');

  const unitHost = (afterAdd.tabs.units && afterAdd.tabs.units.entries || []).find((entry) =>
    entry
      && String(entry.civilopediaKey || '').toUpperCase() !== deleteUnitRef
      && String(entry.civilopediaKey || '').toUpperCase() !== shiftUnitRef
      && findField(entry, 'upgradeto')
      && findField(entry, 'enslaveresultsin')
  );
  if (!unitHost) {
    t.skip('Sample BIQ did not expose enough editable unit references.');
    return;
  }

  findField(unitHost, 'upgradeto').value = String(deleteUnitIndex);
  findField(unitHost, 'enslaveresultsin').value = String(shiftUnitIndex);

  const setSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: afterAdd.tabs
  });
  assert.equal(setSave.ok, true, String(setSave.error || 'save setup refs failed'));

  const deleteSave = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      units: {
        recordOps: [{ op: 'delete', recordRef: deleteUnitRef }]
      }
    }
  });
  assert.equal(deleteSave.ok, true, String(deleteSave.error || 'delete cascade save failed'));

  const reloaded = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const reloadedShiftUnitIndex = getBiqSectionRecordIndex(reloaded, 'PRTO', shiftUnitRef);
  assert.ok(reloadedShiftUnitIndex >= 0, 'expected surviving unit after delete');
  const reUnitHost = getEntryByCivKey(reloaded.tabs.units.entries, unitHost.civilopediaKey);
  assert.equal(String(findField(reUnitHost, 'upgradeto').value), 'None', 'deleted upgrade target should clear to None');
  assert.equal(parseDisplayedReferenceIndex(findField(reUnitHost, 'enslaveresultsin').value, -1), reloadedShiftUnitIndex, 'higher enslave-result unit should decrement');
});

test('BIQ save blocks deleting a unit when the scenario already has map data', (t) => {
  const sampleBiq = findSampleMapBiqPath();
  if (!sampleBiq) t.skip('No sample map BIQ available. Set C3X_TEST_MAP_BIQ to run map BIQ integration tests.');

  const civ3Root = resolveCiv3RootFromBiq(sampleBiq);
  const tmp = mkTmpDir();
  const c3x = path.join(tmp, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  ensureDefaultC3xFiles(c3x);

  const scenarioBiq = path.join(tmp, 'scenario-map-copy.biq');
  fs.copyFileSync(sampleBiq, scenarioBiq);
  fs.chmodSync(scenarioBiq, 0o644);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3x, civ3Path: civ3Root, scenarioPath: scenarioBiq });
  const mapTab = bundle.tabs.map;
  const unitSection = getSection(mapTab, 'UNIT');
  const mapUnit = Array.isArray(unitSection && unitSection.records) ? unitSection.records[0] : null;
  if (!mapUnit) return t.skip('Sample BIQ has no map units.');

  const prtoIndex = getRecordInt(mapUnit, 'prtonumber', -1);
  if (prtoIndex < 0) return t.skip('Sample BIQ map unit does not reference a unit type.');

  const unitEntries = (bundle.tabs.units && bundle.tabs.units.entries) || [];
  const targetUnit = unitEntries.find((entry) => Number(entry && entry.biqIndex) === prtoIndex);
  if (!targetUnit) return t.skip('Could not resolve the unit type used by the map unit.');

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: civ3Root,
    scenarioPath: scenarioBiq,
    tabs: {
      units: {
        recordOps: [{ op: 'delete', recordRef: String(targetUnit.civilopediaKey || '').toUpperCase() }]
      }
    }
  });

  assert.equal(saveResult.ok, false);
  assert.match(String(saveResult.error || ''), /Cannot save yet because deleted items are still in use\./);
  assert.match(String(saveResult.error || ''), /This scenario has map data, so deleting a unit could break placed units or other map links\./);
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
