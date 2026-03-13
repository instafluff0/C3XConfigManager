# EXPR Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/EXPR.java
- Base type: BIQSection

## Implementation Notes
- 12:    public int dataLength = 40;

## Cross-Section Mentions
- 8: * Other sections that know about EXPR: Govt, Map

## Declared Fields (from source)
- 12:    public int dataLength = 40;
- 13:    public String name = "";
- 14:    public int baseHitPoints;
- 15:    public int retreatBonus;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
