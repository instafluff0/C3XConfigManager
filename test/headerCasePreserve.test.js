const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { saveBundle } = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-header-case-'));
}

function seedDefaultFiles(root) {
  fs.writeFileSync(path.join(root, 'default.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_config.txt'), '#District\nname = Base\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_wonders_config.txt'), '#Wonder\nname = W\nimg_row = 0\nimg_column = 0\nimg_construct_row = 0\nimg_construct_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.districts_natural_wonders_config.txt'), '#Wonder\nname = N\nterrain_type = grassland\nimg_row = 0\nimg_column = 0\n', 'utf8');
  fs.writeFileSync(path.join(root, 'default.tile_animations.txt'), '#Animation\nname = A\nini_path = X\\Y.ini\ntype = terrain\nterrain_types = grassland\n', 'utf8');
}

test('scenario Civilopedia save preserves source header casing for existing sections', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  seedDefaultFiles(root);
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });

  const civPath = path.join(textDir, 'Civilopedia.txt');
  fs.writeFileSync(civPath, Buffer.from('#GCON_City_Sizes\nOriginal concept text\n\n', 'latin1'));

  const res = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs: {
      concepts: {
        title: 'Concepts',
        type: 'reference',
        entries: [
          {
            civilopediaKey: 'GCON_CITY_SIZES',
            civilopediaSection1: 'Updated concept text',
            originalCivilopediaSection1: 'Original concept text',
            civilopediaSection2: '',
            originalCivilopediaSection2: '',
            iconPaths: [],
            originalIconPaths: [],
            racePaths: [],
            originalRacePaths: [],
            animationName: '',
            originalAnimationName: '',
            biqFields: []
          }
        ]
      }
    }
  });

  assert.equal(res.ok, true, String(res.error || 'save failed'));
  const saved = fs.readFileSync(civPath).toString('latin1');
  assert.match(saved, /^#GCON_City_Sizes$/m);
  assert.doesNotMatch(saved, /^#GCON_CITY_SIZES$/m);
});

test('scenario Civilopedia save preserves trailing header whitespace for existing sections', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  seedDefaultFiles(root);
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });

  const civPath = path.join(textDir, 'Civilopedia.txt');
  fs.writeFileSync(civPath, Buffer.from('#GCON_Territory\t\nOriginal territory text\n\n', 'latin1'));

  const res = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs: {
      gameConcepts: {
        title: 'Game Concepts',
        type: 'reference',
        entries: [
          {
            civilopediaKey: 'GCON_TERRITORY',
            civilopediaSection1: 'Original territory text z',
            originalCivilopediaSection1: 'Original territory text',
            civilopediaSection2: '',
            originalCivilopediaSection2: '',
            iconPaths: [],
            originalIconPaths: [],
            racePaths: [],
            originalRacePaths: [],
            animationName: '',
            originalAnimationName: '',
            biqFields: []
          }
        ]
      }
    }
  });

  assert.equal(res.ok, true, String(res.error || 'save failed'));
  const saved = fs.readFileSync(civPath).toString('latin1');
  assert.match(saved, /^#GCON_Territory\t$/m);
  assert.doesNotMatch(saved, /^#GCON_Territory $/m);
});

test('scenario PediaIcons save preserves source header casing and avoids duplicate canonical blocks', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  seedDefaultFiles(root);
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });

  const civPath = path.join(textDir, 'Civilopedia.txt');
  const pediaPath = path.join(textDir, 'PediaIcons.txt');
  fs.writeFileSync(civPath, Buffer.from('#RACE_TEST_CIV\nOriginal overview\n\n', 'latin1'));
  fs.writeFileSync(pediaPath, Buffer.from(
    '#ICON_RACE_Test_Civ\nart\\civilopedia\\icons\\races\\old-large.pcx\nart\\civilopedia\\icons\\races\\old-small.pcx\n\n',
    'latin1'
  ));

  const res = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs: {
      civilizations: {
        title: 'Civs',
        type: 'reference',
        entries: [
          {
            civilopediaKey: 'RACE_TEST_CIV',
            civilopediaSection1: 'Original overview',
            originalCivilopediaSection1: 'Original overview',
            civilopediaSection2: '',
            originalCivilopediaSection2: '',
            iconPaths: [
              'art\\civilopedia\\icons\\races\\new-large.pcx',
              'art\\civilopedia\\icons\\races\\new-small.pcx'
            ],
            originalIconPaths: [
              'art\\civilopedia\\icons\\races\\old-large.pcx',
              'art\\civilopedia\\icons\\races\\old-small.pcx'
            ],
            racePaths: [],
            originalRacePaths: [],
            animationName: '',
            originalAnimationName: '',
            biqFields: []
          }
        ],
        sourceDetails: {
          civilopediaScenario: civPath,
          pediaIconsScenarioWrite: pediaPath
        }
      }
    }
  });

  assert.equal(res.ok, true, String(res.error || 'save failed'));
  const saved = fs.readFileSync(pediaPath).toString('latin1');
  assert.match(saved, /^#ICON_RACE_Test_Civ$/m);
  assert.doesNotMatch(saved, /^#ICON_RACE_TEST_CIV$/m);
  assert.equal((saved.match(/^#ICON_RACE_/gm) || []).length, 1);
});
