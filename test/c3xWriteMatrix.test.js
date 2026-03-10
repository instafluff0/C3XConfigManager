const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  loadBundle,
  saveBundle,
  parseIniLines,
  parseSectionedConfig
} = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-cfg-matrix-'));
}

function writeDefaults(c3xRoot) {
  fs.writeFileSync(path.join(c3xRoot, 'default.c3x_config.ini'), [
    '; default c3x',
    'flag = true',
    'limit = 10',
    'name = BaseName',
    ''
  ].join('\n'), 'utf8');

  fs.writeFileSync(path.join(c3xRoot, 'default.districts_config.txt'), [
    '; header districts',
    '#District',
    'name = Encampment',
    'tooltip = Build Encampment',
    '',
    '#District',
    'name = Campus',
    'tooltip = Build Campus',
    ''
  ].join('\n'), 'utf8');

  fs.writeFileSync(path.join(c3xRoot, 'default.districts_wonders_config.txt'), [
    '; header wonders',
    '#Wonder',
    'name = Great Library',
    'img_row = 0',
    'img_column = 0',
    'img_construct_row = 0',
    'img_construct_column = 0',
    '',
    '#Wonder',
    'name = Hanging Gardens',
    'img_row = 1',
    'img_column = 1',
    'img_construct_row = 1',
    'img_construct_column = 1',
    ''
  ].join('\n'), 'utf8');

  fs.writeFileSync(path.join(c3xRoot, 'default.districts_natural_wonders_config.txt'), [
    '; header natural',
    '#Wonder',
    'name = Mt Fuji',
    'terrain_type = hills',
    'img_row = 0',
    'img_column = 0',
    '',
    '#Wonder',
    'name = Grand Canyon',
    'terrain_type = desert',
    'img_row = 1',
    'img_column = 1',
    ''
  ].join('\n'), 'utf8');

  fs.writeFileSync(path.join(c3xRoot, 'default.tile_animations.txt'), [
    '; header animations',
    '#Animation',
    'name = Forest sway',
    'ini_path = Art\\Terrain\\Forest.ini',
    'type = terrain',
    'terrain_types = forest',
    '',
    '#Animation',
    'name = Volcano smoke',
    'ini_path = Art\\Terrain\\Volcano.ini',
    'type = terrain',
    'terrain_types = volcano',
    ''
  ].join('\n'), 'utf8');
}

function sectionField(section, key) {
  return (section.fields || []).find((f) => String(f.key || '').trim().toLowerCase() === String(key || '').trim().toLowerCase()) || null;
}

function parseSectionFile(filePath, marker) {
  return parseSectionedConfig(fs.readFileSync(filePath, 'utf8'), marker);
}

