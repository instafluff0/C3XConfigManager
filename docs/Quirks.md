# Quirks and Edge Cases

## Purpose
Operational edge cases and data oddities that frequently cause regressions.

## BIQ/Data Quirks
- Some stock Conquests scenario BIQs include map-enabled `CITY`/`UNIT` coordinates that do not directly match `TILE` rows.
- Some `TILE.city` values may round-trip as display strings (for example `Roma (0)`) rather than plain numeric IDs.
- Tests should establish deterministic local preconditions instead of assuming stock BIQ layout consistency.

## Config Precedence Quirk
- Base config (`*.c3x_config.ini`) precedence can differ from district/wonder/natural/animation precedence.
- In current `C3X_Districts` scenario load path, base layering is `default -> scenario -> custom`.
- District-like config families remain replacement-style `default -> user -> scenario`.
- Treat this as version-sensitive and confirm against the exact C3X source snapshot your build targets.

## Unit Art/Animation Quirks
- Some `Art/Units/*` folders are helper/sound folders with no unit INI.
- Some valid unit folders use non-canonical INI naming.
- File extension case can vary (`.ini` vs `.INI`) and should be treated case-insensitively where applicable.
- Some stock/scenario units reference missing FLC actions; tests should baseline expected misses and fail on drift.

## Documentation Hygiene
- If a quirk becomes a permanent product invariant, move it to `docs/DomainGroundTruth.md` or `docs/UIInvariants.md`.
- Remove stale quirks once behavior is fixed or obsolete.
