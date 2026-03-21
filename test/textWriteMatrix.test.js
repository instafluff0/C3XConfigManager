const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  saveBundle,
  parseCivilopediaDocumentWithOrder,
  parsePediaIconsDocumentWithOrder
} = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-text-matrix-'));
}

function docTextByKey(doc, key) {
  const upper = String(key || '').trim().toUpperCase();
  const sec = doc.sections[upper];
  if (!sec || !Array.isArray(sec.rawLines)) return '';
  return sec.rawLines.join('\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function normPediaLines(lines) {
  return (Array.isArray(lines) ? lines : [])
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .map((line) => line.replace(/\\/g, '/'));
}

function setupScenarioTextFiles() {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });

  const civilopediaPath = path.join(textDir, 'Civilopedia.txt');
  const pediaIconsPath = path.join(textDir, 'PediaIcons.txt');

  const civilopedia = [
    '#RACE_TEST_CIV',
    'Original civ overview line.',
    '',
    '#DESC_RACE_TEST_CIV',
    'Original civ description.',
    '',
    '#TECH_TEST_TECH',
    'Original tech overview.',
    '',
    '#DESC_TECH_TEST_TECH',
    'Original tech description.',
    '',
    '#GOOD_TEST_RESOURCE',
    'Original resource overview.',
    '',
    '#DESC_GOOD_TEST_RESOURCE',
    'Original resource description.',
    '',
    '#BLDG_TEST_IMPROVEMENT',
    'Original improvement overview.',
    '',
    '#DESC_BLDG_TEST_IMPROVEMENT',
    'Original improvement description.',
    '',
    '#GOVT_TEST_GOV',
    'Original government overview.',
    '',
    '#DESC_GOVT_TEST_GOV',
    'Original government description.',
    '',
    '#PRTO_TEST_UNIT',
    'Original unit overview.',
    '',
    '#DESC_PRTO_TEST_UNIT',
    'Original unit description.',
    '',
    '#GCON_TEST_CONCEPT',
    'Original concept overview.',
    '',
    '#DESC_GCON_TEST_CONCEPT',
    'Original concept description.',
    '',
    '#TERR_TEST_TERRAIN',
    'Original terrain overview.',
    '',
    '#DESC_TERR_TEST_TERRAIN',
    'Original terrain description.',
    '',
    '#TFRM_TEST_WORK',
    'Original worker action overview.',
    '',
    '#DESC_TFRM_TEST_WORK',
    'Original worker action description.',
    '',
    '#RACE_UNTOUCHED',
    'founded Tenochtitl\u00e1n',
    '',
    '#DESC_RACE_UNTOUCHED',
    'Unchanged long description.',
    ''
  ].join('\n');

  const pediaIcons = [
    '#ICON_RACE_TEST_CIV',
    'art\\civilopedia\\icons\\races\\test-civ-large.pcx',
    'art\\civilopedia\\icons\\races\\test-civ-small.pcx',
    '',
    '#ICON_GOOD_TEST_RESOURCE',
    'art\\civilopedia\\icons\\resources\\resource-large.pcx',
    'art\\civilopedia\\icons\\resources\\resource-small.pcx',
    '',
    '#ICON_BLDG_TEST_IMPROVEMENT',
    'art\\civilopedia\\icons\\buildings\\impr-large.pcx',
    'art\\civilopedia\\icons\\buildings\\impr-small.pcx',
    '',
    '#TECH_TEST_TECH',
    'art\\civilopedia\\icons\\tech chooser\\tech-small.pcx',
    '',
    '#TECH_TEST_TECH_LARGE',
    'art\\civilopedia\\icons\\tech chooser\\tech-large.pcx',
    '',
    '#ANIMNAME_PRTO_TEST_UNIT',
    'TestUnit',
    '',
    '#ICON_RACE_UNTOUCHED',
    'art\\civilopedia\\icons\\races\\untouched-large.pcx',
    'art\\civilopedia\\icons\\races\\untouched-small.pcx',
    ''
  ].join('\n');

  fs.writeFileSync(civilopediaPath, Buffer.from(civilopedia, 'latin1'));
  fs.writeFileSync(pediaIconsPath, Buffer.from(pediaIcons, 'latin1'));

  return { root, scenario, civilopediaPath, pediaIconsPath };
}

function makeEntry(civilopediaKey, overrides = {}) {
  return {
    civilopediaKey,
    overview: `Updated ${civilopediaKey} overview`,
    originalOverview: `Original ${civilopediaKey} overview`,
    description: `Updated ${civilopediaKey} description`,
    originalDescription: `Original ${civilopediaKey} description`,
    iconPaths: [],
    originalIconPaths: [],
    racePaths: [],
    originalRacePaths: [],
    animationName: '',
    originalAnimationName: '',
    biqFields: [],
    ...overrides
  };
}

