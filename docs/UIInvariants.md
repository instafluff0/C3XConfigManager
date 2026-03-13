# UI Invariants

## Purpose
Stable UI behavior contracts agents should preserve during implementation changes.

## Mode and Scope
- Keep editing scope explicit: `Standard Game` vs `Scenario`.
- Save/write logic must match active mode and file targets.

## Editing Experience
- Prefer structured controls for known schemas.
- Keep unknown fields visible and editable.
- Avoid hiding data behind destructive transforms.

## Scenario Safety Behavior
- Enforce scenario write fencing to allowed roots only.
- Keep `Scenario Search Folders` lock-managed and ignored on save payload writes.
- Copy Scenario must localize references and avoid back-linking into source assets.

## Hard Constraints
- `Terrain -> Terrain Types` (`TERR`) is structurally immutable in UI.
- Scenario saves must block unresolved new unit animation folder references when key edits cannot resolve valid INI paths.

## Save UX Contract
- In-app save status feedback only (snackbar + details modal).
- Preserve transactional semantics and explicit result states:
  - `Saving`
  - `Saved`
  - `Rolled Back`
  - `Failed`

## Art Preview Contract
Supported previews:
- District PCX
- Wonder district PCX crops
- Natural wonder PCX and optional animation
- Tile animation INI to FLC

Playback rules:
- Preserve aspect ratio.
- Honor configured frame timing.

## Verification Gate
Before finalizing significant UI work:

```bash
node --check main.js
node --check src/renderer.js
node --check src/artPreview.js
npm test
```

## Update Policy
- Keep this file to long-lived UI contracts.
- Put transient implementation details or one-off fixes in `docs/Quirks.md` until they are proven stable.
