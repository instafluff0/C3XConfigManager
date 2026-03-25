'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadBundle, isPrtoStrategyMapRecord, buildPrtoStrategyMapAliases } = require('../src/configCore');

const CIV3_ROOT = process.env.C3X_CIV3_ROOT || path.resolve(__dirname, '..', '..', '..');
const CONQUESTS_ROOT = path.join(CIV3_ROOT, 'Conquests');
const TIDES_BIQ = path.join(CONQUESTS_ROOT, 'Scenarios', 'TIDES OF CRIMSON.biq');
const STANDARD_BIQ = path.join(CONQUESTS_ROOT, 'conquests.biq');

const MP_SCENARIO_BIQS = [
  '1 MP Mesopotamia.biq',
  '2 MP Rise of Rome.biq',
  '3 MP Fall of Rome.biq',
  '4 MP Middle Ages.biq',
  '5 MP Mesoamerica.biq',
  '6 MP Age of Discovery.biq',
  '7 MP Sengoku - Sword of the Shogun.biq',
  '8 MP Napoleonic Europe.biq',
  '9 MP WWII in the Pacific.biq'
].map((name) => ({ name, biqPath: path.join(CONQUESTS_ROOT, 'Scenarios', name) }));

// ---------------------------------------------------------------------------
// Helpers mirroring renderer.js makeUnitIndexToLabelMap() — no DOM required
//
// Key insight: indexBiqRecordsByCivilopediaKey takes the *last* PRTO record
// per civilopedia key, so a unit entry's biqIndex is the LAST (typically a
// strategy-map duplicate) record's index, NOT the primary (otherStrategy=-1)
// record's index.  Stealth targets, however, store the *primary* index.
//
// buildPrtoStrategyMapAliases returns Map<dupIdx_string, primaryIdx_number>.
// buildUnitIndexMap applies this: for each (dupIdx → primaryIdx), if the map
// already holds dupIdx → label (from the entry), add primaryIdx → label so
// stealth-target lookups by primary index succeed.
// ---------------------------------------------------------------------------

function buildUnitIndexMap(bundle) {
  const entries = (bundle.tabs && bundle.tabs.units && bundle.tabs.units.entries) || [];
  const map = new Map();
  entries.forEach((entry, idx) => {
    const key = String(Number.isFinite(entry.biqIndex) ? entry.biqIndex : idx);
    map.set(key, String(entry.name || ''));
  });
  const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
  // aliases: Map<dupIdx_string, primaryIdx_number>
  // Entry has biqIndex = dupIdx; stealth targets store primaryIdx.
  // Add primaryIdx → label so map.get(primaryIdx) resolves.
  aliases.forEach((primaryIdx, dupIdx) => {
    if (map.has(String(primaryIdx))) return;
    const dupLabel = map.get(dupIdx); // dupIdx is the string key
    if (dupLabel) map.set(String(primaryIdx), dupLabel);
  });
  return map;
}

function getStealthTargetValues(entry) {
  return (entry.biqFields || [])
    .filter((field) => String(field && (field.baseKey || field.key) || '').toLowerCase().replace(/[^a-z0-9]/g, '') === 'stealthtarget')
    .map((field) => String(field && field.value || '').trim())
    .filter(Boolean);
}

function getPrtoSection(bundle) {
  const sections = (bundle.biq && Array.isArray(bundle.biq.sections)) ? bundle.biq.sections : [];
  return sections.find((s) => String(s && s.code || '').toUpperCase() === 'PRTO') || null;
}

function getPrtoRecordByIndex(bundle, idx) {
  const prto = getPrtoSection(bundle);
  if (!prto) return null;
  const records = Array.isArray(prto.records) ? prto.records : [];
  return records.find((r) => Number(r && r.index) === idx) || null;
}

// Returns true if index i is in the units tab entries (by biqIndex)
function isIndexInEntries(bundle, i) {
  const entries = (bundle.tabs && bundle.tabs.units && bundle.tabs.units.entries) || [];
  return entries.some((e) => Number.isFinite(e.biqIndex) && e.biqIndex === i);
}

