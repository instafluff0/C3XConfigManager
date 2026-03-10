const fs = require('node:fs');
const path = require('node:path');

const CHUNK_FRAME = 0xF1FA;
const CHUNK_COLOR_256 = 4;
const CHUNK_DELTA_FLC = 7;
const CHUNK_DELTA_FLI = 12;
const CHUNK_BLACK = 13;
const CHUNK_BYTE_RUN = 15;
const CHUNK_FLI_COPY = 16;
const CHUNK_LITERAL = 16;

function u16(buf, off) {
  return buf.readUInt16LE(off);
}

function u32(buf, off) {
  return buf.readUInt32LE(off);
}

function s8(v) {
  return v > 127 ? v - 256 : v;
}

function s16(buf, off) {
  return buf.readInt16LE(off);
}

function fileExists(p) {
  try {
    return !!p && fs.existsSync(p);
  } catch (_err) {
    return false;
  }
}

function decodePcx(filePath) {
  const b = fs.readFileSync(filePath);
  if (b.length < 128) throw new Error('PCX too small');
  if (b[0] !== 10) throw new Error('Not a PCX file');
  if (b[2] !== 1) throw new Error('Unsupported PCX encoding');

  const bitsPerPixel = b[3];
  const xMin = u16(b, 4);
  const yMin = u16(b, 6);
  const xMax = u16(b, 8);
  const yMax = u16(b, 10);
  const width = xMax - xMin + 1;
  const height = yMax - yMin + 1;
  const planes = b[65];
  const bytesPerLine = u16(b, 66);

  if (!(bitsPerPixel === 8 && planes === 1)) {
    throw new Error('Only 8-bit 1-plane PCX supported');
  }

  if (b.length < 769 || b[b.length - 769] !== 12) {
    throw new Error('Missing PCX 256-color palette');
  }
  const palette = b.slice(b.length - 768);

  const dataEnd = b.length - 769;
  const indices = new Uint8Array(width * height);
  let src = 128;
  let out = 0;

  for (let y = 0; y < height; y += 1) {
    let rowWritten = 0;
    const rowBuf = new Uint8Array(bytesPerLine);
    while (rowWritten < bytesPerLine && src < dataEnd) {
      const v = b[src++];
      if ((v & 0xc0) === 0xc0) {
        const run = v & 0x3f;
        const val = src < dataEnd ? b[src++] : 0;
        const n = Math.min(run, bytesPerLine - rowWritten);
        rowBuf.fill(val, rowWritten, rowWritten + n);
        rowWritten += n;
      } else {
        rowBuf[rowWritten++] = v;
      }
    }

    for (let x = 0; x < width; x += 1) {
      indices[out++] = rowBuf[x];
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < indices.length; i += 1) {
    const idx = indices[i];
    rgba[i * 4] = palette[idx * 3];
    rgba[i * 4 + 1] = palette[idx * 3 + 1];
    rgba[i * 4 + 2] = palette[idx * 3 + 2];
    // Civ3 convention: palette entries 254 (green) and 255 (magenta) are transparent.
    rgba[i * 4 + 3] = (idx === 254 || idx === 255) ? 0 : 255;
  }

  return { width, height, rgba };
}

function decodeColor256(payload, palette) {
  if (payload.length < 2) return;
  const packets = u16(payload, 0);
  let p = 2;
  let idx = 0;
  for (let n = 0; n < packets; n += 1) {
    if (p + 2 > payload.length) break;
    const skip = payload[p++];
    let count = payload[p++];
    idx += skip;
    if (count === 0) count = 256;
    for (let i = 0; i < count; i += 1) {
      if (p + 3 > payload.length || idx >= 256) break;
      palette[idx * 3] = payload[p++];
      palette[idx * 3 + 1] = payload[p++];
      palette[idx * 3 + 2] = payload[p++];
      idx += 1;
    }
  }
}

function decodeByteRun(payload, w, h) {
  const out = new Uint8Array(w * h);
  let p = 0;
  for (let y = 0; y < h; y += 1) {
    if (p >= payload.length) break;
    p += 1; // packet count byte
    let x = 0;
    const rowOff = y * w;
    while (x < w && p < payload.length) {
      const n = s8(payload[p++]);
      if (n >= 0) {
        if (p >= payload.length) break;
        const b = payload[p++];
        const run = Math.min(n, w - x);
        out.fill(b, rowOff + x, rowOff + x + run);
        x += run;
      } else {
        const run = Math.min(-n, w - x, payload.length - p);
        out.set(payload.subarray(p, p + run), rowOff + x);
        p += run;
        x += run;
      }
    }
  }
  return out;
}

function decodeDeltaFli(payload, frame, w, h) {
  if (payload.length < 4) return;
  let y = payload.readUInt16LE(0);
  let lines = payload.readUInt16LE(2);
  let p = 4;
  while (lines > 0 && y < h && p < payload.length) {
    const packets = payload[p++];
    let x = 0;
    const rowOff = y * w;
    for (let i = 0; i < packets; i += 1) {
      if (p + 2 > payload.length) break;
      x += payload[p++];
      const n = s8(payload[p++]);
      if (n >= 0) {
        const cnt = n;
        const avail = Math.min(cnt, payload.length - p);
        const write = Math.min(avail, Math.max(0, w - x));
        if (write > 0) {
          frame.set(payload.subarray(p, p + write), rowOff + x);
          x += write;
        }
        p += avail;
        x += Math.max(0, cnt - write);
      } else {
        if (p >= payload.length) break;
        const b = payload[p++];
        const run = Math.min(-n, w - x);
        frame.fill(b, rowOff + x, rowOff + x + run);
        x += run;
      }
    }
    y += 1;
    lines -= 1;
  }
}

function decodeDeltaFlc(payload, frame, w, h) {
  if (payload.length < 2) return;
  let lines = payload.readUInt16LE(0);
  let p = 2;
  let y = 0;
  while (lines > 0 && y < h && p + 2 <= payload.length) {
    const op = s16(payload, p);
    p += 2;
    if (op < 0) {
      const flag = op & 0xc000;
      if (flag === 0xc000) {
        y += -op;
        continue;
      }
      if (flag === 0x8000) {
        if (w > 0 && y < h) frame[y * w + (w - 1)] = op & 0xff;
        continue;
      }
      continue;
    }

    const packets = op;
    let x = 0;
    const rowOff = y * w;
    for (let i = 0; i < packets; i += 1) {
      if (p + 2 > payload.length) break;
      x += payload[p++];
      const n = s8(payload[p++]);
      if (n >= 0) {
        const cnt = n * 2;
        const avail = Math.min(cnt, payload.length - p);
        const write = Math.min(avail, Math.max(0, w - x));
        if (write > 0) {
          frame.set(payload.subarray(p, p + write), rowOff + x);
          x += write;
        }
        p += avail;
        x += Math.max(0, cnt - write);
      } else {
        if (p + 2 > payload.length) break;
        const b0 = payload[p++];
        const b1 = payload[p++];
        const reps = -n;
        for (let r = 0; r < reps; r += 1) {
          if (x + 1 >= w) break;
          frame[rowOff + x] = b0;
          frame[rowOff + x + 1] = b1;
          x += 2;
        }
      }
    }
    y += 1;
    lines -= 1;
  }
}

function decodeFlcFrames(filePath, maxFrames = null, options = {}) {
  const b = fs.readFileSync(filePath);
  if (b.length < 128) throw new Error('FLC too small');

  const w = u16(b, 8);
  const h = u16(b, 10);
  const headerFrameCount = u16(b, 6);
  const speedField = u16(b, 16);
  const frameLimit = Number.isFinite(maxFrames) && maxFrames > 0
    ? Math.floor(maxFrames)
    : Math.max(1, Math.min(240, headerFrameCount + 1));
  const palette = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i += 1) {
    palette[i * 3] = i;
    palette[i * 3 + 1] = i;
    palette[i * 3 + 2] = i;
  }

  const frames = [];
  let frame = new Uint8Array(w * h);
  const chunkCounts = {};
  let off = 128;
  while (off + 6 <= b.length) {
    const chunkSize = u32(b, off);
    const chunkType = u16(b, off + 4);
    if (chunkSize < 6 || off + chunkSize > b.length) break;

    if (chunkType === CHUNK_FRAME) {
      const subCount = u16(b, off + 6);
      let sub = off + 16;
      let touched = false;

      for (let i = 0; i < subCount && sub + 6 <= off + chunkSize; i += 1) {
        const ssRaw = u32(b, sub);
        const st = u16(b, sub + 4);
        chunkCounts[st] = (chunkCounts[st] || 0) + 1;
        let ss = ssRaw;
        // Civ3 unit FLCs sometimes have malformed COLOR_256 chunk sizes.
        if (st === CHUNK_COLOR_256 && (ss < 6 || sub + ss > off + chunkSize)) {
          const fallback = Math.min(778, (off + chunkSize) - sub);
          ss = fallback >= 6 ? fallback : ss;
        }
        if (ss < 6 || sub + ss > off + chunkSize) break;
        const payload = b.subarray(sub + 6, sub + ss);

        if (st === CHUNK_COLOR_256) {
          decodeColor256(payload, palette);
        } else if (st === CHUNK_BYTE_RUN) {
          frame = decodeByteRun(payload, w, h);
          touched = true;
        } else if (st === CHUNK_FLI_COPY && payload.length >= w * h) {
          frame = new Uint8Array(payload.subarray(0, w * h));
          touched = true;
        } else if (st === CHUNK_BLACK) {
          frame = new Uint8Array(w * h);
          touched = true;
        } else if (st === CHUNK_DELTA_FLI) {
          decodeDeltaFli(payload, frame, w, h);
          touched = true;
        } else if (st === CHUNK_DELTA_FLC) {
          decodeDeltaFlc(payload, frame, w, h);
          touched = true;
        }

        sub += ss;
      }

      if (touched) {
        frames.push(new Uint8Array(frame));
        if (frames.length >= frameLimit) {
          break;
        }
      }
    }

    off += chunkSize;
  }

  if (frames.length === 0) {
    throw new Error('Could not decode FLC frames');
  }

  const framesBase64 = frames.map((pix) => {
    const rgba = new Uint8Array(w * h * 4);
    for (let i = 0; i < pix.length; i += 1) {
      const idx = pix[i];
      let r = palette[idx * 3];
      let g = palette[idx * 3 + 1];
      let b2 = palette[idx * 3 + 2];
      let a = 255;
      if (options && options.civ3UnitPalette) {
        if (idx === 255) {
          a = 0;
        } else if (idx >= 240 && idx <= 254) {
          // Civ3 shadow ramp (transparent black -> darker shadow).
          r = 0;
          g = 0;
          b2 = 0;
          a = Math.min(255, (255 - idx) * 16);
        } else if (idx >= 224 && idx <= 239) {
          // Civ3 smoke/haze ramp (transparent -> opaque white).
          r = 255;
          g = 255;
          b2 = 255;
          a = Math.min(255, (idx - 224) * 16);
        }
      }
      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b2;
      rgba[i * 4 + 3] = a;
    }
    return Buffer.from(rgba).toString('base64');
  });

  return {
    width: w,
    height: h,
    framesBase64,
    speedField,
    frameCountHeader: headerFrameCount,
    debug: { chunkCounts, maxFramesRequested: frameLimit, framesDecoded: frames.length }
  };
}

