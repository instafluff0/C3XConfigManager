# BIQ Binary Format Reference

Comprehensive reference for BIQ binary layout, derived from the Quint_Editor source.
The app is a pure-JS implementation — no Java or JAR dependencies at runtime.

## JS Implementation

| Concern | JS module |
|---|---|
| PKWare IMPLODE decompression | `src/biq/decompress.js` |
| Section orchestration (parse/serialize) | `src/biq/biqBridgeJs.js` |
| Per-section parsers and serializers | `src/biq/biqSections.js` |

Binary layout was derived from the Quint_Editor `IO.java` source at
`../Quint_Editor/Shared/Civ3_Shared_Components/…/biqFile/IO.java` (read-only reference, not used at runtime).

---

## PKWare IMPLODE Decompression

### Header

| Offset | Bytes | Meaning |
|---|---|---|
| 0 | 1 | Must be `0x00` |
| 1 | 1 | Dictionary size: `0x04`=512, `0x05`=1024, `0x06`=2048 |

Byte[1] is re-used as `dictsize` for offset decoding (except when
length == 2, where dictsize is forced to 2).

### Bit Reading

Bits are read **LSB-first** from the stream.  Variables:
- `byteOff` – current byte index (starts at 2, after header)
- `bitOff` – bit position within current byte (0–7)

Reading one bit: `(bytes[byteOff] >> bitOff) & 1`, then `bitOff++`; when
`bitOff == 8`, reset to 0 and `byteOff++`.

### Token Loop

Each iteration reads one token-flag bit:
- `0` → next 8 bits are a literal byte (LSB-first)
- `1` → length/offset back-reference follows

### Length Huffman Table

16 entries: key = `{bitLength, bits}`, value = `{baseValue, extraBits}`.
Read bits one at a time, left-shift accumulating MSB-first until a match.

| bitLen | bits | base | extra |
|---|---|---|---|
| 3 | 0b101 | 2 | 0 |
| 2 | 0b11  | 3 | 0 |
| 3 | 0b100 | 4 | 0 |
| 3 | 0b011 | 5 | 0 |
| 4 | 0b0101| 6 | 0 |
| 4 | 0b0100| 7 | 0 |
| 4 | 0b0011| 8 | 0 |
| 5 | 0b00101| 9 | 0 |
| 5 | 0b00100| 10 | 1 |
| 5 | 0b00011| 12 | 2 |
| 5 | 0b00010| 16 | 3 |
| 6 | 0b000011| 24 | 4 |
| 6 | 0b000010| 40 | 5 |
| 6 | 0b000001| 72 | 6 |
| 7 | 0b0000001| 136 | 7 |
| 7 | 0b0000000| 264 | 8 |

Extra bits are read LSB-first (right-shift accumulate) to add to base value.
`length = base + extraBitsValue`.  **End-of-stream sentinel: length 519.**

### Offset Huffman Table

64 entries.  High-order bits come from the table (6-bit max prefix);
low-order bits (`dictsize` of them) follow immediately.
`finalOffset = (tableOffset << dictsize) | lowBits`.

Then: `copyFrom = currentOutputLength - finalOffset - 1`.
Copy `length` bytes from there (overlapping copy, byte by byte).

---

## BIQ Binary Format

### Magic / Version Detection

| Magic | Notes |
|---|---|
| `BICX` | Uncompressed Conquests (or PTW if major≠12) |
| `BIC ` | Vanilla |
| `BICQ` | Conquests rules embedded in a SAV |

For compressed BIQ files (no `BIC` prefix), run decompressor first.

### File Header (736 bytes)

| Offset | Size | Field |
|---|---|---|
| 0 | 4 | Version tag (`BICX` etc.) |
| 4 | 4 | `VER#` literal |
| 8 | 4 | Always 1 |
| 12 | 4 | Always 720 |
| 16 | 4 | Always 0 |
| 20 | 4 | Always 0 |
| 24 | 4 | Major version (12 = Conquests) |
| 28 | 4 | Minor version (e.g. 8) |
| 32 | 640 | Description (null-padded) |
| 672 | 64 | Title (null-padded) |