test('text write matrix: all supported Civilopedia/PediaIcons edit kinds persist and untouched sections remain valid', () => {
  const { root, scenario, civilopediaPath, pediaIconsPath } = setupScenarioTextFiles();

  const tabs = {
    civilizations: {
      title: 'Civs',
      type: 'reference',
      entries: [
        makeEntry('RACE_TEST_CIV', {
          overview: 'Updated civ overview text.',
          originalOverview: 'Original civ overview line.',
          description: 'Updated civ description text.',
          originalDescription: 'Original civ description.',
          iconPaths: [
            'art\\civilopedia\\icons\\races\\new-civ-large.pcx',
            'art\\civilopedia\\icons\\races\\new-civ-small.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\races\\test-civ-large.pcx',
            'art\\civilopedia\\icons\\races\\test-civ-small.pcx'
          ]
        })
      ],
      sourceDetails: {
        civilopediaScenario: civilopediaPath,
        pediaIconsScenarioWrite: pediaIconsPath
      }
    },
    technologies: {
      title: 'Techs',
      type: 'reference',
      entries: [
        makeEntry('TECH_TEST_TECH', {
          overview: 'Updated tech overview text.',
          originalOverview: 'Original tech overview.',
          description: 'Updated tech description text.',
          originalDescription: 'Original tech description.',
          iconPaths: [
            'art\\civilopedia\\icons\\tech chooser\\new-tech-small.pcx',
            'art\\civilopedia\\icons\\tech chooser\\new-tech-large.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\tech chooser\\tech-small.pcx',
            'art\\civilopedia\\icons\\tech chooser\\tech-large.pcx'
          ]
        })
      ]
    },
    resources: {
      title: 'Resources',
      type: 'reference',
      entries: [
        makeEntry('GOOD_TEST_RESOURCE', {
          overview: 'Updated resource overview text.',
          originalOverview: 'Original resource overview.',
          description: 'Updated resource description text.',
          originalDescription: 'Original resource description.',
          iconPaths: [
            'art\\civilopedia\\icons\\resources\\new-resource-large.pcx',
            'art\\civilopedia\\icons\\resources\\new-resource-small.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\resources\\resource-large.pcx',
            'art\\civilopedia\\icons\\resources\\resource-small.pcx'
          ]
        })
      ]
    },
    improvements: {
      title: 'Improvements',
      type: 'reference',
      entries: [
        makeEntry('BLDG_TEST_IMPROVEMENT', {
          overview: 'Updated improvement overview text.',
          originalOverview: 'Original improvement overview.',
          description: 'Updated improvement description text.',
          originalDescription: 'Original improvement description.',
          iconPaths: [
            'art\\civilopedia\\icons\\buildings\\new-impr-large.pcx',
            'art\\civilopedia\\icons\\buildings\\new-impr-small.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\buildings\\impr-large.pcx',
            'art\\civilopedia\\icons\\buildings\\impr-small.pcx'
          ]
        })
      ]
    },
    governments: {
      title: 'Governments',
      type: 'reference',
      entries: [
        makeEntry('GOVT_TEST_GOV', {
          overview: 'Updated government overview text.',
          originalOverview: 'Original government overview.',
          description: 'Updated government description text.',
          originalDescription: 'Original government description.'
        })
      ]
    },
    units: {
      title: 'Units',
      type: 'reference',
      entries: [
        makeEntry('PRTO_TEST_UNIT', {
          overview: 'Updated unit overview text.',
          originalOverview: 'Original unit overview.',
          description: 'Updated unit description text.',
          originalDescription: 'Original unit description.',
          animationName: 'TestUnitNew',
          originalAnimationName: 'TestUnit',
          unitIniEditor: {}
        })
      ]
    },
    gameConcepts: {
      title: 'Game Concepts',
      type: 'reference',
      entries: [
        makeEntry('GCON_TEST_CONCEPT', {
          overview: 'Updated concept overview text.',
          originalOverview: 'Original concept overview.',
          description: 'Updated concept description text.',
          originalDescription: 'Original concept description.'
        })
      ]
    },
    terrainPedia: {
      title: 'Terrain',
      type: 'reference',
      entries: [
        makeEntry('TERR_TEST_TERRAIN', {
          overview: 'Updated terrain overview text.',
          originalOverview: 'Original terrain overview.',
          description: 'Updated terrain description text.',
          originalDescription: 'Original terrain description.'
        })
      ]
    },
    workerActions: {
      title: 'Worker Actions',
      type: 'reference',
      entries: [
        makeEntry('TFRM_TEST_WORK', {
          overview: 'Updated worker overview text.',
          originalOverview: 'Original worker action overview.',
          description: 'Updated worker description text.',
          originalDescription: 'Original worker action description.'
        })
      ]
    }
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));

  const civilopediaSaved = fs.readFileSync(civilopediaPath).toString('latin1');
  const pediaSaved = fs.readFileSync(pediaIconsPath).toString('latin1');
  const civDoc = parseCivilopediaDocumentWithOrder(civilopediaSaved);
  const pediaDoc = parsePediaIconsDocumentWithOrder(pediaSaved);

  assert.match(docTextByKey(civDoc, 'RACE_TEST_CIV'), /Updated civ overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_RACE_TEST_CIV'), /Updated civ description text\./);
  assert.match(docTextByKey(civDoc, 'TECH_TEST_TECH'), /Updated tech overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_TECH_TEST_TECH'), /Updated tech description text\./);
  assert.match(docTextByKey(civDoc, 'GOOD_TEST_RESOURCE'), /Updated resource overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_GOOD_TEST_RESOURCE'), /Updated resource description text\./);
  assert.match(docTextByKey(civDoc, 'BLDG_TEST_IMPROVEMENT'), /Updated improvement overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_BLDG_TEST_IMPROVEMENT'), /Updated improvement description text\./);
  assert.match(docTextByKey(civDoc, 'GOVT_TEST_GOV'), /Updated government overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_GOVT_TEST_GOV'), /Updated government description text\./);
  assert.match(docTextByKey(civDoc, 'PRTO_TEST_UNIT'), /Updated unit overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_PRTO_TEST_UNIT'), /Updated unit description text\./);
  assert.match(docTextByKey(civDoc, 'GCON_TEST_CONCEPT'), /Updated concept overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_GCON_TEST_CONCEPT'), /Updated concept description text\./);
  assert.match(docTextByKey(civDoc, 'TERR_TEST_TERRAIN'), /Updated terrain overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_TERR_TEST_TERRAIN'), /Updated terrain description text\./);
  assert.match(docTextByKey(civDoc, 'TFRM_TEST_WORK'), /Updated worker overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_TFRM_TEST_WORK'), /Updated worker description text\./);

  assert.match(docTextByKey(civDoc, 'RACE_UNTOUCHED'), /founded Tenochtitl\u00e1n/);
  assert.match(docTextByKey(civDoc, 'DESC_RACE_UNTOUCHED'), /Unchanged long description\./);

  assert.deepEqual(normPediaLines(pediaDoc.blocks.TECH_TEST_TECH), ['art/civilopedia/icons/tech chooser/new-tech-small.pcx']);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.TECH_TEST_TECH_LARGE), ['art/civilopedia/icons/tech chooser/new-tech-large.pcx']);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_GOOD_TEST_RESOURCE), [
    'art/civilopedia/icons/resources/new-resource-large.pcx',
    'art/civilopedia/icons/resources/new-resource-small.pcx'
  ]);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_BLDG_TEST_IMPROVEMENT), [
    'art/civilopedia/icons/buildings/new-impr-large.pcx',
    'art/civilopedia/icons/buildings/new-impr-small.pcx'
  ]);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_RACE_TEST_CIV), [
    'art/civilopedia/icons/races/new-civ-large.pcx',
    'art/civilopedia/icons/races/new-civ-small.pcx'
  ]);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ANIMNAME_PRTO_TEST_UNIT), ['TestUnitNew']);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_RACE_UNTOUCHED), [
    'art/civilopedia/icons/races/untouched-large.pcx',
    'art/civilopedia/icons/races/untouched-small.pcx'
  ]);
});

