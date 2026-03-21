'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function extractConstSource(sourceText, name) {
  const needle = `const ${name} = `;
  const start = sourceText.indexOf(needle);
  if (start < 0) throw new Error(`Could not find const ${name}`);
  const bodyStart = sourceText.indexOf('{', start);
  if (bodyStart < 0) throw new Error(`Could not find body for const ${name}`);
  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < sourceText.length; i += 1) {
    const ch = sourceText[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`Could not determine end of const ${name}`);
  return sourceText.slice(start, end) + ';';
}

function extractFunctionSource(sourceText, name) {
  const needle = `function ${name}(`;
  const start = sourceText.indexOf(needle);
  if (start < 0) throw new Error(`Could not find function ${name}`);
  let paramDepth = 0;
  let signatureEnd = -1;
  for (let i = start + needle.length - 1; i < sourceText.length; i += 1) {
    const ch = sourceText[i];
    if (ch === '(') paramDepth += 1;
    if (ch === ')') {
      paramDepth -= 1;
      if (paramDepth === 0) {
        signatureEnd = i;
        break;
      }
    }
  }
  const bodyStart = sourceText.indexOf('{', signatureEnd);
  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < sourceText.length; i += 1) {
    const ch = sourceText[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`Could not determine end of function ${name}`);
  return sourceText.slice(start, end);
}

function loadRendererMetadata() {
  const sourceText = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  const scriptSource = [
    extractConstSource(sourceText, 'BIQ_FIELD_REFS'),
    extractConstSource(sourceText, 'BIQ_STRUCTURE_RULE_SCHEMAS'),
    extractConstSource(sourceText, 'BIQ_SECTION_TO_REFERENCE_TAB'),
    extractFunctionSource(sourceText, 'getBiqStructureRefSpec'),
    'globalThis.__crudMeta = { BIQ_FIELD_REFS, BIQ_STRUCTURE_RULE_SCHEMAS, BIQ_SECTION_TO_REFERENCE_TAB, getBiqStructureRefSpec };'
  ].join('\n\n');
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(scriptSource, sandbox, { filename: 'reference-crud-generated-inventory.vm' });
  return sandbox.__crudMeta;
}

const {
  BIQ_FIELD_REFS,
  BIQ_STRUCTURE_RULE_SCHEMAS,
  BIQ_SECTION_TO_REFERENCE_TAB,
  getBiqStructureRefSpec
} = loadRendererMetadata();

const TAB_TO_SECTION_CODE = {
  ...Object.fromEntries(Object.entries(BIQ_SECTION_TO_REFERENCE_TAB).map(([sectionCode, tabKey]) => [tabKey, sectionCode])),
  eras: 'ERAS',
  difficulties: 'DIFF',
  workerActions: 'TFRM',
  terrainPedia: 'TERR'
};

const IMPORT_SPECIAL_CASES = [
  { tabKey: 'units', field: 'availableto', kind: 'bitmask', sourceTabKey: 'civilizations', targetTabKey: 'civilizations' },
  { tabKey: 'units', field: 'stealth_target', kind: 'list', sourceTabKey: 'units', targetTabKey: 'units' },
  { tabKey: 'units', field: 'legal_unit_telepad', kind: 'list', sourceTabKey: 'units', targetTabKey: 'units' },
  { tabKey: 'units', field: 'legal_building_telepad', kind: 'list', sourceTabKey: 'improvements', targetTabKey: 'improvements' },
  { tabKey: 'governments', field: 'performance_of_this_government_versus_government_*', kind: 'relation-table', sourceTabKey: 'governments', targetTabKey: 'governments' }
];

const DELETE_COMPLEX_SPECIAL_CASES = [
  { targetSection: 'GOOD', sectionCode: 'TERR', field: 'possibleResources', kind: 'mask' },
  { targetSection: 'BLDG', sectionCode: 'CITY', field: 'buildings', kind: 'list' },
  { targetSection: 'GOVT', sectionCode: 'GOVT', field: 'relations', kind: 'relation-table' },
  { targetSection: 'PRTO', sectionCode: 'PRTO', field: 'legalUnitTelepads', kind: 'list' },
  { targetSection: 'PRTO', sectionCode: 'PRTO', field: 'stealthTargets', kind: 'list' },
  { targetSection: 'BLDG', sectionCode: 'PRTO', field: 'legalBuildingTelepads', kind: 'list' },
  { targetSection: 'PRTO', sectionCode: 'UNIT', field: 'pRTONumber', kind: 'scalar' },
  { targetSection: 'PRTO', sectionCode: 'LEAD', field: 'startUnits', kind: 'object-list' },
  { targetSection: 'TECH', sectionCode: 'LEAD', field: 'techIndices', kind: 'list' },
  { targetSection: 'RACE', sectionCode: 'PRTO', field: 'availableTo', kind: 'bitmask' }
];