### Section Ordering

Sections are read in this order (all Conquests BICX):
`BLDG` → `CTZN` → `CULT` → `DIFF` → `ERAS` → `ESPN` → `EXPR` →
`[FLAV in SAV only]` → `GOOD` → `GOVT` → `RULE` → `PRTO` → `RACE` →
`TECH` → `TFRM` → `TERR` → `WSIZ` → `[FLAV in BIQ]` →
`[WCHR→WMAP→TILE→CONT→SLOC→CITY→UNIT→CLNY if custom map]` →
`GAME` → `[LEAD if custom player data]`

**BLDG special case:** The main loop reads the `BLDG` tag to detect
`hasCustomRules=true`.  `inputBLDG()` begins at the record count, NOT the tag.
All other sections read their own 4-byte tags internally.

### Per-Section Layouts (Conquests BICX)

All integers are little-endian 32-bit signed unless noted.

#### BLDG (Buildings/Wonders)
`count + per-record: 4(dataLen) + 64(description) + 32(name) + 32(civKey) +`
`4×22 scalars: doublesHappiness, gainInEveryCity, gainOnContinent, reqImprovement,`
`cost, culture, bombardDefence, navalBombardDefence, defenceBonus, navalDefenceBonus,`
`maintenanceCost, happyAll, happy, unhappyAll, unhappy, numReqBuildings, airPower,`
`navalPower, pollution, production, reqGovernment, spaceshipPart +`
`reqAdvance, obsoleteBy, reqResource1, reqResource2, improvements, otherChar,`
`smallWonderCharacteristics, wonderCharacteristics, armiesRequired, flavors, questionMark,`
`unitProduced, unitFrequency`
(34 int scalars total after the 3 strings, + 22 more from the original block)

#### CTZN (Citizens)
`tag + count + per-record: 4(dataLen) + 4(defaultCitizen) + 32(name) + 32(civKey) +`
`32(pluralName) + 4(prerequisite) + 4(luxuries) + 4(research) + 4(taxes) +`
`[Conquests: 4(corruption) + 4(construction)]`

#### CULT (Culture Opinions)
`tag + count + per-record: 4(dataLen) + 64(name) + 4(propagandaSuccess) +`
`4(cultRatioPercent) + 4(ratioDenominator) + 4(ratioNumerator) +`
`4(initResistanceChance) + 4(continuedResistanceChance)`

#### DIFF (Difficulty Levels)
`tag + count + per-record: 4(dataLen) + 64(name) + 4(contentCitizens) +`
`4(maxGovtTransition) + 4(AIDefenceStart) + 4(AIOffenceStart) +`
`4(extraStart1) + 4(extraStart2) + 4(additionalFreeSupport) + 4(bonusPerCity) +`
`4(attackBarbariansBonus) + 4(costFactor) + 4(percentOptimal) + 4(AIAITrade) +`
`4(corruptionPercent) + 4(militaryLaw)`

#### ERAS (Eras)
`tag + count + per-record: 4(dataLen) + 64(eraName) + 32(civKey) +`
`32×5(researchers) + 4(usedResearcherNames) + [Conquests: 4(questionMark)]`

#### ESPN (Espionage Missions)
`tag + count + per-record: 4(espnLen) + 128(description) + 64(name) +`
`32(civKey) + 4(missionPerformedBy) + [if>228: 4(baseCost)]`
(Conquests always has baseCost)

#### EXPR (Experience Levels)
`tag + count + per-record: 4(dataLen) + 32(name) + 4(baseHitPoints) +`
`[if ver>=3.08: 4(retreatBonus)]` (Conquests always has retreatBonus)

