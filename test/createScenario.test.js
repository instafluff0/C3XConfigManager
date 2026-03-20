const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { createScenario, FILE_SPECS } = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-new-scenario-'));
}

function seedC3xDefaults(c3xRoot) {
  Object.values(FILE_SPECS).forEach((spec) => {
    fs.writeFileSync(path.join(c3xRoot, spec.defaultName), `; ${spec.defaultName}\n`, 'utf8');
  });
}

function seedCiv3Base(civ3Root) {
  const conquestsDir = path.join(civ3Root, 'Conquests');
  const textDir = path.join(conquestsDir, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  fs.writeFileSync(path.join(conquestsDir, 'conquests.biq'), 'BICX', 'latin1');
  fs.writeFileSync(path.join(textDir, 'Civilopedia.txt'), '#TEST\nLine\n', 'latin1');
  fs.writeFileSync(path.join(textDir, 'PediaIcons.txt'), '#ICON_TEST\nArt\\x.pcx\n', 'latin1');
  fs.writeFileSync(path.join(textDir, 'diplomacy.txt'), '#HELLO\nHi\n', 'latin1');
}

test('createScenario copies BIQ, scenario text files, and C3X defaults into a new scenario folder', () => {
  const civ3Root = mkTmpDir();
  const c3xRoot = mkTmpDir();
  seedCiv3Base(civ3Root);
  seedC3xDefaults(c3xRoot);

  const parentDir = path.join(civ3Root, 'Conquests', 'Scenarios');
  const result = createScenario({
    civ3Path: civ3Root,
    c3xPath: c3xRoot,
    scenarioName: 'My Scenario',
    scenarioParentDir: parentDir
  });

  assert.equal(result.ok, true);
  const scenarioDir = path.join(parentDir, 'My Scenario');
  assert.equal(path.normalize(result.scenarioDir), path.normalize(scenarioDir));
  assert.equal(fs.existsSync(path.join(parentDir, 'My Scenario.biq')), true);
  assert.equal(fs.existsSync(path.join(scenarioDir, 'Text', 'Civilopedia.txt')), true);
  assert.equal(fs.existsSync(path.join(scenarioDir, 'Text', 'PediaIcons.txt')), true);
  assert.equal(fs.existsSync(path.join(scenarioDir, 'Text', 'diplomacy.txt')), true);
  Object.values(FILE_SPECS).forEach((spec) => {
    assert.equal(fs.existsSync(path.join(scenarioDir, spec.scenarioName)), true, `missing ${spec.scenarioName}`);
  });
  assert.match(fs.readFileSync(path.join(scenarioDir, 'scenario.c3x_config.ini'), 'utf8'), /default\.c3x_config\.ini/i);
});

test('createScenario rejects invalid scenario names', () => {
  const civ3Root = mkTmpDir();
  const c3xRoot = mkTmpDir();
  seedCiv3Base(civ3Root);
  seedC3xDefaults(c3xRoot);

  const result = createScenario({
    civ3Path: civ3Root,
    c3xPath: c3xRoot,
    scenarioName: 'bad/name'
  });
  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /invalid filename characters/i);
});

test('createScenario refuses to overwrite existing scenario folder', () => {
  const civ3Root = mkTmpDir();
  const c3xRoot = mkTmpDir();
  seedCiv3Base(civ3Root);
  seedC3xDefaults(c3xRoot);
  const parentDir = path.join(civ3Root, 'Conquests', 'Scenarios');
  fs.mkdirSync(path.join(parentDir, 'Taken Scenario'), { recursive: true });

  const result = createScenario({
    civ3Path: civ3Root,
    c3xPath: c3xRoot,
    scenarioName: 'Taken Scenario',
    scenarioParentDir: parentDir
  });
  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /already exists/i);
});

test('createScenario fails cleanly when destination parent path is not a directory', () => {
  const civ3Root = mkTmpDir();
  const c3xRoot = mkTmpDir();
  seedCiv3Base(civ3Root);
  seedC3xDefaults(c3xRoot);

  const parentAsFile = path.join(civ3Root, 'Conquests', 'Scenarios-file');
  fs.mkdirSync(path.dirname(parentAsFile), { recursive: true });
  fs.writeFileSync(parentAsFile, 'not a directory', 'utf8');

  const result = createScenario({
    civ3Path: civ3Root,
    c3xPath: c3xRoot,
    scenarioName: 'FailureCase',
    scenarioParentDir: parentAsFile
  });

  assert.equal(result.ok, false);
  assert.equal(fs.existsSync(path.join(parentAsFile, 'FailureCase')), false);
});

