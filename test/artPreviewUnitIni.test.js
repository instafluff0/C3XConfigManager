const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { getPreview, parseUnitAnimationIni, resolveUnitIniPath } = require('../src/artPreview');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-unit-anim-'));
}

test('parseUnitAnimationIni reads all FLC actions and picks DEFAULT as default action', () => {
  const root = mkTmpDir();
  const iniPath = path.join(root, 'Warrior.ini');
  fs.writeFileSync(path.join(root, 'Run.flc'), '');
  fs.writeFileSync(path.join(root, 'Default.flc'), '');
  fs.writeFileSync(path.join(root, 'AttackA.flc'), '');
  fs.writeFileSync(iniPath, [
    '[Animations]',
    'RUN = Run.flc',
    'DEFAULT = "Default.flc" ; inline comment',
    'ATTACK1 = AttackA.flc',
    '[Timing]',
    'RUN = 0.45',
    'ATTACK1 = 0.80',
    'SOUND = AttackA.wav',
    '; DEATH = Death.flc (commented out)'
  ].join('\n'), 'utf8');

  const parsed = parseUnitAnimationIni(iniPath);
  assert.ok(parsed);
  assert.equal(parsed.defaultActionKey, 'DEFAULT');
  assert.deepEqual(parsed.actions.map((a) => a.key), ['RUN', 'DEFAULT', 'ATTACK1']);
  const run = parsed.actions.find((a) => a.key === 'RUN');
  const attack = parsed.actions.find((a) => a.key === 'ATTACK1');
  assert.equal(run.timingSeconds, 0.45);
  assert.equal(attack.timingSeconds, 0.8);
  assert.equal(parsed.actions.every((a) => a.exists), true);
});

test('resolveUnitIniPath prefers scenario unit folder over conquests/ptw/base', () => {
  const civ3Root = mkTmpDir();
  const scenario = mkTmpDir();
  const unit = 'Warrior';
  const basePath = path.join(civ3Root, 'Art', 'Units', unit);
  const ptwPath = path.join(civ3Root, 'civ3PTW', 'Art', 'Units', unit);
  const conqPath = path.join(civ3Root, 'Conquests', 'Art', 'Units', unit);
  const scenPath = path.join(scenario, 'Art', 'Units', unit);
  [basePath, ptwPath, conqPath, scenPath].forEach((p) => fs.mkdirSync(p, { recursive: true }));
  fs.writeFileSync(path.join(basePath, `${unit}.ini`), 'DEFAULT=Base.flc\n', 'utf8');
  fs.writeFileSync(path.join(ptwPath, `${unit}.ini`), 'DEFAULT=Ptw.flc\n', 'utf8');
  fs.writeFileSync(path.join(conqPath, `${unit}.ini`), 'DEFAULT=Conquests.flc\n', 'utf8');
  fs.writeFileSync(path.join(scenPath, `${unit}.ini`), 'DEFAULT=Scenario.flc\n', 'utf8');

  const resolved = resolveUnitIniPath(civ3Root, unit, scenario, []);
  assert.equal(resolved, path.join(scenPath, `${unit}.ini`));
});

test('unitAnimationManifest returns all parsed actions and source paths', () => {
  const civ3Root = mkTmpDir();
  const conquestsUnitDir = path.join(civ3Root, 'Conquests', 'Art', 'Units', 'Archer');
  fs.mkdirSync(conquestsUnitDir, { recursive: true });
  fs.writeFileSync(path.join(conquestsUnitDir, 'Archer.ini'), [
    'DEFAULT = ArcherDefault.flc',
    'ATTACK1 = ArcherAttack.flc',
    'FIDGET = Missing.flc',
    '[Timing]',
    'DEFAULT = 0.5'
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(conquestsUnitDir, 'ArcherDefault.flc'), '');
  fs.writeFileSync(path.join(conquestsUnitDir, 'ArcherAttack.flc'), '');

  const res = getPreview({
    kind: 'unitAnimationManifest',
    civ3Path: civ3Root,
    animationName: 'Archer'
  });
  assert.equal(res.ok, true);
  assert.equal(res.defaultActionKey, 'DEFAULT');
  assert.deepEqual(res.actions.map((a) => a.key), ['DEFAULT', 'ATTACK1', 'FIDGET']);
  const missing = res.actions.find((a) => a.key === 'FIDGET');
  assert.ok(missing);
  assert.equal(missing.exists, false);
  const def = res.actions.find((a) => a.key === 'DEFAULT');
  assert.equal(def.timingSeconds, 0.5);
});