#### GOOD (Resources)
`tag + count + per-record: 4(dataLen) + 24(name) + 32(civKey) + 4(type) +`
`4(appearanceRatio) + 4(disapperanceProbability) + 4(icon) +`
`4(prerequisite) + 4(foodBonus) + 4(shieldsBonus) + 4(commerceBonus)`
Note: `disapperanceProbability` has a typo (double p, one a) — preserve it.

#### GOVT (Governments)
`tag + count + per-record: 4(dataLen) + 4(defaultType) + 4(transitionType) +`
`4(requiresMaintenance) + 4(questionMark1) + 4(tilePenalty) + 4(commerceBonus) +`
`64(name) + 32(civKey) + 32×8(ruler titles: male1/female1/…/male4/female4) +`
`4(corruption) + 4(immuneTo) + 4(diplomatLevel) + 4(spyLevel) +`
`4(numGovts) + numGovts×12(relations: canBribe+briberyMod+resistanceMod) +`
`4(hurrying) + 4(assimilation) + 4(draftLimit) + 4(militaryPolice) +`
`4(rulerTitlePairsUsed) + 4(prerequisiteTechnology) + 4(scienceCap) +`
`4(workerRate) + 3×4(qm2-4) + 4(freeUnits) + 4×3(perTown/City/Metropolis) +`
`4(costPerUnit) + 4(warWeariness) + [Conquests: 4(xenophobic) + 4(forceResettlement)]`

#### RULE (Global Rules) — variable length
`tag + count + per-record: 4(dataLen) + 32×3(town/city/metropolis names) +`
`4(numSSParts) + numSSParts×4 + 37×4 scalars + 4(numCultureLevels) +`
`numCultureLevels×64 + 4(borderExpansionMultiplier) + 4(borderFactor) +`
`4(futureTechCost) + 4(goldenAgeDuration) + 4(maximumResearchTime) +`
`4(minimumResearchTime) + [PTW+: 4(flagUnit)] + [Conquests: 4(upgradeCost)]`

#### PRTO (Unit Types) — variable length
`tag + count(Firaxis) + per-record: 4(dataLen) + 4(zoc) + 32(name) + 32(civKey) +`
`4×14 scalars + 4(unitAbilities) + 4(AIStrategy) + 4(availableTo) +`
`4(standardOrdersSpecialActions) + 4(airMissions) + 4(unitClass) +`
`4(otherStrategy) + 4(hitPointBonus) + 5×4(PTW orders) +`
`4(bombardEffects) + 14 bytes(ignoreTerrain) + 4(requiresSupport) +`
`[Conquests: 4(useExactCost)+4(telepadRange)+4(qm3) +`
`4(numUnitTelepads)+numUnitTelepads×4 + 4(enslaveResultsIn)+4(qm5) +`
`4(numStealthTargets)+numStealthTargets×4 + 4(qm6) +`
`4(numBuildingTelepads)+numBuildingTelepads×4 +`
`1(createsCraters)+4(workerStrengthFloat)+4(qm8)+4(airDefence)]`

Strategy maps: units with >1 strategy are duplicated (one Firaxis entry per
strategy).  After all regular units, extra entries follow for each additional
strategy.  `otherStrategy` in the extra entries points back to the base unit index.

Unit ability bit positions (bit 0 = LSB):
- 0: wheeled, 1: footSoldier, 2: blitz, 3: cruiseMissile, 4: allTerrainAsRoads
- 5: radar, 6: amphibiousUnit, 7: invisible, 8: transportsOnlyAirUnits, 9: draftable
- 10: immobile, 11: sinksInSea, 12: sinksInOcean, 13: flagUnit, 14: transportsOnlyFootUnits
- 15: startsGoldenAge, 16: nuclearWeapon, 17: hiddenNationality, 18: army, 19: leader
- 20: infiniteBombardRange, 21: stealth, 22: detectInvisible, 23: tacticalMissile
- 24: transportsOnlyTacticalMissiles, 25: rangedAttackAnimations, 26: rotateBeforeAttack
- 27: lethalLandBombardment, 28: lethalSeaBombardment, 29: king, 30: requiresEscort

