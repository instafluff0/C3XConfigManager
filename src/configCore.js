const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const FILE_SPECS = {
  base: {
    defaultName: 'default.c3x_config.ini',
    userName: 'custom.c3x_config.ini',
    scenarioName: 'scenario.c3x_config.ini',
    sectionMarker: null,
    title: 'C3X'
  },
  districts: {
    defaultName: 'default.districts_config.txt',
    userName: 'user.districts_config.txt',
    scenarioName: 'scenario.districts_config.txt',
    sectionMarker: '#District',
    title: 'Districts'
  },
  wonders: {
    defaultName: 'default.districts_wonders_config.txt',
    userName: 'user.districts_wonders_config.txt',
    scenarioName: 'scenario.districts_wonders_config.txt',
    sectionMarker: '#Wonder',
    title: 'Wonder Districts'
  },
  naturalWonders: {
    defaultName: 'default.districts_natural_wonders_config.txt',
    userName: 'user.districts_natural_wonders_config.txt',
    scenarioName: 'scenario.districts_natural_wonders_config.txt',
    sectionMarker: '#Wonder',
    title: 'Natural Wonders'
  },
  animations: {
    defaultName: 'default.tile_animations.txt',
    userName: 'user.tile_animations.txt',
    scenarioName: 'scenario.tile_animations.txt',
    sectionMarker: '#Animation',
    title: 'Tile Animations'
  }
};

const REFERENCE_TAB_SPECS = [
  { key: 'civilizations', title: 'Civs', prefix: 'RACE_' },
  { key: 'technologies', title: 'Techs', prefix: 'TECH_' },
  { key: 'resources', title: 'Resources', prefix: 'GOOD_' },
  { key: 'improvements', title: 'Improvements', prefix: 'BLDG_' },
  { key: 'governments', title: 'Governments', prefix: 'GOVT_' },
  { key: 'units', title: 'Units', prefix: 'PRTO_' },
  { key: 'gameConcepts', title: 'Game Concepts', prefix: 'GCON_' },
  { key: 'terrainPedia', title: 'Terrain', prefix: 'TERR_' },
  { key: 'workerActions', title: 'Worker Actions', prefix: 'TFRM_' }
];

const BIQ_STRUCTURE_TAB_SPECS = [
  { key: 'scenarioSettings', title: 'Scenario Settings', sectionCodes: ['GAME'] },
  { key: 'players', title: 'Players', sectionCodes: ['LEAD'] },
  { key: 'terrain', title: 'Terrain', sectionCodes: ['TERR', 'TFRM'] },
  { key: 'world', title: 'World', sectionCodes: ['WSIZ', 'WCHR', 'ERAS'] },
  { key: 'rules', title: 'Rules', sectionCodes: ['RULE', 'DIFF', 'ESPN', 'CTZN', 'CULT', 'EXPR', 'FLAV'] }
];

const BIQ_SECTION_DEFS = [
  { code: 'BLDG', title: 'Buildings', mode: 'len' },
  { code: 'CTZN', title: 'Citizens', mode: 'len' },
  { code: 'CULT', title: 'Culture', mode: 'len' },
  { code: 'DIFF', title: 'Difficulties', mode: 'len' },
  { code: 'ERAS', title: 'Eras', mode: 'len' },
  { code: 'ESPN', title: 'Espionage', mode: 'len' },
  { code: 'EXPR', title: 'Experience', mode: 'len' },
  { code: 'GOOD', title: 'Resources', mode: 'len' },
  { code: 'GOVT', title: 'Governments', mode: 'len' },
  { code: 'RULE', title: 'Rules', mode: 'len' },
  { code: 'PRTO', title: 'Units', mode: 'len' },
  { code: 'RACE', title: 'Civilizations', mode: 'len' },
  { code: 'TECH', title: 'Technologies', mode: 'len' },
  { code: 'TFRM', title: 'Worker Jobs', mode: 'len' },
  { code: 'TERR', title: 'Terrain', mode: 'len' },
  { code: 'WSIZ', title: 'World Sizes', mode: 'len' },
  { code: 'FLAV', title: 'Flavors', mode: 'len', optional: true },
  { code: 'WCHR', title: 'World Characteristics', mode: 'len', optional: true },
  { code: 'WMAP', title: 'World Map', mode: 'len', optional: true },
  { code: 'TILE', title: 'Tiles', mode: 'fixed', fixedByVersion: true, optional: true },
  { code: 'CONT', title: 'Continents', mode: 'fixed', fixedSize: 12, optional: true },
  { code: 'SLOC', title: 'Starting Locations', mode: 'fixed', fixedSize: 20, optional: true },
  { code: 'CITY', title: 'Cities', mode: 'len', optional: true },
  { code: 'UNIT', title: 'Map Units', mode: 'len', optional: true },
  { code: 'CLNY', title: 'Colonies', mode: 'len', optional: true },
  { code: 'GAME', title: 'Scenario Properties', mode: 'len' },
  { code: 'LEAD', title: 'Players', mode: 'len', optional: true }
];
const MAX_BIQ_RECORDS_PER_SECTION = 400;
const MAX_BIQ_BRIDGE_RECORDS_PER_SECTION = 600;

function getBiqBridgeRecordLimit(sectionCode) {
  const code = String(sectionCode || '').toUpperCase();
  if (code === 'TILE') return Number.POSITIVE_INFINITY;
  if (code === 'CITY' || code === 'UNIT' || code === 'CLNY') return 8000;
  return MAX_BIQ_BRIDGE_RECORDS_PER_SECTION;
}

function readUInt32LESafe(buf, offset) {
  if (offset < 0 || offset + 4 > buf.length) return null;
  return buf.readUInt32LE(offset);
}

function toBiqString(buf, start, end) {
  const out = buf.subarray(start, end).toString('latin1');
  const nullPos = out.indexOf('\0');
  return (nullPos >= 0 ? out.slice(0, nullPos) : out).trim();
}

function readBiqTag(buf, offset) {
  if (offset < 0 || offset + 4 > buf.length) return '';
  return buf.subarray(offset, offset + 4).toString('latin1');
}

