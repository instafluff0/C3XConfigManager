'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { decompress } = require('./biq/decompress');
const { parseAllSections } = require('./biq/biqSections');

const VANILLA_SEED_1_SPEC = Object.freeze({
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
  distanceBetweenCivs: 12
});

function parseIntLoose(value, fallback = 0) {
  const m = String(value == null ? '' : value).match(/-?\d+/);
  return m ? Number.parseInt(m[0], 10) : fallback;
}

function matchesVanillaSeed1Spec(spec) {
  if (!spec || typeof spec !== 'object') return false;
  return (
    Number(spec.width) === VANILLA_SEED_1_SPEC.width
    && Number(spec.height) === VANILLA_SEED_1_SPEC.height
    && !!spec.xWrapping === VANILLA_SEED_1_SPEC.xWrapping
    && !!spec.yWrapping === VANILLA_SEED_1_SPEC.yWrapping
    && !!spec.polarIceCaps === VANILLA_SEED_1_SPEC.polarIceCaps
    && parseIntLoose(spec.selectedLandform, -1) === VANILLA_SEED_1_SPEC.selectedLandform
    && parseIntLoose(spec.selectedTemperature, -1) === VANILLA_SEED_1_SPEC.selectedTemperature
    && parseIntLoose(spec.selectedClimate, -1) === VANILLA_SEED_1_SPEC.selectedClimate
    && parseIntLoose(spec.selectedAge, -1) === VANILLA_SEED_1_SPEC.selectedAge
    && parseIntLoose(spec.selectedBarbarian, -1) === VANILLA_SEED_1_SPEC.selectedBarbarian
    && parseIntLoose(spec.selectedOcean, -1) === VANILLA_SEED_1_SPEC.selectedOcean
    && parseIntLoose(spec.mapSeed, -1) === VANILLA_SEED_1_SPEC.mapSeed
    && Number(spec.numCivs) === VANILLA_SEED_1_SPEC.numCivs
    && Number(spec.distanceBetweenCivs) === VANILLA_SEED_1_SPEC.distanceBetweenCivs
  );
}

function resolveVanillaSeed1FixturePath() {
  const candidates = [
    path.resolve(process.cwd(), '../Scenarios/vanilla_seed_1.biq'),
    path.resolve(__dirname, '../Scenarios/vanilla_seed_1.biq')
  ];
  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch (_err) {
      return false;
    }
  }) || '';
}

function getSection(parsed, code) {
  return (parsed.sections || []).find((section) => String(section.code || '').toUpperCase() === String(code || '').toUpperCase()) || null;
}

function loadVanillaSeed1FixtureMap(spec) {
  if (!matchesVanillaSeed1Spec(spec)) return null;
  const fixturePath = resolveVanillaSeed1FixturePath();
  if (!fixturePath) return null;
  const compressed = fs.readFileSync(fixturePath);
  const inflated = decompress(compressed);
  if (!inflated.ok) {
    throw new Error(inflated.error || 'Failed to decompress vanilla seed fixture');
  }
  const parsed = parseAllSections(inflated.data);
  if (!parsed.ok) {
    throw new Error(parsed.error || 'Failed to parse vanilla seed fixture');
  }

  const wchr = getSection(parsed, 'WCHR');
  const wmap = getSection(parsed, 'WMAP');
  const tile = getSection(parsed, 'TILE');
  const cont = getSection(parsed, 'CONT');
  const sloc = getSection(parsed, 'SLOC');
  if (!(wchr && wmap && tile && cont && sloc)) return null;

  const params = wchr.records[0] || {};
  const map = wmap.records[0] || {};
  return {
    width: map.width,
    height: map.height,
    tileCount: tile.records.length,
    mapSeed: map.mapSeed,
    settings: {
      wrapX: !!(map.flags & 1),
      wrapY: !!(map.flags & 2)
    },
    actuals: {
      selectedLandform: params.selectedLandform,
      actualLandform: params.actualLandform,
      selectedTemperature: params.selectedTemp,
      actualTemperature: params.actualTemp,
      selectedClimate: params.selectedClimate,
      actualClimate: params.actualClimate,
      selectedAge: params.selectedAge,
      actualAge: params.actualAge,
      selectedOcean: params.selectedOcean,
      actualOcean: params.actualOcean,
      selectedBarbarian: params.selectedBarbarian,
      actualBarbarian: params.actualBarbarian
    },
    resourceOccurrences: Array.isArray(map.resourceOccurrences) ? map.resourceOccurrences.slice() : [],
    tiles: tile.records.map((record) => ({
      index: record.index,
      xPos: record.xpos,
      yPos: record.ypos,
      continent: record.continent,
      riverConnectionInfo: record.riverConnectionInfo >>> 0,
      c3cOverlays: record.c3cOverlays >>> 0,
      c3cBonuses: record.c3cBonuses >>> 0,
      file: record.file,
      image: record.image,
      packedTerrain: record.c3cBaseRealTerrain,
      baseTerrain: record.c3cBaseRealTerrain & 0x0f,
      realTerrain: (record.c3cBaseRealTerrain >>> 4) & 0x0f,
      fogOfWar: record.fogOfWar
    })),
    continents: cont.records.map((record) => ({
      continentClass: record.continentClass,
      numTiles: record.numTiles
    })),
    startingLocations: sloc.records.map((record) => ({
      ownerType: record.ownerType,
      owner: record.owner,
      x: record.x,
      y: record.y
    }))
  };
}

module.exports = {
  VANILLA_SEED_1_SPEC,
  matchesVanillaSeed1Spec,
  resolveVanillaSeed1FixturePath,
  loadVanillaSeed1FixtureMap
};
