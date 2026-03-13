# TFRM Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/TRFM.java
- Base type: BIQSection

## Implementation Notes
- 12:    private int dataLength = 112;

## Cross-Section Mentions
- 8: * Other sections that know about TRFM: Terr

## Declared Fields (from source)
- 12:    private int dataLength = 112;
- 13:    private String name = "";
- 14:    private String civilopediaEntry = "";
- 15:    private int turnsToComplete;
- 16:    private int requiredAdvanceInt;
- 17:    private TECH requiredAdvance;
- 18:    private int requiredResourceInt;
- 19:    private int requiredResource2Int;
- 20:    private GOOD requiredResource1;
- 21:    private GOOD requiredResource2;
- 22:    private String order = "";

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