function findBiqDecompressorJar(civ3Path) {
  const candidates = [
    process.env.C3X_BIQ_DECOMPRESSOR_JAR || '',
    process.resourcesPath ? path.join(process.resourcesPath, 'vendor', 'BIQDecompressor.jar') : '',
    path.join(__dirname, '..', 'vendor', 'BIQDecompressor.jar')
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || '';
}

function findJavaBinary(javaPath) {
  if (javaPath && fs.existsSync(javaPath)) {
    return javaPath;
  }
  return 'java';
}

function findBiqBridgeClasspath() {
  const classDirs = [
    path.join(__dirname, '..', 'vendor', 'biqbridge'),
    process.resourcesPath ? path.join(process.resourcesPath, 'vendor', 'biqbridge') : ''
  ].filter(Boolean);
  const depsJars = [
    path.join(__dirname, '..', 'vendor', 'lib', 'xplatformeditor-1.12-jar-with-dependencies.jar'),
    process.resourcesPath ? path.join(process.resourcesPath, 'vendor', 'lib', 'xplatformeditor-1.12-jar-with-dependencies.jar') : ''
  ].filter(Boolean);
  const classDir = classDirs.find((p) => fs.existsSync(path.join(p, 'BiqBridge.class'))) || '';
  const depsJar = depsJars.find((p) => fs.existsSync(p)) || '';
  if (!classDir || !depsJar) return '';
  return [classDir, depsJar].join(path.delimiter);
}

function inflateBiqIfNeeded(filePath, civ3Path, javaPath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { ok: false, error: `BIQ file not found: ${filePath || '(empty path)'}` };
  }
  const raw = fs.readFileSync(filePath);
  const magic = raw.subarray(0, 4).toString('latin1');
  if (magic.startsWith('BIC')) {
    return { ok: true, buffer: raw, compressed: false, decompressorPath: '' };
  }

  const decompressorPath = findBiqDecompressorJar(civ3Path);
  if (!decompressorPath) {
    return {
      ok: false,
      error: 'BIQ appears compressed and no bundled BIQ decompressor was found.'
    };
  }

  const tmpBase = path.join(
    os.tmpdir(),
    `c3x-biq-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
  );
  const outPath = `${tmpBase}.biq`;
  try {
    const javaBinary = findJavaBinary(javaPath);
    const proc = spawnSync(javaBinary, ['-jar', decompressorPath, filePath, outPath], {
      encoding: 'utf8'
    });
    if (proc.status !== 0 || !fs.existsSync(outPath)) {
      return {
        ok: false,
        error: `BIQ decompression failed: ${proc.stderr || proc.stdout || 'unknown error'}`
      };
    }
    const inflated = fs.readFileSync(outPath);
    return { ok: true, buffer: inflated, compressed: true, decompressorPath };
  } catch (err) {
    return { ok: false, error: `BIQ decompression failed: ${err.message}` };
  } finally {
    try {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    } catch (_err) {
      // Best effort temp cleanup.
    }
  }
}

function normalizeBiqFieldKey(rawKey) {
  return String(rawKey || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function canonicalFieldKey(raw) {
  return String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toExpectedSetterFromBaseKey(baseKey) {
  const parts = String(baseKey || '').split(/_+/).filter(Boolean);
  if (parts.length === 0) return '';
  return `set${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`;
}

function cleanDisplayText(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001f]+/g, '')
    .trim();
}

function scoreHumanReadableText(text) {
  const s = String(text || '');
  if (!s) return 0;
  let letters = 0;
  let digits = 0;
  let spaces = 0;
  let punctuation = 0;
  let weird = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) || 0;
    if ((cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122) || cp > 159) letters += 1;
    else if (cp >= 48 && cp <= 57) digits += 1;
    else if (cp === 32 || cp === 9) spaces += 1;
    else if (',.;:!?()[]{}\'"\\/+-_%&'.includes(ch)) punctuation += 1;
    else weird += 1;
  }
  return (letters * 2) + digits + spaces + punctuation - (weird * 3);
}

function maybeNormalizeMojibake(text) {
  const raw = cleanDisplayText(text);
  if (!raw) return raw;
  let best = raw;
  let bestScore = scoreHumanReadableText(raw);
  try {
    const latinAsUtf8 = Buffer.from(raw, 'latin1').toString('utf8').trim();
    if (latinAsUtf8) {
      const s = scoreHumanReadableText(latinAsUtf8);
      if (s > bestScore + 2) {
        best = latinAsUtf8;
        bestScore = s;
      }
    }
  } catch (_err) {
    // ignore conversion failures
  }
  const highChars = Array.from(best).filter((ch) => (ch.codePointAt(0) || 0) > 159).length;
  if (best.length >= 7 && highChars / Math.max(1, best.length) > 0.45 && bestScore < (best.length * 0.9)) {
    return '(unreadable text)';
  }
  return best;
}

function cleanRecordName(value, fallback = '') {
  const raw = String(value == null ? '' : value);
  const truncated = raw.includes('\0') ? raw.slice(0, raw.indexOf('\0')) : raw;
  const cleaned = maybeNormalizeMojibake(truncated);
  return cleaned || fallback;
}

function toTitleFromKey(key) {
  const words = String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function friendlyFieldValue(sectionCode, key, value) {
  const v = cleanDisplayText(value);
  if (sectionCode === 'GOVT' && key === 'corruption') {
    const map = {
      '0': 'Minimal',
      '1': 'Nuisance',
      '2': 'Problematic',
      '3': 'Rampant',
      '4': 'Communal'
    };
    return map[v] ? `${map[v]} (${v})` : v;
  }
  if (sectionCode === 'GOVT' && key === 'hurrying') {
    const map = {
      '0': 'Impossible',
      '1': 'Forced Labor',
      '2': 'Paid Labor'
    };
    return map[v] ? `${map[v]} (${v})` : v;
  }
  return value;
}

function parseEnglishFields(sectionCode, englishText) {
  const fields = [];
  const keyCounts = {};
  const lines = String(englishText || '').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon <= 0) {
      fields.push({ key: 'note', baseKey: 'note', label: 'Note', value: line, editable: false });
      continue;
    }
    const rawKey = line.slice(0, colon).trim();
    const baseKey = normalizeBiqFieldKey(rawKey) || 'field';
    keyCounts[baseKey] = (keyCounts[baseKey] || 0) + 1;
    const key = keyCounts[baseKey] > 1 ? `${baseKey}_${keyCounts[baseKey]}` : baseKey;
    const rawValue = maybeNormalizeMojibake(line.slice(colon + 1));
    const value = friendlyFieldValue(sectionCode, baseKey, rawValue);
    fields.push({ key, baseKey, label: toTitleFromKey(rawKey), value: cleanDisplayText(value), editable: false });
  }
  return fields;
}

function parseIntMaybe(value) {
  const s = cleanDisplayText(value);
  if (!/^[-+]?\d+$/.test(s)) return null;
  return Number.parseInt(s, 10);
}

function getRecordNameByIndex(indexMap, idxValue) {
  const idx = parseIntMaybe(idxValue);
  if (idx == null || idx < 0) return '';
  return indexMap[idx] || '';
}

function maybeFormatIdReference(indexMap, value, noneLabel = 'None') {
  const idx = parseIntMaybe(value);
  if (idx == null) return cleanDisplayText(value);
  if (idx < 0) return noneLabel;
  const name = indexMap[idx];
  return name ? `${name} (${idx})` : String(idx);
}

function toBoolStringFromInt(value) {
  const n = parseIntMaybe(value);
  if (n == null) return cleanDisplayText(value);
  return n === 0 ? 'false' : 'true';
}

function normalizeBoolish(value) {
  const s = cleanDisplayText(value).toLowerCase();
  if (s === 'true' || s === 'false') return s;
  return toBoolStringFromInt(value);
}

function maybeFormatIdReferenceOneBased(indexMap, value, noneLabel = 'None') {
  const idx = parseIntMaybe(value);
  if (idx == null) return cleanDisplayText(value);
  if (idx <= 0) return noneLabel;
  const name = indexMap[idx - 1];
  return name ? `${name} (${idx})` : String(idx);
}

function toMonthName(value) {
  const n = parseIntMaybe(value);
  if (n == null || n < 1 || n > 12) return cleanDisplayText(value);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return `${months[n - 1]} (${n})`;
}

function applyFieldLabelOverrides(sectionCode, field) {
  const key = String(field.key || '').toLowerCase();
  const overrides = {
    GOOD: {
      appearanceratio: 'Appearance Ratio',
      disapperanceprobability: 'Disappearance Probability',
      foodbonus: 'Food Bonus',
      shieldsbonus: 'Shields Bonus',
      commercebonus: 'Commerce Bonus',
      type: 'Resource Type',
      prerequisite: 'Required Technology',
      icon: 'Civilopedia Icon Index'
    },
    TFRM: {
      turnstocomplete: 'Turns To Complete',
      requiredadvance: 'Required Technology',
      requiredresource1: 'Required Resource 1',
      requiredresource2: 'Required Resource 2',
      order: 'Worker Order'
    },
    CTZN: {
      defaultcitizen: 'Default Citizen',
      prerequisite: 'Required Technology',
      pluralname: 'Plural Name',
      luxuries: 'Luxury Output',
      research: 'Research Output',
      taxes: 'Tax Output',
      corruption: 'Corruption Output',
      construction: 'Construction Output'
    },
    RULE: {
      townname: 'Town Name',
      cityname: 'City Name',
      metropolisname: 'Metropolis Name',
      numspaceshipparts: 'Number of Spaceship Parts',
      advancedbarbarian: 'Advanced Barbarian Unit',
      basicbarbarian: 'Basic Barbarian Unit',
      barbarianseaunit: 'Barbarian Sea Unit',
      citiesforarmy: 'Cities Required For Army',
      chanceofrioting: 'Chance Of Rioting (%)',
      draftturnpenalty: 'Draft Turn Penalty',
      shieldcostingold: 'Shield Cost In Gold',
      fortressdefencebonus: 'Fortress Defense Bonus (%)',
      citizensaffectedbyhappyface: 'Citizens Affected By Happy Face',
      forestvalueinshields: 'Forest Value In Shields',
      shieldvalueingold: 'Shield Value In Gold',
      citizenvalueinshields: 'Citizen Value In Shields',
      battlecreatedunit: 'Battle-Created Unit',
      buildarmyunit: 'Build Army Unit',
      buildingdefensivebonus: 'Building Defense Bonus (%)',
      citizendefensivebonus: 'Citizen Defense Bonus (%)',
      defaultmoneyresource: 'Default Currency Resource',
      chancetointerceptairmissions: 'Chance To Intercept Air Missions (%)',
      chancetointerceptstealthmissions: 'Chance To Intercept Stealth Missions (%)',
      startingtreasury: 'Starting Treasury',
      foodconsumptionpercitizen: 'Food Consumption Per Citizen',
      riverdefensivebonus: 'River Defense Bonus (%)',
      turnpenaltyforwhip: 'Whip Turn Penalty',
      scout: 'Scout Unit',
      slave: 'Slave Unit',
      roadmovementrate: 'Road Movement Rate',
      startunit1: 'Start Unit 1',
      startunit2: 'Start Unit 2',
      wltkdminimumpop: 'WLTKD Minimum Population',
      towndefencebonus: 'Town Defense Bonus (%)',
      citydefencebonus: 'City Defense Bonus (%)',
      metropolisdefencebonus: 'Metropolis Defense Bonus (%)',
      maxcity1size: 'Max Town Size',
      maxcity2size: 'Max City Size',
      fortificationsdefencebonus: 'Fortification Defense Bonus (%)',
      numculturallevels: 'Number Of Cultural Levels',
      borderexpansionmultiplier: 'Border Expansion Multiplier',
      borderfactor: 'Border Factor',
      futuretechcost: 'Future Tech Cost',
      goldenageduration: 'Golden Age Duration',
      maximumresearchtime: 'Maximum Research Time',
      minimumresearchtime: 'Minimum Research Time',
      flagunit: 'Flag Unit',
      upgradecost: 'Upgrade Cost',
      defaultdifficultylevel: 'Default Difficulty'
    },
    BLDG: {
      gainineverycity: 'Gain In Every City',
      gainoncontinent: 'Gain On Continent',
      reqimprovement: 'Required Improvement',
      reqgovernment: 'Required Government',
      reqadvance: 'Required Technology',
      obsoleteby: 'Obsolete By',
      reqresource1: 'Required Resource 1',
      reqresource2: 'Required Resource 2',
      spaceshippart: 'Spaceship Part',
      unitproduced: 'Unit Produced',
      unitfrequency: 'Unit Production Frequency'
    },
    PRTO: {
      requiredtech: 'Required Technology',
      upgradeto: 'Upgrade To',
      requiredresource1: 'Required Resource 1',
      requiredresource2: 'Required Resource 2',
      requiredresource3: 'Required Resource 3',
      enslaveresultsin: 'Enslave Results In',
      enslaveresultsinto: 'Enslave Results Into',
      requiressupport: 'Requires Support',
      bombardeffects: 'Bombard Effects',
      createscraters: 'Creates Craters',
      hitpointbonus: 'Hit Point Bonus',
      zoneofcontrol: 'Zone Of Control',
      iconindex: 'Civilopedia Icon Index',
      unitclass: 'Unit Class'
    },
    RACE: {
      culturegroup: 'Culture Group',
      defaultcolor: 'Default Color',
      diplomacytextindex: 'Diplomacy Dialogue Slot',
      freetech1index: 'Free Tech 1',
      freetech2index: 'Free Tech 2',
      freetech3index: 'Free Tech 3',
      freetech4index: 'Free Tech 4',
      favoritegovernment: 'Favorite Government',
      shunnedgovernment: 'Shunned Government',
      kingunit: 'King Unit',
      leadername: 'Leader Name',
      leadertitle: 'Leader Title'
    },
    TECH: {
      prerequisite1: 'Prerequisite 1',
      prerequisite2: 'Prerequisite 2',
      prerequisite3: 'Prerequisite 3',
      prerequisite4: 'Prerequisite 4',
      advanceicon: 'Advance Icon Index'
    },
    TERR: {
      numpossibleresources: 'Number Of Possible Resources',
      foodbonus: 'Food Bonus',
      shieldsbonus: 'Shields Bonus',
      commercebonus: 'Commerce Bonus',
      defencebonus: 'Defense Bonus (%)',
      movementcost: 'Movement Cost',
      workerjob: 'Related Worker Job',
      pollutioneffect: 'Pollution Effect',
      allowcities: 'Allow Cities',
      allowcolonies: 'Allow Colonies',
      impassable: 'Impassable',
      impassablebywheeled: 'Impassable By Wheeled Units',
      allowairfields: 'Allow Airfields',
      allowforts: 'Allow Forts',
      allowoutposts: 'Allow Outposts',
      allowradartowers: 'Allow Radar Towers',
      landmarkenabled: 'Landmark Enabled',
      landmarkfood: 'Landmark Food',
      landmarkshields: 'Landmark Shields',
      landmarkcommerce: 'Landmark Commerce',
      landmarkfoodbonus: 'Landmark Food Bonus',
      landmarkshieldsbonus: 'Landmark Shields Bonus',
      landmarkcommercebonus: 'Landmark Commerce Bonus',
      landmarkmovementcost: 'Landmark Movement Cost',
      landmarkdefencebonus: 'Landmark Defense Bonus (%)',
      landmarkname: 'Landmark Name',
      landmarkcivilopediaentry: 'Landmark Civilopedia Entry',
      terrainflags: 'Terrain Flags',
      diseasestrength: 'Disease Strength'
    },
    WSIZ: {
      optimalnumberofcities: 'Optimal Number Of Cities',
      techrate: 'Tech Rate (%)',
      distancebetweencivs: 'Distance Between Civilizations',
      numberofcivs: 'Number Of Civilizations',
      width: 'Map Width',
      height: 'Map Height'
    },
    ERAS: {
      usedresearchernames: 'Used Researcher Names',
      researcher1: 'Researcher Name 1',
      researcher2: 'Researcher Name 2',
      researcher3: 'Researcher Name 3',
      researcher4: 'Researcher Name 4',
      researcher5: 'Researcher Name 5'
    },
    DIFF: {
      contentcitizens: 'Content Citizens',
      maxgovttransition: 'Max Government Transition Turns',
      aidefencestart: 'AI Defense Units At Start',
      aioffencestart: 'AI Offense Units At Start',
      extrastart1: 'Extra Start Unit 1',
      extrastart2: 'Extra Start Unit 2',
      additionalfreesupport: 'Additional Free Unit Support',
      bonuspercity: 'Bonus Per City',
      attackbarbariansbonus: 'Attack Barbarians Bonus (%)',
      costfactor: 'Cost Factor',
      percentoptimal: 'Optimal City Number Percent',
      aiaitrade: 'AI-AI Trade Rate (%)',
      corruptionpercent: 'Corruption Percent',
      militarylaw: 'Military Law Units'
    },
    ESPN: {
      missionperformedby: 'Mission Performed By',
      basecost: 'Base Cost'
    },
    EXPR: {
      basehitpoints: 'Base Hit Points',
      retreatbonus: 'Retreat Bonus (%)'
    },
    FLAV: {
      numberofflavors: 'Number Of Flavors'
    },
    CULT: {
      initresistancechance: 'Initial Resistance Chance (%)',
      continuedresistancechance: 'Continued Resistance Chance (%)',
      propagandasuccess: 'Propaganda Success (%)',
      rationumerator: 'Culture Ratio Numerator',
      ratiodenominator: 'Culture Ratio Denominator',
      cultratiopercent: 'Culture Ratio Percent'
    },
    GOVT: {
      defaulttype: 'Default Type',
      numberofgovernments: 'Number Of Governments',
      rulertitlepairsused: 'Ruler Title Pairs Used',
      malerulertitle1: 'Male Ruler Title 1',
      malerulertitle2: 'Male Ruler Title 2',
      malerulertitle3: 'Male Ruler Title 3',
      malerulertitle4: 'Male Ruler Title 4',
      femalerulertitle1: 'Female Ruler Title 1',
      femalerulertitle2: 'Female Ruler Title 2',
      femalerulertitle3: 'Female Ruler Title 3',
      femalerulertitle4: 'Female Ruler Title 4',
      freeunitspertown: 'Free Units Per Town',
      freeunitspercity: 'Free Units Per City',
      freeunitspermetropolis: 'Free Units Per Metropolis',
      costperunit: 'Unit Cost Over Free Limit',
      militarypolicelimit: 'Military Police Limit',
      draftlimit: 'Draft Limit',
      transitiontype: 'Transition Type',
      resistancemodifier: 'Resistance Modifier',
      briberymodifier: 'Bribery Modifier',
      assimilationchance: 'Assimilation Chance (%)',
      warweariness: 'War Weariness',
      commercebonus: 'Commerce Bonus (%)',
      tilepenalty: 'Tile Penalty',
      sciencecap: 'Science Cap (%)',
      workerrate: 'Worker Rate',
      canbribe: 'Can Bribe',
      requiresmaintenance: 'Requires Maintenance',
      forceresettlement: 'Force Resettlement',
      xenophobic: 'Xenophobic'
    },
    GAME: {
      usedefaultrules: 'Use Default Rules',
      defaultvictoryconditions: 'Default Victory Conditions',
      numberofplayablecivs: 'Number Of Playable Civilizations',
      advancementvp: 'Advancement Victory Points',
      defeatingopposingunitvp: 'Defeating Unit Victory Points',
      cityconquestvp: 'City Conquest Victory Points',
      victorypointvp: 'Victory Point Victory Points',
      capturespecialunitvp: 'Capture Special Unit Victory Points',
      victorypointlimit: 'Victory Point Limit',
      cityeliminationcount: 'City Elimination Count',
      onecityculturewinlimit: 'One-City Culture Win Limit',
      allcitiesculturewinlimit: 'All-Cities Culture Win Limit',
      dominationterrainpercent: 'Domination Terrain Percent',
      dominationpopulationpercent: 'Domination Population Percent',
      wondervp: 'Wonder Victory Points',
      usetimelimit: 'Use Time Limit',
      basetimeunit: 'Base Time Unit',
      startmonth: 'Start Month',
      startweek: 'Start Week',
      startyear: 'Start Year',
      minutetimelimit: 'Minute Time Limit',
      turntimelimit: 'Turn Time Limit',
      scenariosearchfolders: 'Scenario Search Folders',
      alliancevictorytype: 'Alliance Victory Type',
      plaugename: 'Plague Name',
      permitplagues: 'Permit Plagues',
      plagueearlieststart: 'Plague Earliest Start',
      plaguevariation: 'Plague Variation',
      plagueduration: 'Plague Duration',
      plaguestrength: 'Plague Strength',
      plaguegraceperiod: 'Plague Grace Period',
      plaguemaxoccurance: 'Plague Max Occurrence',
      respawnflagunits: 'Respawn Flag Units',
      captureanyflag: 'Capture Any Flag',
      goldforcapture: 'Gold For Capture',
      mapvisible: 'Map Visible',
      retainculture: 'Retain Culture',
      eruptionperiod: 'Eruption Period',
      mpbasetime: 'Multiplayer Base Time',
      mpcitytime: 'Multiplayer City Time',
      mpunittime: 'Multiplayer Unit Time'
    },
    LEAD: {
      civ: 'Civilization',
      leadername: 'Leader Name',
      genderofleadername: 'Leader Name Gender',
      government: 'Government',
      color: 'Color Index',
      initialera: 'Initial Era',
      startcash: 'Start Cash',
      humanplayer: 'Human Player',
      customcivdata: 'Custom Civilization Data',
      startembassies: 'Start Embassies',
      skipfirstturn: 'Skip First Turn',
      numberofdifferentstartunits: 'Number Of Different Start Units',
      numberofstartingtechnologies: 'Number Of Starting Technologies'
    },
    WCHR: {
      worldsize: 'World Size',
      selectedlandform: 'Selected Landform',
      selectedtemperature: 'Selected Temperature',
      selectedclimate: 'Selected Climate',
      selectedage: 'Selected Age',
      selectedbarbarianactivity: 'Selected Barbarian Activity',
      selectedoceancoverage: 'Selected Ocean Coverage',
      actuallandform: 'Actual Landform',
      actualtemperature: 'Actual Temperature',
      actualclimate: 'Actual Climate',
      actualage: 'Actual Age',
      actualbarbarianactivity: 'Actual Barbarian Activity',
      actualoceancoverage: 'Actual Ocean Coverage'
    },
    WMAP: {
      mapseed: 'Map Seed',
      width: 'Map Width',
      height: 'Map Height',
      numcivs: 'Number Of Civilizations',
      numcontinents: 'Number Of Continents',
      numresources: 'Number Of Resources',
      distancebetweencivs: 'Distance Between Civilizations',
      xwrapping: 'X Wrapping',
      ywrapping: 'Y Wrapping',
      polar_ice_caps: 'Polar Ice Caps'
    },
    CITY: {
      owner: 'Owner',
      ownertype: 'Owner Type',
      citylevel: 'City Level',
      useautoname: 'Use Auto Name',
      haspalace: 'Has Palace',
      haswalls: 'Has Walls',
      numbuildings: 'Number Of Buildings',
      borderlevel: 'Border Level',
      culture: 'Culture'
    },
    UNIT: {
      unit_index: 'Unit',
      owner: 'Owner',
      ownertype: 'Owner Type',
      experiencelevel: 'Experience Level',
      aistrategy: 'AI Strategy',
      ptwcustomname: 'Custom Name',
      usecivilizationking: 'Use Civilization King'
    },
    CLNY: {
      owner: 'Owner',
      ownertype: 'Owner Type',
      improvementtype: 'Improvement Type'
    },
    TILE: {
      tileid: 'Tile Id',
      baserealterrain: 'Base Real Terrain',
      c3cbaserealterrain: 'C3C Base Real Terrain',
      bonuses: 'Bonuses',
      c3cbonuses: 'C3C Bonuses',
      overlays: 'Overlays',
      c3coverlays: 'C3C Overlays',
      riverconnectioninfo: 'River Connection Info',
      rivercrossingdata: 'River Crossing Data',
      resource: 'Resource',
      city: 'City',
      colony: 'Colony',
      continent: 'Continent',
      owner: 'Owner',
      border: 'Border',
      bordercolor: 'Border Color',
      fogofwar: 'Fog Of War',
      barbariantribe: 'Barbarian Tribe',
      victorypointlocation: 'Victory Point Location',
      unit_on_tile: 'Unit On Tile',
      ruin: 'Ruin'
    },
    CONT: {
      numtiles: 'Number Of Tiles',
      continentclass: 'Continent Class'
    }
  };
  if (overrides[sectionCode] && overrides[sectionCode][key]) {
    field.label = overrides[sectionCode][key];
  }
}

function enrichBridgeSections(sections) {
  const byCode = new Map();
  sections.forEach((s) => byCode.set(s.code, s));
  const makeIndex = (code) => {
    const section = byCode.get(code);
    const map = {};
    if (!section || !Array.isArray(section.records)) return map;
    section.records.forEach((r, idx) => {
      map[idx] = cleanDisplayText(r.name || `${code} ${idx + 1}`);
    });
    return map;
  };

  const techIndex = makeIndex('TECH');
  const govIndex = makeIndex('GOVT');
  const unitIndex = makeIndex('PRTO');
  const bldgIndex = makeIndex('BLDG');
  const goodIndex = makeIndex('GOOD');
  const eraIndex = makeIndex('ERAS');
  const raceIndex = makeIndex('RACE');
  const leadIndex = makeIndex('LEAD');
  const wsizIndex = makeIndex('WSIZ');
  const cityIndex = makeIndex('CITY');
  const colonyIndex = makeIndex('CLNY');
  const contIndex = makeIndex('CONT');
  const diffIndex = makeIndex('DIFF');
  const tfrmIndex = makeIndex('TFRM');
  const terrIndex = makeIndex('TERR');
  const flavIndex = makeIndex('FLAV');

  sections.forEach((section) => {
    const code = section.code;
    (section.records || []).forEach((record) => {
      const writableBaseKeySet = new Set(
        Array.isArray(record.writableBaseKeys)
          ? record.writableBaseKeys.map((k) => canonicalFieldKey(k))
          : []
      );
      (record.fields || []).forEach((field) => {
        const k = String(field.key || '').toLowerCase();
        const baseKey = String(field.baseKey || '').toLowerCase() || k.replace(/_\d+$/, '');
        field.baseKey = baseKey;
        field.expectedSetter = toExpectedSetterFromBaseKey(baseKey);
        field.editable = writableBaseKeySet.has(canonicalFieldKey(baseKey));
        const v = cleanDisplayText(field.value);

        // Batch 1: explicit cross-reference decoding for GOVT/TECH/PRTO/BLDG/RACE.
        if (code === 'GOVT') {
          if (k === 'prerequisitetechnology') field.value = maybeFormatIdReference(techIndex, v);
          else if (k === 'immuneto') field.value = maybeFormatIdReference(govIndex, v);
          else if (k === 'canbribe' || k === 'requiresmaintenance' || k === 'forceresettlement' || k === 'xenophobic') field.value = toBoolStringFromInt(v);
        } else if (code === 'TECH') {
          if (k === 'era') field.value = maybeFormatIdReference(eraIndex, v);
          else if (k.startsWith('prerequisite')) field.value = maybeFormatIdReference(techIndex, v);
        } else if (code === 'PRTO') {
          if (k === 'requiredtech') field.value = maybeFormatIdReference(techIndex, v);
          else if (k === 'upgradeto') field.value = maybeFormatIdReference(unitIndex, v);
          else if (k.startsWith('requiredresource')) field.value = maybeFormatIdReference(goodIndex, v);
          else if (k === 'enslaveresultsin' || k === 'enslaveresultsinto') field.value = maybeFormatIdReference(unitIndex, v);
          else if (k === 'unitclass') {
            const unitClassMap = { '0': 'Land (0)', '1': 'Sea (1)', '2': 'Air (2)' };
            field.value = unitClassMap[v] || v;
          } else if (k === 'requiressupport' || k === 'bombardeffects' || k === 'createscraters' || k === 'hitpointbonus' || k === 'zoneofcontrol') {
            field.value = toBoolStringFromInt(v);
          }
        } else if (code === 'BLDG') {
          if (k === 'reqimprovement') field.value = maybeFormatIdReference(bldgIndex, v);
          else if (k === 'reqgovernment') field.value = maybeFormatIdReference(govIndex, v);
          else if (k === 'obsoleteby') field.value = maybeFormatIdReference(techIndex, v);
          else if (k.startsWith('reqresource')) field.value = maybeFormatIdReference(goodIndex, v);
          else if (k === 'reqadvance' && /^name\s*:/i.test(v)) field.value = cleanDisplayText(v.replace(/^name\s*:/i, ''));
          else if (k === 'unitproduced') field.value = maybeFormatIdReference(unitIndex, v);
        } else if (code === 'RACE') {
          if (k.startsWith('freetech')) field.value = maybeFormatIdReference(techIndex, v);
          else if (k === 'shunnedgovernment' || k === 'favoritegovernment') field.value = maybeFormatIdReference(govIndex, v);
          else if (k === 'kingunit') field.value = maybeFormatIdReference(unitIndex, v);
          else if (k === 'leadergender') field.value = v === '0' ? 'Male (0)' : v === '1' ? 'Female (1)' : v;
        } else if (code === 'GOOD') {
          if (k === 'type') {
            const typeMap = { '0': 'Bonus', '1': 'Luxury', '2': 'Strategic' };
            const mapped = typeMap[v];
            if (mapped) field.value = `${mapped} (${v})`;
          } else if (k === 'prerequisite') {
            field.value = maybeFormatIdReference(techIndex, v);
          }
        } else if (code === 'TFRM') {
          if (k === 'requiredadvance') field.value = maybeFormatIdReference(techIndex, v);
          else if (k === 'requiredresource1' || k === 'requiredresource2') field.value = maybeFormatIdReference(goodIndex, v);
        } else if (code === 'CTZN') {
          if (k === 'defaultcitizen') field.value = toBoolStringFromInt(v);
          else if (k === 'prerequisite') field.value = maybeFormatIdReference(techIndex, v);
        } else if (code === 'RULE') {
          if (
            k === 'advancedbarbarian' ||
            k === 'basicbarbarian' ||
            k === 'barbarianseaunit' ||
            k === 'battlecreatedunit' ||
            k === 'buildarmyunit' ||
            k === 'scout' ||
            k === 'slave' ||
            k === 'startunit1' ||
            k === 'startunit2' ||
            k === 'flagunit'
          ) {
            field.value = maybeFormatIdReference(unitIndex, v);
          } else if (k === 'defaultmoneyresource') {
            field.value = maybeFormatIdReference(goodIndex, v);
          } else if (k === 'defaultdifficultylevel') {
            field.value = maybeFormatIdReference(diffIndex, v);
          }
        } else if (code === 'TERR') {
          if (k === 'workerjob') {
            field.value = maybeFormatIdReference(tfrmIndex, v);
          } else if (k === 'pollutioneffect') {
            field.value = maybeFormatIdReference(terrIndex, v);
          } else if (['allowcities','allowcolonies','impassable','impassablebywheeled','allowairfields','allowforts','allowoutposts','allowradartowers','landmarkenabled'].includes(k)) {
            field.value = toBoolStringFromInt(v);
          }
        } else if (code === 'ESPN') {
          if (k === 'missionperformedby') {
            field.value = v.charAt(0).toUpperCase() + v.slice(1);
          }
        } else if (code === 'GAME') {
          if (k === 'startmonth') {
            field.value = toMonthName(v);
          } else if (k.startsWith('playable_civ')) {
            field.value = maybeFormatIdReference(raceIndex, v);
          } else if (k === 'acceleratedproduction' ||
            k === 'allowculturalconversions' ||
            k === 'autoplacekings' ||
            k === 'autoplacevictorylocations' ||
            k === 'captureanyflag' ||
            k === 'capturetheflag' ||
            k === 'civspecificabilitiesenabled' ||
            k === 'conquestenabled' ||
            k === 'culturalenabled' ||
            k === 'culturallylinkedstart' ||
            k === 'debugmode' ||
            k === 'defaultvictoryconditions' ||
            k === 'diplomacticenabled' ||
            k === 'dominationenabled' ||
            k === 'eliminationenabled' ||
            k === 'mapvisible' ||
            k === 'massregicideenabled' ||
            k === 'permitplagues' ||
            k === 'placecaptureunits' ||
            k === 'preserverandomseed' ||
            k === 'regicideenabled' ||
            k === 'respawnflagunits' ||
            k === 'restartplayersenabled' ||
            k === 'retainculture' ||
            k === 'reversecapturetheflag' ||
            k === 'spaceraceenabled' ||
            k === 'usedefaultrules' ||
            k === 'usetimelimit' ||
            k === 'victorylocationsenabled' ||
            k === 'wondervictoryenabled') {
            field.value = toBoolStringFromInt(v);
          }
        } else if (code === 'LEAD') {
          if (k === 'civ') field.value = maybeFormatIdReference(raceIndex, v);
          else if (k === 'government') field.value = maybeFormatIdReference(govIndex, v);
          else if (k === 'initialera') field.value = maybeFormatIdReference(eraIndex, v);
          else if (k === 'humanplayer' || k === 'customcivdata' || k === 'startembassies' || k === 'skipfirstturn') field.value = normalizeBoolish(v);
          else if (k === 'genderofleadername') {
            const g = cleanDisplayText(v).toLowerCase();
            field.value = g === 'male' || g === 'female' ? g.charAt(0).toUpperCase() + g.slice(1) : v;
          }
        } else if (code === 'WCHR') {
          if (k === 'worldsize') field.value = maybeFormatIdReference(wsizIndex, v);
        } else if (code === 'WMAP') {
          if (k === 'xwrapping' || k === 'ywrapping' || k === 'polar_ice_caps') field.value = normalizeBoolish(v);
        } else if (code === 'CITY') {
          if (k === 'owner') field.value = maybeFormatIdReferenceOneBased(leadIndex, v);
          else if (k === 'ownertype') {
            const ownerType = { '0': 'None (0)', '1': 'Barbarians (1)', '2': 'Civilization (2)' };
            field.value = ownerType[v] || v;
          } else if (k === 'citylevel') {
            const cityLevel = { '0': 'Town (0)', '1': 'City (1)', '2': 'Metropolis (2)' };
            field.value = cityLevel[v] || v;
          } else if (k === 'useautoname' || k === 'haspalace' || k === 'haswalls') field.value = toBoolStringFromInt(v);
          else if (k.startsWith('building')) field.value = maybeFormatIdReference(bldgIndex, v);
        } else if (code === 'UNIT') {
          if (k === 'unit_index') field.value = maybeFormatIdReference(unitIndex, v);
          else if (k === 'owner') field.value = maybeFormatIdReferenceOneBased(leadIndex, v);
          else if (k === 'ownertype') {
            const ownerType = { '0': 'None (0)', '1': 'Barbarians (1)', '2': 'Civilization (2)' };
            field.value = ownerType[v] || v;
          } else if (k === 'usecivilizationking') field.value = toBoolStringFromInt(v);
        } else if (code === 'CLNY') {
          if (k === 'owner') field.value = maybeFormatIdReferenceOneBased(leadIndex, v);
          else if (k === 'ownertype') {
            const ownerType = { '0': 'None (0)', '1': 'Barbarians (1)', '2': 'Civilization (2)' };
            field.value = ownerType[v] || v;
          }
        } else if (code === 'TILE') {
          if (k === 'resource') field.value = maybeFormatIdReference(goodIndex, v);
          else if (k === 'city') field.value = maybeFormatIdReference(cityIndex, v);
          else if (k === 'colony') field.value = maybeFormatIdReference(colonyIndex, v);
          else if (k === 'continent') field.value = maybeFormatIdReference(contIndex, v);
          else if (k === 'owner') field.value = maybeFormatIdReferenceOneBased(leadIndex, v);
          else if (k === 'fogofwar' || k === 'ruin') field.value = toBoolStringFromInt(v);
        } else if (code === 'CONT') {
          if (k === 'continentclass') {
            const cls = { '0': 'Water (0)', '1': 'Land (1)' };
            field.value = cls[v] || v;
          }
        } else if (code === 'FLAV') {
          const relMatch = k.match(/^relation_with_flavor_(\d+)$/);
          if (relMatch) {
            const idx = Number.parseInt(relMatch[1], 10);
            const flavorName = flavIndex[idx];
            field.label = flavorName ? `Relation With ${flavorName}` : `Relation With Flavor ${idx + 1}`;
          }
        }

        if (code === 'RULE') {
          const partReqMatch = k.match(/^number_of_parts_(\d+)_required$/);
          if (partReqMatch) {
            const partIdx = Number.parseInt(partReqMatch[1], 10);
            field.label = `Spaceship Part ${partIdx + 1} Required`;
          }
        } else if (code === 'GOVT') {
          const vsGovMatch = k.match(/^performance_of_this_government_versus_government_(\d+)$/);
          if (vsGovMatch) {
            const idx = Number.parseInt(vsGovMatch[1], 10);
            const govName = govIndex[idx];
            field.label = govName
              ? `Performance Vs ${govName}`
              : `Performance Vs Government ${idx + 1}`;
          }
        } else if (code === 'BLDG' || code === 'TECH' || code === 'RACE') {
          const flavorMatch = k.match(/^flavor_(\d+)$/);
          if (flavorMatch) {
            const idx = Number.parseInt(flavorMatch[1], 10) - 1;
            const flavorName = flavIndex[idx];
            field.label = flavorName ? `Flavor ${flavorName}` : `Flavor ${flavorMatch[1]}`;
          }
        } else if (code === 'RACE') {
          const fwdEraMatch = k.match(/^forwardfilename_for_era_(\d+)$/);
          if (fwdEraMatch) {
            const idx = Number.parseInt(fwdEraMatch[1], 10);
            const eraName = eraIndex[idx];
            field.label = eraName ? `Forward Filename For ${eraName}` : `Forward Filename For Era ${idx + 1}`;
          }
          const revEraMatch = k.match(/^reversefilename_for_era_(\d+)$/);
          if (revEraMatch) {
            const idx = Number.parseInt(revEraMatch[1], 10);
            const eraName = eraIndex[idx];
            field.label = eraName ? `Reverse Filename For ${eraName}` : `Reverse Filename For Era ${idx + 1}`;
          }
        } else if (code === 'GAME') {
          const timeTurnsMatch = k.match(/^turns_in_time_section_(\d+)$/);
          if (timeTurnsMatch) {
            const idx = Number.parseInt(timeTurnsMatch[1], 10);
            field.label = `Turns In Time Section ${idx + 1}`;
          }
          const timePerTurnMatch = k.match(/^time_per_turn_in_time_section_(\d+)$/);
          if (timePerTurnMatch) {
            const idx = Number.parseInt(timePerTurnMatch[1], 10);
            field.label = `Time Per Turn In Time Section ${idx + 1}`;
          }
          const allianceNameMatch = k.match(/^alliance(\d+)$/);
          if (allianceNameMatch) {
            const idx = Number.parseInt(allianceNameMatch[1], 10);
            field.label = `Alliance ${idx + 1} Name`;
          }
          const warMatch = k.match(/^alliance(\d+)_is_at_war_with_alliance(\d+)_(\d+)$/);
          if (warMatch) {
            const a = Number.parseInt(warMatch[1], 10) + 1;
            const b = Number.parseInt(warMatch[2], 10) + 1;
            field.label = `Alliance ${a} At War With Alliance ${b}`;
            field.value = toBoolStringFromInt(warMatch[3]);
          }
        } else if (code === 'CITY') {
          if (k === 'building') {
            field.label = 'Building 1';
          } else {
            const bldMatch = k.match(/^building_(\d+)$/);
            if (bldMatch) {
              const idx = Number.parseInt(bldMatch[1], 10);
              field.label = `Building ${idx}`;
            }
          }
        }

        field.value = cleanDisplayText(field.value);
        applyFieldLabelOverrides(code, field);
      });
    });
  });
  return sections;
}

function runBiqBridgeOnInflatedBuffer({ buffer, javaPath }) {
  const classpath = findBiqBridgeClasspath();
  if (!classpath) {
    return { ok: false, error: 'BIQ bridge classes not found in vendor/biqbridge and vendor/lib.' };
  }
  const tmpPath = path.join(
    os.tmpdir(),
    `c3x-biq-bridge-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.biq`
  );
  try {
    fs.writeFileSync(tmpPath, buffer);
    const javaBinary = findJavaBinary(javaPath);
    const proc = spawnSync(javaBinary, ['-cp', classpath, 'BiqBridge', tmpPath], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
    if (proc.status !== 0) {
      return { ok: false, error: `BIQ bridge failed: ${proc.stderr || proc.stdout || 'unknown error'}` };
    }
    const raw = String(proc.stdout || '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end < start) {
      return { ok: false, error: 'BIQ bridge output was not valid JSON.' };
    }
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!parsed || !parsed.ok) {
      return { ok: false, error: (parsed && parsed.error) || 'BIQ bridge returned an error.' };
    }

    const sections = (parsed.sections || []).map((section) => {
      const limit = getBiqBridgeRecordLimit(section.code);
      const records = (section.records || [])
        .slice(0, limit)
        .map((record) => ({
          index: record.index || 0,
          name: cleanRecordName(record.name, `${section.code} ${(record.index || 0) + 1}`),
          fields: parseEnglishFields(section.code, record.english || ''),
          writableBaseKeys: Array.isArray(record.writableBaseKeys) ? record.writableBaseKeys : []
        }));
      return {
        id: `${section.code}-${section.count || records.length}`,
        code: section.code,
        title: section.title || section.code,
        count: Number(section.count || records.length),
        records,
        recordsTruncated: Number(section.count || 0) > records.length
      };
    });
    return { ok: true, sections: enrichBridgeSections(sections) };
  } catch (err) {
    return { ok: false, error: `BIQ bridge parsing failed: ${err.message}` };
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (_err) {
      // best effort cleanup
    }
  }
}

function getTileRecordLength(versionTag, majorVersion) {
  if (versionTag === 'BICX' && majorVersion === 12) return 0x2d + 4;
  if (versionTag === 'BICX') return 33;
  if (versionTag === 'BIC ' && majorVersion === 2) return 0x16 + 4;
  return 0x17 + 4;
}

function decodeAsciiSamples(buf, maxSamples = 3) {
  const text = buf.toString('latin1');
  const matches = text.match(/[ -~]{4,}/g) || [];
  return matches.slice(0, maxSamples).map((s) => s.trim()).filter(Boolean);
}

function parseGenericRecordFields(recordData) {
  const fields = [];
  fields.push({ key: 'byte_length', value: String(recordData.length) });
  const maxInts = Math.min(16, Math.floor(recordData.length / 4));
  for (let i = 0; i < maxInts; i += 1) {
    fields.push({ key: `u32_${i}`, value: String(recordData.readUInt32LE(i * 4)) });
  }
  const ascii = decodeAsciiSamples(recordData);
  if (ascii.length > 0) {
    fields.push({ key: 'text_preview', value: ascii.join(' | ') });
  }
  return fields;
}

function parseGameRecordFields(recordData) {
  const fields = [];
  const readI32 = (off) => (off + 4 <= recordData.length ? recordData.readInt32LE(off) : null);
  let offset = 0;
  const pushInt = (key) => {
    const v = readI32(offset);
    fields.push({ key, value: v == null ? '(truncated)' : String(v) });
    offset += 4;
    return v;
  };

  pushInt('use_default_rules');
  pushInt('default_victory_conditions');
  const numPlayableCivs = pushInt('number_of_playable_civs');
  const playableCount = Number.isFinite(numPlayableCivs) && numPlayableCivs > 0 ? numPlayableCivs : 0;
  const playableIds = [];
  for (let i = 0; i < playableCount; i += 1) {
    const v = readI32(offset);
    if (v == null) break;
    playableIds.push(v);
    offset += 4;
  }
  fields.push({ key: 'playable_civ_ids', value: playableIds.join(', ') || '(none)' });
  pushInt('victory_conditions_and_rules');
  pushInt('place_capture_units');
  pushInt('auto_place_kings');
  pushInt('auto_place_victory_locations');
  pushInt('debug_mode');
  pushInt('use_time_limit');
  pushInt('base_time_unit');
  pushInt('start_month');
  pushInt('start_week');
  pushInt('start_year');
  pushInt('minute_time_limit');
  pushInt('turn_time_limit');

  const turnsPerScale = [];
  for (let i = 0; i < 7; i += 1) {
    const v = readI32(offset);
    if (v == null) break;
    turnsPerScale.push(v);
    offset += 4;
  }
  fields.push({ key: 'turns_per_timescale_part', value: turnsPerScale.join(', ') || '(none)' });

  const timeUnitsPerTurn = [];
  for (let i = 0; i < 7; i += 1) {
    const v = readI32(offset);
    if (v == null) break;
    timeUnitsPerTurn.push(v);
    offset += 4;
  }
  fields.push({ key: 'time_units_per_turn', value: timeUnitsPerTurn.join(', ') || '(none)' });

  if (offset + 5200 <= recordData.length) {
    const folders = toBiqString(recordData, offset, offset + 5200);
    fields.push({ key: 'scenario_search_folders', value: folders || '(none)' });
  } else {
    fields.push({ key: 'scenario_search_folders', value: '(truncated)' });
  }

  return fields;
}

function decodeBiqRecordFields(sectionCode, recordData) {
  if (sectionCode === 'GAME') {
    return parseGameRecordFields(recordData);
  }
  return parseGenericRecordFields(recordData);
}

function parseSectionRecords(buf, section, versionTag, majorVersion) {
  const records = [];
  let pos = section.startOffset + 8;
  if (pos > section.endOffset) return records;

  if (section.parseMode === 'fixed') {
    const fixedSize = section.fixedByVersion
      ? getTileRecordLength(versionTag, majorVersion)
      : section.fixedSize;
    if (!fixedSize || fixedSize < 1) return records;
    for (let i = 0; i < section.count && i < MAX_BIQ_RECORDS_PER_SECTION; i += 1) {
      const recStart = pos + i * fixedSize;
      const recEnd = recStart + fixedSize;
      if (recEnd > section.endOffset) break;
      const recordData = buf.subarray(recStart, recEnd);
      records.push({
        index: i,
        recordLength: fixedSize,
        fields: decodeBiqRecordFields(section.code, recordData)
      });
    }
    return records;
  }

  for (let i = 0; i < section.count && i < MAX_BIQ_RECORDS_PER_SECTION && pos + 4 <= section.endOffset; i += 1) {
    const recLen = readUInt32LESafe(buf, pos);
    if (recLen == null || recLen < 0) break;
    const recStart = pos + 4;
    const recEnd = recStart + recLen;
    if (recEnd > section.endOffset) break;
    const recordData = buf.subarray(recStart, recEnd);
    records.push({
      index: i,
      recordLength: recLen,
      fields: decodeBiqRecordFields(section.code, recordData)
    });
    pos = recEnd;
  }
  return records;
}

function parseBiqSectionsFromBuffer(buf) {
  const versionTag = readBiqTag(buf, 0);
  const verHeaderTag = readBiqTag(buf, 4);
  if (!versionTag.startsWith('BIC') || verHeaderTag !== 'VER#') {
    throw new Error('Invalid BIQ header');
  }

  const majorVersion = readUInt32LESafe(buf, 24) || 0;
  const minorVersion = readUInt32LESafe(buf, 28) || 0;
  const biqDescription = toBiqString(buf, 32, 672);
  const biqTitle = toBiqString(buf, 672, 736);
  const numHeaders = readUInt32LESafe(buf, 8) || 0;
  const headerLength = readUInt32LESafe(buf, 12) || 0;

  const findSectionStart = (code, fromOffset) => {
    const needle = Buffer.from(code, 'latin1');
    let idx = buf.indexOf(needle, fromOffset);
    while (idx >= 0) {
      const count = readUInt32LESafe(buf, idx + 4);
      if (count !== null && count < 50_000_000) {
        return { offset: idx, count };
      }
      idx = buf.indexOf(needle, idx + 1);
    }
    return null;
  };

  let searchFrom = 736;
  const located = [];
  for (const def of BIQ_SECTION_DEFS) {
    const found = findSectionStart(def.code, searchFrom);
    if (!found) {
      if (def.optional) continue;
      throw new Error(`Expected section ${def.code} after 0x${searchFrom.toString(16)}`);
    }
    located.push({ ...def, startOffset: found.offset, count: found.count });
    searchFrom = found.offset + 4;
  }

  const sections = [];
  for (let i = 0; i < located.length; i += 1) {
    const def = located[i];
    const next = located[i + 1];
    const endOffset = next ? next.startOffset : buf.length;
    const section = {
      id: `${def.code}-${sections.length + 1}`,
      code: def.code,
      title: def.title,
      count: def.count,
      startOffset: def.startOffset,
      endOffset,
      byteLength: endOffset - def.startOffset,
      parseMode: def.mode
    };
    section.records = parseSectionRecords(buf, section, versionTag, majorVersion);
    section.recordsTruncated = section.count > section.records.length;
    sections.push(section);
  }

  return {
    versionTag,
    verHeaderTag,
    majorVersion,
    minorVersion,
    numHeaders,
    headerLength,
    biqDescription,
    biqTitle,
    totalBytes: buf.length,
    sections
  };
}

function resolveScenarioDir(scenarioPath) {
  const trimmed = String(scenarioPath || '').trim();
  if (!trimmed) return '';
  if (/\.biq$/i.test(trimmed)) return path.dirname(trimmed);
  return trimmed;
}

function resolveScenarioSearchDirsFromBiq({ scenarioPath, civ3Path, biqTab }) {
  const biqDir = resolveScenarioDir(scenarioPath);
  const searchFolders = extractScenarioSearchFolders(biqTab);
  const root = resolveCiv3RootPath(civ3Path);
  const ordered = [];
  const seen = new Set();
  const pushIfDir = (candidate) => {
    const p = String(candidate || '').trim();
    if (!p || seen.has(p)) return;
    try {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        seen.add(p);
        ordered.push(p);
      }
    } catch (_err) {
      // ignore invalid paths
    }
  };

  // Default scenario folder (directory containing the .biq file) has highest precedence.
  pushIfDir(biqDir);

  searchFolders.forEach((folder) => {
    const normalizedFolder = String(folder).replace(/\\/g, '/').trim();
    if (!normalizedFolder) return;
    if (path.isAbsolute(folder) || /^[A-Za-z]:\//.test(normalizedFolder)) {
      pushIfDir(normalizedFolder);
      return;
    }
    pushIfDir(path.join(biqDir, normalizedFolder));
    if (root) {
      pushIfDir(path.join(root, 'Conquests', 'Scenarios', normalizedFolder));
      pushIfDir(path.join(root, 'Conquests', normalizedFolder));
    }
  });
  return ordered;
}

function extractScenarioSearchFolders(biqTab) {
  if (!biqTab || !Array.isArray(biqTab.sections)) return [];
  const game = biqTab.sections.find((s) => s.code === 'GAME');
  if (!game || !Array.isArray(game.records) || game.records.length === 0) return [];
  const field = (game.records[0].fields || []).find((f) => {
    const key = String(f.key || '').toLowerCase();
    const label = String(f.label || '').toLowerCase();
    return key.includes('scenario_search') ||
      key.includes('scenariousearchfolders') ||
      label.includes('scenariosearchfolders') ||
      label.includes('scenario search folders');
  });
  if (!field || !field.value || field.value === '(none)' || field.value === '(truncated)') return [];
  return String(field.value)
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean);
}

function resolveScenarioDirFromBiq({ scenarioPath, civ3Path, biqTab }) {
  const fallback = resolveScenarioDir(scenarioPath);
  const dirs = resolveScenarioSearchDirsFromBiq({ scenarioPath, civ3Path, biqTab });
  return dirs[0] || fallback;
}

function resolveBiqPath({ mode, civ3Path, scenarioPath }) {
  if (mode === 'scenario') {
    const raw = String(scenarioPath || '').trim();
    if (/\.biq$/i.test(raw)) return raw;
    return '';
  }
  const root = resolveCiv3RootPath(civ3Path);
  if (!root) return '';
  return path.join(root, 'Conquests', 'conquests.biq');
}

function loadBiqTab({ mode, civ3Path, scenarioPath, javaPath }) {
  const biqPath = resolveBiqPath({ mode, civ3Path, scenarioPath });
  if (!biqPath) {
    return {
      title: 'BIQ',
      type: 'biq',
      readOnly: true,
      sourcePath: '',
      error: mode === 'scenario'
        ? 'No scenario BIQ selected. Pick a .biq file in Scenario mode.'
        : 'Could not resolve Conquests/conquests.biq from Civilization 3 path.',
      sections: []
    };
  }
  const inflated = inflateBiqIfNeeded(biqPath, civ3Path, javaPath);
  if (!inflated.ok) {
    return {
      title: 'BIQ',
      type: 'biq',
      readOnly: true,
      sourcePath: biqPath,
      error: inflated.error,
      sections: []
    };
  }
  try {
    const bridged = runBiqBridgeOnInflatedBuffer({ buffer: inflated.buffer, javaPath });
    if (bridged.ok) {
      return {
        title: 'BIQ',
        type: 'biq',
        readOnly: true,
        sourcePath: biqPath,
        compressedSource: inflated.compressed,
        decompressorPath: inflated.decompressorPath || '',
        sections: bridged.sections,
        bridgeMode: true
      };
    }

    const parsed = parseBiqSectionsFromBuffer(inflated.buffer);
    return {
      title: 'BIQ',
      type: 'biq',
      readOnly: true,
      sourcePath: biqPath,
      compressedSource: inflated.compressed,
      decompressorPath: inflated.decompressorPath || '',
      bridgeMode: false,
      bridgeError: bridged.error || '',
      ...parsed
    };
  } catch (err) {
    return {
      title: 'BIQ',
      type: 'biq',
      readOnly: true,
      sourcePath: biqPath,
      error: `Failed to parse BIQ sections: ${err.message}`,
      sections: []
    };
  }
}

function readTextIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (_err) {
    return null;
  }
}

const WINDOWS_1252_DECODE_MAP = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178
};

function decodeWindows1252Buffer(buffer) {
  let out = '';
  for (let i = 0; i < buffer.length; i += 1) {
    const b = buffer[i];
    if (b >= 0x80 && b <= 0x9f && WINDOWS_1252_DECODE_MAP[b]) {
      out += String.fromCharCode(WINDOWS_1252_DECODE_MAP[b]);
      continue;
    }
    out += String.fromCharCode(b);
  }
  return out;
}

function readWindows1252TextIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      return buf.toString('utf8');
    }
    return decodeWindows1252Buffer(buf);
  } catch (_err) {
    return null;
  }
}

const WINDOWS_1252_ENCODE_MAP = Object.fromEntries(
  Object.entries(WINDOWS_1252_DECODE_MAP).map(([byte, codePoint]) => [codePoint, Number(byte)])
);

function encodeWindows1252Text(text) {
  const src = String(text == null ? '' : text);
  const bytes = [];
  for (let i = 0; i < src.length; i += 1) {
    const code = src.charCodeAt(i);
    if (code <= 0x7f || (code >= 0xa0 && code <= 0xff)) {
      bytes.push(code);
      continue;
    }
    const mapped = WINDOWS_1252_ENCODE_MAP[code];
    if (Number.isInteger(mapped)) {
      bytes.push(mapped);
      continue;
    }
    bytes.push(0x3f); // '?'
  }
  return Buffer.from(bytes);
}

function normalizeRelativePath(raw) {
  return String(raw || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\.?[\\/]+/, '')
    .replace(/\\/g, '/');
}

function resolveCiv3RootPath(civ3Path) {
  if (!civ3Path) return '';
  const base = path.basename(civ3Path).toLowerCase();
  if (base === 'conquests' || base === 'civ3ptw') {
    return path.dirname(civ3Path);
  }
  return civ3Path;
}

function normalizePathForCompare(value) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function getProtectedBaseCiv3Paths(civ3Path) {
  const root = resolveCiv3RootPath(civ3Path);
  if (!root) return new Set();
  const out = new Set();
  const coreTextBases = [
    path.join(root, 'Text'),
    path.join(root, 'civ3PTW', 'Text'),
    path.join(root, 'Conquests', 'Text')
  ];
  ['Civilopedia.txt', 'PediaIcons.txt', 'diplomacy.txt'].forEach((name) => {
    coreTextBases.forEach((base) => out.add(normalizePathForCompare(path.join(base, name))));
  });
  out.add(normalizePathForCompare(path.join(root, 'Conquests', 'conquests.biq')));
  return out;
}

function isProtectedBaseCiv3Path(civ3Path, targetPath) {
  if (!targetPath) return false;
  const normalized = normalizePathForCompare(path.resolve(String(targetPath)));
  return getProtectedBaseCiv3Paths(civ3Path).has(normalized);
}

function getTextLayerFiles(civ3Path, name) {
  const root = resolveCiv3RootPath(civ3Path);
  if (!root) {
    return [];
  }
  return [
    { layer: 'vanilla', filePath: path.join(root, 'Text', name) },
    { layer: 'ptw', filePath: path.join(root, 'civ3PTW', 'Text', name) },
    { layer: 'conquests', filePath: path.join(root, 'Conquests', 'Text', name) }
  ];
}

function resolveScenarioTextPath(scenarioPath, name, scenarioPaths = []) {
  const roots = [];
  const seen = new Set();
  const addRoot = (root) => {
    const normalized = String(root || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    roots.push(normalized);
  };
  addRoot(resolveScenarioDir(scenarioPath));
  (scenarioPaths || []).forEach((p) => addRoot(p));

  const candidates = [];
  roots.forEach((root) => {
    candidates.push(path.join(root, 'Text', name));
    candidates.push(path.join(root, name));
  });
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function readTextLayers(civ3Path, name, scenarioPath, scenarioPaths = []) {
  const layers = {};
  for (const ref of getTextLayerFiles(civ3Path, name)) {
    layers[ref.layer] = {
      filePath: ref.filePath,
      text: readWindows1252TextIfExists(ref.filePath)
    };
  }
  if (scenarioPath || (scenarioPaths && scenarioPaths.length > 0)) {
    const scenarioTextPath = resolveScenarioTextPath(scenarioPath, name, scenarioPaths);
    if (scenarioTextPath) {
      layers.scenario = {
        filePath: scenarioTextPath,
        text: readWindows1252TextIfExists(scenarioTextPath)
      };
    }
  }
  return layers;
}

function pickHighestLayerText(layers, order = ['scenario', 'conquests', 'ptw', 'vanilla']) {
  for (const layerKey of order) {
    const layer = layers && layers[layerKey];
    if (layer && typeof layer.text === 'string' && layer.text.trim()) {
      return layer;
    }
  }
  return null;
}

function parseCivilopediaSections(text) {
  const sections = {};
  if (!text) return sections;

  const lines = text.split(/\r?\n/);
  let currentKey = null;
  let currentLines = [];
  const flush = () => {
    if (!currentKey) return;
    sections[currentKey] = {
      key: currentKey,
      rawLines: [...currentLines]
    };
  };

  for (const line of lines) {
    if (line.startsWith('#')) {
      flush();
      currentKey = line.slice(1).trim();
      currentLines = [];
      continue;
    }
    if (currentKey) {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

function parsePediaIconsBlocks(text) {
  const blocks = {};
  if (!text) return blocks;
  const lines = text.split(/\r?\n/);
  let currentKey = null;
  let currentLines = [];
  const flush = () => {
    if (!currentKey) return;
    blocks[currentKey] = [...currentLines];
  };

  for (const line of lines) {
    if (line.startsWith('#')) {
      flush();
      currentKey = line.slice(1).trim();
      currentLines = [];
      continue;
    }
    if (!currentKey) continue;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    currentLines.push(trimmed);
  }
  flush();
  return blocks;
}

function parseDiplomacySectionSlotLines(text, sectionName) {
  const src = String(text || '');
  if (!src.trim()) return [];
  const lines = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const slots = [];
  let inSection = false;
  let civ = null;
  let power = null;
  let mood = null;
  let random = null;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = String(lines[i] || '');
    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();
    if (upper === `#${String(sectionName || '').toUpperCase()}`) {
      inSection = true;
      civ = null;
      power = null;
      mood = null;
      random = null;
      continue;
    }
    if (!inSection) continue;
    if (trimmed.startsWith('#') && !upper.startsWith('#CIV ') && !upper.startsWith('#POWER ') && !upper.startsWith('#MOOD ') && !upper.startsWith('#RANDOM ')) {
      break;
    }
    if (upper.startsWith('#CIV ')) {
      civ = Number.parseInt(upper.slice(5).trim(), 10);
      continue;
    }
    if (upper.startsWith('#POWER ')) {
      power = Number.parseInt(upper.slice(7).trim(), 10);
      continue;
    }
    if (upper.startsWith('#MOOD ')) {
      mood = Number.parseInt(upper.slice(6).trim(), 10);
      continue;
    }
    if (upper.startsWith('#RANDOM ')) {
      random = Number.parseInt(upper.slice(8).trim(), 10);
      continue;
    }
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    if (!(civ === 1 && power === 0 && mood === 0 && random === 1)) continue;
    let textLine = trimmed
      .replace(/^["“”„«»]+/, '')
      .replace(/["“”„«»]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!textLine) continue;
    slots.push(textLine);
  }
  return slots;
}

function parseDiplomacySlotOptions(text) {
  const firstContact = parseDiplomacySectionSlotLines(text, 'AIFIRSTCONTACT');
  const firstDeal = parseDiplomacySectionSlotLines(text, 'AIFIRSTDEAL');
  const count = Math.max(firstContact.length, firstDeal.length);
  const options = [];
  for (let i = 0; i < count; i += 1) {
    let contact = String(firstContact[i] || '').trim();
    let deal = String(firstDeal[i] || '').trim();
    if (contact.length > 90) contact = `${contact.slice(0, 87)}...`;
    if (deal.length > 90) deal = `${deal.slice(0, 87)}...`;
    const parts = [];
    if (contact) parts.push(`First contact: ${contact}`);
    if (deal) parts.push(`Trade intro: ${deal}`);
    const preview = parts.join(' | ');
    options.push({
      value: String(i),
      label: preview ? `Slot ${i} - ${preview}` : `Slot ${i}`
    });
  }
  return options;
}

function parsePediaIconsDocumentWithOrder(text) {
  const doc = { order: [], blocks: {} };
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let currentKey = null;
  let currentLines = [];
  const flush = () => {
    if (!currentKey) return;
    doc.blocks[currentKey] = [...currentLines];
    if (!doc.order.includes(currentKey)) doc.order.push(currentKey);
  };
  lines.forEach((raw) => {
    const line = String(raw || '');
    if (line.startsWith('#')) {
      flush();
      currentKey = line.slice(1).trim();
      currentLines = [];
      return;
    }
    if (currentKey) currentLines.push(line);
  });
  flush();
  return doc;
}

function normalizePediaIconsLines(lines) {
  return (Array.isArray(lines) ? lines : [])
    .map((line) => String(line || '').trim())
    .filter((line) => !!line && !line.startsWith(';'));
}

function serializePediaIconsDocumentWithOrder(doc) {
  const order = Array.isArray(doc && doc.order) ? doc.order : [];
  const blocks = (doc && doc.blocks) || {};
  const out = [];
  order.forEach((key) => {
    const k = String(key || '').trim();
    if (!k) return;
    out.push(`#${k}`);
    const lines = normalizePediaIconsLines(blocks[k] || []);
    lines.forEach((line) => out.push(line));
    out.push('');
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function toCanonicalKeyMap(rawMap) {
  const out = {};
  for (const [key, value] of Object.entries(rawMap || {})) {
    out[String(key || '').toUpperCase()] = {
      rawKey: key,
      value
    };
  }
  return out;
}

function mergeByPrecedence(mapsByLayer, order = ['vanilla', 'ptw', 'conquests']) {
  const merged = {};
  for (const layer of order) {
    const src = mapsByLayer[layer] || {};
    for (const [key, value] of Object.entries(src)) {
      merged[key] = value;
    }
  }
  return merged;
}

function inferDisplayNameFromKey(shortKey) {
  const acronyms = new Set(['AEGIS']);
  return String(shortKey || '')
    .split('_')
    .filter(Boolean)
    .map((word) => {
      if (acronyms.has(word)) return word;
      if (/^[IVX]+$/.test(word)) return word;
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .trim();
}

function normalizePediaHeadingText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBodyFromCivilopediaSection(civilopediaSection, options = {}) {
  const lines = (civilopediaSection && civilopediaSection.rawLines) || [];
  const bodyLines = [];
  for (const line of lines) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    const cleaned = trimmed
      .replace(/[{}]/g, ' ')
      .replace(/\^/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) continue;
    bodyLines.push(cleaned);
  }
  const filtered = bodyLines.filter((line) => !/^\(?continued\)?$/i.test(String(line || '').trim()));
  const displayName = String(options && options.displayName || '').trim();
  if (filtered.length > 1 && displayName) {
    const first = normalizePediaHeadingText(filtered[0]);
    const name = normalizePediaHeadingText(displayName);
    if (first && name && (first === name || first.endsWith(` ${name}`) || first.startsWith(`${name} `))) {
      filtered.shift();
    }
  }
  return filtered;
}

function normalizeCivilopediaTextValue(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function textToCivilopediaLines(value) {
  const normalized = normalizeCivilopediaTextValue(value);
  if (!normalized) return [];
  return normalized.split('\n');
}

function dedupeStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function extractTechDependenciesFromText(bodyLines) {
  const deps = [];
  for (const line of bodyLines || []) {
    const linkMatches = line.match(/=TECH_[A-Za-z0-9_]+/g) || [];
    for (const token of linkMatches) {
      deps.push(token.slice(1).replace(/^TECH_/, '').replace(/_/g, ' '));
    }
    const tokenMatches = line.match(/\bTECH_[A-Za-z0-9_]+\b/g) || [];
    for (const token of tokenMatches) {
      deps.push(token.replace(/^TECH_/, '').replace(/_/g, ' '));
    }

    const requires = line.match(/\brequires?\b\s*[:\-]?\s*(.+)$/i);
    if (!requires) continue;
    const rhs = requires[1].split(/[.;]/)[0];
    rhs.split(/,|\/|\band\b/i).forEach((piece) => {
      const cleaned = piece.replace(/[\[\]()]/g, '').trim();
      if (cleaned.length > 1) deps.push(cleaned);
    });
  }
  return dedupeStrings(deps);
}

function mergeSimplePrecedence(...maps) {
  const out = {};
  maps.forEach((map) => {
    Object.assign(out, map || {});
  });
  return out;
}

function parseReferenceIdFromFieldValue(value) {
  const raw = cleanDisplayText(value);
  if (!raw) return null;
  if (/^-?\d+$/.test(raw)) return Number.parseInt(raw, 10);
  const match = raw.match(/\((-?\d+)\)\s*$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function getFieldValueByBaseKey(record, baseKey) {
  const fields = (record && record.fields) || [];
  const target = String(baseKey || '').toLowerCase();
  const found = fields.find((f) => String(f.key || '').toLowerCase() === target);
  return found ? cleanDisplayText(found.value) : '';
}

function collectCivilopediaKeysBySection(biqTab, sectionCode, prefix) {
  const out = new Set();
  if (!biqTab || !Array.isArray(biqTab.sections)) return out;
  const section = biqTab.sections.find((s) => s.code === sectionCode);
  if (!section || !Array.isArray(section.records)) return out;
  section.records.forEach((record) => {
    const raw = getFieldValueByBaseKey(record, 'civilopediaentry');
    const key = String(raw || '').toUpperCase();
    if (key && key.startsWith(prefix)) {
      out.add(key);
    }
  });
  return out;
}

function collectPlayableRaceKeys(biqTab) {
  const raceKeys = collectCivilopediaKeysBySection(biqTab, 'RACE', 'RACE_');
  if (raceKeys.size === 0) return raceKeys;
  if (!biqTab || !Array.isArray(biqTab.sections)) return raceKeys;
  const gameSection = biqTab.sections.find((s) => s.code === 'GAME');
  const raceSection = biqTab.sections.find((s) => s.code === 'RACE');
  if (!gameSection || !raceSection || !Array.isArray(gameSection.records) || gameSection.records.length === 0 || !Array.isArray(raceSection.records)) {
    return raceKeys;
  }
  const gameFields = gameSection.records[0].fields || [];
  const playableIds = gameFields
    .filter((f) => String(f.key || '').toLowerCase().startsWith('playable_civ'))
    .map((f) => parseReferenceIdFromFieldValue(f.value))
    .filter((n) => Number.isInteger(n) && n >= 0);
  if (playableIds.length === 0) return raceKeys;
  const playable = new Set();
  playableIds.forEach((idx) => {
    const record = raceSection.records[idx];
    const key = String(getFieldValueByBaseKey(record, 'civilopediaentry') || '').toUpperCase();
    if (key && key.startsWith('RACE_')) {
      playable.add(key);
    }
  });
  return playable.size > 0 ? playable : raceKeys;
}

function collectScenarioReferenceKeySets(biqTab) {
  return {
    civilizations: collectPlayableRaceKeys(biqTab),
    technologies: collectCivilopediaKeysBySection(biqTab, 'TECH', 'TECH_'),
    resources: collectCivilopediaKeysBySection(biqTab, 'GOOD', 'GOOD_'),
    improvements: collectCivilopediaKeysBySection(biqTab, 'BLDG', 'BLDG_'),
    units: collectCivilopediaKeysBySection(biqTab, 'PRTO', 'PRTO_'),
    terrainPedia: collectCivilopediaKeysBySection(biqTab, 'TERR', 'TERR_'),
    workerActions: collectCivilopediaKeysBySection(biqTab, 'TFRM', 'TFRM_')
  };
}

function collectStandardReferenceKeySets(biqTab) {
  return {
    civilizations: collectCivilopediaKeysBySection(biqTab, 'RACE', 'RACE_'),
    technologies: collectCivilopediaKeysBySection(biqTab, 'TECH', 'TECH_'),
    resources: collectCivilopediaKeysBySection(biqTab, 'GOOD', 'GOOD_'),
    improvements: collectCivilopediaKeysBySection(biqTab, 'BLDG', 'BLDG_'),
    units: collectCivilopediaKeysBySection(biqTab, 'PRTO', 'PRTO_'),
    terrainPedia: collectCivilopediaKeysBySection(biqTab, 'TERR', 'TERR_'),
    workerActions: collectCivilopediaKeysBySection(biqTab, 'TFRM', 'TFRM_')
  };
}

function getSectionCodeForReferencePrefix(prefix) {
  const p = String(prefix || '').toUpperCase().replace(/_+$/, '');
  if (!p) return '';
  if (p === 'GOVT') return 'GOVT';
  if (p === 'RACE') return 'RACE';
  if (p === 'TECH') return 'TECH';
  if (p === 'GOOD') return 'GOOD';
  if (p === 'BLDG') return 'BLDG';
  if (p === 'PRTO') return 'PRTO';
  return p;
}

function indexBiqRecordsByCivilopediaKey(biqTab, sectionCode) {
  const out = new Map();
  if (!biqTab || !Array.isArray(biqTab.sections)) return out;
  const section = biqTab.sections.find((s) => s.code === sectionCode);
  if (!section || !Array.isArray(section.records)) return out;
  section.records.forEach((record) => {
    const key = String(getFieldValueByBaseKey(record, 'civilopediaentry') || '').toUpperCase();
    if (key) out.set(key, record);
  });
  return out;
}

function findLayerPathForKey(mapsByLayer, layerFilesByLayer, key, order) {
  const upperKey = String(key || '').toUpperCase();
  if (!upperKey) return '';
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const layer = order[i];
    const map = mapsByLayer[layer] || {};
    if (map[upperKey]) {
      return (layerFilesByLayer[layer] && layerFilesByLayer[layer].filePath) || '';
    }
  }
  return '';
}

function parseImprovementKindsFromCivilopediaText(text) {
  const kinds = {};
  if (!text) return kinds;

  const lines = text.split(/\r?\n/);
  let scope = 'normal';
  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();
    if (!line) continue;

    if (line.startsWith(';')) {
      const upper = line.toUpperCase();
      if (upper.includes('SMALL WONDERS')) {
        scope = 'small_wonder';
      } else if (upper.includes('GREAT WONDERS')) {
        scope = 'wonder';
      } else if (upper.includes('CITY IMPROVEMENTS') || upper.includes('END SMALL WONDERS') || upper.includes('END GREAT WONDERS')) {
        scope = 'normal';
      }
      continue;
    }

    if (!line.startsWith('#BLDG_')) continue;
    const key = line.slice(1).trim().toUpperCase();
    if (!key) continue;
    kinds[key] = scope;
  }
  return kinds;
}

function parseImprovementKindsFromPediaIconsBlocks(blocks) {
  const kinds = {};
  for (const key of Object.keys(blocks || {})) {
    const upper = String(key || '').toUpperCase();
    if (!upper.startsWith('WON_SPLASH_BLDG_')) continue;
    const bldg = `BLDG_${upper.slice('WON_SPLASH_BLDG_'.length)}`;
    kinds[bldg] = 'wonder';
  }
  return kinds;
}

function mapPediaIconsForKey(pediaBlocks, civilopediaKey) {
  const collectIconLines = (upperKey) => {
    const iconKey = `ICON_${upperKey}`;
    const iconBlock = (pediaBlocks[iconKey] && pediaBlocks[iconKey].value) || [];
    const techSmallBlock = (pediaBlocks[upperKey] && pediaBlocks[upperKey].value) || [];
    const techLargeBlock = (pediaBlocks[`${upperKey}_LARGE`] && pediaBlocks[`${upperKey}_LARGE`].value) || [];
    return [...iconBlock, ...techLargeBlock, ...techSmallBlock]
      .filter((line) => /[\\/]/.test(line) || /\.(pcx|flc|ini)$/i.test(line));
  };

  const upperKey = civilopediaKey.toUpperCase();
  const usableLines = collectIconLines(upperKey);
  const raceIconKey = `ICON_RACE_${upperKey.replace(/^RACE_/, '')}`;
  const raceIconBlock = (pediaBlocks[raceIconKey] && pediaBlocks[raceIconKey].value) || [];
  const raceUsable = raceIconBlock.filter((line) => /[\\/]/.test(line) || /\.(pcx|flc|ini)$/i.test(line));

  const govFallback = [];
  if (upperKey.startsWith('GOVT_') && usableLines.length === 0) {
    const short = upperKey.slice('GOVT_'.length);
    govFallback.push(...collectIconLines(`TECH_${short}`));
    if (govFallback.length === 0) {
      const techCandidates = Object.keys(pediaBlocks)
        .filter((key) => key.startsWith('TECH_') && !key.endsWith('_LARGE') && !key.startsWith('ICON_'));
      const bySuffix = techCandidates.find((key) => key.endsWith(`_${short}`));
      const byToken = bySuffix || techCandidates.find((key) => key.split('_').includes(short));
      if (byToken) {
        govFallback.push(...collectIconLines(byToken));
      }
    }
  }

  const rawPaths = [...usableLines, ...govFallback, ...raceUsable].map((line) => normalizeRelativePath(line));
  const iconPaths = dedupeStrings(rawPaths.filter(Boolean));

  const animKey = `ANIMNAME_${civilopediaKey.toUpperCase()}`;
  const animBlock = (pediaBlocks[animKey] && pediaBlocks[animKey].value) || [];
  const animName = animBlock.length > 0 ? String(animBlock[0]).trim() : '';

  const raceBlock = (pediaBlocks[civilopediaKey.toUpperCase()] && pediaBlocks[civilopediaKey.toUpperCase()].value) || [];
  const racePaths = raceBlock.map((line) => normalizeRelativePath(line)).filter(Boolean);

  return {
    iconPaths,
    animationName: animName,
    racePaths: dedupeStrings(racePaths)
  };
}

function buildReferenceTabs(civ3Path, options = {}) {
  const mode = options.mode === 'scenario' ? 'scenario' : 'global';
  const scenarioPath = mode === 'scenario' ? (options.scenarioPath || '') : '';
  const scenarioPaths = Array.isArray(options.scenarioPaths) ? options.scenarioPaths : [];
  const biqKeySets = options.biqTab
    ? (mode === 'scenario' ? collectScenarioReferenceKeySets(options.biqTab) : collectStandardReferenceKeySets(options.biqTab))
    : null;
  const includeScenarioLayer = mode === 'scenario' && !!scenarioPath;
  const layerOrder = includeScenarioLayer
    ? ['vanilla', 'ptw', 'conquests', 'scenario']
    : ['vanilla', 'ptw', 'conquests'];
  const civilopediaLayers = readTextLayers(civ3Path, 'Civilopedia.txt', scenarioPath, scenarioPaths);
  const pediaIconLayers = readTextLayers(civ3Path, 'PediaIcons.txt', scenarioPath, scenarioPaths);
  const improvementKindsByKey = mergeSimplePrecedence(
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.vanilla && pediaIconLayers.vanilla.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.vanilla && civilopediaLayers.vanilla.text) || '')
    ),
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.ptw && pediaIconLayers.ptw.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.ptw && civilopediaLayers.ptw.text) || '')
    ),
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.conquests && pediaIconLayers.conquests.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.conquests && civilopediaLayers.conquests.text) || '')
    ),
    mergeSimplePrecedence(
      parseImprovementKindsFromPediaIconsBlocks(parsePediaIconsBlocks((pediaIconLayers.scenario && pediaIconLayers.scenario.text) || '')),
      parseImprovementKindsFromCivilopediaText((civilopediaLayers.scenario && civilopediaLayers.scenario.text) || '')
    )
  );
  const civilopediaSectionsByLayer = {
    vanilla: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.vanilla && civilopediaLayers.vanilla.text) || '')),
    ptw: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.ptw && civilopediaLayers.ptw.text) || '')),
    conquests: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.conquests && civilopediaLayers.conquests.text) || '')),
    scenario: toCanonicalKeyMap(parseCivilopediaSections((civilopediaLayers.scenario && civilopediaLayers.scenario.text) || ''))
  };
  const pediaBlocksByLayer = {
    vanilla: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.vanilla && pediaIconLayers.vanilla.text) || '')),
    ptw: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.ptw && pediaIconLayers.ptw.text) || '')),
    conquests: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.conquests && pediaIconLayers.conquests.text) || '')),
    scenario: toCanonicalKeyMap(parsePediaIconsBlocks((pediaIconLayers.scenario && pediaIconLayers.scenario.text) || ''))
  };
  const scenarioCivilopediaWritePath = mode === 'scenario'
    ? (
      ((civilopediaLayers.scenario && civilopediaLayers.scenario.filePath) || '')
      || resolveScenarioTextPath(scenarioPath, 'Civilopedia.txt', scenarioPaths)
      || (scenarioPath ? path.join(resolveScenarioDir(scenarioPath), 'Text', 'Civilopedia.txt') : '')
    )
    : '';
  const scenarioPediaIconsWritePath = mode === 'scenario'
    ? (
      ((pediaIconLayers.scenario && pediaIconLayers.scenario.filePath) || '')
      || resolveScenarioTextPath(scenarioPath, 'PediaIcons.txt', scenarioPaths)
      || (scenarioPath ? path.join(resolveScenarioDir(scenarioPath), 'Text', 'PediaIcons.txt') : '')
    )
    : '';
  const diplomacyLayers = readTextLayers(civ3Path, 'diplomacy.txt', scenarioPath, scenarioPaths);
  const diplomacyTopLayer = pickHighestLayerText(diplomacyLayers);
  const diplomacyOptions = parseDiplomacySlotOptions(diplomacyTopLayer && diplomacyTopLayer.text);
  const civilopediaSections = mergeByPrecedence(civilopediaSectionsByLayer, layerOrder);
  const pediaBlocks = mergeByPrecedence(pediaBlocksByLayer, layerOrder);

  const tabs = {};
  for (const tabSpec of REFERENCE_TAB_SPECS) {
    const biqSectionCode = getSectionCodeForReferencePrefix(tabSpec.prefix);
    const biqRecordByCivilopediaKey = indexBiqRecordsByCivilopediaKey(options.biqTab, biqSectionCode);
    const entriesByKey = new Map();
    const prefix = tabSpec.prefix;

    const canonicalPrefix = prefix.toUpperCase();
    Object.keys(civilopediaSections)
      .filter((key) => key.startsWith(canonicalPrefix))
      .forEach((civilopediaKey) => entriesByKey.set(civilopediaKey, { civilopediaKey }));

    Object.keys(pediaBlocks)
      .filter((key) => key.startsWith(`ICON_${canonicalPrefix}`)
        || key.startsWith(`ANIMNAME_${canonicalPrefix}`)
        || key.startsWith(`ICON_RACE_`)
        || (canonicalPrefix === 'RACE_' && key.startsWith(canonicalPrefix))
        || (tabSpec.key === 'technologies' && key.startsWith(canonicalPrefix)))
      .forEach((key) => {
        let civilopediaKey = key.startsWith('ICON_') ? key.slice(5) : key.startsWith('ANIMNAME_') ? key.slice(9) : key;
        if (canonicalPrefix === 'RACE_' && key.startsWith('ICON_RACE_')) {
          civilopediaKey = `RACE_${key.slice('ICON_RACE_'.length)}`;
        }
        if (tabSpec.key === 'technologies' && civilopediaKey.startsWith('TECH_') && civilopediaKey.endsWith('_LARGE')) {
          civilopediaKey = civilopediaKey.slice(0, -6);
        }
        if (civilopediaKey.startsWith(canonicalPrefix)) {
          entriesByKey.set(civilopediaKey, { civilopediaKey });
        }
      });

    let entries = Array.from(entriesByKey.values())
      .map((entry) => {
        const civilopediaSection = (civilopediaSections[entry.civilopediaKey] && civilopediaSections[entry.civilopediaKey].value) || null;
        const descSection = (civilopediaSections[`DESC_${entry.civilopediaKey}`] && civilopediaSections[`DESC_${entry.civilopediaKey}`].value) || null;
        const shortKey = entry.civilopediaKey.slice(prefix.length);
        const displayName = inferDisplayNameFromKey(shortKey);
        const pedia = mapPediaIconsForKey(pediaBlocks, entry.civilopediaKey);
        const overviewLines = parseBodyFromCivilopediaSection(civilopediaSection, { displayName });
        const descLines = parseBodyFromCivilopediaSection(descSection, { displayName });
        const descriptionLines = descLines.length > 0 ? descLines : overviewLines;
        const thumbPath =
          tabSpec.key === 'civilizations'
            ? (pedia.racePaths[0] || pedia.iconPaths[pedia.iconPaths.length - 1] || '')
            : (pedia.iconPaths[pedia.iconPaths.length - 1] || pedia.iconPaths[0] || '');

        const overviewSourcePath = findLayerPathForKey(civilopediaSectionsByLayer, civilopediaLayers, entry.civilopediaKey, layerOrder);
        const descSourcePath = findLayerPathForKey(civilopediaSectionsByLayer, civilopediaLayers, `DESC_${entry.civilopediaKey}`, layerOrder)
          || overviewSourcePath;
        const iconBlockSourcePath = findLayerPathForKey(pediaBlocksByLayer, pediaIconLayers, `ICON_${entry.civilopediaKey}`, layerOrder)
          || findLayerPathForKey(pediaBlocksByLayer, pediaIconLayers, entry.civilopediaKey, layerOrder)
          || findLayerPathForKey(pediaBlocksByLayer, pediaIconLayers, `${entry.civilopediaKey}_LARGE`, layerOrder)
          || findLayerPathForKey(pediaBlocksByLayer, pediaIconLayers, `ICON_RACE_${entry.civilopediaKey.replace(/^RACE_/, '')}`, layerOrder);
        const animSourcePath = findLayerPathForKey(pediaBlocksByLayer, pediaIconLayers, `ANIMNAME_${entry.civilopediaKey}`, layerOrder)
          || iconBlockSourcePath;
        const biqRecord = biqRecordByCivilopediaKey.get(entry.civilopediaKey);
        const biqFields = (biqRecord && Array.isArray(biqRecord.fields))
          ? biqRecord.fields.filter((f) => String(f.key || '').toLowerCase() !== 'civilopediaentry').map((f) => ({
            key: f.key,
            baseKey: f.baseKey || String(f.key || '').replace(/_\d+$/, ''),
            label: f.label || toTitleFromKey(f.key),
            value: cleanDisplayText(f.value),
            originalValue: cleanDisplayText(f.value),
            editable: !!f.editable,
            expectedSetter: String(f.expectedSetter || '')
          }))
          : [];

        return {
          id: shortKey,
          civilopediaKey: entry.civilopediaKey,
          biqIndex: biqRecord ? Number(biqRecord.index) : null,
          name: displayName,
          overview: overviewLines.join(' '),
          originalOverview: overviewLines.join(' '),
          description: descriptionLines.join(' '),
          originalDescription: descriptionLines.join(' '),
          techDependencies: tabSpec.key === 'technologies' ? [] : extractTechDependenciesFromText(overviewLines),
          improvementKind: tabSpec.key === 'improvements' ? (improvementKindsByKey[entry.civilopediaKey] || 'normal') : null,
          iconPaths: pedia.iconPaths,
          originalIconPaths: [...pedia.iconPaths],
          racePaths: pedia.racePaths,
          originalRacePaths: [...pedia.racePaths],
          thumbPath,
          animationName: pedia.animationName,
          originalAnimationName: pedia.animationName,
          biqSectionCode,
          biqSectionTitle: biqSectionCode,
          biqFields,
          sourceMeta: {
            overview: { source: 'Civilopedia', readPath: overviewSourcePath, writePath: scenarioCivilopediaWritePath },
            description: { source: 'Civilopedia', readPath: descSourcePath, writePath: scenarioCivilopediaWritePath },
            iconPaths: { source: 'PediaIcons', readPath: iconBlockSourcePath, writePath: scenarioPediaIconsWritePath },
            animationName: { source: 'PediaIcons', readPath: animSourcePath, writePath: scenarioPediaIconsWritePath },
            biq: {
              source: 'BIQ',
              readPath: (options.biqTab && options.biqTab.sourcePath) || '',
              writePath: mode === 'scenario' ? ((options.biqTab && options.biqTab.sourcePath) || '') : ''
            }
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

    if (biqKeySets && biqKeySets[tabSpec.key] instanceof Set && biqKeySets[tabSpec.key].size > 0) {
      entries = entries.filter((entry) => biqKeySets[tabSpec.key].has(String(entry.civilopediaKey || '').toUpperCase()));
    }

    if (tabSpec.key === 'civilizations') {
      const fallbackThumb = (entries.find((e) => e.thumbPath) || {}).thumbPath || '';
      if (fallbackThumb) {
        entries.forEach((entry) => {
          if (!entry.thumbPath) {
            entry.thumbPath = fallbackThumb;
          }
        });
      }
    }

    tabs[tabSpec.key] = {
      title: tabSpec.title,
      type: 'reference',
      readOnly: true,
      recordOps: [],
      sourcePath:
        ((includeScenarioLayer && civilopediaLayers.scenario && civilopediaLayers.scenario.text) ? civilopediaLayers.scenario.filePath : '')
        || (civilopediaLayers.conquests && civilopediaLayers.conquests.filePath)
        || '',
      sourceDetails: {
        civilopediaVanilla: (civilopediaLayers.vanilla && civilopediaLayers.vanilla.filePath) || '',
        civilopediaPtw: (civilopediaLayers.ptw && civilopediaLayers.ptw.filePath) || '',
        civilopediaConquests: (civilopediaLayers.conquests && civilopediaLayers.conquests.filePath) || '',
        civilopediaScenario: scenarioCivilopediaWritePath,
        pediaIconsVanilla: (pediaIconLayers.vanilla && pediaIconLayers.vanilla.filePath) || '',
        pediaIconsPtw: (pediaIconLayers.ptw && pediaIconLayers.ptw.filePath) || '',
        pediaIconsConquests: (pediaIconLayers.conquests && pediaIconLayers.conquests.filePath) || '',
        pediaIconsScenario: (pediaIconLayers.scenario && pediaIconLayers.scenario.filePath) || '',
        pediaIconsScenarioWrite: scenarioPediaIconsWritePath,
        diplomacyVanilla: (diplomacyLayers.vanilla && diplomacyLayers.vanilla.filePath) || '',
        diplomacyPtw: (diplomacyLayers.ptw && diplomacyLayers.ptw.filePath) || '',
        diplomacyConquests: (diplomacyLayers.conquests && diplomacyLayers.conquests.filePath) || '',
        diplomacyScenario: (diplomacyLayers.scenario && diplomacyLayers.scenario.filePath) || '',
        diplomacyActive: (diplomacyTopLayer && diplomacyTopLayer.filePath) || ''
      },
      entries,
      diplomacyOptions: tabSpec.key === 'civilizations' ? diplomacyOptions : []
    };
  }

  return tabs;
}

function buildMapTabFromBiq(biqTab, mode) {
  const sections = (biqTab && Array.isArray(biqTab.sections)) ? biqTab.sections : [];
  const hasMapData = sections.some((s) => s.code === 'TILE') && sections.some((s) => s.code === 'WMAP');
  return {
    title: 'Map',
    type: 'map',
    readOnly: mode !== 'scenario',
    sourcePath: (biqTab && biqTab.sourcePath) || '',
    error: (biqTab && biqTab.error) || '',
    sections: hasMapData ? sections : []
  };
}

function buildBiqStructureTabs(biqTab, mode) {
  const sections = (biqTab && Array.isArray(biqTab.sections)) ? biqTab.sections : [];
  const byCode = new Map();
  sections.forEach((section) => {
    byCode.set(String(section.code || '').toUpperCase(), section);
  });
  const tabs = {};
  BIQ_STRUCTURE_TAB_SPECS.forEach((spec) => {
    const selectedSections = spec.sectionCodes
      .map((code) => byCode.get(String(code || '').toUpperCase()))
      .filter(Boolean)
      .map((section) => ({
        ...section,
        records: Array.isArray(section.records)
          ? section.records.map((record) => ({
            ...record,
            fields: Array.isArray(record.fields)
              ? record.fields.map((field) => ({
                ...field,
                baseKey: field.baseKey || String(field.key || '').replace(/_\d+$/, ''),
                originalValue: cleanDisplayText(field.value)
              }))
              : []
          }))
          : []
      }));
    tabs[spec.key] = {
      key: spec.key,
      title: spec.title,
      type: 'biqStructure',
      readOnly: mode !== 'scenario',
      sourcePath: (biqTab && biqTab.sourcePath) || '',
      error: (biqTab && biqTab.error) || '',
      bridgeError: (biqTab && biqTab.bridgeError) || '',
      sections: selectedSections
    };
  });
  return tabs;
}

function ensureTrailingNewline(text) {
  if (!text.endsWith('\n')) {
    return `${text}\n`;
  }
  return text;
}

function parseCivilopediaDocumentWithOrder(text) {
  const order = [];
  const sections = {};
  if (!text) return { order, sections };
  const lines = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let currentKey = '';
  let currentLines = [];
  const flush = () => {
    if (!currentKey) return;
    sections[currentKey] = { key: currentKey, rawLines: currentLines.slice() };
    if (!order.includes(currentKey)) order.push(currentKey);
  };
  lines.forEach((line) => {
    if (line.startsWith('#')) {
      flush();
      currentKey = line.slice(1).trim().toUpperCase();
      currentLines = [];
      return;
    }
    if (currentKey) currentLines.push(line);
  });
  flush();
  return { order, sections };
}

function serializeCivilopediaDocumentWithOrder(doc) {
  const order = Array.isArray(doc && doc.order) ? doc.order : [];
  const sections = (doc && doc.sections) || {};
  const lines = [];
  order.forEach((rawKey) => {
    const key = String(rawKey || '').toUpperCase();
    if (!key || !sections[key]) return;
    const section = sections[key] || {};
    const rawLines = Array.isArray(section.rawLines) ? section.rawLines : [];
    lines.push(`#${key}`);
    rawLines.forEach((line) => lines.push(String(line || '')));
    lines.push('');
  });
  return ensureTrailingNewline(lines.join('\n'));
}

function parseIniLines(text) {
  const rows = [];
  const map = {};
  if (!text) {
    return { rows, map };
  }

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('[')) {
      continue;
    }
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) {
      continue;
    }
    const key = match[1];
    const value = match[2];
    rows.push({ key, value });
    map[key] = value;
  }

  return { rows, map };
}

