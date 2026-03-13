# ERAS Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/ERAS.java
- Base type: BIQSection

## Implementation Notes
- 13:    private int dataLength = 264;

## Cross-Section Mentions
- 8: * Other sections that know about ERAS: Civ, Tech

## Declared Fields (from source)
- 13:    private int dataLength = 264;
- 14:    private String name = "";
- 15:    private String civilopediaEntry = "";
- 16:    private String researcher1 = "";
- 17:    private String researcher2 = "";
- 18:    private String researcher3 = "";
- 19:    private String researcher4 = "";
- 20:    private String researcher5 = "";
- 21:    private int usedResearcherNames;
- 22:    private int questionMark = 1;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 22:    private int questionMark = 1;
- 88:        return questionMark;
- 131:    public void setQuestionMark(int questionMark)
- 133:        this.questionMark = questionMark;
- 152:        toReturn = toReturn + "questionMark: " + questionMark + lineReturn;
- 195:        if (!(questionMark == two.getQuestionMark()))
- 197:                toReturn = toReturn + "QuestionMark: " + questionMark + separator + two.getQuestionMark() + lineReturn;

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
