# District Companion Files (Quint Editor)

## Why this exists
Quint Editor district placement is **not** serialized into BIQ section bytes. It is loaded/saved through a sidecar text file next to the scenario BIQ:
- `<ScenarioName>.c3x.txt`

Primary sources:
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/districts/DistrictScenarioSerializer.java`
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/districts/DistrictDefinitions.java`
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/Main.java`
- `../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/TILE.java`

## Quick Facts
- Companion filename is derived from BIQ basename: `Foo.biq -> Foo.c3x.txt`.
- Load is invoked after BIQ parse; save is invoked after BIQ export succeeds.
- On load, existing in-memory tile districts are cleared first, then rebuilt from companion text.
- District names in the companion file are resolved through loaded district definitions (`default/user/scenario` replacement semantics).

## Deep References
- Format and validation rules: `docs/biq/districts/ScenarioFormat.md`
- Read/write lifecycle and data model mapping: `docs/biq/districts/ReadWriteFlow.md`
