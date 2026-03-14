'use strict';

// BIQ section parsers, serializers, and english-field generators.
// Supports Conquests (BICX, majorVersion=12) as primary target.

const { BiqReader, BiqWriter } = require('./biqBuffer');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readStr(buf, offset, len) {
  let end = 0;
  while (end < len && buf[offset + end] !== 0) end++;
  return buf.subarray(offset, offset + end).toString('latin1');
}

function writeStr(w, str, len) {
  w.writeString(str || '', len, 'latin1');
}

function lines(pairs) {
  return pairs.filter((p) => p != null).map(([k, v]) => `${k}: ${v}`).join('\n');
}

function parseIntMaybe(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// IO context (shared during a full parse pass)
// ---------------------------------------------------------------------------

class BiqIO {
  constructor(opts = {}) {
    this.versionTag = opts.versionTag || 'BICX';
    this.majorVersion = opts.majorVersion || 12;
    this.minorVersion = opts.minorVersion || 8;
    this.numEras = opts.numEras || 3;
    this.mapWidth = opts.mapWidth || 0;
    this.isConquests = this.versionTag.startsWith('BIC') && this.majorVersion === 12;
    this.isPTWPlus = this.versionTag.startsWith('BIC') && this.majorVersion >= 2;
  }
}

// ---------------------------------------------------------------------------
// Per-section parsers
// Each parser takes (data: Buffer, io: BiqIO) and returns a plain object.
// data is the record body (after the 4-byte dataLen prefix).
// ---------------------------------------------------------------------------

function parseTECH(data, io) {
  let off = 0;
  const name = readStr(data, off, 32); off += 32;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const cost = data.readInt32LE(off); off += 4;
  const era = data.readInt32LE(off); off += 4;
  const advanceIcon = data.readInt32LE(off); off += 4;
  const x = data.readInt32LE(off); off += 4;
  const y = data.readInt32LE(off); off += 4;
  const prerequisites = [];
  for (let i = 0; i < 4; i++) { prerequisites.push(data.readInt32LE(off)); off += 4; }
  const flags = data.readInt32LE(off); off += 4;
  let flavors = 0, questionMark = 0;
  if (io.isConquests && off + 8 <= data.length) {
    flavors = data.readInt32LE(off); off += 4;
    questionMark = data.readInt32LE(off); off += 4;
  }
  return { name, civilopediaEntry, cost, era, advanceIcon, x, y, prerequisites, flags, flavors, questionMark };
}

function serializeTECH(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 32);
  writeStr(w, rec.civilopediaEntry, 32);
  w.writeInt(rec.cost | 0);
  w.writeInt(rec.era | 0);
  w.writeInt(rec.advanceIcon | 0);
  w.writeInt(rec.x | 0);
  w.writeInt(rec.y | 0);
  const prereqs = Array.isArray(rec.prerequisites) ? rec.prerequisites : [-1, -1, -1, -1];
  for (let i = 0; i < 4; i++) w.writeInt(prereqs[i] != null ? (prereqs[i] | 0) : -1);
  w.writeInt(rec.flags | 0);
  if (io.isConquests) {
    w.writeInt(rec.flavors | 0);
    w.writeInt(rec.questionMark | 0);
  }
  return w.toBuffer();
}

function toEnglishTECH(rec, io) {
  const prereqs = Array.isArray(rec.prerequisites) ? rec.prerequisites : [-1, -1, -1, -1];
  return lines([
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['cost', String(rec.cost | 0)],
    ['era', String(rec.era | 0)],
    ['advanceIcon', String(rec.advanceIcon | 0)],
    ['x', String(rec.x | 0)],
    ['y', String(rec.y | 0)],
    ...prereqs.map((p, i) => [`prerequisite${i + 1}`, String(p != null ? (p | 0) : -1)]),
    ['flags', String(rec.flags | 0)],
    io.isConquests ? ['flavors', String(rec.flavors | 0)] : null,
    io.isConquests ? ['questionMark', String(rec.questionMark | 0)] : null,
  ]);
}

const WRITABLE_TECH = ['name', 'cost', 'era', 'advance_icon', 'x', 'y', 'prerequisite1', 'prerequisite2', 'prerequisite3', 'prerequisite4', 'flags', 'flavors'];

// ---------------------------------------------------------------------------
// BLDG
// ---------------------------------------------------------------------------

const BLDG_SCALAR_NAMES = [
  'doublesHappiness', 'gainInEveryCity', 'gainOnContinent', 'reqImprovement',
  'cost', 'culture', 'bombardDefence', 'navalBombardDefence', 'defenceBonus', 'navalDefenceBonus',
  'maintenanceCost', 'happyAll', 'happy', 'unhappyAll', 'unhappy', 'numReqBuildings', 'airPower',
  'navalPower', 'pollution', 'production', 'reqGovernment', 'spaceshipPart',
  'reqAdvance', 'obsoleteBy', 'reqResource1', 'reqResource2', 'improvements', 'otherChar',
  'smallWonderCharacteristics', 'wonderCharacteristics', 'armiesRequired', 'flavors', 'questionMark',
  'unitProduced', 'unitFrequency'
];

function parseBLDG(data, io) {
  let off = 0;
  const description = readStr(data, off, 64); off += 64;
  const name = readStr(data, off, 32); off += 32;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const scalars = {};
  for (const sn of BLDG_SCALAR_NAMES) {
    if (off + 4 > data.length) { scalars[sn] = 0; continue; }
    scalars[sn] = data.readInt32LE(off); off += 4;
  }
  return { description, name, civilopediaEntry, ...scalars };
}

function serializeBLDG(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.description, 64);
  writeStr(w, rec.name, 32);
  writeStr(w, rec.civilopediaEntry, 32);
  for (const sn of BLDG_SCALAR_NAMES) {
    w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
  }
  return w.toBuffer();
}

function toEnglishBLDG(rec, io) {
  const pairs = [
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['description', rec.description || ''],
  ];
  for (const sn of BLDG_SCALAR_NAMES) {
    const k = sn.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
    pairs.push([k, String((rec[sn] != null ? rec[sn] : 0) | 0)]);
  }
  return lines(pairs);
}

const WRITABLE_BLDG = ['name', 'description', 'cost', 'culture', 'maintenance_cost', 'req_advance', 'obsolete_by', 'req_resource1', 'req_resource2', 'req_government', 'req_improvement', 'doubles_happiness', 'gain_in_every_city', 'gain_on_continent', 'defence_bonus', 'naval_defence_bonus', 'bombard_defence', 'naval_bombard_defence', 'happy_all', 'happy', 'unhappy_all', 'unhappy', 'num_req_buildings', 'air_power', 'naval_power', 'pollution', 'production', 'spaceship_part', 'other_char', 'small_wonder_characteristics', 'wonder_characteristics', 'armies_required', 'flavors', 'unit_produced', 'unit_frequency'];

// ---------------------------------------------------------------------------
// GOOD (Resources)
// ---------------------------------------------------------------------------

function parseGOOD(data, io) {
  let off = 0;
  const name = readStr(data, off, 24); off += 24;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const type = data.readInt32LE(off); off += 4;
  const appearanceRatio = data.readInt32LE(off); off += 4;
  const disapperanceProbability = data.readInt32LE(off); off += 4;
  const icon = data.readInt32LE(off); off += 4;
  const prerequisite = data.readInt32LE(off); off += 4;
  const foodBonus = data.readInt32LE(off); off += 4;
  const shieldsBonus = data.readInt32LE(off); off += 4;
  const commerceBonus = data.readInt32LE(off); off += 4;
  return { name, civilopediaEntry, type, appearanceRatio, disapperanceProbability, icon, prerequisite, foodBonus, shieldsBonus, commerceBonus };
}

function serializeGOOD(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 24);
  writeStr(w, rec.civilopediaEntry, 32);
  w.writeInt(rec.type | 0);
  w.writeInt(rec.appearanceRatio | 0);
  w.writeInt(rec.disapperanceProbability | 0);
  w.writeInt(rec.icon | 0);
  w.writeInt(rec.prerequisite | 0);
  w.writeInt(rec.foodBonus | 0);
  w.writeInt(rec.shieldsBonus | 0);
  w.writeInt(rec.commerceBonus | 0);
  return w.toBuffer();
}

function toEnglishGOOD(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['type', String(rec.type | 0)],
    ['appearanceRatio', String(rec.appearanceRatio | 0)],
    ['disapperanceProbability', String(rec.disapperanceProbability | 0)],
    ['icon', String(rec.icon | 0)],
    ['prerequisite', String(rec.prerequisite | 0)],
    ['foodBonus', String(rec.foodBonus | 0)],
    ['shieldsBonus', String(rec.shieldsBonus | 0)],
    ['commerceBonus', String(rec.commerceBonus | 0)],
  ]);
}

const WRITABLE_GOOD = ['name', 'type', 'appearance_ratio', 'disapperance_probability', 'icon', 'prerequisite', 'food_bonus', 'shields_bonus', 'commerce_bonus'];

// ---------------------------------------------------------------------------
// GOVT (Governments)
// ---------------------------------------------------------------------------

function parseGOVT(data, io) {
  let off = 0;
  const defaultType = data.readInt32LE(off); off += 4;
  const transitionType = data.readInt32LE(off); off += 4;
  const requiresMaintenance = data.readInt32LE(off); off += 4;
  const questionMark1 = data.readInt32LE(off); off += 4;
  const tilePenalty = data.readInt32LE(off); off += 4;
  const commerceBonus = data.readInt32LE(off); off += 4;
  const name = readStr(data, off, 64); off += 64;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  // 8 ruler title strings × 32 bytes each
  const rulerTitles = [];
  for (let i = 0; i < 8; i++) { rulerTitles.push(readStr(data, off, 32)); off += 32; }
  const corruption = data.readInt32LE(off); off += 4;
  const immuneTo = data.readInt32LE(off); off += 4;
  const diplomatLevel = data.readInt32LE(off); off += 4;
  const spyLevel = data.readInt32LE(off); off += 4;
  const numGovts = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  // numGovts × 3 int32 relations
  const relations = [];
  for (let i = 0; i < numGovts && off + 12 <= data.length; i++) {
    const canBribe = data.readInt32LE(off); off += 4;
    const briberyMod = data.readInt32LE(off); off += 4;
    const resistanceMod = data.readInt32LE(off); off += 4;
    relations.push({ canBribe, briberyMod, resistanceMod });
  }
  const scalars2 = {};
  const s2names = ['hurrying', 'assimilation', 'draftLimit', 'militaryPolice', 'rulerTitlePairsUsed',
    'prerequisiteTechnology', 'scienceCap', 'workerRate', 'qm2', 'qm3', 'qm4',
    'freeUnits', 'perTown', 'perCity', 'perMetropolis', 'costPerUnit', 'warWeariness'];
  for (const sn of s2names) {
    scalars2[sn] = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  }
  let xenophobic = 0, forceResettlement = 0;
  if (io.isConquests && off + 8 <= data.length) {
    xenophobic = data.readInt32LE(off); off += 4;
    forceResettlement = data.readInt32LE(off); off += 4;
  }
  return {
    defaultType, transitionType, requiresMaintenance, questionMark1, tilePenalty, commerceBonus,
    name, civilopediaEntry, rulerTitles, corruption, immuneTo, diplomatLevel, spyLevel,
    numGovts, relations, ...scalars2, xenophobic, forceResettlement
  };
}

function serializeGOVT(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.defaultType | 0);
  w.writeInt(rec.transitionType | 0);
  w.writeInt(rec.requiresMaintenance | 0);
  w.writeInt(rec.questionMark1 | 0);
  w.writeInt(rec.tilePenalty | 0);
  w.writeInt(rec.commerceBonus | 0);
  writeStr(w, rec.name, 64);
  writeStr(w, rec.civilopediaEntry, 32);
  const titles = Array.isArray(rec.rulerTitles) ? rec.rulerTitles : [];
  for (let i = 0; i < 8; i++) writeStr(w, titles[i] || '', 32);
  w.writeInt(rec.corruption | 0);
  w.writeInt(rec.immuneTo | 0);
  w.writeInt(rec.diplomatLevel | 0);
  w.writeInt(rec.spyLevel | 0);
  const rels = Array.isArray(rec.relations) ? rec.relations : [];
  w.writeInt(rels.length);
  for (const r of rels) {
    w.writeInt((r.canBribe != null ? r.canBribe : 0) | 0);
    w.writeInt((r.briberyMod != null ? r.briberyMod : 0) | 0);
    w.writeInt((r.resistanceMod != null ? r.resistanceMod : 0) | 0);
  }
  const s2names = ['hurrying', 'assimilation', 'draftLimit', 'militaryPolice', 'rulerTitlePairsUsed',
    'prerequisiteTechnology', 'scienceCap', 'workerRate', 'qm2', 'qm3', 'qm4',
    'freeUnits', 'perTown', 'perCity', 'perMetropolis', 'costPerUnit', 'warWeariness'];
  for (const sn of s2names) w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
  if (io.isConquests) {
    w.writeInt(rec.xenophobic | 0);
    w.writeInt(rec.forceResettlement | 0);
  }
  return w.toBuffer();
}