// Collect all units with stealth targets across the bundle
function collectUnitsWithStealthTargets(bundle) {
  const entries = (bundle.tabs && bundle.tabs.units && bundle.tabs.units.entries) || [];
  return entries
    .map((entry) => ({ entry, targets: getStealthTargetValues(entry) }))
    .filter(({ targets }) => targets.length > 0);
}

// Returns the Set of target value strings that ARE resolvable via the extended map:
// - directly in entries (entry.biqIndex === T), OR
// - dup D→T in aliases where D is in entries (last-wins made D the entry's biqIndex)
// Some targets are genuinely unresolvable: multiple primary records share the same
// civilopedia key without strategy-map dups, so only the last one gets an entry.
function buildResolvableTargetSet(bundle) {
  const entries = (bundle.tabs && bundle.tabs.units && bundle.tabs.units.entries) || [];
  const entryBiqIndices = new Set(
    entries.map((e) => String(Number.isFinite(e.biqIndex) ? e.biqIndex : '')).filter(Boolean)
  );
  const resolvable = new Set(entryBiqIndices);
  const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
  aliases.forEach((primaryIdx, dupIdx) => {
    if (entryBiqIndices.has(dupIdx)) resolvable.add(String(primaryIdx));
  });
  return resolvable;
}

// ---------------------------------------------------------------------------
// Unit tests — buildPrtoStrategyMapAliases pure logic (no fixture files)
// ---------------------------------------------------------------------------

test('buildPrtoStrategyMapAliases: empty input returns empty map', () => {
  assert.equal(buildPrtoStrategyMapAliases(null).size, 0);
  assert.equal(buildPrtoStrategyMapAliases(undefined).size, 0);
  assert.equal(buildPrtoStrategyMapAliases([]).size, 0);
});

test('buildPrtoStrategyMapAliases: section with no PRTO returns empty map', () => {
  const sections = [{ code: 'TECH', records: [] }, { code: 'BLDG', records: [] }];
  assert.equal(buildPrtoStrategyMapAliases(sections).size, 0);
});

test('buildPrtoStrategyMapAliases: records with otherStrategy=-1 are not aliased', () => {
  const sections = [{
    code: 'PRTO',
    records: [
      { index: 0, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
      { index: 1, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] }
    ]
  }];
  assert.equal(buildPrtoStrategyMapAliases(sections).size, 0);
});

test('buildPrtoStrategyMapAliases: strategy-map duplicate (otherStrategy>=0) is aliased', () => {
  const sections = [{
    code: 'PRTO',
    records: [
      { index: 0, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
      { index: 5, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '0' }] }
    ]
  }];
  const aliases = buildPrtoStrategyMapAliases(sections);
  assert.equal(aliases.size, 1);
  // dupIdx="5" -> primaryIdx=0
  assert.equal(aliases.get('5'), 0);
});

test('buildPrtoStrategyMapAliases: multiple duplicates for same primary unit are all aliased', () => {
  const sections = [{
    code: 'PRTO',
    records: [
      { index: 10, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
      { index: 20, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '10' }] },
      { index: 30, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '10' }] },
      { index: 40, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '10' }] }
    ]
  }];
  const aliases = buildPrtoStrategyMapAliases(sections);
  assert.equal(aliases.size, 3);
  assert.equal(aliases.get('20'), 10);
  assert.equal(aliases.get('30'), 10);
  assert.equal(aliases.get('40'), 10);
});

test('buildPrtoStrategyMapAliases: records with missing otherStrategy field are skipped', () => {
  const sections = [{
    code: 'PRTO',
    records: [
      { index: 0, fields: [] },
      { index: 1, fields: [{ baseKey: 'name', key: 'name', value: 'Test Unit' }] }
    ]
  }];
  assert.equal(buildPrtoStrategyMapAliases(sections).size, 0);
});

test('buildPrtoStrategyMapAliases: record with null index uses 0 (Number(null)===0)', () => {
  // Number(null) === 0, so it is treated as index 0 (a valid finite number)
  const sections = [{
    code: 'PRTO',
    records: [
      { index: null, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '5' }] }
    ]
  }];
  const aliases = buildPrtoStrategyMapAliases(sections);
  // index null -> 0 is a finite index; otherStrategy=5 >= 0 -> aliased
  assert.equal(aliases.has('0'), true);
  assert.equal(aliases.get('0'), 5);
});