test('large Civilopedia file: single-entry edit keeps all other entries parseable and unchanged', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const civilopediaPath = path.join(textDir, 'Civilopedia.txt');

  const sections = [];
  for (let i = 0; i < 220; i += 1) {
    const key = `GCON_BULK_${i}`;
    sections.push(`#${key}`);
    sections.push(`Overview ${i}`);
    sections.push('');
    sections.push(`#DESC_${key}`);
    sections.push(`Description ${i}`);
    sections.push('');
  }
  fs.writeFileSync(civilopediaPath, Buffer.from(sections.join('\n'), 'latin1'));

  const tabs = {
    civilizations: {
      title: 'Civs',
      type: 'reference',
      entries: [],
      sourceDetails: {
        civilopediaScenario: civilopediaPath
      }
    },
    gameConcepts: {
      title: 'Game Concepts',
      type: 'reference',
      entries: [
        {
          civilopediaKey: 'GCON_BULK_111',
          overview: 'Overview 111 edited',
          originalOverview: 'Overview 111',
          description: 'Description 111 edited',
          originalDescription: 'Description 111',
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
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs
  });
  assert.equal(result.ok, true, String(result.error || 'save failed'));

  const saved = fs.readFileSync(civilopediaPath).toString('latin1');
  const doc = parseCivilopediaDocumentWithOrder(saved);
  assert.equal(doc.order.length, 440);
  assert.equal(docTextByKey(doc, 'GCON_BULK_0'), 'Overview 0');
  assert.equal(docTextByKey(doc, 'DESC_GCON_BULK_0'), 'Description 0');
  assert.equal(docTextByKey(doc, 'GCON_BULK_111'), 'Overview 111 edited');
  assert.equal(docTextByKey(doc, 'DESC_GCON_BULK_111'), 'Description 111 edited');
  assert.equal(docTextByKey(doc, 'GCON_BULK_219'), 'Overview 219');
  assert.equal(docTextByKey(doc, 'DESC_GCON_BULK_219'), 'Description 219');
});
