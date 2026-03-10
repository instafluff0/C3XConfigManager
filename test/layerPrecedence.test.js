const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { buildReferenceTabs } = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-layers-'));
}

function writeTextLayer(root, relDir, fileName, text) {
  const dir = path.join(root, relDir, 'Text');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), text, 'utf8');
}

function getEntryByKey(entries, key) {
  const target = String(key || '').trim().toUpperCase();
  return (Array.isArray(entries) ? entries : []).find((entry) => String(entry.civilopediaKey || '').trim().toUpperCase() === target) || null;
}

function makeDiplomacy(contactLine, dealLine) {
  return [
    '#AIFIRSTCONTACT',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    `"${contactLine}"`,
    '',
    '#AIFIRSTDEAL',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    `"${dealLine}"`,
    ''
  ].join('\n');
}

test('global mode uses Conquests override precedence over PTW/Vanilla', () => {
  const root = mkTmpDir();

  writeTextLayer(root, '', 'Civilopedia.txt', ['#TECH_TEST_LAYER', 'Vanilla overview text', ''].join('\n'));
  writeTextLayer(root, 'civ3PTW', 'Civilopedia.txt', ['#TECH_TEST_LAYER', 'PTW overview text', ''].join('\n'));
  writeTextLayer(root, 'Conquests', 'Civilopedia.txt', ['#TECH_TEST_LAYER', 'Conquests overview text', ''].join('\n'));

  writeTextLayer(root, '', 'PediaIcons.txt', ['#TECH_TEST_LAYER', 'Art\\civilopedia\\icons\\tech chooser\\vanilla-small.pcx', '#TECH_TEST_LAYER_LARGE', 'Art\\civilopedia\\icons\\tech chooser\\vanilla-large.pcx', ''].join('\n'));
  writeTextLayer(root, 'civ3PTW', 'PediaIcons.txt', ['#TECH_TEST_LAYER', 'Art\\civilopedia\\icons\\tech chooser\\ptw-small.pcx', '#TECH_TEST_LAYER_LARGE', 'Art\\civilopedia\\icons\\tech chooser\\ptw-large.pcx', ''].join('\n'));
  writeTextLayer(root, 'Conquests', 'PediaIcons.txt', ['#TECH_TEST_LAYER', 'Art\\civilopedia\\icons\\tech chooser\\conquests-small.pcx', '#TECH_TEST_LAYER_LARGE', 'Art\\civilopedia\\icons\\tech chooser\\conquests-large.pcx', ''].join('\n'));

  writeTextLayer(root, '', 'diplomacy.txt', makeDiplomacy('Vanilla hello', 'Vanilla deal'));
  writeTextLayer(root, 'civ3PTW', 'diplomacy.txt', makeDiplomacy('PTW hello', 'PTW deal'));
  writeTextLayer(root, 'Conquests', 'diplomacy.txt', makeDiplomacy('Conquests hello', 'Conquests deal'));

  const tabs = buildReferenceTabs(root, { mode: 'global' });
  const tech = getEntryByKey(tabs.technologies.entries, 'TECH_TEST_LAYER');
  assert.ok(tech, 'expected merged tech entry');
  assert.match(String(tech.overview || ''), /Conquests overview text/);
  assert.ok((tech.iconPaths || []).some((p) => /conquests-large\.pcx/i.test(p)));

  const civTab = tabs.civilizations;
  const labels = (civTab.diplomacyOptions || []).map((o) => o.label).join('\n');
  assert.match(labels, /Conquests hello/);
  assert.doesNotMatch(labels, /PTW hello/);
});

test('scenario mode overrides conquests layer and falls back when key missing', () => {
  const root = mkTmpDir();
  const scenarioDir = path.join(root, 'Conquests', 'Scenarios', 'MyScenario');

  writeTextLayer(root, '', 'Civilopedia.txt', ['#TECH_BASE_ONLY', 'Vanilla base overview', ''].join('\n'));
  writeTextLayer(root, 'Conquests', 'Civilopedia.txt', [
    '#TECH_TEST_LAYER',
    'Conquests overview text',
    '',
    '#TECH_BASE_ONLY',
    'Conquests base overview',
    ''
  ].join('\n'));
  writeTextLayer(scenarioDir, '', 'Civilopedia.txt', ['#TECH_TEST_LAYER', 'Scenario overview text', ''].join('\n'));

  writeTextLayer(root, '', 'PediaIcons.txt', ['#TECH_TEST_LAYER', 'Art\\civilopedia\\icons\\tech chooser\\vanilla-small.pcx', '#TECH_TEST_LAYER_LARGE', 'Art\\civilopedia\\icons\\tech chooser\\vanilla-large.pcx', ''].join('\n'));
  writeTextLayer(root, 'Conquests', 'PediaIcons.txt', ['#TECH_TEST_LAYER', 'Art\\civilopedia\\icons\\tech chooser\\conquests-small.pcx', '#TECH_TEST_LAYER_LARGE', 'Art\\civilopedia\\icons\\tech chooser\\conquests-large.pcx', ''].join('\n'));
  writeTextLayer(scenarioDir, '', 'PediaIcons.txt', ['#TECH_TEST_LAYER', 'Art\\civilopedia\\icons\\tech chooser\\scenario-small.pcx', '#TECH_TEST_LAYER_LARGE', 'Art\\civilopedia\\icons\\tech chooser\\scenario-large.pcx', ''].join('\n'));

  writeTextLayer(root, 'Conquests', 'diplomacy.txt', makeDiplomacy('Conquests hello', 'Conquests deal'));
  writeTextLayer(scenarioDir, '', 'diplomacy.txt', makeDiplomacy('Scenario hello', 'Scenario deal'));

  const tabs = buildReferenceTabs(root, {
    mode: 'scenario',
    scenarioPath: scenarioDir,
    scenarioPaths: [scenarioDir]
  });

  const scenarioTech = getEntryByKey(tabs.technologies.entries, 'TECH_TEST_LAYER');
  assert.ok(scenarioTech, 'expected scenario tech entry');
  assert.match(String(scenarioTech.overview || ''), /Scenario overview text/);
  assert.ok((scenarioTech.iconPaths || []).some((p) => /scenario-large\.pcx/i.test(p)));

  const fallbackTech = getEntryByKey(tabs.technologies.entries, 'TECH_BASE_ONLY');
  assert.ok(fallbackTech, 'expected fallback tech entry');
  assert.match(String(fallbackTech.overview || ''), /Conquests base overview/);

  const civTab = tabs.civilizations;
  const labels = (civTab.diplomacyOptions || []).map((o) => o.label).join('\n');
  assert.match(labels, /Scenario hello/);
  assert.doesNotMatch(labels, /Conquests hello/);

  assert.equal(path.normalize(String(civTab.sourceDetails.civilopediaScenario || '')), path.normalize(path.join(scenarioDir, 'Text', 'Civilopedia.txt')));
  assert.equal(path.normalize(String(civTab.sourceDetails.pediaIconsScenarioWrite || '')), path.normalize(path.join(scenarioDir, 'Text', 'PediaIcons.txt')));
});
