# Editing Notes

This file is the local home for detailed Civ3 storage/editing notes referenced by `agents.md`.

Use the companion docs for structured guidance:
- `docs/DomainGroundTruth.md`
- `docs/UIInvariants.md`
- `docs/Quirks.md`

If you add deep format-specific notes, keep them here and link back from `agents.md` only when the note is stable and broadly useful.

## Findings from `C3X_Districts` Source
Reviewed files:
- `../C3X_Districts/injected_code.c`
- `../C3X_Districts/C3X.h`
- `../C3X_Districts/changelog.txt`
- `../C3X_Districts/default.*`

### Load Semantics Worth Surfacing in UI
- Base config in scenario load path currently layers as:
  - `default.c3x_config.ini` -> `scenario.c3x_config.ini` -> `custom.c3x_config.ini`
  - This means `custom` can override scenario values for base config.
- District/wonder/natural/tile-animation configs remain replacement-style with:
  - `default` -> `user` -> `scenario`
  - last successful file fully replaces prior definitions.

### Validation/Parser Rules to Mirror
- Comma lists support quoted items; missing close quote is explicit parse error.
- `buildable_adjacent_to` accepts `city`; `buildable_on` does not.
- Culture-variant district art uses 5 variants (AMER, EURO, ROMAN, MIDEAST, ASIAN).
  - If culture-variant mode is enabled but too few images are supplied, source attempts to backfill from first image.

### Useful Hard Limits for UI Guardrails
- Max district dependents per list: 64.
- Max wonder district types: 32.
- Max natural wonder types: 32.
- Max tile animation definitions: 128.
- Max adjacency clauses per tile animation: 8.

### Tile Animation Behavior
- Candidate winner priority by type:
  - `resource > natural wonder > pcx > terrain > coastal-wave`
- Tie-breakers:
  - season/hour constrained entries first, then later file order.

### Scenario File Placement
- Default config docs and source both assume scenario override files are in scenario search roots.
- UX should continue treating scenario root/search folders as authoritative for scenario-local overrides.

### Named Tiles in Scenario Placement File
- C3X supports named map tiles via `#NamedTile` sections in `scenario.districts.txt`.
- This is parsed alongside pre-placed `#District` entries.
- For exact schema/quirks (quotes, coordinate wrapping, invalid-tile rules), see:
  - `docs/C3XScenarioDistrictsFile.md`.

## FLC Parsing and Preview Notes
- See `docs/FlcReference.md` for the Civ3FlcEdit deep review and practical decoder guidance.

## BIQ Deep-Dive Notes
- See `docs/biq/README.md` for Quint_Editor BIQ architecture.
- See `docs/biq/IOPipeline.md` for section order/optional blocks/conversion details.
- See `docs/biq/sections/*.md` for per-section field inventories and constants.
- See `docs/biq/tabs/*.md` for per-tab data dependencies.
- See `docs/biq/districts/ScenarioFormat.md` for Quint-compatible district sidecar format (`<scenario>.c3x.txt`) and validation rules.