test('C3X write matrix (global): base + all sectioned files support edit/add/delete and preserve untouched entries', () => {
  const c3xRoot = mkTmpDir();
  writeDefaults(c3xRoot);

  const bundle = loadBundle({ mode: 'global', c3xPath: c3xRoot, scenarioPath: '' });

  const flagRow = bundle.tabs.base.rows.find((r) => r.key === 'flag');
  const limitRow = bundle.tabs.base.rows.find((r) => r.key === 'limit');
  const nameRow = bundle.tabs.base.rows.find((r) => r.key === 'name');
  assert.ok(flagRow && limitRow && nameRow);
  flagRow.value = 'false';
  limitRow.value = '10';
  nameRow.value = 'New Base Name';
  bundle.tabs.base.rows.push({
    key: 'new_option',
    defaultValue: '',
    effectiveValue: '',
    value: '42',
    type: 'integer'
  });

  const mutateSectioned = (tabKey, newSectionName, markerFieldKey = 'name') => {
    const tab = bundle.tabs[tabKey];
    assert.ok(tab && tab.model && Array.isArray(tab.model.sections));

    const first = tab.model.sections[0];
    const second = tab.model.sections[1];
    assert.ok(first && second);

    const primary = sectionField(first, markerFieldKey);
    assert.ok(primary, `missing ${markerFieldKey} in ${tabKey}`);
    primary.value = `${primary.value} (edited)`;

    first.fields.push({ key: 'custom_unknown_field', value: `${tabKey}_custom_value` });

    tab.model.sections.splice(1, 1);

    tab.model.sections.unshift({
      marker: first.marker || (tab.marker || '#Section'),
      fields: [
        { key: markerFieldKey, value: newSectionName },
        { key: 'custom_unknown_field', value: `${tabKey}_new_section` }
      ],
      comments: []
    });
  };

  mutateSectioned('districts', 'Harbor', 'name');
  mutateSectioned('wonders', 'Pyramids', 'name');
  mutateSectioned('naturalWonders', 'Krakatoa', 'name');
  mutateSectioned('animations', 'New animation', 'name');

  const save = saveBundle({
    mode: 'global',
    c3xPath: c3xRoot,
    scenarioPath: '',
    tabs: bundle.tabs
  });
  assert.equal(save.ok, true, String(save.error || 'save failed'));

  const baseSaved = fs.readFileSync(path.join(c3xRoot, 'custom.c3x_config.ini'), 'utf8');
  const baseParsed = parseIniLines(baseSaved);
  assert.equal(baseParsed.map.flag, 'false');
  assert.equal(baseParsed.map.name, 'New Base Name');
  assert.equal(baseParsed.map.new_option, '42');
  assert.equal(Object.prototype.hasOwnProperty.call(baseParsed.map, 'limit'), false);

  const districts = parseSectionFile(path.join(c3xRoot, 'user.districts_config.txt'), '#District');
  const wonders = parseSectionFile(path.join(c3xRoot, 'user.districts_wonders_config.txt'), '#Wonder');
  const natural = parseSectionFile(path.join(c3xRoot, 'user.districts_natural_wonders_config.txt'), '#Wonder');
  const animations = parseSectionFile(path.join(c3xRoot, 'user.tile_animations.txt'), '#Animation');

  const verify = (model, expectedFirstName, tabKey) => {
    assert.ok(model.sections.length >= 2, `${tabKey} expected at least two sections`);
    assert.equal(sectionField(model.sections[0], 'name').value, expectedFirstName);
    assert.equal(sectionField(model.sections[0], 'custom_unknown_field').value, `${tabKey}_new_section`);
    assert.match(String(sectionField(model.sections[1], 'name').value), /\(edited\)$/);
    assert.equal(sectionField(model.sections[1], 'custom_unknown_field').value, `${tabKey}_custom_value`);
  };

  verify(districts, 'Harbor', 'districts');
  verify(wonders, 'Pyramids', 'wonders');
  verify(natural, 'Krakatoa', 'naturalWonders');
  verify(animations, 'New animation', 'animations');
});

