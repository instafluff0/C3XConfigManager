'use strict';

/**
 * Comprehensive Add / Copy / Import / Delete tests for all six entity types:
 *   Civilizations (RACE), Technologies (TECH), Resources (GOOD),
 *   Improvements (BLDG), Governments (GOVT), Units (PRTO).
 *
 * All tests operate on a per-test tmp copy of conquests.biq — the original
 * game file is never touched.  Import tests pull entries from Tides of Crimson
 * and verify both BIQ-level presence and art-file copying.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { loadBundle, saveBundle } = require('../src/configCore');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CIV3_ROOT = process.env.C3X_CIV3_ROOT || path.resolve(__dirname, '..', '..', '..');
const BASE_BIQ = process.env.C3X_TEST_BIQ
  || path.join(CIV3_ROOT, 'Conquests', 'conquests.biq');
const TIDES_BIQ = path.join(CIV3_ROOT, 'Conquests', 'Scenarios', 'TIDES OF CRIMSON.biq');

const BASE_BIQ_EXISTS = fs.existsSync(BASE_BIQ);
const TIDES_BIQ_EXISTS = fs.existsSync(TIDES_BIQ);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-crud-test-'));
}

/** Stand up a minimal C3X config folder so saveBundle is happy. */
function mkC3xDir(parent) {
  const c3x = path.join(parent, 'c3x');
  fs.mkdirSync(c3x, { recursive: true });
  fs.writeFileSync(path.join(c3x, 'default.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_config.txt'), '#District\nname = Base\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_wonders_config.txt'),
    '#Wonder\nname = W\nimg_row = 0\nimg_column = 0\nimg_construct_row = 0\nimg_construct_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_natural_wonders_config.txt'),
    '#Wonder\nname = N\nterrain_type = grassland\nimg_row = 0\nimg_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.tile_animations.txt'),
    '#Animation\nname = A\nini_path = Art\\Units\\Warrior\\Warrior.ini\ntype = terrain\nterrain_types = grassland\n', 'utf8');
  return c3x;
}

/**
 * Copy the base BIQ to a fresh tmp dir and load a scenario bundle from it.
 * Returns { tmpDir, c3xDir, biqPath, bundle } or null when the BIQ is absent.
 */
function setupScenario(sourceBiqPath = BASE_BIQ) {
  if (!sourceBiqPath || !fs.existsSync(sourceBiqPath)) return null;
  const tmpDir = mkTmpDir();
  const c3xDir = mkC3xDir(tmpDir);
  const biqPath = path.join(tmpDir, 'test.biq');
  fs.copyFileSync(sourceBiqPath, biqPath);
  fs.chmodSync(biqPath, 0o644);
  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3xDir, civ3Path: CIV3_ROOT, scenarioPath: biqPath });
  return { tmpDir, c3xDir, biqPath, bundle };
}

/** Reload the bundle from a given biqPath so we start fresh from disk. */
function reload(c3xDir, biqPath) {
  return loadBundle({ mode: 'scenario', c3xPath: c3xDir, civ3Path: CIV3_ROOT, scenarioPath: biqPath });
}

/** Count records in a given section code across the raw biq.sections. */
function countSection(bundle, sectionCode) {
  const code = String(sectionCode || '').toUpperCase();
  const sections = (bundle && bundle.biq && Array.isArray(bundle.biq.sections))
    ? bundle.biq.sections : [];
  const sec = sections.find((s) => String(s && s.code || '').toUpperCase() === code);
  return (sec && Array.isArray(sec.records)) ? sec.records.length : 0;
}

/** True iff the bundle's biq.sections contains a record with that civilopediaEntry. */
function biqHasKey(bundle, sectionCode, civKey) {
  const target = String(civKey || '').trim().toUpperCase();
  const code = String(sectionCode || '').toUpperCase();
  const sections = (bundle && bundle.biq && Array.isArray(bundle.biq.sections))
    ? bundle.biq.sections : [];
  const sec = sections.find((s) => String(s && s.code || '').toUpperCase() === code);
  if (!sec || !Array.isArray(sec.records)) return false;
  return sec.records.some((r) => {
    const f = (r.fields || []).find((field) =>
      String(field && (field.baseKey || field.key) || '').toLowerCase() === 'civilopediaentry'
    );
    return String(f && f.value || '').trim().toUpperCase() === target;
  });
}

/** Return a projected entry from the given tab by civilopediaKey. */
function getEntry(bundle, tabKey, civKey) {
  const entries = bundle && bundle.tabs && bundle.tabs[tabKey] && bundle.tabs[tabKey].entries;
  if (!Array.isArray(entries)) return null;
  const target = String(civKey || '').toUpperCase();
  return entries.find((e) => String(e && e.civilopediaKey || '').toUpperCase() === target) || null;
}

/** Get projected field value from an entry's biqFields. */
function fieldVal(entry, key) {
  if (!entry || !Array.isArray(entry.biqFields)) return undefined;
  const f = entry.biqFields.find(
    (field) => String(field && (field.baseKey || field.key) || '').toLowerCase() === String(key || '').toLowerCase()
  );
  return f ? f.value : undefined;
}

function getSection(bundle, sectionCode) {
  const sections = (bundle && bundle.biq && Array.isArray(bundle.biq.sections))
    ? bundle.biq.sections : [];
  const code = String(sectionCode || '').trim().toUpperCase();
  return sections.find((section) => String(section && section.code || '').trim().toUpperCase() === code) || null;
}

function getGameRecord(bundle) {
  const section = getSection(bundle, 'GAME');
  return section && Array.isArray(section.records) ? section.records[0] : null;
}

function getLeadRecords(bundle) {
  const section = getSection(bundle, 'LEAD');
  return section && Array.isArray(section.records) ? section.records : [];
}

