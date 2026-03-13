# LEAD Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/LEAD.java
- Base type: BIQSection

## Implementation Notes
- 332:        String toReturn = "dataLength: " + getDataLength() + lineReturn;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 20:    public static final int CIV_ANY = -3;
- 21:    public static final int CIV_RANDOM = -2;
- 22:    public int customCivData;
- 23:    public int humanPlayer;
- 24:    public String leaderName = "";
- 25:    public int questionMark1;
- 26:    public int questionMark2;
- 27:    public int numberOfDifferentStartUnits;
- 36:    public int genderOfLeaderName;
- 37:    public int numberOfStartingTechnologies;
- 39:    private ArrayList<TECH>startingTechnology;
- 40:    public int difficulty;
- 41:    public int initialEra;
- 42:    public int startCash;
- 43:    public int government;
- 44:    public int civ;
- 45:    public int color;
- 46:    public int skipFirstTurn;
- 47:    public int questionMark3;

## Constants / Flags
- 20:    public static final int CIV_ANY = -3;
- 21:    public static final int CIV_RANDOM = -2;

## Unknown / Reverse-Engineering Markers
- 25:    public int questionMark1;
- 26:    public int questionMark2;
- 47:    public int questionMark3;
- 102:        return questionMark1;
- 107:        return questionMark2;
- 194:        return questionMark3;
- 270:    public void setQuestionMark1(int questionMark1)
- 272:        this.questionMark1 = questionMark1;
- 275:    public void setQuestionMark2(int questionMark2)
- 277:        this.questionMark2 = questionMark2;
- 320:    public void setQuestionMark3(int questionMark3)
- 322:        this.questionMark3 = questionMark3;
- 336:        toReturn = toReturn + "questionMark1: " + questionMark1 + lineReturn;
- 337:        toReturn = toReturn + "questionMark2: " + questionMark2 + lineReturn;
- 378:        toReturn = toReturn + "questionMark3: " + questionMark3 + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
