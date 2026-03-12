# agents.md

## Scope
This folder contains an Electron app (`Civ 3 | C3X Modern Configuration Manager`) for managing C3X config files in a UI. As you learn new key elements and fundamental quirks of Civ 3, C3X, BIQ & text files, summarize them here and keep this document alive so future agents don't need to relearn them. If this document becomes out of data based on new information, or long, unwieldy, or contradictory, be sure to update it.

## Ground Truth From C3X Parsing
Behavior is based on `injected_code.c`:

1. Base config (`*.c3x_config.ini`)
- Files loaded in order: `default.c3x_config.ini`, then `scenario.c3x_config.ini` (if found), then `custom.c3x_config.ini`.
- This is cumulative key override, not full replacement.
- Effective precedence is `custom > scenario > default`.

2. District config (`*.districts_config.txt`)
- Files attempted in order: `default`, `user`, `scenario`.
- Each call uses `drop_existing_configs = 1`, so each successful file fully resets all previous district definitions.
- Effective precedence is full replacement: `scenario` if present, else `user`, else `default`.

3. Wonder district config (`*.districts_wonders_config.txt`)
- Same replacement behavior as districts.
- Effective precedence: `scenario` > `user` > `default`.

4. Natural wonder config (`*.districts_natural_wonders_config.txt`)
- Same replacement behavior as districts.
- Effective precedence: `scenario` > `user` > `default`.

5. Tile animation config (`*.tile_animations.txt`)
- Same replacement behavior as districts.
- Effective precedence: `scenario` > `user` > `default`.
- Natural wonder animation entries are appended at runtime after load.

## App File Mapping
Global scope writes:
- Base: `custom.c3x_config.ini`
- Districts: `user.districts_config.txt`
- Wonders: `user.districts_wonders_config.txt`
- Natural Wonders: `user.districts_natural_wonders_config.txt`
- Animations: `user.tile_animations.txt`

Scenario scope writes:
- Base: `scenario.c3x_config.ini`
- Districts: `scenario.districts_config.txt`
- Wonders: `scenario.districts_wonders_config.txt`
- Natural Wonders: `scenario.districts_natural_wonders_config.txt`
- Animations: `scenario.tile_animations.txt`

## Runtime Architecture
- Process split:
  - Main process: `main.js`
  - Renderer UI: `src/renderer.js`
  - Config parsing/serialization: `src/configCore.js`
  - Art decoding/previews: `src/artPreview.js`
- IPC surface in preload:
  - `getSettings`, `setSettings`
  - `loadBundle`, `saveBundle`
  - `getPreview`
  - `pickDirectory`, `pickFile`, `pathExists`

## Path Behavior
- Settings are persisted in Electron `userData/settings.json`.
- On app load, paths are inferred if missing:
  - C3X path candidates include app-adjacent `C3X` folders and app/parent dirs containing `default.c3x_config.ini`.
  - Civilization III path defaults to app grandparent when app parent is `Conquests`, or C3X grandparent when C3X parent is `Conquests`.
- If inferred/saved paths exist, app auto-loads configs.

## Civilopedia Data Ground Truth
- Standard Game read-only tabs are driven by layered text sources under the Civ3 root:
  - Vanilla: `Text/Civilopedia.txt` + `Text/PediaIcons.txt`
  - PTW: `civ3PTW/Text/Civilopedia.txt` + `civ3PTW/Text/PediaIcons.txt`
  - Conquests: `Conquests/Text/Civilopedia.txt` + `Conquests/Text/PediaIcons.txt`
- Layer precedence is key-based override: `Conquests > civ3PTW > vanilla`.
  - If the same `#KEY` block exists in multiple layers, the highest layer wins.
- Entity tabs and keys:
  - `Civs`: `RACE_*`
  - `Techs`: `TECH_*`
  - `Resources`: `GOOD_*`
  - `Improvements`: `BLDG_*`
  - `Units`: `PRTO_*`
- Civilopedia text structure:
  - `#PRTO_*`, `#TECH_*`, `#GOOD_*`, `#RACE_*` blocks are short overview/usage text.
  - Long encyclopedia text is under `#DESC_<KEY>` blocks.
  - Display names should be derived from keys (not first prose lines).
- PediaIcons mapping used by app:
  - Icons: `#ICON_<KEY>` (usually large then small path lines).
  - Techs are a special case in `PediaIcons.txt`: `#TECH_*` and `#TECH_*_LARGE` (not `#ICON_TECH_*`).
  - Unit animation folder indirection: `#ANIMNAME_PRTO_*`.
  - Unit era variants are represented as distinct keys like `PRTO_WORKER_ERAS_Industrial_Age` with matching `#ANIMNAME_PRTO_WORKER_ERAS_Industrial_Age` blocks; when an era-specific `ANIMNAME` block is missing, fallback should use the base `#ANIMNAME_PRTO_WORKER`.
  - Civilization portraits: `#RACE_*` block in `PediaIcons.txt`.