test('buildPrtoStrategyMapAliases: record with NaN index is skipped', () => {
  const sections = [{
    code: 'PRTO',
    records: [
      { index: NaN, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '0' }] }
    ]
  }];
  assert.equal(buildPrtoStrategyMapAliases(sections).size, 0);
});

test('buildPrtoStrategyMapAliases: otherStrategy value 0 (first unit) is a valid alias target', () => {
  const sections = [{
    code: 'PRTO',
    records: [
      { index: 0, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
      { index: 99, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '0' }] }
    ]
  }];
  const aliases = buildPrtoStrategyMapAliases(sections);
  assert.equal(aliases.get('99'), 0);
});

test('buildPrtoStrategyMapAliases: uses fullRecords when records array is absent', () => {
  const sections = [{
    code: 'PRTO',
    fullRecords: [
      { index: 0, english: 'otherStrategy: -1\n' },
      { index: 7, english: 'otherStrategy: 0\n' }
    ]
  }];
  const aliases = buildPrtoStrategyMapAliases(sections);
  assert.equal(aliases.has('7'), true);
  assert.equal(aliases.get('7'), 0);
});

test('buildPrtoStrategyMapAliases: isPrtoStrategyMapRecord and alias map are consistent', () => {
  const records = [
    { index: 0, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
    { index: 1, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '0' }] },
    { index: 2, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
    { index: 3, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '2' }] }
  ];
  const sections = [{ code: 'PRTO', records }];
  const aliases = buildPrtoStrategyMapAliases(sections);
  records.forEach((record) => {
    const isStratMap = isPrtoStrategyMapRecord(record);
    const inAliases = aliases.has(String(record.index));
    assert.equal(isStratMap, inAliases,
      `Record at index ${record.index}: isPrtoStrategyMapRecord=${isStratMap} should match alias presence`);
  });
});

// ---------------------------------------------------------------------------
// buildUnitIndexMap helper — alias direction: dupIdx→label maps to primaryIdx→label
// ---------------------------------------------------------------------------

test('buildUnitIndexMap: primary index resolves via strategy-map duplicate entry', () => {
  // Entry has biqIndex=20 (the duplicate). Stealth targets store 10 (the primary).
  const bundle = {
    tabs: { units: { entries: [{ biqIndex: 20, name: 'Swordsman' }] } },
    biq: {
      sections: [{
        code: 'PRTO',
        records: [
          { index: 10, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
          { index: 20, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '10' }] }
        ]
      }]
    }
  };
  const map = buildUnitIndexMap(bundle);
  assert.equal(map.get('20'), 'Swordsman', 'entry biqIndex (dup) should resolve');
  assert.equal(map.get('10'), 'Swordsman', 'primary index (stealth target) should also resolve');
});

test('buildUnitIndexMap: primary index already in map is not overwritten', () => {
  // Two entries: one at biqIndex 10, one at biqIndex 20 (dup of 10)
  const bundle = {
    tabs: {
      units: {
        entries: [
          { biqIndex: 10, name: 'Primary Warrior' },
          { biqIndex: 20, name: 'Warrior' }
        ]
      }
    },
    biq: {
      sections: [{
        code: 'PRTO',
        records: [
          { index: 10, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
          { index: 20, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '10' }] }
        ]
      }]
    }
  };
  const map = buildUnitIndexMap(bundle);
  // 10 is already in the map; should not be overwritten by the alias
  assert.equal(map.get('10'), 'Primary Warrior');
  assert.equal(map.get('20'), 'Warrior');
});

test('buildUnitIndexMap: alias for a duplicate not in entries has no label to propagate', () => {
  // Entry only has biqIndex=5. Dup index 99 (pointing to primary 5) has no entry.
  const bundle = {
    tabs: { units: { entries: [{ biqIndex: 5, name: 'Knight' }] } },
    biq: {
      sections: [{
        code: 'PRTO',
        records: [
          { index: 5, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
          { index: 77, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '5' }] }
          // 77 is the dup, but no entry has biqIndex=77
        ]
      }]
    }
  };
  const map = buildUnitIndexMap(bundle);
  assert.equal(map.get('5'), 'Knight');
  // alias "77"->5: dupLabel = map.get("77") = undefined -> nothing added for "5"
  // "5" was already in map before aliases, so it still resolves fine
  assert.equal(map.has('5'), true);
});

