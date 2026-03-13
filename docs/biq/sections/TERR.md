# TERR Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/TERR.java
- Base type: BIQSection

## Implementation Notes
- 15:    public int dataLength;

## Cross-Section Mentions
- 8: * Other sections that know about TERR: PRTO, MAP

## Declared Fields (from source)
- 15:    public int dataLength;
- 16:    public int numPossibleResources;
- 17:    public ArrayList<Byte>possibleResources;
- 20:    public ArrayList<Boolean>allowedResources;
- 21:    public String name = "";
- 22:    public String civilopediaEntry = "";
- 23:    public int foodBonus;
- 24:    public int shieldsBonus;
- 25:    public int commerceBonus;
- 26:    public int defenceBonus;
- 27:    public int movementCost;
- 28:    public int food;
- 29:    public int shields;
- 30:    public int commerce;
- 31:    public int workerJob;
- 32:    public int pollutionEffect;
- 41:    public int questionMark;
- 43:    public int landmarkFood;
- 44:    public int landmarkShields;
- 45:    public int landmarkCommerce;
- 46:    public int landmarkFoodBonus;
- 47:    public int landmarkShieldsBonus;
- 48:    public int landmarkCommerceBonus;
- 49:    public int landmarkMovementCost;
- 50:    public int landmarkDefenceBonus;
- 51:    public String landmarkName = "";
- 52:    public String landmarkCivilopediaEntry = "";
- 53:    public int questionMark2;
- 54:    public int terrainFlags;
- 55:    public boolean causesDisease;
- 56:    public boolean diseaseCanBeCured;
- 57:    public int diseaseStrength;
- 60:    public static final byte DESERT = 0;
- 61:    public static final byte PLAINS = 1;
- 62:    public static final byte GRASSLAND = 2;
- 63:    public static final byte TUNDRA = 3;
- 64:    public static final byte FLOODPLAIN = 4;
- 65:    public static final byte HILLS = 5;
- 66:    public static final byte MOUNTAIN = 6;
- 67:    public static final byte FOREST = 7;
- 68:    public static final byte JUNGLE = 8;
- 69:    public static final byte MARSH = 9;
- 70:    public static final byte VOLCANO = 10;
- 71:    public static final byte COAST = 11;
- 72:    public static final byte SEA = 12;
- 73:    public static final byte OCEAN = 13;

## Constants / Flags
- 60:    public static final byte DESERT = 0;
- 61:    public static final byte PLAINS = 1;
- 62:    public static final byte GRASSLAND = 2;
- 63:    public static final byte TUNDRA = 3;
- 64:    public static final byte FLOODPLAIN = 4;
- 65:    public static final byte HILLS = 5;
- 66:    public static final byte MOUNTAIN = 6;
- 67:    public static final byte FOREST = 7;
- 68:    public static final byte JUNGLE = 8;
- 69:    public static final byte MARSH = 9;
- 70:    public static final byte VOLCANO = 10;
- 71:    public static final byte COAST = 11;
- 72:    public static final byte SEA = 12;
- 73:    public static final byte OCEAN = 13;

## Unknown / Reverse-Engineering Markers
- 41:    public int questionMark;
- 53:    public int questionMark2;
- 250:        return questionMark;
- 310:        return questionMark2;
- 438:    public void setQuestionMark(int questionMark)
- 440:        this.questionMark = questionMark;
- 498:    public void setQuestionMark2(int questionMark2)
- 500:        this.questionMark2 = questionMark2;
- 694:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 706:        toReturn = toReturn + "questionMark2: " + questionMark2 + lineReturn;
- 805:        if (!(questionMark == two.getQuestionMark()))
- 807:                toReturn = toReturn + "QuestionMark: " + questionMark + separator + two.getQuestionMark() + lineReturn;
- 853:        if (!(questionMark2 == two.getQuestionMark2()))
- 855:                toReturn = toReturn + "QuestionMark2: " + questionMark2 + separator + two.getQuestionMark2() + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
