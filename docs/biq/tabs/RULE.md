# RULE Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/RULETab.java`

## Backing BIQ Sections
- `RULE`

## Data Dependencies
- `PRTO`, `DIFF`, `GOOD`, `BLDG`

## Quint Layout Contract
Quint uses a large grouped form for global rule values.

### Panels
- `Default Units`
  - Dropdowns for:
    - `Captured Unit`
    - `Start Unit 1`
    - `Start Unit 2`
    - `Scout`
    - `Battle-Created`
    - `Adv. Barbarian`
    - `Basic Barbarian`
    - `Build-Army`
    - `Flag Unit`
    - `Barbarian Ship`
- `City Size Limits`
  - Level names and maximum sizes for level 1 / 2 / 3
- `Citizen Mood`
  - Numeric fields for WLTKD, happy-face effect, hurry penalties, draft penalties, riot chance
- `Technology`
  - `Future Tech Cost`
  - `Minimum Research Time`
  - `Maximum Research Time`
- `Various Unit Abilities`
  - intercept chances
  - army-support city count
- `Hurry Production/Wealth`
  - citizen value in shields
  - shield cost in gold
  - capitalization rate
  - forest value in shields
  - shield value in gold
- `Spaceship Parts`
  - number of parts
  - required counts
- `Other`
  - road movement rate
  - upgrade cost
  - food consumption per citizen
  - starting treasury
  - golden age duration
  - default AI difficulty
  - default money resource
- `Defensive Bonuses`
  - numeric bonuses for:
    - `Town`
    - `City`
    - `Metropolis`
    - `Fortress`
    - `River`
    - `Fortification`
    - `Citizen`
    - `Building`
- `Unknowns`
  - four unknown numeric fields

## Notes
- Quint’s RULE tab is grouped by gameplay domain rather than physical binary layout.
