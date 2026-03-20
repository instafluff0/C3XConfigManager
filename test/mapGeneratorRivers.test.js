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

function summarizeRivers(world) {
  const byContinent = new Map();
  let riverTiles = 0;
  let floodplains = 0;
  for (const tile of world.tiles) {
    if (tile.riverConnectionInfo) {
      riverTiles += 1;
      if (tile.continent >= 0) byContinent.set(tile.continent, (byContinent.get(tile.continent) || 0) + 1);
    }
    if (tile.baseTerrain === mapGeneratorCore.BIQ_TERRAIN.FLOODPLAIN) floodplains += 1;
  }
  const riverContinents = [...byContinent.values()].sort((a, b) => b - a);
  return { riverTiles, floodplains, riverContinents };
}

test('continents maps distribute rivers across multiple major landmasses', () => {
  const seeds = [1, 7, 17, 29, 101];
  for (const seed of seeds) {
    const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 1, mapSeed: seed }));
    const summary = summarizeRivers(world);
    assert.ok(summary.riverTiles >= 35, `seed ${seed} produced too few river tiles: ${summary.riverTiles}`);
    assert.ok(summary.riverContinents.length >= 3, `seed ${seed} concentrated rivers on too few continents: ${summary.riverContinents.length}`);
    assert.ok(summary.riverContinents[0] >= 9, `seed ${seed} left the largest river-bearing continent too dry: ${summary.riverContinents[0] || 0}`);
  }
});

test('pangaea maps still give the dominant landmass a visible river network', () => {
  const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 2, mapSeed: 1 }));
  const summary = summarizeRivers(world);
  assert.ok(summary.riverTiles >= 30, `pangaea produced too few river tiles: ${summary.riverTiles}`);
  assert.ok(summary.riverContinents[0] >= 20, `dominant pangaea landmass river coverage too low: ${summary.riverContinents[0] || 0}`);
});

test('arid continents produce floodplains along at least some desert rivers', () => {
  const seeds = [1, 7, 17];
  let sawFloodplain = false;
  for (const seed of seeds) {
    const world = mapGeneratorCore.generate(makeSpec({
      selectedLandform: 1,
      selectedClimate: 0,
      selectedTemperature: 1,
      mapSeed: seed
    }));
    const summary = summarizeRivers(world);
    if (summary.floodplains > 0) {
      sawFloodplain = true;
      break;
    }
  }
  assert.ok(sawFloodplain, 'arid continents seeds did not generate any floodplains');
});