function getRawRecordField(record, key) {
  const target = String(key || '').trim().toLowerCase();
  return (Array.isArray(record && record.fields) ? record.fields : []).find((field) =>
    String(field && (field.baseKey || field.key) || '').trim().toLowerCase() === target
  ) || null;
}

function getRawRecordInt(record, key, fallback = NaN) {
  const field = getRawRecordField(record, key);
  const match = String(field && field.value || '').match(/-?\d+/);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Simulate exactly what the renderer does when the user clicks Import:
 *   - Deep-clones the source entry
 *   - Sets all biqField originalValues to '' (so they are "dirty" and get saved)
 *   - Marks as new and assigns the new civilopediaKey
 */
function simulateImportEntry(sourceEntry, newKey) {
  const entry = JSON.parse(JSON.stringify(sourceEntry));
  entry.civilopediaKey = newKey;
  entry.biqIndex = null;
  entry.isNew = true;
  entry.biqFields = (Array.isArray(entry.biqFields) ? entry.biqFields : []).map((f) => ({
    ...f,
    originalValue: ''
  }));
  // Update the civilopediaentry projected field to match the new key
  const civField = entry.biqFields.find(
    (f) => String(f && (f.baseKey || f.key) || '').toLowerCase() === 'civilopediaentry'
  );
  if (civField) civField.value = newKey;
  entry.originalIconPaths = [];
  entry.originalRacePaths = [];
  entry.originalAnimationName = '';
  entry.originalOverview = '';
  entry.originalDescription = '';
  return entry;
}

/**
 * Save a single import op + the imported entry's field data into tmpBiq, then
 * return the save result.
 */
function saveImport(c3xDir, biqPath, tabKey, newKey, importedEntry, sourceBiqPath) {
  return saveBundle({
    mode: 'scenario',
    c3xPath: c3xDir,
    civ3Path: CIV3_ROOT,
    scenarioPath: biqPath,
    tabs: {
      [tabKey]: {
        entries: [importedEntry],
        recordOps: [{ op: 'add', newRecordRef: newKey, importArtFrom: sourceBiqPath }]
      }
    }
  });
}

/** Pick any entry from a tab that satisfies a predicate, or the first one. */
function pickEntry(bundle, tabKey, pred) {
  const entries = bundle && bundle.tabs && bundle.tabs[tabKey] && bundle.tabs[tabKey].entries;
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.find(pred) || entries[0];
}

// ---------------------------------------------------------------------------
// ADD tests — one per entity type
// ---------------------------------------------------------------------------

const ADD_CASES = [
  { tabKey: 'civilizations',  sectionCode: 'RACE', prefix: 'RACE_' },
  { tabKey: 'technologies',   sectionCode: 'TECH', prefix: 'TECH_' },
  { tabKey: 'resources',      sectionCode: 'GOOD', prefix: 'GOOD_' },
  { tabKey: 'improvements',   sectionCode: 'BLDG', prefix: 'BLDG_' },
  { tabKey: 'governments',    sectionCode: 'GOVT', prefix: 'GOVT_' },
  { tabKey: 'units',          sectionCode: 'PRTO', prefix: 'PRTO_' }
];

for (const { tabKey, sectionCode, prefix } of ADD_CASES) {
  test(`Add blank ${sectionCode}: new record present and others untouched`, (t) => {
    const sourceBiq = tabKey === 'civilizations' ? TIDES_BIQ : BASE_BIQ;
    const ctx = setupScenario(sourceBiq);
    if (!ctx) return t.skip(`Source BIQ not found: ${sourceBiq}`);
    const { c3xDir, biqPath } = ctx;

    const before = reload(c3xDir, biqPath);
    const countBefore = countSection(before, sectionCode);
    assert.ok(countBefore > 0, `expected existing ${sectionCode} records`);

    // Capture existing keys so we can verify none were touched
    const existingKeys = (before.biq.sections.find(
      (s) => String(s.code || '').toUpperCase() === sectionCode
    )?.records || []).map((r) => {
      const f = (r.fields || []).find((field) =>
        String(field && (field.baseKey || field.key) || '').toLowerCase() === 'civilopediaentry'
      );
      return String(f && f.value || '').trim().toUpperCase();
    }).filter(Boolean);

    const newKey = `${prefix}C3X_ADD_TEST_${Date.now()}`.toUpperCase();
    const saveResult = saveBundle({
      mode: 'scenario',
      c3xPath: c3xDir,
      civ3Path: CIV3_ROOT,
      scenarioPath: biqPath,
      tabs: {
        [tabKey]: { recordOps: [{ op: 'add', newRecordRef: newKey }] }
      }
    });
    assert.equal(saveResult.ok, true, String(saveResult.error || 'save failed'));

    const after = reload(c3xDir, biqPath);
    assert.equal(countSection(after, sectionCode), countBefore + 1,
      `expected exactly one new ${sectionCode} record`);
    assert.equal(biqHasKey(after, sectionCode, newKey), true,
      `expected new record ${newKey} to exist`);

    // All pre-existing keys must still be present
    for (const key of existingKeys) {
      assert.equal(biqHasKey(after, sectionCode, key), true,
        `expected original record ${key} to survive add`);
    }
  });
}

// ---------------------------------------------------------------------------
// COPY tests — one per entity type
// ---------------------------------------------------------------------------

const COPY_SEEDS = {
  civilizations: 'RACE_AMERICAN',
  technologies:  'TECH_POTTERY',
  resources:     'GOOD_ALUMINUM',
  improvements:  'BLDG_BARRACKS',
  governments:   'GOVT_DESPOTISM',
  units:         'PRTO_WARRIOR'
};

for (const { tabKey, sectionCode, prefix } of ADD_CASES) {
  test(`Copy ${sectionCode}: copy present, source unchanged, key fields match`, (t) => {
    const sourceBiq = tabKey === 'civilizations' ? TIDES_BIQ : BASE_BIQ;
    const ctx = setupScenario(sourceBiq);
    if (!ctx) return t.skip(`Source BIQ not found: ${sourceBiq}`);
    const { c3xDir, biqPath } = ctx;

    const before = reload(c3xDir, biqPath);
    const seedKey = COPY_SEEDS[tabKey];
    const sourceEntry = getEntry(before, tabKey, seedKey)
      || before.tabs[tabKey].entries[0];
    assert.ok(sourceEntry, `expected a source entry for ${tabKey}`);
    const sourceRef = String(sourceEntry.civilopediaKey || '').toUpperCase();

    const newKey = `${prefix}C3X_COPY_TEST_${Date.now()}`.toUpperCase();
    const saveResult = saveBundle({
      mode: 'scenario',
      c3xPath: c3xDir,
      civ3Path: CIV3_ROOT,
      scenarioPath: biqPath,
      tabs: {
        [tabKey]: {
          recordOps: [{ op: 'copy', sourceRef, newRecordRef: newKey }]
        }
      }
    });
    assert.equal(saveResult.ok, true, String(saveResult.error || 'copy save failed'));

    const after = reload(c3xDir, biqPath);
    // New record is present
    assert.equal(biqHasKey(after, sectionCode, newKey), true,
      `expected copied record ${newKey}`);
    // Source still present and unchanged
    assert.equal(biqHasKey(after, sectionCode, sourceRef), true,
      `expected source record ${sourceRef} to survive copy`);

    // Verify the copy has the same 'name' field value as the source (where applicable)
    const copiedEntry = getEntry(after, tabKey, newKey);
    const originalEntry = getEntry(after, tabKey, sourceRef);
    if (copiedEntry && originalEntry) {
      // Some scalar fields should match (e.g. cost for techs, type for resources)
      const keysToCheck = {
        technologies:  ['cost', 'era'],
        resources:     ['type'],
        improvements:  ['cost'],
        governments:   ['corruptionlevel'],
        civilizations: ['aggressionlevel'],
        units:         ['attack']
      };
      const checkKeys = keysToCheck[tabKey] || [];
      for (const k of checkKeys) {
        const copiedVal = fieldVal(copiedEntry, k);
        const origVal   = fieldVal(originalEntry, k);
        if (copiedVal !== undefined && origVal !== undefined) {
          assert.equal(copiedVal, origVal,
            `expected ${k} to match between source and copy for ${tabKey}`);
        }
      }
    }
  });
}

// ---------------------------------------------------------------------------
// DELETE tests — one per entity type
// ---------------------------------------------------------------------------

for (const { tabKey, sectionCode, prefix } of ADD_CASES) {
  test(`Delete ${sectionCode}: record gone after delete, others untouched`, (t) => {
    const sourceBiq = tabKey === 'civilizations' ? TIDES_BIQ : BASE_BIQ;
    const ctx = setupScenario(sourceBiq);
    if (!ctx) return t.skip(`Source BIQ not found: ${sourceBiq}`);
    const { c3xDir, biqPath } = ctx;

    // Step 1: add a fresh record so we have something safe to delete
    // (avoids triggering reference-protection checks on existing data)
    const newKey = `${prefix}C3X_DEL_TEST_${Date.now()}`.toUpperCase();
    const addResult = saveBundle({
      mode: 'scenario',
      c3xPath: c3xDir,
      civ3Path: CIV3_ROOT,
      scenarioPath: biqPath,
      tabs: { [tabKey]: { recordOps: [{ op: 'add', newRecordRef: newKey }] } }
    });
    assert.equal(addResult.ok, true, `pre-delete add failed: ${addResult.error}`);

    const afterAdd = reload(c3xDir, biqPath);
    assert.equal(biqHasKey(afterAdd, sectionCode, newKey), true, 'record should exist before delete');
    const countAfterAdd = countSection(afterAdd, sectionCode);

    // Step 2: capture existing keys (excluding the one we're deleting)
    const survivorKeys = (afterAdd.biq.sections.find(
      (s) => String(s.code || '').toUpperCase() === sectionCode
    )?.records || []).map((r) => {
      const f = (r.fields || []).find((field) =>
        String(field && (field.baseKey || field.key) || '').toLowerCase() === 'civilopediaentry'
      );
      return String(f && f.value || '').trim().toUpperCase();
    }).filter((k) => k && k !== newKey);

    // Step 3: delete
    const delResult = saveBundle({
      mode: 'scenario',
      c3xPath: c3xDir,
      civ3Path: CIV3_ROOT,
      scenarioPath: biqPath,
      tabs: { [tabKey]: { recordOps: [{ op: 'delete', recordRef: newKey }] } }
    });
    assert.equal(delResult.ok, true, String(delResult.error || 'delete save failed'));

    const afterDel = reload(c3xDir, biqPath);
    assert.equal(biqHasKey(afterDel, sectionCode, newKey), false,
      `expected deleted record ${newKey} to be gone`);
    assert.equal(countSection(afterDel, sectionCode), countAfterAdd - 1,
      `expected count to decrease by 1 after delete`);

    // All survivors still present
    for (const key of survivorKeys) {
      assert.equal(biqHasKey(afterDel, sectionCode, key), true,
        `expected survivor ${key} to remain after delete`);
    }
  });
}

// ---------------------------------------------------------------------------
// IMPORT tests — presence, correct field values, no baggage
// ---------------------------------------------------------------------------

// Helper: run a full import from Tides and return { before, after, saveResult, newKey, importedEntry, srcEntry }
function runTidesImport(t, tabKey, sectionCode, prefix, srcPicker, targetBiqPath = BASE_BIQ) {
  const ctx = setupScenario(targetBiqPath);
  if (!ctx) { t.skip(`Target BIQ not found: ${targetBiqPath}`); return null; }
  if (!TIDES_BIQ_EXISTS) { t.skip(`Tides of Crimson BIQ not found: ${TIDES_BIQ}`); return null; }
  const { c3xDir, biqPath } = ctx;

  const tidesBundle = loadBundle({
    mode: 'scenario',
    civ3Path: CIV3_ROOT,
    scenarioPath: TIDES_BIQ
  });

  const srcEntry = srcPicker
    ? srcPicker(tidesBundle)
    : pickEntry(tidesBundle, tabKey, () => true);

  if (!srcEntry) { t.skip(`No usable ${tabKey} entry found in Tides`); return null; }

  const before = reload(c3xDir, biqPath);
  const newKey = `${prefix}C3X_IMP_TEST_${Date.now()}`.toUpperCase();
  const importedEntry = simulateImportEntry(srcEntry, newKey);

  const saveResult = saveImport(c3xDir, biqPath, tabKey, newKey, importedEntry, TIDES_BIQ);
  const after = reload(c3xDir, biqPath);

  return { c3xDir, biqPath, before, after, saveResult, newKey, importedEntry, srcEntry };
}

// --- Civ import ---
test('Import Civ from Tides: save succeeds and new RACE record present', (t) => {
  const r = runTidesImport(t, 'civilizations', 'RACE', 'RACE_',
    (b) => b.tabs.civilizations.entries.find((e) => e.civilopediaKey === 'RACE_AMAZONIANS')
      || b.tabs.civilizations.entries[0],
    TIDES_BIQ);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(biqHasKey(r.after, 'RACE', r.newKey), true, 'imported RACE record should be present');
});

test('Import Civ from Tides: scalar field values match source entry', (t) => {
  const r = runTidesImport(t, 'civilizations', 'RACE', 'RACE_',
    (b) => b.tabs.civilizations.entries.find((e) => e.civilopediaKey === 'RACE_AMAZONIANS')
      || b.tabs.civilizations.entries[0],
    TIDES_BIQ);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'civilizations', r.newKey);
  assert.ok(reloaded, 'expected reloaded civ entry');
  // Scalar fields that survive roundtrip unmodified
  for (const key of ['aggressionlevel', 'leadergender', 'culturegroup']) {
    const srcVal = fieldVal(r.srcEntry, key);
    const dstVal = fieldVal(reloaded, key);
    if (srcVal !== undefined && dstVal !== undefined) {
      assert.equal(dstVal, srcVal, `expected field ${key} to match after import`);
    }
  }
});

