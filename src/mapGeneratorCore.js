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
        return ((this.next() >>> 8) & 0x00ffffff) / 0x01000000;
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
      total += valueNoise2d(seed + (i * 1013), x, y, freqX, freqY, true, !!(options && options.wrapY)) * amp;
      norm += amp;
      amp *= persistence;
      freqX *= lacunarity;
      freqY *= lacunarity;
    }
    return norm > 0 ? total / norm : 0;
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

  function getLandformMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 2);
    if (v === 0) return [1, 2, 3][rng.int(3)];
    if (v === 1 || v === 2 || v === 3) return v;
    return 2;
  }

  function getTemperatureMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 0) return [3, 1, 2][rng.int(3)];
    if (v === 1 || v === 2 || v === 3) return v;
    return 1;
  }

  function getClimateMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 0) return [3, 1, 2][rng.int(3)];
    if (v === 1 || v === 2 || v === 3) return v;
    return 1;
  }

  function getAgeMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 1);
    if (v === 0) return [2, 1, 3][rng.int(3)];
    if (v === 1 || v === 2 || v === 3) return v;
    return 1;
  }

  function getOceanMode(rawValue, rng) {
    var v = parseIntLoose(rawValue, 3);
    if (v === 0 || v === 1) return [2, 3, 4][rng.int(3)];
    if (v === 2 || v === 3 || v === 4) return v;
    return 3;
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
    var landScores = [];
    var targetOceanPct = settings.oceanMode === 2 ? 0.60 : (settings.oceanMode === 4 ? 0.80 : 0.70);
    var targetLandFraction = 1 - targetOceanPct;
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
        wrapY: !!settings.wrapY
      });
      var detail = fractalNoise2d(settings.seed + 0x211, u, v, {
        octaves: 4,
        persistence: 0.52,
        lacunarity: 2,
        freqX: 6,
        freqY: 5,
        wrapY: !!settings.wrapY
      });
      var ridge = fractalNoise2d(settings.seed + 0x333, u, v, {
        octaves: 3,
        persistence: 0.5,
        lacunarity: 2,
        freqX: 1.3,
        freqY: 1.1,
        wrapY: !!settings.wrapY
      });
      var centerMask = 1 - clamp(Math.sqrt((((u - 0.5) / 0.45) * ((u - 0.5) / 0.45)) + (((v - 0.55) / 0.65) * ((v - 0.55) / 0.65))), 0, 1);
      var score;
      if (settings.landformMode === 1) {
        score = (shape * 0.55) + (detail * 0.45) - 0.10 - (latitude * 0.04);
      } else if (settings.landformMode === 3) {
        score = (shape * 0.42) + (ridge * 0.16) + (detail * 0.12) + (centerMask * 0.34) - (Math.abs(u - 0.5) * 0.06);
      } else {
        score = (shape * 0.56) + (detail * 0.22) + (centerMask * 0.12) + (ridge * 0.10) - (latitude * 0.03);
      }
      tile.landScore = score;
      landScores.push(score);
    }
    var threshold = percentileThreshold(landScores, targetLandFraction);
    for (i = 0; i < world.tiles.length; i += 1) {
      world.tiles[i].isLand = world.tiles[i].landScore >= threshold;
    }
    smoothLandMask(world, settings, 3);
    if (settings.landformMode === 3) enforcePangaea(world, settings, rng);
    if (settings.landformMode === 1) erodeArchipelago(world, settings, rng);
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
    while (col !== b.col || row !== b.row) {
      var idx = (row * world.halfWidth) + col;
      if (idx >= 0 && idx < world.tiles.length) world.tiles[idx].isLand = true;
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
    var lastIdx = (row * world.halfWidth) + col;
    if (lastIdx >= 0 && lastIdx < world.tiles.length) world.tiles[lastIdx].isLand = true;
  }

  function enforcePangaea(world, settings, rng) {
    var continents = identifyLandContinents(world, settings);
    if (continents.length < 2) return;
    var totalLand = 0;
    var i;
    for (i = 0; i < continents.length; i += 1) totalLand += continents[i].length;
    while (continents.length > 1 && continents[0].length < Math.floor(totalLand * 0.55)) {
      carveLandBridge(world, settings, continents[0], continents[1]);
      smoothLandMask(world, settings, 1);
      continents = identifyLandContinents(world, settings);
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

  function assignWaterAndElevation(world, settings) {
    var i;
    var ageRuggedness = settings.ageMode === 2 ? 0.09 : (settings.ageMode === 3 ? -0.08 : 0);
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
        wrapY: !!settings.wrapY
      });
      tile.elevation = clamp((elevation * 0.8) + (tile.landScore * 0.25) + ageRuggedness, 0, 1);
    }
    classifyWaterDepth(world, settings);
    assignTerrainBiomes(world, settings);
  }

  function classifyWaterDepth(world, settings) {
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (tile.isLand) continue;
      var radius1Land = false;
      var radius2Land = false;
      var neighbors = getNeighborIndexes(world, tile, wrapOptions);
      var j;
      for (j = 0; j < neighbors.length; j += 1) {
        if (world.tiles[neighbors[j]].isLand) {
          radius1Land = true;
          break;
        }
      }
      if (!radius1Land) {
        var k;
        for (k = 0; k < neighbors.length; k += 1) {
          var second = getNeighborIndexes(world, world.tiles[neighbors[k]], wrapOptions);
          var m;
          for (m = 0; m < second.length; m += 1) {
            if (world.tiles[second[m]].isLand) {
              radius2Land = true;
              break;
            }
          }
          if (radius2Land) break;
        }
      }
      if (radius1Land) {
        tile.baseTerrain = BIQ_TERRAIN.COAST;
        tile.realTerrain = BIQ_TERRAIN.COAST;
      } else if (radius2Land) {
        tile.baseTerrain = BIQ_TERRAIN.SEA;
        tile.realTerrain = BIQ_TERRAIN.SEA;
      } else {
        tile.baseTerrain = BIQ_TERRAIN.OCEAN;
        tile.realTerrain = BIQ_TERRAIN.OCEAN;
      }
    }
  }

  function assignTerrainBiomes(world, settings) {
    var i;
    var climateBias = settings.climateMode === 3 ? -0.18 : (settings.climateMode === 2 ? 0.18 : 0);
    var tempBias = settings.temperatureMode === 3 ? -0.16 : (settings.temperatureMode === 2 ? 0.16 : 0);
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand) continue;
      var u = (tile.col + 0.5) / world.halfWidth;
      var v = (tile.row + 0.5) / world.height;
      var latitude = Math.abs((v * 2) - 1);
      var tempNoise = fractalNoise2d(settings.seed + 0x713, u, v, {
        octaves: 4,
        persistence: 0.52,
        lacunarity: 2,
        freqX: 3.6,
        freqY: 2.6,
        wrapY: !!settings.wrapY
      });
      var moistureNoise = fractalNoise2d(settings.seed + 0x845, u, v, {
        octaves: 4,
        persistence: 0.56,
        lacunarity: 2,
        freqX: 4.2,
        freqY: 3.4,
        wrapY: !!settings.wrapY
      });
      var temperature = clamp((1 - latitude) + ((tempNoise - 0.5) * 0.28) + tempBias, 0, 1);
      var moisture = clamp(0.5 + ((moistureNoise - 0.5) * 0.75) + climateBias - Math.max(0, tile.elevation - 0.72), 0, 1);
      tile.temperature = temperature;
      tile.moisture = moisture;
      var baseTerrain = BIQ_TERRAIN.GRASSLAND;
      if (latitude > (settings.polarIceCaps ? 0.84 : 0.91) || temperature < 0.16) baseTerrain = BIQ_TERRAIN.TUNDRA;
      else if (moisture < 0.18 && temperature > 0.56) baseTerrain = BIQ_TERRAIN.DESERT;
      else if (moisture < 0.38) baseTerrain = BIQ_TERRAIN.PLAINS;
      else baseTerrain = BIQ_TERRAIN.GRASSLAND;
      var realTerrain = baseTerrain;
      var mountainThreshold = settings.ageMode === 2 ? 0.82 : (settings.ageMode === 3 ? 0.91 : 0.86);
      var hillThreshold = settings.ageMode === 2 ? 0.68 : (settings.ageMode === 3 ? 0.80 : 0.74);
      if (tile.elevation >= mountainThreshold) {
        realTerrain = BIQ_TERRAIN.MOUNTAIN;
        if (temperature > 0.42 && temperature < 0.72 && moisture < 0.48 && fractalNoise2d(settings.seed + 0x977, u, v, {
          octaves: 2,
          persistence: 0.5,
          lacunarity: 2,
          freqX: 7,
          freqY: 7,
          wrapY: !!settings.wrapY
        }) > 0.78) {
          realTerrain = BIQ_TERRAIN.VOLCANO;
        }
      } else if (tile.elevation >= hillThreshold) {
        realTerrain = BIQ_TERRAIN.HILLS;
      } else if (moisture > 0.82 && temperature > 0.55 && tile.elevation < 0.54) {
        realTerrain = BIQ_TERRAIN.MARSH;
      } else if (moisture > 0.72 && temperature > 0.58 && tile.elevation < 0.7) {
        realTerrain = BIQ_TERRAIN.JUNGLE;
        if (baseTerrain === BIQ_TERRAIN.DESERT) baseTerrain = BIQ_TERRAIN.PLAINS;
      } else if (moisture > 0.56 && temperature > 0.18 && temperature < 0.78) {
        realTerrain = BIQ_TERRAIN.FOREST;
      }
      tile.baseTerrain = baseTerrain;
      tile.realTerrain = realTerrain;
      tile.c3cBonuses = 0;
      if (realTerrain === BIQ_TERRAIN.FOREST && (baseTerrain === BIQ_TERRAIN.TUNDRA || temperature < 0.32)) {
        tile.c3cBonuses |= BIQ_TILE_BONUS.PINE_FOREST;
      }
      if (realTerrain === BIQ_TERRAIN.MOUNTAIN && (baseTerrain === BIQ_TERRAIN.TUNDRA || temperature < 0.18)) {
        tile.c3cBonuses |= BIQ_TILE_BONUS.SNOW_CAPPED_MOUNTAIN;
      }
    }
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

  function generateRivers(world, settings, rng) {
    var candidates = [];
    var i;
    for (i = 0; i < world.tiles.length; i += 1) {
      var tile = world.tiles[i];
      if (!tile.isLand) continue;
      if (tile.realTerrain !== BIQ_TERRAIN.HILLS && tile.realTerrain !== BIQ_TERRAIN.MOUNTAIN && tile.realTerrain !== BIQ_TERRAIN.VOLCANO) continue;
      if (tile.continent < 0) continue;
      candidates.push(tile);
    }
    candidates.sort(function sortSources(a, b) { return b.elevation - a.elevation; });
    var targetCount = Math.max(3, Math.floor(candidates.length / 18));
    var wrapOptions = { wrapX: !!settings.wrapX, wrapY: !!settings.wrapY };
    var sourceStep = Math.max(1, Math.floor(candidates.length / targetCount));
    for (i = 0; i < candidates.length && targetCount > 0; i += sourceStep) {
      var source = candidates[i];
      if (source.riverConnectionInfo !== 0) continue;
      if (rng.float() > 0.85) continue;
      if (traceRiver(world, source, settings, wrapOptions, rng)) targetCount -= 1;
    }
    for (i = 0; i < world.tiles.length; i += 1) {
      var t = world.tiles[i];
      if (t.baseTerrain === BIQ_TERRAIN.DESERT && t.riverConnectionInfo !== 0) {
        t.baseTerrain = BIQ_TERRAIN.FLOODPLAIN;
        t.realTerrain = BIQ_TERRAIN.FLOODPLAIN;
      }
    }
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

  function traceRiver(world, source, settings, wrapOptions, rng) {
    var pathTile = source;
    var visited = new Set();
    var length = 0;
    while (length < 32) {
      visited.add(pathTile.index);
      var directions = ['NW', 'NE', 'SW', 'SE'];
      var best = null;
      var i;
      for (i = 0; i < directions.length; i += 1) {
        var dir = directions[i];
        var nIdx = getNeighborIndex(world, pathTile, dir, wrapOptions);
        if (nIdx < 0) continue;
        var neighbor = world.tiles[nIdx];
        var score = neighbor.elevation + (neighbor.isLand ? 0 : -0.35) + (rng.float() * 0.03);
        if (neighbor.index === source.index) continue;
        if (visited.has(neighbor.index) && neighbor.isLand) continue;
        if (!best || score < best.score) best = { tile: neighbor, direction: dir, score: score };
      }
      if (!best) break;
      markRiverEdge(pathTile, best.tile, best.direction);
      length += 1;
      if (!best.tile.isLand) return length >= 3;
      if (best.tile.elevation > pathTile.elevation && rng.float() < 0.65) return length >= 4;
      pathTile = best.tile;
    }
    return length >= 4;
  }

  function terrainInfoByCoord(world, tileMap, xPos, yPos) {
    var key = String(xPos) + ',' + String(yPos);
    var tile = tileMap.get(key);
    if (!tile) return { baseTerrain: BIQ_TERRAIN.COAST, realTerrain: BIQ_TERRAIN.COAST };
    return { baseTerrain: tile.baseTerrain, realTerrain: tile.realTerrain };
  }

  function terrainSpec(southBase, westBase, northBase, eastBase) {
    if (southBase === BIQ_TERRAIN.OCEAN && westBase === BIQ_TERRAIN.OCEAN && northBase === BIQ_TERRAIN.OCEAN && eastBase === BIQ_TERRAIN.OCEAN) {
      return { file: 8, image: 0, needImage: false, terr2: 0, terr3: 0 };
    }
    if (southBase === BIQ_TERRAIN.SEA && westBase === BIQ_TERRAIN.SEA && northBase === BIQ_TERRAIN.SEA && eastBase === BIQ_TERRAIN.SEA) {
      return { file: 7, image: 0, needImage: false, terr2: 0, terr3: 0 };
    }
    if ([southBase, westBase, northBase, eastBase].some(function hasTundra(t) { return t === BIQ_TERRAIN.TUNDRA; })) {
      return { file: 0, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
    }
    if ([southBase, westBase, northBase, eastBase].some(function hasSea(t) { return t === BIQ_TERRAIN.SEA; })) {
      return { file: 6, needImage: true, terr2: BIQ_TERRAIN.SEA, terr3: BIQ_TERRAIN.OCEAN };
    }
    if ([southBase, westBase, northBase, eastBase].every(function noCoast(t) { return t !== BIQ_TERRAIN.COAST; })) {
      return { file: 4, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.PLAINS };
    }
    if ([southBase, westBase, northBase, eastBase].some(function hasDesert(t) { return t === BIQ_TERRAIN.DESERT; })) {
      if ([southBase, westBase, northBase, eastBase].some(function hasPlains(t) { return t === BIQ_TERRAIN.PLAINS; })) {
        return { file: 3, needImage: true, terr2: BIQ_TERRAIN.PLAINS, terr3: BIQ_TERRAIN.COAST };
      }
      if ([southBase, westBase, northBase, eastBase].some(function hasGrass(t) { return t === BIQ_TERRAIN.GRASSLAND; })) {
        return { file: 2, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
      }
      if ([southBase, westBase, northBase, eastBase].some(function hasCoast(t) { return t === BIQ_TERRAIN.COAST; })) {
        return { file: 2, needImage: true, terr2: BIQ_TERRAIN.PLAINS, terr3: BIQ_TERRAIN.COAST };
      }
      return null;
    }
    if ([southBase, westBase, northBase, eastBase].some(function hasPlains2(t) { return t === BIQ_TERRAIN.PLAINS; })) {
      return { file: 1, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
    }
    if ([southBase, westBase, northBase, eastBase].some(function hasGrass2(t) { return t === BIQ_TERRAIN.GRASSLAND; })) {
      return { file: 5, needImage: true, terr2: BIQ_TERRAIN.GRASSLAND, terr3: BIQ_TERRAIN.COAST };
    }
    if ([southBase, westBase, northBase, eastBase].some(function hasCoast2(t) { return t === BIQ_TERRAIN.COAST; })) {
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
      barbarianMode: parseIntLoose(spec.selectedBarbarian, 1),
      numCivs: parseIntLoose(spec.numCivs, 8),
      distanceBetweenCivs: parseIntLoose(spec.distanceBetweenCivs, 20)
    };
    var world = createWorld(spec);
    buildLand(world, settings, rng);
    var continents = identifyLandContinents(world, settings);
    assignWaterAndElevation(world, settings);
    generateLakes(world, settings, rng);
    continents = identifyLandContinents(world, settings);
    classifyWaterDepth(world, settings);
    generateRivers(world, settings, rng);
    continents = identifyLandContinents(world, settings);
    assignTerrainGraphics(world);
    var starts = chooseStartingLocations(world, settings);
    var s;
    for (s = 0; s < starts.length; s += 1) starts[s].c3cBonuses |= BIQ_TILE_BONUS.PLAYER_START;
    generateGoodyHuts(world, settings, rng, starts);
    generateBonusGrassland(world, rng);
    return {
      width: world.width,
      height: world.height,
      tileCount: world.tileCount,
      mapSeed: mapSeed,
      settings: settings,
      tiles: world.tiles.map(function mapTile(tile) {
        return {
          index: tile.index,
          xPos: tile.xPos,
          yPos: tile.yPos,
          continent: tile.continent,
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
      startingLocations: starts.map(function mapStart(tile) {
        return { ownerType: 0, owner: -1, x: tile.xPos, y: tile.yPos };
      })
    };
  }

  return {
    BIQ_TERRAIN: BIQ_TERRAIN,
    BIQ_TILE_BONUS: BIQ_TILE_BONUS,
    packTerrain: packTerrain,
    generate: generate,
    tileCoordsByIndex: tileCoordsByIndex,
    indexByCoord: indexByCoord
  };
}));