function toEnglishGOVT(rec, io) {
  const pairs = [
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['defaultType', String(rec.defaultType | 0)],
    ['transitionType', String(rec.transitionType | 0)],
    ['requiresMaintenance', String(rec.requiresMaintenance | 0)],
    ['tilePenalty', String(rec.tilePenalty | 0)],
    ['commerceBonus', String(rec.commerceBonus | 0)],
    ['corruption', String(rec.corruption | 0)],
    ['immuneTo', String(rec.immuneTo | 0)],
    ['diplomatLevel', String(rec.diplomatLevel | 0)],
    ['spyLevel', String(rec.spyLevel | 0)],
    ['hurrying', String(rec.hurrying | 0)],
    ['assimilation', String(rec.assimilation | 0)],
    ['draftLimit', String(rec.draftLimit | 0)],
    ['militaryPolice', String(rec.militaryPolice | 0)],
    ['prerequisiteTechnology', String(rec.prerequisiteTechnology | 0)],
    ['scienceCap', String(rec.scienceCap | 0)],
    ['workerRate', String(rec.workerRate | 0)],
    ['freeUnits', String(rec.freeUnits | 0)],
    ['perTown', String(rec.perTown | 0)],
    ['perCity', String(rec.perCity | 0)],
    ['perMetropolis', String(rec.perMetropolis | 0)],
    ['costPerUnit', String(rec.costPerUnit | 0)],
    ['warWeariness', String(rec.warWeariness | 0)],
    ['rulerTitlePairsUsed', String(rec.rulerTitlePairsUsed | 0)],
  ];
  const titles = Array.isArray(rec.rulerTitles) ? rec.rulerTitles : [];
  const titleLabels = ['maleTitleEra1', 'femaleTitleEra1', 'maleTitleEra2', 'femaleTitleEra2',
    'maleTitleEra3', 'femaleTitleEra3', 'maleTitleEra4', 'femaleTitleEra4'];
  for (let i = 0; i < 8; i++) pairs.push([titleLabels[i] || `rulerTitle${i + 1}`, titles[i] || '']);
  const rels = Array.isArray(rec.relations) ? rec.relations : [];
  pairs.push(['numGovts', String(rels.length)]);
  rels.forEach((r, i) => {
    pairs.push([`govt_relation_${i}_can_bribe`, String((r.canBribe != null ? r.canBribe : 0) | 0)]);
    pairs.push([`govt_relation_${i}_bribery_mod`, String((r.briberyMod != null ? r.briberyMod : 0) | 0)]);
    pairs.push([`govt_relation_${i}_resistance_mod`, String((r.resistanceMod != null ? r.resistanceMod : 0) | 0)]);
  });
  if (io.isConquests) {
    pairs.push(['xenophobic', String(rec.xenophobic | 0)]);
    pairs.push(['forceResettlement', String(rec.forceResettlement | 0)]);
  }
  return lines(pairs);
}

const WRITABLE_GOVT = ['name', 'default_type', 'transition_type', 'requires_maintenance', 'tile_penalty', 'commerce_bonus', 'corruption', 'immune_to', 'diplomat_level', 'spy_level', 'hurrying', 'assimilation', 'draft_limit', 'military_police', 'prerequisite_technology', 'science_cap', 'worker_rate', 'free_units', 'per_town', 'per_city', 'per_metropolis', 'cost_per_unit', 'war_weariness'];

// ---------------------------------------------------------------------------
// RACE (Civilizations)
// ---------------------------------------------------------------------------

function parseRACE(data, io) {
  let off = 0;
  const numCities = data.readInt32LE(off); off += 4;
  const cityNames = [];
  for (let i = 0; i < numCities && off + 24 <= data.length; i++) {
    cityNames.push(readStr(data, off, 24)); off += 24;
  }
  const numMilLeaders = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const milLeaderNames = [];
  for (let i = 0; i < numMilLeaders && off + 32 <= data.length; i++) {
    milLeaderNames.push(readStr(data, off, 32)); off += 32;
  }
  const name = readStr(data, off, 32); off += 32; // leaderName
  const leaderTitle = readStr(data, off, 24); off += 24;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const adjective = readStr(data, off, 40); off += 40;
  const civilizationName = readStr(data, off, 40); off += 40;
  const noun = readStr(data, off, 40); off += 40;
  // numEras × forward + reverse filenames (260 bytes each)
  const forwardFilenames = [];
  const reverseFilenames = [];
  for (let i = 0; i < io.numEras && off + 260 <= data.length; i++) {
    forwardFilenames.push(readStr(data, off, 260)); off += 260;
  }
  for (let i = 0; i < io.numEras && off + 260 <= data.length; i++) {
    reverseFilenames.push(readStr(data, off, 260)); off += 260;
  }
  const cultureGroup = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const leaderGender = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const civilizationGender = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const aggressionLevel = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const uniqueCivCounter = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const shunnedGovernment = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const favoriteGovernment = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const defaultColor = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const uniqueColor = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const freeTechs = [];
  for (let i = 0; i < 4 && off + 4 <= data.length; i++) {
    freeTechs.push(data.readInt32LE(off)); off += 4;
  }
  const bonuses = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const governorSettings = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const buildNever = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const buildOften = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const plurality = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  // PTW+ kingUnit
  let kingUnit = 0;
  if (io.isPTWPlus && off + 4 <= data.length) { kingUnit = data.readInt32LE(off); off += 4; }
  // Conquests extras
  let flavors = 0, questionMark = 0, diplomacyTextIndex = 0;
  let numScientificLeaders = 0;
  const scientificLeaderNames = [];
  if (io.isConquests) {
    if (off + 4 <= data.length) { flavors = data.readInt32LE(off); off += 4; }
    if (off + 4 <= data.length) { questionMark = data.readInt32LE(off); off += 4; }
    if (off + 4 <= data.length) { diplomacyTextIndex = data.readInt32LE(off); off += 4; }
    if (off + 4 <= data.length) { numScientificLeaders = data.readInt32LE(off); off += 4; }
    for (let i = 0; i < numScientificLeaders && off + 32 <= data.length; i++) {
      scientificLeaderNames.push(readStr(data, off, 32)); off += 32;
    }
  }
  return {
    numCities, cityNames, numMilLeaders, milLeaderNames,
    name, leaderTitle, civilopediaEntry, adjective, civilizationName, noun,
    forwardFilenames, reverseFilenames,
    cultureGroup, leaderGender, civilizationGender, aggressionLevel,
    uniqueCivCounter, shunnedGovernment, favoriteGovernment, defaultColor, uniqueColor,
    freeTechs, bonuses, governorSettings, buildNever, buildOften, plurality,
    kingUnit, flavors, questionMark, diplomacyTextIndex,
    numScientificLeaders, scientificLeaderNames
  };
}

function serializeRACE(rec, io) {
  const w = new BiqWriter();
  const cityNames = Array.isArray(rec.cityNames) ? rec.cityNames : [];
  w.writeInt(cityNames.length);
  for (const cn of cityNames) writeStr(w, cn, 24);
  const milLeaderNames = Array.isArray(rec.milLeaderNames) ? rec.milLeaderNames : [];
  w.writeInt(milLeaderNames.length);
  for (const ml of milLeaderNames) writeStr(w, ml, 32);
  writeStr(w, rec.name, 32);
  writeStr(w, rec.leaderTitle, 24);
  writeStr(w, rec.civilopediaEntry, 32);
  writeStr(w, rec.adjective, 40);
  writeStr(w, rec.civilizationName, 40);
  writeStr(w, rec.noun, 40);
  const fwd = Array.isArray(rec.forwardFilenames) ? rec.forwardFilenames : [];
  const rev = Array.isArray(rec.reverseFilenames) ? rec.reverseFilenames : [];
  for (let i = 0; i < io.numEras; i++) writeStr(w, fwd[i] || '', 260);
  for (let i = 0; i < io.numEras; i++) writeStr(w, rev[i] || '', 260);
  w.writeInt(rec.cultureGroup | 0);
  w.writeInt(rec.leaderGender | 0);
  w.writeInt(rec.civilizationGender | 0);
  w.writeInt(rec.aggressionLevel | 0);
  w.writeInt(rec.uniqueCivCounter | 0);
  w.writeInt(rec.shunnedGovernment | 0);
  w.writeInt(rec.favoriteGovernment | 0);
  w.writeInt(rec.defaultColor | 0);
  w.writeInt(rec.uniqueColor | 0);
  const ft = Array.isArray(rec.freeTechs) ? rec.freeTechs : [-1, -1, -1, -1];
  for (let i = 0; i < 4; i++) w.writeInt((ft[i] != null ? ft[i] : -1) | 0);
  w.writeInt(rec.bonuses | 0);
  w.writeInt(rec.governorSettings | 0);
  w.writeInt(rec.buildNever | 0);
  w.writeInt(rec.buildOften | 0);
  w.writeInt(rec.plurality | 0);
  if (io.isPTWPlus) w.writeInt(rec.kingUnit | 0);
  if (io.isConquests) {
    w.writeInt(rec.flavors | 0);
    w.writeInt(rec.questionMark | 0);
    w.writeInt(rec.diplomacyTextIndex | 0);
    const sl = Array.isArray(rec.scientificLeaderNames) ? rec.scientificLeaderNames : [];
    w.writeInt(sl.length);
    for (const sln of sl) writeStr(w, sln, 32);
  }
  return w.toBuffer();
}

function toEnglishRACE(rec, io) {
  const pairs = [
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['leaderTitle', rec.leaderTitle || ''],
    ['adjective', rec.adjective || ''],
    ['civilizationName', rec.civilizationName || ''],
    ['noun', rec.noun || ''],
    ['cultureGroup', String(rec.cultureGroup | 0)],
    ['leaderGender', String(rec.leaderGender | 0)],
    ['civilizationGender', String(rec.civilizationGender | 0)],
    ['aggressionLevel', String(rec.aggressionLevel | 0)],
    ['favoriteGovernment', String(rec.favoriteGovernment | 0)],
    ['shunnedGovernment', String(rec.shunnedGovernment | 0)],
    ['defaultColor', String(rec.defaultColor | 0)],
    ['uniqueColor', String(rec.uniqueColor | 0)],
    ['uniqueCivCounter', String(rec.uniqueCivCounter | 0)],
    ['governorSettings', String(rec.governorSettings | 0)],
    ['bonuses', String(rec.bonuses | 0)],
    ['buildNever', String(rec.buildNever | 0)],
    ['buildOften', String(rec.buildOften | 0)],
    ['plurality', String(rec.plurality | 0)],
  ];
  const ft = Array.isArray(rec.freeTechs) ? rec.freeTechs : [-1, -1, -1, -1];
  ft.forEach((v, i) => pairs.push([`freeTech${i + 1}`, String(v != null ? (v | 0) : -1)]));
  const cityNames = Array.isArray(rec.cityNames) ? rec.cityNames : [];
  pairs.push(['numCities', String(cityNames.length)]);
  cityNames.forEach((cn, i) => pairs.push([`cityName_${i}`, cn || '']));
  const milLeaderNames = Array.isArray(rec.milLeaderNames) ? rec.milLeaderNames : [];
  pairs.push(['numMilLeaders', String(milLeaderNames.length)]);
  milLeaderNames.forEach((ml, i) => pairs.push([`milLeader_${i}`, ml || '']));
  const fwd = Array.isArray(rec.forwardFilenames) ? rec.forwardFilenames : [];
  fwd.forEach((fn, i) => pairs.push([`forwardFilename_${i}`, fn || '']));
  const rev = Array.isArray(rec.reverseFilenames) ? rec.reverseFilenames : [];
  rev.forEach((fn, i) => pairs.push([`reverseFilename_${i}`, fn || '']));
  if (io.isPTWPlus) {
    pairs.push(['kingUnit', String(rec.kingUnit | 0)]);
  }
  if (io.isConquests) {
    pairs.push(['flavors', String(rec.flavors | 0)]);
    pairs.push(['diplomacyTextIndex', String(rec.diplomacyTextIndex | 0)]);
    const sl = Array.isArray(rec.scientificLeaderNames) ? rec.scientificLeaderNames : [];
    pairs.push(['numScientificLeaders', String(sl.length)]);
    sl.forEach((sln, i) => pairs.push([`scientificLeader_${i}`, sln || '']));
  }
  return lines(pairs);
}

const WRITABLE_RACE = ['name', 'leader_title', 'adjective', 'civilization_name', 'noun', 'culture_group', 'leader_gender', 'civilization_gender', 'aggression_level', 'favorite_government', 'shunned_government', 'default_color', 'unique_color', 'unique_civ_counter', 'governor_settings', 'bonuses', 'build_never', 'build_often', 'plurality', 'free_tech1', 'free_tech2', 'free_tech3', 'free_tech4', 'king_unit'];

// ---------------------------------------------------------------------------
// PRTO (Unit Types) - partial: parse enough for name/civKey + basic fields
// For complex Conquests arrays, store tail as raw bytes
// ---------------------------------------------------------------------------

function parsePRTO(data, io) {
  let off = 0;
  if (off + 4 > data.length) return { name: '', civilopediaEntry: '', _rawData: data };
  const zoc = data.readInt32LE(off); off += 4;
  const name = readStr(data, off, 32); off += 32;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  // Read 14 main scalars
  const scalarNames = ['attack', 'defence', 'movement', 'bombardRange', 'bombard', 'navalBombard',
    'range', 'transportCapacity', 'cost', 'nationalityMod', 'healthMod', 'visibilityRange',
    'AIBombardRange', 'upgradesTo'];
  const scalars = {};
  for (const sn of scalarNames) {
    if (off + 4 > data.length) { scalars[sn] = 0; continue; }
    scalars[sn] = data.readInt32LE(off); off += 4;
  }
  // The rest is complex variable-length data; store raw for faithful re-serialization
  const _tail = off < data.length ? Buffer.from(data.subarray(off)) : Buffer.alloc(0);
  return { zoc, name, civilopediaEntry, ...scalars, _tail };
}

function serializePRTO(rec, io) {
  if (rec._rawData) return Buffer.from(rec._rawData);
  const w = new BiqWriter();
  w.writeInt(rec.zoc | 0);
  writeStr(w, rec.name, 32);
  writeStr(w, rec.civilopediaEntry, 32);
  const scalarNames = ['attack', 'defence', 'movement', 'bombardRange', 'bombard', 'navalBombard',
    'range', 'transportCapacity', 'cost', 'nationalityMod', 'healthMod', 'visibilityRange',
    'AIBombardRange', 'upgradesTo'];
  for (const sn of scalarNames) w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
  if (rec._tail && rec._tail.length > 0) w.writeBytes(rec._tail);
  return w.toBuffer();
}

