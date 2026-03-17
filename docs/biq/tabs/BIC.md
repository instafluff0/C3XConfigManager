# BIC Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/tabs/biqc/BIQCTab.java`

## Backing BIQ Sections
- File-level comparison/export utility, not a single 4-char BIQ section

## Data Dependencies
- Access to loaded BIQ files and their full section lists

## Quint Layout Contract
Quint’s visible `BIC` tab is the BIQ comparison/export tool rather than a normal section editor.

### Main Areas
- BIQ selection / compare controls
  - `Current BIQ File`
  - `Compare to`
  - `Compare Mode`
  - `Save check boxes when switching files`
  - custom separator field with `Multi` option
- Output controls
  - `File`
  - output path text field
  - `Browse`
  - `Export!`
  - `Append .txt if not present`
- Rule-section export chooser
  - checkboxes for:
    - Buildings
    - Citizens
    - Culture
    - Difficulty Levels
    - Eras
    - Espionage Missions
    - Experience Levels
    - Flavors
    - Resources
    - Governments
    - Units
    - Civilizations
    - General Settings
    - Technologies
    - Terrains
    - Worker Jobs
    - World Sizes
  - `All` / `None` buttons
- Map-section export chooser
  - checkboxes for:
    - Cities
    - Colonies
    - Continents
    - Starting Locations
    - Tiles
    - Units
    - World Characteristics
    - World Map
  - `All` / `None` buttons
- Other-section export chooser
  - checkboxes for:
    - `Player Data`
    - `Additional Scenario Properties`
- Variable naming mode
  - `BIQ variables`
  - `English`

## Notes
- This is a comparison/reporting utility tab, not a rules-editing tab.