test('C3X large sectioned files: single edit preserves all other entries', () => {
  const c3xRoot = mkTmpDir();
  fs.writeFileSync(path.join(c3xRoot, 'default.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(c3xRoot, 'default.districts_wonders_config.txt'), '; bulk wonders\n', 'utf8');
  fs.writeFileSync(path.join(c3xRoot, 'default.districts_natural_wonders_config.txt'), '; bulk natural\n', 'utf8');
  fs.writeFileSync(path.join(c3xRoot, 'default.tile_animations.txt'), '; bulk animations\n', 'utf8');

  const districtsLines = ['; bulk districts'];
  for (let i = 0; i < 260; i += 1) {
    districtsLines.push('#District');
    districtsLines.push(`name = District ${i}`);
    districtsLines.push(`tooltip = Tooltip ${i}`);
    districtsLines.push('');
  }
  fs.writeFileSync(path.join(c3xRoot, 'default.districts_config.txt'), `${districtsLines.join('\n')}\n`, 'utf8');

  const bundle = loadBundle({ mode: 'global', c3xPath: c3xRoot, scenarioPath: '' });
  const sections = bundle.tabs.districts.model.sections;
  assert.equal(sections.length, 260);
  sectionField(sections[137], 'tooltip').value = 'Tooltip 137 edited';

  const result = saveBundle({
    mode: 'global',
    c3xPath: c3xRoot,
    scenarioPath: '',
    tabs: bundle.tabs
  });
  assert.equal(result.ok, true, String(result.error || 'save failed'));

  const saved = parseSectionFile(path.join(c3xRoot, 'user.districts_config.txt'), '#District');
  assert.equal(saved.sections.length, 260);
  assert.equal(sectionField(saved.sections[0], 'name').value, 'District 0');
  assert.equal(sectionField(saved.sections[137], 'tooltip').value, 'Tooltip 137 edited');
  assert.equal(sectionField(saved.sections[259], 'name').value, 'District 259');
});

test('C3X scenario mode writes scenario-scoped files (not global user files)', () => {
  const c3xRoot = mkTmpDir();
  const scenarioDir = mkTmpDir();
  writeDefaults(c3xRoot);

  const bundle = loadBundle({ mode: 'scenario', c3xPath: c3xRoot, scenarioPath: scenarioDir });
  const flagRow = bundle.tabs.base.rows.find((r) => r.key === 'flag');
  assert.ok(flagRow);
  flagRow.value = 'false';

  const distFirst = bundle.tabs.districts.model.sections[0];
  sectionField(distFirst, 'name').value = 'Scenario Encampment';

  const saved = saveBundle({
    mode: 'scenario',
    c3xPath: c3xRoot,
    scenarioPath: scenarioDir,
    tabs: bundle.tabs
  });
  assert.equal(saved.ok, true, String(saved.error || 'save failed'));

  assert.equal(fs.existsSync(path.join(c3xRoot, 'custom.c3x_config.ini')), false);
  assert.equal(fs.existsSync(path.join(c3xRoot, 'user.districts_config.txt')), false);

  assert.equal(fs.existsSync(path.join(scenarioDir, 'scenario.c3x_config.ini')), true);
  assert.equal(fs.existsSync(path.join(scenarioDir, 'scenario.districts_config.txt')), true);

  const scenarioBase = parseIniLines(fs.readFileSync(path.join(scenarioDir, 'scenario.c3x_config.ini'), 'utf8'));
  assert.equal(scenarioBase.map.flag, 'false');
  const scenarioDistricts = parseSectionFile(path.join(scenarioDir, 'scenario.districts_config.txt'), '#District');
  assert.equal(sectionField(scenarioDistricts.sections[0], 'name').value, 'Scenario Encampment');
});

test('C3X-only transaction rollback restores earlier files when later commit fails', () => {
  const c3xRoot = mkTmpDir();
  writeDefaults(c3xRoot);

  const originalBasePath = path.join(c3xRoot, 'custom.c3x_config.ini');
  const originalDistrictsPath = path.join(c3xRoot, 'user.districts_config.txt');
  fs.writeFileSync(originalBasePath, 'flag = true\n', 'utf8');
  fs.writeFileSync(originalDistrictsPath, '#District\nname = Original District\n', 'utf8');
  const beforeBase = fs.readFileSync(originalBasePath, 'utf8');
  const beforeDistricts = fs.readFileSync(originalDistrictsPath, 'utf8');

  const bundle = loadBundle({ mode: 'global', c3xPath: c3xRoot, scenarioPath: '' });
  bundle.tabs.base.rows.find((r) => r.key === 'flag').value = 'false';
  sectionField(bundle.tabs.districts.model.sections[0], 'name').value = 'Rollback Test District';

  const origRename = fs.renameSync;
  let injected = false;
  fs.renameSync = function patchedRename(from, to) {
    if (!injected && String(to || '').includes('user.districts_config.txt')) {
      injected = true;
      throw new Error('Injected rename failure');
    }
    return origRename.call(this, from, to);
  };

  try {
    const result = saveBundle({
      mode: 'global',
      c3xPath: c3xRoot,
      scenarioPath: '',
      tabs: bundle.tabs
    });
    assert.equal(result.ok, false);
    assert.match(String(result.error || ''), /rolled back/i);
  } finally {
    fs.renameSync = origRename;
  }

  assert.equal(fs.readFileSync(originalBasePath, 'utf8'), beforeBase);
  assert.equal(fs.readFileSync(originalDistrictsPath, 'utf8'), beforeDistricts);
});

