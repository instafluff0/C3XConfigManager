# TECH Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/TechTab.java`

## Backing BIQ Sections
- `TECH`

## Data Dependencies
- `ERAS`, plus cross-links to `BLDG`, `CTZN`, `GOOD`, `GOVT`, `LEAD`, `PRTO`, `RACE`, `TRFM`

## Quint Layout Contract
Quint uses a technology list on the left and a multi-panel form on the right.

### Top-Level Fields
- `Civilopedia Entry`: text field
- `Era`: dropdown
- `Cost`: numeric field
- `Icon`: numeric field
- Science-advisor blurb: read-only text area

### Panels
- `Prerequisites`
  - Four technology dropdowns
- `Tech Tree Position`
  - `X`: numeric field
  - `Y`: numeric field
- `Flags`
  - Checkboxes:
    - `Not Required for Era Advancement`
    - `Bonus Technology Awarded`
    - `Enables Recycling`
    - `Permits Sacrifice`
    - `Reveals World Map`
- `Diplomacy`
  - Checkboxes:
    - `Enables Alliances`
    - `Enables Right of Passage`
    - `Enables Diplomats`
    - `Enables Mutual Protection Pacts`
    - `Enables Trade Embargos`
    - `Enables Map Trading`
    - `Enables Communication Trading`
- `Trade`
  - Checkboxes:
    - `Cannot Be Traded`
    - `Doubles effect of capitalization`
    - `Enables Trade over Seas`
    - `Enables Trade over Oceans`
- `Military`
  - Checkboxes:
    - `Enables Bridges`
    - `Enables Mobilization Levels`
    - `Enables Conscription`
    - `Enables Precision Bombing`
- `Terrain`
  - Checkboxes:
    - `Enables irrigation without water`
    - `Disables Flood Plain Disease`
    - `Doubles worker work rate`
- `Flavors`
  - Flavor weight controls / list

## Notes
- Quint keeps the tech-tree coordinates in their own titled panel rather than mixing them into general identity fields.
