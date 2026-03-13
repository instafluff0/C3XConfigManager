# BIQ Field Catalog

This folder contains machine-readable BIQ field metadata intended for agent use.

Files:
- `fields.json`: canonical field catalog entries.
- `schema.md`: schema contract for each entry.

Design goals:
- Queryable and consistent across sections.
- Traceable to source code locations.
- Explicit uncertainty handling for partially-understood fields.

Note:
- Catalog now includes Quint district companion/runtime entries (`DISTRICTS_FILE.*`, `TILE.DistrictData.*`) because district placement persistence is sidecar-driven.
- Catalog also includes C3X named-tile entries for `scenario.districts.txt` and save chunk behavior (`C3X_SCENARIO_DISTRICTS_FILE.*`, `C3X_SAVE_CHUNK.named_tiles`).
