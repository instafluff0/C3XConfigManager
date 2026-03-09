const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  buildBaseModel,
  parseSectionedConfig,
  serializeSectionedConfig,
  parseBiqSectionsFromBuffer,
  resolveScenarioDir,
  resolvePaths,
  loadBundle,
  saveBundle
} = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-config-manager-'));
}

test('base config precedence is default -> scenario -> custom', () => {
  const defaultText = 'a = 1\nb = 2\n';
  const scenarioText = 'b = 20\nc = 30\n';
  const customText = 'c = 300\n';

  const model = buildBaseModel(defaultText, scenarioText, customText, 'scenario', '');
  assert.equal(model.effectiveMap.a, '1');
  assert.equal(model.effectiveMap.b, '20');
  assert.equal(model.effectiveMap.c, '300');
  assert.deepEqual(model.sourceOrder, ['default', 'scenario', 'custom']);
});

test('sectioned config parsing round-trips marker blocks', () => {
  const text = [
    '; header',
    '#District',
    'name = Encampment',
    'tooltip = Build Encampment',
    '',
    '#District',
    'name = Campus'
  ].join('\n');

  const parsed = parseSectionedConfig(text, '#District');
  assert.equal(parsed.sections.length, 2);
  assert.equal(parsed.sections[0].fields[0].key, 'name');
  assert.equal(parsed.sections[1].fields[0].value, 'Campus');

  const serialized = serializeSectionedConfig(parsed, '#District');
  assert.match(serialized, /#District/);
  assert.match(serialized, /name = Encampment/);
  assert.ok(serialized.endsWith('\n'));
});

test('resolvePaths applies replacement precedence for sectioned configs', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();

  fs.writeFileSync(path.join(root, 'default.districts_config.txt'), '#District\nname = Default\n', 'utf8');
  fs.writeFileSync(path.join(root, 'user.districts_config.txt'), '#District\nname = User\n', 'utf8');
  fs.writeFileSync(path.join(scenario, 'scenario.districts_config.txt'), '#District\nname = Scenario\n', 'utf8');

  const globalPaths = resolvePaths({ c3xPath: root, scenarioPath: scenario, mode: 'global' });
  const scenarioPaths = resolvePaths({ c3xPath: root, scenarioPath: scenario, mode: 'scenario' });

  assert.equal(globalPaths.districts.effectiveSource, 'user');
  assert.equal(scenarioPaths.districts.effectiveSource, 'scenario');
});

test('resolveScenarioDir supports scenarioPath as .biq file', () => {
  assert.equal(resolveScenarioDir('/tmp/MyScenario.biq'), '/tmp');
  assert.equal(resolveScenarioDir('/tmp/scenarios'), '/tmp/scenarios');
});

test('parseBiqSectionsFromBuffer reads basic BIQ section metadata', () => {
  const header = Buffer.alloc(736, 0);
  header.write('BICX', 0, 'latin1');
  header.write('VER#', 4, 'latin1');
  header.writeUInt32LE(1, 8); // num headers
  header.writeUInt32LE(0x2d0, 12); // header len
  header.writeUInt32LE(12, 24); // major
  header.writeUInt32LE(8, 28); // minor
  header.write('Test BIQ', 672, 'latin1');

  const bldg = Buffer.alloc(4 + 4 + 4 + 4, 0);
  bldg.write('BLDG', 0, 'latin1');
  bldg.writeUInt32LE(1, 4); // count
  bldg.writeUInt32LE(4, 8); // record len
  bldg.writeUInt32LE(0x12345678, 12); // record payload

  const zeroSections = ['CTZN', 'CULT', 'DIFF', 'ERAS', 'ESPN', 'EXPR', 'GOOD', 'GOVT', 'RULE', 'PRTO', 'RACE', 'TECH', 'TFRM', 'TERR', 'WSIZ', 'GAME'].map((code) => {
    const sec = Buffer.alloc(8, 0);
    sec.write(code, 0, 'latin1');
    sec.writeUInt32LE(0, 4);
    return sec;
  });

  const buf = Buffer.concat([header, bldg, ...zeroSections]);
  const parsed = parseBiqSectionsFromBuffer(buf);
  assert.equal(parsed.versionTag, 'BICX');
  assert.equal(parsed.sections[0].code, 'BLDG');
  assert.equal(parsed.sections[0].count, 1);
  assert.equal(parsed.sections[parsed.sections.length - 1].code, 'GAME');
});

test('loadBundle + saveBundle writes to scope targets', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();

  fs.writeFileSync(path.join(root, 'default.c3x_config.ini'), 'flag = true\nlimit = 1\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_config.txt'), '#District\nname = Base\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_wonders_config.txt'), '#Wonder\nname = W\nimg_row = 0\nimg_column = 0\nimg_construct_row = 0\nimg_construct_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_natural_wonders_config.txt'), '#Wonder\nname = N\nterrain_type = grassland\nimg_row = 0\nimg_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.tile_animations.txt'), '#Animation\nname = A\nini_path = X\\Y.ini\ntype = terrain\nterrain_types = grassland\n', 'utf8');

  const bundle = loadBundle({ mode: 'global', c3xPath: root, scenarioPath: scenario });
  const flag = bundle.tabs.base.rows.find((r) => r.key === 'flag');
  flag.value = 'false';

  const saveResult = saveBundle({
    mode: 'global',
    c3xPath: root,
    scenarioPath: scenario,
    tabs: bundle.tabs
  });

  assert.equal(saveResult.ok, true);
  const customPath = path.join(root, 'custom.c3x_config.ini');
  assert.equal(fs.existsSync(customPath), true);
  const savedText = fs.readFileSync(customPath, 'utf8');
  assert.match(savedText, /flag = false/);
});
