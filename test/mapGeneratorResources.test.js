'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const mapGeneratorCore = require('../src/mapGeneratorCore');

function makeTerrainMasks() {
  const masks = new Array(14).fill(null).map(() => [false, false, false]);
  [mapGeneratorCore.BIQ_TERRAIN.DESERT, mapGeneratorCore.BIQ_TERRAIN.PLAINS, mapGeneratorCore.BIQ_TERRAIN.GRASSLAND, mapGeneratorCore.BIQ_TERRAIN.TUNDRA].forEach((terrainId) => {
    masks[terrainId][0] = true;
    masks[terrainId][1] = true;
    masks[terrainId][2] = true;
  });
  return masks;
}

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
    resourceDefs: [
      { id: 0, name: 'Bonus Test', type: 0, appearanceRatio: 120, disappearanceProbability: 0 },
      { id: 1, name: 'Luxury Test', type: 1, appearanceRatio: 180, disappearanceProbability: 0 },
      { id: 2, name: 'Strategic Test', type: 2, appearanceRatio: 150, disappearanceProbability: 0 }
    ],
    terrainResourceMasks: makeTerrainMasks(),
    ...overrides
  };
}

test('resource generation writes tile resources and world occurrence counts', () => {
  const world = mapGeneratorCore.generate(makeSpec());
  const counts = [0, 0, 0];
  for (const tile of world.tiles) {
    if (tile.resource < 0) continue;
    counts[tile.resource] += 1;
    assert.ok(tile.baseTerrain >= 0 && tile.baseTerrain <= 3, `resource placed on invalid terrain ${tile.baseTerrain}`);
  }
  assert.ok(counts[0] > 0, `expected bonus resources, saw ${counts[0]}`);
  assert.ok(counts[1] > 0, `expected luxury resources, saw ${counts[1]}`);
  assert.ok(counts[2] > 0, `expected strategic resources, saw ${counts[2]}`);
  assert.deepEqual(world.resourceOccurrences, counts);
});

test('resource generation is deterministic for fixed seed and inputs', () => {
  const a = mapGeneratorCore.generate(makeSpec({ mapSeed: 17 }));
  const b = mapGeneratorCore.generate(makeSpec({ mapSeed: 17 }));
  assert.deepEqual(
    a.tiles.map((tile) => tile.resource),
    b.tiles.map((tile) => tile.resource)
  );
  assert.deepEqual(a.resourceOccurrences, b.resourceOccurrences);
});
