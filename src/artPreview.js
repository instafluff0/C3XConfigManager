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
    rgba[i * 4 + 3] = 255;
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

function decodeFlcFrames(filePath, maxFrames = 48) {
  const b = fs.readFileSync(filePath);
  if (b.length < 128) throw new Error('FLC too small');

  const w = u16(b, 8);
  const h = u16(b, 10);
  const palette = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i += 1) {
    palette[i * 3] = i;
    palette[i * 3 + 1] = i;
    palette[i * 3 + 2] = i;
  }

  const frames = [];
  let frame = new Uint8Array(w * h);
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
        const ss = u32(b, sub);
        const st = u16(b, sub + 4);
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
        if (frames.length >= maxFrames) {
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
      rgba[i * 4] = palette[idx * 3];
      rgba[i * 4 + 1] = palette[idx * 3 + 1];
      rgba[i * 4 + 2] = palette[idx * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
    return Buffer.from(rgba).toString('base64');
  });

  return { width: w, height: h, framesBase64 };
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

function decodeByPath(filePath, crop) {
  const ext = path.extname(filePath).toLowerCase();
  let image;
  if (ext === '.pcx') {
    image = decodePcx(filePath);
  } else if (ext === '.flc') {
    image = decodeFlcFrames(filePath);
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
      framesBase64: image.framesBase64
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
  const { c3xPath, kind } = request;

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

  return { ok: false, error: 'Unknown preview kind' };
}

module.exports = {
  getPreview
};