function toEnglishPRTO(rec, io) {
  if (rec._rawData) {
    const data = rec._rawData;
    let off = 4; // skip zoc
    const name = readStr(data, off, 32); off += 32;
    const civKey = readStr(data, off, 32);
    return lines([['name', name], ['civilopediaEntry', civKey]]);
  }
  return lines([
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['zoc', String(rec.zoc | 0)],
    ['attack', String(rec.attack | 0)],
    ['defence', String(rec.defence | 0)],
    ['movement', String(rec.movement | 0)],
    ['bombardRange', String(rec.bombardRange | 0)],
    ['bombard', String(rec.bombard | 0)],
    ['navalBombard', String(rec.navalBombard | 0)],
    ['range', String(rec.range | 0)],
    ['transportCapacity', String(rec.transportCapacity | 0)],
    ['cost', String(rec.cost | 0)],
    ['nationalityMod', String(rec.nationalityMod | 0)],
    ['healthMod', String(rec.healthMod | 0)],
    ['visibilityRange', String(rec.visibilityRange | 0)],
    ['AIBombardRange', String(rec.AIBombardRange | 0)],
    ['upgradesTo', String(rec.upgradesTo | 0)],
  ]);
}

const WRITABLE_PRTO = ['name', 'attack', 'defence', 'movement', 'bombard', 'naval_bombard', 'bombard_range', 'range', 'transport_capacity', 'cost', 'upgrades_to'];

// ---------------------------------------------------------------------------
// CITY (scenario cities) - needed for ADD operations
// ---------------------------------------------------------------------------

function parseCITY(data, io) {
  let off = 0;
  if (data.length < 2) return { hasWalls: 0, hasPalace: 0, name: '', ownerType: 0, numBuildings: 0, buildings: [], culture: 0, owner: 0, size: 0, x: 0, y: 0, cityLevel: 0, borderLevel: 0, useAutoName: 0 };
  const hasWalls = data[off++];
  const hasPalace = data[off++];
  const name = readStr(data, off, 24); off += 24;
  const ownerType = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numBuildings = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const buildings = [];
  for (let i = 0; i < numBuildings && off + 4 <= data.length; i++) {
    buildings.push(data.readInt32LE(off)); off += 4;
  }
  const culture = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const owner = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const size = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const x = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const y = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const cityLevel = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const borderLevel = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const useAutoName = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  return { hasWalls, hasPalace, name, ownerType, numBuildings, buildings, culture, owner, size, x, y, cityLevel, borderLevel, useAutoName };
}

function serializeCITY(rec, io) {
  const w = new BiqWriter();
  w.writeByte(rec.hasWalls | 0);
  w.writeByte(rec.hasPalace | 0);
  writeStr(w, rec.name, 24);
  w.writeInt(rec.ownerType | 0);
  const blds = Array.isArray(rec.buildings) ? rec.buildings : [];
  w.writeInt(blds.length);
  for (const b of blds) w.writeInt(b | 0);
  w.writeInt(rec.culture | 0);
  w.writeInt(rec.owner | 0);
  w.writeInt(rec.size || 1);
  w.writeInt(rec.x | 0);
  w.writeInt(rec.y | 0);
  w.writeInt(rec.cityLevel | 0);
  w.writeInt(rec.borderLevel | 0);
  w.writeInt(rec.useAutoName | 0);
  return w.toBuffer();
}

function toEnglishCITY(rec, io) {
  const pairs = [
    ['name', rec.name || ''],
    ['hasWalls', String(rec.hasWalls | 0)],
    ['hasPalace', String(rec.hasPalace | 0)],
    ['ownerType', String(rec.ownerType | 0)],
    ['owner', String(rec.owner | 0)],
    ['size', String(rec.size || 1)],
    ['x', String(rec.x | 0)],
    ['y', String(rec.y | 0)],
    ['culture', String(rec.culture | 0)],
    ['cityLevel', String(rec.cityLevel | 0)],
    ['borderLevel', String(rec.borderLevel | 0)],
    ['useAutoName', String(rec.useAutoName | 0)],
    ['numBuildings', String(Array.isArray(rec.buildings) ? rec.buildings.length : (rec.numBuildings | 0))],
  ];
  const blds = Array.isArray(rec.buildings) ? rec.buildings : [];
  blds.forEach((b, i) => pairs.push([i === 0 ? 'building' : `building_${i + 1}`, String(b | 0)]));
  return lines(pairs);
}

const WRITABLE_CITY = ['name', 'has_walls', 'has_palace', 'owner_type', 'owner', 'size', 'x', 'y', 'culture', 'city_level', 'border_level', 'use_auto_name', 'num_buildings', 'buildings'];

// ---------------------------------------------------------------------------
// UNIT (scenario map units)
// ---------------------------------------------------------------------------

function parseUNIT(data, io) {
  let off = 0;
  const name = readStr(data, off, 32); off += 32;
  const ownerType = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const experienceLevel = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const owner = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const pRTONumber = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const AIStrategy = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const x = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const y = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  // PTW+: customName(57 bytes) + useCivilizationKing(4)
  let customName = '';
  let useCivilizationKing = 0;
  if (io.isPTWPlus && off + 57 <= data.length) {
    customName = readStr(data, off, 57); off += 57;
    if (off + 4 <= data.length) { useCivilizationKing = data.readInt32LE(off); off += 4; }
  }
  return { name, ownerType, experienceLevel, owner, pRTONumber, AIStrategy, x, y, customName, useCivilizationKing };
}

function serializeUNIT(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 32);
  w.writeInt(rec.ownerType | 0);
  w.writeInt(rec.experienceLevel | 0);
  w.writeInt(rec.owner | 0);
  w.writeInt(rec.pRTONumber | 0);
  w.writeInt(rec.AIStrategy | 0);
  w.writeInt(rec.x | 0);
  w.writeInt(rec.y | 0);
  if (io.isPTWPlus) {
    writeStr(w, rec.customName, 57);
    w.writeInt(rec.useCivilizationKing | 0);
  }
  return w.toBuffer();
}

function toEnglishUNIT(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['ownerType', String(rec.ownerType | 0)],
    ['owner', String(rec.owner | 0)],
    ['pRTONumber', String(rec.pRTONumber | 0)],
    ['AIStrategy', String(rec.AIStrategy | 0)],
    ['experienceLevel', String(rec.experienceLevel | 0)],
    ['x', String(rec.x | 0)],
    ['y', String(rec.y | 0)],
    io.isPTWPlus ? ['customName', rec.customName || ''] : null,
    io.isPTWPlus ? ['useCivilizationKing', String(rec.useCivilizationKing | 0)] : null,
  ]);
}

const WRITABLE_UNIT = ['name', 'owner_type', 'owner', 'p_r_t_o_number', 'a_i_strategy', 'experience_level', 'x', 'y', 'custom_name', 'use_civilization_king'];

// ---------------------------------------------------------------------------
// GAME (Scenario Properties) - partial: key fields only, rest stored raw
// ---------------------------------------------------------------------------

function parseGAME(data, io) {
  let off = 0;
  const useDefaultRules = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const defaultVictoryConditions = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numPlayableCivs = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const playableCivIds = [];
  for (let i = 0; i < numPlayableCivs && off + 4 <= data.length; i++) {
    playableCivIds.push(data.readInt32LE(off)); off += 4;
  }
  const victoryConditionsAndRules = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  // Remaining data is complex; store as raw
  const _tail = off < data.length ? Buffer.from(data.subarray(off)) : Buffer.alloc(0);
  return { useDefaultRules, defaultVictoryConditions, numPlayableCivs, playableCivIds, victoryConditionsAndRules, _tail };
}

function serializeGAME(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.useDefaultRules | 0);
  w.writeInt(rec.defaultVictoryConditions | 0);
  const civIds = Array.isArray(rec.playableCivIds) ? rec.playableCivIds : [];
  w.writeInt(civIds.length);
  for (const id of civIds) w.writeInt(id | 0);
  w.writeInt(rec.victoryConditionsAndRules | 0);
  if (rec._tail && rec._tail.length > 0) w.writeBytes(rec._tail);
  return w.toBuffer();
}

function toEnglishGAME(rec, io) {
  const civIds = Array.isArray(rec.playableCivIds) ? rec.playableCivIds : [];
  const pairs = [
    ['useDefaultRules', String(rec.useDefaultRules | 0)],
    ['defaultVictoryConditions', String(rec.defaultVictoryConditions | 0)],
    ['number_of_playable_civs', String(civIds.length)],
    ...civIds.map((id, i) => [`playable_civ_${i}`, String(id | 0)]),
    ['victoryConditionsAndRules', String(rec.victoryConditionsAndRules | 0)],
  ];
  // Parse known fields from tail
  const tail = rec._tail || Buffer.alloc(0);
  let off = 0;
  // Skip: placeCaptureUnits, autoPlaceKings, autoPlaceVictoryLocations, debugMode,
  //        useTimeLimit, baseTimeUnit, startMonth, startWeek, startYear,
  //        minuteTimeLimit, turnTimeLimit = 11 × int32 = 44 bytes
  const FIXED_TAIL_SCALARS = ['placeCaptureUnits', 'autoPlaceKings', 'autoPlaceVictoryLocations',
    'debugMode', 'useTimeLimit', 'baseTimeUnit', 'startMonth', 'startWeek', 'startYear',
    'minuteTimeLimit', 'turnTimeLimit'];
  for (const sn of FIXED_TAIL_SCALARS) {
    if (off + 4 > tail.length) break;
    pairs.push([sn, String(tail.readInt32LE(off))]);
    off += 4;
  }
  // 7 turns per timescale
  if (off + 28 <= tail.length) {
    const turnsPerScale = [];
    for (let i = 0; i < 7; i++) { turnsPerScale.push(tail.readInt32LE(off)); off += 4; }
    pairs.push(['turns_per_timescale_part', turnsPerScale.join(', ')]);
  }
  // 7 time units per turn
  if (off + 28 <= tail.length) {
    const timeUnitsPerTurn = [];
    for (let i = 0; i < 7; i++) { timeUnitsPerTurn.push(tail.readInt32LE(off)); off += 4; }
    pairs.push(['time_units_per_turn', timeUnitsPerTurn.join(', ')]);
  }
  // 5200 bytes scenario search folders
  if (off + 5200 <= tail.length) {
    let end = off;
    while (end < off + 5200 && tail[end] !== 0) end++;
    const folders = tail.subarray(off, end).toString('latin1');
    pairs.push(['scenarioSearchFolders', folders || '(none)']);
  } else {
    pairs.push(['scenarioSearchFolders', '(truncated)']);
  }
  return lines(pairs);
}

// GAME scenario search folders: read-only (not in writable keys)
const WRITABLE_GAME = ['use_default_rules', 'default_victory_conditions', 'victory_conditions_and_rules', 'place_capture_units', 'auto_place_kings', 'debug_mode', 'use_time_limit', 'start_month', 'start_week', 'start_year'];

// ---------------------------------------------------------------------------
// TILE - fixed-size, surgical edits via raw buffer
// ---------------------------------------------------------------------------

// Tile record body layout (Conquests, 45 bytes after 4-byte dataLen):
const TILE_FIELDS = [
  { name: 'riverConnectionInfo', off: 0, size: 1, type: 'uint8' },
  { name: 'border',              off: 1, size: 1, type: 'uint8' },
  { name: 'resource',            off: 2, size: 4, type: 'int32' },
  { name: 'image',               off: 6, size: 1, type: 'uint8' },
  { name: 'file',                off: 7, size: 1, type: 'uint8' },
  { name: 'questionMark',        off: 8, size: 2, type: 'int16' },
  { name: 'overlays',            off: 10, size: 1, type: 'uint8' },
  { name: 'baseRealTerrain',     off: 11, size: 1, type: 'uint8' },
  { name: 'bonuses',             off: 12, size: 1, type: 'uint8' },
  { name: 'riverCrossingData',   off: 13, size: 1, type: 'uint8' },
  { name: 'barbarianTribe',      off: 14, size: 2, type: 'int16' },
  { name: 'city',                off: 16, size: 2, type: 'int16' },
  { name: 'colony',              off: 18, size: 2, type: 'int16' },
  { name: 'continent',           off: 20, size: 2, type: 'int16' },
  { name: 'qm2',                 off: 22, size: 1, type: 'uint8' },
  { name: 'victoryPointLocation',off: 23, size: 2, type: 'int16' },
  { name: 'ruin',                off: 25, size: 4, type: 'int32' },
  { name: 'c3cOverlays',         off: 29, size: 4, type: 'int32' },
  { name: 'qm3',                 off: 33, size: 1, type: 'uint8' },
  { name: 'c3cBaseRealTerrain',  off: 34, size: 1, type: 'uint8' },
  { name: 'qm4',                 off: 35, size: 2, type: 'int16' },
  { name: 'fogOfWar',            off: 37, size: 2, type: 'int16' },
  { name: 'c3cBonuses',          off: 39, size: 4, type: 'int32' },
  { name: 'qm5',                 off: 43, size: 2, type: 'int16' },
];

const TILE_FIELD_MAP = new Map(TILE_FIELDS.map((f) => [f.name.toLowerCase(), f]));

function parseTILE(rawRecord, tileIndex, io) {
  // rawRecord includes 4-byte dataLen prefix
  const body = rawRecord.subarray(4);
  const fields = {};
  for (const fd of TILE_FIELDS) {
    if (fd.off >= body.length) continue;
    switch (fd.type) {
      case 'uint8': fields[fd.name] = body[fd.off]; break;
      case 'uint16': fields[fd.name] = body.readUInt16LE(fd.off); break;
      case 'int16': fields[fd.name] = body.readInt16LE(fd.off); break;
      case 'int32': fields[fd.name] = body.readInt32LE(fd.off); break;
      default: fields[fd.name] = body[fd.off];
    }
  }
  // Compute xpos/ypos from tileIndex + mapWidth
  let xPos = 0, yPos = 0;
  const half = Math.floor(io.mapWidth / 2);
  if (half > 0) {
    yPos = Math.floor(tileIndex / half);
    xPos = (tileIndex % half) * 2;
    if ((yPos & 1) === 1) xPos += 1;
  }
  return { ...fields, xpos: xPos, ypos: yPos, _rawRecord: Buffer.from(rawRecord) };
}

