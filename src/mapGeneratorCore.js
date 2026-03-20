(function mapGeneratorCoreFactory(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MapGeneratorCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function mapGeneratorCoreInit() {
  var BIQ_TERRAIN = {
    DESERT: 0,
    PLAINS: 1,
    GRASSLAND: 2,
    TUNDRA: 3,
    FLOODPLAIN: 4,
    HILLS: 5,
    MOUNTAIN: 6,
    FOREST: 7,
    JUNGLE: 8,
    MARSH: 9,
    VOLCANO: 10,
    COAST: 11,
    SEA: 12,
    OCEAN: 13
  };

  var BIQ_TILE_BONUS = {
    BONUS_GRASSLAND: 0x01,
    PLAYER_START: 0x08,
    SNOW_CAPPED_MOUNTAIN: 0x10,
    PINE_FOREST: 0x20
  };

  var BIQ_TILE_OVERLAY = {
    GOODY_HUT: 0x00000020
  };

  var BIQ_RESOURCE_TYPE = {
    BONUS: 0,
    LUXURY: 1,
    STRATEGIC: 2
  };

  var RIVER_MASK = {
    NE: 2,
    SE: 8,
    SW: 32,
    NW: 128
  };

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function parseIntLoose(value, fallback) {
    var s = String(value == null ? '' : value).trim();
    var m = s.match(/-?\d+/);
    if (!m) return Number.isFinite(fallback) ? fallback : 0;
    return Number.parseInt(m[0], 10);
  }

  function packTerrain(baseTerrain, realTerrain) {
    var base = clamp(parseIntLoose(baseTerrain, BIQ_TERRAIN.GRASSLAND), 0, 15);
    var real = clamp(parseIntLoose(realTerrain, base), 0, 15);
    return ((real & 0x0f) << 4) | (base & 0x0f);
  }

  function isWaterTerrain(terrain) {
    return parseIntLoose(terrain, BIQ_TERRAIN.OCEAN) >= BIQ_TERRAIN.COAST;
  }

  function lcgNext(seed) {
    return (Math.imul(seed >>> 0, 1103515245) + 12345) >>> 0;
  }

  function createRng(seed) {
    var state = (parseIntLoose(seed, 0) >>> 0) || 1;
    return {
      next: function next() {
        state = lcgNext(state);
        return state;
      },
      float: function float() {
        return ((this.next() >>> 16) & 0x7fff) / 32768;
      },
      int: function int(maxExclusive) {
        var max = Math.max(1, parseIntLoose(maxExclusive, 1));
        return Math.floor(this.float() * max);
      }
    };
  }

  function smoothstep(t) {
    var x = clamp(t, 0, 1);
    return x * x * (3 - (2 * x));
  }

  function hash2(seed, x, y) {
    var h = (seed >>> 0) ^ Math.imul(x | 0, 0x85ebca6b) ^ Math.imul(y | 0, 0xc2b2ae35);
    h ^= h >>> 16;
    h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15;
    h = Math.imul(h, 0x846ca68b);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function valueNoise2d(seed, x, y, freqX, freqY, wrapX, wrapY) {
    var fx = Math.max(1, Number(freqX) || 1);
    var fy = Math.max(1, Number(freqY) || 1);
    var x0 = Math.floor(x * fx);
    var y0 = Math.floor(y * fy);
    var tx = smoothstep((x * fx) - x0);
    var ty = smoothstep((y * fy) - y0);
    var x1 = x0 + 1;
    var y1 = y0 + 1;
    if (wrapX) {
      x0 = ((x0 % fx) + fx) % fx;
      x1 = ((x1 % fx) + fx) % fx;
    }
    if (wrapY) {
      y0 = ((y0 % fy) + fy) % fy;
      y1 = ((y1 % fy) + fy) % fy;
    }
    var v00 = (hash2(seed, x0, y0) & 0xffff) / 0xffff;
    var v10 = (hash2(seed, x1, y0) & 0xffff) / 0xffff;
    var v01 = (hash2(seed, x0, y1) & 0xffff) / 0xffff;
    var v11 = (hash2(seed, x1, y1) & 0xffff) / 0xffff;
    var ix0 = v00 + ((v10 - v00) * tx);
    var ix1 = v01 + ((v11 - v01) * tx);
    return ix0 + ((ix1 - ix0) * ty);
  }

  function fractalNoise2d(seed, x, y, options) {
    var octaves = Math.max(1, parseIntLoose(options && options.octaves, 4));
    var persistence = options && Number.isFinite(options.persistence) ? options.persistence : 0.55;
    var lacunarity = options && Number.isFinite(options.lacunarity) ? options.lacunarity : 2;
    var freqX = Math.max(1, Number(options && options.freqX) || 2);
    var freqY = Math.max(1, Number(options && options.freqY) || 2);
    var amp = 1;
    var total = 0;
    var norm = 0;
    var i;
    for (i = 0; i < octaves; i += 1) {
      total += valueNoise2d(
        seed + (i * 1013),
        x,
        y,
        freqX,
        freqY,
        !!(options && options.wrapX),
        !!(options && options.wrapY)
      ) * amp;
      norm += amp;
      amp *= persistence;
      freqX *= lacunarity;
      freqY *= lacunarity;
    }
    return norm > 0 ? total / norm : 0;
  }

  function createSeededRng(seed) {
    return createRng(seed);
  }

  function heightMapRandomRange(rng, amplitude) {
    var span = Math.max(1, amplitude | 0);
    return rng.int(span) - (span >> 1);
  }

  function clampByte(value) {
    return clamp(Math.round(value), 0, 255);
  }

  function createHeightField() {
    var width = 129;
    var height = 65;
    var values = new Uint8Array(width * height);
    return {
      width: width,
      height: height,
      values: values
    };
  }

  function heightIndex(heightMap, x, y) {
    return (y * heightMap.width) + x;
  }

  function getHeightValue(heightMap, x, y) {
    return heightMap.values[heightIndex(heightMap, x, y)];
  }

  function setHeightValue(heightMap, x, y, value) {
    heightMap.values[heightIndex(heightMap, x, y)] = clampByte(value);
  }

  function copyHeightEdges(heightMap, flags) {
    var x;
    var y;
    if ((flags & 8) !== 0) {
      for (y = 0; y < heightMap.height; y += 1) {
        setHeightValue(heightMap, 0, y, 0);
        setHeightValue(heightMap, heightMap.width - 1, y, 0);
      }
    } else if ((flags & 2) !== 0) {
      for (y = 0; y < heightMap.height; y += 1) {
        setHeightValue(heightMap, heightMap.width - 1, y, getHeightValue(heightMap, 0, y));
      }
    }
    if ((flags & 1) !== 0) {
      for (x = 0; x < heightMap.width; x += 1) {
        setHeightValue(heightMap, x, heightMap.height - 1, getHeightValue(heightMap, x, 0));
      }
    }
  }

  function heightMapGenerate(mapWidth, mapHeight, roughnessParam, flags, seed, otherHeightMap) {
    var heightMap = createHeightField();
    var rng = createSeededRng(seed || 1);
    var level = clamp(6 - roughnessParam, 0, 6);
    var shiftDecay = 7 - level;
    var step;
    var x;
    var y;

    rng.float();
    for (step = 1 << level; step >= 1; step >>= 1) {
      copyHeightEdges(heightMap, flags);
      for (y = 0; y < heightMap.height; y += step) {
        for (x = 0; x < heightMap.width; x += step) {
          if (step === (1 << level)) {
            setHeightValue(heightMap, x, y, rng.int(256));
            continue;
          }
          var left = Math.max(0, x - step);
          var right = Math.min(heightMap.width - 1, x + step);
          var up = Math.max(0, y - step);
          var down = Math.min(heightMap.height - 1, y + step);
          var hasXAligned = (x % (step << 1)) === 0;
          var hasYAligned = (y % (step << 1)) === 0;
          var value;
          if (!hasXAligned && hasYAligned) {
            value = ((getHeightValue(heightMap, left, y) + getHeightValue(heightMap, right, y)) >> 1) +
              heightMapRandomRange(rng, 1 << (shiftDecay + Math.log2(step) + 1));
          } else if (hasXAligned && !hasYAligned) {
            value = ((getHeightValue(heightMap, x, up) + getHeightValue(heightMap, x, down)) >> 1) +
              heightMapRandomRange(rng, 1 << (shiftDecay + Math.log2(step) + 1));
          } else if (!hasXAligned && !hasYAligned) {
            value = ((getHeightValue(heightMap, left, up) + getHeightValue(heightMap, right, up) +
              getHeightValue(heightMap, left, down) + getHeightValue(heightMap, right, down)) >> 2) +
              heightMapRandomRange(rng, 1 << (shiftDecay + Math.log2(step) + 1));
          } else {
            continue;
          }
          setHeightValue(heightMap, x, y, value);
        }
      }
    }
    copyHeightEdges(heightMap, flags);
    heightMap.mapWidth = mapWidth;
    heightMap.mapHeight = mapHeight;
    heightMap.flags = flags;
    if (otherHeightMap) combineHeightMaps(heightMap, otherHeightMap);
    return heightMap;
  }

  function sampleHeightMap(heightMap, tileX, tileY, asPercent) {
    var x = clamp((Number(tileX) || 0) * 128 / Math.max(1, (heightMap.mapWidth || 1)), 0, 128);
    var y = clamp((Number(tileY) || 0) * 64 / Math.max(1, (heightMap.mapHeight || 1)), 0, 64);
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var x1 = Math.min(128, x0 + 1);
    var y1 = Math.min(64, y0 + 1);
    var tx = x - x0;
    var ty = y - y0;
    var v00 = getHeightValue(heightMap, x0, y0);
    var v10 = getHeightValue(heightMap, x1, y0);
    var v01 = getHeightValue(heightMap, x0, y1);
    var v11 = getHeightValue(heightMap, x1, y1);
    var top = v00 + ((v10 - v00) * tx);
    var bottom = v01 + ((v11 - v01) * tx);
    var value = top + ((bottom - top) * ty);
    if (asPercent) return Math.floor((value * 100) / 256);
    return clamp(value / 255, 0, 1);
  }

  function getHeightMapTileHeight(heightMap, tileX, tileY) {
    var value = sampleHeightMap(heightMap, tileX, tileY, false) * 255;
    var clamped = clamp(Math.trunc(value), 0, 255);
    if ((heightMap.flags & 4) !== 0) return Math.floor((clamped * 100) / 256);
    return clamped;
  }

  function heightMapSeaLevel(heightMap, percentWater) {
    var pct = clamp(parseIntLoose(percentWater, 0), 0, 100);
    if (!pct) return 0;
    var counts = new Array(256).fill(0);
    var i;
    for (i = 0; i < heightMap.values.length; i += 1) counts[heightMap.values[i]] += 1;
    var target = Math.floor((pct * 255) / 100);
    var low = 0;
    var high = 255;
    var current = target;
    while (current !== low) {
      var below = 0;
      for (i = 0; i < current; i += 1) below += counts[i];
      if (pct < Math.floor((below * 100) / 8192)) {
        high = current;
      } else {
        low = current;
      }
      current = Math.floor((low + high) / 2);
    }
    return current;
  }

  function tileCoordsByIndex(width, index) {
    var half = Math.floor(width / 2);
    if (!Number.isFinite(half) || half <= 0) return { xPos: 0, yPos: 0, col: 0 };
    var row = Math.floor(index / half);
    var col = index % half;
    return {
      xPos: (col * 2) + (row & 1),
      yPos: row,
      col: col
    };
  }

  function indexByCoord(width, height, xPos, yPos) {
    var half = Math.floor(width / 2);
    if (half <= 0) return -1;
    var y = parseIntLoose(yPos, -1);
    if (y < 0 || y >= height) return -1;
    var x = parseIntLoose(xPos, -1);
    if ((x & 1) !== (y & 1)) return -1;
    var col = (x - (y & 1)) / 2;
    if (col < 0 || col >= half) return -1;
    return (y * half) + col;
  }

  function resolveOption(rawValue, allowed, rng, fallback) {
    var value = parseIntLoose(rawValue, fallback);
    if (allowed.indexOf(value) >= 0) return value;
    if (value === 0 || value === 3 || value === 4) return allowed[rng.int(allowed.length)];
    return fallback;
  }

  function percentileThreshold(values, desiredFraction) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    var sorted = values.slice().sort(function sortAsc(a, b) { return a - b; });
    var landFraction = clamp(desiredFraction, 0.02, 0.98);
    var waterFraction = 1 - landFraction;
    var index = clamp(Math.floor(sorted.length * waterFraction), 0, sorted.length - 1);
    return sorted[index];
  }

  function percentileValue(values, percentile) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    var sorted = values.slice().sort(function sortAsc(a, b) { return a - b; });
    var normalized = clamp(Number(percentile) || 0, 0.02, 0.98);
    var index = clamp(Math.floor((sorted.length - 1) * normalized), 0, sorted.length - 1);
    return sorted[index];
  }

  function terrainShapeSeaLevelPercents(oceanMode) {
    if (oceanMode === 0) {
      return { percentWater: 82, landCutoff: 67 };
    }
    if (oceanMode === 1) {
      return { percentWater: 72, landCutoff: 57 };
    }
    if (oceanMode === 4) {
      return { percentWater: 42, landCutoff: 27 };
    }
    return { percentWater: 62, landCutoff: 47 };
  }

  function terrainShapeSeedOffsetState() {
    return { offsetIndex: 0 };
  }

  function nextTerrainShapeSeed(baseSeed, offsetState) {
    var offset = Math.imul(offsetState.offsetIndex, 0x71) >>> 0;
    offsetState.offsetIndex += 1;
    return ((baseSeed >>> 0) + offset) >>> 0;
  }

  function getLandformMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 3) return [0, 1, 2][rng.int(3)];
    if (v === 0 || v === 1 || v === 2) return v;
    return 1;
  }

  function getTemperatureMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 3) return [0, 1, 2][rng.int(3)];
    if (v === 0 || v === 1 || v === 2) return v;
    return 1;
  }

  function getClimateMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 3) return [0, 1, 2][rng.int(3)];
    if (v === 0 || v === 1 || v === 2) return v;
    return 1;
  }

  function getAgeMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 3) return [0, 1, 2][rng.int(3)];
    if (v === 0 || v === 1 || v === 2) return v;
    return 1;
  }

  function getOceanMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 3) return [0, 1, 2, 4][rng.int(4)];
    if (v === 0 || v === 1 || v === 2 || v === 4) return v;
    return 1;
  }

  function getBarbarianMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 4) return [-1, 0, 1, 2, 3][rng.int(5)];
    if (v < -1) return -1;
    if (v > 3) return 3;
    return v;
  }

  function neighborOffsetsForRow(row) {
    var odd = row & 1;
    return [
      { dx: -1, dy: 0, diag: false, dir: 'W' },
      { dx: 1, dy: 0, diag: false, dir: 'E' },
      { dx: 0, dy: -1, diag: false, dir: 'N' },
      { dx: 0, dy: 1, diag: false, dir: 'S' },
      { dx: odd ? 0 : -1, dy: -1, diag: true, dir: 'NW' },
      { dx: odd ? 1 : 0, dy: -1, diag: true, dir: 'NE' },
      { dx: odd ? 0 : -1, dy: 1, diag: true, dir: 'SW' },
      { dx: odd ? 1 : 0, dy: 1, diag: true, dir: 'SE' }
    ];
  }

  function wrapCellCoord(value, max) {
    if (max <= 0) return value;
    return ((value % max) + max) % max;
  }

  function getNeighborIndex(world, tile, direction, options) {
    var offsets = neighborOffsetsForRow(tile.row);
    var i;
    for (i = 0; i < offsets.length; i += 1) {
      if (offsets[i].dir !== direction) continue;
      var col = tile.col + offsets[i].dx;
      var row = tile.row + offsets[i].dy;
      if (options && options.wrapX) col = wrapCellCoord(col, world.halfWidth);
      if (options && options.wrapY) row = wrapCellCoord(row, world.height);
      if (col < 0 || col >= world.halfWidth || row < 0 || row >= world.height) return -1;
      return (row * world.halfWidth) + col;
    }
    return -1;
  }

  function getNeighborIndexes(world, tile, options) {
    var offsets = neighborOffsetsForRow(tile.row);
    var out = [];
    var i;
    for (i = 0; i < offsets.length; i += 1) {
      var col = tile.col + offsets[i].dx;
      var row = tile.row + offsets[i].dy;
      if (options && options.wrapX) col = wrapCellCoord(col, world.halfWidth);
      if (options && options.wrapY) row = wrapCellCoord(row, world.height);
      if (col < 0 || col >= world.halfWidth || row < 0 || row >= world.height) continue;
      out.push((row * world.halfWidth) + col);
    }
    return out;
  }

  function createWorld(spec) {
    var width = Math.max(66, Math.min(362, parseIntLoose(spec.width, 130)));
    if ((width & 1) === 1) width += 1;
    var height = Math.max(66, Math.min(362, parseIntLoose(spec.height, 130)));
    var halfWidth = Math.floor(width / 2);
    var tileCount = halfWidth * height;
    var tiles = [];
    var i;
    for (i = 0; i < tileCount; i += 1) {
      var coords = tileCoordsByIndex(width, i);
      tiles.push({
        index: i,
        col: coords.col,
        row: coords.yPos,
        xPos: coords.xPos,
        yPos: coords.yPos,
        isLand: false,
        continent: -1,
        landScore: 0,
        elevation: 0,
        moisture: 0,
        temperature: 0,
        resource: -1,
        riverConnectionInfo: 0,
        c3cOverlays: 0,
        c3cBonuses: 0,
        baseTerrain: BIQ_TERRAIN.OCEAN,
        realTerrain: BIQ_TERRAIN.OCEAN,
        file: 8,
        image: 0
      });
    }
    return {
      width: width,
      height: height,
      halfWidth: halfWidth,
      tileCount: tileCount,
      tiles: tiles
    };
  }

  function buildLand(world, settings, rng) {
    if (settings.landformMode === 0 || settings.landformMode === 1 || settings.landformMode === 2) {
      buildTerrainShapeLand(world, settings);
      return;
    }
    var landScores = [];
    var seaLevels = terrainShapeSeaLevelPercents(settings.oceanMode);
    var targetLandFraction = clamp((100 - seaLevels.landCutoff) / 100, 0.18, 0.78);
    var terrainFlags = (settings.wrapX ? 1 : 0) | (settings.wrapY ? 2 : 0);
    if (settings.landformMode === 1) terrainFlags |= 0x10;
    var primaryHeightMap = heightMapGenerate(world.width, world.height, settings.landformMode === 0 ? 3 : 2, terrainFlags, (~settings.seed) >>> 0);
    var shapeSeaLevel = heightMapSeaLevel(primaryHeightMap, seaLevels.percentWater);
    var landSeaLevel = heightMapSeaLevel(primaryHeightMap, seaLevels.landCutoff);
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      var u = (tile.col + 0.5) / world.halfWidth;
      var v = (tile.row + 0.5) / world.height;
      var latitude = Math.abs((v * 2) - 1);
      var shape = fractalNoise2d(settings.seed + 0x101, u, v, {
        octaves: 5,
        persistence: 0.58,
        lacunarity: 2,
        freqX: 2.2,
        freqY: 1.8,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      var detail = fractalNoise2d(settings.seed + 0x211, u, v, {
        octaves: 4,
        persistence: 0.52,
        lacunarity: 2,
        freqX: 6,
        freqY: 5,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      var ridge = fractalNoise2d(settings.seed + 0x333, u, v, {
        octaves: 3,
        persistence: 0.5,
        lacunarity: 2,
        freqX: 1.3,
        freqY: 1.1,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      var centerMask = 1 - clamp(Math.sqrt((((u - 0.5) / 0.45) * ((u - 0.5) / 0.45)) + (((v - 0.55) / 0.65) * ((v - 0.55) / 0.65))), 0, 1);
      var breakup = fractalNoise2d(settings.seed + 0x3f1, u, v, {
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2,
        freqX: 7.5,
        freqY: 6.5,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      var macro = fractalNoise2d(settings.seed + 0x4c3, u, v, {
        octaves: 3,
        persistence: 0.58,
        lacunarity: 2,
        freqX: 1.5,
        freqY: 1.3,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      var warpedMidline = 0.5 + ((macro - 0.5) * 0.22);
      var pangaeaSpine = 1 - clamp(Math.abs(v - warpedMidline) / 0.27, 0, 1);
      var eastWestTaper = 1 - clamp(Math.abs(u - 0.5) / 0.48, 0, 1);
      var islandScatter = 1 - clamp(Math.abs(macro - 0.52) / 0.34, 0, 1);
      var oceanCorridors = Math.max(0, 0.18 - Math.abs(breakup - 0.5)) * 2.2;
      var northBandBreak = Math.max(0, 0.14 - Math.abs(v - 0.32)) * 0.9;
      var southBandBreak = Math.max(0, 0.14 - Math.abs(v - 0.68)) * 0.9;
      var score;
      if (settings.landformMode === 1) {
        score = (shape * 0.48) + (detail * 0.42) + (ridge * 0.10) - (latitude * 0.08) - northBandBreak - southBandBreak;
      } else if (settings.landformMode === 2) {
        score = (shape * 0.28) + (detail * 0.11) + (ridge * 0.13) + (pangaeaSpine * 0.32) + (eastWestTaper * 0.12) + (macro * 0.14) - (latitude * 0.05) - (oceanCorridors * 0.08);
      } else {
        score = (shape * 0.30) + (detail * 0.14) + (ridge * 0.08) + (islandScatter * 0.26) + (breakup * 0.10) - (centerMask * 0.06) - (latitude * 0.04) - (oceanCorridors * 0.20);
      }
      var tileHeight = Math.floor(sampleHeightMap(primaryHeightMap, tile.xPos, tile.yPos, false) * 255);
      if (tileHeight > shapeSeaLevel && rng.int(50) === 0) score += 0.12;
      if (tileHeight <= landSeaLevel) score += 0.18;
      if (tileHeight > landSeaLevel) {
        var nearHigherWater = false;
        var neighbors = getNeighborIndexes(world, tile, { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY });
        var j;
        for (j = 0; j < neighbors.length; j += 1) {
          var neighborTile = world.tiles[neighbors[j]];
          var neighborHeight = Math.floor(sampleHeightMap(primaryHeightMap, neighborTile.xPos, neighborTile.yPos, false) * 255);
          if (neighborHeight > landSeaLevel) {
            nearHigherWater = true;
            break;
          }
        }
        if (nearHigherWater) score += 0.14;
      }
      tile.landScore = score;
      landScores.push(score);
    }
    if (settings.landformMode === 0) targetLandFraction = clamp(targetLandFraction - 0.12, 0.12, 0.46);
    if (settings.landformMode === 2) targetLandFraction = clamp(targetLandFraction - 0.01, 0.28, 0.62);
    var threshold = percentileThreshold(landScores, targetLandFraction);
    for (i = 0; i < world.tiles.length; i += 1) {
      world.tiles[i].isLand = world.tiles[i].landScore >= threshold;
      if (world.tiles[i].isLand) {
        world.tiles[i].baseTerrain = BIQ_TERRAIN.GRASSLAND;
        world.tiles[i].realTerrain = BIQ_TERRAIN.GRASSLAND;
      } else {
        world.tiles[i].baseTerrain = BIQ_TERRAIN.OCEAN;
        world.tiles[i].realTerrain = BIQ_TERRAIN.OCEAN;
      }
      world.tiles[i].continent = -1;
    }
    smoothLandMask(world, settings, 2);
    enforcePolarOceanLanes(world, settings);
    if (settings.landformMode === 2) {
      enforcePangaea(world, settings, rng);
      roughenPangaeaCoastline(world, settings, rng);
    }
    if (settings.landformMode === 0) {
      erodeArchipelago(world, settings, rng);
      erodeArchipelago(world, settings, rng);
      scatterArchipelago(world, settings, rng);
      scatterArchipelago(world, settings, rng);
    }
  }

  function terrainShapeFlags(settings) {
    var baseFlags = settings.wrapY ? 2 : 8;
    var landFlags = baseFlags | 1;
    if (settings.landformMode === 1) landFlags |= 0x10;
    return { baseFlags: baseFlags, landFlags: landFlags };
  }

  function buildTerrainShapeHeightMap(world, settings, seed) {
    var flags = terrainShapeFlags(settings);
    if (settings.landformMode === 0) {
      return heightMapGenerate(world.width, world.height, 3, flags.landFlags, (~seed) >>> 0, null);
    }
    var aux = heightMapGenerate(world.width, world.height, 2, flags.baseFlags, (seed + 0x3039) >>> 0, null);
    var primary = heightMapGenerate(world.width, world.height, 2, flags.landFlags, (~seed) >>> 0, aux);
    if (settings.landformMode === 1) {
      var rough = heightMapGenerate(world.width, world.height, 3, flags.landFlags, seed >>> 0, aux);
      averageHeightMaps(primary, rough);
    }
    return primary;
  }

  function buildTerrainShapeLand(world, settings) {
    var seaLevels = terrainShapeSeaLevelPercents(settings.oceanMode);
    var offsetState = terrainShapeSeedOffsetState();
    var outerAttempt;
    var lastHeightMap = null;
    var lastSeaLevel = 0;
    var lastForcedLandLevel = 0;
    var lastShelfLevel = 0;
    for (outerAttempt = 0; outerAttempt < 10; outerAttempt += 1) {
      var seedAttemptIndex = 0;
      var acceptedSeaLevel = false;
      var primaryHeightMap = null;
      var waterSeaLevel = 0;
      var forcedLandSeaLevel = 0;
      var shelfSeaLevel = 0;
      while (seedAttemptIndex < 32) {
        var shapeSeed = nextTerrainShapeSeed(settings.seed, offsetState);
        primaryHeightMap = buildTerrainShapeHeightMap(world, settings, shapeSeed);
        shelfSeaLevel = heightMapSeaLevel(primaryHeightMap, 60);
        waterSeaLevel = heightMapSeaLevel(primaryHeightMap, seaLevels.percentWater);
        forcedLandSeaLevel = heightMapSeaLevel(primaryHeightMap, seaLevels.landCutoff);
        if (isAcceptableTerrainSeaLevel(offsetState.offsetIndex - 1, waterSeaLevel)) {
          acceptedSeaLevel = true;
          break;
        }
        seedAttemptIndex += 1;
      }
      if (!primaryHeightMap) continue;
      applyTerrainShapeHeights(world, settings, primaryHeightMap, forcedLandSeaLevel, waterSeaLevel, shelfSeaLevel, (settings.seed + Math.imul(outerAttempt, 0x71)) >>> 0);
      var continents = identifyLandContinents(world, settings);
      lastHeightMap = primaryHeightMap;
      lastSeaLevel = waterSeaLevel;
      lastForcedLandLevel = forcedLandSeaLevel;
      lastShelfLevel = shelfSeaLevel;
      if (!acceptedSeaLevel) continue;
      if (terrainShapeAccepted(world, settings, continents)) return;
    }
    if (lastHeightMap) {
      applyTerrainShapeHeights(world, settings, lastHeightMap, lastForcedLandLevel, lastSeaLevel, lastShelfLevel, settings.seed >>> 0);
      identifyLandContinents(world, settings);
    }
  }

  function randNextSeed(seed) {
    return lcgNext(seed);
  }

  function randFloatFromSeed(seed) {
    return (((seed >>> 16) & 0x7fff) / 32768);
  }

  function randIntFromSeed(seed, limit) {
    var nextSeed = randNextSeed(seed);
    return {
      seed: nextSeed,
      value: Math.floor(randFloatFromSeed(nextSeed) * Math.max(1, parseIntLoose(limit, 1)))
    };
  }

  function combineHeightMaps(targetHeightMap, otherHeightMap) {
    var row;
    for (row = 0; row < 65; row += 1) {
      var colWeight = 0;
      var polarWeight = 16;
      while (polarWeight > 0) {
        var eastBias = getHeightValue(otherHeightMap, row + 64, colWeight) - 0x80;
        eastBias = eastBias * 0x80;
        eastBias += ((eastBias >> 31) & 0x7f);
        eastBias = Math.trunc((eastBias >> 7) / 8);

        var eastCol = eastBias + colWeight;
        if (eastCol < 0) eastCol += 0x80;
        else if (eastCol > 0x7f) eastCol -= 0x80;

        var westCol = eastBias - colWeight;
        if (westCol < 0) westCol += 0x80;
        else if (westCol >= 0x80) westCol -= 0x80;

        var eastIndex = row + (eastCol * 0x41);
        var westIndex = row + (westCol * 0x41);
        var eastValue = targetHeightMap.values[eastIndex] * colWeight;
        targetHeightMap.values[eastIndex] = ((eastValue + ((eastValue >> 31) & 0x0f)) >> 4) & 0xff;
        var westValue = targetHeightMap.values[westIndex] * colWeight;
        targetHeightMap.values[westIndex] = ((westValue + ((westValue >> 31) & 0x0f)) >> 4) & 0xff;

        if ((targetHeightMap.flags & 0x10) !== 0) {
          var polarBias = getHeightValue(otherHeightMap, row, 0) - 0x80;
          polarBias = polarBias * 0x80;
          polarBias += ((polarBias >> 31) & 0x7f);
          polarBias = Math.trunc((polarBias >> 7) / 4);

          var upperCol = polarBias + 0x40 + colWeight;
          if (upperCol < 0) upperCol += 0x80;
          else if (upperCol > 0x7f) upperCol -= 0x80;

          var lowerCol = polarBias - colWeight;
          var shiftedLower = lowerCol + 0x40;
          if (shiftedLower < 0) lowerCol += 0xc0;
          else {
            lowerCol -= 0x40;
            if (shiftedLower < 0x80) lowerCol = shiftedLower;
          }

          var upperIndex = row + (upperCol * 0x41);
          var lowerIndex = row + (lowerCol * 0x41);
          var upperValue = (targetHeightMap.values[upperIndex] * colWeight) + polarWeight;
          targetHeightMap.values[upperIndex] = ((upperValue + ((upperValue >> 31) & 0x0f)) >> 4) & 0xff;
          var lowerValue = (targetHeightMap.values[lowerIndex] * colWeight) + polarWeight;
          targetHeightMap.values[lowerIndex] = ((lowerValue + ((lowerValue >> 31) & 0x0f)) >> 4) & 0xff;
        }

        colWeight += 1;
        polarWeight -= 1;
      }
    }
    if ((targetHeightMap.flags & 1) !== 0) {
      var x;
      for (x = 0; x < 0x41; x += 1) {
        setHeightValue(targetHeightMap, x, 64, getHeightValue(targetHeightMap, x, 0));
      }
    }
  }

  function averageHeightMaps(primaryHeightMap, otherHeightMap) {
    var i;
    for (i = 0; i < primaryHeightMap.values.length; i += 1) {
      primaryHeightMap.values[i] = (((primaryHeightMap.values[i] + otherHeightMap.values[i]) / 2) | 0) & 0xff;
    }
  }

  function isAcceptableTerrainSeaLevel(seedAttemptIndex, waterSeaLevel) {
    if (seedAttemptIndex < 0x46a) return waterSeaLevel >= 0x46 && waterSeaLevel <= 0x82;
    if (seedAttemptIndex < 0x69f) return waterSeaLevel <= 0x4f || waterSeaLevel >= 0x79;
    return true;
  }

  function neighborDiffToOffset(neighborIndex) {
    var ring = 0;
    var squareSize = 1;
    while (neighborIndex > 0 && (squareSize * squareSize) <= neighborIndex) {
      squareSize += 2;
      ring += 1;
    }
    var relative = neighborIndex - (((ring * 2) - 1) * ((ring * 2) - 1));
    var step = relative + 1;
    if (neighborIndex === 0) return { dx: 0, dy: 0 };
    if (neighborIndex < 9) {
      if (step <= ring * 2) return { dx: step, dy: step - (ring * 2) };
      if (step <= ring * 4) return { dx: (ring * 4) - step, dy: step - (ring * 2) };
      if (step <= ring * 6) return { dx: (ring * 4) - step, dy: (ring * 6) - step };
      if (step <= ring * 8) return { dx: step - (ring * 8), dy: (ring * 6) - step };
    }
    if (step > (ring * 8) - 4) {
      if (step === (ring * 8) - 3) return { dx: 0, dy: -(ring * 2) };
      if (step === (ring * 8) - 2) return { dx: ring * 2, dy: 0 };
      if (step === (ring * 8) - 1) return { dx: 0, dy: ring * 2 };
      if (step === (ring * 8)) return { dx: -(ring * 2), dy: 0 };
    } else {
      if (step < ring * 2) return { dx: step, dy: step - (ring * 2) };
      if (step < (ring * 4) - 1) return { dx: (ring * 4) - (relative + 2), dy: (relative + 2) - (ring * 2) };
      if (step < (ring * 6) - 2) return { dx: (ring * 4) - (relative + 3), dy: (ring * 6) - (relative + 3) };
      if (step < (ring * 8) - 3) return { dx: (relative + 4) - (ring * 8), dy: (ring * 6) - (relative + 4) };
    }
    return { dx: 0, dy: 0 };
  }

  function wrapAxis(value, size) {
    if (value < 0) return size + value;
    if (value >= size) return value - size;
    return value;
  }

  function getWrappedHeightCoord(world, settings, xPos, yPos) {
    var nextX = xPos;
    var nextY = yPos;
    if (settings.wrapX) nextX = wrapAxis(nextX, world.width);
    if (settings.wrapY) nextY = wrapAxis(nextY, world.height);
    if (nextX < 0 || nextX >= world.width || nextY < 0 || nextY >= world.height) return null;
    return { xPos: nextX, yPos: nextY };
  }

  function applyTerrainShapeHeights(world, settings, primaryHeightMap, forcedLandSeaLevel, waterSeaLevel, seaBandLevel, decisionSeed) {
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      tile.isLand = false;
      tile.continent = -1;
      tile.baseTerrain = BIQ_TERRAIN.OCEAN;
      tile.realTerrain = BIQ_TERRAIN.OCEAN;
      tile.landScore = 0;
    }
    var seedState = decisionSeed >>> 0;
    for (i = 0; i < world.tiles.length; i += 1) {
      var current = world.tiles[i];
      var tileHeight = getHeightMapTileHeight(primaryHeightMap, current.xPos, current.yPos);
      var forcedRoll = randIntFromSeed(seedState, 0x32);
      seedState = forcedRoll.seed >>> 0;
      if (tileHeight > forcedLandSeaLevel && forcedRoll.value === 0) {
        current.isLand = true;
        current.baseTerrain = BIQ_TERRAIN.GRASSLAND;
        current.realTerrain = BIQ_TERRAIN.GRASSLAND;
        current.landScore = 1;
        continue;
      }
      if (tileHeight <= waterSeaLevel) {
        if (tileHeight > seaBandLevel) {
          current.baseTerrain = BIQ_TERRAIN.SEA;
          current.realTerrain = BIQ_TERRAIN.SEA;
        } else {
          current.baseTerrain = BIQ_TERRAIN.OCEAN;
          current.realTerrain = BIQ_TERRAIN.OCEAN;
        }
        continue;
      }
      var neighborIndex;
      for (neighborIndex = 1; neighborIndex < 9; neighborIndex += 1) {
        var diff = neighborDiffToOffset(neighborIndex);
        var neighborCoord = getWrappedHeightCoord(world, settings, current.xPos + diff.dx, current.yPos + diff.dy);
        if (!neighborCoord) continue;
        var neighborHeight = getHeightMapTileHeight(primaryHeightMap, neighborCoord.xPos, neighborCoord.yPos);
        if (neighborHeight > waterSeaLevel) {
          current.isLand = true;
          current.baseTerrain = BIQ_TERRAIN.GRASSLAND;
          current.realTerrain = BIQ_TERRAIN.GRASSLAND;
          current.landScore = 1;
          break;
        }
      }
    }
  }

  function terrainShapeAccepted(world, settings, continents) {
    if (settings.landformMode === 0) {
      if (continents.length > 2 && continents[2] && continents[0].length >= (continents[2].length * 2)) return true;
      return false;
    }
    if (settings.landformMode === 1) {
      if (continents.length > 2 && continents[1] && continents[1].length > 0) {
        if (continents[0].length < Math.floor((continents[1].length * 3) / 2)) {
          if (!continents[2] || continents[2].length <= 0) return true;
          return continents[0].length < (continents[2].length * 4);
        }
      }
      return false;
    }
    if (continents.length > 1 && continents[1] && continents[1].length > 0) {
      return continents[0].length < (continents[1].length * 8);
    }
    return false;
  }

  function enforcePolarOceanLanes(world, settings) {
    if (settings.landformMode !== 1) return;
    var topRows = Math.max(8, Math.floor(world.height * 0.12));
    var bottomRows = Math.max(8, Math.floor(world.height * 0.12));
    var middleStart = topRows;
    var middleEnd = Math.max(middleStart, world.height - bottomRows);
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (tile.row < topRows || tile.row >= middleEnd) {
        tile.isLand = false;
        tile.continent = -1;
      }
    }
    if (middleStart >= middleEnd) return;
    for (i = 0; i < world.tiles.length; i += 1) {
      var midTile = world.tiles[i];
      if (midTile.row < middleStart || midTile.row >= middleEnd) continue;
      if (!midTile.isLand) continue;
      var northDistance = midTile.row - middleStart;
      var southDistance = (middleEnd - 1) - midTile.row;
      var coastPressure = Math.min(northDistance, southDistance);
      if (coastPressure <= 1) midTile.isLand = false;
    }
  }

  function smoothLandMask(world, settings, rounds) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var round;
    for (round = 0; round < rounds; round += 1) {
      var next = new Array(world.tiles.length);
      var i;
      for (i = 0; i < world.tiles.length; i += 1) {
        var tile = world.tiles[i];
        var neighbors = getNeighborIndexes(world, tile, wrapOptions);
        var landNeighbors = 0;
        var j;
        for (j = 0; j < neighbors.length; j += 1) {
          if (world.tiles[neighbors[j]].isLand) landNeighbors += 1;
        }
        if (tile.isLand) next[i] = landNeighbors >= 3;
        else next[i] = landNeighbors >= 5;
      }
      for (i = 0; i < world.tiles.length; i += 1) world.tiles[i].isLand = next[i];
    }
  }

  function identifyLandContinents(world, settings) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var continents = [];
    var seen = new Uint8Array(world.tiles.length);
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand || seen[i]) continue;
      var queue = [i];
      var head = 0;
      var members = [];
      seen[i] = 1;
      while (head < queue.length) {
        var idx = queue[head];
        head += 1;
        members.push(idx);
        var neighbors = getNeighborIndexes(world, world.tiles[idx], wrapOptions);
        var j;
        for (j = 0; j < neighbors.length; j += 1) {
          var nIdx = neighbors[j];
          if (seen[nIdx] || !world.tiles[nIdx].isLand) continue;
          seen[nIdx] = 1;
          queue.push(nIdx);
        }
      }
      continents.push(members);
    }
    continents.sort(function sortBySizeDesc(a, b) { return b.length - a.length; });
    for (i = 0; i < world.tiles.length; i += 1) {
      if (!world.tiles[i].isLand) world.tiles[i].continent = -1;
    }
    for (i = 0; i < continents.length; i += 1) {
      var members = continents[i];
      var j;
      for (j = 0; j < members.length; j += 1) world.tiles[members[j]].continent = i;
    }
    return continents;
  }

  function tileWithinRadiusOfContinent(world, tile, continentSet, radius, settings) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var seen = new Uint8Array(world.tiles.length);
    var queue = [{ index: tile.index, depth: 0 }];
    seen[tile.index] = 1;
    var head = 0;
    while (head < queue.length) {
      var item = queue[head];
      head += 1;
      if (continentSet.has(item.index)) return true;
      if (item.depth >= radius) continue;
      var neighbors = getNeighborIndexes(world, world.tiles[item.index], wrapOptions);
      var i;
      for (i = 0; i < neighbors.length; i += 1) {
        var nIdx = neighbors[i];
        if (seen[nIdx]) continue;
        seen[nIdx] = 1;
        queue.push({ index: nIdx, depth: item.depth + 1 });
      }
    }
    return false;
  }

  function applyVanillaContinentsSplitPass(world, settings) {
    if (settings.landformMode !== 1) return;
    var searchRadius = Math.floor(((world.height + world.width) / 2) / 0x32);
    if (searchRadius > 4) searchRadius = 4;
    var neighborLimit = ((searchRadius * 2) + 5);
    neighborLimit *= neighborLimit;
    var continents = identifyLandContinents(world, settings);
    if (continents.length < 2) return;
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand || tile.continent !== 1) continue;
      var neighborIndex;
      for (neighborIndex = 1; neighborIndex < neighborLimit; neighborIndex += 1) {
        var diff = neighborDiffToOffset(neighborIndex);
        var neighborCoord = getWrappedHeightCoord(world, settings, tile.xPos + diff.dx, tile.yPos + diff.dy);
        if (!neighborCoord) continue;
        var neighborTileIndex = indexByCoord(world.width, world.height, neighborCoord.xPos, neighborCoord.yPos);
        if (neighborTileIndex < 0) continue;
        if (world.tiles[neighborTileIndex].continent === 0) {
          tile.isLand = false;
          tile.continent = -1;
          tile.baseTerrain = BIQ_TERRAIN.SEA;
          tile.realTerrain = BIQ_TERRAIN.SEA;
          break;
        }
      }
    }
    identifyLandContinents(world, settings);
  }

  function separateContinents(world, settings) {
    if (settings.landformMode !== 1) return;
    var continents = identifyLandContinents(world, settings);
    if (continents.length < 2) return;
    var searchBase = Math.min(4, Math.max(1, Math.floor(((world.width + world.height) / 2) / 50)));
    var searchRadius = Math.min(6, (searchBase * 2) + 2);
    var largestSet = new Set(continents[0]);
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var converted = 0;
    var maxConverted = Math.max(2, Math.floor(continents[1].length * 0.18));
    var i;
    for (i = 0; i < continents[1].length; i += 1) {
      var tile = world.tiles[continents[1][i]];
      var neighbors = getNeighborIndexes(world, tile, wrapOptions);
      var landNeighbors = 0;
      var j;
      for (j = 0; j < neighbors.length; j += 1) {
        if (world.tiles[neighbors[j]].isLand) landNeighbors += 1;
      }
      if (landNeighbors >= 7) continue;
      if (!tileWithinRadiusOfContinent(world, tile, largestSet, searchRadius, settings)) continue;
      tile.isLand = false;
      tile.continent = -1;
      converted += 1;
      if (converted >= maxConverted) break;
    }
    if (converted > 0) identifyLandContinents(world, settings);
  }

  function carveCircumnavigationPassages(world, settings) {
    if (settings.landformMode !== 1) return;
    var continents = identifyLandContinents(world, settings);
    var maxSpan = Math.floor(world.height * 0.58);
    var c;
    for (c = 0; c < Math.min(2, continents.length); c += 1) {
      var members = continents[c];
      if (!members || members.length < 120) continue;
      var minRow = world.height;
      var maxRow = -1;
      var rowCounts = new Array(world.height).fill(0);
      var i;
      for (i = 0; i < members.length; i += 1) {
        var tile = world.tiles[members[i]];
        if (tile.row < minRow) minRow = tile.row;
        if (tile.row > maxRow) maxRow = tile.row;
        rowCounts[tile.row] += 1;
      }
      if ((maxRow - minRow) < maxSpan) continue;
      var bandStart = minRow + Math.floor((maxRow - minRow) * 0.25);
      var bandEnd = maxRow - Math.floor((maxRow - minRow) * 0.25);
      var cutRow = -1;
      var bestScore = Infinity;
      for (i = bandStart; i <= bandEnd; i += 1) {
        if (rowCounts[i] === 0) continue;
        if (rowCounts[i] < bestScore) {
          bestScore = rowCounts[i];
          cutRow = i;
        }
      }
      if (cutRow < 0) continue;
      for (i = 0; i < members.length; i += 1) {
        var cutTile = world.tiles[members[i]];
        if (Math.abs(cutTile.row - cutRow) <= 1) {
          cutTile.isLand = false;
          cutTile.continent = -1;
        }
      }
    }
    identifyLandContinents(world, settings);
  }

  function rebalanceContinents(world, settings, rng) {
    if (settings.landformMode !== 1) return;
    var continents = identifyLandContinents(world, settings);
    if (!continents.length) return;
    var totalLand = 0;
    var i;
    for (i = 0; i < continents.length; i += 1) totalLand += continents[i].length;
    var largest = continents[0];
    if (!largest || largest.length < Math.floor(totalLand * 0.42)) return;
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    for (i = 0; i < largest.length; i += 1) {
      var tile = world.tiles[largest[i]];
      var neighbors = getNeighborIndexes(world, tile, wrapOptions);
      var landNeighbors = 0;
      var j;
      for (j = 0; j < neighbors.length; j += 1) {
        if (world.tiles[neighbors[j]].isLand) landNeighbors += 1;
      }
      if (landNeighbors <= 5 && rng.float() < 0.22) {
        tile.isLand = false;
        tile.continent = -1;
      }
    }
    smoothLandMask(world, settings, 1);
    identifyLandContinents(world, settings);
  }

  function collectContinentStats(world, settings) {
    var continents = identifyLandContinents(world, settings);
    return continents.map(function mapMembers(members, continentId) {
      var minRow = world.height;
      var maxRow = -1;
      var minCol = world.halfWidth;
      var maxCol = -1;
      var rowCounts = new Array(world.height).fill(0);
      var colCounts = new Array(world.halfWidth).fill(0);
      var i;
      for (i = 0; i < members.length; i += 1) {
        var tile = world.tiles[members[i]];
        if (tile.row < minRow) minRow = tile.row;
        if (tile.row > maxRow) maxRow = tile.row;
        if (tile.col < minCol) minCol = tile.col;
        if (tile.col > maxCol) maxCol = tile.col;
        rowCounts[tile.row] += 1;
        colCounts[tile.col] += 1;
      }
      return {
        continentId: continentId,
        members: members,
        size: members.length,
        minRow: minRow,
        maxRow: maxRow,
        minCol: minCol,
        maxCol: maxCol,
        rowCounts: rowCounts,
        colCounts: colCounts
      };
    });
  }

  function findWeakBand(stats, orientation) {
    var counts = orientation === 'horizontal' ? stats.rowCounts : stats.colCounts;
    var start = orientation === 'horizontal'
      ? stats.minRow + Math.floor((stats.maxRow - stats.minRow) * 0.2)
      : stats.minCol + Math.floor((stats.maxCol - stats.minCol) * 0.2);
    var end = orientation === 'horizontal'
      ? stats.maxRow - Math.floor((stats.maxRow - stats.minRow) * 0.2)
      : stats.maxCol - Math.floor((stats.maxCol - stats.minCol) * 0.2);
    var bestIndex = -1;
    var bestCount = Infinity;
    var i;
    for (i = start; i <= end; i += 1) {
      if (counts[i] <= 0) continue;
      if (counts[i] < bestCount) {
        bestCount = counts[i];
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function carveChannelAt(world, stats, orientation, line, width, seed) {
    if (line < 0) return;
    var axisLimit = orientation === 'horizontal' ? world.halfWidth : world.height;
    var step;
    var drift = 0;
    var driftLimit = orientation === 'horizontal' ? 3 : 2;
    for (step = 0; step < axisLimit; step += 1) {
      if (step > 0 && (step % 4) === 0) {
        drift += ((hash2(seed, step, line) % 3) - 1);
        drift = clamp(drift, -driftLimit, driftLimit);
      }
      var bandCenter = line + drift;
      var bandOffset;
      for (bandOffset = -width; bandOffset <= width; bandOffset += 1) {
        var row = orientation === 'horizontal' ? bandCenter + bandOffset : step;
        var col = orientation === 'horizontal' ? step : bandCenter + bandOffset;
        if (row < 0 || row >= world.height || col < 0 || col >= world.halfWidth) continue;
        var tile = world.tiles[(row * world.halfWidth) + col];
        if (!tile || !tile.isLand || tile.continent !== stats.continentId) continue;
        tile.isLand = false;
        tile.continent = -1;
      }
    }
  }

  function fragmentLargestLandmass(world, settings, seed, options) {
    var iterations = Math.max(1, parseIntLoose(options && options.iterations, 1));
    var i;
    for (i = 0; i < iterations; i += 1) {
      var statsList = collectContinentStats(world, settings);
      if (!statsList.length) return;
      var largest = statsList[0];
      var horizontalBand = findWeakBand(largest, 'horizontal');
      var verticalBand = findWeakBand(largest, 'vertical');
      var horizontalSpan = largest.maxRow - largest.minRow;
      var verticalSpan = largest.maxCol - largest.minCol;
      var orientation = horizontalSpan >= verticalSpan ? 'horizontal' : 'vertical';
      if (options && options.preferOrientation) orientation = options.preferOrientation;
      var line = orientation === 'horizontal' ? horizontalBand : verticalBand;
      if (line < 0) {
        orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
        line = orientation === 'horizontal' ? horizontalBand : verticalBand;
      }
      carveChannelAt(world, largest, orientation, line, Math.max(1, parseIntLoose(options && options.width, 1)), (seed + (i * 97)) >>> 0);
      identifyLandContinents(world, settings);
    }
  }

  function fragmentSpecificLandmass(world, settings, stats, seed, options) {
    if (!stats || !stats.members || !stats.members.length) return;
    var horizontalBand = findWeakBand(stats, 'horizontal');
    var verticalBand = findWeakBand(stats, 'vertical');
    var horizontalSpan = stats.maxRow - stats.minRow;
    var verticalSpan = stats.maxCol - stats.minCol;
    var orientation = horizontalSpan >= verticalSpan ? 'horizontal' : 'vertical';
    if (options && options.preferOrientation) orientation = options.preferOrientation;
    var line = orientation === 'horizontal' ? horizontalBand : verticalBand;
    if (line < 0) {
      orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
      line = orientation === 'horizontal' ? horizontalBand : verticalBand;
    }
    carveChannelAt(world, stats, orientation, line, Math.max(1, parseIntLoose(options && options.width, 1)), seed >>> 0);
    identifyLandContinents(world, settings);
  }

  function improveContinentShapes(world, settings, rng) {
    var stats = collectContinentStats(world, settings);
    if (!stats.length) return;
    var totalLand = 0;
    var majorCount = 0;
    var i;
    for (i = 0; i < stats.length; i += 1) {
      totalLand += stats[i].size;
      if (stats[i].size >= 24) majorCount += 1;
    }
    if (settings.landformMode === 1) {
      applyVanillaContinentsSplitPass(world, settings);
      return;
    }
    if (settings.landformMode === 2) {
      enforcePangaea(world, settings, rng);
      return;
    }
  }

  function carveLandBridge(world, settings, continentA, continentB) {
    if (!continentA.length || !continentB.length) return;
    var bestDistance = Infinity;
    var bestA = continentA[0];
    var bestB = continentB[0];
    var i;
    for (i = 0; i < continentA.length; i += 1) {
      var tileA = world.tiles[continentA[i]];
      var j;
      for (j = 0; j < continentB.length; j += 1) {
        var tileB = world.tiles[continentB[j]];
        var dx = Math.abs(tileA.col - tileB.col);
        if (settings.wrapX) dx = Math.min(dx, Math.abs(world.halfWidth - dx));
        var dy = Math.abs(tileA.row - tileB.row);
        if (settings.wrapY) dy = Math.min(dy, Math.abs(world.height - dy));
        var distance = dx + dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestA = continentA[i];
          bestB = continentB[j];
        }
      }
    }
    var a = world.tiles[bestA];
    var b = world.tiles[bestB];
    var col = a.col;
    var row = a.row;
    function fillBridgeCell(centerCol, centerRow) {
      var deltas = [
        { dc: 0, dr: 0 },
        { dc: -1, dr: 0 },
        { dc: 1, dr: 0 },
        { dc: 0, dr: -1 },
        { dc: 0, dr: 1 }
      ];
      var k;
      for (k = 0; k < deltas.length; k += 1) {
        var nextCol = centerCol + deltas[k].dc;
        var nextRow = centerRow + deltas[k].dr;
        if (settings.wrapX) nextCol = wrapCellCoord(nextCol, world.halfWidth);
        if (settings.wrapY) nextRow = wrapCellCoord(nextRow, world.height);
        if (nextCol < 0 || nextCol >= world.halfWidth || nextRow < 0 || nextRow >= world.height) continue;
        var nextIdx = (nextRow * world.halfWidth) + nextCol;
        if (nextIdx >= 0 && nextIdx < world.tiles.length) world.tiles[nextIdx].isLand = true;
      }
    }
    while (col !== b.col || row !== b.row) {
      fillBridgeCell(col, row);
      if (col !== b.col) {
        var deltaCol = b.col > col ? 1 : -1;
        if (settings.wrapX) {
          var direct = b.col - col;
          var wrapped = direct > 0 ? direct - world.halfWidth : direct + world.halfWidth;
          deltaCol = Math.abs(wrapped) < Math.abs(direct) ? (wrapped > 0 ? 1 : -1) : (direct > 0 ? 1 : -1);
        }
        col = wrapCellCoord(col + deltaCol, world.halfWidth);
      }
      if (row !== b.row) {
        var deltaRow = b.row > row ? 1 : -1;
        if (settings.wrapY) {
          var directRow = b.row - row;
          var wrappedRow = directRow > 0 ? directRow - world.height : directRow + world.height;
          deltaRow = Math.abs(wrappedRow) < Math.abs(directRow) ? (wrappedRow > 0 ? 1 : -1) : (directRow > 0 ? 1 : -1);
        }
        row = wrapCellCoord(row + deltaRow, world.height);
      }
    }
    fillBridgeCell(col, row);
  }

  function enforcePangaea(world, settings, rng) {
    var continents = identifyLandContinents(world, settings);
    if (continents.length < 2) return;
    var totalLand = 0;
    var i;
    var attempts = 0;
    for (i = 0; i < continents.length; i += 1) totalLand += continents[i].length;
    while (attempts < 32 &&
           continents.length > 1 &&
           (continents[0].length < Math.floor(totalLand * 0.76) ||
            (continents[1] && continents[1].length > Math.floor(totalLand * 0.14)))) {
      carveLandBridge(world, settings, continents[0], continents[1]);
      smoothLandMask(world, settings, 1);
      continents = identifyLandContinents(world, settings);
      attempts += 1;
    }
    if (rng.float() < 0.55) {
      var largest = continents[0] || [];
      for (i = 0; i < largest.length; i += 1) {
        var tile = world.tiles[largest[i]];
        if (tile.row > Math.floor(world.height * 0.25) && tile.row < Math.floor(world.height * 0.75) && rng.float() < 0.015) {
          tile.isLand = false;
        }
      }
    }
  }

  function erodeArchipelago(world, settings, rng) {
    var continents = identifyLandContinents(world, settings);
    if (!continents.length) return;
    var totalLand = 0;
    var i;
    for (i = 0; i < continents.length; i += 1) totalLand += continents[i].length;
    if (continents[0].length <= Math.floor(totalLand * 0.42)) return;
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    for (i = 0; i < continents[0].length; i += 1) {
      var idx = continents[0][i];
      var tile = world.tiles[idx];
      var neighbors = getNeighborIndexes(world, tile, wrapOptions);
      var landNeighbors = 0;
      var j;
      for (j = 0; j < neighbors.length; j += 1) if (world.tiles[neighbors[j]].isLand) landNeighbors += 1;
      if (landNeighbors <= 4 && rng.float() < 0.16) tile.isLand = false;
    }
    smoothLandMask(world, settings, 1);
  }

  function scatterArchipelago(world, settings, rng) {
    var continents = identifyLandContinents(world, settings);
    if (!continents.length) return;
    var totalLand = 0;
    var i;
    for (i = 0; i < continents.length; i += 1) totalLand += continents[i].length;
    var largest = continents[0];
    if (!largest || largest.length <= Math.floor(totalLand * 0.48)) return;
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    for (i = 0; i < largest.length; i += 1) {
      var tile = world.tiles[largest[i]];
      var neighbors = getNeighborIndexes(world, tile, wrapOptions);
      var landNeighbors = 0;
      var j;
      for (j = 0; j < neighbors.length; j += 1) if (world.tiles[neighbors[j]].isLand) landNeighbors += 1;
      var breakupRoll = fractalNoise2d(settings.seed + 0x5d7, (tile.col + 0.5) / world.halfWidth, (tile.row + 0.5) / world.height, {
        octaves: 3,
        persistence: 0.52,
        lacunarity: 2,
        freqX: 8.5,
        freqY: 7.5,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      if (landNeighbors <= 5 && breakupRoll < 0.43 && rng.float() < 0.7) tile.isLand = false;
      else if (landNeighbors <= 3 && breakupRoll < 0.62) tile.isLand = false;
    }
    smoothLandMask(world, settings, 1);
    identifyLandContinents(world, settings);
  }

  function roughenPangaeaCoastline(world, settings, rng) {
    var continents = identifyLandContinents(world, settings);
    if (!continents.length) return;
    var largest = continents[0];
    if (!largest || largest.length < 200) return;
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var i;
    for (i = 0; i < largest.length; i += 1) {
      var tile = world.tiles[largest[i]];
      var neighbors = getNeighborIndexes(world, tile, wrapOptions);
      var landNeighbors = 0;
      var j;
      for (j = 0; j < neighbors.length; j += 1) if (world.tiles[neighbors[j]].isLand) landNeighbors += 1;
      if (landNeighbors > 5) continue;
      var edgeNoise = fractalNoise2d(settings.seed + 0x6a1, (tile.col + 0.5) / world.halfWidth, (tile.row + 0.5) / world.height, {
        octaves: 3,
        persistence: 0.5,
        lacunarity: 2,
        freqX: 6.5,
        freqY: 5.8,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      if (tile.row > Math.floor(world.height * 0.08) &&
          tile.row < Math.floor(world.height * 0.90) &&
          edgeNoise < 0.38 &&
          rng.float() < 0.38) {
        tile.isLand = false;
      }
    }
    smoothLandMask(world, settings, 1);
    identifyLandContinents(world, settings);
  }

  function assignWaterAndElevation(world, settings) {
    var i;
    var ageRuggedness = settings.ageMode === 2 ? 0.09 : (settings.ageMode === 3 ? -0.08 : 0);
    var elevationHeightMap = heightMapGenerate(world.width, world.height, 2, 1, (settings.seed + 0x9a2112) >>> 0);
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      var u = (tile.col + 0.5) / world.halfWidth;
      var v = (tile.row + 0.5) / world.height;
      var elevation = fractalNoise2d(settings.seed + 0x601, u, v, {
        octaves: 5,
        persistence: 0.6,
        lacunarity: 2,
        freqX: 3.2,
        freqY: 3.2,
        wrapX: !!settings.wrapX,
        wrapY: !!settings.wrapY
      });
      var heightFieldElevation = sampleHeightMap(elevationHeightMap, tile.xPos, tile.yPos, false);
      tile.elevation = clamp((elevation * 0.32) + (heightFieldElevation * 0.5) + (tile.landScore * 0.18) + ageRuggedness, 0, 1);
    }
    classifyWaterDepth(world, settings);
  }

  function classifyWaterDepth(world, settings) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand) {
        tile.baseTerrain = BIQ_TERRAIN.OCEAN;
        tile.realTerrain = BIQ_TERRAIN.OCEAN;
      }
    }
    for (i = 0; i < world.tiles.length; i += 1) {
      var coastTile = world.tiles[i];
      if (coastTile.isLand) continue;
      var neighbors = getNeighborIndexes(world, coastTile, wrapOptions);
      var j;
      for (j = 0; j < neighbors.length; j += 1) {
        if (!world.tiles[neighbors[j]].isLand) continue;
        coastTile.baseTerrain = BIQ_TERRAIN.COAST;
        coastTile.realTerrain = BIQ_TERRAIN.COAST;
        break;
      }
    }
    for (i = 0; i < world.tiles.length; i += 1) {
      var seaTile = world.tiles[i];
      if (seaTile.isLand || seaTile.baseTerrain !== BIQ_TERRAIN.OCEAN) continue;
      var oceanNeighbors = getNeighborIndexes(world, seaTile, wrapOptions);
      var k;
      for (k = 0; k < oceanNeighbors.length; k += 1) {
        if (world.tiles[oceanNeighbors[k]].baseTerrain !== BIQ_TERRAIN.COAST) continue;
        seaTile.baseTerrain = BIQ_TERRAIN.SEA;
        seaTile.realTerrain = BIQ_TERRAIN.SEA;
        break;
      }
    }
  }

  function waterReach(world, tile, settings, maxRadius) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var seen = new Uint8Array(world.tiles.length);
    var queue = [{ index: tile.index, depth: 0 }];
    seen[tile.index] = 1;
    var head = 0;
    while (head < queue.length) {
      var item = queue[head];
      head += 1;
      if (item.depth >= maxRadius) continue;
      var neighbors = getNeighborIndexes(world, world.tiles[item.index], wrapOptions);
      var i;
      for (i = 0; i < neighbors.length; i += 1) {
        var nIdx = neighbors[i];
        if (seen[nIdx]) continue;
        seen[nIdx] = 1;
        if (!world.tiles[nIdx].isLand) return item.depth + 1;
        queue.push({ index: nIdx, depth: item.depth + 1 });
      }
    }
    return maxRadius + 1;
  }

  function climateProfile(settings) {
    var temperature = settings.temperatureMode;
    var aridity = settings.climateMode;
    var profile = {
      jungleThreshold: 4,
      coldBand: 0x32,
      polarBand: 0x3c,
      marshThreshold: 0x0c,
      coastMarshFactor: 5,
      marshChanceJungle: 10,
      marshChanceGrass: 5,
      plainsLow: 0x0e,
      plainsHigh: 0x2a,
      desertLow: 0x11,
      desertHigh: 0x1e
    };
    if (temperature === 0) {
      profile.jungleThreshold = 3;
      profile.coldBand = 0x23;
      profile.polarBand = 0x2d;
      profile.marshThreshold = 0x0a;
      profile.coastMarshFactor = 3;
    } else if (temperature === 2) {
      profile.jungleThreshold = 5;
      profile.coldBand = 0x37;
      profile.polarBand = 0x41;
      profile.marshThreshold = 0x10;
      profile.coastMarshFactor = 7;
    }
    if (aridity === 0) {
      profile.marshChanceJungle = 7;
      profile.marshChanceGrass = 2;
      profile.plainsLow = 0x0c;
      profile.plainsHigh = 0x2c;
      profile.desertLow = 0x0d;
      profile.desertHigh = 0x22;
      profile.jungleThreshold -= 1;
    } else if (aridity === 2) {
      profile.marshChanceJungle = 0x0f;
      profile.marshChanceGrass = 8;
      profile.plainsLow = 0x10;
      profile.plainsHigh = 0x28;
      profile.desertLow = 0x14;
      profile.desertHigh = 0x1b;
      profile.jungleThreshold += 2;
    }
    profile.coldMid = Math.trunc((profile.coldBand + profile.jungleThreshold) / 2);
    return profile;
  }

  function terrainAgeProfile(ageMode) {
    if (ageMode === 0) {
      return { lowA: 18, lowB: 28, midA: 55, highA: 65, highB: 77, nonVolcanoProb: 94 };
    }
    if (ageMode === 2) {
      return { lowA: 21, lowB: 24, midA: 66, highA: 70, highB: 74, nonVolcanoProb: 98 };
    }
    return { lowA: 20, lowB: 25, midA: 63, highA: 70, highB: 77, nonVolcanoProb: 96 };
  }

  function warmHillPlacementRng(settings, tileCount) {
    var rng = createRng((settings.seed + 0xd431) >>> 0);
    var remaining = Math.max(1, parseIntLoose(tileCount, 1));
    var i;
    for (i = 0; i < remaining; i += 1) {
      rng.int(Math.max(1, remaining - i));
    }
    return rng;
  }

  function generateHillsAndMountains(world, settings) {
    var heightMap = heightMapGenerate(world.width, world.height, 2, 1, (settings.seed + 0x9a2112) >>> 0, null);
    var ageProfile = terrainAgeProfile(settings.ageMode);
    var hillLowThreshold = heightMapSeaLevel(heightMap, ageProfile.lowA);
    var hillHighThreshold = heightMapSeaLevel(heightMap, ageProfile.lowB);
    var mountainThreshold = heightMapSeaLevel(heightMap, ageProfile.midA);
    var volcanoThreshold = heightMapSeaLevel(heightMap, ageProfile.highA);
    var ceilingThreshold = heightMapSeaLevel(heightMap, ageProfile.highB);
    var rng = warmHillPlacementRng(settings, world.tileCount);
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand) continue;
      if (tile.baseTerrain !== BIQ_TERRAIN.GRASSLAND) continue;
      tile.realTerrain = BIQ_TERRAIN.GRASSLAND;
      var height = getHeightMapTileHeight(heightMap, tile.xPos, tile.yPos);
      if (height > ceilingThreshold) continue;
      if (height >= volcanoThreshold) {
        tile.realTerrain = rng.int(100) < ageProfile.nonVolcanoProb ? BIQ_TERRAIN.MOUNTAIN : BIQ_TERRAIN.VOLCANO;
        continue;
      }
      if (height >= mountainThreshold) {
        tile.realTerrain = BIQ_TERRAIN.MOUNTAIN;
        continue;
      }
      if (height >= hillLowThreshold && height <= hillHighThreshold) {
        tile.realTerrain = BIQ_TERRAIN.HILLS;
      }
    }
  }

  function assignTerrainBiomes(world, settings) {
    var climateMapFlags = settings.wrapY ? 3 : 9;
    var climateHeightMap = heightMapGenerate(world.width, world.height, 3, climateMapFlags, (settings.seed + 0x1e1735) >>> 0, null);
    var forestHeightMap = heightMapGenerate(world.width, world.height, 5, climateMapFlags, (settings.seed + 0x34b59e) >>> 0, null);
    var forestLowThreshold = heightMapSeaLevel(forestHeightMap, 0x46);
    var forestHighThreshold = heightMapSeaLevel(forestHeightMap, 100);
    var profile = climateProfile(settings);
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand) continue;
      var verticalDistance = Math.abs((world.height / 2) - tile.yPos);
      var latitudeAdjustment = Math.trunc((verticalDistance * 180) / world.height);
      var climateHeight = getHeightMapTileHeight(climateHeightMap, tile.xPos, tile.yPos);
      var climateScore = Math.trunc((((climateHeight - 128) * 30) + (((climateHeight - 128) * 30) >> 31 & 0xff)) / 256) + latitudeAdjustment;
      var coastDistance = waterReach(world, tile, settings, 24);
      var coastCategory = coastDistance <= 8 ? 2 : (coastDistance <= 24 ? 1 : 0);
      climateScore += ((climateScore >= 0x17 && climateScore <= 0x2f) ? (coastCategory * 2) : (-coastCategory));
      var coldForestEligible = climateScore > profile.coldBand;
      if (!coldForestEligible && climateScore > profile.coldMid && rngChanceFromCoord(settings.seed + 0x1e1735, tile.col, tile.row) < 50) {
        coldForestEligible = true;
      }
      tile.temperature = clamp(1 - (climateScore / 90), 0, 1);
      var baseTerrain = BIQ_TERRAIN.GRASSLAND;
      if (climateScore > profile.coldBand && latitudeAdjustment > profile.polarBand) {
        baseTerrain = BIQ_TERRAIN.TUNDRA;
      } else if (climateScore < profile.jungleThreshold) {
        baseTerrain = BIQ_TERRAIN.JUNGLE;
      } else if (climateScore > profile.desertLow && climateScore < profile.desertHigh) {
        baseTerrain = BIQ_TERRAIN.DESERT;
      } else if (climateScore > profile.plainsLow && climateScore < profile.plainsHigh) {
        baseTerrain = BIQ_TERRAIN.PLAINS;
      }
      if (settings.polarIceCaps && Math.abs(((tile.yPos + 0.5) / world.height * 2) - 1) > 0.84) baseTerrain = BIQ_TERRAIN.TUNDRA;
      if ((baseTerrain === BIQ_TERRAIN.GRASSLAND || baseTerrain === BIQ_TERRAIN.JUNGLE) && climateScore < profile.marshThreshold) {
        var marshChance = (baseTerrain === BIQ_TERRAIN.JUNGLE ? profile.marshChanceJungle : profile.marshChanceGrass) +
          (coastCategory * profile.coastMarshFactor);
        if (rngChanceFromCoord(settings.seed + 0x58f1, tile.col, tile.row) < marshChance) {
          baseTerrain = BIQ_TERRAIN.MARSH;
        }
      }
      var realTerrain = tile.realTerrain;
      if (isHillyTerrain(realTerrain)) {
        baseTerrain = BIQ_TERRAIN.GRASSLAND;
      } else if (baseTerrain === BIQ_TERRAIN.JUNGLE || baseTerrain === BIQ_TERRAIN.MARSH) {
        realTerrain = baseTerrain;
      } else if (baseTerrain !== BIQ_TERRAIN.DESERT) {
        var forestHeight = getHeightMapTileHeight(forestHeightMap, tile.xPos, tile.yPos);
        if (baseTerrain === BIQ_TERRAIN.PLAINS) forestHeight -= 10;
        if (forestHeight >= forestLowThreshold && forestHeight <= forestHighThreshold) {
          realTerrain = BIQ_TERRAIN.FOREST;
        }
        tile.moisture = clamp((forestHeight - forestLowThreshold) / Math.max(1, forestHighThreshold - forestLowThreshold), 0, 1);
      } else {
        tile.moisture = clamp((coastCategory * 0.15) + (tile.temperature * 0.1), 0, 1);
      }
      if (realTerrain === BIQ_TERRAIN.FOREST && tile.moisture === 0) {
        tile.moisture = clamp(0.45 + (coastCategory * 0.12), 0, 1);
      }
      if (realTerrain === BIQ_TERRAIN.FOREST) {
        realTerrain = BIQ_TERRAIN.FOREST;
      }
      tile.baseTerrain = baseTerrain;
      tile.realTerrain = realTerrain;
      tile.c3cBonuses = 0;
      if (realTerrain === BIQ_TERRAIN.FOREST && coldForestEligible) {
        tile.c3cBonuses |= BIQ_TILE_BONUS.PINE_FOREST;
      }
      if (realTerrain === BIQ_TERRAIN.MOUNTAIN && (
        coldForestEligible ||
        latitudeAdjustment > (profile.coldMid - 2) ||
        (settings.polarIceCaps && latitudeAdjustment > (profile.polarBand - 8))
      )) {
        tile.c3cBonuses |= BIQ_TILE_BONUS.SNOW_CAPPED_MOUNTAIN;
      }
    }
  }

  function isHillyTerrain(terrain) {
    return terrain === BIQ_TERRAIN.HILLS || terrain === BIQ_TERRAIN.MOUNTAIN || terrain === BIQ_TERRAIN.VOLCANO;
  }

  function rngChanceFromCoord(seed, x, y) {
    return hash2(seed, x, y) % 100;
  }

  function markRiverEdge(tileA, tileB, directionFromA) {
    if (!tileA || !tileB) return;
    if (directionFromA === 'NE') {
      tileA.riverConnectionInfo |= RIVER_MASK.NE;
      tileB.riverConnectionInfo |= RIVER_MASK.SW;
    } else if (directionFromA === 'SE') {
      tileA.riverConnectionInfo |= RIVER_MASK.SE;
      tileB.riverConnectionInfo |= RIVER_MASK.NW;
    } else if (directionFromA === 'SW') {
      tileA.riverConnectionInfo |= RIVER_MASK.SW;
      tileB.riverConnectionInfo |= RIVER_MASK.NE;
    } else if (directionFromA === 'NW') {
      tileA.riverConnectionInfo |= RIVER_MASK.NW;
      tileB.riverConnectionInfo |= RIVER_MASK.SE;
    }
  }

  function riverSourceScore(world, tile, settings) {
    if (!tile || !tile.isLand || tile.continent < 0) return -Infinity;
    if (tile.realTerrain !== BIQ_TERRAIN.HILLS && tile.realTerrain !== BIQ_TERRAIN.MOUNTAIN && tile.realTerrain !== BIQ_TERRAIN.VOLCANO) return -Infinity;
    var coastalDistance = waterReach(world, tile, settings, 6);
    var score = tile.elevation * 140;
    score += Math.min(6, coastalDistance) * 10;
    if (tile.realTerrain === BIQ_TERRAIN.MOUNTAIN) score += 14;
    if (tile.realTerrain === BIQ_TERRAIN.VOLCANO) score += 8;
    if (tile.riverConnectionInfo !== 0) score -= 40;
    return score;
  }

  function shuffleIndexes(count, rng) {
    var order = [];
    var i;
    for (i = 0; i < count; i += 1) order.push(i);
    for (i = count - 1; i > 0; i -= 1) {
      var j = rng.int(i + 1);
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    return order;
  }

  function continentRiverQuotas(world, settings) {
    var continents = identifyLandContinents(world, settings);
    var quotas = new Array(continents.length).fill(0);
    var totalTarget = Math.floor((world.tileCount * 24) / 5000);
    if (totalTarget < 0) totalTarget = 0;
    if (totalTarget > 96) totalTarget = 96;
    var i;
    var largeCount = 0;
    var remainingArea = 0;
    for (i = 0; i < continents.length; i += 1) {
      if (continents[i].length > 72) {
        quotas[i] = 1;
        largeCount += 1;
      } else {
        remainingArea += continents[i].length;
      }
    }
    var remaining = Math.max(0, totalTarget - largeCount);
    for (i = continents.length - 1; i >= 1; i -= 1) {
      if (quotas[i] !== 0 || remainingArea <= 0 || remaining <= 0) continue;
      var share = Math.trunc((continents[i].length * remaining) / remainingArea);
      quotas[i] += share;
      remaining -= share;
      remainingArea -= continents[i].length;
    }
    if (continents.length > 0) quotas[0] += remaining;
    return quotas;
  }

  function getTileByMapCoord(world, settings, xPos, yPos) {
    var wrapped = getWrappedHeightCoord(world, settings, xPos, yPos);
    if (!wrapped) return null;
    var idx = indexByCoord(world.width, world.height, wrapped.xPos, wrapped.yPos);
    if (idx < 0 || idx >= world.tiles.length) return null;
    return world.tiles[idx];
  }

  function riverFertilityScore(world, tile, settings) {
    if (!tile || !tile.isLand || tile.continent < 0) return -Infinity;
    var coastWater = 0;
    var i;
    for (i = 1; i <= 4; i += 1) {
      var nearOffset = neighborDiffToOffset(i);
      var nearTile = getTileByMapCoord(world, settings, tile.xPos + nearOffset.dx, tile.yPos + nearOffset.dy);
      if (nearTile && !nearTile.isLand) coastWater += 1;
    }
    var score = 0;
    for (i = 0; i < 0x31; i += 1) {
      var offset = neighborDiffToOffset(i);
      var probe = getTileByMapCoord(world, settings, tile.xPos + offset.dx, tile.yPos + offset.dy);
      if (!probe || !probe.isLand || probe.continent !== tile.continent) continue;
      var terrain = probe.realTerrain;
      if (terrain === BIQ_TERRAIN.FOREST) terrain = probe.baseTerrain;
      if (terrain === BIQ_TERRAIN.DESERT ||
          terrain === BIQ_TERRAIN.PLAINS ||
          terrain === BIQ_TERRAIN.GRASSLAND ||
          terrain === BIQ_TERRAIN.TUNDRA ||
          terrain === BIQ_TERRAIN.HILLS ||
          terrain === BIQ_TERRAIN.MOUNTAIN ||
          terrain === BIQ_TERRAIN.FOREST ||
          terrain === BIQ_TERRAIN.VOLCANO) {
        if (i < 0x19) score += 0x10;
        if (i < 9) score += 0x10;
        if (i < 1) score += 0x20;
      } else if (terrain === BIQ_TERRAIN.JUNGLE) {
        if (i < 0x19) score += 0x18;
        if (i < 9) score += 0x20;
        if (i < 1) score += 0x40;
      } else if (terrain === BIQ_TERRAIN.MARSH) {
        if (i < 0x19) score += 0x28;
        if (i < 9) score += 0x40;
        if (i < 1) score += 0x40;
      }
    }
    if (coastWater === 1) score += 18;
    else if (coastWater === 2) score += 10;
    score -= waterReach(world, tile, settings, 12) * 3;
    return score;
  }

  function findUpstreamSourceNearTile(world, basinTile, settings) {
    var best = null;
    var i;
    for (i = 0; i < 0x31; i += 1) {
      var offset = neighborDiffToOffset(i);
      var probe = getTileByMapCoord(world, settings, basinTile.xPos + offset.dx, basinTile.yPos + offset.dy);
      if (!probe || !probe.isLand || probe.continent !== basinTile.continent) continue;
      var rugged = isHillyTerrain(probe.realTerrain);
      var score = rugged ? riverSourceScore(world, probe, settings) : -Infinity;
      if (!Number.isFinite(score) || score === -Infinity) continue;
      score += riverFertilityScore(world, basinTile, settings) * 0.15;
      if (!best || score > best.score) best = { tile: probe, score: score };
    }
    return best ? best.tile : null;
  }

  function selectRiverSources(world, settings, rng) {
    var continents = identifyLandContinents(world, settings);
    var quotas = continentRiverQuotas(world, settings);
    var shuffled = shuffleIndexes(world.tiles.length, rng);
    var sources = [];
    var candidatesByContinent = quotas.map(function mapQuota() { return []; });
    var i;
    for (i = 0; i < shuffled.length; i += 1) {
      var tile = world.tiles[shuffled[i]];
      if (!tile.isLand || tile.continent < 0) continue;
      if (!quotas[tile.continent]) continue;
      var fertility = riverFertilityScore(world, tile, settings);
      if (!Number.isFinite(fertility) || fertility <= 0) continue;
      candidatesByContinent[tile.continent].push({ tile: tile, score: fertility });
    }
    for (i = 0; i < candidatesByContinent.length; i += 1) {
      if (!quotas[i]) continue;
      candidatesByContinent[i].sort(function sortRiverCandidates(a, b) { return b.score - a.score; });
      var chosenBasins = [];
      var j;
      for (j = 0; j < candidatesByContinent[i].length && chosenBasins.length < quotas[i]; j += 1) {
        var basinTile = candidatesByContinent[i][j].tile;
        var tooClose = false;
        var k;
        for (k = 0; k < chosenBasins.length; k += 1) {
          if (distanceBetweenTiles(world, basinTile, chosenBasins[k], settings) < 6) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;
        chosenBasins.push(basinTile);
        var sourceTile = findUpstreamSourceNearTile(world, basinTile, settings);
        if (sourceTile) {
          sources.push({
            source: sourceTile,
            basin: basinTile
          });
        }
      }
    }
    sources.sort(function sortSources(a, b) { return b.source.elevation - a.source.elevation; });
    return sources;
  }

  function neighborTouchesWater(world, tile, wrapOptions) {
    var neighbors = getNeighborIndexes(world, tile, wrapOptions);
    var i;
    for (i = 0; i < neighbors.length; i += 1) {
      if (!world.tiles[neighbors[i]].isLand) return true;
    }
    return false;
  }

  function riverStepScore(world, fromTile, candidate, settings, rng, routeState) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var basin = routeState && routeState.basin ? routeState.basin : null;
    var length = routeState && Number.isFinite(routeState.length) ? routeState.length : 0;
    var minLength = routeState && Number.isFinite(routeState.minLength) ? routeState.minLength : 6;
    var score = 0;
    if (!candidate.tile.isLand) score -= length < minLength ? 40 : 240;
    score += candidate.tile.elevation * 90;
    score += waterReach(world, candidate.tile, settings, 8) * 9;
    if (candidate.tile.riverConnectionInfo !== 0) score -= 26;
    if (candidate.tile.realTerrain === BIQ_TERRAIN.MOUNTAIN || candidate.tile.realTerrain === BIQ_TERRAIN.VOLCANO) score += length < 4 ? 8 : 20;
    if (candidate.tile.realTerrain === BIQ_TERRAIN.HILLS) score += length < 5 ? 4 : 12;
    if (candidate.tile.baseTerrain === BIQ_TERRAIN.DESERT) score -= 10;
    if (candidate.tile.baseTerrain === BIQ_TERRAIN.PLAINS) score -= 5;
    if (candidate.tile.baseTerrain === BIQ_TERRAIN.GRASSLAND) score -= 7;
    if (candidate.tile.baseTerrain === BIQ_TERRAIN.FLOODPLAIN) score -= 18;
    if (candidate.tile.elevation > fromTile.elevation) {
      score += (candidate.tile.elevation - fromTile.elevation) * (length < 4 ? 95 : 150);
    } else {
      score -= (fromTile.elevation - candidate.tile.elevation) * 75;
    }
    if (neighborTouchesWater(world, candidate.tile, wrapOptions)) {
      score += length < minLength ? 65 : -18;
    }
    if (basin && candidate.tile.isLand) {
      var currentDistance = distanceBetweenTiles(world, fromTile, basin, settings);
      var nextDistance = distanceBetweenTiles(world, candidate.tile, basin, settings);
      score += (nextDistance - currentDistance) * (length < minLength ? 18 : 7);
      if (nextDistance <= 1) score -= 24;
    }
    score += rng.float() * 5;
    return score;
  }

  function applyFloodplains(world) {
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand) continue;
      if (tile.baseTerrain !== BIQ_TERRAIN.DESERT) continue;
      if (isHillyTerrain(tile.realTerrain)) continue;
      if (tile.riverConnectionInfo === 0) continue;
      tile.baseTerrain = BIQ_TERRAIN.FLOODPLAIN;
      tile.realTerrain = BIQ_TERRAIN.FLOODPLAIN;
      tile.moisture = Math.max(tile.moisture || 0, 0.85);
    }
  }

  function generateRivers(world, settings, rng) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var candidates = selectRiverSources(world, settings, rng);
    var i;
    var riverCount = 0;
    var totalLand = 0;
    for (i = 0; i < world.tiles.length; i += 1) if (world.tiles[i].isLand) totalLand += 1;
    var minimumRivers = Math.max(3, Math.floor(totalLand / 260));
    for (i = 0; i < candidates.length; i += 1) {
      var source = candidates[i].source;
      if (source.riverConnectionInfo !== 0) continue;
      if (traceRiver(world, candidates[i], settings, wrapOptions, rng)) riverCount += 1;
    }
    if (riverCount < minimumRivers) {
      for (i = 0; i < candidates.length && riverCount < minimumRivers; i += 1) {
        var fallbackSource = candidates[i].source;
        if (!fallbackSource.isLand || fallbackSource.riverConnectionInfo !== 0) continue;
        if (forceRiverToWater(world, fallbackSource, settings, wrapOptions)) riverCount += 1;
      }
      for (i = 0; i < world.tiles.length && riverCount < minimumRivers; i += 1) {
        var tile = world.tiles[i];
        if (!tile.isLand || tile.riverConnectionInfo !== 0) continue;
        if (tile.realTerrain !== BIQ_TERRAIN.HILLS && tile.realTerrain !== BIQ_TERRAIN.MOUNTAIN && tile.realTerrain !== BIQ_TERRAIN.VOLCANO) continue;
        if (forceRiverToWater(world, tile, settings, wrapOptions)) {
          riverCount += 1;
        }
      }
    }
    applyFloodplains(world);
  }

  function generateLakes(world, settings, rng) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var continents = identifyLandContinents(world, settings);
    var c;
    for (c = 0; c < continents.length; c += 1) {
      var members = continents[c];
      if (!members || members.length <= 74) continue;
      var candidates = [];
      var i;
      for (i = 0; i < members.length; i += 1) {
        var tile = world.tiles[members[i]];
        if (tile.realTerrain === BIQ_TERRAIN.MOUNTAIN || tile.realTerrain === BIQ_TERRAIN.VOLCANO || tile.realTerrain === BIQ_TERRAIN.HILLS) continue;
        if (tile.riverConnectionInfo !== 0) continue;
        var neighbors = getNeighborIndexes(world, tile, wrapOptions);
        if (neighbors.length < 6) continue;
        var allLand = true;
        var wetNeighborCount = 0;
        var j;
        for (j = 0; j < neighbors.length; j += 1) {
          var neighbor = world.tiles[neighbors[j]];
          if (!neighbor.isLand) {
            allLand = false;
            break;
          }
          if (neighbor.baseTerrain === BIQ_TERRAIN.GRASSLAND || neighbor.baseTerrain === BIQ_TERRAIN.FLOODPLAIN || neighbor.riverConnectionInfo !== 0) {
            wetNeighborCount += 1;
          }
        }
        if (!allLand || wetNeighborCount < 3) continue;
        if (tile.moisture < 0.46) continue;
        candidates.push(tile);
      }
      if (!candidates.length) continue;
      var lakeTile = candidates[rng.int(candidates.length)];
      lakeTile.isLand = false;
      lakeTile.continent = -1;
      lakeTile.riverConnectionInfo = 0;
      lakeTile.c3cBonuses = 0;
      lakeTile.c3cOverlays = 0;
      lakeTile.baseTerrain = BIQ_TERRAIN.COAST;
      lakeTile.realTerrain = BIQ_TERRAIN.COAST;
    }
  }

  function applyPolarIceCapBands(world, settings) {
    if (!settings.polarIceCaps) return;
    var topCapRows = Math.min(3, world.height);
    var bottomStart = Math.max(0, world.height - 3);
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      var inNorthBand = tile.row < topCapRows;
      var inSouthBand = tile.row >= bottomStart;
      if (!inNorthBand && !inSouthBand) continue;
      tile.isLand = false;
      tile.continent = -1;
      tile.riverConnectionInfo = 0;
      tile.c3cBonuses = 0;
      tile.c3cOverlays = 0;
      tile.resource = -1;
      tile.baseTerrain = BIQ_TERRAIN.OCEAN;
      tile.realTerrain = BIQ_TERRAIN.OCEAN;
    }
  }

  function generateBonusGrassland(world, rng) {
    var order = [];
    var i;
    for (i = 0; i < world.tiles.length; i += 1) order.push(i);
    for (i = order.length - 1; i > 0; i -= 1) {
      var j = rng.int(i + 1);
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    for (i = 0; i < order.length; i += 1) {
      var tile = world.tiles[order[i]];
      if (!tile.isLand) continue;
      if (tile.realTerrain !== BIQ_TERRAIN.GRASSLAND) continue;
      if ((tile.c3cBonuses & BIQ_TILE_BONUS.BONUS_GRASSLAND) !== 0) continue;
      if (rng.int(3) === 0) tile.c3cBonuses |= BIQ_TILE_BONUS.BONUS_GRASSLAND;
    }
  }

  function normalizeResourceType(rawValue) {
    var direct = parseIntLoose(rawValue, NaN);
    if (direct === 0 || direct === 1 || direct === 2) return direct;
    var label = String(rawValue == null ? '' : rawValue).trim().toLowerCase();
    if (label.indexOf('lux') >= 0) return BIQ_RESOURCE_TYPE.LUXURY;
    if (label.indexOf('strateg') >= 0) return BIQ_RESOURCE_TYPE.STRATEGIC;
    return BIQ_RESOURCE_TYPE.BONUS;
  }

  function normalizeResourceDefinitions(rawDefs) {
    if (!Array.isArray(rawDefs)) return [];
    var defs = rawDefs.map(function mapDef(def, idx) {
      var type = normalizeResourceType(def && def.type);
      return {
        id: Number.isFinite(def && def.id) ? (def.id | 0) : idx,
        type: type,
        appearanceRatio: Math.max(0, parseIntLoose(def && def.appearanceRatio, 0)),
        disappearanceProbability: Math.max(0, parseIntLoose(def && def.disappearanceProbability, 0)),
        name: String(def && def.name || '')
      };
    });
    defs.sort(function sortById(a, b) { return a.id - b.id; });
    return defs;
  }

  function normalizeTerrainResourceMasks(rawMasks, resourceCount) {
    var masks = new Array(14);
    var terrainId;
    for (terrainId = 0; terrainId < masks.length; terrainId += 1) {
      masks[terrainId] = new Array(resourceCount).fill(false);
    }
    if (!Array.isArray(rawMasks)) return masks;
    for (terrainId = 0; terrainId < rawMasks.length && terrainId < masks.length; terrainId += 1) {
      var row = Array.isArray(rawMasks[terrainId]) ? rawMasks[terrainId] : [];
      var resourceId;
      for (resourceId = 0; resourceId < resourceCount; resourceId += 1) {
        masks[terrainId][resourceId] = !!row[resourceId];
      }
    }
    return masks;
  }

  function shuffledTileIndexes(world, rng) {
    var order = [];
    var i;
    for (i = 0; i < world.tiles.length; i += 1) order.push(i);
    for (i = order.length - 1; i > 0; i -= 1) {
      var j = rng.int(i + 1);
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    return order;
  }

  function getTileAtCell(world, col, row, settings) {
    var nextCol = col;
    var nextRow = row;
    if (settings.wrapX) nextCol = wrapCellCoord(nextCol, world.halfWidth);
    if (settings.wrapY) nextRow = wrapCellCoord(nextRow, world.height);
    if (nextCol < 0 || nextCol >= world.halfWidth || nextRow < 0 || nextRow >= world.height) return null;
    return world.tiles[(nextRow * world.halfWidth) + nextCol];
  }

  function getTilesWithinRadius(world, origin, radius, settings) {
    var out = [];
    var row;
    for (row = origin.row - radius; row <= origin.row + radius; row += 1) {
      var col;
      for (col = origin.col - radius; col <= origin.col + radius; col += 1) {
        if (col === origin.col && row === origin.row) continue;
        var tile = getTileAtCell(world, col, row, settings);
        if (!tile) continue;
        if (distanceBetweenTiles(world, origin, tile, settings) <= radius + 0.35) out.push(tile);
      }
    }
    return out;
  }

  function resourceAllowedOnTile(tile, resourceId, terrainMasks) {
    if (!tile || resourceId < 0) return false;
    var terrainId = clamp(parseIntLoose(tile.baseTerrain, BIQ_TERRAIN.OCEAN), 0, terrainMasks.length - 1);
    var mask = terrainMasks[terrainId];
    return !!(mask && mask[resourceId]);
  }

  function weightedAllowedTerrainCount(terrainMasks, resourceId) {
    var total = 0;
    var terrainId;
    for (terrainId = 0; terrainId < terrainMasks.length; terrainId += 1) {
      if (!terrainMasks[terrainId] || !terrainMasks[terrainId][resourceId]) continue;
      total += terrainId > BIQ_TERRAIN.VOLCANO ? 5 : 1;
    }
    return total;
  }

  function randomAppearanceRatio(resourceDef, rng) {
    if (!resourceDef) return 0;
    if (resourceDef.appearanceRatio > 0) return resourceDef.appearanceRatio;
    return 50 + rng.int(26) + rng.int(26);
  }

  function adjustedResourceTarget(baseCount, weightedTerrainCount, minimumWhenBroad) {
    var target = Math.max(0, baseCount | 0);
    if (weightedTerrainCount <= 0) return 0;
    if (weightedTerrainCount < 2) target = Math.round(target * 0.5);
    else if (weightedTerrainCount < 4) target = Math.round(target * 0.75);
    else target = Math.max(minimumWhenBroad, target);
    return Math.max(1, target);
  }

  function currentSameResourceNeighborCount(world, tile, resourceId, settings) {
    var neighbors = getTilesWithinRadius(world, tile, 1.1, settings);
    var count = 0;
    var i;
    for (i = 0; i < neighbors.length; i += 1) {
      if (neighbors[i].continent !== tile.continent) continue;
      if (neighbors[i].resource === resourceId) count += 1;
    }
    return count;
  }

  function canPlaceResourceAt(world, tile, resourceDef, terrainMasks, settings, preferLargeLuxuryContinent) {
    if (!tile || tile.resource !== -1) return false;
    if (!resourceAllowedOnTile(tile, resourceDef.id, terrainMasks)) return false;
    if (tile.continent < 0 && !isWaterTerrain(tile.baseTerrain)) return false;
    if (resourceDef.type === BIQ_RESOURCE_TYPE.LUXURY) {
      var continentSize = tile.continent >= 0 && world.continentSizes ? (world.continentSizes[tile.continent] || 0) : 0;
      var minContinentSize = preferLargeLuxuryContinent ? 75 : 37;
      if (continentSize < minContinentSize) return false;
    }
    var immediateNeighbors = getTilesWithinRadius(world, tile, 1.1, settings);
    var i;
    for (i = 0; i < immediateNeighbors.length; i += 1) {
      var nearby = immediateNeighbors[i];
      if (nearby.continent !== tile.continent) continue;
      if (nearby.resource === -1) continue;
      if (nearby.resource !== resourceDef.id) return false;
      if (resourceDef.type === BIQ_RESOURCE_TYPE.STRATEGIC) return false;
    }
    if (resourceDef.type === BIQ_RESOURCE_TYPE.LUXURY || resourceDef.type === BIQ_RESOURCE_TYPE.STRATEGIC) {
      var span = Math.floor((world.width + world.height) / 100);
      var searchRadius = span < 5 ? (span + 2) : 6;
      var extended = getTilesWithinRadius(world, tile, searchRadius, settings);
      for (i = 0; i < extended.length; i += 1) {
        var check = extended[i];
        if (check.continent !== tile.continent || check.resource === -1) continue;
        if (resourceDef.type === BIQ_RESOURCE_TYPE.STRATEGIC) {
          if (check.resource === resourceDef.id) return false;
        } else if (check.resource !== resourceDef.id) {
          var otherType = settings.resourceDefsById[check.resource] ? settings.resourceDefsById[check.resource].type : BIQ_RESOURCE_TYPE.BONUS;
          if (otherType === BIQ_RESOURCE_TYPE.LUXURY) return false;
        }
      }
    }
    if (isWaterTerrain(tile.baseTerrain)) {
      var waterBuffer = getTilesWithinRadius(world, tile, 2.1, settings);
      for (i = 0; i < waterBuffer.length; i += 1) {
        if (!isWaterTerrain(waterBuffer[i].baseTerrain)) return false;
      }
    }
    return true;
  }

  function placeResource(world, tile, resourceId, resourceCounts) {
    tile.resource = resourceId;
    resourceCounts[resourceId] = (resourceCounts[resourceId] || 0) + 1;
  }

  function generateResources(world, settings, rng) {
    var defs = settings.resourceDefs;
    if (!Array.isArray(defs) || defs.length === 0) return [];
    var resourceCounts = new Array(defs.length).fill(0);
    var order = shuffledTileIndexes(world, rng);
    var totalBonusPlaced = 0;
    var resourceIdx;
    for (resourceIdx = 0; resourceIdx < defs.length; resourceIdx += 1) {
      var luxury = defs[resourceIdx];
      if (luxury.type !== BIQ_RESOURCE_TYPE.LUXURY) continue;
      var weightedTerrains = weightedAllowedTerrainCount(settings.terrainResourceMasks, luxury.id);
      var desired = adjustedResourceTarget(
        Math.floor((Math.max(1, settings.numCivs) * randomAppearanceRatio(luxury, rng)) / 100),
        weightedTerrains,
        2
      );
      var anchorTile = null;
      var anchorContinent = -1;
      var scanIndex = 0;
      while (resourceCounts[luxury.id] < desired && scanIndex < order.length) {
        var candidate = world.tiles[order[scanIndex]];
        scanIndex += 1;
        var preferLarge = scanIndex < Math.floor((order.length * 2) / 3);
        if (anchorContinent >= 0 && candidate.continent !== anchorContinent) continue;
        if (!canPlaceResourceAt(world, candidate, luxury, settings.terrainResourceMasks, settings, preferLarge)) continue;
        placeResource(world, candidate, luxury.id, resourceCounts);
        anchorTile = anchorTile || candidate;
        anchorContinent = candidate.continent;
        while (anchorTile && resourceCounts[luxury.id] < desired && rng.int(2) === 0) {
          var neighbors = getTilesWithinRadius(world, anchorTile, 1.1, settings);
          var n;
          var placedCluster = false;
          for (n = 0; n < neighbors.length; n += 1) {
            var neighbor = neighbors[n];
            if (neighbor.continent !== anchorContinent) continue;
            if (currentSameResourceNeighborCount(world, neighbor, luxury.id, settings) >= 3) continue;
            if (!canPlaceResourceAt(world, neighbor, luxury, settings.terrainResourceMasks, settings, false)) continue;
            placeResource(world, neighbor, luxury.id, resourceCounts);
            placedCluster = true;
            break;
          }
          if (!placedCluster) break;
        }
      }
    }
    order = shuffledTileIndexes(world, rng);
    for (resourceIdx = 0; resourceIdx < defs.length; resourceIdx += 1) {
      var strategic = defs[resourceIdx];
      if (strategic.type !== BIQ_RESOURCE_TYPE.STRATEGIC) continue;
      var strategicTerrains = weightedAllowedTerrainCount(settings.terrainResourceMasks, strategic.id);
      var strategicTarget = adjustedResourceTarget(
        Math.floor((Math.max(1, settings.numCivs) * randomAppearanceRatio(strategic, rng)) / 100),
        strategicTerrains,
        2
      );
      var remaining = strategicTarget;
      var orderIndex;
      while (remaining > 0) {
        var placed = false;
        for (orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
          var strategicTile = world.tiles[order[orderIndex]];
          if (!canPlaceResourceAt(world, strategicTile, strategic, settings.terrainResourceMasks, settings, false)) continue;
          placeResource(world, strategicTile, strategic.id, resourceCounts);
          remaining -= 1;
          placed = true;
          break;
        }
        if (!placed) break;
      }
    }
    var bonusLimit = Math.floor(world.tileCount / 32);
    while (totalBonusPlaced < bonusLimit) {
      var placedAny = false;
      order = shuffledTileIndexes(world, rng);
      for (resourceIdx = 0; resourceIdx < defs.length; resourceIdx += 1) {
        var bonus = defs[resourceIdx];
        if (bonus.type !== BIQ_RESOURCE_TYPE.BONUS) continue;
        var bonusTerrains = weightedAllowedTerrainCount(settings.terrainResourceMasks, bonus.id);
        if (bonusTerrains <= 0) continue;
        var odds = bonusTerrains < 2 ? 6 : (bonusTerrains < 4 ? 4 : 2);
        if (rng.int(odds) >= 2) continue;
        var orderPos;
        for (orderPos = 0; orderPos < order.length; orderPos += 1) {
          var bonusTile = world.tiles[order[orderPos]];
          if (!canPlaceResourceAt(world, bonusTile, bonus, settings.terrainResourceMasks, settings, false)) continue;
          placeResource(world, bonusTile, bonus.id, resourceCounts);
          totalBonusPlaced += 1;
          placedAny = true;
          break;
        }
        if (totalBonusPlaced >= bonusLimit) break;
      }
      if (!placedAny) break;
    }
    return resourceCounts;
  }

  function canPlaceGoodyHut(world, tile, settings, starts, chosenHuts) {
    if (!tile || !tile.isLand) return false;
    if (tile.realTerrain === BIQ_TERRAIN.MOUNTAIN || tile.realTerrain === BIQ_TERRAIN.VOLCANO || tile.realTerrain === BIQ_TERRAIN.JUNGLE || tile.realTerrain === BIQ_TERRAIN.MARSH) return false;
    if (tile.baseTerrain === BIQ_TERRAIN.TUNDRA || tile.baseTerrain === BIQ_TERRAIN.FLOODPLAIN) return false;
    if (tile.riverConnectionInfo !== 0) return false;
    var i;
    for (i = 0; i < starts.length; i += 1) {
      if (distanceBetweenTiles(world, tile, starts[i], settings) < 5) return false;
    }
    for (i = 0; i < chosenHuts.length; i += 1) {
      if (distanceBetweenTiles(world, tile, chosenHuts[i], settings) < 4) return false;
    }
    return true;
  }

  function generateGoodyHuts(world, settings, rng, starts) {
    var barbarianLevel = parseIntLoose(settings.barbarianMode, 1);
    if (barbarianLevel <= 0) return;
    var targetBase = Math.max(1, Math.floor(world.tileCount / 32));
    var multiplier = barbarianLevel === 1 ? 0.5 : (barbarianLevel === 2 ? 0.75 : (barbarianLevel === 3 ? 1 : 1.2));
    var target = Math.max(1, Math.floor(targetBase * multiplier));
    var candidates = [];
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!canPlaceGoodyHut(world, tile, settings, starts, [])) continue;
      candidates.push(tile);
    }
    var chosen = [];
    for (i = candidates.length - 1; i > 0; i -= 1) {
      var j = rng.int(i + 1);
      var tmp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = tmp;
    }
    for (i = 0; i < candidates.length && chosen.length < target; i += 1) {
      if (!canPlaceGoodyHut(world, candidates[i], settings, starts, chosen)) continue;
      candidates[i].c3cOverlays |= BIQ_TILE_OVERLAY.GOODY_HUT;
      chosen.push(candidates[i]);
    }
  }

  function traceRiver(world, riverPlan, settings, wrapOptions, rng) {
    var source = riverPlan && riverPlan.source ? riverPlan.source : riverPlan;
    var basin = riverPlan && riverPlan.basin ? riverPlan.basin : null;
    var pathTile = source;
    var visited = new Set();
    var length = 0;
    var desiredLength = basin ? distanceBetweenTiles(world, source, basin, settings) + 4 : 8;
    var minLength = clamp(Math.round(desiredLength), 6, 14);
    while (length < 52) {
      visited.add(pathTile.index);
      var directions = ['NW', 'NE', 'SW', 'SE'];
      var best = null;
      var i;
      for (i = 0; i < directions.length; i += 1) {
        var dir = directions[i];
        var nIdx = getNeighborIndex(world, pathTile, dir, wrapOptions);
        if (nIdx < 0) continue;
        var neighbor = world.tiles[nIdx];
        if (neighbor.index === source.index) continue;
        if (visited.has(neighbor.index) && neighbor.isLand) continue;
        if (length < minLength && !neighbor.isLand) continue;
        if (length + 1 < minLength && neighbor.riverConnectionInfo !== 0) continue;
        var score = riverStepScore(world, pathTile, { tile: neighbor, direction: dir }, settings, rng, {
          basin: basin,
          length: length,
          minLength: minLength
        });
        if (!best || score < best.score) best = { tile: neighbor, direction: dir, score: score };
      }
      if (!best) break;
      var joinedExistingRiver = best.tile.riverConnectionInfo !== 0;
      markRiverEdge(pathTile, best.tile, best.direction);
      length += 1;
      if (!best.tile.isLand) return length >= minLength;
      if (joinedExistingRiver && best.tile.index !== pathTile.index && best.tile.index !== source.index && length >= minLength) return true;
      if (neighborTouchesWater(world, best.tile, wrapOptions) && length >= minLength && rng.float() < 0.45) return true;
      if (best.tile.elevation > pathTile.elevation && rng.float() < 0.8) return length >= 4;
      pathTile = best.tile;
    }
    return length >= minLength;
  }

  function forceRiverToWater(world, source, settings, wrapOptions) {
    var pathTile = source;
    var visited = new Set();
    var length = 0;
    while (length < 20) {
      visited.add(pathTile.index);
      var directions = ['NW', 'NE', 'SW', 'SE'];
      var best = null;
      var i;
      for (i = 0; i < directions.length; i += 1) {
        var dir = directions[i];
        var nIdx = getNeighborIndex(world, pathTile, dir, wrapOptions);
        if (nIdx < 0) continue;
        var neighbor = world.tiles[nIdx];
        if (visited.has(neighbor.index) && neighbor.isLand) continue;
        var score = neighbor.isLand ? neighbor.elevation : -1;
        if (neighborTouchesWater(world, neighbor, wrapOptions)) score -= 0.4;
        if (!best || score < best.score) best = { tile: neighbor, direction: dir, score: score };
      }
      if (!best) break;
      markRiverEdge(pathTile, best.tile, best.direction);
      length += 1;
      if (!best.tile.isLand) return length >= 2;
      pathTile = best.tile;
    }
    return length >= 3;
  }

  function terrainInfoByCoord(world, tileMap, xPos, yPos) {
    var key = String(xPos) + ',' + String(yPos);
    var tile = tileMap.get(key);
    if (!tile) return { baseTerrain: BIQ_TERRAIN.COAST, realTerrain: BIQ_TERRAIN.COAST };
    return { baseTerrain: tile.baseTerrain, realTerrain: tile.realTerrain };
  }

  function chooseTerrainTransitionSecondary(neighbors, preferred) {
    var i;
    for (i = 0; i < preferred.length; i += 1) {
      if (neighbors.indexOf(preferred[i]) !== -1) return preferred[i];
    }
    return preferred[0];
  }

  function terrainSpec(southBase, westBase, northBase, eastBase) {
    var neighbors = [southBase, westBase, northBase, eastBase];
    if (southBase === BIQ_TERRAIN.OCEAN && westBase === BIQ_TERRAIN.OCEAN && northBase === BIQ_TERRAIN.OCEAN && eastBase === BIQ_TERRAIN.OCEAN) {
      return { file: 8, image: 0, needImage: false, terr2: 0, terr3: 0 };
    }
    if (southBase === BIQ_TERRAIN.SEA && westBase === BIQ_TERRAIN.SEA && northBase === BIQ_TERRAIN.SEA && eastBase === BIQ_TERRAIN.SEA) {
      return { file: 7, image: 0, needImage: false, terr2: 0, terr3: 0 };
    }
    if (neighbors.some(function hasTundra(t) { return t === BIQ_TERRAIN.TUNDRA; })) {
      return {
        file: 0,
        needImage: true,
        terr2: chooseTerrainTransitionSecondary(neighbors, [
          BIQ_TERRAIN.PLAINS,
          BIQ_TERRAIN.GRASSLAND,
          BIQ_TERRAIN.DESERT
        ]),
        terr3: BIQ_TERRAIN.COAST
      };
    }
    if (neighbors.some(function hasSea(t) { return t === BIQ_TERRAIN.SEA; })) {
      return { file: 6, needImage: true, terr2: BIQ_TERRAIN.SEA, terr3: BIQ_TERRAIN.OCEAN };
    }
    if (neighbors.every(function noCoast(t) { return t !== BIQ_TERRAIN.COAST; })) {
      return { file: 4, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.PLAINS };
    }
    if (neighbors.some(function hasDesert(t) { return t === BIQ_TERRAIN.DESERT; })) {
      if (neighbors.some(function hasPlains(t) { return t === BIQ_TERRAIN.PLAINS; })) {
        return { file: 3, needImage: true, terr2: BIQ_TERRAIN.PLAINS, terr3: BIQ_TERRAIN.COAST };
      }
      if (neighbors.some(function hasGrass(t) { return t === BIQ_TERRAIN.GRASSLAND; })) {
        return { file: 2, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
      }
      if (neighbors.some(function hasCoast(t) { return t === BIQ_TERRAIN.COAST; })) {
        return { file: 2, needImage: true, terr2: BIQ_TERRAIN.PLAINS, terr3: BIQ_TERRAIN.COAST };
      }
      return null;
    }
    if (neighbors.some(function hasPlains2(t) { return t === BIQ_TERRAIN.PLAINS; })) {
      return { file: 1, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
    }
    if (neighbors.some(function hasGrass2(t) { return t === BIQ_TERRAIN.GRASSLAND; })) {
      return { file: 5, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
    }
    if (neighbors.some(function hasCoast2(t) { return t === BIQ_TERRAIN.COAST; })) {
      return { file: 6, needImage: true, terr2: BIQ_TERRAIN.SEA, terr3: BIQ_TERRAIN.OCEAN };
    }
    return null;
  }

  function assignTerrainGraphics(world) {
    var tileMap = new Map();
    var i;
    for (i = 0; i < world.tiles.length; i += 1) tileMap.set(String(world.tiles[i].xPos) + ',' + String(world.tiles[i].yPos), world.tiles[i]);
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      var south = terrainInfoByCoord(world, tileMap, tile.xPos, tile.yPos).baseTerrain;
      var west = terrainInfoByCoord(world, tileMap, tile.xPos - 1, tile.yPos - 1).baseTerrain;
      var north = terrainInfoByCoord(world, tileMap, tile.xPos, tile.yPos - 2).baseTerrain;
      var east = terrainInfoByCoord(world, tileMap, tile.xPos + 1, tile.yPos - 1).baseTerrain;
      var spec = terrainSpec(south, west, north, east);
      if (!spec) continue;
      tile.file = spec.file;
      if (!spec.needImage) {
        tile.image = spec.image;
        continue;
      }
      var sum = 0;
      if (north === spec.terr2) sum += 1;
      if (north === spec.terr3) sum += 2;
      if (west === spec.terr2) sum += 3;
      if (west === spec.terr3) sum += 6;
      if (east === spec.terr2) sum += 9;
      if (east === spec.terr3) sum += 18;
      if (south === spec.terr2) sum += 27;
      if (south === spec.terr3) sum += 54;
      tile.image = sum;
    }
  }

  function scoreStartTile(world, tile, wrapOptions) {
    if (!tile.isLand) return -Infinity;
    if (tile.realTerrain === BIQ_TERRAIN.MOUNTAIN || tile.realTerrain === BIQ_TERRAIN.VOLCANO || tile.realTerrain === BIQ_TERRAIN.MARSH || tile.realTerrain === BIQ_TERRAIN.JUNGLE) return -Infinity;
    var score = 0;
    if (tile.baseTerrain === BIQ_TERRAIN.GRASSLAND) score += 6;
    else if (tile.baseTerrain === BIQ_TERRAIN.PLAINS) score += 4;
    else if (tile.baseTerrain === BIQ_TERRAIN.FLOODPLAIN) score += 7;
    else if (tile.baseTerrain === BIQ_TERRAIN.DESERT || tile.baseTerrain === BIQ_TERRAIN.TUNDRA) score -= 3;
    if (tile.realTerrain === BIQ_TERRAIN.FOREST) score += 1;
    if (tile.realTerrain === BIQ_TERRAIN.HILLS) score += 0.5;
    if (tile.riverConnectionInfo !== 0) score += 3;
    var neighbors = getNeighborIndexes(world, tile, wrapOptions);
    var i;
    for (i = 0; i < neighbors.length; i += 1) {
      var neighbor = world.tiles[neighbors[i]];
      if (!neighbor.isLand) score += 0.8;
      else if (neighbor.baseTerrain === BIQ_TERRAIN.GRASSLAND) score += 1.4;
      else if (neighbor.baseTerrain === BIQ_TERRAIN.PLAINS) score += 0.8;
      else if (neighbor.baseTerrain === BIQ_TERRAIN.FLOODPLAIN) score += 1.6;
      if (neighbor.riverConnectionInfo !== 0) score += 0.4;
    }
    return score;
  }

  function distanceBetweenTiles(world, a, b, settings) {
    var dx = Math.abs(a.col - b.col);
    if (settings.wrapX) dx = Math.min(dx, Math.abs(world.halfWidth - dx));
    var dy = Math.abs(a.row - b.row);
    if (settings.wrapY) dy = Math.min(dy, Math.abs(world.height - dy));
    return Math.sqrt((dx * dx) + (dy * dy));
  }

  function chooseStartingLocations(world, settings) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var civCount = Math.max(1, Math.min(20, parseIntLoose(settings.numCivs, 8)));
    var distanceFloor = Math.max(4, parseIntLoose(settings.distanceBetweenCivs, 20) / 2.2);
    var candidates = [];
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      var score = scoreStartTile(world, tile, wrapOptions);
      if (score === -Infinity) continue;
      candidates.push({ tile: tile, score: score });
    }
    candidates.sort(function sortCandidates(a, b) { return b.score - a.score; });
    var picks = [];
    for (i = 0; i < candidates.length && picks.length < civCount; i += 1) {
      var candidate = candidates[i].tile;
      var tooClose = false;
      var j;
      for (j = 0; j < picks.length; j += 1) {
        if (distanceBetweenTiles(world, candidate, picks[j], settings) < distanceFloor) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      picks.push(candidate);
    }
    return picks;
  }

  function generate(spec) {
    var mapSeed = parseIntLoose(spec.mapSeed, 12461875);
    var rng = createRng(mapSeed);
    var settings = {
      seed: mapSeed,
      wrapX: !!spec.xWrapping,
      wrapY: !!spec.yWrapping,
      polarIceCaps: !!spec.polarIceCaps,
      landformMode: getLandformMode(spec.selectedLandform, rng),
      temperatureMode: getTemperatureMode(spec.selectedTemperature, rng),
      climateMode: getClimateMode(spec.selectedClimate, rng),
      ageMode: getAgeMode(spec.selectedAge, rng),
      oceanMode: getOceanMode(spec.selectedOcean, rng),
      barbarianMode: getBarbarianMode(spec.selectedBarbarian, rng),
      numCivs: parseIntLoose(spec.numCivs, 8),
      distanceBetweenCivs: parseIntLoose(spec.distanceBetweenCivs, 20),
      resourceDefs: normalizeResourceDefinitions(spec.resourceDefs),
      terrainResourceMasks: []
    };
    settings.resourceDefsById = {};
    var resourceCount = settings.resourceDefs.length;
    settings.terrainResourceMasks = normalizeTerrainResourceMasks(spec.terrainResourceMasks, resourceCount);
    var rd;
    for (rd = 0; rd < settings.resourceDefs.length; rd += 1) {
      settings.resourceDefsById[settings.resourceDefs[rd].id] = settings.resourceDefs[rd];
    }
    var world = createWorld(spec);
    buildLand(world, settings, rng);
    improveContinentShapes(world, settings, rng);
    var continents = identifyLandContinents(world, settings);
    assignWaterAndElevation(world, settings);
    generateHillsAndMountains(world, settings);
    assignTerrainBiomes(world, settings);
    applyPolarIceCapBands(world, settings);
    generateLakes(world, settings, rng);
    continents = identifyLandContinents(world, settings);
    world.continentSizes = {};
    var continentIdx;
    for (continentIdx = 0; continentIdx < continents.length; continentIdx += 1) {
      if (continents[continentIdx] && continents[continentIdx].length > 0) {
        world.continentSizes[world.tiles[continents[continentIdx][0]].continent] = continents[continentIdx].length;
      }
    }
    classifyWaterDepth(world, settings);
    generateRivers(world, settings, rng);
    continents = identifyLandContinents(world, settings);
    world.continentSizes = {};
    for (continentIdx = 0; continentIdx < continents.length; continentIdx += 1) {
      if (continents[continentIdx] && continents[continentIdx].length > 0) {
        world.continentSizes[world.tiles[continents[continentIdx][0]].continent] = continents[continentIdx].length;
      }
    }
    assignTerrainGraphics(world);
    var resourceOccurrences = generateResources(world, settings, rng);
    generateGoodyHuts(world, settings, rng, []);
    generateBonusGrassland(world, rng);
    var starts = chooseStartingLocations(world, settings);
    var s;
    for (s = 0; s < starts.length; s += 1) starts[s].c3cBonuses |= BIQ_TILE_BONUS.PLAYER_START;
    return {
      width: world.width,
      height: world.height,
      tileCount: world.tileCount,
      mapSeed: mapSeed,
      settings: settings,
      actuals: {
        selectedLandform: parseIntLoose(spec.selectedLandform, 1),
        actualLandform: settings.landformMode,
        selectedTemperature: parseIntLoose(spec.selectedTemperature, 1),
        actualTemperature: settings.temperatureMode,
        selectedClimate: parseIntLoose(spec.selectedClimate, 1),
        actualClimate: settings.climateMode,
        selectedAge: parseIntLoose(spec.selectedAge, 1),
        actualAge: settings.ageMode,
        selectedOcean: parseIntLoose(spec.selectedOcean, 1),
        actualOcean: settings.oceanMode,
        selectedBarbarian: parseIntLoose(spec.selectedBarbarian, 1),
        actualBarbarian: settings.barbarianMode
      },
      tiles: world.tiles.map(function mapTile(tile) {
        return {
          index: tile.index,
          xPos: tile.xPos,
          yPos: tile.yPos,
          continent: tile.continent,
          resource: tile.resource,
          riverConnectionInfo: tile.riverConnectionInfo >>> 0,
          c3cOverlays: tile.c3cOverlays >>> 0,
          c3cBonuses: tile.c3cBonuses >>> 0,
          file: tile.file,
          image: tile.image,
          packedTerrain: packTerrain(tile.baseTerrain, tile.realTerrain),
          baseTerrain: tile.baseTerrain,
          realTerrain: tile.realTerrain
        };
      }),
      continents: continents.map(function mapContinent(members) {
        return { continentClass: 0, numTiles: members.length };
      }),
      resourceOccurrences: resourceOccurrences,
      startingLocations: starts.map(function mapStart(tile) {
        return { ownerType: 0, owner: -1, x: tile.xPos, y: tile.yPos };
      })
    };
  }

  return {
    BIQ_TERRAIN: BIQ_TERRAIN,
    BIQ_RESOURCE_TYPE: BIQ_RESOURCE_TYPE,
    BIQ_TILE_BONUS: BIQ_TILE_BONUS,
    packTerrain: packTerrain,
    generate: generate,
    tileCoordsByIndex: tileCoordsByIndex,
    indexByCoord: indexByCoord
  };
}));
