# MAP Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/MapTab.java`

## Backing BIQ Sections
- `WCHR`, `WMAP`, `TILE`, `CONT`, `SLOC`, `CITY`, `UNIT`, `CLNY`

## Data Dependencies
- Full BIQ object graph, including players, civs, resources, buildings, units, experiences, districts

## Quint Layout Contract
Quint’s MAP tab is not a form tab. It is a map canvas with a right-hand tool sidebar.

### Main Layout
- Center/left: scrollable map canvas
- Right sidebar:
  - Mode/tool icons
  - Brush size controls
  - Tile preview / tile name
  - Context-sensitive editors for the currently selected tile

### Tool Modes
- `Select`
- `Terrain`
- Overlay / city / unit / district / fog tools
- Brush diameter controls

### Context Panels
- `Owner`
  - Owner type radio choices such as none / barbarians / player / civ
  - Owner dropdowns
- `Districts`
  - District assignment controls
  - Wonder / natural wonder assignment controls

### Other Sidebar Editors
- Tile flags and overlays
- Resource selection
- City/building/unit details for selected map objects

## Notes
- Quint’s map editor is mode-driven. The visible controls in the sidebar change based on what is selected and which brush mode is active.