AIStrategy bit positions (bit N = 2^N):
- 0: offence, 1: defence, 2: artillery, 3: explore, 4: armyUnit, 5: cruiseMissileUnit
- 6: airBombard, 7: airDefenceStrategy, 8: navalPower, 9: airTransport, 10: navalTransport
- 11: navalCarrier, 12: terraform, 13: settle, 14: leader, 15: tacticalNuke, 16: ICBM
- 17: navalMissileTransport, 18: flagStrategy, 19: kingStrategy

ignoreTerrain: 14 bytes (Conquests), 12 bytes (PTW).  Each byte is movement cost override.

#### RACE (Civilizations) — variable length
`tag + count + per-record: 4(dataLen) + 4(numCities) + numCities×24(cityNames) +`
`4(numMilLeaders) + numMilLeaders×32(milLeaderNames) +`
`32(leaderName) + 24(leaderTitle) + 32(civKey) + 40(adjective) +`
`40(civilizationName) + 40(noun) +`
`numEras×260(forwardFilenames) + numEras×260(reverseFilenames) +`
`4(cultureGroup) + 4(leaderGender) + 4(civilizationGender) +`
`4(aggressionLevel) + 4(uniqueCivCounter) + 4(shunnedGovernment) +`
`4(favoriteGovernment) + 4(defaultColor) + 4(uniqueColor) +`
`4×4(freeTechs) + 4(bonuses) + 4(governorSettings) + 4(buildNever) +`
`4(buildOften) + 4(plurality) +`
`[PTW+: 4(kingUnit)] + [Conquests: 4(flavors)+4(questionMark)+4(diplomacyTextIndex) +`
`4(numScientificLeaders) + numScientificLeaders×32]`

#### TECH (Technologies)
`tag + count + per-record: 4(dataLen) + 32(name) + 32(civKey) +`
`4(cost) + 4(era) + 4(advanceIcon) + 4(x) + 4(y) +`
`4×4(prerequisites) + 4(flags) + [Conquests: 4(flavors) + 4(questionMark)]`

TECH flags bits: see `extractEnglish(numFlavours)` in TECH.java.

#### TFRM (Worker Jobs/Terraforms)
`tag + count + per-record: 4(dataLen) + 32(name) + 32(civKey) +`
`4(turnsToComplete) + 4(requiredAdvance) + 4(requiredResource1) +`
`4(requiredResource2) + 32(order)`

#### TERR (Terrain Types) — variable length
`tag + count + per-record: 4(dataLen) + 4(numTotalResources) +`
`ceil(numResources/8) bytes(possibleResources bitmask) +`
`32(name) + 32(civKey) + 4×10 scalars (foodBonus..pollutionEffect) +`
`[if v>=4.1: 1(allowCities)+1(allowColonies)]`
`[PTW+: 1(impassable)+1(impassableByWheeled)+1(allowAirfields)+1(allowForts)+`
`1(allowOutposts)+1(allowRadarTowers)]`
`[Conquests: 4(qm)+1(landmarkEnabled)+4×9(landmark fields)+`
`32(landmarkName)+32(landmarkCivKey)+4(qm2)+4(terrainFlags)+4(diseaseStrength)]`

#### WSIZ (World Sizes)
`tag + count + per-record: 4(dataLen) + 4(optimalNumberOfCities) + 4(techRate) +`
`24(empty) + 32(name) + 4(height) + 4(distanceBetweenCivs) + 4(numberOfCivs) +`
`4(width)`

#### FLAV (Flavors) — only present in BIQ (not SAV)
`tag + 4(always 1 = numGroups) + 4(numFlavors) + per-record: 4(questionMark) +`
`256(name) + 4(numRelations) + numRelations×4(relationValues)`

