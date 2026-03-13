# GOVT Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/GOVT.java
- Base type: BIQSection

## Implementation Notes
- 15:    public int dataLength = 472;

## Cross-Section Mentions
- 8: * Other sections that know about GOVT: bldg, civ

## Declared Fields (from source)
- 14:    private char iWithAccent = '\u00CC';
- 15:    public int dataLength = 472;
- 16:    public int defaultType;
- 17:    public int transitionType;
- 18:    public int requiresMaintenance;
- 19:    public int questionMarkOne;
- 20:    public int tilePenalty;
- 21:    public int commerceBonus;
- 22:    public String name = "";
- 23:    public String civilopediaEntry = "";
- 24:    public String maleRulerTitle1 = "";
- 25:    public String femaleRulerTitle1 = "";
- 26:    public String maleRulerTitle2 = "";
- 27:    public String femaleRulerTitle2 = "";
- 28:    public String maleRulerTitle3 = "";
- 29:    public String femaleRulerTitle3 = "";
- 30:    public String maleRulerTitle4 = "";
- 31:    public String femaleRulerTitle4 = "";
- 32:    public int corruption;
- 33:    public int immuneTo;
- 34:    public int diplomatLevel;
- 35:    public int spyLevel;
- 36:    public int numberOfGovernments;
- 37:    public ArrayList<GOVTGOVTRelations>relations;
- 38:    public int hurrying;
- 39:    public int assimilationChance;
- 40:    public int draftLimit;
- 41:    public int militaryPoliceLimit;
- 42:    public int rulerTitlePairsUsed;
- 43:    public int prerequisiteInt;
- 44:    public TECH prerequisiteTechnology;
- 45:    public int scienceCap;
- 46:    public int workerRate;
- 47:    public int questionMarkTwo;
- 48:    public int questionMarkThree;
- 49:    public int questionMarkFour;
- 50:    public int freeUnits;
- 51:    public int freeUnitsPerTown;
- 52:    public int freeUnitsPerCity;
- 53:    public int freeUnitsPerMetropolis;
- 54:    public int costPerUnit;    
- 55:    public int warWeariness;
- 56:    public int xenophobic;
- 57:    public int forceResettlement;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 19:    public int questionMarkOne;
- 47:    public int questionMarkTwo;
- 48:    public int questionMarkThree;
- 49:    public int questionMarkFour;
- 122:        return questionMarkOne;
- 252:        return questionMarkTwo;
- 257:        return questionMarkThree;
- 262:        return questionMarkFour;
- 320:    public void setQuestionMarkOne(int questionMarkOne)
- 322:        this.questionMarkOne = questionMarkOne;
- 455:    public void setQuestionMarkTwo(int questionMarkTwo)
- 457:        this.questionMarkTwo = questionMarkTwo;
- 460:    public void setQuestionMarkThree(int questionMarkThree)
- 462:        this.questionMarkThree = questionMarkThree;
- 465:    public void setQuestionMarkFour(int questionMarkFour)

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
