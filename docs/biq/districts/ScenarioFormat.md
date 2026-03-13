# District Scenario Companion Format (`*.c3x.txt`)

Note:
- This page describes the **Quint Editor** companion format (`<scenario>.c3x.txt`).
- C3X runtime scenario placement format is different (`scenario.districts.txt` with `#NamedTile` support); see `docs/C3XScenarioDistrictsFile.md`.

## File Identity
- Location: same folder as scenario BIQ.
- Name: BIQ basename + `.c3x.txt`.
- Example: `WW2 Pacific.biq` -> `WW2 Pacific.c3x.txt`.

## Top-Level Structure
- First non-empty/non-comment line should be `DISTRICTS` (case-insensitive).
- Comments are lines beginning with `;`.
- Blank lines are ignored.
- Each section begins with a directive line:
  - `#District` (case-insensitive on read)

Unknown `#...` directives are recorded as warnings and skipped.

## Section Grammar
Each `#District` section is key/value lines:

```ini
#District
coordinates  = x,y
district     = District Name
wonder_city  = City Name
wonder_name  = Wonder Name
```

Supported keys:
- `coordinates` (required): `x,y` integers
- `district` (required): district definition name
- `wonder_city` (conditional)
- `wonder_name` (conditional)

Unknown keys are warning-level parse issues.

## Quoting Rules
- Values may be unquoted, single-quoted, or double-quoted.
- Parser strips matching outer quotes (`"..."` or `'...'`).
- Internal format does not require quotes unless needed for readability.

## Validation Rules
- Missing `coordinates` or `district`: hard parse error for the section.
- Invalid coordinates format or integers: parse error.
- Coordinates that do not resolve to a tile in current map: parse error.
- `district` must match loaded district names (case-insensitive); else parse error.

District-type-specific rules:
- If district resolves to **Wonder District**:
  - `wonder_name` and `wonder_city` are both required.
  - `wonder_name` must match known wonder definitions.
  - `wonder_city` must match an existing city name in BIQ city list.
- If district resolves to **Natural Wonder**:
  - `wonder_name` is required and must match known natural wonder name.
  - `wonder_city` is ignored and reported as issue.
- For non-wonder districts:
  - Any `wonder_*` fields are ignored and reported as issue.

Parse issues are surfaced to the user as warning dialogs, but successfully parsed sections still apply.

## Save Output Behavior
- File starts with:
  - `DISTRICTS`
  - blank line
- Entries are sorted by `y`, then `x` ascending.
- Section output always uses `#District` and fixed key alignment formatting.
- `wonder_name` / `wonder_city` are emitted only when serializer can resolve them safely:
  - wonder: requires completed wonder state + resolvable wonder index + resolvable city name
  - natural wonder: requires resolvable natural wonder id/name

## Critical Compatibility Note
- Quint Editor uses this format as the persisted source of district tile placement.
- BIQ binary IO (`IO.java`) does not read/write these district fields directly.
