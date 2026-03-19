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

function terrainCounts(world) {
  const counts = new Map();
  for (const tile of world.tiles) {
    counts.set(tile.baseTerrain, (counts.get(tile.baseTerrain) || 0) + 1);
  }
  return counts;
}

function getCount(map, key) {
  return map.get(key) || 0;
}

function summarizeContinents(world) {
  const continents = new Map();
  const halfWidth = world.width / 2;
  let coastline = 0;
  for (const tile of world.tiles) {
    if (tile.baseTerrain < 11 && tile.continent >= 0) {
      let entry = continents.get(tile.continent);
      if (!entry) entry = { size: 0, minRow: Infinity, maxRow: -Infinity };
      entry.size += 1;
      entry.minRow = Math.min(entry.minRow, tile.yPos);
      entry.maxRow = Math.max(entry.maxRow, tile.yPos);
      continents.set(tile.continent, entry);
    }
    if (tile.baseTerrain >= 11) continue;
    const corners = [
      [tile.xPos - 1, tile.yPos - 1],
      [tile.xPos + 1, tile.yPos - 1],
      [tile.xPos - 1, tile.yPos + 1],
      [tile.xPos + 1, tile.yPos + 1]
    ];
    for (const [x, y] of corners) {
      const idx = mapGeneratorCore.indexByCoord(world.width, world.height, x, y);
      if (idx < 0) continue;
      if (world.tiles[idx].baseTerrain >= 11) {
        coastline += 1;
        break;
      }
    }
  }
  const major = [...continents.values()].sort((a, b) => b.size - a.size).filter((entry) => entry.size >= 24);
  const significant = major.filter((entry) => entry.size >= 60);
  let maxRowRun = 0;
  let maxColRun = 0;
  for (let row = 0; row < world.height; row += 1) {
    let run = 0;
    for (let col = 0; col < halfWidth; col += 1) {
      const tile = world.tiles[(row * halfWidth) + col];
      if (tile.baseTerrain < 11) run += 1;
      else run = 0;
      if (run > maxRowRun) maxRowRun = run;
    }
  }
  for (let col = 0; col < halfWidth; col += 1) {
    let run = 0;
    for (let row = 0; row < world.height; row += 1) {
      const tile = world.tiles[(row * halfWidth) + col];
      if (tile.baseTerrain < 11) run += 1;
      else run = 0;
      if (run > maxColRun) maxColRun = run;
    }
  }
  return { major, significant, coastline, maxRowRun, maxColRun };
}

test('standard continents generation keeps sane land-water and terrain balance', () => {
  const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 1, mapSeed: 1 }));
  const counts = terrainCounts(world);
  const land = world.tiles.filter((tile) => tile.baseTerrain < 11).length;
  const water = getCount(counts, 11) + getCount(counts, 12) + getCount(counts, 13);

  assert.ok(land >= 1100 && land <= 1700, `land total out of expected range: ${land}`);
  assert.equal(land + water, world.tiles.length, 'land + water should cover every tile');
  assert.ok(getCount(counts, 1) >= 50, `plains too scarce: ${getCount(counts, 1)}`);
  assert.ok(getCount(counts, 2) >= 250, `grassland too scarce: ${getCount(counts, 2)}`);
  assert.ok(getCount(counts, 11) >= 150, `coast too scarce: ${getCount(counts, 11)}`);
});

test('fixed seed generation remains deterministic for continent-shape output', () => {
  const spec = makeSpec({ selectedLandform: 1, mapSeed: 17 });
  const first = mapGeneratorCore.generate(spec);
  const second = mapGeneratorCore.generate(spec);

  assert.equal(first.tiles.length, second.tiles.length, 'tile counts should match');
  for (let i = 0; i < first.tiles.length; i += 1) {
    assert.equal(first.tiles[i].packedTerrain, second.tiles[i].packedTerrain, `packed terrain mismatch at tile ${i}`);
    assert.equal(first.tiles[i].continent, second.tiles[i].continent, `continent mismatch at tile ${i}`);
  }
});

test('continents regression seeds stay within shape and coastline bands', () => {
  for (const seed of [1, 7, 17, 29, 101]) {
    const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 1, mapSeed: seed }));
    const land = world.tiles.filter((tile) => tile.baseTerrain < 11).length;
    const summary = summarizeContinents(world);
    assert.ok(land >= 1200 && land <= 1400, `seed ${seed}: land total out of band: ${land}`);
    assert.ok(summary.significant.length >= 4 && summary.significant.length <= 8, `seed ${seed}: significant continent count out of band: ${summary.significant.length}`);
    assert.ok(summary.significant[0].size >= 250 && summary.significant[0].size <= 420, `seed ${seed}: largest continent out of band: ${summary.significant[0].size}`);
    assert.ok(summary.significant[1].size >= 180 && summary.significant[1].size <= 340, `seed ${seed}: second continent out of band: ${summary.significant[1].size}`);
    assert.ok((summary.significant[0].maxRow - summary.significant[0].minRow) <= 62, `seed ${seed}: largest continent span too large`);
    assert.ok((summary.coastline / land) >= 0.40, `seed ${seed}: coastline too sparse relative to land`);
    assert.ok(summary.maxRowRun <= 18, `seed ${seed}: horizontal run too straight: ${summary.maxRowRun}`);
    assert.ok(summary.maxColRun <= 50, `seed ${seed}: vertical run too straight: ${summary.maxColRun}`);
  }
});
