const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { getPreview, decodePcx } = require('../src/artPreview');

const CIV3_ROOT = process.env.C3X_CIV3_ROOT
  || path.resolve(__dirname, '..', '..', '..');

// NTP palette files are in Art/Units/Palettes/ under the base game root.
// Civ3 has exactly 32 color slots (00–31), one NTP file per slot.
const NTP_COUNT = 32;
const UNITS32_ASSET = 'Art/Units/units_32.pcx';
const NTP_ASSET = (n) => `Art/Units/Palettes/ntp${String(n).padStart(2, '0')}.pcx`;

// Civ-color index set: indices in units_32 palette that are replaced by NTP colors.
// Mirrors Units32Supplier.setCivSpecificColors in Quint.
function civColorIndices() {
  const out = new Set();
  for (let i = 0; i <= 14; i++) out.add(i);
  for (let i = 16; i <= 62; i += 2) out.add(i);
  return out;
}

function applyNtpSubstitution(units32Indices, units32Palette, ntpPalette, srcX, srcY, atlasW, cellW, cellH) {
  const civColors = civColorIndices();
  const pixels = [];
  for (let py = 0; py < cellH; py++) {
    for (let px = 0; px < cellW; px++) {
      const palIdx = units32Indices[(srcY + py) * atlasW + (srcX + px)];
      if (palIdx === 255 || palIdx === 254) {
        pixels.push({ palIdx, r: 0, g: 0, b: 0, a: 0 });
      } else {
        const isCivColor = civColors.has(palIdx);
        const pal = isCivColor ? ntpPalette : units32Palette;
        pixels.push({
          palIdx,
          isCivColor,
          r: pal[palIdx * 3],
          g: pal[palIdx * 3 + 1],
          b: pal[palIdx * 3 + 2],
          a: 255
        });
      }
    }
  }
  return pixels;
}

test('all 32 NTP palette files resolve and contain 768-byte palette data', () => {
  if (!fs.existsSync(CIV3_ROOT)) {
    return; // skip if game not present
  }
  for (let i = 0; i < NTP_COUNT; i++) {
    const res = getPreview({
      kind: 'pcxPalette',
      civ3Path: CIV3_ROOT,
      assetPath: NTP_ASSET(i)
    });
    assert.ok(res.ok, `ntp${String(i).padStart(2, '0')}.pcx: getPreview failed: ${res.error || '?'}`);
    assert.ok(res.paletteBase64, `ntp${String(i).padStart(2, '0')}.pcx: missing paletteBase64`);
    const bytes = Buffer.from(res.paletteBase64, 'base64');
    assert.equal(bytes.length, 768, `ntp${String(i).padStart(2, '0')}.pcx: expected 768 palette bytes, got ${bytes.length}`);
  }
});

test('ntp00 (barbarians/white slot) has light/white colors at civ-color indices', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  const res = getPreview({ kind: 'pcxPalette', civ3Path: CIV3_ROOT, assetPath: NTP_ASSET(0) });
  assert.ok(res.ok);
  const pal = Buffer.from(res.paletteBase64, 'base64');
  // Index 7 is the representative civ color used by colorFromCivSlot.
  // ntp00 is the white/barbarian palette — all channels should be high (>180).
  const r = pal[7 * 3], g = pal[7 * 3 + 1], b = pal[7 * 3 + 2];
  assert.ok(r > 180 && g > 180 && b > 180,
    `ntp00 index 7 should be near-white, got rgb(${r},${g},${b})`);
});

test('ntp01 (first red slot) has red-dominant colors at civ-color indices', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  const res = getPreview({ kind: 'pcxPalette', civ3Path: CIV3_ROOT, assetPath: NTP_ASSET(1) });
  assert.ok(res.ok);
  const pal = Buffer.from(res.paletteBase64, 'base64');
  const r = pal[7 * 3], g = pal[7 * 3 + 1], b = pal[7 * 3 + 2];
  assert.ok(r > 150 && g < 80 && b < 80,
    `ntp01 index 7 should be red-dominant, got rgb(${r},${g},${b})`);
});

