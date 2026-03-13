# TECH Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/TECH.java
- Base type: BIQSection

## Implementation Notes
- 14:    private int dataLength = 112; //112 in Conquests; 104 in PTW

## Cross-Section Mentions
- 8: * Other sections that know about TECH: good, bldg, civ, unit, ctzn, govt, trfm

## Declared Fields (from source)
- 16:    private String name = "";
- 17:    private String civilopediaEntry = "";
- 18:    private int cost;
- 19:    private int era;
- 20:    private int advanceIcon;
- 21:    private int x;
- 22:    private int y;
- 23:    private int prerequisite1Int;
- 24:    private int prerequisite2Int;
- 25:    private int prerequisite3Int;
- 26:    private int prerequisite4Int;
- 27:    private TECH prerequisite1;
- 28:    private TECH prerequisite2;
- 29:    private TECH prerequisite3;
- 30:    private TECH prerequisite4;
- 31:    private int flags;
- 32:        private boolean enablesDiplomats;
- 33:        private boolean enablesIrrigationWithoutFreshWater;
- 34:        private boolean enablesBridges;
- 35:        private boolean disablesFloodPlainDisease;
- 36:        private boolean enablesConscription;
- 37:        private boolean enablesMobilizationLevels;
- 38:        private boolean enablesRecycling;
- 39:        private boolean enablesPrecisionBombing;
- 40:        private boolean enablesMPP;
- 41:        private boolean enablesROP;
- 42:        private boolean enablesAlliances;
- 43:        private boolean enablesTradeEmbargoes;
- 44:        private boolean doublesWealth;
- 45:        private boolean enablesSeaTrade;
- 46:        private boolean enablesOceanTrade;
- 47:        private boolean enablesMapTrading;
- 48:        private boolean enablesCommunicationTrading;
- 49:        private boolean notRequiredForAdvancement;
- 50:        private boolean doublesWorkRate;
- 51:        private boolean cannotBeTraded;
- 52:        private boolean permitsSacrifice;
- 53:        private boolean bonusTech;
- 54:        private boolean revealMap;
- 56:    private int flavors;
- 57:    private int numFlavors;
- 58:    private ArrayList<Boolean>flavours;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 59:    private int questionMark = 1;    //must not be zero
- 108:        other.questionMark = this.questionMark;
- 192:        return questionMark;
- 394:    public void setQuestionMark(int questionMark)
- 396:        this.questionMark = questionMark;
- 845:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 1066:        if (!(questionMark == two.getQuestionMark()))
- 1068:                toReturn = toReturn + "QuestionMark: " + questionMark + separator + two.getQuestionMark() + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