function normalizeIniSectionName(raw) {
  const cleaned = raw.replace(/^\[+|\]+$/g, '').replace(/=/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  if (cleaned.length > 56) return null;
  if (!/[A-Za-z]/.test(cleaned)) return null;
  if (/^NOTE$/i.test(cleaned)) return null;
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

function parseIniSectionMap(text) {
  const sectionByKey = {};
  const sectionOrder = [];
  const seen = new Set();
  if (!text) {
    return { sectionByKey, sectionOrder };
  }

  const lines = text.split(/\r?\n/);
  let currentSection = 'General';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const section = normalizeIniSectionName(trimmed);
      if (section) {
        currentSection = section;
      }
      continue;
    }

    const keyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (keyMatch) {
      const key = keyMatch[1];
      sectionByKey[key] = currentSection;
      if (!seen.has(currentSection)) {
        seen.add(currentSection);
        sectionOrder.push(currentSection);
      }
    }
  }

  return { sectionByKey, sectionOrder };
}

function normalizeDocLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function parseIniFieldDocs(text) {
  const docs = {};
  if (!text) {
    return docs;
  }

  const lines = text.split(/\r?\n/);
  let commentBuffer = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(';')) {
      const body = normalizeDocLine(trimmed.replace(/^;\s?/, ''));
      if (body) {
        commentBuffer.push(body);
      }
      continue;
    }

    const keyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (commentBuffer.length > 0 && !docs[key]) {
        docs[key] = commentBuffer.join(' ');
      }
    }

    if (!trimmed || trimmed.startsWith('[') || keyMatch) {
      commentBuffer = [];
    }
  }
  return docs;
}

