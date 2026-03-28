const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('base field renderers do not mutate rows during initial render', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.doesNotMatch(
    text,
    /rerender\(\);\s*recalc\(\);\s*return wrap;/,
    'limit_units_per_tile renderer should not call recalc during initial render'
  );

  assert.doesNotMatch(
    text,
    /onChange\(serializeBuildingPrereqItems\(items\)\);\s*rerender\(\);\s*return wrap;/,
    'building_prereqs_for_units renderer should not normalize row.value during initial render'
  );

  assert.doesNotMatch(
    text,
    /onChange\(serializeBuildingResourceItems\(items\)\);\s*rerender\(\);\s*return wrap;/,
    'buildings_generating_resources renderer should not normalize row.value during initial render'
  );
});

test('tech era dropdown uses BIQ era names when available', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /makeBiqSectionIndexOptions\('ERAS', false\)/,
    'Tech reference resolver should read era labels from the ERAS section'
  );

  assert.match(
    text,
    /if \(eraOptions\.length > 0\) return eraOptions;/,
    'Tech reference resolver should prefer BIQ era labels before falling back'
  );
});

test('civilization playable toggle is read-only for barbarians', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /function isBarbarianCivilizationEntry\(entry\)/,
    'Renderer should expose a barbarian-civilization guard for the Civs playable toggle'
  );

  assert.match(
    text,
    /if \(isBarbarianCivilizationEntry\(entry\)\) return false;/,
    'Playable state writes should refuse barbarian civilization entries'
  );

  assert.match(
    text,
    /const playableReadonly = !referenceEditable \|\| isBarbarianCivilizationEntry\(entry\);/,
    'Playable checkbox should render read-only for barbarian civilization entries'
  );
});
