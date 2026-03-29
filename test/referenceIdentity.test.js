const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getReferenceEntryIdentity,
  findCleanReferenceEntry
} = require('../src/referenceIdentity');

test('unit identities use biqIndex so duplicate civilopedia keys stay distinct', () => {
  const primary = { name: 'City Builder', civilopediaKey: 'PRTO_SETTLER', biqIndex: 0 };
  const reserved = { name: 'zz_RESERVED 117', civilopediaKey: 'PRTO_SETTLER', biqIndex: 141 };

  assert.equal(getReferenceEntryIdentity('units', primary, 0), 'biq:0');
  assert.equal(getReferenceEntryIdentity('units', reserved, 1), 'biq:141');
});

test('clean lookup matches duplicate-key units by biqIndex instead of civilopedia key', () => {
  const cleanEntries = [
    { name: 'City Builder', civilopediaKey: 'PRTO_SETTLER', biqIndex: 0 },
    { name: 'zz_RESERVED 117', civilopediaKey: 'PRTO_SETTLER', biqIndex: 141 }
  ];
  const currentReserved = { name: 'zz_RESERVED 117', civilopediaKey: 'PRTO_SETTLER', biqIndex: 141 };

  const matched = findCleanReferenceEntry(cleanEntries, 'units', currentReserved, 1);

  assert.equal(matched, cleanEntries[1]);
});

test('unit identities use stable id for synthetic era variants without biqIndex', () => {
  const cleanEntries = [
    { id: 'biq-prto-0', name: 'Settler', civilopediaKey: 'PRTO_SETTLER', biqIndex: 0 },
    { id: 'PRTO_SETTLER_ERAS_INDUSTRIAL_AGE', name: 'Settler Eras Industrial Age', civilopediaKey: 'PRTO_SETTLER_ERAS_INDUSTRIAL_AGE', biqIndex: null },
    { id: 'PRTO_SETTLER_ERAS_MODERN_ERA', name: 'Settler Eras Modern Era', civilopediaKey: 'PRTO_SETTLER_ERAS_MODERN_ERA', biqIndex: null }
  ];
  const shiftedCurrent = { id: 'PRTO_SETTLER_ERAS_INDUSTRIAL_AGE', name: 'Settler Eras Industrial Age', civilopediaKey: 'PRTO_SETTLER_ERAS_INDUSTRIAL_AGE', biqIndex: null };

  const matched = findCleanReferenceEntry(cleanEntries, 'units', shiftedCurrent, 2);

  assert.equal(getReferenceEntryIdentity('units', shiftedCurrent, 2), 'id:PRTO_SETTLER_ERAS_INDUSTRIAL_AGE');
  assert.equal(matched, cleanEntries[1]);
});

test('non-unit identities still use civilopedia key', () => {
  const tech = { name: 'Alphabet', civilopediaKey: 'TECH_ALPHABET' };
  assert.equal(getReferenceEntryIdentity('technologies', tech, 0), 'key:TECH_ALPHABET');
});
