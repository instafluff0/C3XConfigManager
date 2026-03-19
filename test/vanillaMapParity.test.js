const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { decompress } = require('../src/biq/decompress');
const { parseAllSections } = require('../src/biq/biqSections');
const {
  VANILLA_SEED_1_SPEC,
  resolveVanillaSeed1FixturePath,
  loadVanillaSeed1FixtureMap
} = require('../src/vanillaMapParity');

function getSection(parsed, code) {
  return (parsed.sections || []).find((section) => String(section.code || '').toUpperCase() === String(code || '').toUpperCase()) || null;
}

test('vanilla seed 1 fixture loader reproduces exact map payload', (t) => {
  const fixturePath = resolveVanillaSeed1FixturePath();
  if (!fixturePath) {
    t.skip('vanilla_seed_1.biq fixture not found');
    return;
  }

  const inflated = decompress(fs.readFileSync(fixturePath));
  assert.equal(inflated.ok, true, String(inflated.error || 'failed to decompress vanilla_seed_1.biq'));
  const parsed = parseAllSections(inflated.data);
  assert.equal(parsed.ok, true, String(parsed.error || 'failed to parse vanilla_seed_1.biq'));

  const fixtureWorld = loadVanillaSeed1FixtureMap(VANILLA_SEED_1_SPEC);
  assert.ok(fixtureWorld, 'expected fixture world to load');

  const wchr = getSection(parsed, 'WCHR');
  const wmap = getSection(parsed, 'WMAP');
  const tile = getSection(parsed, 'TILE');
  const cont = getSection(parsed, 'CONT');
  const sloc = getSection(parsed, 'SLOC');
  assert.ok(wchr && wmap && tile && cont && sloc, 'expected vanilla fixture map sections');

  assert.equal(fixtureWorld.width, wmap.records[0].width);
  assert.equal(fixtureWorld.height, wmap.records[0].height);
  assert.equal(fixtureWorld.tileCount, tile.records.length);
  assert.equal(fixtureWorld.mapSeed, wmap.records[0].mapSeed);
  assert.deepEqual(fixtureWorld.resourceOccurrences, wmap.records[0].resourceOccurrences);
  assert.equal(fixtureWorld.actuals.selectedLandform, wchr.records[0].selectedLandform);
  assert.equal(fixtureWorld.actuals.actualLandform, wchr.records[0].actualLandform);
  assert.equal(fixtureWorld.actuals.selectedTemperature, wchr.records[0].selectedTemp);
  assert.equal(fixtureWorld.actuals.actualTemperature, wchr.records[0].actualTemp);
  assert.equal(fixtureWorld.actuals.selectedClimate, wchr.records[0].selectedClimate);
  assert.equal(fixtureWorld.actuals.actualClimate, wchr.records[0].actualClimate);
  assert.equal(fixtureWorld.actuals.selectedAge, wchr.records[0].selectedAge);
  assert.equal(fixtureWorld.actuals.actualAge, wchr.records[0].actualAge);
  assert.equal(fixtureWorld.actuals.selectedOcean, wchr.records[0].selectedOcean);
  assert.equal(fixtureWorld.actuals.actualOcean, wchr.records[0].actualOcean);
  assert.equal(fixtureWorld.actuals.selectedBarbarian, wchr.records[0].selectedBarbarian);
  assert.equal(fixtureWorld.actuals.actualBarbarian, wchr.records[0].actualBarbarian);

  assert.equal(fixtureWorld.tiles.length, tile.records.length);
  for (let i = 0; i < tile.records.length; i += 1) {
    const expected = tile.records[i];
    const actual = fixtureWorld.tiles[i];
    assert.equal(actual.index, expected.index, `tile ${i}: index`);
    assert.equal(actual.xPos, expected.xpos, `tile ${i}: xPos`);
    assert.equal(actual.yPos, expected.ypos, `tile ${i}: yPos`);
    assert.equal(actual.continent, expected.continent, `tile ${i}: continent`);
    assert.equal(actual.riverConnectionInfo >>> 0, expected.riverConnectionInfo >>> 0, `tile ${i}: riverConnectionInfo`);
    assert.equal(actual.c3cOverlays >>> 0, expected.c3cOverlays >>> 0, `tile ${i}: c3cOverlays`);
    assert.equal(actual.c3cBonuses >>> 0, expected.c3cBonuses >>> 0, `tile ${i}: c3cBonuses`);
    assert.equal(actual.file, expected.file, `tile ${i}: file`);
    assert.equal(actual.image, expected.image, `tile ${i}: image`);
    assert.equal(actual.packedTerrain, expected.c3cBaseRealTerrain, `tile ${i}: packedTerrain`);
    assert.equal(actual.baseTerrain, expected.c3cBaseRealTerrain & 0x0f, `tile ${i}: baseTerrain`);
    assert.equal(actual.realTerrain, (expected.c3cBaseRealTerrain >>> 4) & 0x0f, `tile ${i}: realTerrain`);
    assert.equal(actual.fogOfWar, expected.fogOfWar, `tile ${i}: fogOfWar`);
  }

  assert.deepEqual(
    fixtureWorld.continents,
    cont.records.map((record) => ({
      continentClass: record.continentClass,
      numTiles: record.numTiles
    }))
  );
  assert.deepEqual(
    fixtureWorld.startingLocations,
    sloc.records.map((record) => ({
      ownerType: record.ownerType,
      owner: record.owner,
      x: record.x,
      y: record.y
    }))
  );
});
