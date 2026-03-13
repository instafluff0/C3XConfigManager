# GOOD Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/GOOD.java
- Base type: BIQSection

## Implementation Notes
- 17:    private int dataLength = 88;

## Cross-Section Mentions
- 9: * Other sections that know about GOODs: BLDG, PRTO, RULE, TERR, TRFM, MAP

## Declared Fields (from source)
- 13:    public final static int BONUS = 0;
- 14:    public final static int LUXURY = 1;
- 15:    public final static int STRATEGIC = 2;
- 17:    private int dataLength = 88;
- 18:    private String name = "";
- 19:    private String civilopediaEntry = "";
- 21:    private int appearanceRatio;
- 22:    private int disapperanceProbability;
- 23:    private int icon;
- 24:    private int prerequisiteInt;
- 25:    private TECH prerequisite;
- 26:    private int foodBonus;
- 27:    private int shieldsBonus;
- 28:    private int commerceBonus;

## Constants / Flags
- 13:    public final static int BONUS = 0;
- 14:    public final static int LUXURY = 1;
- 15:    public final static int STRATEGIC = 2;

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
