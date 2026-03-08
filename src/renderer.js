const state = {
  settings: null,
  bundle: null,
  activeTab: 'base',
  baseFilter: '',
  sectionSelection: {
    districts: 0,
    wonders: 0,
    naturalWonders: 0,
    animations: 0
  }
};

const el = {
  modeGlobal: document.getElementById('mode-global'),
  modeScenario: document.getElementById('mode-scenario'),
  c3xPath: document.getElementById('c3x-path'),
  civ3Path: document.getElementById('civ3-path'),
  scenarioPath: document.getElementById('scenario-path'),
  scenarioPathRow: document.getElementById('scenario-path-row'),
  pickC3x: document.getElementById('pick-c3x'),
  pickCiv3: document.getElementById('pick-civ3'),
  pickScenario: document.getElementById('pick-scenario'),
  loadBtn: document.getElementById('load-btn'),
  saveBtn: document.getElementById('save-btn'),
  status: document.getElementById('status'),
  workspace: document.getElementById('workspace'),
  tabs: document.getElementById('tabs'),
  tabContent: document.getElementById('tab-content')
};

const DIRECTION_OPTIONS = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north'];
const TERRAIN_OPTIONS = ['desert', 'plains', 'grassland', 'jungle', 'tundra', 'floodplain', 'swamp', 'hill', 'mountain', 'forest', 'volcano', 'snow-forest', 'snow-mountain', 'snow-volcano', 'coast', 'sea', 'ocean'];
const TAB_ICONS = {
  base: 'icon-c3x',
  districts: 'icon-district',
  wonders: 'icon-wonder',
  naturalWonders: 'icon-natural',
  animations: 'icon-anim'
};

const BASE_ENUM_OPTIONS = {
  draw_lines_using_gdi_plus: ['never', 'wine', 'always'],
  double_minimap_size: ['never', 'always', 'high-def'],
  unit_cycle_search_criteria: ['standard', 'similar-near-start', 'similar-near-destination'],
  day_night_cycle_mode: ['off', 'timer', 'user-time', 'every-turn', 'specified'],
  seasonal_cycle_mode: ['off', 'timer', 'user-season', 'every-turn', 'on-day-night-hour', 'specified']
};

const BASE_STRUCTURED_LIST_FIELDS = new Set([
  'limit_units_per_tile',
  'production_perfume',
  'perfume_specs',
  'technology_perfume',
  'government_perfume',
  'building_prereqs_for_units',
  'buildings_generating_resources',
  'ai_multi_start_extra_palaces'
]);

const BASE_FIELD_DETAILS = {
  enable_districts: 'Master toggle for district systems.',
  enable_wonder_districts: 'Enables the wonder district layer.',
  enable_natural_wonders: 'Enables natural wonder systems and placement.',
  enable_custom_animations: 'Enables tile animation configs.',
  minimum_natural_wonder_separation: 'Minimum tile distance between natural wonders.',
  draw_lines_using_gdi_plus: 'Line rendering strategy.'
};