function parseSectionFieldDocs(text) {
  const docs = {};
  if (!text) {
    return docs;
  }

  const lines = text.split(/\r?\n/);
  let activeKey = null;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith(';')) {
      activeKey = null;
      continue;
    }
    const body = normalizeDocLine(trimmed.replace(/^;\s?/, ''));
    if (!body) {
      activeKey = null;
      continue;
    }

    const start = body.match(/^-+\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (start) {
      const key = start[1];
      const desc = start[2].trim();
      docs[key] = desc;
      activeKey = key;
      continue;
    }

    if (activeKey && !/^-+\s*[A-Za-z0-9_]+\s*:/.test(body)) {
      docs[activeKey] = `${docs[activeKey]} ${body}`.trim();
    }
  }

  return docs;
}

function inferBaseType(value) {
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === 'false') {
    return 'boolean';
  }
  if (/^-?\d+$/.test(v)) {
    return 'integer';
  }
  return 'string';
}

function buildBaseModel(defaultText, scenarioText, customText, mode, targetText) {
  const defaultParsed = parseIniLines(defaultText);
  const scenarioParsed = parseIniLines(scenarioText);
  const customParsed = parseIniLines(customText);
  const targetParsed = parseIniLines(targetText);

  const effective = { ...defaultParsed.map };
  if (mode === 'scenario') {
    Object.assign(effective, scenarioParsed.map);
  }
  Object.assign(effective, customParsed.map);

  const orderedKeys = [];
  const keySet = new Set();

  for (const row of defaultParsed.rows) {
    orderedKeys.push(row.key);
    keySet.add(row.key);
  }

  for (const key of Object.keys(effective)) {
    if (!keySet.has(key)) {
      keySet.add(key);
      orderedKeys.push(key);
    }
  }

  const editableMap = Object.keys(targetParsed.map).length > 0 ? targetParsed.map : effective;

  const rows = orderedKeys.map((key) => {
    const defaultValue = defaultParsed.map[key] ?? '';
    const effectiveValue = effective[key] ?? '';
    const editableValue = editableMap[key] ?? effectiveValue;
    return {
      key,
      defaultValue,
      effectiveValue,
      value: editableValue,
      type: inferBaseType(defaultValue || effectiveValue || editableValue)
    };
  });

  return {
    rows,
    defaultMap: defaultParsed.map,
    effectiveMap: effective,
    sourceOrder: mode === 'scenario' ? ['default', 'scenario', 'custom'] : ['default', 'custom']
  };
}