test('units_32.pcx decodes with returnIndexed and returns indices and palette', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  // Prefer Conquests version (highest precedence)
  const conquestsPath = path.join(CIV3_ROOT, 'Conquests', UNITS32_ASSET);
  const basePath = path.join(CIV3_ROOT, UNITS32_ASSET);
  const filePath = fs.existsSync(conquestsPath) ? conquestsPath : basePath;
  assert.ok(fs.existsSync(filePath), `units_32.pcx not found at ${filePath}`);

  const result = decodePcx(filePath, { returnIndexed: true });
  assert.ok(result.width > 0 && result.height > 0, 'expected non-zero dimensions');
  assert.ok(result.indices instanceof Uint8Array, 'expected Uint8Array indices');
  assert.equal(result.indices.length, result.width * result.height,
    `indices length ${result.indices.length} should equal ${result.width * result.height}`);

  // Quint cell layout: srcX = col*33+1, srcY = row*33+1 (1-pixel border + 1-pixel gaps between cells).
  // The border pixel at (0,0) should be a magenta/purple transparent color (r and b high, g low).
  const borderIdx = result.indices[0];
  const br = result.palette[borderIdx * 3];
  const bg = result.palette[borderIdx * 3 + 1];
  const bb = result.palette[borderIdx * 3 + 2];
  assert.ok(br > 100 && bg < 50 && bb > 100,
    `pixel (0,0) should be magenta border, got palIdx=${borderIdx} rgb(${br},${bg},${bb})`);
  assert.ok(result.palette instanceof Uint8Array, 'expected Uint8Array palette');
  assert.equal(result.palette.length, 768, `palette should be 768 bytes, got ${result.palette.length}`);
});

test('units_32.pcx default palette has red civ-color values (confirming fallback = red)', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  const conquestsPath = path.join(CIV3_ROOT, 'Conquests', UNITS32_ASSET);
  const basePath = path.join(CIV3_ROOT, UNITS32_ASSET);
  const filePath = fs.existsSync(conquestsPath) ? conquestsPath : basePath;
  const result = decodePcx(filePath, { returnIndexed: true });
  // Index 7 is in the civ-color range. The default palette is baked for civ slot 1 (red).
  const r = result.palette[7 * 3];
  const g = result.palette[7 * 3 + 1];
  const b = result.palette[7 * 3 + 2];
  assert.ok(r > 150 && g < 100 && b < 100,
    `units_32 default palette index 7 should be red (civ1 template), got rgb(${r},${g},${b})`);
});

test('NTP substitution for ntp00: civ-color pixels use NTP palette colors, not the red default', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  const conquestsPath = path.join(CIV3_ROOT, 'Conquests', UNITS32_ASSET);
  const basePath = path.join(CIV3_ROOT, UNITS32_ASSET);
  const filePath = fs.existsSync(conquestsPath) ? conquestsPath : basePath;
  const u32 = decodePcx(filePath, { returnIndexed: true });

  const ntp0Res = getPreview({ kind: 'pcxPalette', civ3Path: CIV3_ROOT, assetPath: NTP_ASSET(0) });
  assert.ok(ntp0Res.ok);
  const ntpPal = Buffer.from(ntp0Res.paletteBase64, 'base64');

  // Cell 0 (col=0, row=0): srcX=1, srcY=1 (Quint: col*33+1)
  const pixels = applyNtpSubstitution(u32.indices, u32.palette, ntpPal, 1, 1, u32.width, 32, 32);
  const civColorPixels = pixels.filter((p) => p.a !== 0 && p.isCivColor);
  assert.ok(civColorPixels.length > 0, 'expected some civ-color pixels in first icon cell');

  // For each civ-color pixel the substituted RGB must exactly match the NTP palette at that index.
  // This verifies substitution is applied, not just the red fallback palette.
  for (const px of civColorPixels) {
    const expectedR = ntpPal[px.palIdx * 3];
    const expectedG = ntpPal[px.palIdx * 3 + 1];
    const expectedB = ntpPal[px.palIdx * 3 + 2];
    assert.equal(px.r, expectedR, `palIdx=${px.palIdx} R: expected ${expectedR}, got ${px.r}`);
    assert.equal(px.g, expectedG, `palIdx=${px.palIdx} G: expected ${expectedG}, got ${px.g}`);
    assert.equal(px.b, expectedB, `palIdx=${px.palIdx} B: expected ${expectedB}, got ${px.b}`);
  }

  // Spot-check: index 7 from ntp00 should be near-white (barbarian representative color).
  const idx7 = civColorPixels.find((p) => p.palIdx === 7);
  if (idx7) {
    assert.ok(idx7.r > 180 && idx7.g > 180 && idx7.b > 180,
      `ntp00 index 7 should be near-white, got rgb(${idx7.r},${idx7.g},${idx7.b})`);
  }
});