const SECTION_SCHEMAS = {
  districts: {
    marker: '#District',
    entityName: 'District',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'District Name', desc: 'Internal unique district name.', type: 'text', required: true },
      { key: 'display_name', label: 'Display Name', desc: 'Name shown in UI.', type: 'text' },
      { key: 'tooltip', label: 'Tooltip Text', desc: 'Shown on worker command hover.', type: 'text' },
      { key: 'img_paths', label: 'Image Paths', desc: 'Comma list of district PCX files.', type: 'text' },
      { key: 'btn_tile_sheet_row', label: 'Button Tile Row', desc: 'Row index in district button sheet.', type: 'number' },
      { key: 'btn_tile_sheet_column', label: 'Button Tile Column', desc: 'Column index in district button sheet.', type: 'number' },
      { key: 'advance_prereqs', label: 'Tech Prerequisites', desc: 'Comma list of advance names.', type: 'text' },
      { key: 'dependent_improvs', label: 'Dependent Improvements', desc: 'Comma list of city improvements this district unlocks.', type: 'text' },
      { key: 'buildable_on', label: 'Buildable Terrain', desc: 'Comma list of allowed terrain.', type: 'text' },
      { key: 'buildable_adjacent_to', label: 'Adjacency Requirement', desc: 'Comma list of required adjacent terrain/city.', type: 'text' },
      { key: 'allow_multiple', label: 'Allow Multiple', desc: 'Allow multiple copies per city.', type: 'bool' },
      { key: 'vary_img_by_era', label: 'Vary Art By Era', desc: 'Use era-specific rows in art.', type: 'bool' },
      { key: 'vary_img_by_culture', label: 'Vary Art By Culture', desc: 'Use culture-variant image set.', type: 'bool' },
      { key: 'draw_over_resources', label: 'Draw Over Resources', desc: 'Draw district art above map resources.', type: 'bool' },
      { key: 'defense_bonus_percent', label: 'Defense Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'culture_bonus', label: 'Culture Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'science_bonus', label: 'Science Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'food_bonus', label: 'Food Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'gold_bonus', label: 'Gold Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'shield_bonus', label: 'Shield Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' },
      { key: 'happiness_bonus', label: 'Happiness Bonus', desc: 'Base + conditional bonus syntax.', type: 'text' }
    ],
    template: {
      name: 'New District',
      tooltip: 'Build New District',
      buildable_on: 'desert,plains,grassland,tundra,floodplain,hill',
      allow_multiple: '1'
    }
  },
  wonders: {
    marker: '#Wonder',
    entityName: 'Wonder District',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Wonder Name', desc: 'Must match the in-game wonder improvement name.', type: 'text', required: true },
      { key: 'buildable_on', label: 'Buildable Terrain', desc: 'Comma list of allowed terrain.', type: 'text' },
      { key: 'buildable_adjacent_to', label: 'Adjacency Requirement', desc: 'Comma list of adjacent terrain/city.', type: 'text' },
      { key: 'buildable_only_on_rivers', label: 'River Required', desc: 'Require wonder tile to be on a river.', type: 'bool' },
      { key: 'img_path', label: 'Image Path', desc: 'District wonder art PCX file.', type: 'text' },
      { key: 'img_construct_row', label: 'Construct Row', desc: 'Construction art row index.', type: 'number', required: true },
      { key: 'img_construct_column', label: 'Construct Column', desc: 'Construction art column index.', type: 'number', required: true },
      { key: 'img_row', label: 'Completed Row', desc: 'Completed wonder art row index.', type: 'number', required: true },
      { key: 'img_column', label: 'Completed Column', desc: 'Completed wonder art column index.', type: 'number', required: true },
      { key: 'enable_img_alt_dir', label: 'Enable Alt Direction Art', desc: 'Use alternate directional art set.', type: 'bool' }
    ],
    template: {
      name: 'New Wonder',
      img_path: 'Wonders.pcx',
      img_construct_row: '0',
      img_construct_column: '0',
      img_row: '0',
      img_column: '1'
    }
  },
  naturalWonders: {
    marker: '#Wonder',
    entityName: 'Natural Wonder',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Wonder Name', desc: 'Unique natural wonder identifier.', type: 'text', required: true },
      { key: 'terrain_type', label: 'Terrain Type', desc: 'Primary terrain for this wonder.', type: 'select', options: TERRAIN_OPTIONS, required: true },
      { key: 'adjacent_to', label: 'Adjacent To', desc: 'Optional adjacency terrain or river.', type: 'select', options: ['any', 'river', ...TERRAIN_OPTIONS] },
      { key: 'adjacency_dir', label: 'Adjacency Direction', desc: 'Optional direction for adjacency check.', type: 'select', options: DIRECTION_OPTIONS },
      { key: 'img_path', label: 'Image Path', desc: 'Natural wonder PCX filename.', type: 'text', required: true },
      { key: 'img_row', label: 'Image Row', desc: 'Sprite row index in PCX.', type: 'number', required: true },
      { key: 'img_column', label: 'Image Column', desc: 'Sprite column index in PCX.', type: 'number', required: true },
      { key: 'culture_bonus', label: 'Culture Bonus', desc: 'Worked-tile culture bonus.', type: 'number' },
      { key: 'science_bonus', label: 'Science Bonus', desc: 'Worked-tile science bonus.', type: 'number' },
      { key: 'food_bonus', label: 'Food Bonus', desc: 'Worked-tile food bonus.', type: 'number' },
      { key: 'gold_bonus', label: 'Gold Bonus', desc: 'Worked-tile gold bonus.', type: 'number' },
      { key: 'shield_bonus', label: 'Shield Bonus', desc: 'Worked-tile shield bonus.', type: 'number' },
      { key: 'happiness_bonus', label: 'Happiness Bonus', desc: 'Worked-tile happiness bonus.', type: 'number' },
      { key: 'impassible', label: 'Impassible', desc: 'Disallow movement through tile.', type: 'bool' },
      { key: 'impassible_to_wheeled', label: 'Impassible To Wheeled', desc: 'Disallow wheeled movement unless connected.', type: 'bool' },
      { key: 'animation', label: 'Animation Item', desc: 'Natural wonder animation spec string.', type: 'text', multi: true }
    ],
    template: {
      name: 'New Natural Wonder',
      terrain_type: 'grassland',
      img_path: 'NaturalWonders.pcx',
      img_row: '0',
      img_column: '0'
    }
  },
  animations: {
    marker: '#Animation',
    entityName: 'Tile Animation',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Animation Name', desc: 'Unique animation identifier.', type: 'text', required: true },
      { key: 'ini_path', label: 'INI Path', desc: 'Relative to Art/Animations/.', type: 'text', required: true },
      { key: 'type', label: 'Animation Type', desc: 'Rule type controlling where this animation can appear.', type: 'select', options: ['terrain', 'resource', 'pcx', 'coastal-wave'], required: true },
      { key: 'resource_type', label: 'Resource Type', desc: 'Required for type=resource.', type: 'text' },
      { key: 'pcx_file', label: 'PCX File', desc: 'Required for type=pcx.', type: 'select', options: ['deltaRivers.pcx', 'floodplains.pcx', 'LMHills.pcx', 'Mountains.pcx', 'Mountains-snow.pcx', 'mtnRivers.pcx', 'Volcanos.pcx', 'Volcanos-snow.pcx', 'waterfalls.pcx', 'xhills.pcx'] },
      { key: 'pcx_index', label: 'PCX Index', desc: 'Required for type=pcx.', type: 'number' },
      { key: 'terrain_types', label: 'Terrain Types', desc: 'Comma list; required for type=terrain.', type: 'text' },
      { key: 'adjacent_to', label: 'Adjacent To', desc: 'Optional terrain:direction list.', type: 'text' },
      { key: 'direction', label: 'Direction Override', desc: 'Optional fixed facing direction.', type: 'select', options: DIRECTION_OPTIONS },
      { key: 'x_offset', label: 'X Offset', desc: 'Horizontal pixel offset.', type: 'number' },
      { key: 'y_offset', label: 'Y Offset', desc: 'Vertical pixel offset.', type: 'number' },
      { key: 'frame_time_seconds', label: 'Frame Time', desc: 'Per-frame seconds.', type: 'text' },
      { key: 'show_in_day_night_hours', label: 'Day/Night Hours', desc: 'Hour list/ranges where animation appears.', type: 'text' },
      { key: 'show_in_seasons', label: 'Seasons', desc: 'Comma list: spring, summer, fall, winter.', type: 'text' }
    ],
    template: {
      name: 'New Animation',
      ini_path: 'Terrain\\Wave\\Wave.INI',
      type: 'terrain',
      terrain_types: 'grassland'
    }
  }
};

