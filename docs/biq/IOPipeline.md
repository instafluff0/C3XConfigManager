# IO Pipeline Details (Quint_Editor)

## Source
- ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/IO.java

## Key behaviors
- Compression auto-detect and external decompressor invocation (BIQDecompressor.jar).
- Little-endian parsing across all sections.
- Optional section families:
  - custom rules (BLDG ... FLAV)
  - custom map (WCHR ... map payload)
  - custom player data (LEAD)
- Version-sensitive behavior:
  - legacy/Vanilla/PTW support with conversion path toward Conquests model.
- Multithreaded import paths for heavy map sections (TILE, CONT, SLOC) via helper thread classes.

## Common failure/diagnostic patterns in code
- Header mismatch checks on each section import method.
- CITY variable-length handling called out as more fragile than fixed-length sections.
- Missing LEAD tolerated in some paths (custom player data optional).

## Save behavior
- Writes section headers explicitly in canonical order.
- Saves all major rules/map/player sections expected by Conquests-oriented output path.
