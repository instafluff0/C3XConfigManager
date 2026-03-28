const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReferenceListRows } = require('../src/referenceListModel');

test('unit reference list keeps duplicate civilopedia-key rows in order', () => {
  const filteredEntries = [
    { entry: { name: 'City Builder', civilopediaKey: 'PRTO_SETTLER', biqIndex: 0 }, baseIndex: 0 },
    { entry: { name: 'zz_RESERVED 117', civilopediaKey: 'PRTO_SETTLER', biqIndex: 141 }, baseIndex: 1 },
    { entry: { name: 'zz_RESERVED 312', civilopediaKey: 'PRTO_SETTLER', biqIndex: 790 }, baseIndex: 2 }
  ];

  const rows = buildReferenceListRows({ tabKey: 'units', filteredEntries });

  assert.deepEqual(
    rows.map((row) => `${row.baseIndex}:${row.entry.name}:${row.entry.civilopediaKey}:${row.entry.biqIndex}`),
    [
      '0:City Builder:PRTO_SETTLER:0',
      '1:zz_RESERVED 117:PRTO_SETTLER:141',
      '2:zz_RESERVED 312:PRTO_SETTLER:790'
    ]
  );
});

test('non-unit reference list remains flat and ordered', () => {
  const filteredEntries = [
    { entry: { name: 'Alphabet', civilopediaKey: 'TECH_ALPHABET' }, baseIndex: 0 },
    { entry: { name: 'Bronze Working', civilopediaKey: 'TECH_BRONZE_WORKING' }, baseIndex: 1 }
  ];

  const rows = buildReferenceListRows({ tabKey: 'technologies', filteredEntries });

  assert.deepEqual(
    rows.map((row) => `${row.baseIndex}:${row.entry.name}`),
    ['0:Alphabet', '1:Bronze Working']
  );
});