function setStatus(text, isError = false) {
  el.status.textContent = text;
  el.status.style.color = isError ? '#a13514' : '';
}

function isScenarioMode() {
  return state.settings && state.settings.mode === 'scenario';
}

function setMode(mode) {
  state.settings.mode = mode;
  el.modeGlobal.classList.toggle('active', mode === 'global');
  el.modeScenario.classList.toggle('active', mode === 'scenario');
  el.scenarioPathRow.classList.toggle('hidden', mode !== 'scenario');
  document.body.classList.toggle('mode-standard', mode === 'global');
  document.body.classList.toggle('mode-scenario', mode === 'scenario');
}

function syncSettingsFromInputs() {
  state.settings.c3xPath = el.c3xPath.value.trim();
  state.settings.civ3ConquestsPath = el.civ3Path.value.trim();
  state.settings.scenarioPath = el.scenarioPath.value.trim();
}

function fillInputsFromSettings() {
  el.c3xPath.value = state.settings.c3xPath || '';
  el.civ3Path.value = state.settings.civ3ConquestsPath || '';
  el.scenarioPath.value = state.settings.scenarioPath || '';
}

function prettySourceLabel(source) {
  if (!source) return 'unknown';
  return source.replace('+', ' -> ');
}

function toFriendlyKey(key) {
  return key.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function createBaseMeta(row) {
  const meta = document.createElement('div');
  meta.className = 'field-meta';
  const desc = BASE_FIELD_DETAILS[row.key] || '';
  meta.textContent = desc ? `${row.key} - ${desc}` : row.key;
  return meta;
}

function createIcon(className) {
  const icon = document.createElement('span');
  icon.className = `tab-icon ${className || ''}`.trim();
  return icon;
}

function tokenizeListPreservingQuotes(text) {
  const items = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (!inQuotes && (ch === ',' || ch === '\n' || ch === '\r')) {
      const t = cur.trim();
      if (t) items.push(t);
      cur = '';
      continue;
    }
    cur += ch;
  }
  const tail = cur.trim();
  if (tail) items.push(tail);
  return items;
}