function serializeTILE(rec) {
  // Always return raw record (we do surgical edits in-place)
  return Buffer.from(rec._rawRecord);
}

function toEnglishTILE(rec, io) {
  const pairs = [
    ['xpos', String(rec.xpos | 0)],
    ['ypos', String(rec.ypos | 0)],
  ];
  for (const fd of TILE_FIELDS) {
    const v = rec[fd.name];
    if (v != null) pairs.push([fd.name, String(v)]);
  }
  return lines(pairs);
}

const WRITABLE_TILE = ['base_real_terrain', 'c3c_base_real_terrain', 'overlays', 'c3c_overlays', 'resource', 'bonuses', 'c3c_bonuses', 'fog_of_war', 'city', 'colony', 'river_crossing_data', 'river_connection_info', 'border', 'ruin', 'victory_point_location', 'barbarian_tribe', 'image', 'file'];

// ---------------------------------------------------------------------------
// CTZN (Citizen Types)
// ---------------------------------------------------------------------------

function parseCTZN(data, io) {
  let off = 0;
  const defaultCitizen = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const name = readStr(data, off, 32); off += 32;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const pluralName = readStr(data, off, 32); off += 32;
  const prerequisite = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const luxuries = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const research = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const taxes = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  let corruption = 0, construction = 0;
  if (io.isConquests && off + 8 <= data.length) {
    corruption = data.readInt32LE(off); off += 4;
    construction = data.readInt32LE(off); off += 4;
  }
  return { defaultCitizen, name, civilopediaEntry, pluralName, prerequisite, luxuries, research, taxes, corruption, construction };
}

function serializeCTZN(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.defaultCitizen | 0);
  writeStr(w, rec.name, 32);
  writeStr(w, rec.civilopediaEntry, 32);
  writeStr(w, rec.pluralName, 32);
  w.writeInt(rec.prerequisite | 0);
  w.writeInt(rec.luxuries | 0);
  w.writeInt(rec.research | 0);
  w.writeInt(rec.taxes | 0);
  if (io.isConquests) {
    w.writeInt(rec.corruption | 0);
    w.writeInt(rec.construction | 0);
  }
  return w.toBuffer();
}

function toEnglishCTZN(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['pluralName', rec.pluralName || ''],
    ['defaultCitizen', String(rec.defaultCitizen | 0)],
    ['prerequisite', String(rec.prerequisite | 0)],
    ['luxuries', String(rec.luxuries | 0)],
    ['research', String(rec.research | 0)],
    ['taxes', String(rec.taxes | 0)],
    io.isConquests ? ['corruption', String(rec.corruption | 0)] : null,
    io.isConquests ? ['construction', String(rec.construction | 0)] : null,
  ]);
}

const WRITABLE_CTZN = ['name', 'plural_name', 'default_citizen', 'prerequisite', 'luxuries', 'research', 'taxes', 'corruption', 'construction'];

// ---------------------------------------------------------------------------
// CULT (Culture Groups)
// ---------------------------------------------------------------------------

function parseCULT(data, io) {
  let off = 0;
  const name = readStr(data, off, 64); off += 64;
  const propagandaSuccess = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const cultRatioPercent = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const ratioDenominator = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const ratioNumerator = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const initResistanceChance = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const continuedResistanceChance = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  return { name, propagandaSuccess, cultRatioPercent, ratioDenominator, ratioNumerator, initResistanceChance, continuedResistanceChance };
}

function serializeCULT(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 64);
  w.writeInt(rec.propagandaSuccess | 0);
  w.writeInt(rec.cultRatioPercent | 0);
  w.writeInt(rec.ratioDenominator | 0);
  w.writeInt(rec.ratioNumerator | 0);
  w.writeInt(rec.initResistanceChance | 0);
  w.writeInt(rec.continuedResistanceChance | 0);
  return w.toBuffer();
}

function toEnglishCULT(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['propagandaSuccess', String(rec.propagandaSuccess | 0)],
    ['cultRatioPercent', String(rec.cultRatioPercent | 0)],
    ['ratioDenominator', String(rec.ratioDenominator | 0)],
    ['ratioNumerator', String(rec.ratioNumerator | 0)],
    ['initResistanceChance', String(rec.initResistanceChance | 0)],
    ['continuedResistanceChance', String(rec.continuedResistanceChance | 0)],
  ]);
}

const WRITABLE_CULT = ['name', 'propaganda_success', 'cult_ratio_percent', 'ratio_denominator', 'ratio_numerator', 'init_resistance_chance', 'continued_resistance_chance'];

// ---------------------------------------------------------------------------
// DIFF (Difficulty Levels)
// ---------------------------------------------------------------------------

const DIFF_SCALAR_NAMES = [
  'contentCitizens', 'maxGovtTransition', 'AIDefenceStart', 'AIOffenceStart',
  'extraStart1', 'extraStart2', 'additionalFreeSupport', 'bonusPerCity',
  'attackBarbariansBonus', 'costFactor', 'percentOptimal', 'AIAITrade',
  'corruptionPercent', 'militaryLaw'
];

function parseDIFF(data, io) {
  let off = 0;
  const name = readStr(data, off, 64); off += 64;
  const scalars = {};
  for (const sn of DIFF_SCALAR_NAMES) {
    scalars[sn] = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  }
  return { name, ...scalars };
}

function serializeDIFF(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 64);
  for (const sn of DIFF_SCALAR_NAMES) w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
  return w.toBuffer();
}

function toEnglishDIFF(rec, io) {
  const pairs = [['name', rec.name || '']];
  for (const sn of DIFF_SCALAR_NAMES) pairs.push([sn, String((rec[sn] != null ? rec[sn] : 0) | 0)]);
  return lines(pairs);
}

const WRITABLE_DIFF = ['name', 'content_citizens', 'max_govt_transition', 'a_i_defence_start', 'a_i_offence_start', 'extra_start1', 'extra_start2', 'additional_free_support', 'bonus_per_city', 'attack_barbarians_bonus', 'cost_factor', 'percent_optimal', 'a_i_a_i_trade', 'corruption_percent', 'military_law'];

// ---------------------------------------------------------------------------
// ERAS (Historical Eras)
// ---------------------------------------------------------------------------

function parseERAS(data, io) {
  let off = 0;
  const eraName = readStr(data, off, 64); off += 64;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const researchers = [];
  for (let i = 0; i < 5 && off + 32 <= data.length; i++) {
    researchers.push(readStr(data, off, 32)); off += 32;
  }
  const usedResearcherNames = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  let questionMark = 0;
  if (io.isConquests && off + 4 <= data.length) {
    questionMark = data.readInt32LE(off); off += 4;
  }
  return { name: eraName, eraName, civilopediaEntry, researchers, usedResearcherNames, questionMark };
}

function serializeERAS(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.eraName || rec.name, 64);
  writeStr(w, rec.civilopediaEntry, 32);
  const researchers = Array.isArray(rec.researchers) ? rec.researchers : [];
  for (let i = 0; i < 5; i++) writeStr(w, researchers[i] || '', 32);
  w.writeInt(rec.usedResearcherNames | 0);
  if (io.isConquests) w.writeInt(rec.questionMark | 0);
  return w.toBuffer();
}

function toEnglishERAS(rec, io) {
  const pairs = [
    ['name', rec.eraName || rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
  ];
  const researchers = Array.isArray(rec.researchers) ? rec.researchers : [];
  for (let i = 0; i < 5; i++) pairs.push([`researcher${i + 1}`, researchers[i] || '']);
  pairs.push(['usedResearcherNames', String(rec.usedResearcherNames | 0)]);
  if (io.isConquests) pairs.push(['questionMark', String(rec.questionMark | 0)]);
  return lines(pairs);
}

const WRITABLE_ERAS = ['name', 'used_researcher_names'];

// ---------------------------------------------------------------------------
// ESPN (Espionage Missions)
// ---------------------------------------------------------------------------

function parseESPN(data, io) {
  let off = 0;
  const description = readStr(data, off, 128); off += 128;
  const name = readStr(data, off, 64); off += 64;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const missionPerformedBy = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  let baseCost = 0;
  if (off + 4 <= data.length) { baseCost = data.readInt32LE(off); off += 4; }
  return { description, name, civilopediaEntry, missionPerformedBy, baseCost };
}

function serializeESPN(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.description, 128);
  writeStr(w, rec.name, 64);
  writeStr(w, rec.civilopediaEntry, 32);
  w.writeInt(rec.missionPerformedBy | 0);
  w.writeInt(rec.baseCost | 0);
  return w.toBuffer();
}

function toEnglishESPN(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['description', rec.description || ''],
    ['missionPerformedBy', String(rec.missionPerformedBy | 0)],
    ['baseCost', String(rec.baseCost | 0)],
  ]);
}

const WRITABLE_ESPN = ['name', 'description', 'mission_performed_by', 'base_cost'];

// ---------------------------------------------------------------------------
// EXPR (Experience Levels)
// ---------------------------------------------------------------------------

function parseEXPR(data, io) {
  let off = 0;
  const name = readStr(data, off, 32); off += 32;
  const baseHitPoints = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  let retreatBonus = 0;
  if (off + 4 <= data.length) { retreatBonus = data.readInt32LE(off); off += 4; }
  return { name, baseHitPoints, retreatBonus };
}

function serializeEXPR(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 32);
  w.writeInt(rec.baseHitPoints | 0);
  w.writeInt(rec.retreatBonus | 0);
  return w.toBuffer();
}

function toEnglishEXPR(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['baseHitPoints', String(rec.baseHitPoints | 0)],
    ['retreatBonus', String(rec.retreatBonus | 0)],
  ]);
}

const WRITABLE_EXPR = ['name', 'base_hit_points', 'retreat_bonus'];

// ---------------------------------------------------------------------------
// TFRM (Terrain Transformations)
// ---------------------------------------------------------------------------

function parseTFRM(data, io) {
  let off = 0;
  const name = readStr(data, off, 32); off += 32;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const turnsToComplete = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const requiredAdvance = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const requiredResource1 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const requiredResource2 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const order = readStr(data, off, 32); off += 32;
  return { name, civilopediaEntry, turnsToComplete, requiredAdvance, requiredResource1, requiredResource2, order };
}

function serializeTFRM(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.name, 32);
  writeStr(w, rec.civilopediaEntry, 32);
  w.writeInt(rec.turnsToComplete | 0);
  w.writeInt(rec.requiredAdvance | 0);
  w.writeInt(rec.requiredResource1 | 0);
  w.writeInt(rec.requiredResource2 | 0);
  writeStr(w, rec.order, 32);
  return w.toBuffer();
}

function toEnglishTFRM(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['turnsToComplete', String(rec.turnsToComplete | 0)],
    ['requiredAdvance', String(rec.requiredAdvance | 0)],
    ['requiredResource1', String(rec.requiredResource1 | 0)],
    ['requiredResource2', String(rec.requiredResource2 | 0)],
    ['order', rec.order || ''],
  ]);
}

const WRITABLE_TFRM = ['name', 'turns_to_complete', 'required_advance', 'required_resource1', 'required_resource2', 'order'];

// ---------------------------------------------------------------------------
// WSIZ (World Sizes)
// ---------------------------------------------------------------------------

function parseWSIZ(data, io) {
  let off = 0;
  const optimalNumberOfCities = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const techRate = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  // 24 bytes padding/empty
  off += 24;
  const name = readStr(data, off, 32); off += 32;
  const height = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const distanceBetweenCivs = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numberOfCivs = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const width = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  return { name, optimalNumberOfCities, techRate, height, distanceBetweenCivs, numberOfCivs, width };
}

function serializeWSIZ(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.optimalNumberOfCities | 0);
  w.writeInt(rec.techRate | 0);
  w.writeBytes(Buffer.alloc(24));
  writeStr(w, rec.name, 32);
  w.writeInt(rec.height | 0);
  w.writeInt(rec.distanceBetweenCivs | 0);
  w.writeInt(rec.numberOfCivs | 0);
  w.writeInt(rec.width | 0);
  return w.toBuffer();
}

function toEnglishWSIZ(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['optimalNumberOfCities', String(rec.optimalNumberOfCities | 0)],
    ['techRate', String(rec.techRate | 0)],
    ['height', String(rec.height | 0)],
    ['distanceBetweenCivs', String(rec.distanceBetweenCivs | 0)],
    ['numberOfCivs', String(rec.numberOfCivs | 0)],
    ['width', String(rec.width | 0)],
  ]);
}

const WRITABLE_WSIZ = ['name', 'optimal_number_of_cities', 'tech_rate', 'height', 'distance_between_civs', 'number_of_civs', 'width'];

// ---------------------------------------------------------------------------
// WCHR (World Parameters)
// ---------------------------------------------------------------------------

function parseWCHR(data, io) {
  let off = 0;
  const selectedClimate = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const actualClimate = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const selectedBarbarian = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const actualBarbarian = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const selectedLandform = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const actualLandform = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const selectedOcean = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const actualOcean = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const selectedTemp = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const actualTemp = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const selectedAge = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const actualAge = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const worldSize = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  return {
    name: 'World Parameters',
    selectedClimate, actualClimate, selectedBarbarian, actualBarbarian,
    selectedLandform, actualLandform, selectedOcean, actualOcean,
    selectedTemp, actualTemp, selectedAge, actualAge, worldSize
  };
}

