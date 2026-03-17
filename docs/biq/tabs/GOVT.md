# GOVT Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/GOVTTab.java`

## Backing BIQ Sections
- `GOVT`

## Data Dependencies
- `EXPR`, `ESPN`, `TECH`, plus cross-links to `BLDG`, `CIV`, `PLYR`

## Quint Layout Contract
Quint uses a government list on the left and a dense multi-panel form on the right.

### Top-Level Fields
- `Civilopedia Entry`: text field
- `Prerequisite`: technology dropdown

### Panels
- `Corruption/Waste`
  - Radio buttons:
    - `Minimal`
    - `Nuisance`
    - `Problematic`
    - `Rampant`
    - `Catastrophic`
    - `Communal`
    - `Off`
- Untitled government-parameters box
  - Numeric / spinner fields:
    - `Sci/Tax/Ent Cap`
    - `Worker Rate`
    - `Assimilation %`
    - `Draft Limit`
    - `Military Police`
- `Unit Support`
  - `All Units Free`: checkbox
  - Numeric fields:
    - `Cost Per Unit`
    - `Free Units`
  - `Free Units Per...` subpanel:
    - `Town`
    - `City`
    - `Metropolis`
- `War Weariness`
  - Radio buttons: `None`, `Low`, `High`
- `Hurrying Labor`
  - Radio buttons: `Impossible`, `Forced Labor`, `Paid Labor`
- `Flags`
  - Checkboxes:
    - `Default Type`
    - `Transition Type`
    - `Requires Maintenance`
    - `-1 Penalty on 3+ Food/Prod/Com`
    - `+1 Bonus on 1+ Commerce`
    - `Xenophobia`
    - `Forced Resettlement`
- Government-relations table
  - Per-government matrix with `Resistance Modifier` and `Propaganda`
- `Espionage`
  - Dropdowns:
    - Diplomat skill
    - Spy skill
    - Immune to
- `Ruler Titles`
  - Enabled-row checkboxes
  - Paired `Masculine` / `Feminine` title text fields for up to 4 rows

### Auxiliary Fields
- Four unknown numeric/text fields sit outside the major panels.

## Notes
- Quint mixes titled panels with one untitled etched box for the core government numeric parameters.
