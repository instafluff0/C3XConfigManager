const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  parseCivilopediaDocumentWithOrder,
  serializeCivilopediaDocumentWithOrder,
  parsePediaIconsDocumentWithOrder,
  serializePediaIconsDocumentWithOrder,
  parseDiplomacyDocumentWithOrder,
  serializeDiplomacyDocumentWithOrder,
  parseDiplomacySlotOptions,
  parseSectionedConfig,
  serializeSectionedConfig,
  saveBundle
} = require('../src/configCore');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
const mkTmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-fixture-'));

test('Civilopedia fixture parse/serialize is idempotent', () => {
  const input = fixture('civilopedia_sample.txt');
  const normalizeDoc = (doc) => {
    const order = Array.isArray(doc && doc.order) ? doc.order : [];
    const sections = (doc && doc.sections) || {};
    return order.map((key) => {
      const rawLines = (sections[key] && Array.isArray(sections[key].rawLines)) ? sections[key].rawLines : [];
      const normalizedText = rawLines
        .join('\n')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return { key, normalizedText };
    });
  };

  const doc1 = parseCivilopediaDocumentWithOrder(input);
  const out1 = serializeCivilopediaDocumentWithOrder(doc1);
  const doc2 = parseCivilopediaDocumentWithOrder(out1);
  const out2 = serializeCivilopediaDocumentWithOrder(doc2);
  const doc3 = parseCivilopediaDocumentWithOrder(out2);

  assert.deepEqual(normalizeDoc(doc2), normalizeDoc(doc3));
  assert.match(out2, /#RACE_TEST/);
  assert.match(out2, /#DESC_RACE_TEST/);
  assert.match(out2, /Cité Alpha/);
});

test('PediaIcons fixture parse/serialize is idempotent and keeps key blocks', () => {
  const input = fixture('pediaicons_sample.txt');
  const doc1 = parsePediaIconsDocumentWithOrder(input);
  const out1 = serializePediaIconsDocumentWithOrder(doc1);
  const doc2 = parsePediaIconsDocumentWithOrder(out1);
  const out2 = serializePediaIconsDocumentWithOrder(doc2);

  assert.equal(out1, out2);
  assert.match(out1, /#ICON_RACE_TEST/);
  assert.match(out1, /#ANIMNAME_PRTO_TEST_UNIT/);
  assert.match(out1, /#TECH_TEST_TECH_LARGE/);
});

test('Diplomacy fixture produces slot options with combined previews', () => {
  const input = fixture('diplomacy_sample.txt');
  const options = parseDiplomacySlotOptions(input);
  assert.equal(options.length, 3);
  assert.equal(options[0].value, '0');
  assert.match(options[0].label, /^Slot 0 - First contact:/);
  assert.match(options[0].label, /Trade intro:/);
});

test('Diplomacy fixture parse/serialize is idempotent', () => {
  const input = fixture('diplomacy_sample.txt');
  const doc1 = parseDiplomacyDocumentWithOrder(input);
  const out1 = serializeDiplomacyDocumentWithOrder(doc1);
  const doc2 = parseDiplomacyDocumentWithOrder(out1);
  const out2 = serializeDiplomacyDocumentWithOrder(doc2);

  assert.equal(out1, out2);
  assert.match(out1, /#AIFIRSTCONTACT/);
  assert.match(out1, /#AIFIRSTDEAL/);
  assert.match(out1, /\$CIVNAME1/);
});

test('Diplomacy parse/serialize preserves section header formatting for surgical round-trips', () => {
  const input = [
    '; header shape fixture',
    '#AiFirstContact   ',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"Hello."',
    '',
    '#aifirstdeal\t',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"Deal."',
    ''
  ].join('\n');
  const doc = parseDiplomacyDocumentWithOrder(input);
  const out = serializeDiplomacyDocumentWithOrder(doc);
  assert.match(out, /^\#AiFirstContact   $/m);
  assert.match(out, /^\#aifirstdeal\t$/m);
});

test('Sectioned fixture parse/serialize is idempotent', () => {
  const input = fixture('districts_sample.txt');
  const model1 = parseSectionedConfig(input, '#District');
  const out1 = serializeSectionedConfig(model1, '#District');
  const model2 = parseSectionedConfig(out1, '#District');
  const out2 = serializeSectionedConfig(model2, '#District');

  assert.equal(out1, out2);
  assert.match(out1, /name = Encampment/);
  assert.match(out1, /name = Campus/);
});

test('saveBundle refuses writing protected base Civ3 files', () => {
  const root = mkTmpDir();
  const c3x = mkTmpDir();
  const conquestsTextDir = path.join(root, 'Conquests', 'Text');
  fs.mkdirSync(conquestsTextDir, { recursive: true });

  fs.writeFileSync(path.join(c3x, 'default.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_config.txt'), '#District\nname = Base\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_wonders_config.txt'), '#Wonder\nname = W\nimg_row = 0\nimg_column = 0\nimg_construct_row = 0\nimg_construct_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_natural_wonders_config.txt'), '#Wonder\nname = N\nterrain_type = grassland\nimg_row = 0\nimg_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.tile_animations.txt'), '#Animation\nname = A\nini_path = X\\Y.ini\ntype = terrain\nterrain_types = grassland\n', 'utf8');

  const protectedCivilopedia = path.join(conquestsTextDir, 'Civilopedia.txt');
  fs.writeFileSync(protectedCivilopedia, '#RACE_TEST\nLegacy\n', 'utf8');

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: root,
    scenarioPath: path.join(root, 'Conquests', 'conquests.biq'),
    tabs: {
      civilizations: {
        title: 'Civs',
        type: 'reference',
        entries: [
          {
            civilopediaKey: 'RACE_TEST',
            overview: 'Changed',
            originalOverview: 'Legacy',
            description: '',
            originalDescription: '',
            iconPaths: [],
            originalIconPaths: [],
            racePaths: [],
            originalRacePaths: [],
            animationName: '',
            originalAnimationName: '',
            biqFields: []
          }
        ],
        sourceDetails: {
          civilopediaScenario: protectedCivilopedia
        }
      }
    }
  });

  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /Refusing to modify base Civilization III file/i);
});

test('saveBundle refuses writing outside scenario write roots', () => {
  const root = mkTmpDir();
  const c3x = mkTmpDir();
  const scenarioDir = path.join(root, 'Conquests', 'Scenarios', 'Isolated');
  const otherScenarioDir = path.join(root, 'Conquests', 'Scenarios', 'Other');
  fs.mkdirSync(path.join(scenarioDir, 'Text'), { recursive: true });
  fs.mkdirSync(path.join(otherScenarioDir, 'Text'), { recursive: true });

  fs.writeFileSync(path.join(c3x, 'default.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_config.txt'), '#District\nname = Base\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_wonders_config.txt'), '#Wonder\nname = W\nimg_row = 0\nimg_column = 0\nimg_construct_row = 0\nimg_construct_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.districts_natural_wonders_config.txt'), '#Wonder\nname = N\nterrain_type = grassland\nimg_row = 0\nimg_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(c3x, 'default.tile_animations.txt'), '#Animation\nname = A\nini_path = X\\Y.ini\ntype = terrain\nterrain_types = grassland\n', 'utf8');

  const scenarioBiq = path.join(scenarioDir, 'Isolated.biq');
  fs.writeFileSync(scenarioBiq, 'BICX', 'latin1');

  const outsideCivilopedia = path.join(otherScenarioDir, 'Text', 'Civilopedia.txt');
  fs.writeFileSync(outsideCivilopedia, '#RACE_TEST\nLegacy\n', 'utf8');

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: c3x,
    civ3Path: root,
    scenarioPath: scenarioBiq,
    tabs: {
      civilizations: {
        title: 'Civs',
        type: 'reference',
        entries: [
          {
            civilopediaKey: 'RACE_TEST',
            overview: 'Changed',
            originalOverview: 'Legacy',
            description: '',
            originalDescription: '',
            iconPaths: [],
            originalIconPaths: [],
            racePaths: [],
            originalRacePaths: [],
            animationName: '',
            originalAnimationName: '',
            biqFields: []
          }
        ],
        sourceDetails: {
          civilopediaScenario: outsideCivilopedia
        }
      }
    }
  });

  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /outside scenario write roots/i);
});