function parseSectionedConfig(text, marker) {
  const result = {
    sections: [],
    headerComments: []
  };

  if (!text) {
    return result;
  }

  const lines = text.split(/\r?\n/);
  let current = null;
  let beforeFirstSection = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith(marker)) {
      if (current) {
        result.sections.push(current);
      }
      current = {
        marker,
        fields: [],
        comments: []
      };
      beforeFirstSection = false;
      continue;
    }

    if (beforeFirstSection) {
      result.headerComments.push(rawLine);
      continue;
    }

    if (!current) {
      continue;
    }

    if (!line) {
      continue;
    }

    if (line.startsWith(';') || line.startsWith('[')) {
      current.comments.push(rawLine);
      continue;
    }

    const match = rawLine.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);
    if (match) {
      current.fields.push({ key: match[1].trim(), value: match[2] });
    }
  }

  if (current) {
    result.sections.push(current);
  }

  return result;
}

function serializeSectionedConfig(model, marker) {
  const lines = [];

  if (model.headerComments && model.headerComments.length > 0) {
    for (const line of model.headerComments) {
      lines.push(line);
    }
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
  }

  for (let i = 0; i < model.sections.length; i += 1) {
    const section = model.sections[i];
    lines.push(marker);
    for (const field of section.fields) {
      if (!field.key) {
        continue;
      }
      lines.push(`${field.key} = ${field.value ?? ''}`);
    }
    if (i !== model.sections.length - 1) {
      lines.push('');
    }
  }

  return ensureTrailingNewline(lines.join('\n'));
}

