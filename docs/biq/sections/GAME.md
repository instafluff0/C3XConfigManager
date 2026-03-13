# GAME Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/GAME.java
- Base type: BIQSection

## Implementation Notes
- 13:    public int dataLength;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 13:    public int dataLength;
- 14:    public int useDefaultRules = 1;
- 15:    public int defaultVictoryConditions = 1;
- 16:    public int numberOfPlayableCivs;
- 17:    public ArrayList<Integer>idOfPlayableCivs;
- 18:    public int victoryConditionsAndRules;
- 19:    public boolean dominationEnabled;
- 20:    public boolean spaceRaceEnabled;
- 21:    public boolean diplomacticEnabled;
- 22:    public boolean conquestEnabled;
- 23:    public boolean culturalEnabled;
- 24:    public boolean civSpecificAbilitiesEnabled;
- 25:    public boolean culturallyLinkedStart;
- 26:    public boolean restartPlayersEnabled;
- 27:    public boolean preserveRandomSeed;
- 28:    public boolean acceleratedProduction;
- 29:    public boolean eliminationEnabled;
- 30:    public boolean regicideEnabled;
- 31:    public boolean massRegicideEnabled;
- 32:    public boolean victoryLocationsEnabled;
- 33:    public boolean captureTheFlag;
- 34:    public boolean allowCulturalConversions;
- 35:    public boolean wonderVictoryEnabled;
- 36:    public boolean reverseCaptureTheFlag;
- 37:    public boolean scientificLeaders;
- 38:    public int placeCaptureUnits = 1;
- 39:    public int autoPlaceKings = 1;
- 40:    public int autoPlaceVictoryLocations = 1;
- 41:    public int debugMode;
- 42:    public int useTimeLimit;
- 43:    public int baseTimeUnit;
- 44:    public int startMonth = 1;
- 45:    public int startWeek = 1;
- 46:    public int startYear = -4000;
- 47:    public int minuteTimeLimit;
- 48:    public int turnTimeLimit = 540;
- 49:    public int[]turnsPerTimescalePart;
- 50:    public int[]timeUnitsPerTurn;
- 51:    public String scenarioSearchFolders = "";
- 52:    private String[]searchFolder = new String[0];
- 56:    public ArrayList<Integer>civPartOfWhichAlliance;
- 57:    public int victoryPointLimit = 50000;
- 58:    public int cityEliminationCount = 1;
- 59:    public int oneCityCultureWinLimit = 20000;
- 60:    public int allCitiesCultureWinLimit = 100000;
- 61:    public int dominationTerrainPercent = 66;
- 62:    public int dominationPopulationPercent = 66;
- 63:    public int wonderVP = 10;
- 64:    public int defeatingOpposingUnitVP = 10;
- 65:    public int advancementVP = 5;
- 66:    public int cityConquestVP = 100;
- 67:    public int victoryPointVP = 25;
- 68:    public int captureSpecialUnitVP = 1000;
- 69:    public int questionMark1;
- 71:    public String alliance0 = "";
- 72:    public String alliance1 = "";
- 73:    public String alliance2 = "";
- 74:    public String alliance3 = "";
- 75:    public String alliance4 = "";
- 76:    public ArrayList<Integer>warWith0;
- 77:    public ArrayList<Integer>warWith1;
- 78:    public ArrayList<Integer>warWith2;
- 79:    public ArrayList<Integer>warWith3;
- 80:    public ArrayList<Integer>warWith4;
- 81:    public int allianceVictoryType;
- 82:    public String plaugeName = "Black Death";
- 84:    public int plagueEarliestStart;
- 85:    public int plagueVariation;
- 86:    public int plagueDuration;
- 87:    public int plagueStrength;
- 88:    public int plagueGracePeriod = 1;
- 89:    public int plagueMaxOccurance = 1;
- 90:    public int questionMark3;
- 91:    public String unknown = "Unknown";
- 92:    public int respawnFlagUnits = 1;
- 94:    public int goldForCapture = 0;
- 97:    public int questionMark4 = -1;
- 98:    public int eruptionPeriod = 5000;
- 99:    public int mpBaseTime = 24;
- 100:    public int mpCityTime = 3;
- 101:    public int mpUnitTime = 1;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 69:    public int questionMark1;
- 70:    byte questionMark2;
- 90:    public int questionMark3;
- 91:    public String unknown = "Unknown";
- 97:    public int questionMark4 = -1;
- 145:            unknown = unknown.trim();
- 392:        return questionMark1;
- 397:        return questionMark2;
- 472:        return questionMark3;
- 477:        return unknown;
- 512:        return questionMark4;
- 694:    public void setQuestionMark1(int questionMark1)
- 696:        this.questionMark1 = questionMark1;
- 699:    public void setQuestionMark2(byte questionMark2)
- 701:        this.questionMark2 = questionMark2;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