test('NTP substitution for ntp01 produces red output for civ-color pixels', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  const conquestsPath = path.join(CIV3_ROOT, 'Conquests', UNITS32_ASSET);
  const basePath = path.join(CIV3_ROOT, UNITS32_ASSET);
  const filePath = fs.existsSync(conquestsPath) ? conquestsPath : basePath;
  const u32 = decodePcx(filePath, { returnIndexed: true });

  const ntp1Res = getPreview({ kind: 'pcxPalette', civ3Path: CIV3_ROOT, assetPath: NTP_ASSET(1) });
  assert.ok(ntp1Res.ok);
  const ntpPal = Buffer.from(ntp1Res.paletteBase64, 'base64');

  const pixels = applyNtpSubstitution(u32.indices, u32.palette, ntpPal, 1, 1, u32.width, 32, 32);
  const civColorPixels = pixels.filter((p) => p.a !== 0 && p.isCivColor);
  assert.ok(civColorPixels.length > 0, 'expected some civ-color pixels in first icon cell');
  // ntp01 is red — representative index 7 should have r > g,b
  const idx7pixels = civColorPixels.filter((p) => p.palIdx === 7);
  assert.ok(idx7pixels.length > 0, 'expected pixels at palette index 7');
  for (const px of idx7pixels) {
    assert.ok(px.r > px.g * 3, `ntp01 civ-color index 7 should be red, got rgb(${px.r},${px.g},${px.b})`);
  }
});

test('non-civ-color pixel values come from units_32 default palette regardless of NTP slot', () => {
  if (!fs.existsSync(CIV3_ROOT)) return;
  const conquestsPath = path.join(CIV3_ROOT, 'Conquests', UNITS32_ASSET);
  const basePath = path.join(CIV3_ROOT, UNITS32_ASSET);
  const filePath = fs.existsSync(conquestsPath) ? conquestsPath : basePath;
  const u32 = decodePcx(filePath, { returnIndexed: true });

  const ntp0Res = getPreview({ kind: 'pcxPalette', civ3Path: CIV3_ROOT, assetPath: NTP_ASSET(0) });
  const ntp1Res = getPreview({ kind: 'pcxPalette', civ3Path: CIV3_ROOT, assetPath: NTP_ASSET(1) });
  assert.ok(ntp0Res.ok && ntp1Res.ok);
  const ntpPal0 = Buffer.from(ntp0Res.paletteBase64, 'base64');
  const ntpPal1 = Buffer.from(ntp1Res.paletteBase64, 'base64');

  const px0 = applyNtpSubstitution(u32.indices, u32.palette, ntpPal0, 0, 0, u32.width, 32, 32);
  const px1 = applyNtpSubstitution(u32.indices, u32.palette, ntpPal1, 0, 0, u32.width, 32, 32);

  // Non-civ-color, non-transparent pixels should be identical regardless of NTP
  const nonCivPx0 = px0.filter((p) => p.a !== 0 && !p.isCivColor);
  const nonCivPx1 = px1.filter((p) => p.a !== 0 && !p.isCivColor);
  assert.equal(nonCivPx0.length, nonCivPx1.length);
  for (let i = 0; i < nonCivPx0.length; i++) {
    assert.equal(nonCivPx0[i].r, nonCivPx1[i].r, `non-civ pixel ${i} R differs between ntp slots`);
    assert.equal(nonCivPx0[i].g, nonCivPx1[i].g, `non-civ pixel ${i} G differs between ntp slots`);
    assert.equal(nonCivPx0[i].b, nonCivPx1[i].b, `non-civ pixel ${i} B differs between ntp slots`);
  }
});