function parseStructuredEntries(value) {
  let v = String(value || '').trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    v = v.slice(1, -1).trim();
  }
  if (!v) return [];
  return tokenizeListPreservingQuotes(v);
}

function serializeStructuredEntries(entries) {
  const cleaned = entries.map((e) => String(e || '').trim()).filter(Boolean);
  return cleaned.length > 0 ? `[${cleaned.join(', ')}]` : '';
}

function isStructuredBaseField(row) {
  if (BASE_STRUCTURED_LIST_FIELDS.has(row.key)) {
    return true;
  }
  const v = String(row.value || '').trim();
  return v.startsWith('[') && v.endsWith(']');
}

function makeInputForBaseRow(row, onChange) {
  if (isStructuredBaseField(row)) {
    const wrap = document.createElement('div');
    wrap.className = 'structured-list';

    let entries = parseStructuredEntries(row.value);
    if (entries.length === 0) {
      entries = [''];
    }

    const renderEntries = () => {
      wrap.innerHTML = '';
      entries.forEach((entry, idx) => {
        const line = document.createElement('div');
        line.className = 'kv-row compact';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'item';
        input.value = entry;
        input.addEventListener('input', () => {
          entries[idx] = input.value;
          onChange(serializeStructuredEntries(entries));
        });

        const del = document.createElement('button');
        del.textContent = 'Remove';
        del.addEventListener('click', () => {
          entries.splice(idx, 1);
          if (entries.length === 0) entries.push('');
          onChange(serializeStructuredEntries(entries));
          renderEntries();
        });

        line.appendChild(input);
        line.appendChild(del);
        wrap.appendChild(line);
      });

      const add = document.createElement('button');
      add.textContent = 'Add Item';
      add.addEventListener('click', () => {
        entries.push('');
        onChange(serializeStructuredEntries(entries));
        renderEntries();
      });
      wrap.appendChild(add);
    };

    onChange(serializeStructuredEntries(entries));
    renderEntries();
    return wrap;
  }

  if (row.type === 'boolean') {
    const select = document.createElement('select');
    const t = document.createElement('option');
    t.value = 'true';
    t.textContent = 'Enabled';
    const f = document.createElement('option');
    f.value = 'false';
    f.textContent = 'Disabled';
    select.appendChild(t);
    select.appendChild(f);
    select.value = String(row.value).trim().toLowerCase() === 'false' ? 'false' : 'true';
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  const enumOptions = BASE_ENUM_OPTIONS[row.key];
  if (enumOptions && enumOptions.length > 0) {
    const select = document.createElement('select');
    enumOptions.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    select.value = row.value;
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  const input = document.createElement('input');
  input.type = row.type === 'integer' ? 'number' : 'text';
  input.value = row.value;
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function renderBaseTab(tab) {
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS.base));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = 'C3X core settings for this mode. Most fields are typed; plain text appears only when a setting is truly free-form.';
  wrap.appendChild(helper);

  if (isScenarioMode()) {
    const warning = document.createElement('p');
    warning.className = 'warning';
    warning.textContent = 'C3X precedence for this tab: default -> scenario -> custom. Global custom may still override scenario values.';
    wrap.appendChild(warning);
  }

  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.placeholder = 'Filter settings...';
  filterInput.value = state.baseFilter;
  filterInput.addEventListener('input', () => {
    state.baseFilter = filterInput.value;
    renderActiveTab();
  });
  filterRow.appendChild(filterInput);
  wrap.appendChild(filterRow);

  const table = document.createElement('div');
  table.className = 'base-table';

  const needle = state.baseFilter.trim().toLowerCase();
  const filteredRows = needle
    ? tab.rows.filter((r) => r.key.toLowerCase().includes(needle))
    : tab.rows;

  for (const row of filteredRows) {
    const r = document.createElement('div');
    r.className = 'base-row';

    const keyWrap = document.createElement('div');
    keyWrap.className = 'base-key-wrap';

    const keyTitle = document.createElement('div');
    keyTitle.className = 'base-key';
    keyTitle.textContent = toFriendlyKey(row.key);
    keyWrap.appendChild(keyTitle);
    keyWrap.appendChild(createBaseMeta(row));

    r.appendChild(keyWrap);

    const input = makeInputForBaseRow(row, (newValue) => {
      row.value = String(newValue);
    });
    r.appendChild(input);

    table.appendChild(r);
  }

  wrap.appendChild(table);
  return wrap;
}

function getFieldValues(section, key) {
  return section.fields.filter((f) => f.key === key).map((f) => f.value || '');
}

function setSingleFieldValue(section, key, value) {
  section.fields = section.fields.filter((f) => f.key !== key);
  if (value !== '') {
    section.fields.push({ key, value });
  }
}

function setMultiFieldValues(section, key, values) {
  section.fields = section.fields.filter((f) => f.key !== key);
  for (const value of values) {
    if (value !== '') {
      section.fields.push({ key, value });
    }
  }
}

function getSectionTitle(section, schema, index) {
  const titleField = section.fields.find((f) => f.key === schema.titleKey);
  if (titleField && titleField.value) {
    return titleField.value;
  }
  return `${schema.entityName} ${index + 1}`;
}

function createFieldInput(schemaField, value, onChange) {
  if (schemaField.type === 'bool') {
    const select = document.createElement('select');
    ['1', '0'].forEach((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v === '1' ? 'Enabled' : 'Disabled';
      select.appendChild(o);
    });
    select.value = String(value || '').trim() === '0' ? '0' : '1';
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  if (schemaField.type === 'select') {
    const select = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '(not set)';
    select.appendChild(empty);
    (schemaField.options || []).forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    select.value = value || '';
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  const input = document.createElement('input');
  input.type = schemaField.type === 'number' ? 'number' : 'text';
  input.value = value || '';
  input.placeholder = schemaField.required ? 'required' : '';
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function renderKnownField(section, schemaField) {
  const row = document.createElement('div');
  row.className = 'form-row';

  const label = document.createElement('label');
  label.className = 'field-label';
  label.textContent = schemaField.label + (schemaField.required ? ' *' : '');
  row.appendChild(label);

  const meta = document.createElement('div');
  meta.className = 'field-meta';
  meta.textContent = schemaField.desc ? `${schemaField.key} - ${schemaField.desc}` : schemaField.key;
  row.appendChild(meta);

  const values = getFieldValues(section, schemaField.key);

  if (schemaField.multi) {
    const multiWrap = document.createElement('div');
    multiWrap.className = 'multi-value-group';

    const list = values.length > 0 ? values : [''];
    list.forEach((current, idx) => {
      const line = document.createElement('div');
      line.className = 'kv-row compact';

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'item';
      input.value = current;
      input.addEventListener('input', () => {
        const next = [...list];
        next[idx] = input.value;
        setMultiFieldValues(section, schemaField.key, next);
      });

      const del = document.createElement('button');
      del.textContent = 'Remove';
      del.addEventListener('click', () => {
        const next = [...list];
        next.splice(idx, 1);
        setMultiFieldValues(section, schemaField.key, next);
        renderActiveTab();
      });

      line.appendChild(input);
      line.appendChild(del);
      multiWrap.appendChild(line);
    });

    const add = document.createElement('button');
    add.textContent = `Add ${schemaField.label}`;
    add.addEventListener('click', () => {
      setMultiFieldValues(section, schemaField.key, [...list, '']);
      renderActiveTab();
    });

    row.appendChild(multiWrap);
    row.appendChild(add);
    return row;
  }

  const input = createFieldInput(schemaField, values[0] || '', (newValue) => {
    setSingleFieldValue(section, schemaField.key, String(newValue || '').trim());
  });
  row.appendChild(input);

  return row;
}

function renderAdvancedFields(section, schemaKeys) {
  const wrap = document.createElement('details');
  wrap.className = 'advanced-wrap';

  const summary = document.createElement('summary');
  summary.textContent = 'Advanced fields';
  wrap.appendChild(summary);

  const unknownFields = section.fields.filter((f) => !schemaKeys.has(f.key));

  const list = document.createElement('div');
  list.className = 'kv-grid';
  unknownFields.forEach((field, idx) => {
    const row = document.createElement('div');
    row.className = 'kv-row compact';

    const keyInput = document.createElement('input');
    keyInput.value = field.key || '';
    keyInput.placeholder = 'config key';
    keyInput.addEventListener('input', () => {
      field.key = keyInput.value;
    });

    const valueInput = document.createElement('input');
    valueInput.value = field.value || '';
    valueInput.placeholder = 'value';
    valueInput.addEventListener('input', () => {
      field.value = valueInput.value;
    });

    const del = document.createElement('button');
    del.textContent = 'Remove';
    del.addEventListener('click', () => {
      const allUnknown = section.fields.filter((f) => !schemaKeys.has(f.key));
      const target = allUnknown[idx];
      const pos = section.fields.indexOf(target);
      if (pos >= 0) {
        section.fields.splice(pos, 1);
      }
      renderActiveTab();
    });

    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(del);
    list.appendChild(row);
  });

  const add = document.createElement('button');
  add.textContent = 'Add Advanced Field';
  add.addEventListener('click', () => {
    section.fields.push({ key: '', value: '' });
    renderActiveTab();
  });

  wrap.appendChild(list);
  wrap.appendChild(add);
  return wrap;
}

function createSectionFromTemplate(tabKey) {
  const schema = SECTION_SCHEMAS[tabKey];
  const section = { marker: schema.marker, fields: [], comments: [] };
  for (const [key, value] of Object.entries(schema.template || {})) {
    section.fields.push({ key, value });
  }
  return section;
}

function addSection(tab, tabKey) {
  tab.model.sections.unshift(createSectionFromTemplate(tabKey));
  state.sectionSelection[tabKey] = 0;
  renderActiveTab();
}

function renderSectionTab(tab, tabKey) {
  const schema = SECTION_SCHEMAS[tabKey];
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header sticky';
  header.appendChild(createIcon(TAB_ICONS[tabKey]));
  header.insertAdjacentHTML('beforeend', `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`);

  const addSectionBtn = document.createElement('button');
  addSectionBtn.textContent = `Add ${schema.entityName}`;
  addSectionBtn.className = 'add-section';
  addSectionBtn.addEventListener('click', () => addSection(tab, tabKey));

  header.appendChild(addSectionBtn);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = `${tab.title} editor. Saving writes ${isScenarioMode() ? 'scenario.*' : 'user.*'} files for this tab.`;
  wrap.appendChild(helper);

  const schemaKeys = new Set(schema.fields.map((f) => f.key));
  const selectedIndex = Math.max(0, Math.min(state.sectionSelection[tabKey] || 0, Math.max(0, tab.model.sections.length - 1)));
  state.sectionSelection[tabKey] = selectedIndex;

  const layout = document.createElement('div');
  layout.className = 'entry-layout';

  const listPane = document.createElement('div');
  listPane.className = 'entry-list-pane';
  tab.model.sections.forEach((section, sectionIndex) => {
    const itemBtn = document.createElement('button');
    itemBtn.className = 'entry-list-item';
    itemBtn.classList.toggle('active', sectionIndex === selectedIndex);
    itemBtn.type = 'button';
    itemBtn.innerHTML = `<strong>${getSectionTitle(section, schema, sectionIndex)}</strong><span>${schema.entityName} ${sectionIndex + 1}</span>`;
    itemBtn.addEventListener('click', () => {
      state.sectionSelection[tabKey] = sectionIndex;
      renderActiveTab();
    });
    listPane.appendChild(itemBtn);
  });
  layout.appendChild(listPane);

  const detailPane = document.createElement('div');
  detailPane.className = 'entry-detail-pane';

  if (tab.model.sections.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'section-card';
    empty.innerHTML = `<p class="hint">No ${schema.entityName.toLowerCase()} entries yet.</p>`;
    const addFirst = document.createElement('button');
    addFirst.textContent = `Add ${schema.entityName}`;
    addFirst.addEventListener('click', () => addSection(tab, tabKey));
    empty.appendChild(addFirst);
    detailPane.appendChild(empty);
  } else {
    const section = tab.model.sections[selectedIndex];
    const card = document.createElement('div');
    card.className = 'section-card';

    const top = document.createElement('div');
    top.className = 'section-top';
    top.innerHTML = `<strong>${getSectionTitle(section, schema, selectedIndex)}</strong>`;

    const removeSectionBtn = document.createElement('button');
    removeSectionBtn.textContent = `Remove ${schema.entityName}`;
    removeSectionBtn.addEventListener('click', () => {
      tab.model.sections.splice(selectedIndex, 1);
      state.sectionSelection[tabKey] = Math.max(0, selectedIndex - 1);
      renderActiveTab();
    });
    top.appendChild(removeSectionBtn);
    card.appendChild(top);

    const form = document.createElement('div');
    form.className = 'form-grid';
    schema.fields.forEach((schemaField) => {
      form.appendChild(renderKnownField(section, schemaField));
    });
    card.appendChild(form);
    card.appendChild(renderAdvancedFields(section, schemaKeys));
    detailPane.appendChild(card);
  }

  layout.appendChild(detailPane);
  wrap.appendChild(layout);

  if (isScenarioMode()) {
    const warning = document.createElement('p');
    warning.className = 'warning';
    warning.textContent = 'This tab is replacement-based in Scenario mode: scenario file replaces user/default content.';
    wrap.appendChild(warning);
  }

  return wrap;
}

function renderTabs() {
  el.tabs.innerHTML = '';

  Object.entries(state.bundle.tabs).forEach(([key, tab]) => {
    const button = document.createElement('button');
    button.className = 'tab-btn';
    button.appendChild(createIcon(TAB_ICONS[key]));
    const text = document.createElement('span');
    text.textContent = tab.title;
    button.appendChild(text);
    button.classList.toggle('active', state.activeTab === key);
    button.addEventListener('click', () => {
      state.activeTab = key;
      renderTabs();
      renderActiveTab();
    });
    el.tabs.appendChild(button);
  });
}

function renderActiveTab() {
  el.tabContent.innerHTML = '';
  const tab = state.bundle.tabs[state.activeTab];
  if (!tab) {
    return;
  }

  if (state.activeTab === 'base') {
    el.tabContent.appendChild(renderBaseTab(tab));
  } else {
    el.tabContent.appendChild(renderSectionTab(tab, state.activeTab));
  }
}

async function loadBundleAndRender() {
  syncSettingsFromInputs();
  await window.c3xManager.setSettings(state.settings);

  if (!state.settings.c3xPath) {
    setStatus('Set C3X Folder first.', true);
    return;
  }

  if (state.settings.mode === 'scenario' && !state.settings.scenarioPath) {
    setStatus('Set Scenario Folder in Scenario mode.', true);
    return;
  }

  try {
    const bundle = await window.c3xManager.loadBundle({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      scenarioPath: state.settings.scenarioPath
    });

    state.bundle = bundle;
    state.activeTab = 'base';
    state.baseFilter = '';
    el.workspace.classList.remove('hidden');
    renderTabs();
    renderActiveTab();
    setStatus('Configs loaded.');
  } catch (err) {
    setStatus(`Failed to load configs: ${err.message}`, true);
  }
}

async function saveCurrentBundle() {
  if (!state.bundle) {
    setStatus('Load configs before saving.', true);
    return;
  }

  syncSettingsFromInputs();
  await window.c3xManager.setSettings(state.settings);

  try {
    const res = await window.c3xManager.saveBundle({
      mode: state.settings.mode,
      c3xPath: state.settings.c3xPath,
      scenarioPath: state.settings.scenarioPath,
      tabs: state.bundle.tabs
    });

    if (!res.ok) {
      setStatus('Save failed.', true);
      return;
    }

    const paths = res.saveReport.map((r) => r.path).join(' | ');
    setStatus(`Saved ${res.saveReport.length} file(s): ${paths}`);
  } catch (err) {
    setStatus(`Failed to save: ${err.message}`, true);
  }
}

async function wireBrowseButton(button, input) {
  button.addEventListener('click', async () => {
    const dir = await window.c3xManager.pickDirectory();
    if (!dir) {
      return;
    }
    input.value = dir;
    syncSettingsFromInputs();
    await window.c3xManager.setSettings(state.settings);
  });
}

async function shouldAutoLoad() {
  const hasC3x = await window.c3xManager.pathExists(state.settings.c3xPath);
  if (!hasC3x) {
    return false;
  }
  if (state.settings.mode !== 'scenario') {
    return true;
  }
  return await window.c3xManager.pathExists(state.settings.scenarioPath);
}

async function init() {
  state.settings = await window.c3xManager.getSettings();
  fillInputsFromSettings();
  setMode(state.settings.mode || 'global');

  el.modeGlobal.addEventListener('click', async () => {
    setMode('global');
    await window.c3xManager.setSettings(state.settings);
  });

  el.modeScenario.addEventListener('click', async () => {
    setMode('scenario');
    await window.c3xManager.setSettings(state.settings);
  });

  el.loadBtn.addEventListener('click', loadBundleAndRender);
  el.saveBtn.addEventListener('click', saveCurrentBundle);

  wireBrowseButton(el.pickC3x, el.c3xPath);
  wireBrowseButton(el.pickCiv3, el.civ3Path);
  wireBrowseButton(el.pickScenario, el.scenarioPath);

  setStatus('Choose paths, then load configs.');

  if (await shouldAutoLoad()) {
    await loadBundleAndRender();
  }
}

init();
