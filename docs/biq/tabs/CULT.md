# CULT Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/CultTab.java`

## Backing BIQ Sections
- `CULT`

## Data Dependencies
- None beyond the CULT section itself

## Quint Layout Contract
Quint presents CULT as a flat numeric form with one titled ratio panel.

### Top-Level Fields
- `Chance of Successful Propaganda`: numeric field
- `Chance of Resistance (initial)`: numeric field
- `Chance of Resistance (continued)`: numeric field

### Panel
- `Culture Ratio`
  - Ratio editor with numerator / denominator fields

### Cultural Levels Area
- `Cultural Levels` table-like block
  - `Level Multiplier`: repeated numeric fields
  - `Border Factor`: repeated numeric fields

## Notes
- Quint does not split CULT into many subsections; it is mostly one page of numeric tuning values.
