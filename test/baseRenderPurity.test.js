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
