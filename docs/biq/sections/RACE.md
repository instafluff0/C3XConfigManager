# RACE Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/RACE.java
- Base type: BIQSection

## Implementation Notes
- 13:    private int dataLength = 2388;   //without any optional stuff

## Cross-Section Mentions
- 8: * Other sections that know about RACE: game, PRTO

## Declared Fields (from source)
- 14:    private int numCityNames;
- 15:    private ArrayList<String>cityName;
- 16:    private int numGreatLeaders;
- 17:    private ArrayList<String>greatLeader;
- 18:    private String leaderName = "";
- 19:    private String leaderTitle = "";
- 20:    private String civilopediaEntry = "";
- 21:    private String adjective = "";
- 22:    private String civilizationName = "";
- 23:    private String noun = "";
- 28:    private ArrayList<String>forwardFilename;
- 29:    private ArrayList<String>reverseFilename;
- 30:    private int cultureGroup;
- 31:    private int leaderGender;
- 32:    private int civilizationGender;
- 33:    private int aggressionLevel;
- 34:    private int uniqueCivilizationCounter;
- 35:    private int shunnedGovernment;
- 36:    private int favoriteGovernment;
- 37:    private int defaultColor;
- 38:    private int uniqueColor;
- 39:    private int freeTech1Index;
- 40:    private int freeTech2Index;
- 41:    private int freeTech3Index;
- 42:    private int freeTech4Index;
- 43:    private TECH freeTech1;
- 44:    private TECH freeTech2;
- 45:    private TECH freeTech3;
- 46:    private TECH freeTech4;
- 47:    private int bonuses;
- 48:    private int governorSettings;
- 49:    private int buildNever;
- 50:    private int buildOften;
- 51:    private int plurality;
- 52:    private int kingUnitInt;
- 53:    private PRTO kingUnit;
- 54:    private int flavors;
- 55:    private ArrayList<Boolean>flavours;
- 56:    private int numFlavors;
- 57:    private int questionMark;
- 58:    private int diplomacyTextIndex;
- 59:    private int numScientificLeaders;
- 61:    private boolean militaristic;
- 62:    private boolean commercial;
- 63:    private boolean expansionist;
- 64:    private boolean scientific;
- 65:    private boolean religious;
- 66:    private boolean industrious;
- 67:    private boolean agricultural;
- 68:    private boolean seafaring;
- 70:    private boolean manageCitizens;
- 71:    private boolean emphasizeFood;
- 72:    private boolean emphasizeShields;
- 73:    private boolean emphasizeTrade;
- 74:    private boolean manageProduction;
- 75:    private boolean noWonders;
- 76:    private boolean noSmallWonders;
- 78:    private boolean noOffensiveLandUnits;
- 79:    private boolean noDefensiveLandUnits;
- 80:    private boolean noArtillery;
- 81:    private boolean noSettlers;
- 82:    private boolean noWorkers;
- 83:    private boolean noShips;
- 84:    private boolean noAirUnits;
- 85:    private boolean noGrowth;
- 86:    private boolean noProduction;
- 87:    private boolean noHappiness;
- 88:    private boolean noScience;
- 89:    private boolean noWealth;
- 90:    private boolean noTrade;
- 91:    private boolean noExploration;
- 92:    private boolean noCulture;
- 94:    private boolean manyOffensiveLandUnits;
- 95:    private boolean manyDefensiveLandUnits;
- 96:    private boolean manyArtillery;
- 97:    private boolean manySettlers;
- 98:    private boolean manyWorkers;
- 99:    private boolean manyShips;
- 100:    private boolean manyAirUnits;
- 101:    private boolean manyGrowth;
- 102:    private boolean manyProduction;
- 103:    private boolean manyHappiness;
- 104:    private boolean manyScience;
- 105:    private boolean manyWealth;
- 106:    private boolean manyTrade;
- 107:    private boolean manyExploration;
- 108:    private boolean manyCulture;
- 109:    private ArrayList<String>scientificLeader;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 57:    private int questionMark;
- 325:        return questionMark;
- 712:    public void setQuestionMark(int questionMark)
- 714:        this.questionMark = questionMark;
- 1231:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 1742:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 2063:        if (!(questionMark == two.getQuestionMark()))
- 2065:                toReturn = toReturn + "QuestionMark: " + questionMark + separator + two.getQuestionMark() + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
