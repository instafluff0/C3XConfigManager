# Tab Mapping and Dependencies

## Source
- ../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/EditorTabbedPane.java

## Visible tabs (setup order)
- BIC (BIQC tab)
- BLDG
- CIV
- CTZN
- CULT
- DIFF
- ERA
- ESPN
- EXPR
- FLAV
- GOOD
- GOVT
- PLYR
- RULE
- PROP (GAME/scenario properties)
- TECH
- TERR
- TFRM
- Unit (PRTO)
- WSIZ
- MAP (if graphics enabled)

## sendData dependency graph (from code)
- BLDG: buildings + rules + tech + resources + difficulty + civ + flavors + units
- CIV: civilizations + units + governments + eras + tech + colors
- DIFF: difficulties
- Unit/PRTO: units + tech + resources + terrain + civ + buildings
- TECH: tech + eras
- CTZN: citizens + tech
- RULE: rules + units + difficulties + resources + buildings
- GOVT: governments + experience + espionage + tech
- TERR: terrain + worker jobs + resources
- PROP/GAME: scenario properties + civilizations
- ERA: eras
- ESPN: espionage
- TFRM: worker jobs + tech + resources
- WSIZ: world sizes
- EXPR: experience
- PLYR: scenario properties + players + colors + tech + units + difficulties + gov + eras + civ + whole IO
- FLAV: flavors (Conquests only)

## Notes
- PLYR tab is tied to optional LEAD custom-player-data section.
- MAP tab corresponds to WCHR/WMAP/TILE/CONT/SLOC/CITY/UNIT/CLNY map-related sections.
