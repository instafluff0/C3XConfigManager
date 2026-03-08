# agents.md

## Scope
This folder contains an Electron app (`C3X Config Manager`) for managing C3X config files in a UI.

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
  - Conquests path defaults to app parent when that folder is named `Conquests`, or C3X parent when named `Conquests`.
- If inferred/saved paths exist, app auto-loads configs.

## UI/Editing Behavior
- Mode labels in UI are:
  - `Standard Game` (global)
  - `Scenario`
- Base C3X tab:
  - Grouped by doc sections parsed from default config comments.
  - Sticky search row.
  - Full descriptions shown by default under each field.
  - Typed editors where possible (booleans/selects/structured forms) instead of raw strings.
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

## Editing Guidelines
- Preserve parser compatibility:
  - Base config lines must remain `key = value` with simple token values.
  - Sectioned files use `#District`, `#Wonder`, or `#Animation` markers and `key = value` lines.
- Do not attempt to reinterpret Civ3 internals in this app. This app is a file manager.
- Keep the current scope abstraction intact (`Standard Game` vs `Scenario`).
- For list/bracketed fields, prefer structured controls over freeform string inputs whenever format is known.

## Verification
- Run:
  - `node --check main.js`
  - `node --check src/renderer.js`
  - `node --check src/artPreview.js`
  - `npm test`

## Future Enhancements
- Add scenario discovery by reading Civ3 scenario folders.
- Add diff view against effective defaults.
