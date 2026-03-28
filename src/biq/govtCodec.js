'use strict';

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function projectGovernmentBiqFields({ rawFields, civilopediaEntry, governmentNames = [] }) {
  const byRaw = new Map();
  (Array.isArray(rawFields) ? rawFields : []).forEach((field) => {
    const rawKey = String(field && (field.baseKey || field.key) || '').trim();
    if (!rawKey) return;
    byRaw.set(normalizeKey(rawKey), field);
  });

  const projected = [];
  const pushField = (baseKey, value, originalValue, editable = true, label = baseKey) => {
    projected.push({
      key: baseKey,
      baseKey,
      label,
      value: String(value),
      originalValue: String(originalValue),
      editable
    });
  };
  const pushFromRaw = (uiKey, rawKey, fallbackValue = '', label = uiKey) => {
    const hit = byRaw.get(normalizeKey(rawKey));
    if (!hit) {
      pushField(uiKey, fallbackValue, fallbackValue, true, label);
      return;
    }
    pushField(
      uiKey,
      String(hit.value == null ? '' : hit.value),
      String(hit.originalValue == null ? hit.value : hit.originalValue),
      !!hit.editable,
      label
    );
  };

  pushField('civilopediaentry', civilopediaEntry || '', civilopediaEntry || '', false, 'civilopediaentry');
  pushFromRaw('name', 'name');
  pushFromRaw('prerequisitetechnology', 'prerequisitetechnology');
  pushFromRaw('corruption', 'corruption');
  pushFromRaw('sciencecap', 'sciencecap');
  pushFromRaw('workerrate', 'workerrate');
  pushFromRaw('assimilationchance', 'assimilation');
  pushFromRaw('draftlimit', 'draftlimit');
  pushFromRaw('militarypolicelimit', 'militarypolice');
  pushFromRaw('defaulttype', 'defaulttype');
  pushFromRaw('transitiontype', 'transitiontype');
  pushFromRaw('requiresmaintenance', 'requiresmaintenance');
  pushFromRaw('tilepenalty', 'tilepenalty');
  pushFromRaw('commercebonus', 'commercebonus');
  pushFromRaw('xenophobic', 'xenophobic');
  pushFromRaw('forceresettlement', 'forceresettlement');
  pushFromRaw('diplomatlevel', 'diplomatlevel');
  pushFromRaw('spylevel', 'spylevel');
  pushFromRaw('immuneto', 'immuneto');
  pushFromRaw('freeunits', 'freeunits');
  pushFromRaw('costperunit', 'costperunit');
  pushFromRaw('freeunitspertown', 'pertown');
  pushFromRaw('freeunitspercity', 'percity');
  pushFromRaw('freeunitspermetropolis', 'permetropolis');
  pushFromRaw('hurrying', 'hurrying');
  pushFromRaw('warweariness', 'warweariness');
  pushFromRaw('questionmarkone', 'questionMark1');
  pushFromRaw('questionmarktwo', 'qm2');
  pushFromRaw('questionmarkthree', 'qm3');
  pushFromRaw('questionmarkfour', 'qm4');
  pushFromRaw('rulertitlepairsused', 'rulertitlepairsused');
  pushFromRaw('malerulertitle1', 'maletitleera1');
  pushFromRaw('femalerulertitle1', 'femaletitleera1');
  pushFromRaw('malerulertitle2', 'maletitleera2');
  pushFromRaw('femalerulertitle2', 'femaletitleera2');
  pushFromRaw('malerulertitle3', 'maletitleera3');
  pushFromRaw('femalerulertitle3', 'femaletitleera3');
  pushFromRaw('malerulertitle4', 'maletitleera4');
  pushFromRaw('femalerulertitle4', 'femaletitleera4');

  const relationCount = Math.max(
    governmentNames.length,
    ...Array.from(byRaw.keys())
      .map((key) => {
        const match = key.match(/^govtrelation(\d+)(canbribe|briberymod|resistancemod)$/);
        return match ? Number.parseInt(match[1], 10) + 1 : 0;
      })
  );
  for (let idx = 0; idx < relationCount; idx += 1) {
    const govName = String(governmentNames[idx] || `Government ${idx + 1}`).trim();
    const canBribe = byRaw.get(normalizeKey(`govt_relation_${idx}_can_bribe`));
    const bribery = byRaw.get(normalizeKey(`govt_relation_${idx}_bribery_mod`));
    const resistance = byRaw.get(normalizeKey(`govt_relation_${idx}_resistance_mod`));
    if (!canBribe && !bribery && !resistance) continue;
    pushField(
      `performance_of_this_government_versus_government_${idx}`,
      govName,
      govName,
      false,
      `Performance Vs ${govName}`
    );
    pushField(
      'canbribe',
      String(canBribe && canBribe.value != null ? canBribe.value : ''),
      String(canBribe && (canBribe.originalValue == null ? canBribe.value : canBribe.originalValue) || ''),
      !!(canBribe && canBribe.editable),
      'Can Bribe'
    );
    pushField(
      'resistancemodifier',
      String(resistance && resistance.value != null ? resistance.value : ''),
      String(resistance && (resistance.originalValue == null ? resistance.value : resistance.originalValue) || ''),
      !!(resistance && resistance.editable),
      'Resistance Modifier'
    );
    pushField(
      'briberymodifier',
      String(bribery && bribery.value != null ? bribery.value : ''),
      String(bribery && (bribery.originalValue == null ? bribery.value : bribery.originalValue) || ''),
      !!(bribery && bribery.editable),
      'Propaganda'
    );
  }

  return projected;
}

