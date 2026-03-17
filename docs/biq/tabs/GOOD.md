# GOOD Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/GoodTab.java`

## Backing BIQ Sections
- `GOOD`

## Data Dependencies
- `TECH`, plus cross-tab links to `TERR`, `TRFM`, `PRTO`, `BLDG`, `RULE`, `MAP`

## Quint Layout Contract
Quint uses a resource list on the left and a medium-size form on the right.

### Top-Level Fields
- `Civilopedia Entry`: text field
- `Prerequisite`: technology dropdown
- `Icon`: numeric field
- `Appearance Ratio`: numeric field
- `Disappearance Ratio`: numeric field
- `Appearances on Map`: read-only label/count
- Large icon preview/editor area

### Panels
- `Bonuses`
  - Numeric fields:
    - `Food`
    - `Shields`
    - `Commerce`
- `Type`
  - Radio buttons:
    - `Bonus`
    - `Luxury`
    - `Strategic`

## Notes
- Quint puts the art preview beside the `Bonuses` and `Type` panels instead of making it a separate tab.
