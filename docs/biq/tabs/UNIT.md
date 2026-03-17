# UNIT Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/UnitTab.java`

## Backing BIQ Sections
- `PRTO`

## Data Dependencies
- `TECH`, `GOOD`, `TERR`, `RACE`, `BLDG`, `RULE`, `GAME`, `LEAD`

## Quint Layout Contract
Quint uses a unit list on the left and a very large grouped editor on the right.

### Top-Level Fields
- `Civilopedia Entry`: text field
- `Prerequisite`: technology dropdown
- `Upgrades to`: dropdown
- Class domain toggles:
  - `Land`
  - `Sea`
  - `Air`
- Icon / preview area

### Panels
- `Unit Statistics`
  - Numeric fields:
    - `Attack`
    - `Defence`
    - `Movement`
    - `Bombard Strength`
    - `Bombard Range`
    - `Bombard Rate of Fire`
    - `Hitpoint Bonus`
    - `Air Defence`
    - `Operational Range`
    - `Transport Capacity`
    - `Population Cost`
    - `Shield Cost`
    - `Worker Strength`
  - Checkboxes:
    - `Requires Support`
    - `Has Zone of Control`
    - `Bombard Animation`
    - `Causes Collateral Damage`
    - `Can Create Craters`
- `AI Strategies`
  - Split into subpanels:
    - `Land Strategies`
    - `Sea`
    - `Air`
  - Uses many checkboxes for the AI role flags within each domain
- `Class`
  - Radio / toggle style selection for unit domain/class
- `Worker Actions`
  - Checkboxes for build/clear/automate/join-city actions
- `Special Orders`
  - Checkboxes for load/unload/airlift/airdrop/pillage/bombard/stealth/build-army/finish-improvement/science-age/upgrade/capture/enslave/sacrifice/teleportable/telepad/charm
  - `Enslave Results In`: dropdown
- `Standard Orders`
  - Checkboxes for skip / wait / go to / fortify / disband / similar basic orders
- `Required Resources`
  - Three resource dropdown slots
- `Air Missions`
  - Checkboxes for bomb / rebase / precision bomb / recon / intercept
- `Lists`
  - Multi-select lists / list widgets for:
    - unit abilities
    - available to
    - ignore terrain cost
    - stealth targets
    - legal unit telepads
    - legal building telepads

## Notes
- Quint’s unit tab is a panel-of-panels design. Most boolean-heavy groups are checkbox matrices rather than flat key/value rows.
