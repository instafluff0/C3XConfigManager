# WSIZ Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/WSIZ.java
- Base type: BIQSection

## Implementation Notes
- 12:    private int dataLength;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 12:    private int dataLength;
- 13:    private int optimalNumberOfCities;
- 14:    private int techRate;
- 15:    private String empty = "";
- 16:    private String name = "";
- 17:    private int height;
- 18:    private int distanceBetweenCivs;
- 19:    private int numberOfCivs;
- 20:    private int width;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
