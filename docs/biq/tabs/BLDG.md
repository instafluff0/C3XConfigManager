# BLDG Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/BldgTab.java`

## Backing BIQ Sections
- `BLDG`

## Data Dependencies
- `RULE`, `TECH`, `GOOD`, `GOVT`, `PRTO`, `FLAV`

## Quint Layout Contract
Quint arranges the Building tab in three vertical columns plus the building list.

### Left Column
- `Properties`
  - `Civilopedia Entry`: text field
  - `Cost`: number field
  - `Maintenance`: number field
  - `Culture`: number field
  - `Production bonus`: number field
  - `Pollution`: number field
  - Category: radio buttons for `Wonder`, `Small Wonder`, `Improvement`
- `Military`
  - Number fields: `Land Bombard`, `Air attack`, `Defence Bonus`, `Sea Bombard`, `Sea attack`, `Naval defence`
  - `Veteran` subpanel: checkboxes `Air`, `Land`, `Sea`
  - Checkboxes:
    - `Stealth Barrier`
    - `75% defence vs ICBM's`
    - `Nukes`
    - `Double combat vs Barbarians`
    - `Armies without leader`
    - `Larger armies`
    - `More leaders`
    - `Safe at sea`
    - `+1 sea moves`
    - `+2 sea moves`
    - `Half cost upgrades`
    - `Can heal in enemy territory`
    - `Stonger armies`
    - `Double city defences (global)`
- `Food`
  - Checkboxes:
    - `+1 food in water`
    - `Cities store food`
    - `Cities gain +2 population instead of +1`
  - `Allows city size` subpanel: checkboxes `2`, `3`
- `Science`
  - Checkboxes:
    - `+50% in city`
    - `+100% in city`
    - `2 free advances`
    - `Gain any technology known by two civs`
- `Gain`
  - `In every city`: dropdown
  - `In every city on this continent`: dropdown
  - `Unit`: dropdown
  - `Frequency`: number field
- `Made obsolete by`
  - Dropdown in its own row/panel

### Middle Column
- `Requirements`
  - `Building`: dropdown
  - `Number`: number field
  - `Government`: dropdown
  - `Technology`: dropdown
  - Checkboxes:
    - `Near river`
    - `Victorious army`
    - `Coastal`
    - `By water`
    - `Elite Ship`
  - `Armies`: number field
  - `Resources` subpanel:
    - Resource 1 dropdown
    - Resource 2 dropdown
    - `In city radius` checkbox
- `Trade`
  - Checkboxes:
    - `Air trade`
    - `Water trade`
    - `Capitalization`
    - `+50% tax revenue`
    - `Increased water trade`
    - `+1 trade per tile`
    - `Pays trade maintenance`
    - `5% treasury interest`
  - `Reduces corruption` subpanel: checkboxes `City`, `Empire`
- `Happiness`
  - Numeric matrix:
    - `Happy faces`: `City`, `Global`
    - `Unhappy faces`: `City`, `Global`
  - `Continental`: checkbox
  - `Reduces war weariness` subpanel: checkboxes `City`, `Empire`
  - Checkboxes:
    - `More luxury happiness`
    - `+50% luxury tax`
  - `Doubles happiness of`: dropdown
- `Other`
  - Checkboxes:
    - `Center of empire`
    - `Replaces others with this flag`
    - `No population pollution`
    - `Less building pollution`
    - `Can meltdown`
    - `Doubles sacrifice`
    - `More shields in water`
    - `Propaganda Resistance`
    - `Can build spaceship parts`
    - `Tourist Attraction`
    - `Allows spies`
    - `Allows diplomatic victory`
  - `Spaceship part`: number field

### Right Column
- `Characteristics`
  - Checkboxes:
    - `Militaristic`
    - `Religious`
    - `Commercial`
    - `Industrial`
    - `Expansionist`
    - `Scientific`
    - `Agricultural`
    - `Seafaring`
- Standalone checkboxes below `Characteristics`
  - `Charm Barrier`
  - `General Telepad`
- `Flavors`
  - Multi-select list

## Control Mapping Guidance For This App
- Keep Quint section names and field labels unless there is a strong UI reason not to.
- Use searchable reference pickers instead of plain dropdowns for `TECH`, `GOOD`, `GOVT`, `PRTO`, and `BLDG` references.
- Where we have art or civpedia context, prefer showing thumbnails or jump actions inside those pickers.
- Preserve Quint's compound groupings when they improve comprehension:
  - Category as a single mutually-exclusive control
  - Veteran as one grouped row
  - Requirements resources as a nested block
  - Trade corruption as a grouped pair
  - Happiness faces and war weariness as grouped controls
  - Food city-size unlocks as a grouped pair

## Notes
- This file documents Quint's UI grouping, labels, and widget classes for the BLDG tab so our Improvements tab can stay aligned without re-reading the Java source.
