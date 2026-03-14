# IO Pipeline Details

## Reference: Quint_Editor Java pipeline

The original Java implementation lives at:
`../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/IO.java`

This is a read-only reference for understanding BIQ binary layout and section semantics. It is not used at runtime.

### Key behaviors documented for reference
- Compression auto-detect and external decompressor invocation (BIQDecompressor.jar).
- Little-endian parsing across all sections.
- Optional section families:
  - custom rules (BLDG ... FLAV)
  - custom map (WCHR ... map payload)
  - custom player data (LEAD)
- Version-sensitive behavior:
  - legacy/Vanilla/PTW support with conversion path toward Conquests model.
- Multithreaded import paths for heavy map sections (TILE, CONT, SLOC) via helper thread classes.

---

## JS pipeline (C3X implementation)

The app uses a pure-JS pipeline. No Java dependency.

See `docs/biq/JSBridge.md` for the full architecture and per-section notes.

### Inflate path (`src/configCore.js → inflateBiqIfNeeded`)
1. Read raw file bytes.
2. If magic starts with `BIC`, file is uncompressed — use as-is.
3. Otherwise call `decompress(raw)` from `src/biq/decompress.js` (PKWare IMPLODE).
4. On failure, return an error.

### Parse path (`src/configCore.js → runBiqBridgeOnInflatedBuffer`)
1. Call `parseBiqBuffer(buf)` from `src/biq/biqBridgeJs.js`.
2. On failure, return an error.

### Edit/save path (`src/configCore.js → applyBiqReferenceEdits`)
1. Inflate the BIQ.
2. Call `applyBiqEdits({ buffer, edits })` from `src/biq/biqBridgeJs.js`.
3. Write the returned buffer directly to the output path.