test('createScenario can copy an existing scenario and rename BIQ to the new scenario name', () => {
  const civ3Root = mkTmpDir();
  const sourceParent = mkTmpDir();
  const sourceDir = path.join(sourceParent, 'Source Scenario');
  fs.mkdirSync(path.join(sourceDir, 'Text'), { recursive: true });
  fs.mkdirSync(path.join(sourceDir, 'Art', 'Units', 'TestUnit'), { recursive: true });
  const sourceBiq = path.join(sourceDir, 'Source Scenario.biq');
  fs.writeFileSync(sourceBiq, 'BICX', 'latin1');
  fs.writeFileSync(path.join(sourceDir, 'Text', 'Civilopedia.txt'), '#SOURCE\nline\n', 'latin1');
  fs.writeFileSync(path.join(sourceDir, 'scenario.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(sourceDir, 'Art', 'Units', 'TestUnit', 'TestUnit.ini'), '[Animations]\nDEFAULT=Test.flc\n', 'latin1');

  const parentDir = mkTmpDir();
  const result = createScenario({
    template: 'copy',
    civ3Path: civ3Root,
    sourceScenarioPath: sourceBiq,
    scenarioName: 'Copied Scenario',
    scenarioParentDir: parentDir
  });

  assert.equal(result.ok, true);
  const copiedDir = path.join(parentDir, 'Copied Scenario');
  assert.equal(fs.existsSync(path.join(parentDir, 'Copied Scenario.biq')), true);
  assert.equal(fs.existsSync(path.join(copiedDir, 'Copied Scenario.biq')), false);
  assert.equal(fs.existsSync(path.join(copiedDir, 'Text', 'Civilopedia.txt')), true);
  assert.equal(fs.existsSync(path.join(copiedDir, 'scenario.c3x_config.ini')), true);
  assert.equal(fs.existsSync(path.join(copiedDir, 'Art', 'Units', 'TestUnit', 'TestUnit.ini')), true);
});

test('createScenario can copy a BIQ from shared Scenarios root without copying the whole shared folder', () => {
  const civ3Root = mkTmpDir();
  const scenariosRoot = path.join(civ3Root, 'Conquests', 'Scenarios');
  const sourceContentDir = path.join(scenariosRoot, 'Shared Source');
  fs.mkdirSync(path.join(sourceContentDir, 'Text'), { recursive: true });
  fs.mkdirSync(path.join(scenariosRoot, 'Unrelated Scenario'), { recursive: true });
  const sourceBiq = path.join(scenariosRoot, 'Shared Source.biq');
  fs.writeFileSync(sourceBiq, 'BICX', 'latin1');
  fs.writeFileSync(path.join(sourceContentDir, 'Text', 'Civilopedia.txt'), '#SOURCE\nline\n', 'latin1');
  fs.writeFileSync(path.join(scenariosRoot, 'Unrelated Scenario', 'marker.txt'), 'do not copy\n', 'utf8');

  const parentDir = mkTmpDir();
  const result = createScenario({
    template: 'copy',
    civ3Path: civ3Root,
    sourceScenarioPath: sourceBiq,
    scenarioName: 'Copied Shared Source',
    scenarioParentDir: parentDir
  });

  assert.equal(result.ok, true);
  const copiedDir = path.join(parentDir, 'Copied Shared Source');
  assert.equal(fs.existsSync(path.join(parentDir, 'Copied Shared Source.biq')), true);
  assert.equal(fs.existsSync(path.join(copiedDir, 'Text', 'Civilopedia.txt')), true);
  assert.equal(fs.existsSync(path.join(copiedDir, 'Unrelated Scenario')), false);
});

test('createScenario copy template validates source scenario BIQ path', () => {
  const civ3Root = mkTmpDir();
  const result = createScenario({
    template: 'copy',
    civ3Path: civ3Root,
    sourceScenarioPath: '',
    scenarioName: 'Copy Missing Source',
    scenarioParentDir: mkTmpDir()
  });
  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /source scenario/i);
});

test('createScenario dry run returns audit details without creating files', () => {
  const civ3Root = mkTmpDir();
  const c3xRoot = mkTmpDir();
  seedCiv3Base(civ3Root);
  seedC3xDefaults(c3xRoot);
  const parentDir = path.join(civ3Root, 'Conquests', 'Scenarios');

  const result = createScenario({
    dryRun: true,
    civ3Path: civ3Root,
    c3xPath: c3xRoot,
    scenarioName: 'Dry Run Scenario',
    scenarioParentDir: parentDir
  });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(fs.existsSync(path.join(parentDir, 'Dry Run Scenario')), false);
  assert.equal(path.normalize(result.scenarioDir), path.normalize(path.join(parentDir, 'Dry Run Scenario')));
});