#### Map Sections (optional, if custom map present)

**WCHR** — world characteristics (tag read before calling inputWCHR):
`4(count) + per-record: 4(dataLen) + 4(selectedClimate)+4(actualClimate) +`
`4(selectedBarbarian)+4(actualBarbarian) + 4(selectedLandform)+4(actualLandform) +`
`4(selectedOcean)+4(actualOcean) + 4(selectedTemp)+4(actualTemp) +`
`4(selectedAge)+4(actualAge) + 4(worldSize)`

**WMAP** — world map metadata:
`tag + 4(count) + per-record: 4(dataLen) + 4(numResources) + numResources×4(occurrence) +`
`4(numContinents) + 4(height) + 4(distanceBetweenCivs) + 4(numCivs) +`
`4(qm1)+4(qm2) + 4(width) + 4(qm3) + 124(unknown) + 4(mapSeed) + 4(flags)`

**TILE** — map tiles:
`tag + 4(count) + per-record (Conquests = 0x31 = 49 bytes):`
`4(dataLen) + 1(riverConnectionInfo) + 1(border) + 4(resource) +`
`1(image) + 1(file) + 2(questionMark) + 1(overlays) + 1(baseRealTerrain) +`
`1(bonuses) + 1(riverCrossingData) + 2(barbarianTribe) + 2(city) + 2(colony) +`
`2(continent) + 1(qm2) + 2(victoryPointLocation) + 4(ruin) + 4(c3cOverlays) +`
`1(qm3) + 1(c3cBaseRealTerrain) + 2(qm4) + 2(fogOfWar) + 4(c3cBonuses) + 2(qm5)`

**CONT** — continents:
`tag + 4(count) + per-record: 4(dataLen) + 4(continentClass) + 4(numTiles)`

**SLOC** — starting locations:
`tag + 4(count) + per-record: 4(dataLen) + 4(ownerType) + 4(owner) + 4(x) + 4(y)`

**CITY** — scenario cities (variable length):
`tag + 4(count) + per-record: 4(dataLen) + 1(hasWalls) + 1(hasPalace) +`
`24(name) + 4(ownerType) + 4(numBuildings) + numBuildings×4 +`
`4(culture) + 4(owner) + 4(size) + 4(x) + 4(y) + 4(cityLevel) +`
`4(borderLevel) + 4(useAutoName)`

**UNIT** — scenario map units:
`tag + 4(count) + per-record: 4(dataLen) + 32(name) + 4(ownerType) +`
`4(experienceLevel) + 4(owner) + 4(PRTONumber) + 4(AIStrategy) +`
`4(x) + 4(y) + [PTW+: 57(customName) + 4(useCivilizationKing)]`

**CLNY** — colonies:
`tag + 4(count) + per-record: 4(dataLen) + 4(ownerType) + 4(owner) +`
`4(x) + 4(y) + [PTW+: 4(improvementType)]`

#### GAME (Scenario Properties) — variable length
`tag(GAME) + 4(count) + per-record: 4(dataLen) + 4(useDefaultRules) +`
`4(defaultVictoryConditions) + 4(numPlayableCivs) + numPlayableCivs×4(civIds) +`
`4(victoryConditionsAndRules) + [PTW+: many fields including scenarioSearchFolders(5200 bytes)]`
`[Conquests: per-civ alliance data + VP limits + plague settings + …]`

#### LEAD (Player Definitions) — variable length
`tag(LEAD) + 4(count) + per-record: 4(dataLen) + 4(customCivData) +`
`4(humanPlayer) + 32(leaderName) + 4(qm1) + 4(qm2) +`
`4(numStartUnits) + numStartUnits×8(count+unitIndex) +`
`4(genderOfLeaderName) + 4(numStartTechs) + numStartTechs×4(techIndex) +`
`4(difficulty) + 4(initialEra) + 4(startCash) + 4(government) + 4(civ) + 4(color) +`
`[PTW+: 4(skipFirstTurn) + 4(qm3) + 1(startEmbassies)]`