test('buildUnitIndexMap: unit with two duplicates — last dup (in entries) propagates to primary', () => {
  // Ironmask pattern: primary=399, dup1=1039, dup2=1040; entry biqIndex=1040 (last)
  const bundle = {
    tabs: { units: { entries: [{ biqIndex: 1040, name: 'Ironmask' }] } },
    biq: {
      sections: [{
        code: 'PRTO',
        records: [
          { index: 399, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '-1' }] },
          { index: 1039, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '399' }] },
          { index: 1040, fields: [{ baseKey: 'otherstrategy', key: 'otherstrategy', value: '399' }] }
        ]
      }]
    }
  };
  const map = buildUnitIndexMap(bundle);
  assert.equal(map.get('1040'), 'Ironmask', 'entry biqIndex should resolve');
  assert.equal(map.get('399'), 'Ironmask', 'primary index should resolve via last-dup alias');
  // 1039 is NOT in entries, so no propagation from 1039
  assert.equal(map.has('1039'), false);
});

// ---------------------------------------------------------------------------
// Integration: Tides of Crimson (PRTO_DRAGONSLAYER stealth targets)
// ---------------------------------------------------------------------------

test('Tides of Crimson: bundle loads with PRTO section and unit entries', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const prto = getPrtoSection(bundle);
  assert.ok(prto, 'PRTO section must be present');
  assert.ok(prto.records.length > 0, 'PRTO section must have records');
  const entries = bundle.tabs.units.entries;
  assert.ok(entries.length > 0, 'units tab must have entries');
});

test('Tides of Crimson: Dragon Slayer exists and has stealth targets including 399 and 401', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const dragon = bundle.tabs.units.entries.find((e) => String(e.civilopediaKey || '').toUpperCase() === 'PRTO_DRAGONSLAYER');
  assert.ok(dragon, 'Expected PRTO_DRAGONSLAYER unit in Tides bundle');
  const targets = getStealthTargetValues(dragon);
  assert.ok(targets.length >= 2, `Dragon Slayer should have at least 2 stealth targets, got ${targets.length}`);
  assert.ok(targets.includes('399'), 'Dragon Slayer stealth targets should include raw index 399');
  assert.ok(targets.includes('401'), 'Dragon Slayer stealth targets should include raw index 401');
});

test('Tides of Crimson: PRTO records 399 and 401 are primary units (otherStrategy=-1)', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const rec399 = getPrtoRecordByIndex(bundle, 399);
  const rec401 = getPrtoRecordByIndex(bundle, 401);
  assert.ok(rec399, 'PRTO record at index 399 must exist');
  assert.ok(rec401, 'PRTO record at index 401 must exist');
  assert.equal(isPrtoStrategyMapRecord(rec399), false, 'record 399 is a primary unit, not a strategy-map duplicate');
  assert.equal(isPrtoStrategyMapRecord(rec401), false, 'record 401 is a primary unit, not a strategy-map duplicate');
});

test('Tides of Crimson: primary unit records 399 and 401 have strategy-map duplicates in the PRTO section', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
  // At least one alias must point to primaryIdx=399 and one to primaryIdx=401
  const aliasesTo399 = [];
  const aliasesTo401 = [];
  aliases.forEach((primaryIdx, dupIdx) => {
    if (primaryIdx === 399) aliasesTo399.push(dupIdx);
    if (primaryIdx === 401) aliasesTo401.push(dupIdx);
  });
  assert.ok(aliasesTo399.length >= 1, 'At least one strategy-map duplicate must point to primary 399');
  assert.ok(aliasesTo401.length >= 1, 'At least one strategy-map duplicate must point to primary 401');
});

test('Tides of Crimson: strategy-map duplicates for 399 and 401 have entries in the units tab', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
  // For each alias pointing to 399 or 401, at least one dup index must be in entries
  function anyDupInEntries(targetPrimary) {
    let found = false;
    aliases.forEach((primaryIdx, dupIdx) => {
      if (primaryIdx === targetPrimary && isIndexInEntries(bundle, Number(dupIdx))) found = true;
    });
    return found;
  }
  assert.ok(anyDupInEntries(399), 'At least one strategy-map duplicate of unit 399 must be in units tab');
  assert.ok(anyDupInEntries(401), 'At least one strategy-map duplicate of unit 401 must be in units tab');
});