function serializeBaseConfig(baseRows, defaultMap, mode) {
  const lines = [];
  lines.push('; Managed by Civ 3 | C3X Modern Configuration Manager');
  lines.push(`; Mode: ${mode}`);
  lines.push('');

  for (const row of baseRows) {
    const key = row.key;
    const val = String(row.value ?? '').trim();
    const defaultVal = String(defaultMap[key] ?? '').trim();
    if (val !== defaultVal && val !== '') {
      lines.push(`${key} = ${val}`);
    }
  }

  return ensureTrailingNewline(lines.join('\n'));
}

function resolvePaths({ c3xPath, scenarioPath, mode }) {
  const scenarioDir = resolveScenarioDir(scenarioPath);
  const paths = {};
  for (const [kind, spec] of Object.entries(FILE_SPECS)) {
    const defaultPath = c3xPath ? path.join(c3xPath, spec.defaultName) : null;
    const userPath = c3xPath ? path.join(c3xPath, spec.userName) : null;
    const scenarioFilePath = scenarioDir ? path.join(scenarioDir, spec.scenarioName) : null;

    let effectivePath = defaultPath;
    let effectiveSource = 'default';

    if (kind === 'base') {
      if (mode === 'scenario' && scenarioFilePath && fs.existsSync(scenarioFilePath)) {
        effectivePath = scenarioFilePath;
        effectiveSource = 'scenario+custom';
      }
      if (userPath && fs.existsSync(userPath)) {
        effectivePath = userPath;
        effectiveSource = mode === 'scenario' ? 'scenario+custom' : 'custom';
      }
    } else {
      if (mode === 'scenario' && scenarioFilePath && fs.existsSync(scenarioFilePath)) {
        effectivePath = scenarioFilePath;
        effectiveSource = 'scenario';
      } else if (userPath && fs.existsSync(userPath)) {
        effectivePath = userPath;
        effectiveSource = 'user';
      }
    }

    const targetPath = mode === 'scenario' ? scenarioFilePath : userPath;

    paths[kind] = {
      defaultPath,
      userPath,
      scenarioPath: scenarioFilePath,
      effectivePath,
      effectiveSource,
      targetPath
    };
  }
  return paths;
}

