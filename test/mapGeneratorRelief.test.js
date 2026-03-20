'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const mapGeneratorCore = require('../src/mapGeneratorCore');

function makeSpec(overrides) {
  return {
    width: 100,
    height: 100,
    xWrapping: true,
    yWrapping: false,
    polarIceCaps: true,
    selectedLandform: 1,
    selectedTemperature: 1,
    selectedClimate: 1,
    selectedAge: 1,
    selectedBarbarian: 1,
    selectedOcean: 1,
    mapSeed: 1,
    numCivs: 8,
    distanceBetweenCivs: 12,
    ...overrides
  };
}

function summarizeRelief(world) {
  let hills = 0;
  let mountains = 0;
  let volcanos = 0;
  let snowCappedMountains = 0;
  let misplaced = 0;
  for (const tile of world.tiles) {
    if (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.HILLS) hills += 1;
    if (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.MOUNTAIN) mountains += 1;
    if (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.VOLCANO) volcanos += 1;
    if ((tile.c3cBonuses & mapGeneratorCore.BIQ_TILE_BONUS.SNOW_CAPPED_MOUNTAIN) === mapGeneratorCore.BIQ_TILE_BONUS.SNOW_CAPPED_MOUNTAIN) {
      snowCappedMountains += 1;
    }
    if (
      (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.HILLS ||
       tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.MOUNTAIN ||
       tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.VOLCANO) &&
      tile.baseTerrain !== mapGeneratorCore.BIQ_TERRAIN.GRASSLAND
    ) {
      misplaced += 1;
    }
  }
  return { hills, mountains, volcanos, snowCappedMountains, misplaced };
}

test('hills, mountains, and volcanos only appear on grassland bases', () => {
  const seeds = [1, 7, 17, 29, 101];
  for (const seed of seeds) {
    const world = mapGeneratorCore.generate(makeSpec({ mapSeed: seed, selectedLandform: 1 }));
    const summary = summarizeRelief(world);
    assert.equal(summary.misplaced, 0, `seed ${seed} produced non-grassland relief tiles`);
    assert.ok(summary.hills > 20, `seed ${seed} produced too few hills: ${summary.hills}`);
    assert.ok(summary.mountains > 40, `seed ${seed} produced too few mountains: ${summary.mountains}`);
  }
});

test('world age changes relief density in the expected direction', () => {
  const youngWorld = summarizeRelief(mapGeneratorCore.generate(makeSpec({ selectedAge: 0 })));
  const normalWorld = summarizeRelief(mapGeneratorCore.generate(makeSpec({ selectedAge: 1 })));
  const oldWorld = summarizeRelief(mapGeneratorCore.generate(makeSpec({ selectedAge: 2 })));
  assert.ok(
    (youngWorld.hills + youngWorld.mountains + youngWorld.volcanos) >
    (normalWorld.hills + normalWorld.mountains + normalWorld.volcanos),
    'young worlds should be rougher than normal worlds'
  );
  assert.ok(
    (normalWorld.hills + normalWorld.mountains + normalWorld.volcanos) >
    (oldWorld.hills + oldWorld.mountains + oldWorld.volcanos),
    'normal worlds should be rougher than old worlds'
  );
});

test('polar-cap maps produce visible snow-capped mountain ranges on cold latitudes', () => {
  const seeds = [1, 7, 17, 29, 101];
  let totalSnowCaps = 0;
  for (const seed of seeds) {
    const summary = summarizeRelief(mapGeneratorCore.generate(makeSpec({
      mapSeed: seed,
      selectedLandform: 1,
      polarIceCaps: true
    })));
    totalSnowCaps += summary.snowCappedMountains;
  }
  assert.ok(totalSnowCaps >= 20, `expected visible snow-capped mountains across regression seeds, saw ${totalSnowCaps}`);
});
