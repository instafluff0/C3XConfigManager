# TERR Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/TERRTab.java`

## Backing BIQ Sections
- `TERR`

## Data Dependencies
- `TFRM`, `GOOD`

## Quint Layout Contract
Quint uses a terrain list on the left and a structured terrain form on the right.

### Top-Level Terrain Values
- Two-column layout for `Regular Terrain` and `Landmark Terrain`
- Numeric fields for:
  - `Food`
  - `Shields`
  - `Commerce`
  - `Irrigation Bonus`
  - `Mining Bonus`
  - `Trade Bonus`
  - `Movement Cost`
  - `Defence Bonus`
- `Civilopedia Entry`: text field
- `Landmark Terrain Name`: text field
- `Landmark Enabled`: checkbox
- `Pollution Yields`: dropdown
- `Worker Terraform Action`: dropdown
- `Strength`: numeric field
- `Unknown 1`, `Unknown 2`: numeric/text fields
- `Possible Resources`: list / multi-select area

### Panel
- `Flags`
  - Checkboxes:
    - `Allow Cities`
    - `Allow Colonies`
    - `Allow Airfields`
    - `Allow Outposts`
    - `Allow Radar Towers`
    - `Allow Forts`
    - `Impassable`
    - `Impassable by Wheeled Units`
    - `Causes Disease`
    - `Disease cured by sanitation`

## Notes
- Quint visually emphasizes regular vs landmark values as paired columns.