- Art/path resolution for read-only previews follows same precedence:
  - `Conquests/Art` first, then `civ3PTW/Art`, then base `Art`.

## UI/Editing Behavior
- Mode labels in UI are:
  - `Standard Game` (global)
  - `Scenario`
- Base C3X tab:
  - Grouped by doc sections parsed from default config comments.
  - Sticky search row.
  - Full descriptions shown by default under each field.
  - Typed editors where possible (booleans/selects/structured forms) instead of raw strings.
  - Shows an explicit active target file card with mode-aware file/path:
    - Standard Game: edits `custom.c3x_config.ini`
    - Scenario: edits `scenario.c3x_config.ini`
  - Shows a visible override chain line:
    - Standard: `default (read-only) -> custom (editable)`
    - Scenario: `default (read-only) -> custom -> scenario (editable)`
  - Field metadata includes source provenance (`default/custom/scenario`) for effective values.
  - Save button label in the base tab is mode-aware (`Save to custom...` / `Save to scenario...`).
  - If the active base target file is missing and base settings are dirty, first save prompts confirmation before creating the target override file.
- Structured base fields currently include:
  - `limit_units_per_tile`
  - perfume families (`production_perfume`, `perfume_specs`, `technology_perfume`, `government_perfume`)
  - `building_prereqs_for_units`
  - `buildings_generating_resources`
  - `ai_multi_start_extra_palaces`
- Section tabs (Districts, Wonder Districts, Natural Wonders, Tile Animations):
  - Left list + detail editor.
  - Adding new entries inserts at top (`unshift`).
  - Title in left list syncs live when the name/title field changes.
  - Known fields are schema-driven; unknown fields remain editable under `Advanced fields`.
- Units animation editing safety:
  - Era variants now use a compact variant selector in the Unit Animations panel.
  - Scenario save blocks unresolved new unit animation folder references when the animation key was edited in the unit panel and no valid/resolvable INI path is available.
- BIQ reference picker behavior:
  - Some scenarios contain duplicate BIQ records with the same `civilopediaentry` (for example duplicate `PRTO_*` unit keys).
  - Rules/structure reference pickers are index-based (BIQ record IDs), while reference tabs are key-based (`PRTO_*`, `TECH_*`, etc.) and can collapse duplicates.
  - Duplicate picker labels are disambiguated with BIQ record IDs (for example `City Builder [ID 47]`), and thumbnail fallback may resolve by Civilopedia key when index mapping is missing.
- Reference entity key editing:
  - New scenario entries (`isNew`) across reference tabs can edit their Civilopedia key inline in the Identity row.
  - Existing entries keep key locks by default; key changes for those require explicit rename ops (not inline free-edit).
  - New-entry key edits must flow through `renamePendingReferenceEntryKey` / `renameReferenceEntryKey` so BIQ `recordOps` references (`newRecordRef`/`recordRef`) stay synchronized.
  - Key generation/rename now enforces tab-specific Civ3 prefixes (`RACE_`, `TECH_`, `GOOD_`, `BLDG_`, `GOVT_`, `PRTO_`, `GCON_`) and strips wrong typed prefixes before applying the correct one.
  - In editable scenario reference tabs, icon art slots (`Civilopedia Large` / `Civilopedia Small`) render even when `iconPaths` is empty, so newly created entries can immediately set art.
- Scenario Setup UI lock behavior:
  - In Standard Game mode, `Scenario -> Scenario` rich fields (`Title`, `Description`) render read-only.
  - `Scenario Search Folders` is lock-managed: shown as a blue read-only chip, with lock rationale in tooltip (not inline body text).
- Terrain structure safety:
  - `Terrain -> Terrain Types` (`TERR`) must be treated as structurally immutable in the UI (no add/copy/import/delete).
  - Rationale: map tile terrain values are packed/index-coded (`baserealterrain`/`c3cbaserealterrain` use 4-bit terrain IDs), and BIQ bridge structural mutation support/cascades are not implemented for `TERR`, so changing record count/order can desync or corrupt terrain interpretation.

## Art Preview Behavior
- Supported previews:
  - Districts: PCX(s) from `img_paths`
  - Wonder districts: PCX with crop for completed/construction cells
  - Natural wonders: PCX cell + optional animation spec preview
  - Tile animations: INI -> FLC preview