function makeImportSignature(item) {
  return [
    String(item.tabKey || '').toLowerCase(),
    String(item.field || '').toLowerCase(),
    String(item.kind || '').toLowerCase(),
    String(item.sourceTabKey || '').toLowerCase(),
    String(item.targetTabKey || '').toLowerCase()
  ].join('|');
}

function makeDeleteSignature(item) {
  let field = String(item.field || '');
  let kind = String(item.kind || '');
  const targetSection = String(item.targetSection || '').toUpperCase();
  const sectionCode = String(item.sectionCode || '').toUpperCase();
  if (targetSection === 'TECH' && sectionCode === 'TECH' && /^prerequisite\d+$/i.test(field)) {
    field = 'prerequisites';
    kind = 'fixed-list';
  }
  if (targetSection === 'TECH' && sectionCode === 'RACE' && /^freetech\d+index$/i.test(field)) {
    field = 'freeTechs';
    kind = 'fixed-list';
  }
  return [
    targetSection,
    sectionCode,
    field.toLowerCase(),
    kind.toLowerCase()
  ].join('|');
}

function titleizeTabKey(tabKey) {
  return String(tabKey || '').replace(/([a-z])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

function buildGeneratedImportReferenceInventory() {
  const items = [];
  Object.entries(BIQ_FIELD_REFS).forEach(([tabKey, fieldMap]) => {
    Object.entries(fieldMap || {}).forEach(([field, targetTabKey]) => {
      if (field === 'enslaveresultsinto') return;
      items.push({
        id: `import-${titleizeTabKey(tabKey)}-${String(field).toLowerCase()}`,
        tabKey,
        field,
        kind: 'scalar',
        sourceTabKey: targetTabKey,
        targetTabKey
      });
    });
  });
  items.push(...IMPORT_SPECIAL_CASES.map((item) => ({
    id: `import-${titleizeTabKey(item.tabKey)}-${String(item.field).replace(/[^a-z0-9]+/gi, '').toLowerCase()}`,
    ...item
  })));
  const deduped = new Map();
  items.forEach((item) => {
    deduped.set(makeImportSignature(item), item);
  });
  return Array.from(deduped.values())
    .sort((a, b) => makeImportSignature(a).localeCompare(makeImportSignature(b)));
}

function buildGeneratedDeleteReferenceInventory() {
  const items = [];
  buildGeneratedImportReferenceInventory().forEach((item) => {
    const sectionCode = TAB_TO_SECTION_CODE[item.tabKey];
    const targetSection = TAB_TO_SECTION_CODE[item.targetTabKey];
    if (!sectionCode || !targetSection) return;
    let field = item.field;
    let kind = item.kind;
    if (field === 'stealth_target') field = 'stealthTargets';
    if (field === 'legal_unit_telepad') field = 'legalUnitTelepads';
    if (field === 'legal_building_telepad') field = 'legalBuildingTelepads';
    if (field === 'performance_of_this_government_versus_government_*') field = 'relations';
    if (field === 'availableto') field = 'availableTo';
    items.push({
      id: `delete-${targetSection.toLowerCase()}-${sectionCode.toLowerCase()}-${String(field).toLowerCase()}`,
      targetSection,
      sectionCode,
      field,
      kind
    });
  });

  Object.entries(BIQ_STRUCTURE_RULE_SCHEMAS).forEach(([sectionCode, schema]) => {
    Object.keys((schema && schema.fields) || {}).forEach((field) => {
      const spec = getBiqStructureRefSpec(sectionCode, field);
      if (!spec || !spec.section) return;
      items.push({
        id: `delete-${String(spec.section).toLowerCase()}-${String(sectionCode).toLowerCase()}-${String(field).toLowerCase()}`,
        targetSection: String(spec.section).toUpperCase(),
        sectionCode: String(sectionCode).toUpperCase(),
        field,
        kind: 'scalar'
      });
    });
  });

  items.push(...DELETE_COMPLEX_SPECIAL_CASES.map((item) => ({
    id: `delete-${item.targetSection.toLowerCase()}-${item.sectionCode.toLowerCase()}-${String(item.field).toLowerCase()}`,
    ...item
  })));

  const deduped = new Map();
  items.forEach((item) => {
    deduped.set(makeDeleteSignature(item), item);
  });
  return Array.from(deduped.values())
    .sort((a, b) => makeDeleteSignature(a).localeCompare(makeDeleteSignature(b)));
}

const GENERATED_IMPORT_REFERENCE_INVENTORY = buildGeneratedImportReferenceInventory();
const GENERATED_DELETE_REFERENCE_INVENTORY = buildGeneratedDeleteReferenceInventory();

module.exports = {
  GENERATED_IMPORT_REFERENCE_INVENTORY,
  GENERATED_DELETE_REFERENCE_INVENTORY,
  makeImportSignature,
  makeDeleteSignature
};
