# BIQ Invariants and Safety Rules

## Purpose
Checklist for safe BIQ mutations and robust import/export behavior.

## Structural Invariants
- Section headers must appear in expected order for the targeted output format.
- Section count fields must match serialized element counts.
- Optional blocks must remain internally consistent:
  - map sections only when map payload is present
  - LEAD only when custom player data is present

## Index/Reference Invariants
- Any add/remove/reorder in a section requires updating all int-index links pointing to that section.
- Preserve `-1` sentinel semantics for “none/unset” references.
- After import or mutation, run link-repair/post-processing equivalent logic before save.

## Map Invariants
- TILE, CITY, UNIT, CLNY, SLOC links must remain mutually coherent.
- TILE x/y/index mapping must remain deterministic and world-size consistent.
- Owner fields (`owner`, `ownerType`) must remain valid after player/civ edits.
- Preserve Quint tile-index math:
  - `index = (y/2)*width + (y odd ? width/2 : 0) + (x/2)` with x-wrap and y-bounds checks.
- Keep logical and render terrain fields in sync:
  - `C3CRealBaseTerrain` nibble pair must match decoded real/base terrain fields.
  - `TILE.file`/`TILE.image` must be recalculated when surrounding base terrain changes.
- Distinguish hard ownership from border ownership:
  - hard owner from tile city/colony/unit links;
  - border owner from city influence + nearest/highest-culture resolution.

## Version/Format Invariants
- Respect version-specific optional sections and field widths.
- Conversions (Vanilla/PTW -> Conquests model) must explicitly initialize added structures.
- Compression/decompression is transport detail; semantic data must survive round-trip unchanged.

## Unknown Field Policy
- Do not drop unknown/question-mark fields.
- Preserve raw values unless a tested interpretation exists.
- Mark edits to unknown fields as high risk and document rationale.

## Serialization Safety
- Write path must emit headers and payload lengths consistent with parser expectations.
- For variable-length sections (notably CITY), avoid assumptions from fixed-length sections.
- Validate with representative files covering:
  - custom rules only
  - custom map + map entities
  - custom player data
  - mixed-version inputs

## Agent Workflow Checklist
1. Identify all sections touched.
2. List inbound/outbound index references.
3. Apply mutation.
4. Recalculate links and dependent counts.
5. Re-run map/player post-processing if map/player data touched.
6. Verify round-trip with known BIQ fixtures.