function cropCell(image, row, col, cellW, cellH) {
  const x0 = Math.max(0, col * cellW);
  const y0 = Math.max(0, row * cellH);
  const w = Math.max(1, Math.min(cellW, image.width - x0));
  const h = Math.max(1, Math.min(cellH, image.height - y0));
  const rgba = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y += 1) {
    const srcOff = ((y0 + y) * image.width + x0) * 4;
    const dstOff = y * w * 4;
    rgba.set(image.rgba.subarray(srcOff, srcOff + w * 4), dstOff);
  }

  return { width: w, height: h, rgba };
}

function parseIniForFlc(iniPath) {
  if (!fileExists(iniPath)) return null;
  const text = fs.readFileSync(iniPath, 'utf8');
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('[')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toUpperCase();
    const val = line.slice(i + 1).trim();
    if (!val) continue;
    if (key === 'ATTACK1' || key === 'DEFAULT' || key === 'RUN' || key === 'WALK') {
      if (val.toLowerCase().endsWith('.flc')) {
        return path.join(path.dirname(iniPath), val);
      }
    }
  }
  return null;
}

function readIniText(iniPath) {
  const raw = fs.readFileSync(iniPath);
  const utf8 = raw.toString('utf8');
  // If UTF-8 decoding introduced replacement chars, prefer latin1 fallback.
  return utf8.includes('\uFFFD') ? raw.toString('latin1') : utf8;
}

