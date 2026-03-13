# BLDG Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/BLDG.java
- Base type: BIQSection

## Implementation Notes
- 16:    private int dataLength = 268;     //should be ?268?

## Cross-Section Mentions
- 8: * Other sections that know about BLDG: RULE, MAP

## Declared Fields (from source)
- 21:    private int gainInEveryCity;
- 22:    private int gainOnContinent;
- 23:    private int reqImprovement;
- 24:    private int cost;
- 25:    private int culture;
- 26:    private int bombardDefence;
- 27:    private int navalBombardDefence;
- 28:    private int defenceBonus;
- 29:    private int navalDefenceBonus;
- 30:    private int maintenanceCost;
- 31:    private int happyAll;
- 32:    private int happy;
- 33:    private int unhappyAll;
- 34:    private int unhappy;
- 35:    private int numReqBuildings;
- 36:    private int airPower;
- 37:    private int navalPower;
- 38:    private int pollution;
- 39:    private int production;
- 40:    private int reqGovernment;
- 41:    private int spaceshipPart = -1;
- 42:    private int reqAdvanceInt;
- 43:    private TECH reqAdvance;
- 44:    private int obsoleteByInt;
- 45:    private TECH obsoleteBy;
- 46:    private int reqResource1Int;
- 47:    private int reqResource2Int;
- 48:    private GOOD reqResource1;
- 49:    private GOOD reqResource2;
- 54:    private int armiesRequired;
- 55:    private int flavors;
- 56:    private int questionMark = 4;
- 58:    private PRTO unitProduced;
- 59:    private int unitFrequency;
- 61:    private boolean centerOfEmpire;
- 62:    private boolean veteranUnits;
- 63:    private boolean increasedResearch;
- 65:    private boolean increasedTaxes;
- 66:    private boolean removePopPollution;
- 67:    private boolean reduceBldgPollution;
- 70:    private boolean reducesCorruption;
- 71:    private boolean doublesCityGrowthRate;
- 73:    private boolean allowCityLevel2;
- 74:    private boolean allowCityLevel3;
- 75:    private boolean replacesOtherWithThisTag;
- 76:    private boolean mustBeNearWater;
- 79:    private boolean mayExplodeOrMeltdown;
- 80:    private boolean veteranSeaUnits;
- 81:    private boolean veteranAirUnits;
- 82:    private boolean capitalization;
- 83:    private boolean allowWaterTrade;
- 84:    private boolean allowAirTrade;
- 85:    private boolean reducesWarWeariness;
- 89:    private boolean increasesTradeInWater;
- 90:    private boolean charmBarrier;
- 92:    private boolean actsAsGeneralTelepad;
- 93:    private boolean doublesSacrifice;
- 97:    private boolean coastalInstallation;
- 98:    private boolean militaryInstallation;
- 99:    private boolean wonder;
- 100:    private boolean smallWonder;
- 101:    private boolean continentalMoodEffects;
- 102:    private boolean researchInstallation;
- 103:    private boolean tradeInstallation;
- 104:    private boolean explorationInstallation;
- 105:    private boolean placeOfWorship;
- 106:    private boolean constructionInstallation;
- 107:    private boolean agriculturalInstallation;
- 108:    private boolean seafaringInstallation;
- 111:    private boolean increasesChanceOfLeaderAppearance;
- 112:    private boolean buildArmiesWithoutLeader;
- 113:    private boolean buildLargerArmies;
- 114:    private boolean treasuryEarnsInterest;
- 115:    private boolean buildSpaceshipParts;
- 116:    private boolean forbiddenPalace;
- 117:    private boolean decreasesSuccessOfMissiles;
- 118:    private boolean allowSpyMissions;
- 119:    private boolean allowsHealingInEnemyTerritory;
- 120:    private boolean goodsMustBeInCityRadius;
- 121:    private boolean requiresVictoriousArmy;
- 122:    private boolean requiresEliteShip;
- 125:    private boolean safeSeaTravel;
- 126:    private boolean gainAnyTechsKnownByTwoCivs;
- 127:    private boolean doubleCombatVsBarbarians;
- 128:    private boolean increasedShipMovement;
- 129:    private boolean doublesResearchOutput;
- 130:    private boolean increasedTrade;
- 131:    private boolean cheaperUpgrades;
- 132:    private boolean paysTradeMaintenance;
- 133:    private boolean allowsNuclearWeapons;
- 134:    private boolean doubleCityGrowth;
- 135:    private boolean twoFreeAdvances;
- 136:    private boolean empireReducesWarWeariness;
- 137:    private boolean doubleCityDefences;
- 138:    private boolean allowDiplomaticVictory;
- 139:    private boolean plusTwoShipMovement;
- 140:    private boolean questionMarkWonderTrait;
- 141:    private boolean increasedArmyValue;
- 142:    private boolean touristAttraction;
- 145:    private ArrayList<Boolean>flavours;
- 146:    private int numFlavors;
- 148:    private int bldgIndex;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 56:    private int questionMark = 4;
- 140:    private boolean questionMarkWonderTrait;
- 440:    public void setQuestionMark(int questionMark)
- 442:        this.questionMark = questionMark;
- 763:    public void setQuestionMarkWonderTrait(boolean questionMarkWonderTrait)
- 765:        this.questionMarkWonderTrait = questionMarkWonderTrait;
- 960:        return questionMark;
- 1299:        return questionMarkWonderTrait;
- 1475:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 1859:            questionMarkWonderTrait = true;
- 2051:        if (questionMarkWonderTrait)
- 2200:        toReturn = toReturn + "  questionMarkWonderTrait: " + questionMarkWonderTrait + lineReturn;
- 2209:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 2627:        if (!(questionMarkWonderTrait == two.getQuestionMarkWonderTrait()))
- 2629:                toReturn = toReturn + "  QuestionMarkWonderTrait: " + questionMarkWonderTrait+ separator + two.getQuestionMarkWonderTrait() + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