test('Tides of Crimson: extended map resolves stealth target indices 399 and 401 to unit names', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const map = buildUnitIndexMap(bundle);
  assert.ok(map.has('399'), 'Extended map must resolve index 399');
  assert.ok(map.has('401'), 'Extended map must resolve index 401');
  assert.ok(String(map.get('399') || '').trim(), 'Resolved label for 399 must not be empty');
  assert.ok(String(map.get('401') || '').trim(), 'Resolved label for 401 must not be empty');
});

test('Tides of Crimson: Dragon Slayer — all stealth targets resolve to names via extended map', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const dragon = bundle.tabs.units.entries.find((e) => String(e.civilopediaKey || '').toUpperCase() === 'PRTO_DRAGONSLAYER');
  assert.ok(dragon, 'Expected PRTO_DRAGONSLAYER');
  const targets = getStealthTargetValues(dragon);
  const map = buildUnitIndexMap(bundle);
  const unresolved = targets.filter((v) => !map.has(v));
  assert.deepEqual(unresolved, [],
    `Dragon Slayer has unresolved stealth targets after alias extension: ${unresolved.join(', ')}`);
});

test('Tides of Crimson: Dragon Slayer — named targets also resolve without needing aliases', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const dragon = bundle.tabs.units.entries.find((e) => String(e.civilopediaKey || '').toUpperCase() === 'PRTO_DRAGONSLAYER');
  assert.ok(dragon, 'Expected PRTO_DRAGONSLAYER');
  const targets = getStealthTargetValues(dragon);
  const entries = bundle.tabs.units.entries;
  const directMap = new Map(entries.map((e, i) => [String(Number.isFinite(e.biqIndex) ? e.biqIndex : i), String(e.name || '')]));
  const directlyResolved = targets.filter((v) => directMap.has(v));
  assert.ok(directlyResolved.length >= 1,
    `Expected at least 1 directly-resolved target, got ${directlyResolved.length}`);
});

test('Tides of Crimson: every resolvable stealth target is resolved by extended map', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const map = buildUnitIndexMap(bundle);
  const resolvable = buildResolvableTargetSet(bundle);
  const withTargets = collectUnitsWithStealthTargets(bundle);
  assert.ok(withTargets.length >= 1, 'Expected at least one unit with stealth targets in Tides');
  // Only assert targets that ARE theoretically resolvable (direct entry or alias with entry).
  // Targets sharing a civKey with a later primary record but lacking strategy-map dups
  // are legitimately unresolvable and are acceptable to show as raw indices.
  const issues = [];
  withTargets.forEach(({ entry, targets }) => {
    targets.forEach((v) => {
      if (resolvable.has(v) && !map.has(v)) {
        issues.push(`${entry.civilopediaKey || entry.name}: should-be-resolvable target ${v} not in extended map`);
      }
    });
  });
  assert.deepEqual(issues, [],
    `Resolvable targets missing from extended map:\n${issues.join('\n')}`);
});

test('Tides of Crimson: units tab entries are deduplicated by civilopedia key', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const entries = bundle.tabs.units.entries;
  // Because indexBiqRecordsByCivilopediaKey uses last-wins, each civilopedia key
  // appears at most once in the entries tab — even if multiple PRTO records share it.
  const keyCount = new Map();
  entries.forEach((e) => {
    const key = String(e.civilopediaKey || '');
    keyCount.set(key, (keyCount.get(key) || 0) + 1);
  });
  const duplicates = [...keyCount.entries()].filter(([k, n]) => n > 1 && k).map(([k, n]) => `${k} (${n}x)`);
  assert.deepEqual(duplicates, [], `Duplicate civilopedia keys in Tides units tab: ${duplicates.join(', ')}`);
});