function stripInlineIniComment(value) {
  const s = String(value || '');
  let inQuote = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '"') inQuote = !inQuote;
    if (!inQuote && ch === ';') return s.slice(0, i).trim();
  }
  return s.trim();
}

function parseUnitAnimationIni(iniPath) {
  if (!fileExists(iniPath)) return null;
  const text = readIniText(iniPath);
  const lines = text.split(/\r?\n/);
  const actions = [];
  const seen = new Set();
  const timings = new Map();
  let section = '';
  lines.forEach((raw) => {
    const line = String(raw || '').trim();
    if (!line || line.startsWith(';')) return;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      section = String(sec[1] || '').trim().toUpperCase();
      return;
    }
    const eq = line.indexOf('=');
    if (eq < 0) return;
    const key = line.slice(0, eq).trim();
    const keyUpper = key.toUpperCase();
    if (!keyUpper) return;
    let val = stripInlineIniComment(line.slice(eq + 1));
    if (!val) return;
    val = val.replace(/^["']|["']$/g, '').trim();
    if (section === 'TIMING') {
      const t = Number.parseFloat(val);
      if (Number.isFinite(t) && t > 0) timings.set(keyUpper, t);
      return;
    }
    if (section && section !== 'ANIMATIONS') return;
    if (seen.has(keyUpper)) return;
    if (!/\.flc$/i.test(val)) return;
    const flcPath = path.join(path.dirname(iniPath), val.replace(/\\/g, path.sep).replace(/\//g, path.sep));
    actions.push({
      key: keyUpper,
      relativePath: val,
      flcPath,
      exists: fileExists(flcPath),
      timingSeconds: timings.get(keyUpper) || null
    });
    seen.add(keyUpper);
  });
  actions.forEach((a) => {
    if (!a.timingSeconds && timings.has(a.key)) a.timingSeconds = timings.get(a.key);
  });
  if (!actions.length) {
    return {
      iniPath,
      actions: [],
      defaultActionKey: ''
    };
  }
  const defaultActionKey = (actions.find((a) => a.key === 'DEFAULT') || actions[0]).key;
  return {
    iniPath,
    actions,
    defaultActionKey
  };
}

function normalizeAssetPath(raw) {
  return String(raw || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\.?[\\/]+/, '')
    .replace(/\\/g, path.sep)
    .replace(/\//g, path.sep);
}

function resolveCiv3Root(civ3Path) {
  if (!civ3Path) return '';
  const base = path.basename(civ3Path).toLowerCase();
  if (base === 'conquests' || base === 'civ3ptw') return path.dirname(civ3Path);
  return civ3Path;
}

function resolveConquestsRoot(civ3Path) {
  const root = resolveCiv3Root(civ3Path);
  return root ? path.join(root, 'Conquests') : '';
}

function resolvePtwRoot(civ3Path) {
  const root = resolveCiv3Root(civ3Path);
  return root ? path.join(root, 'civ3PTW') : '';
}

function resolveScenarioRoot(scenarioPath) {
  const raw = String(scenarioPath || '').trim();
  if (!raw) return '';
  if (/\.biq$/i.test(raw)) return path.dirname(raw);
  return raw;
}

function normalizeScenarioRoots(scenarioPath, scenarioPaths) {
  const out = [];
  const seen = new Set();
  const add = (candidate) => {
    const resolved = resolveScenarioRoot(candidate);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    out.push(resolved);
  };
  add(scenarioPath);
  (Array.isArray(scenarioPaths) ? scenarioPaths : []).forEach((p) => add(p));
  return out;
}

function resolveConquestsAssetPath(civ3Path, rawAssetPath, scenarioPath, scenarioPaths) {
  if (!civ3Path || !rawAssetPath) return null;
  const civ3Root = resolveCiv3Root(civ3Path);
  const conquestsRoot = resolveConquestsRoot(civ3Path);
  const ptwRoot = resolvePtwRoot(civ3Path);
  const scenarioRoots = normalizeScenarioRoots(scenarioPath, scenarioPaths);
  const rel = normalizeAssetPath(rawAssetPath);
  const candidates = [];
  if (path.isAbsolute(rel)) candidates.push(rel);
  scenarioRoots.forEach((root) => candidates.push(path.join(root, rel)));
  candidates.push(path.join(conquestsRoot, rel));
  candidates.push(path.join(ptwRoot, rel));
  candidates.push(path.join(civ3Root, rel));
  return candidates.find((p) => fileExists(p)) || null;
}

function resolveUnitIniPath(civ3Path, animationName, scenarioPath, scenarioPaths) {
  if (!civ3Path || !animationName) return null;
  const civ3Root = resolveCiv3Root(civ3Path);
  const conquestsRoot = resolveConquestsRoot(civ3Path);
  const ptwRoot = resolvePtwRoot(civ3Path);
  const scenarioRoots = normalizeScenarioRoots(scenarioPath, scenarioPaths);
  const unitName = String(animationName).trim();
  const candidates = [];
  scenarioRoots.forEach((root) => candidates.push(path.join(root, 'Art', 'Units', unitName, `${unitName}.ini`)));
  candidates.push(
    path.join(conquestsRoot, 'Art', 'Units', unitName, `${unitName}.ini`),
    path.join(ptwRoot, 'Art', 'Units', unitName, `${unitName}.ini`),
    path.join(civ3Root, 'Art', 'Units', unitName, `${unitName}.ini`)
  );
  return candidates.find((p) => fileExists(p)) || null;
}

function resolvePcxPath(c3xPath, fileName) {
  if (!c3xPath || !fileName) return null;
  const direct = path.isAbsolute(fileName) ? fileName : null;
  const candidates = [
    direct,
    path.join(c3xPath, 'Art', 'Districts', 'Summer', '1200', fileName),
    path.join(c3xPath, 'Art', 'Districts', '1200', fileName),
    path.join(c3xPath, 'Art', 'DayNight', 'Summer', '1200', fileName),
    path.join(c3xPath, 'Art', 'Terrain', fileName)
  ].filter(Boolean);
  return candidates.find((p) => fileExists(p)) || null;
}

function decodeByPath(filePath, crop, options = {}) {
  const ext = path.extname(filePath).toLowerCase();
  let image;
  if (ext === '.pcx') {
    image = decodePcx(filePath);
  } else if (ext === '.flc') {
    const maxFrames = Number.isFinite(options.maxFrames) ? Number(options.maxFrames) : null;
    image = decodeFlcFrames(filePath, maxFrames, options);
  } else {
    throw new Error(`Unsupported preview extension: ${ext}`);
  }

  if (crop && Number.isInteger(crop.row) && Number.isInteger(crop.col) && crop.w > 0 && crop.h > 0) {
    image = cropCell(image, crop.row, crop.col, crop.w, crop.h);
  }

  const base = {
    width: image.width,
    height: image.height,
    sourcePath: filePath,
    ext
  };

  if (image.framesBase64) {
    return {
      ...base,
      animated: true,
      framesBase64: image.framesBase64,
      debug: image.debug || null
    };
  }
  return {
    ...base,
    animated: false,
    rgbaBase64: Buffer.from(image.rgba).toString('base64')
  };
}

function parseNaturalWonderAnimationIniPath(animationSpec) {
  const s = String(animationSpec || '');
  const m = s.match(/(?:^|[;\s])ini\s*[:=]\s*([^;]+)/i);
  if (!m) return null;
  return m[1].trim().replace(/^"|"$/g, '');
}

function getPreview(request) {
  const { c3xPath, civ3Path, scenarioPath, scenarioPaths, kind } = request;

  if (kind === 'district' || kind === 'wonder' || kind === 'naturalWonder') {
    const pcx = resolvePcxPath(c3xPath, request.fileName);
    if (!pcx) return { ok: false, error: 'PCX not found' };
    return { ok: true, ...decodeByPath(pcx, request.crop) };
  }

  if (kind === 'animationIni') {
    const iniRel = String(request.iniPath || '').replace(/\\/g, path.sep).replace(/\//g, path.sep);
    const iniAbs = path.isAbsolute(iniRel)
      ? iniRel
      : path.join(c3xPath, 'Art', 'Animations', iniRel);
    const flc = parseIniForFlc(iniAbs);
    if (!flc || !fileExists(flc)) return { ok: false, error: 'FLC from INI not found' };
    return { ok: true, ...decodeByPath(flc) };
  }

  if (kind === 'naturalWonderAnimationSpec') {
    const iniRel = parseNaturalWonderAnimationIniPath(request.animationSpec);
    if (!iniRel) return { ok: false, error: 'No ini: in animation spec' };
    const rel = iniRel.replace(/\\/g, path.sep).replace(/\//g, path.sep);
    const iniAbs = path.isAbsolute(rel) ? rel : path.join(c3xPath, 'Art', 'Animations', rel);
    const flc = parseIniForFlc(iniAbs);
    if (!flc || !fileExists(flc)) return { ok: false, error: 'FLC from animation spec not found' };
    return { ok: true, ...decodeByPath(flc) };
  }

  if (kind === 'civilopediaIcon') {
    const iconPath = resolveConquestsAssetPath(civ3Path, request.assetPath, scenarioPath, scenarioPaths);
    if (!iconPath) return { ok: false, error: 'Civilopedia icon not found' };
    return { ok: true, ...decodeByPath(iconPath) };
  }

  if (kind === 'unitAnimation') {
    const unitIni = resolveUnitIniPath(civ3Path, request.animationName, scenarioPath, scenarioPaths);
    if (!unitIni) return { ok: false, error: 'Unit INI not found for animation name' };
    const flc = parseIniForFlc(unitIni);
    if (!flc || !fileExists(flc)) return { ok: false, error: 'No FLC found in unit INI' };
    return { ok: true, ...decodeByPath(flc) };
  }

  if (kind === 'unitAnimationManifest') {
    const unitIni = resolveUnitIniPath(civ3Path, request.animationName, scenarioPath, scenarioPaths);
    if (!unitIni) return { ok: false, error: 'Unit INI not found for animation name' };
    const manifest = parseUnitAnimationIni(unitIni);
    if (!manifest) return { ok: false, error: 'Could not parse unit INI' };
    return {
      ok: true,
      iniPath: manifest.iniPath,
      defaultActionKey: manifest.defaultActionKey,
      actions: manifest.actions.map((a) => ({
        key: a.key,
        relativePath: a.relativePath,
        exists: !!a.exists,
        sourcePath: a.exists ? a.flcPath : '',
        timingSeconds: Number.isFinite(a.timingSeconds) ? a.timingSeconds : null
      }))
    };
  }

  if (kind === 'unitAnimationAction') {
    const unitIni = resolveUnitIniPath(civ3Path, request.animationName, scenarioPath, scenarioPaths);
    if (!unitIni) return { ok: false, error: 'Unit INI not found for animation name' };
    const manifest = parseUnitAnimationIni(unitIni);
    if (!manifest || !Array.isArray(manifest.actions) || manifest.actions.length === 0) {
      return { ok: false, error: 'No FLC entries found in unit INI' };
    }
    const reqKey = String(request.actionKey || '').trim().toUpperCase();
    const selected = manifest.actions.find((a) => a.key === reqKey) || manifest.actions.find((a) => a.key === manifest.defaultActionKey) || manifest.actions[0];
    if (!selected || !selected.exists || !fileExists(selected.flcPath)) {
      return { ok: false, error: `FLC not found for action ${selected ? selected.key : reqKey || '(none)'}` };
    }
    return {
      ok: true,
      actionKey: selected.key,
      iniPath: manifest.iniPath,
      ...decodeByPath(selected.flcPath, null, { civ3UnitPalette: true, maxFrames: 1000 })
    };
  }

  if (kind === 'unitAnimationPath') {
    const iniPath = String(request.unitIniPath || '').trim();
    const flcRaw = String(request.flcPath || '').trim();
    if (!iniPath || !flcRaw) return { ok: false, error: 'Missing unitIniPath or flcPath' };
    const flcPath = path.isAbsolute(flcRaw)
      ? flcRaw
      : path.join(path.dirname(iniPath), flcRaw.replace(/\\/g, path.sep).replace(/\//g, path.sep));
    if (!fileExists(flcPath)) return { ok: false, error: 'FLC not found for requested path' };
    return { ok: true, ...decodeByPath(flcPath, null, { civ3UnitPalette: true, maxFrames: 1000 }) };
  }

  return { ok: false, error: 'Unknown preview kind' };
}

module.exports = {
  getPreview,
  parseUnitAnimationIni,
  resolveUnitIniPath
};
