# CULT Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/CULT.java
- Base type: BIQSection

## Implementation Notes
- 12:    private int dataLength = 88;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 12:    private int dataLength = 88;
- 13:    private String name = "";
- 14:    private int propagandaSuccess;
- 15:    private int cultRatioPercent;
- 16:    private int ratioDenominator = 1;
- 17:    private int ratioNumerator = 1;
- 18:    private int initResistanceChance;
- 19:    private int continuedResistanceChance;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
