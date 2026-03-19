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

function summarizeWorld(world) {
  const byContinent = new Map();
  const rowLand = new Array(world.height).fill(0);
  let coastline = 0;
  let maxRowRun = 0;
  let maxColRun = 0;
  const halfWidth = world.width / 2;
  for (const tile of world.tiles) {
    if (tile.baseTerrain < 11) rowLand[tile.yPos] += 1;
    if (tile.baseTerrain >= 11 || tile.continent < 0) continue;
    let entry = byContinent.get(tile.continent);
    if (!entry) {
      entry = { size: 0, minRow: Infinity, maxRow: -Infinity };
      byContinent.set(tile.continent, entry);
    }
    entry.size += 1;
    if (tile.yPos < entry.minRow) entry.minRow = tile.yPos;
    if (tile.yPos > entry.maxRow) entry.maxRow = tile.yPos;
  }
  for (let row = 0; row < world.height; row += 1) {
    let run = 0;
    for (let col = 0; col < halfWidth; col += 1) {
      const tile = world.tiles[(row * halfWidth) + col];
      if (tile.baseTerrain < 11) {
        run += 1;
        coastline += countCoastTouchingCorners(world, tile);
      } else {
        run = 0;
      }
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
  const continents = [...byContinent.values()].sort((a, b) => b.size - a.size);
  const land = continents.reduce((sum, item) => sum + item.size, 0);
  const major = continents.filter((item) => item.size >= 24);
  const significant = continents.filter((item) => item.size >= 60);
  return { land, continents, major, significant, rowLand, coastline, maxRowRun, maxColRun };
}

function countCoastTouchingCorners(world, tile) {
  const coords = [
    [tile.xPos - 1, tile.yPos - 1],
    [tile.xPos + 1, tile.yPos - 1],
    [tile.xPos - 1, tile.yPos + 1],
    [tile.xPos + 1, tile.yPos + 1]
  ];
  let touching = 0;
  for (const [x, y] of coords) {
    const idx = mapGeneratorCore.indexByCoord(world.width, world.height, x, y);
    if (idx < 0) continue;
    if (world.tiles[idx].baseTerrain >= 11) touching += 1;
  }
  return touching > 0 ? 1 : 0;
}

function distinctCount(values) {
  return new Set(values).size;
}

test('continents maps produce multiple major landmasses without a blocker supercontinent', () => {
  const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 1, mapSeed: 1 }));
  const summary = summarizeWorld(world);
  assert.ok(summary.significant.length >= 4, `expected at least 4 significant continents, got ${summary.significant.length}`);
  assert.ok(summary.significant.length <= 5, `expected at most 5 significant continents, got ${summary.significant.length}`);
  assert.ok(summary.significant[0].size < Math.floor(summary.land * 0.42), `largest continent too dominant: ${summary.significant[0].size}/${summary.land}`);
  assert.ok(summary.significant[1].size >= 180, `second continent too small: ${summary.significant[1].size}`);
  assert.ok((summary.significant[0].maxRow - summary.significant[0].minRow) < 65, `largest continent spans too much north/south space: ${summary.significant[0].maxRow - summary.significant[0].minRow}`);
  assert.ok(distinctCount(summary.rowLand.slice(0, 12)) >= 4, 'north pole rows taper too uniformly');
  assert.ok(distinctCount(summary.rowLand.slice(-12)) >= 4, 'south pole rows taper too uniformly');
  assert.ok(summary.maxRowRun <= 18, `horizontal land run too straight: ${summary.maxRowRun}`);
  assert.ok(summary.maxColRun <= 46, `vertical land run too straight: ${summary.maxColRun}`);
  assert.ok((summary.coastline / summary.land) >= 0.40, `coastline too sparse relative to land: ${summary.coastline}/${summary.land}`);
});

test('archipelago maps break land into many islands instead of one dominant blob', () => {
  const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 0, mapSeed: 1 }));
  const summary = summarizeWorld(world);
  assert.ok(summary.major.length >= 4, `expected at least 4 major islands, got ${summary.major.length}`);
  assert.ok(summary.major[0].size < Math.floor(summary.land * 0.60), `largest island too dominant: ${summary.major[0].size}/${summary.land}`);
  assert.ok(summary.major[1].size >= 200, `second island too small: ${summary.major[1].size}`);
  assert.ok(summary.major[2].size >= 70, `third island too small: ${summary.major[2].size}`);
});

test('pangaea maps keep one dominant landmass with only minor satellites', () => {
  const world = mapGeneratorCore.generate(makeSpec({ selectedLandform: 2, mapSeed: 1 }));
  const summary = summarizeWorld(world);
  assert.ok(summary.major.length >= 1, 'expected a major pangaea landmass');
  assert.ok(summary.major[0].size > Math.floor(summary.land * 0.78), `pangaea leader too small: ${summary.major[0].size}/${summary.land}`);
  if (summary.major.length > 1) {
    assert.ok(summary.major[1].size < Math.floor(summary.land * 0.18), `secondary pangaea landmass too large: ${summary.major[1].size}/${summary.land}`);
  }
});
