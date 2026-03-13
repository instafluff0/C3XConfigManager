# BIQ Dependency Graph

## Purpose
A practical dependency map for BIQ sections and cross-links, derived from Quint_Editor (`IO.java`, section models, and tab wiring).

```mermaid
flowchart TD
  HEADER["Header (BIC/BICX/BICQ + metadata)"] --> RULES["Custom Rules Block"]
  HEADER --> DEFAULTS["DefaultRulesLoader (if no BLDG)"]

  RULES --> BLDG
  RULES --> CTZN
  RULES --> CULT
  RULES --> DIFF
  RULES --> ERAS
  RULES --> ESPN
  RULES --> EXPR
  RULES --> GOOD
  RULES --> GOVT
  RULES --> RULE
  RULES --> PRTO
  RULES --> RACE
  RULES --> TECH
  RULES --> TFRM
  RULES --> TERR
  RULES --> WSIZ
  RULES --> FLAV

  HEADER --> MAPOPT["Optional Map Block (WCHR)"]
  MAPOPT --> WCHR
  WCHR --> WMAP
  WMAP --> TILE
  TILE --> CONT
  CONT --> SLOC
  SLOC --> CITY
  CITY --> UNIT
  UNIT --> CLNY

  HEADER --> GAME
  GAME --> LEADOPT["Optional LEAD block"]
  LEADOPT --> LEAD

  TECH -.ref.- PRTO
  GOOD -.ref.- PRTO
  PRTO -.ref.- RULE
  DIFF -.ref.- RULE
  GOOD -.ref.- RULE
  BLDG -.ref.- RULE
  TECH -.ref.- BLDG
  GOOD -.ref.- BLDG
  ERAS -.ref.- TECH
  RACE -.ref.- LEAD
  PRTO -.ref.- LEAD
  TILE -.map-links.- CITY
  TILE -.map-links.- CLNY
  TILE -.map-links.- UNIT
```

## High-Impact Link Families
- Rules and economy chain:
  - `RULE <-> PRTO/GOOD/DIFF/BLDG`
- Technology gating chain:
  - `TECH -> PRTO`, `TECH -> BLDG`, `ERAS -> TECH`
- Resource gating chain:
  - `GOOD -> PRTO`, `GOOD -> BLDG`, `GOOD -> TILE`
- Map occupancy chain:
  - `TILE <-> CITY/UNIT/CLNY`
- Player ownership chain:
  - `LEAD + owner/ownerType fields in CITY/UNIT/CLNY/SLOC`
  - effective tile-border owner path: `TILE.citiesWithInfluence -> CITY(owner/ownerType,culture) -> LEAD(optional) -> RACE(defaultColor,cultureGroup) -> LEAD.initialEra`

## Optional-Block Gates
- If custom rules section is missing, default rules are loaded instead.
- Map sections only appear with custom map (`WCHR` present).
- `LEAD` (player block) may be absent.

## Agent Guidance
- Before structural edits (add/remove/reorder), trace all downstream links in this graph and update both index fields and resolved object references.