---

## BiqBridge Output Format

JSON:
```json
{
  "ok": true,
  "sections": [
    {
      "code": "TECH",
      "title": "Technologies",
      "count": 82,
      "records": [
        {
          "index": 0,
          "name": "Pottery",
          "english": "name: Pottery\ncost: 20\n...",
          "writableBaseKeys": ["name", "cost", "x", "y", "prerequisite1", ...]
        }
      ]
    }
  ]
}
```

### english Field Format

Each record's `english` field is `"fieldName: value\n"` pairs.
All cross-reference fields (prerequisites, techs, resources, etc.) output
**raw integer strings** so that `enrichBridgeSections()` in configCore.js can
resolve them to `"Name (idx)"` format via `maybeFormatIdReference()`.

`parseIntMaybe(v)` returns null for non-integer strings, causing fields like
prerequisites to pass through as-is.  By outputting raw ints, enrichment works
and `parseIntLoose("Pottery (5)")` → 5 in the save path.

### writableBaseKeys

Snake_case field names from the `writableKeys` array on each section's registry entry
in `src/biq/biqSections.js`.  Example: `prerequisite1`.  Used to mark fields as
editable in the UI.

### Patch Format (apply edits)

TSV lines sent to `applyBiqReferenceEdits()`:
```
SET\t<sectionCode>\t<recordRef>\t<fieldKey>\t<base64Value>
ADD\t<sectionCode>\t<newCivKey>\t<copyFromCivKey>
COPY\t<sectionCode>\t<srcCivKey>\t<dstCivKey>
DELETE\t<sectionCode>\t<civKey>
```

Record reference: either `@INDEX:N` (zero-based) or civilopediaEntry key.

Integer fields: `parseIntLoose` extracts int from value (handles "Name (5)" → 5).
Boolean fields: `parseBoolLoose` handles "true"/"false"/"1"/"0".
String fields: used directly.

### Cascade Deletes

- TECH delete: update prerequisites in GOOD, RACE, PRTO, CTZN, GOVT, TFRM, TECH, BLDG, LEAD
- GOOD delete: update tile resources, RULE defaultMoneyResource, TFRM, PRTO, BLDG reqResources, TERR allowedResources
- BLDG delete: update CITY buildings lists, BLDG reqImprovement
- GOVT delete: update BLDG, RACE, resize all GOVT relations arrays
- PRTO delete: (only when no custom map data) cascade to relevant cross-refs
- RACE delete: (only when no custom map data) cascade

---

## Key Quirks

1. **BLDG tag**: main loop reads it to detect `hasCustomRules`, then calls
   `inputBLDG()` at count position (no tag re-read).
2. **FLAV position**: In SAV files, FLAV appears between EXPR and GOOD.
   In standalone BIQ, it appears after WSIZ (before map sections).
3. **PRTO strategy maps**: Firaxis stores each AI strategy as a separate
   PRTO entry.  The JS port consolidates them into one logical unit with
   a `strategies` array.
4. **disapperanceProbability** typo: field name in Java source has double `p`
   and single `a` — must preserve for BiqBridge setter alias compatibility.
5. **RACE numEras dependency**: RACE parsing requires `numEras` (from ERAS).
6. **GOVT numGovts**: Each GOVT record stores its own numGovts (usually the
   total count).  Relations array has numGovts×3 ints.
7. **TILE length**: Conquests = 49 bytes (0x31), PTW = 33, Vanilla 3-4 = 27,
   Vanilla 2 = 26.
8. **WCHR**: The `WCHR` tag is read by the calling code (not inputWCHR itself).
9. **CTZN**: For Conquests, always has corruption and construction fields.
10. **EXPR**: For Conquests (ver≥3.08), always has retreatBonus.
