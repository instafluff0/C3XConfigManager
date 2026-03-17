# PROP Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/GAMETab.java`

## Backing BIQ Sections
- `GAME`

## Data Dependencies
- `RACE`

## Quint Layout Contract
Quint exposes `GAME` as the visible `PROP` tab. It is a large scenario-properties form with many titled panels.

### Top-Level Scenario Fields
- `Scenario Title`: text field
- `Description`: multiline text area
- `Search Folders`: text field
- `Debug Mode`: checkbox
- `Barbarian Activity`: selector
- `Default Conditions`: checkbox
- `Default Rules`: checkbox

### Panels
- `Time`
  - `Start Date`
  - base unit of time
  - turn/date progression controls
- `Time Limit`
  - `Turns`
  - `Minutes`
- `MP Turn Time Limits`
  - `Base`
  - `Per City`
  - `Per Unit`
- `Victory Conditions`
  - Main victory-condition toggles
  - auto-placement / reveal / retain-culture toggles
- `Game Rules`
  - global scenario-rule toggles
- `Victory Limits`
  - `Victory Points`
  - `City Elimination`
  - `1-City Culture`
  - `Empire Culture`
  - domination land/population percentages
- `Victory Points`
  - Wonder multiplier
  - advancement points
  - defeating-unit points
  - city conquest points
  - victory-location points
  - capture-princess points
  - gold-for-capture
  - related checkboxes
- `Plague`
  - Name
  - Earliest start
  - Variance
  - Duration
  - Strength
  - Grace period
  - Max times
  - volcano eruption period
- `Locked Alliances`
  - Alliance names
  - coalition membership matrix
- `War - # Represents Alliance`
  - alliance war-state matrix
- `Victory Type`
  - Radio buttons: `Individual`, `Coalition`

## Notes
- Quint keeps nearly all scenario-global toggles in PROP rather than distributing them across section-specific tabs.
