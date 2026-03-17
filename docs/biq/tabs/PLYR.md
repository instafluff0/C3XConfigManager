# PLYR Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/PLYRTab.java`

## Backing BIQ Sections
- `LEAD`

## Data Dependencies
- `GAME`, colors, `TECH`, `PRTO`, `DIFF`, `GOVT`, `ERAS`, `RACE`, full IO object list

## Quint Layout Contract
Quint uses a player list on the left and grouped player-setup panels on the right.

### Top-Level Fields
- `# of Players`: numeric field
- `Playable Civilizations`: multi-select / list control

### Panels
- `Player Options`
  - Dropdowns:
    - `Civilization`
    - `Government`
    - `Difficulty`
    - `Initial Era`
  - `Starting Treasury`: numeric field
  - Checkboxes:
    - `Human Player`
    - `Civilization Defaults`
    - `Start with Embassies`
    - `Skip First Turn`
- `Player Information`
  - `Player Color`: dropdown
  - `Leader Name`: text field
  - `Gender` subpanel: radio buttons `Male`, `Female`
- `Starting Units`
  - Repeated `Unit` + `Amount` rows
  - Note indicating at least one must be edited above
- `Civilization Settings`
  - `Free Techs` area with technology selectors

## Notes
- Quint separates player-level overrides from civ defaults, but keeps both on the same tab.