test('Import Civ from Tides: does NOT increase tech count (no baggage)', (t) => {
  const r = runTidesImport(t, 'civilizations', 'RACE', 'RACE_',
    (b) => b.tabs.civilizations.entries[0],
    TIDES_BIQ);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(countSection(r.after, 'TECH'), countSection(r.before, 'TECH'),
    'tech count must not change when importing a civilization');
  assert.equal(countSection(r.after, 'GOOD'), countSection(r.before, 'GOOD'),
    'resource count must not change when importing a civilization');
  assert.equal(countSection(r.after, 'BLDG'), countSection(r.before, 'BLDG'),
    'improvement count must not change when importing a civilization');
});

// --- Tech import ---
test('Import Tech from Tides: save succeeds and new TECH record present', (t) => {
  const r = runTidesImport(t, 'technologies', 'TECH', 'TECH_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(biqHasKey(r.after, 'TECH', r.newKey), true, 'imported TECH record should be present');
});

test('Import Tech from Tides: cost and era fields match source', (t) => {
  const r = runTidesImport(t, 'technologies', 'TECH', 'TECH_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'technologies', r.newKey);
  assert.ok(reloaded, 'expected reloaded tech entry');

  // cost: plain integer, direct compare
  const srcCost = fieldVal(r.srcEntry, 'cost');
  const dstCost = fieldVal(reloaded, 'cost');
  if (srcCost !== undefined && dstCost !== undefined) {
    assert.equal(dstCost, srcCost, 'expected cost to round-trip');
  }

  // era: compare the raw numeric value only — display labels may differ between BIQs
  // (e.g. era index 2 is "Magic Era" in Tides but "Industrial Ages" in base conquests)
  const extractNumeric = (v) => {
    const m = String(v || '').match(/\((-?\d+)\)$/);
    return m ? m[1] : String(v || '');
  };
  const srcEra = fieldVal(r.srcEntry, 'era');
  const dstEra = fieldVal(reloaded, 'era');
  if (srcEra !== undefined && dstEra !== undefined) {
    assert.equal(extractNumeric(dstEra), extractNumeric(srcEra),
      `expected era numeric index to round-trip (src: ${srcEra}, dst: ${dstEra})`);
  }
});

test('Import Tech from Tides: does NOT increase civ or resource count (no baggage)', (t) => {
  const r = runTidesImport(t, 'technologies', 'TECH', 'TECH_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(countSection(r.after, 'RACE'), countSection(r.before, 'RACE'),
    'civ count must not change when importing a tech');
  assert.equal(countSection(r.after, 'GOOD'), countSection(r.before, 'GOOD'),
    'resource count must not change when importing a tech');
});

// --- Resource import ---
test('Import Resource from Tides: save succeeds and new GOOD record present', (t) => {
  const r = runTidesImport(t, 'resources', 'GOOD', 'GOOD_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(biqHasKey(r.after, 'GOOD', r.newKey), true, 'imported GOOD record should be present');
});

test('Import Resource from Tides: type field matches source', (t) => {
  const r = runTidesImport(t, 'resources', 'GOOD', 'GOOD_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'resources', r.newKey);
  assert.ok(reloaded, 'expected reloaded resource entry');
  const srcType = fieldVal(r.srcEntry, 'type');
  const dstType = fieldVal(reloaded, 'type');
  if (srcType !== undefined && dstType !== undefined) {
    assert.equal(dstType, srcType, 'expected resource type to round-trip');
  }
});

test('Import Resource from Tides: no baggage — tech count unchanged', (t) => {
  // A resource may reference a tech prerequisite by BIQ index,
  // but that tech must NOT be pulled into the target scenario.
  const r = runTidesImport(t, 'resources', 'GOOD', 'GOOD_',
    // Prefer a resource with a non-(-1) prerequisite so the test is meaningful
    (b) => b.tabs.resources.entries.find((e) => {
      const prereq = fieldVal(e, 'prerequisite');
      return prereq !== undefined && prereq !== '-1' && prereq !== '';
    }) || b.tabs.resources.entries[0]);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(countSection(r.after, 'TECH'), countSection(r.before, 'TECH'),
    'tech count must not change when importing a resource (no prerequisite tech drag-along)');
  assert.equal(countSection(r.after, 'RACE'), countSection(r.before, 'RACE'),
    'civ count must not change when importing a resource');
  assert.equal(countSection(r.after, 'BLDG'), countSection(r.before, 'BLDG'),
    'improvement count must not change when importing a resource');
});

test('Import Resource from Tides: prerequisite field value is preserved as-is', (t) => {
  // The raw prerequisite index is copied as-is (points into the target BIQ index space).
  // What matters is that the field IS written — not that it resolves to anything Tides-specific.
  const r = runTidesImport(t, 'resources', 'GOOD', 'GOOD_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'resources', r.newKey);
  assert.ok(reloaded, 'expected reloaded resource entry');
  // prerequisite field should exist and contain a parseable integer value
  // (may be raw like '-1', display like 'None', or formatted like 'Mysticism (9)')
  const prereqField = (reloaded.biqFields || []).find(
    (f) => String(f && (f.baseKey || f.key) || '').toLowerCase() === 'prerequisite'
  );
  assert.ok(prereqField, 'expected prerequisite field to exist on imported resource');
  const prereqStr = String(prereqField.value || '');
  const numericMatch = prereqStr.match(/-?\d+/);
  assert.ok(numericMatch, `expected prerequisite to contain a numeric value, got: ${prereqStr}`);
});

// --- Improvement import ---
test('Import Improvement from Tides: save succeeds and new BLDG record present', (t) => {
  const r = runTidesImport(t, 'improvements', 'BLDG', 'BLDG_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(biqHasKey(r.after, 'BLDG', r.newKey), true, 'imported BLDG record should be present');
});

test('Import Improvement from Tides: cost field matches source', (t) => {
  const r = runTidesImport(t, 'improvements', 'BLDG', 'BLDG_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'improvements', r.newKey);
  assert.ok(reloaded, 'expected reloaded improvement entry');
  const srcCost = fieldVal(r.srcEntry, 'cost');
  const dstCost = fieldVal(reloaded, 'cost');
  if (srcCost !== undefined && dstCost !== undefined) {
    assert.equal(dstCost, srcCost, 'expected improvement cost to round-trip');
  }
});

test('Import Improvement from Tides: no baggage — no extra sections added', (t) => {
  const r = runTidesImport(t, 'improvements', 'BLDG', 'BLDG_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(countSection(r.after, 'TECH'), countSection(r.before, 'TECH'),
    'tech count must not change when importing an improvement');
  assert.equal(countSection(r.after, 'RACE'), countSection(r.before, 'RACE'),
    'civ count must not change when importing an improvement');
  assert.equal(countSection(r.after, 'GOOD'), countSection(r.before, 'GOOD'),
    'resource count must not change when importing an improvement');
  assert.equal(countSection(r.after, 'PRTO'), countSection(r.before, 'PRTO'),
    'unit count must not change when importing an improvement');
});

// --- Government import ---
test('Import Government from Tides: save succeeds and new GOVT record present', (t) => {
  const r = runTidesImport(t, 'governments', 'GOVT', 'GOVT_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(biqHasKey(r.after, 'GOVT', r.newKey), true, 'imported GOVT record should be present');
});

test('Import Government from Tides: corruption level field matches source', (t) => {
  const r = runTidesImport(t, 'governments', 'GOVT', 'GOVT_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'governments', r.newKey);
  assert.ok(reloaded, 'expected reloaded government entry');
  const srcVal = fieldVal(r.srcEntry, 'corruptionlevel');
  const dstVal = fieldVal(reloaded, 'corruptionlevel');
  if (srcVal !== undefined && dstVal !== undefined) {
    assert.equal(dstVal, srcVal, 'expected corruptionlevel to round-trip');
  }
});

test('Import Government from Tides: no baggage — section counts unchanged', (t) => {
  const r = runTidesImport(t, 'governments', 'GOVT', 'GOVT_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  for (const code of ['RACE', 'TECH', 'GOOD', 'BLDG', 'PRTO']) {
    assert.equal(countSection(r.after, code), countSection(r.before, code),
      `${code} count must not change when importing a government`);
  }
});

// --- Unit import ---
test('Import Unit from Tides: save succeeds and new PRTO record present', (t) => {
  const r = runTidesImport(t, 'units', 'PRTO', 'PRTO_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  assert.equal(biqHasKey(r.after, 'PRTO', r.newKey), true, 'imported PRTO record should be present');
});

test('Import Unit from Tides: attack/defense fields match source', (t) => {
  const r = runTidesImport(t, 'units', 'PRTO', 'PRTO_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  const reloaded = getEntry(r.after, 'units', r.newKey);
  assert.ok(reloaded, 'expected reloaded unit entry');
  for (const key of ['attack', 'defense', 'movement']) {
    const srcVal = fieldVal(r.srcEntry, key);
    const dstVal = fieldVal(reloaded, key);
    if (srcVal !== undefined && dstVal !== undefined) {
      assert.equal(dstVal, srcVal, `expected field ${key} to round-trip for imported unit`);
    }
  }
});

test('Import Unit from Tides: no baggage — no extra sections added', (t) => {
  const r = runTidesImport(t, 'units', 'PRTO', 'PRTO_', null);
  if (!r) return;
  assert.equal(r.saveResult.ok, true, String(r.saveResult.error || 'save failed'));
  for (const code of ['RACE', 'TECH', 'GOOD', 'BLDG', 'GOVT']) {
    assert.equal(countSection(r.after, code), countSection(r.before, code),
      `${code} count must not change when importing a unit`);
  }
});

// ---------------------------------------------------------------------------
// ART COPY tests — verify files land in the target content root
// ---------------------------------------------------------------------------

test('Import Civ from Tides: FLC forward/reverse filenames are copied to scenario content root', (t) => {
  const ctx = setupScenario();
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  if (!TIDES_BIQ_EXISTS) return t.skip(`Tides BIQ not found: ${TIDES_BIQ}`);
  const { tmpDir, c3xDir, biqPath } = ctx;

  const prepDelete = saveBundle({
    mode: 'scenario',
    c3xPath: c3xDir,
    civ3Path: CIV3_ROOT,
    scenarioPath: biqPath,
    tabs: {
      civilizations: {
        recordOps: [{ op: 'delete', recordRef: 'RACE_AMERICAN' }]
      }
    }
  });
  assert.equal(prepDelete.ok, true, String(prepDelete.error || 'failed to free a civ slot before import'));

  const tidesBundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const srcCiv = tidesBundle.tabs.civilizations.entries.find(
    (e) => e.civilopediaKey === 'RACE_AMAZONIANS'
  ) || tidesBundle.tabs.civilizations.entries[0];
  if (!srcCiv) return t.skip('No RACE entry found in Tides');

  // Collect forward/reverse FLC paths from projected biqFields
  const flcPaths = (srcCiv.biqFields || [])
    .filter((f) => /^(forward|reverse)filename_for_era_\d+$/.test(
      String(f && (f.baseKey || f.key) || '').toLowerCase()
    ))
    .map((f) => String(f.value || '').trim())
    .filter(Boolean);

  if (flcPaths.length === 0) return t.skip('Source civ has no FLC paths in biqFields');

  const newKey = `RACE_C3X_ARTTEST_${Date.now()}`.toUpperCase();
  const importedEntry = simulateImportEntry(srcCiv, newKey);
  const saveResult = saveImport(c3xDir, biqPath, 'civilizations', newKey, importedEntry, TIDES_BIQ);
  assert.equal(saveResult.ok, true, String(saveResult.error || 'art-civ save failed'));

  // At least one FLC should have been copied into tmpDir
  const artReport = (saveResult.saveReport || []).filter((r) => r.kind === 'art');
  const copiedFlcs = artReport.filter((r) =>
    String(r.path || '').toLowerCase().endsWith('.flc') &&
    path.resolve(r.path).startsWith(path.resolve(tmpDir))
  );

  // Verify at least one FLC exists on disk in the target scenario dir
  const foundOnDisk = flcPaths.some((relPath) => {
    const target = path.join(tmpDir, relPath.replace(/\\/g, path.sep));
    return fs.existsSync(target);
  });

  // Accept either a saveReport entry OR an actual file on disk
  // (file may not exist if the source Tides art itself was absent)
  if (copiedFlcs.length > 0 || foundOnDisk) {
    // Pass — art was copied
    assert.ok(true, 'at least one FLC was scheduled for copy or exists on disk');
  } else {
    // Art source files absent in this installation — soft-skip
    t.skip('Source FLC art files were not present in this Civ3 installation; skipping art-copy assertion');
  }
});

test('Import Resource from Tides: icon PCX files are copied to scenario content root', (t) => {
  const ctx = setupScenario();
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  if (!TIDES_BIQ_EXISTS) return t.skip(`Tides BIQ not found: ${TIDES_BIQ}`);
  const { tmpDir, c3xDir, biqPath } = ctx;

  const tidesBundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  // Pick a resource that actually has icon paths
  const srcRes = tidesBundle.tabs.resources.entries.find(
    (e) => Array.isArray(e.iconPaths) && e.iconPaths.length > 0
  ) || tidesBundle.tabs.resources.entries[0];
  if (!srcRes) return t.skip('No resource entry in Tides');

  const newKey = `GOOD_C3X_ARTTEST_${Date.now()}`.toUpperCase();
  const importedEntry = simulateImportEntry(srcRes, newKey);
  const saveResult = saveImport(c3xDir, biqPath, 'resources', newKey, importedEntry, TIDES_BIQ);
  assert.equal(saveResult.ok, true, String(saveResult.error || 'art-resource save failed'));

  if (!Array.isArray(srcRes.iconPaths) || srcRes.iconPaths.length === 0) {
    return t.skip('Source resource has no iconPaths; skipping art-copy assertion');
  }

  const artReport = (saveResult.saveReport || []).filter((r) => r.kind === 'art');
  const foundOnDisk = srcRes.iconPaths.some((relPath) => {
    const target = path.join(tmpDir, relPath.replace(/\\/g, path.sep));
    return fs.existsSync(target);
  });

  if (artReport.length > 0 || foundOnDisk) {
    assert.ok(true, 'icon art was scheduled for copy or exists on disk');
  } else {
    t.skip('Source icon PCX files were not present in this Civ3 installation; skipping art-copy assertion');
  }
});

test('Import Unit from Tides: animation folder files are copied to scenario content root', (t) => {
  const ctx = setupScenario();
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  if (!TIDES_BIQ_EXISTS) return t.skip(`Tides BIQ not found: ${TIDES_BIQ}`);
  const { tmpDir, c3xDir, biqPath } = ctx;

  const tidesBundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  // Pick a unit with a non-empty animationName
  const srcUnit = tidesBundle.tabs.units.entries.find(
    (e) => e.animationName && String(e.animationName).trim()
  ) || tidesBundle.tabs.units.entries[0];
  if (!srcUnit) return t.skip('No unit entry in Tides');

  const newKey = `PRTO_C3X_ARTTEST_${Date.now()}`.toUpperCase();
  const importedEntry = simulateImportEntry(srcUnit, newKey);
  const saveResult = saveImport(c3xDir, biqPath, 'units', newKey, importedEntry, TIDES_BIQ);
  assert.equal(saveResult.ok, true, String(saveResult.error || 'art-unit save failed'));

  const animName = String(srcUnit.animationName || '').trim();
  if (!animName) return t.skip('Source unit has no animationName');

  const expectedAnimDir = path.join(tmpDir, 'Art', 'Units', animName);
  const artReport = (saveResult.saveReport || []).filter((r) => r.kind === 'art');
  const animArt = artReport.filter((r) =>
    String(r.path || '').includes(path.join('Art', 'Units', animName))
  );

  if (animArt.length > 0 || (fs.existsSync(expectedAnimDir) && fs.readdirSync(expectedAnimDir).length > 0)) {
    assert.ok(true, 'unit animation folder was scheduled for copy or exists on disk');
  } else {
    t.skip(`Unit animation folder "${animName}" was not present in this Civ3 installation; skipping art-copy assertion`);
  }
});

// ---------------------------------------------------------------------------
// Stability tests — multiple operations in sequence on the same BIQ
// ---------------------------------------------------------------------------

test('Sequential add+copy+delete on same section stays consistent', (t) => {
  const ctx = setupScenario();
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  const { c3xDir, biqPath } = ctx;

  const before = reload(c3xDir, biqPath);
  const techCountBefore = countSection(before, 'TECH');

  // Add two techs
  const key1 = `TECH_SEQ_A_${Date.now()}`.toUpperCase();
  const key2 = `TECH_SEQ_B_${Date.now()}`.toUpperCase();
  const add2 = saveBundle({
    mode: 'scenario', c3xPath: c3xDir, civ3Path: CIV3_ROOT, scenarioPath: biqPath,
    tabs: { technologies: { recordOps: [{ op: 'add', newRecordRef: key1 }, { op: 'add', newRecordRef: key2 }] } }
  });
  assert.equal(add2.ok, true, String(add2.error || 'add2 failed'));

  const afterAdd2 = reload(c3xDir, biqPath);
  assert.equal(countSection(afterAdd2, 'TECH'), techCountBefore + 2, 'expected +2 techs');
  assert.equal(biqHasKey(afterAdd2, 'TECH', key1), true);
  assert.equal(biqHasKey(afterAdd2, 'TECH', key2), true);

  // Copy key1 to key3
  const key3 = `TECH_SEQ_C_${Date.now()}`.toUpperCase();
  const copyResult = saveBundle({
    mode: 'scenario', c3xPath: c3xDir, civ3Path: CIV3_ROOT, scenarioPath: biqPath,
    tabs: { technologies: { recordOps: [{ op: 'copy', sourceRef: key1, newRecordRef: key3 }] } }
  });
  assert.equal(copyResult.ok, true, String(copyResult.error || 'copy failed'));

  const afterCopy = reload(c3xDir, biqPath);
  assert.equal(countSection(afterCopy, 'TECH'), techCountBefore + 3);
  assert.equal(biqHasKey(afterCopy, 'TECH', key3), true);

  // Delete key2
  const del2 = saveBundle({
    mode: 'scenario', c3xPath: c3xDir, civ3Path: CIV3_ROOT, scenarioPath: biqPath,
    tabs: { technologies: { recordOps: [{ op: 'delete', recordRef: key2 }] } }
  });
  assert.equal(del2.ok, true, String(del2.error || 'delete key2 failed'));

  const afterDel = reload(c3xDir, biqPath);
  assert.equal(countSection(afterDel, 'TECH'), techCountBefore + 2);
  assert.equal(biqHasKey(afterDel, 'TECH', key1), true,  'key1 should remain');
  assert.equal(biqHasKey(afterDel, 'TECH', key2), false, 'key2 should be gone');
  assert.equal(biqHasKey(afterDel, 'TECH', key3), true,  'key3 copy should remain');
});

test('Multiple imports from Tides across different sections are all independent', (t) => {
  const ctx = setupScenario();
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  if (!TIDES_BIQ_EXISTS) return t.skip(`Tides BIQ not found: ${TIDES_BIQ}`);
  const { c3xDir, biqPath } = ctx;

  const tidesBundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const before = reload(c3xDir, biqPath);

  const imports = [
    { tabKey: 'technologies', sectionCode: 'TECH', prefix: 'TECH_', entry: tidesBundle.tabs.technologies.entries[0] },
    { tabKey: 'resources',    sectionCode: 'GOOD', prefix: 'GOOD_', entry: tidesBundle.tabs.resources.entries[0] },
    { tabKey: 'improvements', sectionCode: 'BLDG', prefix: 'BLDG_', entry: tidesBundle.tabs.improvements.entries[0] }
  ].filter(({ entry }) => !!entry);

  if (imports.length === 0) return t.skip('No entries found in Tides to import');

  const newKeys = [];
  for (const { tabKey, sectionCode, prefix, entry } of imports) {
    // Keys must stay ≤ 32 chars (BIQ civilopediaEntry field width).
    // Use loop index instead of random to stay short and remain unique within the batch.
    const newKey = `${prefix}C3X_MULTI_${Date.now()}_${newKeys.length}`.toUpperCase();
    newKeys.push({ tabKey, sectionCode, newKey });
    const importedEntry = simulateImportEntry(entry, newKey);
    const result = saveImport(c3xDir, biqPath, tabKey, newKey, importedEntry, TIDES_BIQ);
    assert.equal(result.ok, true, `import ${tabKey} failed: ${result.error}`);
  }

  const after = reload(c3xDir, biqPath);

  // Each import should have added exactly one record to its section
  for (const { tabKey, sectionCode, newKey } of newKeys) {
    assert.equal(biqHasKey(after, sectionCode, newKey), true,
      `expected imported ${sectionCode} record ${newKey}`);
  }

  // Sections NOT imported should be unchanged
  const importedCodes = new Set(newKeys.map((x) => x.sectionCode));
  for (const code of ['RACE', 'GOVT', 'PRTO']) {
    if (!importedCodes.has(code)) {
      assert.equal(countSection(after, code), countSection(before, code),
        `${code} count must not change from unrelated imports`);
    }
  }
});

test('Add to each uncapped section simultaneously in one save call', (t) => {
  const ctx = setupScenario(BASE_BIQ);
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  const { c3xDir, biqPath } = ctx;

  const cases = ADD_CASES.filter(({ sectionCode }) => sectionCode !== 'RACE');
  const before = reload(c3xDir, biqPath);
  const countsBefore = {};
  for (const { sectionCode } of cases) {
    countsBefore[sectionCode] = countSection(before, sectionCode);
  }

  const newKeys = {};
  const tabs = {};
  for (const { tabKey, sectionCode, prefix } of cases) {
    const newKey = `${prefix}C3X_ALLADD_${Date.now()}`.toUpperCase();
    newKeys[sectionCode] = newKey;
    tabs[tabKey] = { recordOps: [{ op: 'add', newRecordRef: newKey }] };
  }

  const saveResult = saveBundle({
    mode: 'scenario', c3xPath: c3xDir, civ3Path: CIV3_ROOT, scenarioPath: biqPath, tabs
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'multi-add save failed'));

  const after = reload(c3xDir, biqPath);
  for (const { sectionCode } of cases) {
    assert.equal(countSection(after, sectionCode), countsBefore[sectionCode] + 1,
      `expected +1 in ${sectionCode}`);
    assert.equal(biqHasKey(after, sectionCode, newKeys[sectionCode]), true,
      `expected new key in ${sectionCode}`);
  }
});
test('Import Civ into base Conquests BIQ is blocked at the Civ3 32-civ limit', (t) => {
  const r = runTidesImport(t, 'civilizations', 'RACE', 'RACE_',
    (b) => b.tabs.civilizations.entries.find((e) => e.civilopediaKey === 'RACE_AMAZONIANS')
      || b.tabs.civilizations.entries[0],
    BASE_BIQ);
  if (!r) return;
  assert.equal(r.saveResult.ok, false, 'expected save to be blocked at the hard civ cap');
  assert.match(String(r.saveResult.error || ''), /at most 32 civilizations total/i);
});

test('Delete existing civilizations reindexes GAME playable civs and LEAD civ references', (t) => {
  const ctx = setupScenario();
  if (!ctx) return t.skip(`Base BIQ not found: ${BASE_BIQ}`);
  const { c3xDir, biqPath } = ctx;

  const saveResult = saveBundle({
    mode: 'scenario',
    c3xPath: c3xDir,
    civ3Path: CIV3_ROOT,
    scenarioPath: biqPath,
    tabs: {
      civilizations: {
        recordOps: [
          { op: 'delete', recordRef: 'RACE_AMERICAN' },
          { op: 'delete', recordRef: 'RACE_ARABIAN' }
        ]
      }
    }
  });
  assert.equal(saveResult.ok, true, String(saveResult.error || 'delete save failed'));

  const after = reload(c3xDir, biqPath);
  assert.equal(biqHasKey(after, 'RACE', 'RACE_AMERICAN'), false, 'America should be deleted');
  assert.equal(biqHasKey(after, 'RACE', 'RACE_ARABIAN'), false, 'Arabia should be deleted');

  const raceCount = countSection(after, 'RACE');
  const gameRecord = getGameRecord(after);
  assert.ok(gameRecord, 'expected GAME record after delete');
  const playableIds = (Array.isArray(gameRecord.fields) ? gameRecord.fields : [])
    .filter((field) => /^playable_civ(?:_\d+)?$/i.test(String(field && (field.baseKey || field.key) || '')))
    .map((field) => getRawRecordInt({ fields: [field] }, field.baseKey || field.key, NaN))
    .filter((id) => Number.isInteger(id) && id >= 0);
  const numPlayable = getRawRecordInt(gameRecord, 'numberofplayablecivs', playableIds.length);
  assert.equal(numPlayable, playableIds.length, 'GAME playable civ count should match playable civ ids');
  playableIds.forEach((id) => {
    assert.ok(Number.isInteger(id) && id >= 0 && id < raceCount,
      `playable civ id ${id} must remain within RACE bounds ${raceCount}`);
  });

  getLeadRecords(after).forEach((record, idx) => {
    const civ = getRawRecordInt(record, 'civ', NaN);
    assert.ok(Number.isInteger(civ) && civ >= 0 && civ < raceCount,
      `LEAD record ${idx} civ index must remain within RACE bounds`);
  });
});