function loadBundle(payload) {
  const mode = payload.mode === 'scenario' ? 'scenario' : 'global';
  const c3xPath = payload.c3xPath || '';
  const civ3Path = payload.civ3Path || '';
  const scenarioPath = payload.scenarioPath || '';
  const javaPath = payload.javaPath || '';
  const biqTab = loadBiqTab({ mode, civ3Path, scenarioPath, javaPath });
  const scenarioDir = mode === 'scenario'
    ? resolveScenarioDirFromBiq({ scenarioPath, civ3Path, biqTab })
    : resolveScenarioDir(scenarioPath);
  const scenarioSearchPaths = mode === 'scenario'
    ? resolveScenarioSearchDirsFromBiq({ scenarioPath, civ3Path, biqTab })
    : [];

  const filePaths = resolvePaths({ c3xPath, scenarioPath: scenarioDir, mode });
  const bundle = {
    mode,
    c3xPath,
    civ3Path,
    scenarioPath: scenarioDir,
    scenarioInputPath: scenarioPath,
    scenarioSearchPaths,
    tabs: {}
  };

  bundle.biq = biqTab;

  const referenceTabs = buildReferenceTabs(civ3Path, {
    mode,
    scenarioPath: scenarioDir,
    scenarioPaths: scenarioSearchPaths,
    biqTab
  });
  for (const spec of REFERENCE_TAB_SPECS) {
    if (referenceTabs[spec.key]) {
      if (spec.key === 'terrainPedia' || spec.key === 'workerActions') continue;
      bundle.tabs[spec.key] = referenceTabs[spec.key];
    }
  }
  bundle.tabs.map = buildMapTabFromBiq(biqTab, mode);
  const biqStructureTabs = buildBiqStructureTabs(biqTab, mode);
  Object.keys(biqStructureTabs).forEach((key) => {
    bundle.tabs[key] = biqStructureTabs[key];
  });
  if (bundle.tabs.terrain) {
    bundle.tabs.terrain.civilopedia = {
      terrain: referenceTabs.terrainPedia || null,
      workerActions: referenceTabs.workerActions || null
    };
  } else {
    if (referenceTabs.terrainPedia) bundle.tabs.terrainPedia = referenceTabs.terrainPedia;
    if (referenceTabs.workerActions) bundle.tabs.workerActions = referenceTabs.workerActions;
  }

  const defaultBaseText = readTextIfExists(filePaths.base.defaultPath) || '';
  const scenarioBaseText = readTextIfExists(filePaths.base.scenarioPath) || '';
  const customBaseText = readTextIfExists(filePaths.base.userPath) || '';
  const targetBaseText = readTextIfExists(filePaths.base.targetPath) || '';

  bundle.tabs.base = {
    title: FILE_SPECS.base.title,
    effectiveSource: filePaths.base.effectiveSource,
    targetPath: filePaths.base.targetPath,
    fieldDocs: parseIniFieldDocs(defaultBaseText),
    ...parseIniSectionMap(defaultBaseText),
    ...buildBaseModel(defaultBaseText, scenarioBaseText, customBaseText, mode, targetBaseText)
  };

  for (const kind of ['districts', 'wonders', 'naturalWonders', 'animations']) {
    const spec = FILE_SPECS[kind];
    const defaultText = readTextIfExists(filePaths[kind].defaultPath) || '';
    const targetText = readTextIfExists(filePaths[kind].targetPath);
    const fallbackText = readTextIfExists(filePaths[kind].effectivePath) || '';
    const text = targetText ?? fallbackText;

    bundle.tabs[kind] = {
      title: spec.title,
      effectiveSource: filePaths[kind].effectiveSource,
      targetPath: filePaths[kind].targetPath,
      marker: spec.sectionMarker,
      fieldDocs: parseSectionFieldDocs(defaultText),
      model: parseSectionedConfig(text, spec.sectionMarker)
    };
  }

  return bundle;
}

function buildScenarioPediaIconsEditResult({ targetPath, edits }) {
  if (!targetPath || !Array.isArray(edits) || edits.length === 0) {
    return { ok: true, applied: 0, buffer: null };
  }
  try {
    const existing = readWindows1252TextIfExists(targetPath) || '';
    const doc = parsePediaIconsDocumentWithOrder(existing);
    let applied = 0;
    edits.forEach((edit) => {
      const blockKey = String(edit && edit.blockKey || '').trim().toUpperCase();
      if (!blockKey) return;
      const nextLines = normalizePediaIconsLines(edit.lines || []);
      const prevLines = normalizePediaIconsLines(doc.blocks[blockKey] || []);
      if (JSON.stringify(prevLines) === JSON.stringify(nextLines)) return;
      doc.blocks[blockKey] = nextLines;
      if (!doc.order.includes(blockKey)) doc.order.push(blockKey);
      applied += 1;
    });
    if (applied === 0) return { ok: true, applied: 0, buffer: null };
    const serialized = serializePediaIconsDocumentWithOrder(doc);
    return { ok: true, applied, buffer: encodeWindows1252Text(serialized) };
  } catch (err) {
    return { ok: false, error: `Failed to save PediaIcons edits: ${err.message}` };
  }
}

function buildScenarioCivilopediaEditResult({ targetPath, edits }) {
  if (!targetPath || !Array.isArray(edits) || edits.length === 0) {
    return { ok: true, applied: 0, buffer: null };
  }
  try {
    const existing = readWindows1252TextIfExists(targetPath) || '';
    const doc = parseCivilopediaDocumentWithOrder(existing);
    let applied = 0;
    edits.forEach((edit) => {
      const sectionKey = String(edit && edit.sectionKey || '').trim().toUpperCase();
      if (!sectionKey) return;
      const nextLines = textToCivilopediaLines(edit.value);
      const prevLines = (doc.sections[sectionKey] && Array.isArray(doc.sections[sectionKey].rawLines))
        ? doc.sections[sectionKey].rawLines
        : [];
      const prevNorm = normalizeCivilopediaTextValue(prevLines.join('\n'));
      const nextNorm = normalizeCivilopediaTextValue(nextLines.join('\n'));
      if (prevNorm === nextNorm) return;
      doc.sections[sectionKey] = { key: sectionKey, rawLines: nextLines };
      if (!doc.order.includes(sectionKey)) doc.order.push(sectionKey);
      applied += 1;
    });
    if (applied === 0) return { ok: true, applied: 0, buffer: null };
    const serialized = serializeCivilopediaDocumentWithOrder(doc);
    return { ok: true, applied, buffer: encodeWindows1252Text(serialized) };
  } catch (err) {
    return { ok: false, error: `Failed to save Civilopedia edits: ${err.message}` };
  }
}

function uniqueWritesByPath(writes) {
  const map = new Map();
  writes.forEach((entry) => {
    const targetPath = String((entry && entry.path) || '').trim();
    if (!targetPath) return;
    map.set(targetPath, { ...entry, path: targetPath });
  });
  return Array.from(map.values());
}

function writeAtomicFileSync(targetPath, data, options = {}) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = path.join(
    dir,
    `.c3x-tmp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${path.basename(targetPath)}`
  );
  let wroteTemp = false;
  try {
    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(tempPath, data);
    } else {
      fs.writeFileSync(tempPath, String(data == null ? '' : data), options.encoding || 'utf8');
    }
    wroteTemp = true;

    try {
      const fd = fs.openSync(tempPath, 'r');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
    } catch (_err) {
      // best effort durability
    }

    fs.renameSync(tempPath, targetPath);
    wroteTemp = false;

    try {
      const dfd = fs.openSync(dir, 'r');
      fs.fsyncSync(dfd);
      fs.closeSync(dfd);
    } catch (_err) {
      // best effort durability
    }
  } finally {
    if (wroteTemp) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (_err) {
        // best effort cleanup
      }
    }
  }
}

function commitWritesWithRollback(writes) {
  const ordered = uniqueWritesByPath(writes);
  if (ordered.length === 0) return { ok: true };
  const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-save-backup-'));
  const backups = new Map();
  const committed = [];
  try {
    ordered.forEach((entry, idx) => {
      const targetPath = entry.path;
      if (fs.existsSync(targetPath)) {
        const backupPath = path.join(backupDir, `${idx}.bak`);
        fs.copyFileSync(targetPath, backupPath);
        backups.set(targetPath, { existed: true, backupPath });
      } else {
        backups.set(targetPath, { existed: false, backupPath: '' });
      }
    });

    ordered.forEach((entry) => {
      writeAtomicFileSync(entry.path, entry.data, { encoding: entry.encoding || 'utf8' });
      committed.push(entry.path);
    });

    return { ok: true };
  } catch (err) {
    const rollbackErrors = [];
    for (let i = committed.length - 1; i >= 0; i -= 1) {
      const targetPath = committed[i];
      const backup = backups.get(targetPath);
      if (!backup) continue;
      try {
        if (backup.existed && backup.backupPath && fs.existsSync(backup.backupPath)) {
          const original = fs.readFileSync(backup.backupPath);
          writeAtomicFileSync(targetPath, original);
        } else if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
      } catch (rollbackErr) {
        rollbackErrors.push(`${targetPath}: ${rollbackErr.message}`);
      }
    }
    const rollbackSuffix = rollbackErrors.length > 0
      ? ` Rollback encountered errors: ${rollbackErrors.join(' | ')}`
      : '';
    return { ok: false, error: `Save transaction failed and was rolled back: ${err.message}.${rollbackSuffix}` };
  } finally {
    try {
      fs.rmSync(backupDir, { recursive: true, force: true });
    } catch (_err) {
      // best effort cleanup
    }
  }
}

