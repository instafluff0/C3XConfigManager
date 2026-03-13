# CITY Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/CITY.java
- Base type: BIQSection

## Implementation Notes
- 25:    private int dataLength = 66;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 15:    public static final int OWNER_CIV = 2;
- 16:    public static final int OWNER_PLAYER = 3;
- 17:    public static final int OWNER_BARBARIANS = 1;
- 18:    public static final int OWNER_NONE = 0;
- 19:    public static final String[] ownerTypes = {"None", "Barbarians", "Civ", "Player"};
- 22:    public List<TILE>tilesInfluenced;
- 25:    private int dataLength = 66;
- 26:    private byte hasWalls;
- 27:    private byte hasPalace;
- 28:    private String name = "";
- 29:    private int ownerType = OWNER_CIV;
- 30:    private ArrayList<Integer>buildingIDs;
- 31:    private int culture = 0;
- 33:    private int size = 1;
- 34:    private int x;
- 35:    private int y;
- 36:    private int cityLevel;
- 37:    private int borderLevel = 1;
- 38:    private int useAutoName;
- 39:    private boolean wallStyleBuilding = false;
- 41:    public IO baselink;

## Constants / Flags
- 15:    public static final int OWNER_CIV = 2;
- 16:    public static final int OWNER_PLAYER = 3;
- 17:    public static final int OWNER_BARBARIANS = 1;
- 18:    public static final int OWNER_NONE = 0;
- 19:    public static final String[] ownerTypes = {"None", "Barbarians", "Civ", "Player"};

## Unknown / Reverse-Engineering Markers
- 21:    //TODO: Decide whether this really should be public.  It's used in a lot of places currently...
- 296:     * TODO: Verify that Citizen/Building is part of it.  Also decide, should we include that?

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
