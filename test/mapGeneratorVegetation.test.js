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

function summarizeVegetation(world) {
  let forest = 0;
  let jungle = 0;
  let marsh = 0;
  let pineForest = 0;
  let invalidForest = 0;
  for (const tile of world.tiles) {
    if (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.FOREST) {
      forest += 1;
      if ((tile.c3cBonuses & mapGeneratorCore.BIQ_TILE_BONUS.PINE_FOREST) !== 0) pineForest += 1;
      if (
        tile.baseTerrain === mapGeneratorCore.BIQ_TERRAIN.DESERT ||
        tile.baseTerrain === mapGeneratorCore.BIQ_TERRAIN.JUNGLE ||
        tile.baseTerrain === mapGeneratorCore.BIQ_TERRAIN.MARSH
      ) {
        invalidForest += 1;
      }
    } else if (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.JUNGLE) {
      jungle += 1;
    } else if (tile.realTerrain === mapGeneratorCore.BIQ_TERRAIN.MARSH) {
      marsh += 1;
    }
  }
  return { forest, jungle, marsh, pineForest, invalidForest };
}

test('forest pass only paints valid vanilla-style land tiles', () => {
  const seeds = [1, 7, 17, 29, 101];
  for (const seed of seeds) {
    const world = mapGeneratorCore.generate(makeSpec({ mapSeed: seed }));
    const summary = summarizeVegetation(world);
    assert.ok(summary.forest > 80, `seed ${seed} produced too few forests: ${summary.forest}`);
    assert.equal(summary.invalidForest, 0, `seed ${seed} painted forests on invalid base terrain`);
  }
});

test('warm wet worlds bias toward more jungle and marsh than cool arid worlds', () => {
  const coolArid = summarizeVegetation(mapGeneratorCore.generate(makeSpec({ selectedTemperature: 0, selectedClimate: 0 })));
  const warmWet = summarizeVegetation(mapGeneratorCore.generate(makeSpec({ selectedTemperature: 2, selectedClimate: 2 })));
  assert.ok(warmWet.jungle >= coolArid.jungle, `expected warm/wet jungle >= cool/arid jungle (${warmWet.jungle} vs ${coolArid.jungle})`);
  assert.ok(warmWet.marsh > coolArid.marsh, `expected warm/wet marsh > cool/arid marsh (${warmWet.marsh} vs ${coolArid.marsh})`);
  assert.ok(coolArid.pineForest > warmWet.pineForest, `expected cool/arid pine forest > warm/wet (${coolArid.pineForest} vs ${warmWet.pineForest})`);
});
