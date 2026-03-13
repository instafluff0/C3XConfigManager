# FLAV Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/FLAV.java
- Base type: BIQSection

## Implementation Notes
- No explicit dataLength field found in declaration area.

## Cross-Section Mentions
- 8: * Other sections that know about FLAV: Tech, Bldg, Civ

## Declared Fields (from source)
- 13:    public int questionMark = 1;
- 14:    public String name = "";
- 15:    public int numberOfFlavors;
- 16:    public ArrayList<Integer>relationWithOtherFlavor;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 13:    public int questionMark = 1;
- 37:        return questionMark;
- 55:    public void setQuestionMark(int questionMark)
- 57:        this.questionMark = questionMark;
- 79:        toReturn =  toReturn + "questionMark: " + questionMark + lineReturn;
- 96:        if (!(questionMark == two.getQuestionMark()))
- 98:                toReturn = toReturn + "QuestionMark: " + questionMark + separator + two.getQuestionMark() + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