function serializeWCHR(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.selectedClimate | 0);
  w.writeInt(rec.actualClimate | 0);
  w.writeInt(rec.selectedBarbarian | 0);
  w.writeInt(rec.actualBarbarian | 0);
  w.writeInt(rec.selectedLandform | 0);
  w.writeInt(rec.actualLandform | 0);
  w.writeInt(rec.selectedOcean | 0);
  w.writeInt(rec.actualOcean | 0);
  w.writeInt(rec.selectedTemp | 0);
  w.writeInt(rec.actualTemp | 0);
  w.writeInt(rec.selectedAge | 0);
  w.writeInt(rec.actualAge | 0);
  w.writeInt(rec.worldSize | 0);
  return w.toBuffer();
}

function toEnglishWCHR(rec, io) {
  return lines([
    ['name', 'World Parameters'],
    ['selectedClimate', String(rec.selectedClimate | 0)],
    ['actualClimate', String(rec.actualClimate | 0)],
    ['selectedBarbarian', String(rec.selectedBarbarian | 0)],
    ['actualBarbarian', String(rec.actualBarbarian | 0)],
    ['selectedLandform', String(rec.selectedLandform | 0)],
    ['actualLandform', String(rec.actualLandform | 0)],
    ['selectedOcean', String(rec.selectedOcean | 0)],
    ['actualOcean', String(rec.actualOcean | 0)],
    ['selectedTemp', String(rec.selectedTemp | 0)],
    ['actualTemp', String(rec.actualTemp | 0)],
    ['selectedAge', String(rec.selectedAge | 0)],
    ['actualAge', String(rec.actualAge | 0)],
    ['worldSize', String(rec.worldSize | 0)],
  ]);
}

const WRITABLE_WCHR = ['selected_climate', 'selected_barbarian', 'selected_landform', 'selected_ocean', 'selected_temp', 'selected_age', 'world_size'];

// ---------------------------------------------------------------------------
// WMAP (World Map)
// ---------------------------------------------------------------------------

function parseWMAP(data, io) {
  let off = 0;
  const numResources = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const resourceOccurrences = [];
  for (let i = 0; i < numResources && off + 4 <= data.length; i++) {
    resourceOccurrences.push(data.readInt32LE(off)); off += 4;
  }
  const numContinents = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const height = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const distanceBetweenCivs = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numCivs = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const qm1 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const qm2 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const width = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const qm3 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  // 124 unknown bytes
  const unknownBytes = off + 124 <= data.length ? Buffer.from(data.subarray(off, off + 124)) : Buffer.alloc(0);
  off += Math.min(124, data.length - off);
  const mapSeed = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const flags = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const _tail = off < data.length ? Buffer.from(data.subarray(off)) : Buffer.alloc(0);
  return {
    name: 'World Map',
    numResources, resourceOccurrences, numContinents, height, distanceBetweenCivs,
    numCivs, qm1, qm2, width, qm3, unknownBytes, mapSeed, flags, _tail
  };
}

function serializeWMAP(rec, io) {
  const w = new BiqWriter();
  const resOcc = Array.isArray(rec.resourceOccurrences) ? rec.resourceOccurrences : [];
  w.writeInt(resOcc.length);
  for (const v of resOcc) w.writeInt(v | 0);
  w.writeInt(rec.numContinents | 0);
  w.writeInt(rec.height | 0);
  w.writeInt(rec.distanceBetweenCivs | 0);
  w.writeInt(rec.numCivs | 0);
  w.writeInt(rec.qm1 | 0);
  w.writeInt(rec.qm2 | 0);
  w.writeInt(rec.width | 0);
  w.writeInt(rec.qm3 | 0);
  const unk = Buffer.isBuffer(rec.unknownBytes) ? rec.unknownBytes : Buffer.alloc(124);
  const padded = Buffer.alloc(124);
  unk.copy(padded, 0, 0, Math.min(unk.length, 124));
  w.writeBytes(padded);
  w.writeInt(rec.mapSeed | 0);
  w.writeInt(rec.flags | 0);
  if (rec._tail && rec._tail.length > 0) w.writeBytes(rec._tail);
  return w.toBuffer();
}

function toEnglishWMAP(rec, io) {
  const resOcc = Array.isArray(rec.resourceOccurrences) ? rec.resourceOccurrences : [];
  const pairs = [
    ['name', 'World Map'],
    ['width', String(rec.width | 0)],
    ['height', String(rec.height | 0)],
    ['numContinents', String(rec.numContinents | 0)],
    ['numCivs', String(rec.numCivs | 0)],
    ['distanceBetweenCivs', String(rec.distanceBetweenCivs | 0)],
    ['mapSeed', String(rec.mapSeed | 0)],
    ['flags', String(rec.flags | 0)],
    ['numResources', String(resOcc.length)],
  ];
  resOcc.forEach((v, i) => pairs.push([`resource_occurrence_${i}`, String(v | 0)]));
  return lines(pairs);
}

const WRITABLE_WMAP = ['width', 'height', 'num_continents', 'num_civs', 'distance_between_civs', 'map_seed', 'flags'];

// ---------------------------------------------------------------------------
// TERR (Terrain Types)
// ---------------------------------------------------------------------------

function parseTERR(data, io) {
  let off = 0;
  const numTotalResources = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const maskLen = Math.ceil(numTotalResources / 8);
  const possibleResources = off + maskLen <= data.length
    ? Buffer.from(data.subarray(off, off + maskLen))
    : Buffer.alloc(maskLen);
  off += maskLen;
  const name = readStr(data, off, 32); off += 32;
  const civilopediaEntry = readStr(data, off, 32); off += 32;
  const terrScalars = ['foodBonus', 'shieldsBonus', 'commerceBonus', 'defenceBonus', 'movementCost',
    'food', 'shields', 'commerce', 'workerJob', 'pollutionEffect'];
  const scalars = {};
  for (const sn of terrScalars) {
    scalars[sn] = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  }
  const allowCities = off < data.length ? data[off] : 0; off++;
  const allowColonies = off < data.length ? data[off] : 0; off++;
  const impassable = off < data.length ? data[off] : 0; off++;
  const impassableByWheeled = off < data.length ? data[off] : 0; off++;
  const allowAirfields = off < data.length ? data[off] : 0; off++;
  const allowForts = off < data.length ? data[off] : 0; off++;
  const allowOutposts = off < data.length ? data[off] : 0; off++;
  const allowRadarTowers = off < data.length ? data[off] : 0; off++;

  let questionMark = 0, landmarkEnabled = 0, landmarkQm = 0, questionMark2 = 0, terrainFlags = 0, diseaseStrength = 0;
  let landmarkName = '', landmarkCivilopediaEntry = '';
  const landmarkScalars = { landmarkFood: 0, landmarkShields: 0, landmarkCommerce: 0, landmarkFoodBonus: 0, landmarkShieldsBonus: 0, landmarkCommerceBonus: 0, landmarkMovementCost: 0, landmarkDefenceBonus: 0 };

  if (io.isConquests && off + 4 <= data.length) {
    questionMark = data.readInt32LE(off); off += 4;
    if (off < data.length) { landmarkEnabled = data[off]; off++; }
    for (const k of Object.keys(landmarkScalars)) {
      landmarkScalars[k] = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
    }
    landmarkQm = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
    landmarkName = readStr(data, off, 32); off += 32;
    landmarkCivilopediaEntry = readStr(data, off, 32); off += 32;
    questionMark2 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
    terrainFlags = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
    diseaseStrength = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  }
  const _tail = off < data.length ? Buffer.from(data.subarray(off)) : Buffer.alloc(0);

  return {
    name, civilopediaEntry, numTotalResources, possibleResources,
    ...scalars,
    allowCities, allowColonies, impassable, impassableByWheeled,
    allowAirfields, allowForts, allowOutposts, allowRadarTowers,
    questionMark, landmarkEnabled, ...landmarkScalars,
    landmarkQm, landmarkName, landmarkCivilopediaEntry,
    questionMark2, terrainFlags, diseaseStrength, _tail
  };
}

function serializeTERR(rec, io) {
  const w = new BiqWriter();
  const resOcc = Array.isArray(rec.resourceOccurrences) ? rec.resourceOccurrences : [];
  const numTotalResources = rec.numTotalResources != null ? (rec.numTotalResources | 0) : resOcc.length;
  w.writeInt(numTotalResources);
  const maskLen = Math.ceil(numTotalResources / 8);
  const mask = Buffer.isBuffer(rec.possibleResources) ? rec.possibleResources : Buffer.alloc(maskLen);
  const padMask = Buffer.alloc(maskLen);
  mask.copy(padMask, 0, 0, Math.min(mask.length, maskLen));
  w.writeBytes(padMask);
  writeStr(w, rec.name, 32);
  writeStr(w, rec.civilopediaEntry, 32);
  const terrScalars = ['foodBonus', 'shieldsBonus', 'commerceBonus', 'defenceBonus', 'movementCost',
    'food', 'shields', 'commerce', 'workerJob', 'pollutionEffect'];
  for (const sn of terrScalars) w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
  w.writeByte((rec.allowCities != null ? rec.allowCities : 0) & 0xff);
  w.writeByte((rec.allowColonies != null ? rec.allowColonies : 0) & 0xff);
  w.writeByte((rec.impassable != null ? rec.impassable : 0) & 0xff);
  w.writeByte((rec.impassableByWheeled != null ? rec.impassableByWheeled : 0) & 0xff);
  w.writeByte((rec.allowAirfields != null ? rec.allowAirfields : 0) & 0xff);
  w.writeByte((rec.allowForts != null ? rec.allowForts : 0) & 0xff);
  w.writeByte((rec.allowOutposts != null ? rec.allowOutposts : 0) & 0xff);
  w.writeByte((rec.allowRadarTowers != null ? rec.allowRadarTowers : 0) & 0xff);
  if (io.isConquests) {
    w.writeInt(rec.questionMark | 0);
    w.writeByte((rec.landmarkEnabled != null ? rec.landmarkEnabled : 0) & 0xff);
    const landmarkScalarNames = ['landmarkFood', 'landmarkShields', 'landmarkCommerce', 'landmarkFoodBonus', 'landmarkShieldsBonus', 'landmarkCommerceBonus', 'landmarkMovementCost', 'landmarkDefenceBonus'];
    for (const sn of landmarkScalarNames) w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
    w.writeInt(rec.landmarkQm | 0);
    writeStr(w, rec.landmarkName, 32);
    writeStr(w, rec.landmarkCivilopediaEntry, 32);
    w.writeInt(rec.questionMark2 | 0);
    w.writeInt(rec.terrainFlags | 0);
    w.writeInt(rec.diseaseStrength | 0);
  }
  if (rec._tail && rec._tail.length > 0) w.writeBytes(rec._tail);
  return w.toBuffer();
}

function toEnglishTERR(rec, io) {
  const pairs = [
    ['name', rec.name || ''],
    ['civilopediaEntry', rec.civilopediaEntry || ''],
    ['foodBonus', String(rec.foodBonus | 0)],
    ['shieldsBonus', String(rec.shieldsBonus | 0)],
    ['commerceBonus', String(rec.commerceBonus | 0)],
    ['defenceBonus', String(rec.defenceBonus | 0)],
    ['movementCost', String(rec.movementCost | 0)],
    ['food', String(rec.food | 0)],
    ['shields', String(rec.shields | 0)],
    ['commerce', String(rec.commerce | 0)],
    ['workerJob', String(rec.workerJob | 0)],
    ['pollutionEffect', String(rec.pollutionEffect | 0)],
    ['allowCities', String(rec.allowCities | 0)],
    ['allowColonies', String(rec.allowColonies | 0)],
    ['impassable', String(rec.impassable | 0)],
    ['impassableByWheeled', String(rec.impassableByWheeled | 0)],
    ['allowAirfields', String(rec.allowAirfields | 0)],
    ['allowForts', String(rec.allowForts | 0)],
    ['allowOutposts', String(rec.allowOutposts | 0)],
    ['allowRadarTowers', String(rec.allowRadarTowers | 0)],
  ];
  if (io.isConquests) {
    pairs.push(['landmarkEnabled', String(rec.landmarkEnabled | 0)]);
    pairs.push(['landmarkFood', String(rec.landmarkFood | 0)]);
    pairs.push(['landmarkShields', String(rec.landmarkShields | 0)]);
    pairs.push(['landmarkCommerce', String(rec.landmarkCommerce | 0)]);
    pairs.push(['landmarkFoodBonus', String(rec.landmarkFoodBonus | 0)]);
    pairs.push(['landmarkShieldsBonus', String(rec.landmarkShieldsBonus | 0)]);
    pairs.push(['landmarkCommerceBonus', String(rec.landmarkCommerceBonus | 0)]);
    pairs.push(['landmarkMovementCost', String(rec.landmarkMovementCost | 0)]);
    pairs.push(['landmarkDefenceBonus', String(rec.landmarkDefenceBonus | 0)]);
    pairs.push(['landmarkName', rec.landmarkName || '']);
    pairs.push(['landmarkCivilopediaEntry', rec.landmarkCivilopediaEntry || '']);
    pairs.push(['terrainFlags', String(rec.terrainFlags | 0)]);
    pairs.push(['diseaseStrength', String(rec.diseaseStrength | 0)]);
  }
  return lines(pairs);
}

const WRITABLE_TERR = ['food_bonus', 'shields_bonus', 'commerce_bonus', 'defence_bonus', 'movement_cost', 'food', 'shields', 'commerce', 'worker_job', 'pollution_effect', 'allow_cities', 'allow_colonies', 'impassable', 'impassable_by_wheeled', 'allow_airfields', 'allow_forts', 'allow_outposts', 'allow_radar_towers', 'landmark_enabled', 'landmark_food', 'landmark_shields', 'landmark_commerce', 'landmark_food_bonus', 'landmark_shields_bonus', 'landmark_commerce_bonus', 'landmark_movement_cost', 'landmark_defence_bonus', 'landmark_name', 'terrain_flags', 'disease_strength'];

// ---------------------------------------------------------------------------
// RULE (Game Rules) - partial: parse what we can, store tail
// ---------------------------------------------------------------------------

