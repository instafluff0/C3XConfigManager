const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  loadBundle,
  saveBundle,
  parseIniLines
} = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-all-base-write-'));
}

function extractC3xReleaseKeysFromRenderer() {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');
  const match = text.match(/const C3X_RELEASE_BY_KEY = Object\.freeze\(\{([\s\S]*?)\}\);/);
  assert.ok(match && match[1], 'Could not locate C3X_RELEASE_BY_KEY object in renderer.js');
  const body = match[1];
  const keys = Array.from(body.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)).map((m) => String(m[1] || '').trim());
  return Array.from(new Set(keys)).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

test('C3X base write matrix: every loaded base key writes when changed', () => {
  const c3xRoot = mkTmpDir();
  const allKeys = extractC3xReleaseKeysFromRenderer();
  assert.ok(allKeys.length > 0, 'Expected at least one C3X key');

  const baseLines = ['; synthetic default for exhaustive base write test'];
  allKeys.forEach((key) => {
    baseLines.push(`${key} = true`);
  });
  baseLines.push('');
  fs.writeFileSync(path.join(c3xRoot, 'default.c3x_config.ini'), baseLines.join('\n'), 'utf8');

  // Minimal defaults for non-base C3X tabs so load/save bundle stays healthy.
  fs.writeFileSync(path.join(c3xRoot, 'default.districts_config.txt'), '; empty districts\n', 'utf8');
  fs.writeFileSync(path.join(c3xRoot, 'default.districts_wonders_config.txt'), '; empty wonders\n', 'utf8');
  fs.writeFileSync(path.join(c3xRoot, 'default.districts_natural_wonders_config.txt'), '; empty natural wonders\n', 'utf8');
  fs.writeFileSync(path.join(c3xRoot, 'default.tile_animations.txt'), '; empty animations\n', 'utf8');

  const bundle = loadBundle({ mode: 'global', c3xPath: c3xRoot, scenarioPath: '' });
  const baseRows = (bundle && bundle.tabs && bundle.tabs.base && Array.isArray(bundle.tabs.base.rows))
    ? bundle.tabs.base.rows
    : [];
  assert.ok(baseRows.length >= allKeys.length, 'Expected loaded base rows to include all synthetic keys');

  baseRows.forEach((row) => {
    row.value = 'false';
  });

  const saved = saveBundle({
    mode: 'global',
    c3xPath: c3xRoot,
    scenarioPath: '',
    dirtyTabs: ['base'],
    tabs: bundle.tabs
  });
  assert.equal(saved.ok, true, String(saved.error || 'save failed'));

  const customPath = path.join(c3xRoot, 'custom.c3x_config.ini');
  assert.equal(fs.existsSync(customPath), true, 'Expected custom.c3x_config.ini to be created');
  const parsed = parseIniLines(fs.readFileSync(customPath, 'utf8'));
  allKeys.forEach((key) => {
    assert.equal(parsed.map[key], 'false', `Expected key ${key} to be written with changed value`);
  });
});

