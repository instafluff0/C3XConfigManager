const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { saveBundle } = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-diplomacy-write-'));
}

function writeDiplomacy(filePath) {
  const content = [
    '; test fixture',
    '#AIFIRSTCONTACT',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"Contact 0 old"',
    '"Contact 1 old"',
    '',
    '#AIFIRSTDEAL',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"Deal 0 old"',
    '"Deal 1 old"',
    '',
    '#AIDEMANDTRIBUTE',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 3',
    '"Unrelated text kept."',
    ''
  ].join('\n');
  fs.writeFileSync(filePath, Buffer.from(content, 'latin1'));
}

function normalize(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

test('saveBundle writes scenario diplomacy slot edits and preserves unrelated sections', () => {
  const civ3 = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const diplomacyPath = path.join(textDir, 'diplomacy.txt');
  writeDiplomacy(diplomacyPath);

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: civ3,
    civ3Path: civ3,
    scenarioPath: scenario,
    tabs: {
      civilizations: {
        title: 'Civilizations',
        type: 'reference',
        entries: [],
        diplomacySlots: [
          {
            index: 0,
            firstContact: 'Contact 0 new',
            originalFirstContact: 'Contact 0 old',
            firstDeal: 'Deal 0 new',
            originalFirstDeal: 'Deal 0 old'
          },
          {
            index: 1,
            firstContact: 'Contact 1 old',
            originalFirstContact: 'Contact 1 old',
            firstDeal: 'Deal 1 old',
            originalFirstDeal: 'Deal 1 old'
          }
        ],
        sourceDetails: {
          diplomacyScenarioWrite: diplomacyPath
        }
      }
    }
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  const saved = fs.readFileSync(diplomacyPath).toString('latin1');
  assert.match(saved, /"Contact 0 new"/);
  assert.match(saved, /"Deal 0 new"/);
  assert.match(saved, /"Unrelated text kept\."/);
  assert.match(saved, /#AIDEMANDTRIBUTE/);
});

test('saveBundle writes full diplomacy text when raw diplomacy editor content changes', () => {
  const civ3 = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const diplomacyPath = path.join(textDir, 'diplomacy.txt');
  writeDiplomacy(diplomacyPath);

  const replacement = [
    '; rewritten by test',
    '#AIFIRSTCONTACT',
    '#CIV 2',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"Different selector and lines."',
    '',
    '#AIGREET',
    '#CIV 1',
    '#POWER 1',
    '#MOOD 2',
    '#RANDOM 1',
    '"New section content."',
    ''
  ].join('\n');

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: civ3,
    civ3Path: civ3,
    scenarioPath: scenario,
    tabs: {
      civilizations: {
        title: 'Civilizations',
        type: 'reference',
        entries: [],
        diplomacyText: replacement,
        originalDiplomacyText: fs.readFileSync(diplomacyPath, 'latin1'),
        diplomacySlots: [],
        sourceDetails: {
          diplomacyScenarioWrite: diplomacyPath
        }
      }
    }
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  const saved = fs.readFileSync(diplomacyPath).toString('latin1');
  assert.equal(saved.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), replacement.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
  assert.match(saved, /#AIGREET/);
});

test('saveBundle no-ops diplomacy writes when slot values are unchanged', () => {
  const civ3 = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const diplomacyPath = path.join(textDir, 'diplomacy.txt');
  writeDiplomacy(diplomacyPath);
  const before = fs.readFileSync(diplomacyPath, 'latin1');

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: civ3,
    civ3Path: civ3,
    scenarioPath: scenario,
    tabs: {
      civilizations: {
        title: 'Civilizations',
        type: 'reference',
        entries: [],
        diplomacySlots: [
          {
            index: 0,
            firstContact: 'Contact 0 old',
            originalFirstContact: 'Contact 0 old',
            firstDeal: 'Deal 0 old',
            originalFirstDeal: 'Deal 0 old'
          },
          {
            index: 1,
            firstContact: 'Contact 1 old',
            originalFirstContact: 'Contact 1 old',
            firstDeal: 'Deal 1 old',
            originalFirstDeal: 'Deal 1 old'
          }
        ],
        sourceDetails: {
          diplomacyScenarioWrite: diplomacyPath
        }
      }
    }
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  assert.equal((result.saveReport || []).some((r) => String(r.kind) === 'diplomacy'), false);
  const after = fs.readFileSync(diplomacyPath, 'latin1');
  assert.equal(normalize(after), normalize(before));
});

test('saveBundle slot edit is surgical: only matching selector lines change and siblings remain untouched', () => {
  const civ3 = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const diplomacyPath = path.join(textDir, 'diplomacy.txt');
  const source = [
    '; surgical fixture',
    '#AIFIRSTCONTACT',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"slot 0 contact old"',
    '#CIV 1',
    '#POWER 2',
    '#MOOD 1',
    '#RANDOM 1',
    '"DO NOT TOUCH CONTACT"',
    '',
    '#AIFIRSTDEAL',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"slot 0 deal old"',
    '#CIV 1',
    '#POWER 2',
    '#MOOD 1',
    '#RANDOM 1',
    '"DO NOT TOUCH DEAL"',
    '',
    '#AIDEMANDTRIBUTE',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 3',
    '"DO NOT TOUCH TRIBUTE"',
    ''
  ].join('\n');
  fs.writeFileSync(diplomacyPath, Buffer.from(source, 'latin1'));

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: civ3,
    civ3Path: civ3,
    scenarioPath: scenario,
    tabs: {
      civilizations: {
        title: 'Civilizations',
        type: 'reference',
        entries: [],
        diplomacySlots: [
          {
            index: 0,
            firstContact: 'slot 0 contact new',
            originalFirstContact: 'slot 0 contact old',
            firstDeal: 'slot 0 deal new',
            originalFirstDeal: 'slot 0 deal old'
          }
        ],
        sourceDetails: {
          diplomacyScenarioWrite: diplomacyPath
        }
      }
    }
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  const saved = fs.readFileSync(diplomacyPath, 'latin1');
  assert.match(saved, /"slot 0 contact new"/);
  assert.match(saved, /"slot 0 deal new"/);
  assert.match(saved, /"DO NOT TOUCH CONTACT"/);
  assert.match(saved, /"DO NOT TOUCH DEAL"/);
  assert.match(saved, /"DO NOT TOUCH TRIBUTE"/);
});

test('saveBundle diplomacy slot edit preserves section header casing and trailing spaces', () => {
  const civ3 = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const diplomacyPath = path.join(textDir, 'diplomacy.txt');
  const source = [
    '; header formatting fixture',
    '#AiFirstContact   ',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"hello old"',
    '',
    '#aifirstdeal\t',
    '#CIV 1',
    '#POWER 0',
    '#MOOD 0',
    '#RANDOM 1',
    '"deal old"',
    ''
  ].join('\n');
  fs.writeFileSync(diplomacyPath, Buffer.from(source, 'latin1'));

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: civ3,
    civ3Path: civ3,
    scenarioPath: scenario,
    tabs: {
      civilizations: {
        title: 'Civilizations',
        type: 'reference',
        entries: [],
        diplomacySlots: [
          {
            index: 0,
            firstContact: 'hello new',
            originalFirstContact: 'hello old',
            firstDeal: 'deal new',
            originalFirstDeal: 'deal old'
          }
        ],
        sourceDetails: {
          diplomacyScenarioWrite: diplomacyPath
        }
      }
    }
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  const saved = fs.readFileSync(diplomacyPath, 'latin1');
  assert.match(saved, /^\#AiFirstContact   $/m);
  assert.match(saved, /^\#aifirstdeal\t$/m);
  assert.match(saved, /"hello new"/);
  assert.match(saved, /"deal new"/);
});