test('Tides of Crimson: extended map resolves every alias whose dup is in entries', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Fixture not present: ${TIDES_BIQ}`);
  const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: TIDES_BIQ });
  const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
  const entries = bundle.tabs.units.entries;
  const entryBiqIndices = new Set(
    entries.map((e) => String(Number.isFinite(e.biqIndex) ? e.biqIndex : '')).filter(Boolean)
  );
  const map = buildUnitIndexMap(bundle);
  // For each (dupIdx → primaryIdx) where dupIdx IS in entries (the dup is the entry's biqIndex),
  // the extended map must resolve primaryIdx.
  const misses = [];
  aliases.forEach((primaryIdx, dupIdx) => {
    if (!entryBiqIndices.has(dupIdx)) return; // dup not in entries → no label available
    if (!map.has(String(primaryIdx))) {
      misses.push(`alias ${dupIdx}→${primaryIdx}: dup in entries but extended map lacks key "${primaryIdx}"`);
    }
  });
  assert.deepEqual(misses, [], misses.join('\n'));
});

// ---------------------------------------------------------------------------
// Integration: Standard game (conquests.biq)
// ---------------------------------------------------------------------------

test('Standard game: bundle loads and PRTO section is present', (t) => {
  if (!fs.existsSync(STANDARD_BIQ)) t.skip(`Fixture not present: ${STANDARD_BIQ}`);
  const bundle = loadBundle({ mode: 'global', civ3Path: CIV3_ROOT });
  assert.ok(bundle, 'bundle should load');
  const prto = getPrtoSection(bundle);
  assert.ok(prto, 'PRTO section should be present in standard game bundle');
  assert.ok(Array.isArray(prto.records) && prto.records.length > 0, 'PRTO section should have records');
});

test('Standard game: all stealth-target-bearing units resolve fully via extended map', (t) => {
  if (!fs.existsSync(STANDARD_BIQ)) t.skip(`Fixture not present: ${STANDARD_BIQ}`);
  const bundle = loadBundle({ mode: 'global', civ3Path: CIV3_ROOT });
  const map = buildUnitIndexMap(bundle);
  const withTargets = collectUnitsWithStealthTargets(bundle);
  const issues = [];
  withTargets.forEach(({ entry, targets }) => {
    targets.forEach((v) => {
      if (!map.has(v)) issues.push(`${entry.civilopediaKey || entry.name}: unresolved target ${v}`);
    });
  });
  assert.deepEqual(issues, [],
    `Unresolved stealth targets in standard game:\n${issues.join('\n')}`);
});

test('Standard game: every primary index covered by an alias has a resolvable label', (t) => {
  if (!fs.existsSync(STANDARD_BIQ)) t.skip(`Fixture not present: ${STANDARD_BIQ}`);
  const bundle = loadBundle({ mode: 'global', civ3Path: CIV3_ROOT });
  const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
  const entries = bundle.tabs.units.entries;
  const entryByBiqIndex = new Map(entries.map((e, i) => [String(Number.isFinite(e.biqIndex) ? e.biqIndex : i), e]));
  const unresolvable = [];
  // For every primaryIdx, at least one dupIdx in entries must exist
  const primaryToDups = new Map();
  aliases.forEach((primaryIdx, dupIdx) => {
    if (!primaryToDups.has(primaryIdx)) primaryToDups.set(primaryIdx, []);
    primaryToDups.get(primaryIdx).push(dupIdx);
  });
  primaryToDups.forEach((dups, primaryIdx) => {
    const hasLabel = dups.some((dupIdx) => entryByBiqIndex.has(dupIdx));
    if (!hasLabel) unresolvable.push(`primaryIdx=${primaryIdx} has dups [${dups.join(',')}] but none are in entries`);
  });
  assert.deepEqual(unresolvable, [],
    `Standard game: aliases with no resolvable label:\n${unresolvable.join('\n')}`);
});

test('Standard game: units tab entries are deduplicated by civilopedia key', (t) => {
  if (!fs.existsSync(STANDARD_BIQ)) t.skip(`Fixture not present: ${STANDARD_BIQ}`);
  const bundle = loadBundle({ mode: 'global', civ3Path: CIV3_ROOT });
  const entries = bundle.tabs.units.entries;
  const keyCount = new Map();
  entries.forEach((e) => {
    const key = String(e.civilopediaKey || '');
    keyCount.set(key, (keyCount.get(key) || 0) + 1);
  });
  const duplicates = [...keyCount.entries()].filter(([k, n]) => n > 1 && k).map(([k, n]) => `${k} (${n}x)`);
  assert.deepEqual(duplicates, [], `Duplicate civilopedia keys in standard game units tab: ${duplicates.join(', ')}`);
});

// ---------------------------------------------------------------------------
// Integration: MP scenario BIQs
// ---------------------------------------------------------------------------

MP_SCENARIO_BIQS.forEach(({ name, biqPath }) => {
  test(`MP scenario "${name}": every resolvable stealth target resolves via extended map`, (t) => {
    if (!fs.existsSync(biqPath)) t.skip(`Fixture not present: ${biqPath}`);
    const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: biqPath });
    const map = buildUnitIndexMap(bundle);
    const resolvable = buildResolvableTargetSet(bundle);
    const withTargets = collectUnitsWithStealthTargets(bundle);
    const issues = [];
    withTargets.forEach(({ entry, targets }) => {
      targets.forEach((v) => {
        if (resolvable.has(v) && !map.has(v)) {
          issues.push(`${entry.civilopediaKey || entry.name}: should-be-resolvable target ${v} not in extended map`);
        }
      });
    });
    assert.deepEqual(issues, [],
      `Resolvable targets missing from extended map in "${name}":\n${issues.join('\n')}`);
  });

  test(`MP scenario "${name}": extended map resolves every alias whose dup is in entries`, (t) => {
    if (!fs.existsSync(biqPath)) t.skip(`Fixture not present: ${biqPath}`);
    const bundle = loadBundle({ mode: 'scenario', civ3Path: CIV3_ROOT, scenarioPath: biqPath });
    const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
    const entries = bundle.tabs.units.entries;
    const entryBiqIndices = new Set(
      entries.map((e) => String(Number.isFinite(e.biqIndex) ? e.biqIndex : '')).filter(Boolean)
    );
    const map = buildUnitIndexMap(bundle);
    const misses = [];
    aliases.forEach((primaryIdx, dupIdx) => {
      if (!entryBiqIndices.has(dupIdx)) return;
      if (!map.has(String(primaryIdx))) {
        misses.push(`alias ${dupIdx}→${primaryIdx}: dup in entries but extended map lacks key "${primaryIdx}"`);
      }
    });
    assert.deepEqual(misses, [],
      `"${name}": aliases with dup in entries but primary not in extended map:\n${misses.join('\n')}`);
  });
});

// ---------------------------------------------------------------------------
// Regression: isPrtoStrategyMapRecord and buildPrtoStrategyMapAliases agree
// on all PRTO records in every available fixture
// ---------------------------------------------------------------------------

const ALL_BIQS = [
  { label: 'standard', biqPath: STANDARD_BIQ, mode: 'global' },
  { label: 'Tides of Crimson', biqPath: TIDES_BIQ, mode: 'scenario' },
  ...MP_SCENARIO_BIQS.map(({ name, biqPath }) => ({ label: name, biqPath, mode: 'scenario' }))
];

ALL_BIQS.forEach(({ label, biqPath, mode }) => {
  test(`"${label}": isPrtoStrategyMapRecord and alias map agree for every PRTO record`, (t) => {
    if (!fs.existsSync(biqPath)) t.skip(`Fixture not present: ${biqPath}`);
    const bundle = loadBundle({ mode, civ3Path: CIV3_ROOT, scenarioPath: mode === 'scenario' ? biqPath : undefined });
    const prto = getPrtoSection(bundle);
    if (!prto || !Array.isArray(prto.records) || prto.records.length === 0) {
      t.skip('No PRTO records to check');
      return;
    }
    const aliases = buildPrtoStrategyMapAliases(bundle.biq && bundle.biq.sections);
    const mismatches = [];
    prto.records.forEach((record) => {
      const idx = Number(record && record.index);
      if (!Number.isFinite(idx)) return;
      const isStratMap = isPrtoStrategyMapRecord(record);
      const inAliases = aliases.has(String(idx));
      if (isStratMap !== inAliases) {
        mismatches.push(`index ${idx}: isPrtoStrategyMapRecord=${isStratMap} but inAliases=${inAliases}`);
      }
    });
    assert.deepEqual(mismatches, [],
      `isPrtoStrategyMapRecord / alias map mismatch in "${label}":\n${mismatches.join('\n')}`);
  });
});
