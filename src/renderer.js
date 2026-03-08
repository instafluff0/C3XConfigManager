const state = {
  settings: null,
  bundle: null,
  activeTab: 'base',
  baseFilter: ''
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

const SECTION_SCHEMAS = {
  districts: {
    marker: '#District',
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'display_name', label: 'Display Name', type: 'text' },
      { key: 'tooltip', label: 'Tooltip', type: 'text' },
      { key: 'img_paths', label: 'Image Paths (comma list)', type: 'text' },
      { key: 'img_column_count', label: 'Image Column Count', type: 'number' },
      { key: 'btn_tile_sheet_row', label: 'Button Tile Row', type: 'number' },
      { key: 'btn_tile_sheet_column', label: 'Button Tile Column', type: 'number' },
      { key: 'advance_prereqs', label: 'Advance Prereqs (comma list)', type: 'text' },
      { key: 'dependent_improvs', label: 'Dependent Improvements (comma list)', type: 'text' },
      { key: 'buildable_on', label: 'Buildable On (comma list)', type: 'text' },
      { key: 'buildable_adjacent_to', label: 'Buildable Adjacent To (comma list)', type: 'text' },
      { key: 'defense_bonus_percent', label: 'Defense Bonus', type: 'text' },
      { key: 'culture_bonus', label: 'Culture Bonus', type: 'text' },
      { key: 'science_bonus', label: 'Science Bonus', type: 'text' },
      { key: 'food_bonus', label: 'Food Bonus', type: 'text' },
      { key: 'gold_bonus', label: 'Gold Bonus', type: 'text' },
      { key: 'shield_bonus', label: 'Shield Bonus', type: 'text' },
      { key: 'happiness_bonus', label: 'Happiness Bonus', type: 'text' },
      { key: 'allow_multiple', label: 'Allow Multiple', type: 'bool' },
      { key: 'heal_units_in_one_turn', label: 'Heal Units In One Turn', type: 'bool' },
      { key: 'vary_img_by_era', label: 'Vary Image By Era', type: 'bool' },
      { key: 'vary_img_by_culture', label: 'Vary Image By Culture', type: 'bool' },
      { key: 'align_to_coast', label: 'Align To Coast', type: 'bool' },
      { key: 'draw_over_resources', label: 'Draw Over Resources', type: 'bool' }
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
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Wonder Name', type: 'text', required: true },
      { key: 'buildable_on', label: 'Buildable On (comma list)', type: 'text' },
      { key: 'buildable_adjacent_to', label: 'Buildable Adjacent To', type: 'text' },
      { key: 'buildable_only_on_rivers', label: 'Buildable Only On Rivers', type: 'bool' },
      { key: 'img_path', label: 'Image Path', type: 'text' },
      { key: 'img_construct_row', label: 'Construct Row', type: 'number', required: true },
      { key: 'img_construct_column', label: 'Construct Column', type: 'number', required: true },
      { key: 'img_row', label: 'Completed Row', type: 'number', required: true },
      { key: 'img_column', label: 'Completed Column', type: 'number', required: true },
      { key: 'enable_img_alt_dir', label: 'Enable Alt Direction Art', type: 'bool' },
      { key: 'img_alt_dir_construct_row', label: 'Alt Construct Row', type: 'number' },
      { key: 'img_alt_dir_construct_column', label: 'Alt Construct Column', type: 'number' },
      { key: 'img_alt_dir_row', label: 'Alt Completed Row', type: 'number' },
      { key: 'img_alt_dir_column', label: 'Alt Completed Column', type: 'number' },
      { key: 'custom_width', label: 'Custom Width', type: 'number' },
      { key: 'custom_height', label: 'Custom Height', type: 'number' }
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
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Natural Wonder Name', type: 'text', required: true },
      { key: 'terrain_type', label: 'Terrain Type', type: 'text', required: true },
      { key: 'adjacent_to', label: 'Adjacent To', type: 'text' },
      { key: 'adjacency_dir', label: 'Adjacency Direction', type: 'text' },
      { key: 'img_path', label: 'Image Path', type: 'text', required: true },
      { key: 'img_row', label: 'Image Row', type: 'number', required: true },
      { key: 'img_column', label: 'Image Column', type: 'number', required: true },
      { key: 'culture_bonus', label: 'Culture Bonus', type: 'number' },
      { key: 'science_bonus', label: 'Science Bonus', type: 'number' },
      { key: 'food_bonus', label: 'Food Bonus', type: 'number' },
      { key: 'gold_bonus', label: 'Gold Bonus', type: 'number' },
      { key: 'shield_bonus', label: 'Shield Bonus', type: 'number' },
      { key: 'happiness_bonus', label: 'Happiness Bonus', type: 'number' },
      { key: 'impassible', label: 'Impassible', type: 'bool' },
      { key: 'impassible_to_wheeled', label: 'Impassible To Wheeled', type: 'bool' },
      { key: 'animation', label: 'Animation Entry', type: 'text', multi: true }
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
    titleKey: 'name',
    fields: [
      { key: 'name', label: 'Animation Name', type: 'text', required: true },
      { key: 'ini_path', label: 'INI Path', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['terrain', 'resource', 'pcx', 'coastal-wave'], required: true },
      { key: 'resource_type', label: 'Resource Type', type: 'text' },
      { key: 'pcx_file', label: 'PCX File', type: 'text' },
      { key: 'pcx_index', label: 'PCX Index', type: 'number' },
      { key: 'terrain_types', label: 'Terrain Types', type: 'text' },
      { key: 'adjacent_to', label: 'Adjacent To', type: 'text' },
      { key: 'direction', label: 'Direction', type: 'text' },
      { key: 'x_offset', label: 'X Offset', type: 'number' },
      { key: 'y_offset', label: 'Y Offset', type: 'number' },
      { key: 'frame_time_seconds', label: 'Frame Time Seconds', type: 'text' },
      { key: 'show_in_day_night_hours', label: 'Show In Day/Night Hours', type: 'text' },
      { key: 'show_in_seasons', label: 'Show In Seasons', type: 'text' }
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

function makeInputForBaseRow(row, onChange) {
  if (row.type === 'boolean') {
    const select = document.createElement('select');
    const t = document.createElement('option');
    t.value = 'true';
    t.textContent = 'true';
    const f = document.createElement('option');
    f.value = 'false';
    f.textContent = 'false';
    select.appendChild(t);
    select.appendChild(f);
    select.value = String(row.value).trim().toLowerCase() === 'false' ? 'false' : 'true';
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
  header.className = 'section-editor-header';
  header.innerHTML = `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`;
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = 'These are the effective base settings for this scope. Edit values directly; saving writes only non-default overrides for this scope.';
  wrap.appendChild(helper);

  if (isScenarioMode()) {
    const warning = document.createElement('p');
    warning.className = 'warning';
    warning.textContent = 'Base config precedence in C3X is default -> scenario -> custom. Global custom keys can still override scenario keys.';
    wrap.appendChild(warning);
  }

  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.placeholder = 'Filter settings by key...';
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

    const key = document.createElement('div');
    key.className = 'base-key';
    key.textContent = row.key;
    r.appendChild(key);

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
  return `${schema.marker} ${index + 1}`;
}

function createFieldInput(schemaField, value, onChange) {
  if (schemaField.type === 'bool') {
    const select = document.createElement('select');
    ['1', '0'].forEach((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v === '1' ? 'Enabled (1)' : 'Disabled (0)';
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
    empty.textContent = '(none)';
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
  label.textContent = schemaField.label;
  if (schemaField.required) {
    label.textContent += ' *';
  }
  row.appendChild(label);

  const values = getFieldValues(section, schemaField.key);

  if (schemaField.multi) {
    const multiWrap = document.createElement('div');
    multiWrap.className = 'multi-value-group';

    const list = values.length > 0 ? values : [''];
    list.forEach((current, idx) => {
      const line = document.createElement('div');
      line.className = 'kv-row';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = current;
      input.addEventListener('input', () => {
        const next = [...list];
        next[idx] = input.value;
        setMultiFieldValues(section, schemaField.key, next);
      });

      const del = document.createElement('button');
      del.textContent = 'Delete';
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
    add.textContent = 'Add Value';
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
  summary.textContent = 'Advanced fields (rarely needed)';
  wrap.appendChild(summary);

  const unknownFields = section.fields.filter((f) => !schemaKeys.has(f.key));

  const list = document.createElement('div');
  list.className = 'kv-grid';
  unknownFields.forEach((field, idx) => {
    const row = document.createElement('div');
    row.className = 'kv-row';

    const keyInput = document.createElement('input');
    keyInput.value = field.key || '';
    keyInput.placeholder = 'key';
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
    del.textContent = 'Delete';
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

function renderSectionTab(tab, tabKey) {
  const schema = SECTION_SCHEMAS[tabKey];
  const wrap = document.createElement('div');
  wrap.className = 'section-editor';

  const header = document.createElement('div');
  header.className = 'section-editor-header';
  header.innerHTML = `<h3>${tab.title}</h3><span class="source-tag">effective: ${prettySourceLabel(tab.effectiveSource)}</span>`;

  const addSectionBtn = document.createElement('button');
  addSectionBtn.textContent = 'Add Block';
  addSectionBtn.className = 'add-section';
  addSectionBtn.addEventListener('click', () => {
    tab.model.sections.push(createSectionFromTemplate(tabKey));
    renderActiveTab();
  });

  header.appendChild(addSectionBtn);
  wrap.appendChild(header);

  const helper = document.createElement('p');
  helper.className = 'hint';
  helper.textContent = `Structured editor for ${tab.title}. This writes ${isScenarioMode() ? 'scenario.*' : 'user/custom.*'} files directly.`;
  wrap.appendChild(helper);

  const list = document.createElement('div');
  list.className = 'section-list';

  const schemaKeys = new Set(schema.fields.map((f) => f.key));

  tab.model.sections.forEach((section, sectionIndex) => {
    const card = document.createElement('div');
    card.className = 'section-card';

    const top = document.createElement('div');
    top.className = 'section-top';

    const title = document.createElement('strong');
    title.textContent = getSectionTitle(section, schema, sectionIndex);

    const removeSectionBtn = document.createElement('button');
    removeSectionBtn.textContent = 'Remove Block';
    removeSectionBtn.addEventListener('click', () => {
      tab.model.sections.splice(sectionIndex, 1);
      renderActiveTab();
    });

    top.appendChild(title);
    top.appendChild(removeSectionBtn);
    card.appendChild(top);

    const form = document.createElement('div');
    form.className = 'form-grid';

    schema.fields.forEach((schemaField) => {
      form.appendChild(renderKnownField(section, schemaField));
    });

    card.appendChild(form);
    card.appendChild(renderAdvancedFields(section, schemaKeys));
    list.appendChild(card);
  });

  wrap.appendChild(list);

  if (isScenarioMode()) {
    const warning = document.createElement('p');
    warning.className = 'warning';
    warning.textContent = 'In Scenario Scope, this file type fully replaces user/default definitions in C3X.';
    wrap.appendChild(warning);
  }

  return wrap;
}

function renderTabs() {
  el.tabs.innerHTML = '';

  Object.entries(state.bundle.tabs).forEach(([key, tab]) => {
    const button = document.createElement('button');
    button.className = 'tab-btn';
    button.textContent = tab.title;
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
    setStatus('Set Scenario Folder in Scenario Scope.', true);
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
}

init();