const RULE_SCALAR_NAMES = [
  'advancedBarbarian', 'basicBarbarian', 'barbarianSeaUnit', 'citiesForArmy', 'chanceOfRioting',
  'draftTurnPenalty', 'shieldCostInGold', 'fortressDefenceBonus', 'citizensAffectedByHappyFace',
  'questionMark1', 'questionMark2', 'forestValueInShields', 'shieldValueInGold', 'citizenValueInShields',
  'defaultDifficultyLevel', 'battleCreatedUnit', 'buildArmyUnit', 'buildingDefensiveBonus',
  'citizenDefensiveBonus', 'defaultMoneyResource', 'chanceToInterceptAirMissions',
  'chanceToInterceptStealthMissions', 'startingTreasury', 'questionMark3', 'foodConsumptionPerCitizen',
  'riverDefensiveBonus', 'turnPenaltyForWhip', 'scout', 'roadMovementRate', 'startUnit1', 'startUnit2',
  'WLTKDMinimumPop', 'townDefenceBonus', 'cityDefenceBonus', 'metropolisDefenceBonus',
  'maxCity1Size', 'maxCity2Size'
];

function parseRULE(data, io) {
  let off = 0;
  const townName = readStr(data, off, 32); off += 32;
  const cityName = readStr(data, off, 32); off += 32;
  const metropolisName = readStr(data, off, 32); off += 32;
  const numSSParts = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numberOfPartsRequired = [];
  for (let i = 0; i < numSSParts && off + 4 <= data.length; i++) {
    numberOfPartsRequired.push(data.readInt32LE(off)); off += 4;
  }
  const scalars = {};
  for (const sn of RULE_SCALAR_NAMES) {
    scalars[sn] = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  }
  const _tail = off < data.length ? Buffer.from(data.subarray(off)) : Buffer.alloc(0);
  return {
    name: 'Rules',
    townName, cityName, metropolisName,
    numSSParts, numberOfPartsRequired,
    ...scalars, _tail
  };
}

function serializeRULE(rec, io) {
  const w = new BiqWriter();
  writeStr(w, rec.townName, 32);
  writeStr(w, rec.cityName, 32);
  writeStr(w, rec.metropolisName, 32);
  const parts = Array.isArray(rec.numberOfPartsRequired) ? rec.numberOfPartsRequired : [];
  w.writeInt(parts.length);
  for (const p of parts) w.writeInt(p | 0);
  for (const sn of RULE_SCALAR_NAMES) w.writeInt((rec[sn] != null ? rec[sn] : 0) | 0);
  if (rec._tail && rec._tail.length > 0) w.writeBytes(rec._tail);
  return w.toBuffer();
}

function toEnglishRULE(rec, io) {
  const pairs = [
    ['name', 'Rules'],
    ['townName', rec.townName || ''],
    ['cityName', rec.cityName || ''],
    ['metropolisName', rec.metropolisName || ''],
    ['numSpaceshipParts', String(rec.numSSParts | 0)],
  ];
  (rec.numberOfPartsRequired || []).forEach((v, i) => {
    pairs.push([`number_of_parts_${i}_required`, String(v | 0)]);
  });
  for (const sn of RULE_SCALAR_NAMES) {
    pairs.push([sn, String((rec[sn] != null ? rec[sn] : 0) | 0)]);
  }
  return lines(pairs);
}

const WRITABLE_RULE = ['town_name', 'city_name', 'metropolis_name', 'advanced_barbarian', 'basic_barbarian', 'barbarian_sea_unit', 'cities_for_army', 'chance_of_rioting', 'draft_turn_penalty', 'shield_cost_in_gold', 'fortress_defence_bonus', 'citizens_affected_by_happy_face', 'forest_value_in_shields', 'shield_value_in_gold', 'citizen_value_in_shields', 'default_difficulty_level', 'battle_created_unit', 'build_army_unit', 'building_defensive_bonus', 'citizen_defensive_bonus', 'default_money_resource', 'chance_to_intercept_air_missions', 'chance_to_intercept_stealth_missions', 'starting_treasury', 'food_consumption_per_citizen', 'river_defensive_bonus', 'turn_penalty_for_whip', 'scout', 'road_movement_rate', 'start_unit1', 'start_unit2', 'w_l_t_k_d_minimum_pop', 'town_defence_bonus', 'city_defence_bonus', 'metropolis_defence_bonus', 'max_city1_size', 'max_city2_size'];

// ---------------------------------------------------------------------------
// LEAD (Scenario Leaders)
// ---------------------------------------------------------------------------

function parseLEAD(data, io) {
  let off = 0;
  const customCivData = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const humanPlayer = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const leaderName = readStr(data, off, 32); off += 32;
  const questionMark1 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const questionMark2 = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numStartUnits = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const startUnits = [];
  for (let i = 0; i < numStartUnits && off + 8 <= data.length; i++) {
    const startUnitCount = data.readInt32LE(off); off += 4;
    const startUnitIndex = data.readInt32LE(off); off += 4;
    startUnits.push({ startUnitCount, startUnitIndex });
  }
  const genderOfLeaderName = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numStartTechs = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const techIndices = [];
  for (let i = 0; i < numStartTechs && off + 4 <= data.length; i++) {
    techIndices.push(data.readInt32LE(off)); off += 4;
  }
  const difficulty = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const initialEra = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const startCash = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const government = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const civ = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const color = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  let skipFirstTurn = 0, questionMark3 = 0, startEmbassies = 0;
  if (io.isPTWPlus && off + 4 <= data.length) {
    skipFirstTurn = data.readInt32LE(off); off += 4;
    if (off + 4 <= data.length) { questionMark3 = data.readInt32LE(off); off += 4; }
    if (off < data.length) { startEmbassies = data[off]; off++; }
  }
  const _tail = off < data.length ? Buffer.from(data.subarray(off)) : Buffer.alloc(0);
  return {
    name: leaderName, leaderName, customCivData, humanPlayer,
    questionMark1, questionMark2, numStartUnits, startUnits,
    genderOfLeaderName, numStartTechs, techIndices,
    difficulty, initialEra, startCash, government, civ, color,
    skipFirstTurn, questionMark3, startEmbassies, _tail
  };
}

function serializeLEAD(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.customCivData | 0);
  w.writeInt(rec.humanPlayer | 0);
  writeStr(w, rec.leaderName || rec.name, 32);
  w.writeInt(rec.questionMark1 | 0);
  w.writeInt(rec.questionMark2 | 0);
  const startUnits = Array.isArray(rec.startUnits) ? rec.startUnits : [];
  w.writeInt(startUnits.length);
  for (const su of startUnits) {
    w.writeInt((su.startUnitCount != null ? su.startUnitCount : 0) | 0);
    w.writeInt((su.startUnitIndex != null ? su.startUnitIndex : 0) | 0);
  }
  w.writeInt(rec.genderOfLeaderName | 0);
  const techIndices = Array.isArray(rec.techIndices) ? rec.techIndices : [];
  w.writeInt(techIndices.length);
  for (const ti of techIndices) w.writeInt(ti | 0);
  w.writeInt(rec.difficulty | 0);
  w.writeInt(rec.initialEra | 0);
  w.writeInt(rec.startCash | 0);
  w.writeInt(rec.government | 0);
  w.writeInt(rec.civ | 0);
  w.writeInt(rec.color | 0);
  if (io.isPTWPlus) {
    w.writeInt(rec.skipFirstTurn | 0);
    w.writeInt(rec.questionMark3 | 0);
    w.writeByte((rec.startEmbassies != null ? rec.startEmbassies : 0) & 0xff);
  }
  if (rec._tail && rec._tail.length > 0) w.writeBytes(rec._tail);
  return w.toBuffer();
}

function toEnglishLEAD(rec, io) {
  const pairs = [
    ['name', rec.leaderName || rec.name || ''],
    ['humanPlayer', String(rec.humanPlayer | 0)],
    ['customCivData', String(rec.customCivData | 0)],
    ['civ', String(rec.civ | 0)],
    ['government', String(rec.government | 0)],
    ['initialEra', String(rec.initialEra | 0)],
    ['difficulty', String(rec.difficulty | 0)],
    ['startCash', String(rec.startCash | 0)],
    ['color', String(rec.color | 0)],
    ['genderOfLeaderName', String(rec.genderOfLeaderName | 0)],
  ];
  const startUnits = Array.isArray(rec.startUnits) ? rec.startUnits : [];
  pairs.push(['numberOfDifferentStartUnits', String(startUnits.length)]);
  startUnits.forEach((su) => {
    pairs.push([`starting_units_of_type_${su.startUnitIndex}`, String(su.startUnitCount | 0)]);
  });
  const techIndices = Array.isArray(rec.techIndices) ? rec.techIndices : [];
  pairs.push(['numberOfStartingTechnologies', String(techIndices.length)]);
  techIndices.forEach((idx, i) => {
    pairs.push([`starting_technology_${i}`, String(idx | 0)]);
  });
  if (io.isPTWPlus) {
    pairs.push(['skipFirstTurn', String(rec.skipFirstTurn | 0)]);
    pairs.push(['startEmbassies', String(rec.startEmbassies | 0)]);
  }
  return lines(pairs);
}

const WRITABLE_LEAD = ['name', 'human_player', 'custom_civ_data', 'civ', 'government', 'initial_era', 'difficulty', 'start_cash', 'color', 'gender_of_leader_name', 'skip_first_turn', 'start_embassies'];

// ---------------------------------------------------------------------------
// CONT (Continent data) - fixed-size 12
// ---------------------------------------------------------------------------

function parseCONT(data, io) {
  let off = 0;
  const continentClass = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const numTiles = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  return { continentClass, numTiles };
}

function serializeCONT(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.continentClass | 0);
  w.writeInt(rec.numTiles | 0);
  return w.toBuffer();
}

function toEnglishCONT(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['continentClass', String(rec.continentClass | 0)],
    ['numTiles', String(rec.numTiles | 0)],
  ]);
}

const WRITABLE_CONT = ['continent_class', 'num_tiles'];

// ---------------------------------------------------------------------------
// SLOC (Starting Locations) - fixed-size 20
// ---------------------------------------------------------------------------

function parseSLOC(data, io) {
  let off = 0;
  const ownerType = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const owner = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const x = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const y = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  return { ownerType, owner, x, y };
}

function serializeSLOC(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.ownerType | 0);
  w.writeInt(rec.owner | 0);
  w.writeInt(rec.x | 0);
  w.writeInt(rec.y | 0);
  return w.toBuffer();
}

function toEnglishSLOC(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['ownerType', String(rec.ownerType | 0)],
    ['owner', String(rec.owner | 0)],
    ['x', String(rec.x | 0)],
    ['y', String(rec.y | 0)],
  ]);
}

const WRITABLE_SLOC = ['owner_type', 'owner', 'x', 'y'];

// ---------------------------------------------------------------------------
// CLNY (Colonies) - fixed-size 20 (Conquests may have 24)
// ---------------------------------------------------------------------------

function parseCLNY(data, io) {
  let off = 0;
  const ownerType = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const owner = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const x = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  const y = off + 4 <= data.length ? data.readInt32LE(off) : 0; off += 4;
  let improvementType = 0;
  if (off + 4 <= data.length) { improvementType = data.readInt32LE(off); off += 4; }
  return { ownerType, owner, x, y, improvementType };
}

function serializeCLNY(rec, io) {
  const w = new BiqWriter();
  w.writeInt(rec.ownerType | 0);
  w.writeInt(rec.owner | 0);
  w.writeInt(rec.x | 0);
  w.writeInt(rec.y | 0);
  w.writeInt(rec.improvementType | 0);
  return w.toBuffer();
}

function toEnglishCLNY(rec, io) {
  return lines([
    ['name', rec.name || ''],
    ['ownerType', String(rec.ownerType | 0)],
    ['owner', String(rec.owner | 0)],
    ['x', String(rec.x | 0)],
    ['y', String(rec.y | 0)],
    ['improvementType', String(rec.improvementType | 0)],
  ]);
}

const WRITABLE_CLNY = ['owner_type', 'owner', 'x', 'y', 'improvement_type'];

// ---------------------------------------------------------------------------
// FLAV (Flavor Definitions) - special non-standard section structure
// Parsing is handled specially in parseAllSections; these helpers are for
// toEnglish and serialization of individual flavor records.
// ---------------------------------------------------------------------------

function toEnglishFLAV(rec, io) {
  const pairs = [
    ['name', rec.name || ''],
    ['questionMark', String(rec.questionMark | 0)],
  ];
  const relations = Array.isArray(rec.relations) ? rec.relations : [];
  for (let i = 0; i < relations.length; i++) {
    pairs.push([`relation_with_flavor_${i}`, String(relations[i] | 0)]);
  }
  return lines(pairs);
}

function serializeFLAVSection(section) {
  // Writes entire section: tag(4) + numGroups=1(4) + numFlavors(4) + all flavor records
  const w = new BiqWriter();
  w.writeTag('FLAV');
  w.writeInt(1); // numGroups
  const records = Array.isArray(section.records) ? section.records : [];
  w.writeInt(records.length); // numFlavors
  for (const rec of records) {
    w.writeInt(rec.questionMark | 0);
    writeStr(w, rec.name, 256);
    const relations = Array.isArray(rec.relations) ? rec.relations : [];
    w.writeInt(relations.length);
    for (const rv of relations) w.writeInt(rv | 0);
  }
  return w.toBuffer();
}

const WRITABLE_FLAV = ['name', 'question_mark'];

// ---------------------------------------------------------------------------
// Generic / pass-through sections
// ---------------------------------------------------------------------------

function parseGeneric(data) {
  const pairs = [['byteLength', String(data.length)]];
  const maxInts = Math.min(12, Math.floor(data.length / 4));
  for (let i = 0; i < maxInts; i++) {
    pairs.push([`u32_${i}`, String(data.readUInt32LE(i * 4))]);
  }
  return { _rawData: Buffer.from(data), _englishPairs: pairs };
}

function toEnglishGeneric(rec) {
  if (rec._englishPairs) return lines(rec._englishPairs);
  return '';
}

