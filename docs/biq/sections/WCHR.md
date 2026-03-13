# WCHR Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/WCHR.java
- Base type: BIQSection

## Implementation Notes
- 12:    private int dataLength = 52;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 12:    private int dataLength = 52;
- 13:    private int selectedClimate = 1;
- 14:    private int actualClimate = 1;
- 15:    private int selectedBarbarianActivity = 1;
- 16:    private int actualBarbarianActivity = 1;
- 17:    private int selectedLandform = 1;
- 18:    private int actualLandform = 1;
- 19:    private int selectedOceanCoverage = 1;
- 20:    private int actualOceanCoverage = 1;
- 21:    private int selectedTemperature = 1;
- 22:    private int actualTemperature = 1;
- 23:    private int selectedAge = 1;
- 24:    private int actualAge = 1;
- 25:    private int worldSize = 2;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
