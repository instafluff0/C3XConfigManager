# TFRM Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/TRFMTab.java`

## Backing BIQ Sections
- `TFRM`

## Data Dependencies
- `TECH`, `GOOD`

## Quint Layout Contract
Quint uses a worker-job list on the left and a compact form on the right.

### Top-Level Fields
- `Civilopedia Entry`: text field
- `Order`: text field
- `Turns to Complete`: numeric field
- `Prerequisite`: technology dropdown

### Panel
- `Required Resources`
  - Two resource dropdown slots

## Notes
- Quint treats required resources as a grouped subpanel, even though the rest of the tab is flat.
