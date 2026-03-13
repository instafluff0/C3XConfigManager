# DIFF Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/DIFF.java
- Base type: BIQSection

## Implementation Notes
- 12:    private int dataLength = 120;

## Cross-Section Mentions
- 8: * Other sections that know about DIFF: rule

## Declared Fields (from source)
- 12:    private int dataLength = 120;
- 13:    private String name = "";
- 14:    private int contentCitizens;
- 15:    private int maxGovtTransition;
- 16:    private int AIDefenceStart;
- 17:    private int AIOffenceStart;
- 18:    private int extraStart1;
- 19:    private int extraStart2;
- 20:    private int additionalFreeSupport;
- 21:    private int bonusPerCity;
- 22:    private int attackBarbariansBonus;
- 23:    private int costFactor = 10;
- 24:    private int percentOptimal;
- 25:    private int AIAITrade = 100;
- 26:    private int corruptionPercent;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