// ---------------------------------------------------------------------------
// SECTION REGISTRY
// ---------------------------------------------------------------------------

const SECTION_REGISTRY = {
  TECH: { parse: parseTECH, serialize: serializeTECH, toEnglish: toEnglishTECH, writableKeys: WRITABLE_TECH, hasCivKey: true, mode: 'len' },
  BLDG: { parse: parseBLDG, serialize: serializeBLDG, toEnglish: toEnglishBLDG, writableKeys: WRITABLE_BLDG, hasCivKey: true, mode: 'len' },
  GOOD: { parse: parseGOOD, serialize: serializeGOOD, toEnglish: toEnglishGOOD, writableKeys: WRITABLE_GOOD, hasCivKey: true, mode: 'len' },
  GOVT: { parse: parseGOVT, serialize: serializeGOVT, toEnglish: toEnglishGOVT, writableKeys: WRITABLE_GOVT, hasCivKey: true, mode: 'len' },
  RACE: { parse: parseRACE, serialize: serializeRACE, toEnglish: toEnglishRACE, writableKeys: WRITABLE_RACE, hasCivKey: true, mode: 'len' },
  PRTO: { parse: parsePRTO, serialize: serializePRTO, toEnglish: toEnglishPRTO, writableKeys: WRITABLE_PRTO, hasCivKey: true, mode: 'len' },
  CITY: { parse: parseCITY, serialize: serializeCITY, toEnglish: toEnglishCITY, writableKeys: WRITABLE_CITY, hasCivKey: false, mode: 'len' },
  UNIT: { parse: parseUNIT, serialize: serializeUNIT, toEnglish: toEnglishUNIT, writableKeys: WRITABLE_UNIT, hasCivKey: false, mode: 'len' },
  GAME: { parse: parseGAME, serialize: serializeGAME, toEnglish: toEnglishGAME, writableKeys: WRITABLE_GAME, hasCivKey: false, mode: 'len' },
  TILE: { toEnglish: toEnglishTILE, writableKeys: WRITABLE_TILE, hasCivKey: false, mode: 'fixed' },
  CTZN: { parse: parseCTZN, serialize: serializeCTZN, toEnglish: toEnglishCTZN, writableKeys: WRITABLE_CTZN, hasCivKey: true, mode: 'len' },
  CULT: { parse: parseCULT, serialize: serializeCULT, toEnglish: toEnglishCULT, writableKeys: WRITABLE_CULT, hasCivKey: false, mode: 'len' },
  DIFF: { parse: parseDIFF, serialize: serializeDIFF, toEnglish: toEnglishDIFF, writableKeys: WRITABLE_DIFF, hasCivKey: false, mode: 'len' },
  ERAS: { parse: parseERAS, serialize: serializeERAS, toEnglish: toEnglishERAS, writableKeys: WRITABLE_ERAS, hasCivKey: true, mode: 'len' },
  ESPN: { parse: parseESPN, serialize: serializeESPN, toEnglish: toEnglishESPN, writableKeys: WRITABLE_ESPN, hasCivKey: true, mode: 'len' },
  EXPR: { parse: parseEXPR, serialize: serializeEXPR, toEnglish: toEnglishEXPR, writableKeys: WRITABLE_EXPR, hasCivKey: false, mode: 'len' },
  TFRM: { parse: parseTFRM, serialize: serializeTFRM, toEnglish: toEnglishTFRM, writableKeys: WRITABLE_TFRM, hasCivKey: true, mode: 'len' },
  WSIZ: { parse: parseWSIZ, serialize: serializeWSIZ, toEnglish: toEnglishWSIZ, writableKeys: WRITABLE_WSIZ, hasCivKey: false, mode: 'len' },
  WCHR: { parse: parseWCHR, serialize: serializeWCHR, toEnglish: toEnglishWCHR, writableKeys: WRITABLE_WCHR, hasCivKey: false, mode: 'len' },
  WMAP: { parse: parseWMAP, serialize: serializeWMAP, toEnglish: toEnglishWMAP, writableKeys: WRITABLE_WMAP, hasCivKey: false, mode: 'len' },
  TERR: { parse: parseTERR, serialize: serializeTERR, toEnglish: toEnglishTERR, writableKeys: WRITABLE_TERR, hasCivKey: true, mode: 'len' },
  RULE: { parse: parseRULE, serialize: serializeRULE, toEnglish: toEnglishRULE, writableKeys: WRITABLE_RULE, hasCivKey: false, mode: 'len' },
  LEAD: { parse: parseLEAD, serialize: serializeLEAD, toEnglish: toEnglishLEAD, writableKeys: WRITABLE_LEAD, hasCivKey: false, mode: 'len' },
  CONT: { parse: parseCONT, serialize: serializeCONT, toEnglish: toEnglishCONT, writableKeys: WRITABLE_CONT, hasCivKey: false, mode: 'fixed' },
  SLOC: { parse: parseSLOC, serialize: serializeSLOC, toEnglish: toEnglishSLOC, writableKeys: WRITABLE_SLOC, hasCivKey: false, mode: 'fixed' },
  CLNY: { parse: parseCLNY, serialize: serializeCLNY, toEnglish: toEnglishCLNY, writableKeys: WRITABLE_CLNY, hasCivKey: false, mode: 'fixed' },
  FLAV: { toEnglish: toEnglishFLAV, writableKeys: WRITABLE_FLAV, hasCivKey: false, mode: 'special' },
};

// ---------------------------------------------------------------------------
// parseAllSections: parse a complete BIQ buffer
// ---------------------------------------------------------------------------

const SECTION_ORDER = [
  'BLDG', 'CTZN', 'CULT', 'DIFF', 'ERAS', 'ESPN', 'EXPR', 'GOOD', 'GOVT', 'RULE',
  'PRTO', 'RACE', 'TECH', 'TFRM', 'TERR', 'WSIZ', 'FLAV',
  'WCHR', 'WMAP', 'TILE', 'CONT', 'SLOC', 'CITY', 'UNIT', 'CLNY',
  'GAME', 'LEAD'
];

const OPTIONAL_SECTIONS = new Set(['FLAV', 'WCHR', 'WMAP', 'TILE', 'CONT', 'SLOC', 'CITY', 'UNIT', 'CLNY', 'LEAD']);

const FIXED_SECTION_SIZES = { CONT: 12, SLOC: 20, CLNY: 20 };

function getTileRecordLength(versionTag, majorVersion) {
  if (versionTag === 'BICX' && majorVersion === 12) return 49; // 4+45
  if (versionTag === 'BICX') return 33;
  if (versionTag === 'BIC ' && majorVersion === 2) return 26;
  return 27;
}

function readUInt32Safe(buf, off) {
  if (off < 0 || off + 4 > buf.length) return null;
  return buf.readUInt32LE(off);
}

function findSectionTag(buf, tag, fromOff) {
  const needle = Buffer.from(tag, 'latin1');
  let idx = buf.indexOf(needle, fromOff);
  while (idx >= 0) {
    const count = readUInt32Safe(buf, idx + 4);
    if (count !== null && count < 50000000) return { offset: idx, count };
    idx = buf.indexOf(needle, idx + 1);
  }
  return null;
}

function parseAllSections(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);

  // Parse header
  if (buf.length < 736) return { ok: false, error: 'Buffer too small for BIQ header' };
  const versionTag = buf.subarray(0, 4).toString('latin1');
  const verHeaderTag = buf.subarray(4, 8).toString('latin1');
  if (!versionTag.startsWith('BIC') || verHeaderTag !== 'VER#') {
    return { ok: false, error: `Invalid BIQ header: ${versionTag} ${verHeaderTag}` };
  }
  const majorVersion = buf.readUInt32LE(24);
  const minorVersion = buf.readUInt32LE(28);
  let off = 0;
  const numHeaders = buf.readUInt32LE(8);
  const headerLength = buf.readUInt32LE(12);
  let biqDescription = '';
  let end = 32;
  while (end < 672 && buf[end] !== 0) end++;
  biqDescription = buf.subarray(32, end).toString('latin1');
  let titleEnd = 672;
  while (titleEnd < 736 && buf[titleEnd] !== 0) titleEnd++;
  const biqTitle = buf.subarray(672, titleEnd).toString('latin1');

  const io = new BiqIO({ versionTag, majorVersion, minorVersion });
  const sections = [];
  let searchFrom = 736;

  for (const code of SECTION_ORDER) {
    const found = findSectionTag(buf, code, searchFrom);
    if (!found) {
      if (OPTIONAL_SECTIONS.has(code)) continue;
      // Non-optional missing section: skip gracefully
      continue;
    }

    const sectionOffset = found.offset;
    const count = found.count;
    const dataStart = sectionOffset + 8; // after tag+count

    // If next section is ERAS, capture numEras
    if (code === 'ERAS') io.numEras = count;
    const reg = SECTION_REGISTRY[code];

    // FLAV special handling: non-standard section structure
    if (code === 'FLAV') {
      // dataStart points directly to numFlavors (int32), then flavor records (no len-prefix)
      const records = [];
      let pos = dataStart;
      const numFlavors = pos + 4 <= buf.length ? buf.readUInt32LE(pos) : 0; pos += 4;
      for (let i = 0; i < numFlavors && pos + 264 <= buf.length; i++) {
        const questionMark = buf.readInt32LE(pos); pos += 4;
        const flavName = readStr(buf, pos, 256); pos += 256;
        const numRelations = pos + 4 <= buf.length ? buf.readInt32LE(pos) : 0; pos += 4;
        const relations = [];
        for (let j = 0; j < numRelations && pos + 4 <= buf.length; j++) {
          relations.push(buf.readInt32LE(pos)); pos += 4;
        }
        records.push({ index: i, name: flavName, questionMark, numRelations, relations });
      }
      sections.push({
        code,
        count: numFlavors,
        records,
        _sectionOffset: sectionOffset,
        _rawBuf: buf.subarray(sectionOffset),
      });
      searchFrom = sectionOffset + 4;
      continue;
    }

    const isFixed = reg ? (reg.mode === 'fixed') : (FIXED_SECTION_SIZES[code] != null);
    const fixedSize = code === 'TILE' ? getTileRecordLength(versionTag, majorVersion)
      : (FIXED_SECTION_SIZES[code] || 0);

    const records = [];
    let pos = dataStart;

    if (isFixed && fixedSize > 0) {
      for (let i = 0; i < count && pos + fixedSize <= buf.length; i++, pos += fixedSize) {
        const rawRecord = Buffer.from(buf.subarray(pos, pos + fixedSize));
        if (code === 'TILE' && reg) {
          records.push({ index: i, ...parseTILE(rawRecord, i, io), _tileIndex: i });
        } else if (reg && reg.parse) {
          const body = rawRecord.subarray(4); // skip dataLen
          try {
            const parsed = reg.parse(body, io);
            records.push({ index: i, ...parsed, _rawRecord: rawRecord });
          } catch (_err) {
            records.push({ index: i, ...parseGeneric(body), _rawRecord: rawRecord });
          }
        } else {
          const body = rawRecord.subarray(4); // skip dataLen
          records.push({ index: i, ...parseGeneric(body), _rawRecord: rawRecord });
        }
      }
    } else {
      // len mode
      for (let i = 0; i < count && pos + 4 <= buf.length; i++) {
        const dataLen = buf.readUInt32LE(pos);
        const bodyStart = pos + 4;
        const bodyEnd = bodyStart + dataLen;
        if (bodyEnd > buf.length) break;
        const body = buf.subarray(bodyStart, bodyEnd);

        let rec;
        if (reg && reg.parse) {
          try {
            rec = reg.parse(body, io);
          } catch (_err) {
            rec = parseGeneric(body);
          }
        } else {
          rec = parseGeneric(body);
        }
        records.push({ index: i, ...rec });
        pos = bodyEnd;
      }
    }

    // Capture map width from WMAP after parsing
    if (code === 'WMAP' && records.length > 0) {
      const wmapRec = records[0];
      if (wmapRec.width) io.mapWidth = wmapRec.width;
    }

    sections.push({
      code,
      count,
      records,
      _sectionOffset: sectionOffset,
      _rawBuf: buf.subarray(sectionOffset), // lazy, will trim to next section
    });
    searchFrom = sectionOffset + 4;
  }

  // Trim _rawBuf for each section to just its own bytes
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const nextOff = i + 1 < sections.length ? sections[i + 1]._sectionOffset : buf.length;
    s._rawBuf = Buffer.from(buf.subarray(s._sectionOffset, nextOff));
  }

  return {
    ok: true,
    versionTag, verHeaderTag, majorVersion, minorVersion,
    numHeaders, headerLength, biqDescription, biqTitle,
    sections, io,
    _headerBuf: Buffer.from(buf.subarray(0, 736))
  };
}

// ---------------------------------------------------------------------------
// serializeSection: rebuild a single section's binary bytes (tag+count+records)
// ---------------------------------------------------------------------------

