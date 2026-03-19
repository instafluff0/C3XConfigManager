'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { loadBundle } = require('../src/configCore');

const CIV3_ROOT = process.env.C3X_CIV3_ROOT || path.resolve(__dirname, '..', '..', '..');
const TIDES_BIQ = path.join(CIV3_ROOT, 'Conquests', 'Scenarios', 'TIDES OF CRIMSON.biq');

function getTidesBundle() {
  if (!fs.existsSync(TIDES_BIQ)) return null;
  return loadBundle({
    mode: 'scenario',
    civ3Path: CIV3_ROOT,
    scenarioPath: TIDES_BIQ
  });
}

function getField(record, key) {
  return (record && Array.isArray(record.fields) ? record.fields : []).find((field) => String(field && (field.baseKey || field.key) || '').toLowerCase() === String(key || '').toLowerCase()) || null;
}

test('RULE section in TIDES matches Quint-style field names and values', (t) => {
  if (!fs.existsSync(TIDES_BIQ)) t.skip(`Scenario fixture not present: ${TIDES_BIQ}`);
  const bundle = getTidesBundle();
  assert.ok(bundle && bundle.tabs && bundle.tabs.rules, 'Expected a loaded RULE tab');
  const ruleSection = (bundle.tabs.rules.sections || []).find((section) => String(section && section.code || '').toUpperCase() === 'RULE');
  assert.ok(ruleSection, 'Expected RULE section');
  const ruleRecord = (ruleSection.records || [])[0];
  assert.ok(ruleRecord, 'Expected RULE record');

  const checks = [
    ['slave', 'Captured Unit', /Work Mule/i],
    ['startunit1', 'Start Unit 1', /City Builder/i],
    ['startunit2', 'Start Unit 2', /Waywatcher/i],
    ['scout', 'Scout', /Search Dog/i],
    ['battlecreatedunit', 'Battle-Created', /Green Fledge/i],
    ['buildarmyunit', 'Build-Army', /Ruby Dragon/i],
    ['basicbarbarian', 'Basic Barbarian', /Troglo/i],
    ['advancedbarbarian', 'Adv. Barbarian', /Murloc/i],
    ['barbarianseaunit', 'Barbarian Ship', /Krog Galley/i],
    ['flagunit', 'Flag Unit', /Flag/i],
    ['townname', 'Level One', /^Village$/i],
    ['cityname', 'Level Two', /^Town$/i],
    ['metropolisname', 'Level Three', /^City$/i],
    ['maxcity1size', 'Maximum Size', /^7$/],
    ['maxcity2size', 'Maximum Size', /^14$/],
    ['futuretechcost', 'Future Tech Cost', /^400$/],
    ['minimumresearchtime', 'Minimum Research Time', /^4$/],
    ['maximumresearchtime', 'Maximum Research Time', /^50$/],
    ['wltkdminimumpop', 'Minimum Population for We Love the King', /^6$/],
    ['chancetointerceptairmissions', 'Chance of Intercepting Air Missions', /^50$/],
    ['chancetointerceptstealthmissions', 'Chance of Intercepting Stealth Missions', /^10$/],
    ['citiesforarmy', 'Cities Needed to Support an Army', /^3$/],
    ['citizenvalueinshields', 'Citizen Value in Shields', /^20$/],
    ['shieldcostingold', 'Shield Cost in Gold', /^4$/],
    ['forestvalueinshields', 'Forest Value in Shields', /^20$/],
    ['shieldvalueingold', 'Shield Value in Gold', /^3$/],
    ['roadmovementrate', 'Road movement rate', /^2$/],
    ['upgradecost', 'Upgrade Cost', /^1$/],
    ['foodconsumptionpercitizen', 'Food Consumption Per Citizen', /^2$/],
    ['startingtreasury', 'Starting Treasury', /^150$/],
    ['goldenageduration', 'Golden Age Duration', /^20$/],
    ['defaultdifficultylevel', 'Default AI Difficulty', /Warlord/i],
    ['defaultmoneyresource', 'Default Money Resource', /Treasure/i],
    ['towndefencebonus', 'Town', /^20$/],
    ['citydefencebonus', 'City', /^20$/],
    ['metropolisdefencebonus', 'Metropolis', /^20$/],
    ['fortressdefencebonus', 'Fortress', /^50$/],
    ['riverdefensivebonus', 'River', /^25$/],
    ['fortificationsdefencebonus', 'Fortification', /^15$/],
    ['citizendefensivebonus', 'Citizen', /^70$/],
    ['buildingdefensivebonus', 'Building', /^70$/],
    ['questionmark1', 'Unknown 1', /^50$/],
    ['questionmark2', 'Unknown 2', /^2$/],
    ['questionmark3', 'Unknown 3', /^16$/],
    ['questionmark4', 'Unknown 4', /^1000$/]
  ];

  checks.forEach(([key, expectedLabel, pattern]) => {
    const field = getField(ruleRecord, key);
    assert.ok(field, `Expected RULE field ${key}`);
    assert.equal(field.label, expectedLabel, `Expected ${key} label to match Quint`);
    assert.match(String(field.value || ''), pattern, `Expected ${key} value to match ${pattern}`);
  });
});
