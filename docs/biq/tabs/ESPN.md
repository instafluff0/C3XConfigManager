# ESPN Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/ESPNTab.java`

## Backing BIQ Sections
- `ESPN`

## Data Dependencies
- ESPN records only

## Quint Layout Contract
Quint uses an espionage mission list on the left and a small detail form on the right.

### Top-Level Fields
- `Description`: text field
- `Civilopedia Entry`: text field
- `Cost`: numeric field

### Panel
- `Performed By`
  - Checkboxes:
    - `Diplomats`
    - `Spies`

## Notes
- Quint represents the performer mask as a grouped checkbox panel rather than a bitmask field.
