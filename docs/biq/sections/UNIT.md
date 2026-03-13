# UNIT Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/UNIT.java
- Base type: BIQSection

## Implementation Notes
- 13:    private int dataLength = 121;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 12:    private int index = 0;
- 13:    private int dataLength = 121;
- 14:    private String name = "";
- 15:    private int ownerType;
- 16:    private int experienceLevel;
- 17:    private int owner;
- 18:    private int PRTONumber;
- 19:    private PRTO prto;
- 20:    private int AIStrategy;
- 21:    private int x;
- 22:    private int y;
- 23:    private String PTWCustomName = "";
- 24:    private int useCivilizationKing;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