function collapseGovernmentBiqFields(fields, valueKey = 'value') {
  const raw = {};
  const remainingRelations = [];
  (Array.isArray(fields) ? fields : []).forEach((field) => {
    const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
    const value = String(field && field[valueKey] == null ? '' : field[valueKey]);
    if (!base || base === 'civilopediaentry') return;
    if (/^performance_of_this_government_versus_government_\d+$/.test(base)) {
      remainingRelations.push({ type: 'row', field });
      return;
    }
    if (base === 'canbribe' || base === 'resistancemodifier' || base === 'briberymodifier') {
      remainingRelations.push({ type: base, field });
      return;
    }
    const aliasMap = {
      assimilationchance: 'assimilation',
      militarypolicelimit: 'militarypolice',
      freeunitspertown: 'pertown',
      freeunitspercity: 'percity',
      freeunitspermetropolis: 'permetropolis',
      malerulertitle1: 'maletitleera1',
      femalerulertitle1: 'femaletitleera1',
      malerulertitle2: 'maletitleera2',
      femalerulertitle2: 'femaletitleera2',
      malerulertitle3: 'maletitleera3',
      femalerulertitle3: 'femaletitleera3',
      malerulertitle4: 'maletitleera4',
      femalerulertitle4: 'femaletitleera4'
    };
    raw[aliasMap[base] || base] = value;
  });

  let rowIndex = -1;
  remainingRelations.forEach(({ type, field }) => {
    if (type === 'row') {
      const base = String(field && (field.baseKey || field.key) || '').toLowerCase();
      const match = base.match(/^performance_of_this_government_versus_government_(\d+)$/);
      rowIndex = match ? Number.parseInt(match[1], 10) : rowIndex + 1;
      return;
    }
    if (rowIndex < 0) return;
    const value = String(field && field[valueKey] == null ? '' : field[valueKey]);
    if (type === 'canbribe') raw[`govt_relation_${rowIndex}_can_bribe`] = value;
    if (type === 'resistancemodifier') raw[`govt_relation_${rowIndex}_resistance_mod`] = value;
    if (type === 'briberymodifier') raw[`govt_relation_${rowIndex}_bribery_mod`] = value;
  });

  return raw;
}

module.exports = {
  projectGovernmentBiqFields,
  collapseGovernmentBiqFields
};