function saveBundle(payload) {
  const mode = payload.mode === 'scenario' ? 'scenario' : 'global';
  const c3xPath = payload.c3xPath || '';
  const civ3Path = payload.civ3Path || '';
  const scenarioPath = payload.scenarioPath || '';
  const javaPath = payload.javaPath || '';
  const biqTab = loadBiqTab({ mode, civ3Path, scenarioPath, javaPath });
  const scenarioDir = mode === 'scenario'
    ? resolveScenarioDirFromBiq({ scenarioPath, civ3Path, biqTab })
    : resolveScenarioDir(scenarioPath);

  const filePaths = resolvePaths({ c3xPath, scenarioPath: scenarioDir, mode });
  const failIfProtected = (candidatePath, label) => {
    if (!candidatePath) return null;
    if (!isProtectedBaseCiv3Path(civ3Path, candidatePath)) return null;
    return `Refusing to modify base Civilization III file (${label}): ${candidatePath}`;
  };

  const saveReport = [];
  const plannedWrites = [];

  const baseTab = payload.tabs.base;
  if (baseTab && filePaths.base.targetPath) {
    const protectErr = failIfProtected(filePaths.base.targetPath, 'base config target');
    if (protectErr) return { ok: false, error: protectErr };
    const serialized = serializeBaseConfig(baseTab.rows, baseTab.defaultMap || {}, mode);
    plannedWrites.push({
      kind: 'base',
      path: filePaths.base.targetPath,
      data: serialized,
      encoding: 'utf8'
    });
    saveReport.push({ kind: 'base', path: filePaths.base.targetPath });
  }

  for (const kind of ['districts', 'wonders', 'naturalWonders', 'animations']) {
    const tab = payload.tabs[kind];
    const spec = FILE_SPECS[kind];
    const targetPath = filePaths[kind].targetPath;
    if (!tab || !targetPath) {
      continue;
    }
    const protectErr = failIfProtected(targetPath, `${kind} target`);
    if (protectErr) return { ok: false, error: protectErr };
    const serialized = serializeSectionedConfig(tab.model, spec.sectionMarker);
    plannedWrites.push({
      kind,
      path: targetPath,
      data: serialized,
      encoding: 'utf8'
    });
    saveReport.push({ kind, path: targetPath });
  }

  if (mode === 'scenario' && isBiqPath(scenarioPath)) {
    const protectErr = failIfProtected(scenarioPath, 'scenario BIQ target');
    if (protectErr) return { ok: false, error: protectErr };
    const biqRecordOps = collectBiqReferenceRecordOps(payload.tabs || {});
    const biqEdits = collectBiqReferenceEdits(payload.tabs || {});
    const structureEdits = collectBiqStructureEdits(payload.tabs || {});
    const allBiqEdits = biqRecordOps.concat(biqEdits).concat(structureEdits);
    if (allBiqEdits.length > 0) {
      const biqSave = applyBiqReferenceEdits({
        biqPath: scenarioPath,
        edits: allBiqEdits,
        javaPath,
        civ3Path,
        outputPath: path.join(
          os.tmpdir(),
          `c3x-biq-save-stage-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.biq`
        )
      });
      if (!biqSave.ok) {
        return { ok: false, error: biqSave.error || 'Failed to save BIQ edits.' };
      }
      if (biqSave.outputPath && fs.existsSync(biqSave.outputPath)) {
        try {
          const biqBytes = fs.readFileSync(biqSave.outputPath);
          plannedWrites.push({
            kind: 'biq',
            path: scenarioPath,
            data: biqBytes
          });
        } finally {
          try {
            fs.unlinkSync(biqSave.outputPath);
          } catch (_err) {
            // best effort cleanup
          }
        }
      }
      saveReport.push({
        kind: 'biq',
        path: scenarioPath,
        applied: biqSave.applied || 0,
        skipped: biqSave.skipped || 0,
        warning: biqSave.warning || ''
      });
    }
  }

  if (mode === 'scenario') {
    const pediaIconsEdits = collectPediaIconsReferenceEdits(payload.tabs || {});
    if (pediaIconsEdits.length > 0) {
      const explicitPediaTarget = ((((payload.tabs || {}).civilizations || {}).sourceDetails || {}).pediaIconsScenarioWrite || '').trim();
      const targetPath = explicitPediaTarget || path.join(scenarioDir, 'Text', 'PediaIcons.txt');
      const protectErr = failIfProtected(targetPath, 'PediaIcons target');
      if (protectErr) return { ok: false, error: protectErr };
      const pediaSave = buildScenarioPediaIconsEditResult({ targetPath, edits: pediaIconsEdits });
      if (!pediaSave.ok) {
        return { ok: false, error: pediaSave.error || 'Failed to save PediaIcons edits.' };
      }
      if (pediaSave.applied > 0) {
        plannedWrites.push({
          kind: 'pediaIcons',
          path: targetPath,
          data: pediaSave.buffer
        });
        saveReport.push({ kind: 'pediaIcons', path: targetPath, applied: pediaSave.applied });
      }
    }

    const civilopediaEdits = collectCivilopediaReferenceEdits(payload.tabs || {});
    if (civilopediaEdits.length > 0) {
      const explicitTarget = ((((payload.tabs || {}).civilizations || {}).sourceDetails || {}).civilopediaScenario || '').trim();
      const targetPath = explicitTarget || path.join(scenarioDir, 'Text', 'Civilopedia.txt');
      const protectErr = failIfProtected(targetPath, 'Civilopedia target');
      if (protectErr) return { ok: false, error: protectErr };
      const civilopediaSave = buildScenarioCivilopediaEditResult({ targetPath, edits: civilopediaEdits });
      if (!civilopediaSave.ok) {
        return { ok: false, error: civilopediaSave.error || 'Failed to save Civilopedia edits.' };
      }
      if (civilopediaSave.applied > 0) {
        plannedWrites.push({
          kind: 'civilopedia',
          path: targetPath,
          data: civilopediaSave.buffer
        });
        saveReport.push({ kind: 'civilopedia', path: targetPath, applied: civilopediaSave.applied });
      }
    }
  }

  const committed = commitWritesWithRollback(plannedWrites);
  if (!committed.ok) {
    return { ok: false, error: committed.error || 'Failed to commit save transaction.' };
  }

  return { ok: true, saveReport };
}

function isBiqPath(value) {
  return /\.biq$/i.test(String(value || '').trim());
}

function getSectionCodeForReferenceTabKey(tabKey) {
  const spec = REFERENCE_TAB_SPECS.find((s) => s.key === tabKey);
  return spec ? getSectionCodeForReferencePrefix(spec.prefix) : '';
}

function collectBiqReferenceEdits(tabs) {
  const edits = [];
  for (const spec of REFERENCE_TAB_SPECS) {
    const tab = tabs[spec.key];
    if (!tab || !Array.isArray(tab.entries)) continue;
    const sectionCode = getSectionCodeForReferenceTabKey(spec.key);
    if (!sectionCode) continue;
    tab.entries.forEach((entry) => {
      const civKey = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
      if (!civKey || !Array.isArray(entry.biqFields)) return;
      entry.biqFields.forEach((field) => {
        if (!field) return;
        const key = String((field && (field.baseKey || field.key)) || '').trim();
        if (!key || key.toLowerCase() === 'civilopediaentry') return;
        const value = cleanDisplayText(field && field.value);
        const originalValue = cleanDisplayText(field && field.originalValue);
        if (value === originalValue) return;
        edits.push({
          sectionCode,
          recordRef: civKey,
          fieldKey: key,
          value
        });
      });
    });
  }
  return edits;
}

function collectBiqReferenceRecordOps(tabs) {
  const ops = [];
  for (const spec of REFERENCE_TAB_SPECS) {
    const tab = tabs[spec.key];
    if (!tab || !Array.isArray(tab.recordOps) || tab.recordOps.length === 0) continue;
    const sectionCode = getSectionCodeForReferenceTabKey(spec.key);
    if (!sectionCode) continue;
    tab.recordOps.forEach((op) => {
      const kind = String(op && op.op || '').toLowerCase();
      if (kind === 'add') {
        const newRecordRef = String(op.newRecordRef || '').trim().toUpperCase();
        if (!newRecordRef) return;
        const copyFromRef = String(op.copyFromRef || '').trim().toUpperCase();
        ops.push({
          op: copyFromRef ? 'copy' : 'add',
          sectionCode,
          newRecordRef,
          copyFromRef
        });
        return;
      }
      if (kind === 'copy') {
        const sourceRef = String(op.sourceRef || '').trim().toUpperCase();
        const newRecordRef = String(op.newRecordRef || '').trim().toUpperCase();
        if (!sourceRef || !newRecordRef) return;
        ops.push({
          op: 'copy',
          sectionCode,
          sourceRef,
          newRecordRef
        });
        return;
      }
      if (kind === 'delete') {
        const recordRef = String(op.recordRef || '').trim().toUpperCase();
        if (!recordRef) return;
        ops.push({
          op: 'delete',
          sectionCode,
          recordRef
        });
      }
    });
  }
  return ops;
}

function collectBiqStructureEdits(tabs) {
  const edits = [];
  BIQ_STRUCTURE_TAB_SPECS.forEach((spec) => {
    const tab = tabs[spec.key];
    if (!tab || !Array.isArray(tab.sections)) return;
    tab.sections.forEach((section) => {
      const sectionCode = String((section && section.code) || '').trim().toUpperCase();
      if (!sectionCode || !Array.isArray(section.records)) return;
      section.records.forEach((record) => {
        const recordIndex = Number(record && record.index);
        if (!Number.isFinite(recordIndex) || !Array.isArray(record.fields)) return;
        record.fields.forEach((field) => {
          if (!field) return;
          const key = String((field.baseKey || field.key) || '').trim();
          if (!key || key.toLowerCase() === 'civilopediaentry') return;
          const value = cleanDisplayText(field.value);
          const originalValue = cleanDisplayText(field.originalValue);
          if (value === originalValue) return;
          edits.push({
            sectionCode,
            recordRef: `@INDEX:${recordIndex}`,
            fieldKey: key,
            value
          });
        });
      });
    });
  });
  return edits;
}

function collectCivilopediaReferenceEdits(tabs) {
  const edits = [];
  const upsert = (sectionKey, value) => {
    const key = String(sectionKey || '').trim().toUpperCase();
    if (!key) return;
    const normalizedValue = normalizeCivilopediaTextValue(value);
    const existing = edits.find((entry) => entry.sectionKey === key);
    if (existing) {
      existing.value = normalizedValue;
      return;
    }
    edits.push({ sectionKey: key, value: normalizedValue });
  };

  for (const spec of REFERENCE_TAB_SPECS) {
    const tab = tabs[spec.key];
    if (!tab || !Array.isArray(tab.entries)) continue;
    tab.entries.forEach((entry) => {
      const key = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
      if (!key) return;
      const overview = normalizeCivilopediaTextValue(entry && entry.overview);
      const originalOverview = normalizeCivilopediaTextValue(entry && entry.originalOverview);
      if (overview !== originalOverview) {
        upsert(key, overview);
      }
      const description = normalizeCivilopediaTextValue(entry && entry.description);
      const originalDescription = normalizeCivilopediaTextValue(entry && entry.originalDescription);
      if (description !== originalDescription) {
        upsert(`DESC_${key}`, description);
      }
    });
  }
  const terrainTab = tabs && tabs.terrain;
  const terrainCivilopedia = terrainTab && terrainTab.civilopedia;
  const nestedTabs = [
    terrainCivilopedia && terrainCivilopedia.terrain,
    terrainCivilopedia && terrainCivilopedia.workerActions
  ].filter(Boolean);
  nestedTabs.forEach((tab) => {
    if (!Array.isArray(tab.entries)) return;
    tab.entries.forEach((entry) => {
      const key = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
      if (!key) return;
      const overview = normalizeCivilopediaTextValue(entry && entry.overview);
      const originalOverview = normalizeCivilopediaTextValue(entry && entry.originalOverview);
      if (overview !== originalOverview) {
        upsert(key, overview);
      }
      const description = normalizeCivilopediaTextValue(entry && entry.description);
      const originalDescription = normalizeCivilopediaTextValue(entry && entry.originalDescription);
      if (description !== originalDescription) {
        upsert(`DESC_${key}`, description);
      }
    });
  });
  return edits;
}

function normalizePediaPathList(values) {
  return dedupeStrings(
    (Array.isArray(values) ? values : [])
      .map((v) => normalizeRelativePath(v))
      .filter(Boolean)
  );
}

function collectPediaIconsReferenceEdits(tabs) {
  const edits = [];
  for (const spec of REFERENCE_TAB_SPECS) {
    const tab = tabs[spec.key];
    if (!tab || !Array.isArray(tab.entries)) continue;
    tab.entries.forEach((entry) => {
      const key = String(entry && entry.civilopediaKey || '').trim().toUpperCase();
      if (!key) return;
      const shortKey = key.replace(/^(RACE_|TECH_|GOOD_|BLDG_|GOVT_|PRTO_)/, '');
      const nextIconPaths = normalizePediaPathList(entry && entry.iconPaths);
      const prevIconPaths = normalizePediaPathList(entry && entry.originalIconPaths);
      if (JSON.stringify(nextIconPaths) !== JSON.stringify(prevIconPaths)) {
        if (key.startsWith('TECH_')) {
          const small = nextIconPaths[0] || '';
          const large = nextIconPaths[1] || nextIconPaths[0] || '';
          edits.push({ blockKey: key, lines: small ? [small] : [] });
          edits.push({ blockKey: `${key}_LARGE`, lines: large ? [large] : [] });
        } else {
          edits.push({ blockKey: `ICON_${key}`, lines: nextIconPaths });
        }
      }

      const nextRacePaths = normalizePediaPathList(entry && entry.racePaths);
      const prevRacePaths = normalizePediaPathList(entry && entry.originalRacePaths);
      if (JSON.stringify(nextRacePaths) !== JSON.stringify(prevRacePaths) && key.startsWith('RACE_')) {
        edits.push({ blockKey: `ICON_RACE_${shortKey}`, lines: nextRacePaths });
      }

      const nextAnim = normalizeRelativePath(entry && entry.animationName);
      const prevAnim = normalizeRelativePath(entry && entry.originalAnimationName);
      if (nextAnim !== prevAnim && key.startsWith('PRTO_')) {
        edits.push({ blockKey: `ANIMNAME_${key}`, lines: nextAnim ? [nextAnim] : [] });
      }
    });
  }
  const merged = new Map();
  edits.forEach((edit) => {
    const k = String(edit.blockKey || '').trim().toUpperCase();
    if (!k) return;
    merged.set(k, { blockKey: k, lines: normalizePediaIconsLines(edit.lines) });
  });
  return Array.from(merged.values());
}

function applyBiqReferenceEdits({ biqPath, edits, javaPath, civ3Path, outputPath }) {
  if (!biqPath || !Array.isArray(edits) || edits.length === 0) {
    return { ok: true, applied: 0, skipped: 0, warning: '', outputPath: '' };
  }
  const classpath = findBiqBridgeClasspath();
  if (!classpath) {
    return { ok: false, error: 'BIQ bridge classes not found in vendor/biqbridge and vendor/lib.' };
  }
  const inflated = inflateBiqIfNeeded(biqPath, civ3Path, javaPath);
  if (!inflated.ok) {
    return { ok: false, error: inflated.error || 'Failed to read BIQ before applying edits.' };
  }

  const patchPath = path.join(
    os.tmpdir(),
    `c3x-biq-edits-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.txt`
  );
  const needsTempBiq = !!inflated.compressed;
  const finalOutputPath = String(outputPath || biqPath).trim() || biqPath;
  const inBiqPath = needsTempBiq
    ? path.join(os.tmpdir(), `c3x-biq-apply-in-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.biq`)
    : biqPath;
  const outBiqPath = needsTempBiq
    ? path.join(os.tmpdir(), `c3x-biq-apply-out-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.biq`)
    : finalOutputPath;
  try {
    if (needsTempBiq) {
      fs.writeFileSync(inBiqPath, inflated.buffer);
    }
    const lines = edits.map((edit) => {
      const op = String(edit && edit.op || 'set').toLowerCase();
      if (op === 'add') {
        return `ADD\t${edit.sectionCode}\t${String(edit.newRecordRef || '').trim().toUpperCase()}\t${String(edit.copyFromRef || '').trim().toUpperCase()}`;
      }
      if (op === 'copy') {
        const source = String(edit.sourceRef || edit.copyFromRef || '').trim().toUpperCase();
        return `COPY\t${edit.sectionCode}\t${source}\t${String(edit.newRecordRef || '').trim().toUpperCase()}`;
      }
      if (op === 'delete') {
        return `DELETE\t${edit.sectionCode}\t${String(edit.recordRef || '').trim().toUpperCase()}`;
      }
      const encoded = Buffer.from(String(edit.value || ''), 'utf8').toString('base64');
      return `SET\t${edit.sectionCode}\t${edit.recordRef}\t${edit.fieldKey}\t${encoded}`;
    });
    fs.writeFileSync(patchPath, `${lines.join('\n')}\n`, 'utf8');
    const javaBinary = findJavaBinary(javaPath);
    const proc = spawnSync(javaBinary, ['-cp', classpath, 'BiqBridge', '--apply', inBiqPath, patchPath, outBiqPath], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024
    });
    if (proc.status !== 0) {
      return { ok: false, error: `BIQ bridge apply failed: ${proc.stderr || proc.stdout || 'unknown error'}` };
    }
    const out = String(proc.stdout || '').trim();
    const start = out.indexOf('{');
    const end = out.lastIndexOf('}');
    if (start < 0 || end < start) {
      return { ok: false, error: 'BIQ bridge apply output was not valid JSON.' };
    }
    const parsed = JSON.parse(out.slice(start, end + 1));
    if (!parsed || !parsed.ok) {
      return { ok: false, error: (parsed && parsed.error) || 'BIQ bridge apply returned an error.' };
    }
    if (needsTempBiq) {
      if (!fs.existsSync(outBiqPath)) {
        return { ok: false, error: 'BIQ bridge apply did not produce an output BIQ.' };
      }
      fs.mkdirSync(path.dirname(finalOutputPath), { recursive: true });
      fs.copyFileSync(outBiqPath, finalOutputPath);
    }
    return {
      ok: true,
      applied: Number(parsed.applied || 0),
      skipped: Number(parsed.skipped || 0),
      warning: String(parsed.warning || ''),
      outputPath: finalOutputPath
    };
  } catch (err) {
    return { ok: false, error: `BIQ bridge apply failed: ${err.message}` };
  } finally {
    try {
      if (fs.existsSync(patchPath)) fs.unlinkSync(patchPath);
    } catch (_err) {
      // best effort cleanup
    }
    try {
      if (needsTempBiq && fs.existsSync(inBiqPath)) fs.unlinkSync(inBiqPath);
    } catch (_err) {
      // best effort cleanup
    }
    try {
      if (needsTempBiq && fs.existsSync(outBiqPath)) fs.unlinkSync(outBiqPath);
    } catch (_err) {
      // best effort cleanup
    }
  }
}

module.exports = {
  FILE_SPECS,
  parseIniLines,
  buildBaseModel,
  parseSectionedConfig,
  serializeSectionedConfig,
  serializeBaseConfig,
  parseIniFieldDocs,
  parseIniSectionMap,
  parseSectionFieldDocs,
  parseCivilopediaDocumentWithOrder,
  serializeCivilopediaDocumentWithOrder,
  parsePediaIconsDocumentWithOrder,
  serializePediaIconsDocumentWithOrder,
  parseDiplomacySlotOptions,
  buildReferenceTabs,
  resolveScenarioDir,
  resolveBiqPath,
  parseBiqSectionsFromBuffer,
  resolvePaths,
  loadBundle,
  saveBundle
};
