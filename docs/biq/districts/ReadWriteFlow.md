# District Read/Write Flow (Quint Editor)

## Integration Points
- On scenario open success:
  - `Main.openFile(...)` calls `DistrictScenarioSerializer.loadDistrictScenario(...)`.
- On scenario save success:
  - `Main.saveFile(...)` calls `DistrictScenarioSerializer.saveDistrictScenario(...)`.

This means district sidecar sync is tied to normal BIQ open/save lifecycle.

## Definitions Resolution Before Parse
`DistrictDefinitions.load(civInstallDir, scenarioFile)` is used for name/index resolution.

For each definition family (district/wonder/natural wonder):
- candidate load order: `default`, `user`, `scenario`
- behavior is replacement-like, not merge across files:
  - when a later source exists, in-memory list is reset before reading it
  - effective source is last existing file in sequence

Scenario candidates checked:
- `<scenario folder>/<scenario.*.txt>`
- `<scenario folder>/C3X/<scenario.*.txt>`

## Load Path (`*.c3x.txt` -> in-memory tile district data)
1. Resolve companion filename from BIQ path.
2. If file missing: no-op.
3. Load definitions; if missing: skip load.
4. Clear existing district data from all tiles (`tile.clearDistrict()`).
5. Parse file sections and apply each valid section to target tile.

Applied tile state:
- `tile.setDistrict(districtId, DISTRICT_STATE_COMPLETED)`
- `districtData.districtId = districtId`
- `districtData.districtType = districtId`
- `districtData.state = DISTRICT_STATE_COMPLETED`
- `districtData.wonderInfo` always assigned (possibly all `-1` / state `0`)
- `districtData.naturalWonderId` set when district is natural wonder, else `-1`

Wonder-specific applied fields:
- `wonderInfo.wonderIndex` and `wonderInfo.wonderId` set to resolved wonder index
- `wonderInfo.cityId` set to resolved city index
- `wonderInfo.state = WDS_COMPLETED` only when both wonder and city are valid

## Save Path (in-memory tile district data -> `*.c3x.txt`)
1. Resolve companion filename from BIQ path.
2. Load definitions; if missing: skip save.
3. Iterate all tiles; include only tiles with `districtData` and `districtId >= 0`.
4. Resolve output district name by `districtType` if present else `districtId`.
5. Optionally resolve wonder/natural names and city name.
6. Sort output entries (`y`, then `x`) and write normalized text file.

Save eligibility for optional fields:
- Wonder fields saved only when completed wonder assignment is resolvable.
- Natural wonder name saved only when `naturalWonderId` resolves to known definition.

## Data Model Fields Used (TILE runtime)
- `TILE.DistrictData`
  - `districtId`
  - `districtType`
  - `state`
  - `wonderInfo`
  - `naturalWonderId`
- `TILE.WonderDistrictInfo`
  - `wonderId`
  - `wonderIndex`
  - `cityId`
  - `state`

## Important Implementation Implication for C3XConfigManager
- If you want Quint-compatible district placement persistence, treat `<scenario>.c3x.txt` as authoritative persisted form for map tile district assignments.
