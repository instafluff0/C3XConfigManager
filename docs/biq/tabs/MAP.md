# MAP Tab

## Source
- ../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/MapTab.java

## Backing BIQ Sections
- WCHR, WMAP, TILE, CONT, SLOC, CITY, UNIT, CLNY

## Data Dependencies
- Requires graphics-enabled mode and map panel components
- Ownership/color/era display additionally depends on LEAD + RACE when custom player data is present.

## Notes
- Mapping taken from EditorTabbedPane setup/sendData wiring in Quint_Editor.
- Use this as the first-stop reference when aligning C3XConfigManager UI with Quint_Editor data expectations.

## Critical Runtime Model
- Tile identity is not stored as `(x,y)` directly in BIQ order; the TILE list is linear and Quint assigns runtime coordinates after import.
- Coordinate assignment used by Quint import:
  - Start `(x,y) = (0,0)`.
  - For each tile, assign current `(x,y)`, then `x += 2`.
  - When `x >= width` on even rows, advance to next row with `y += 1, x = 1`.
  - When `x >= width` on odd rows, advance to next row with `y += 1, x = 0`.
- Expected tile count is `width * height / 2` (diamond-grid encoding).

## Tile Index Math (Authoritative)
From `IO.calculateTileIndex(int xPos, int yPos)`:
- If `y` is out of bounds, index is invalid (`-1`).
- `x` wraps east/west unconditionally in Quint (`x < 0` or `x >= width` is wrapped by width).
- Index formula:
  - `index = (y / 2) * width`
  - If `y` odd: `index += width / 2`
  - `index += x / 2`
- Reverse mapping (`IO.calculateTilePosition(index)`):
  - `row = index / (width / 2)`
  - `column = (index % (width / 2)) * 2`
  - If `row` odd: `column += 1`
  - `(x,y) = (column,row)`

## Ownership Resolution (What Tile Owner Means)
Quint has two ownership concepts on a tile:

1. Hard owner (`TILE.getHardOwner*`)
- Derived from direct occupier:
  - `tile.colony` -> `CLNY.owner/ownerType`
  - else `tile.city` -> `CITY.owner/ownerType`
  - else first unit on tile -> `UNIT.owner/ownerType`
  - else none
- This is direct control of the tile object itself.

2. Border/cultural owner (`TILE.owner`, `TILE.ownerType`, `TILE.borderColor`)
- Recomputed by `IO.calculateTileOwners()`, not read directly from TILE bytes.
- Pipeline:
  - `calculateInfluenceOfCities()`: builds per-tile `citiesWithInfluence`.
  - `findNearestCities(x,y)`: among cities that influence the tile, find nearest city/cities by Quint’s ring-expansion search.
  - Tie-break by highest `CITY.culture`.
  - Final owner source is winning city owner.
- Owner type constants come from CITY:
  - `0 = None`, `1 = Barbarians`, `2 = Civ`, `3 = Player`.

## Owner -> Civ -> Race/Culture Group -> Era Chain
This is the chain needed for map rendering parity:

1. Determine owner semantic
- If ownerType is `Civ`: owner is RACE index.
- If ownerType is `Player`: owner is LEAD index (player slot), then resolve `LEAD.civ` for civ identity.

2. Resolve race/culture group
- Civ identity resolves to `RACE`.
- City art culture group uses `RACE.cultureGroup`.

3. Resolve era for art variants
- Era used for city/colony/fort style comes from `LEAD.initialEra` (player), not from tile or city.
- Quint clamps future era (`4`) to modern art bucket (`3`) where graphics only have 4 buckets.

4. Resolve border color
- For civ-owned tiles: `RACE.defaultColor`, unless custom player color override exists in LEAD.
- For player-owned tiles: prefer `LEAD.color` when custom civ data is active; otherwise derive from linked civ default color.

## Terrain Identity: Base/Real vs File/Image
Tile terrain has two distinct representations you must keep coherent:

1. Logical terrain IDs
- Conquests packed byte `C3CRealBaseTerrain`:
  - High nibble: real terrain.
  - Low nibble: base terrain.
- Quint decodes via `TILE.setUpNibbles()`.
- `real` is the visible feature terrain (forest/jungle/hill/mountain/etc).
- `base` is underlying ground (grassland/plains/desert/coast/etc).

2. Render sheet indices
- `TILE.file`: selects which base-terrain PCX sheet to use.
  - `0..8` map to `xtgc, xpgc, xdgc, xdpc, xdgp, xggc, wcso, wsss, wooo`.
- `TILE.image`: index `0..80` within a 9x9 grid of 128x64 tiles in that sheet.

Quint rendering (`ClassicRenderer`) draws:
- `baseTerrainGraphics[file][image]` for non-landmark.
- `lmTerrainGraphics[file][image]` for landmark.

## How Quint Recalculates File/Image
`MapUtils.recalculateFileAndIndex` uses 4 tiles (`south=self`, `west`, `north`, `east`) and:
- Picks `file` bucket based on combination rules (water/tundra/coast/desert/plains/grassland mixes).
- Computes `image` with a weighted sum:
  - north: `terr2 +=1`, `terr3 +=2`
  - west:  `terr2 +=3`, `terr3 +=6`
  - east:  `terr2 +=9`, `terr3 +=18`
  - south: `terr2 +=27`, `terr3 +=54`
- The resulting sum is the sprite index in the chosen PCX.

## Section-Level Inputs You Need for Tile Introspection
- WMAP:
  - `width`, `height`, wrapping flags, map seed, resource occurrence counts.
- TILE:
  - terrain, overlays, resource link, city/colony links, continent, river connection, VP/ruins/fog fields.
- CITY:
  - owner/ownerType, culture, coordinates.
- UNIT:
  - owner/ownerType, prototype index, coordinates.
- CLNY:
  - owner/ownerType, coordinates, improvement type (`colony/airfield/radar/outpost`).
- SLOC:
  - owner/ownerType, coordinates.

## Post-Processing Requirements (Do Not Skip)
- Run map post-processing after import/mutation:
  - SLOC repair against tile start-location flags.
  - Owner recalculation if city/unit/colony/player ownership inputs changed.
  - Recompute tile influence arrays if city coordinates/culture changed.
- If you mutate base/real terrain, recalc `file/image` for impacted tile and neighbors to avoid graphic desync.

## Known Quint Quirks to Preserve
- `calculateTileIndex` currently wraps X regardless of WMAP xWrapping flag.
- `CITY` is variable-length and parsed single-threaded; do not treat it like fixed-length map sections.
- Certain `questionMark*` fields are unknown but serialized for compatibility; retain unchanged unless proven.
- District tile placement compatibility details are documented in:
  - `docs/biq/districts/README.md`
  - `docs/biq/districts/ScenarioFormat.md`
