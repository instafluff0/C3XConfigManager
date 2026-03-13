# ESPN Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/ESPN.java
- Base type: BIQSection

## Implementation Notes
- 12:    private int dataLength = 232;

## Cross-Section Mentions
- 8: * Other sections that know about ESPN: GOVT

## Declared Fields (from source)
- 12:    private int dataLength = 232;
- 13:    private String description = "";
- 14:    private String name = "";
- 15:    private String civilopediaEntry = "";
- 16:    private int missionPerformedBy;
- 17:    private int baseCost;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
