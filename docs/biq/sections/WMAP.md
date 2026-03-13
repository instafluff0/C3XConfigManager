# WMAP Section

## Source
- Class path: ../Quint_Editor/Shared/Civ3_Shared_Components/src/main/java/com/civfanatics/civ3/biqFile/WMAP.java
- Base type: BIQSection

## Implementation Notes
- 13:    public int dataLength = 168; //with no resourceOccurence

## Cross-Section Mentions
- No explicit Other sections comment found in class header.

## Declared Fields (from source)
- 14:    public int numResources;
- 15:    public ArrayList<Integer>resourceOccurence;    
- 17:    public int height;
- 19:    public int numCivs;
- 22:    public int width;
- 24:    public String unknown124 = "";
- 25:    public int mapSeed;
- 26:    public int flags;
- 27:    public boolean xWrapping;
- 28:    public boolean yWrapping;
- 29:    public boolean polarIceCaps;

## Constants / Flags
- No section-specific public constants found.

## Unknown / Reverse-Engineering Markers
- 20:    public int questionMark1;  //seems to be 0.7 * height on new (blank) Firaxis maps.  Is 0.75*height on WWII.
- 21:    public int questionMark2 = 0;  //always seems to be zero.
- 23:    public int questionMark3 = -1;  //seems to be -1 in Firaxis maps.
- 24:    public String unknown124 = "";
- 68:        return questionMark1;
- 73:        return questionMark2;
- 83:        return questionMark3;
- 88:        return unknown124;
- 146:    public void setQuestionMark1(int questionMark1)
- 148:        this.questionMark1 = questionMark1;
- 151:    public void setQuestionMark2(int questionMark2)
- 153:        this.questionMark2 = questionMark2;
- 161:    public void setQuestionMark3(int questionMark3)
- 163:        this.questionMark3 = questionMark3;
- 166:    public void setUnknown124(String unknown)

## Notes for C3XConfigManager Docs
- Use this class as authoritative for binary field names, flag packing, and unresolved unknowns.
- When documenting a field in app UI, verify both declaration semantics in this class and read/write behavior in IO.java.