- `src/artPreview.js` responsibilities:
  - Decode 8-bit indexed PCX with 256-color palette.
  - Decode FLC frames (`COLOR_256`, `BYTE_RUN`, `FLI_COPY`, `BLACK` chunks).
  - Resolve art paths under C3X Art folders.
  - Parse INI animation keys (`ATTACK1`, `DEFAULT`, `RUN`, `WALK`).
- Renderer playback:
  - FLC previews animate in canvas.
  - Animations tab delay follows `frame_time_seconds`.
  - Natural wonder animation delay can be parsed from spec (`frame_time_seconds=...`).
  - Preview scaling preserves aspect ratio (non-stretched) with user size slider.
- Real-world unit asset quirks (observed under local `Conquests` tree):
  - Some `Art/Units/*` folders are helper/sound folders with no INI at all (for example in `Scenarios/Tides of Crimson`), so scanners must not assume every unit-folder-looking directory is a real unit definition.
  - Some valid unit folders have non-canonical INI naming (no exact `<FolderName>.ini` match), so strict name-based resolution can miss data unless the source `ANIMNAME_*` is canonical.
  - File extension case is inconsistent (`.ini` vs `.INI`), so path comparisons in tests/tools should be case-insensitive on case-insensitive filesystems.
  - A small set of stock/scenario units currently reference missing FLCs in INI actions (including movement keys like `DEFAULT`/`RUN` for some units), so tests should baseline these explicitly and fail on drift rather than silently ignoring.

## Editing Guidelines
- Preserve parser compatibility:
  - Base config lines must remain `key = value` with simple token values.
  - Sectioned files use `#District`, `#Wonder`, or `#Animation` markers and `key = value` lines.
- Do not attempt to reinterpret Civ3 internals in this app. This app is a file manager.
- Keep the current scope abstraction intact (`Standard Game` vs `Scenario`).
- For list/bracketed fields, prefer structured controls over freeform string inputs whenever format is known.

## Scenario Isolation Guardrails (App Behavior)
- Scenario mode now enforces write fencing:
  - Allowed write roots are scenario-local only (`.biq` directory plus resolved scenario search roots from BIQ).
  - Any attempted write outside those roots is rejected before save.
- Add/Copy Scenario now supports a preflight dry-run audit:
  - The UI confirms destination path and writable roots before creating.
- Copy Scenario now isolates search roots:
  - Source BIQ scenario search roots are discovered and copied into the new scenario package.
  - The copied BIQ has `Scenario Search Folders` rewritten to local relative paths for copied roots.
  - Goal: prevent copied scenarios from continuing to reference/edit source scenario assets.
- `Scenario Search Folders` is now locked in the UI and ignored on save if present in payload edits.
  - Rationale: prevent accidental post-create path drift that can redirect edits to unintended roots.
- Path inputs for `C3X`, `Civilization 3`, and `Scenario BIQ` are now browse/select-driven (`readOnly` text inputs).
  - Rationale: avoid typo-driven path drift while still allowing explicit folder/file selection through picker controls.

## Files Modal Behavior
- Files modal now explicitly includes the active C3X base save target even when it does not yet exist on disk.
- Files modal summary text is mode-aware for base config saves:
  - Standard Game: base edits save to `custom.c3x_config.ini`
  - Scenario: base edits save to `scenario.c3x_config.ini`
- Missing-write tooltip/badge text names the concrete file that will be created on save (instead of generic override wording).
- Default Files modal filters keep `Animation INI` unchecked on open/reset.
- Unit animation INI source rows are now shown only when a concrete existing path can be resolved, to avoid false `Missing` statuses from canonical-path guesses.
- For pending writes to missing files, the status/category badge is `New` (not action text like “Will create ...”).
- Base config file writes are gated on Base-tab dirtiness (`custom/scenario .c3x_config.ini` is not written when only other tabs changed).
- Animation INI rows include an explicit `Animation INI` file-type pill in row metadata.
- Missing primary base override targets (`custom/scenario .c3x_config.ini`) are shown as `Not created yet` (non-alarming) until base edits actually require creation.

## Verification
- Run:
  - `node --check main.js`
  - `node --check src/renderer.js`
  - `node --check src/artPreview.js`
  - `npm test`

# Notes on finding information on Resources, Units, Techs, and so on
- Check `docs/Editing.md` for detailed information on how Civ 3 stores these and how to manage for scenarios, etc.

## Future Enhancements
- Add scenario discovery by reading Civ3 scenario folders.
- Add diff view against effective defaults.
