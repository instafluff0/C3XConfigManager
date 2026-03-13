# CLNY Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/CLNY.java
- Base type: BIQSection

## Implementation Notes
- 19:    private int dataLength = 20;  //not 16 as in the documentation.  Only 16 in Vanilla.

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 14:    public static final byte COLONY = 0;
- 15:    public static final byte AIRFIELD = 1;
- 16:    public static final byte RADAR_TOWER = 2;
- 17:    public static final byte OUTPOST = 3;
- 20:    private int ownerType;
- 21:    private int owner;
- 22:    private int x;
- 23:    private int y;

## Constants / Flags
- 14:    public static final byte COLONY = 0;
- 15:    public static final byte AIRFIELD = 1;
- 16:    public static final byte RADAR_TOWER = 2;
- 17:    public static final byte OUTPOST = 3;

## Unknown / Reverse-Engineering Markers
- No explicit questionMark/unknown markers detected by scan.

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
