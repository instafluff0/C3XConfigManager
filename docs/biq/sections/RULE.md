# RULE Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/RULE.java
- Base type: BIQSection

## Implementation Notes
- 13:    private int dataLength;

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 13:    private int dataLength;
- 14:    private String townName = "";
- 15:    private String cityName = "";
- 16:    private String metropolisName;
- 18:    private ArrayList<Integer>SSPartsRequired;
- 19:    private int advancedBarbarianInt;
- 20:    private PRTO advancedBarbarian;
- 21:    private int basicBarbarianInt;
- 22:    private PRTO basicBarbarian;
- 23:    private int barbarianSeaUnitInt;
- 24:    private PRTO barbarianSeaUnit;
- 25:    private int citiesForArmy;
- 26:    private int chanceOfRioting;
- 27:    private int draftTurnPenalty;
- 28:    private int shieldCostInGold;
- 29:    private int fortressDefenceBonus;
- 30:    private int citizensAffectedByHappyFace;
- 31:    private int questionMark1;
- 32:    private int questionMark2;
- 33:    private int forestValueInShields;
- 34:    private int shieldValueInGold;
- 35:    private int citizenValueInShields;
- 36:    private int defaultDifficultyLevel;
- 37:    private int battleCreatedUnitInt;
- 38:    private PRTO battleCreatedUnit;
- 39:    private int buildArmyUnitInt;
- 40:    private PRTO buildArmyUnit;
- 41:    private int buildingDefensiveBonus;
- 42:    private int citizenDefensiveBonus;
- 43:    private int defaultMoneyResourceInt;
- 44:    private GOOD defaultMoneyResource;
- 45:    private int chanceToInterceptAirMissions;
- 46:    private int chanceToInterceptStealthMissions;
- 47:    private int startingTreasury;
- 48:    private int questionMark3;
- 49:    private int foodConsumptionPerCitizen;
- 50:    private int riverDefensiveBonus;
- 51:    private int turnPenaltyForWhip;
- 52:    private int scoutInt;
- 53:    private PRTO scout;
- 56:    private int roadMovementRate;
- 57:    private int startUnit1Int;
- 58:    private PRTO startUnit1;
- 59:    private int startUnit2Int;
- 60:    private PRTO startUnit2;
- 61:    private int WLTKDMinimumPop;
- 62:    private int townDefenceBonus;
- 63:    private int cityDefenceBonus;
- 64:    private int metropolisDefenceBonus;
- 65:    private int maxCity1Size;
- 66:    private int maxCity2Size;
- 67:    private int questionMark4;
- 68:    private int fortificationsDefenceBonus;
- 70:    private ArrayList<String>culturalLevelNames;    
- 71:    private int borderExpansionMultiplier;
- 72:    private int borderFactor = 10;
- 73:    private int futureTechCost;
- 74:    private int goldenAgeDuration;
- 75:    private int maximumResearchTime;
- 76:    private int minimumResearchTime;
- 77:    private int flagUnitInt;
- 78:    private PRTO flagUnit;
- 79:    private int upgradeCost;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 31:    private int questionMark1;
- 32:    private int questionMark2;
- 48:    private int questionMark3;
- 67:    private int questionMark4;
- 168:        return questionMark1;
- 173:        return questionMark2;
- 238:        return questionMark3;
- 313:        return questionMark4;
- 445:    public void setQuestionMark1(int questionMark1)
- 447:        this.questionMark1 = questionMark1;
- 450:    public void setQuestionMark2(int questionMark2)
- 452:        this.questionMark2 = questionMark2;
- 524:    public void setQuestionMark3(int questionMark3)
- 526:        this.questionMark3 = questionMark3;
- 611:    public void setQuestionMark4(int questionMark4)

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
