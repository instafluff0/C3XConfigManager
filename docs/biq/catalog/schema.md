# Field Catalog Schema

Each object in `fields.json` follows this shape:

- `id`: Stable identifier (`SECTION.fieldName`)
- `section`: BIQ section code (`PRTO`, `RULE`, `TILE`, etc.)
- `field`: Source field name in Quint_Editor model class
- `category`: One of `scalar`, `string`, `bitfield`, `reference`, `array`, `metadata`
- `type`: Data type intent (`int`, `short`, `byte`, `string`, `bool`, `list<int>`, etc.)
- `default`: Default semantic value, if known
- `domain`: Optional enum/range/meaning notes
- `bitmask`: For bitfields, object containing mask metadata and decoded flags if known
- `linksTo`: Array of section references if this field links to another section
- `uiTabs`: Editor tabs known to expose/edit this field
- `readPath`: Source location(s) used to parse/import behavior
- `writePath`: Source location(s) used to serialize/export behavior
- `notes`: Durable behavior notes
- `confidence`: `high` | `medium` | `low`
- `versionScope`: `vanilla` | `ptw` | `conquests` | `all` or mixed array

Guidelines:
- Prefer direct source names over inferred aliases.
- Use `confidence: low` for `questionMark*` and uncertain semantics.
- Include both link integer fields and resolved object fields where useful.