function serializeSection(section, io) {
  const code = section.code;
  const reg = SECTION_REGISTRY[code];
  const records = section.records || [];

  // FLAV: special non-standard serialization
  if (code === 'FLAV') {
    return serializeFLAVSection(section);
  }

  const w = new BiqWriter();
  w.writeTag(code);
  w.writeInt(records.length);

  const isFixed = reg ? (reg.mode === 'fixed') : (FIXED_SECTION_SIZES[code] != null);

  if (isFixed) {
    const fixedSize = code === 'TILE' ? getTileRecordLength(io.versionTag, io.majorVersion)
      : (FIXED_SECTION_SIZES[code] || 0);
    for (const rec of records) {
      if (code === 'TILE') {
        // TILE always uses raw record (surgical edits done in-place)
        if (rec._rawRecord) {
          w.writeBytes(rec._rawRecord);
        } else {
          w.writeBytes(Buffer.alloc(fixedSize));
        }
      } else if (reg && reg.serialize) {
        // For CONT/SLOC/CLNY with proper parsers: use serialize for faithfulness when modified
        // We still wrap with dataLen prefix to match the fixed-size record format
        try {
          const body = reg.serialize(rec, io);
          // Fixed records include a 4-byte dataLen prefix in the raw record
          const dlen = Buffer.allocUnsafe(4);
          dlen.writeUInt32LE(body.length >>> 0, 0);
          w.writeBytes(dlen);
          w.writeBytes(body);
        } catch (_err) {
          if (rec._rawRecord) {
            w.writeBytes(rec._rawRecord);
          } else {
            w.writeBytes(Buffer.alloc(fixedSize));
          }
        }
      } else if (rec._rawRecord) {
        w.writeBytes(rec._rawRecord);
      } else {
        w.writeBytes(Buffer.alloc(fixedSize));
      }
    }
    return w.toBuffer();
  }

  // Len mode
  for (const rec of records) {
    let body;
    if (reg && reg.serialize) {
      try {
        body = reg.serialize(rec, io);
      } catch (_err) {
        body = rec._rawData || Buffer.alloc(0);
      }
    } else {
      body = rec._rawData || Buffer.alloc(0);
    }
    w.writeUInt(body.length);
    w.writeBytes(body);
  }
  return w.toBuffer();
}

// ---------------------------------------------------------------------------
// buildBiqBuffer: assemble complete BIQ binary from parsed structure
// ---------------------------------------------------------------------------

function buildBiqBuffer(parsed) {
  const { _headerBuf, sections, io } = parsed;
  const parts = [_headerBuf];
  for (const section of sections) {
    const isModified = section._modified;
    if (!isModified && section._rawBuf) {
      parts.push(section._rawBuf);
    } else {
      parts.push(serializeSection(section, io));
    }
  }
  return Buffer.concat(parts);
}

// ---------------------------------------------------------------------------
// Field SET helpers
// ---------------------------------------------------------------------------

function canonicalKey(k) {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findRecordByRef(records, recordRef) {
  const ref = String(recordRef || '').trim();
  const upper = ref.toUpperCase();
  if (upper.startsWith('@INDEX:')) {
    const idx = Number.parseInt(upper.slice(7), 10);
    if (Number.isFinite(idx) && idx >= 0 && idx < records.length) return records[idx];
    return null;
  }
  // Search by civilopediaEntry
  return records.find((r) => {
    const ce = String(r.civilopediaEntry || '').trim().toUpperCase();
    return ce === upper;
  }) || null;
}

function applySetToRecord(rec, fieldKey, value, code, io) {
  const ck = canonicalKey(fieldKey);

  // TILE: surgical raw edit
  if (code === 'TILE') {
    const fd = [...TILE_FIELDS].find((f) => canonicalKey(f.name) === ck);
    if (!fd) return false;
    const raw = rec._rawRecord;
    if (!raw) return false;
    const bodyOff = 4 + fd.off; // 4-byte dataLen prefix
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return false;
    switch (fd.type) {
      case 'uint8': raw[bodyOff] = n & 0xff; break;
      case 'int16': raw.writeInt16LE(n, bodyOff); break;
      case 'uint16': raw.writeUInt16LE(n & 0xffff, bodyOff); break;
      case 'int32': raw.writeInt32LE(n | 0, bodyOff); break;
      default: raw[bodyOff] = n & 0xff;
    }
    // Update parsed field too
    rec[fd.name] = n;
    return true;
  }

  // CITY buildings list
  if (code === 'CITY' && (ck === 'buildings' || ck === 'numbuildings')) {
    if (ck === 'numbuildings') return true; // numBuildings derived from array length
    const parts = String(value || '').split(/[,\s]+/).filter(Boolean);
    rec.buildings = parts.map((p) => Number.parseInt(p, 10)).filter((n) => Number.isFinite(n));
    return true;
  }

  // GAME scenario search folders: blocked (read-only)
  if (code === 'GAME' && ck === 'scenariosearchfolders') return false;

  // Generic: set field on rec object
  // Try exact camelCase match first
  for (const key of Object.keys(rec)) {
    if (key.startsWith('_')) continue;
    if (canonicalKey(key) === ck) {
      const old = rec[key];
      if (typeof old === 'number' || old == null) {
        const n = Number.parseInt(value, 10);
        rec[key] = Number.isFinite(n) ? n : (old || 0);
      } else if (typeof old === 'string') {
        rec[key] = String(value);
      } else if (Array.isArray(old)) {
        // Try to parse as array
        const parts = String(value || '').split(/[,\s]+/).filter(Boolean);
        rec[key] = parts.map((p) => Number.parseInt(p, 10)).filter((n) => Number.isFinite(n));
      } else {
        rec[key] = value;
      }
      return true;
    }
  }

  // If field doesn't exist yet (new record), create it
  const n = Number.parseInt(value, 10);
  if (Number.isFinite(n)) {
    rec[ck] = n;
  } else {
    rec[ck] = value;
  }
  return true;
}

// ---------------------------------------------------------------------------
// createDefaultRecord: create a blank record for ADD operation
// ---------------------------------------------------------------------------

function createDefaultRecord(code, civKey, io) {
  const name = civKey.replace(/^[A-Z]+_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  switch (code) {
    case 'TECH': return {
      name, civilopediaEntry: civKey, cost: 0, era: 0, advanceIcon: 0, x: 0, y: 0,
      prerequisites: [-1, -1, -1, -1], flags: 0, flavors: 0, questionMark: 0
    };
    case 'BLDG': {
      const rec = { description: '', name, civilopediaEntry: civKey };
      for (const sn of BLDG_SCALAR_NAMES) rec[sn] = 0;
      rec.reqImprovement = -1; rec.reqAdvance = -1; rec.obsoleteBy = -1;
      rec.reqResource1 = -1; rec.reqResource2 = -1; rec.reqGovernment = -1;
      rec.unitProduced = -1; rec.improvements = -1;
      return rec;
    }
    case 'GOOD': return {
      name, civilopediaEntry: civKey, type: 0, appearanceRatio: 0, disapperanceProbability: 0,
      icon: 0, prerequisite: -1, foodBonus: 0, shieldsBonus: 0, commerceBonus: 0
    };
    case 'GOVT': {
      return {
        defaultType: 0, transitionType: 0, requiresMaintenance: 0, questionMark1: 0,
        tilePenalty: 0, commerceBonus: 0, name, civilopediaEntry: civKey,
        rulerTitles: Array(8).fill(''), corruption: 0, immuneTo: 0, diplomatLevel: 0, spyLevel: 0,
        numGovts: 0, relations: [],
        hurrying: 0, assimilation: 0, draftLimit: 0, militaryPolice: 0, rulerTitlePairsUsed: 0,
        prerequisiteTechnology: -1, scienceCap: 0, workerRate: 0, qm2: 0, qm3: 0, qm4: 0,
        freeUnits: 0, perTown: 0, perCity: 0, perMetropolis: 0, costPerUnit: 0, warWeariness: 0,
        xenophobic: 0, forceResettlement: 0
      };
    }
    case 'RACE': {
      return {
        numCities: 0, cityNames: [], numMilLeaders: 0, milLeaderNames: [],
        name, leaderTitle: '', civilopediaEntry: civKey, adjective: name, civilizationName: name, noun: name,
        forwardFilenames: Array(io.numEras).fill(''), reverseFilenames: Array(io.numEras).fill(''),
        cultureGroup: 0, leaderGender: 0, civilizationGender: 0, aggressionLevel: 0,
        uniqueCivCounter: 0, shunnedGovernment: -1, favoriteGovernment: 0, defaultColor: 0, uniqueColor: 0,
        freeTechs: [-1, -1, -1, -1], bonuses: 0, governorSettings: 0, buildNever: 0, buildOften: 0, plurality: 0,
        kingUnit: -1, flavors: 0, questionMark: 0, diplomacyTextIndex: 0, numScientificLeaders: 0, scientificLeaderNames: []
      };
    }
    case 'CITY': return {
      hasWalls: 0, hasPalace: 0, name: '', ownerType: 1, numBuildings: 0, buildings: [],
      culture: 0, owner: 0, size: 1, x: 0, y: 0, cityLevel: 0, borderLevel: 0, useAutoName: 0
    };
    case 'UNIT': return {
      name: '', ownerType: 1, experienceLevel: 0, owner: 0, pRTONumber: 0,
      AIStrategy: 0, x: 0, y: 0, customName: '', useCivilizationKing: 0
    };
    default: return { _rawData: Buffer.alloc(0) };
  }
}

// ---------------------------------------------------------------------------
// copyRecord: deep clone a record
// ---------------------------------------------------------------------------

function copyRecord(src) {
  const clone = {};
  for (const [k, v] of Object.entries(src)) {
    if (Buffer.isBuffer(v)) clone[k] = Buffer.from(v);
    else if (Array.isArray(v)) clone[k] = v.map((x) => (Buffer.isBuffer(x) ? Buffer.from(x) : x));
    else clone[k] = v;
  }
  return clone;
}

// ---------------------------------------------------------------------------
// applyEdits: apply SET/ADD/COPY/DELETE edits to a buffer, return new buffer
// ---------------------------------------------------------------------------

function applyEdits(buf, edits) {
  if (!Array.isArray(edits) || edits.length === 0) {
    return { ok: true, buffer: buf, applied: 0, skipped: 0, warning: '' };
  }

  const parsed = parseAllSections(buf);
  if (!parsed.ok) return { ok: false, error: parsed.error || 'Failed to parse BIQ' };

  const { sections, io } = parsed;
  const sectionByCode = new Map(sections.map((s) => [s.code, s]));

  let applied = 0;
  let skipped = 0;
  const warnings = [];

  for (const edit of edits) {
    const op = String(edit.op || 'set').toLowerCase();
    const code = String(edit.sectionCode || '').toUpperCase();
    const section = sectionByCode.get(code);

    if (op === 'add' || op === 'copy') {
      const newRef = String(edit.newRecordRef || '').trim().toUpperCase();
      const sourceRef = String(edit.sourceRef || edit.copyFromRef || '').trim().toUpperCase();
      if (!newRef) { skipped++; warnings.push(`${op}: missing newRecordRef for ${code}`); continue; }
      if (!section) { skipped++; warnings.push(`${op}: section ${code} not found`); continue; }

      // Check for duplicate
      const existing = section.records.find((r) =>
        String(r.civilopediaEntry || '').trim().toUpperCase() === newRef ||
        String(r.newRecordRef || '').trim().toUpperCase() === newRef
      );
      if (existing) { skipped++; warnings.push(`${op}: record ${newRef} already exists in ${code}`); continue; }

      let newRec;
      if (op === 'copy' && sourceRef) {
        const src = findRecordByRef(section.records, sourceRef);
        if (src) {
          newRec = copyRecord(src);
          newRec.civilopediaEntry = newRef;
          if (newRec._rawRecord) delete newRec._rawRecord; // force re-serialize
        } else {
          warnings.push(`copy: source ${sourceRef} not found in ${code}, creating blank`);
          newRec = createDefaultRecord(code, newRef, io);
        }
      } else {
        newRec = createDefaultRecord(code, newRef, io);
      }
      newRec.index = section.records.length;
      section.records.push(newRec);
      section._modified = true;
      applied++;
      continue;
    }

    if (op === 'delete') {
      const ref = String(edit.recordRef || '').trim().toUpperCase();
      if (!section) { skipped++; continue; }
      const idx = section.records.findIndex((r) => {
        const ce = String(r.civilopediaEntry || '').trim().toUpperCase();
        if (ce === ref) return true;
        if (ref.startsWith('@INDEX:')) {
          const n = Number.parseInt(ref.slice(7), 10);
          return Number.isFinite(n) && r.index === n;
        }
        return false;
      });
      if (idx < 0) { skipped++; warnings.push(`delete: ${ref} not found in ${code}`); continue; }
      section.records.splice(idx, 1);
      // Re-number indices
      section.records.forEach((r, i) => { r.index = i; });
      section._modified = true;
      applied++;
      continue;
    }

    // SET
    if (!section) { skipped++; continue; }
    const rec = findRecordByRef(section.records, edit.recordRef);
    if (!rec) { skipped++; warnings.push(`set: record ${edit.recordRef} not found in ${code}`); continue; }

    const fieldKey = String(edit.fieldKey || '').trim();
    // Decode value
    let value = String(edit.value != null ? edit.value : '');
    // Note: edit.value is already the decoded string (configCore.js decodes base64 before creating the edit object)
    // But in the Java path, values are base64-encoded in the TSV and decoded by Java.
    // In our JS path, configCore.js calls applyBiqEdits directly with plain strings.

    const ok = applySetToRecord(rec, fieldKey, value, code, io);
    if (ok) {
      section._modified = true;
      applied++;
    } else {
      skipped++;
    }
  }

  const newBuf = buildBiqBuffer(parsed);
  return {
    ok: true,
    buffer: newBuf,
    applied,
    skipped,
    warning: warnings.join('; ')
  };
}

// ---------------------------------------------------------------------------
// English output for bridge format
// ---------------------------------------------------------------------------

function sectionToEnglish(rec, code, io) {
  const reg = SECTION_REGISTRY[code];
  if (reg && reg.toEnglish) {
    try { return reg.toEnglish(rec, io); } catch (_e) { /* fall through */ }
  }
  return toEnglishGeneric(rec);
}

function sectionWritableKeys(code) {
  const reg = SECTION_REGISTRY[code];
  return reg ? (reg.writableKeys || []) : [];
}

function sectionRecordName(rec, code) {
  if (rec.name) return String(rec.name);
  if (rec.civilopediaEntry) return String(rec.civilopediaEntry);
  return `${code} ${(rec.index || 0) + 1}`;
}

module.exports = {
  parseAllSections,
  buildBiqBuffer,
  serializeSection,
  applyEdits,
  sectionToEnglish,
  sectionWritableKeys,
  sectionRecordName,
  BiqIO,
  SECTION_REGISTRY,
  TILE_FIELDS,
  TILE_FIELD_MAP,
  getTileRecordLength,
};
