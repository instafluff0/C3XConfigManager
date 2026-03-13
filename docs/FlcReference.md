# Civ3 FLC Reference (from Civ3FlcEdit)

## Purpose
This document captures implementation-level FLC behavior derived from the `../Civ3FlcEdit` source, focused on what helps this app parse and preview Civ3 animation data reliably.

Primary sources reviewed:
- `../Civ3FlcEdit/Definitions.h`
- `../Civ3FlcEdit/FlcView.cpp`
- `../Civ3FlcEdit/AnimationView.cpp`
- `../Civ3FlcEdit/FlcInfoGen.cpp`

## File Structure and Metadata

### Core headers
- `FlcHeader` (standard FLC header) includes:
  - `frames`, `width`, `height`, `depth`, `speed`, offsets to first/second frame, creator/updater fields.
- Civ3 embeds custom data in the reserved area as `FlicAnimHeader`:
  - `num_anims` (direction count)
  - `anim_length` (frames per direction)
  - `x_offset`, `y_offset` (sprite clipping offset)
  - `xs_orig`, `ys_orig` (original unclipped size, often 240x240 for units)
  - `anim_time` (timing value, historically `anim_length * 1000 / fps`)
  - `directions` bitmask (bit 0..7: SW, S, SE, E, NE, N, NW, W)

### Direction/frame layout assumption used by tool
- Frame ordering is contiguous by direction.
- Direction slice math used in viewer:
  - `firstFrame = anim_length * (directionIndex)`
  - `lastFrame = firstFrame + anim_length - 1`
- Direction selection controls are enabled only when `num_anims == 8`; otherwise viewer forces `All`.

## Chunk Types and Decode Path

### Chunk types actively decoded
- `COLOR_256` (type 4)
- `DELTA_FLC` / `FLI_SS2` (type 7)
- `BLACK` (type 13)
- `BYTE_RUN` / `FLI_BRUN` (type 15)
- `FLI_COPY` (type 16)

Other chunk types are detected/recognized in comments, but not fully decoded for frame rendering in this path.

### Decoder behavior notes
- Frames with non-`FRAME_TYPE` chunk headers are skipped as non-image data.
- Pixel buffer is 8-bit index data (`width * height`) then mapped through current palette to RGBA surface memory.
- `DELTA_FLC` decoding applies line-based packet operations with skip and run semantics.
- `BYTE_RUN` decoding is full-image RLE.
- `FLI_COPY` is raw full-image indexed data.
- `BLACK` writes index `0` to full frame.

## Palette Behavior

### Palette source model
- Default palette comes from `COLOR_256` chunks.
- Current palette is a working copy used for rendering.
- Transparency key is palette index `255` color by default.

### Civ-specific palette overlays
- Civ color variants are loaded from `ntpXX.pcx` palettes.
- Tool replaces the first 64 entries in the current palette with those from selected civ palette.

### Civ3 alpha-ramp interpretation (viewer behavior)
- Entries `224..239`: smoke/haze ramp handling.
- Entries `240..254`: shadow ramp handling.
- Entry `255`: transparent (typically magenta placeholder).
- Tool applies custom post-blit blending logic for smoke/shadow when alpha blending is enabled.

### Civ3 compatibility quirk handled by tool
- Some Civ3 files contain malformed `COLOR_256` chunk sizes.
- Tool hardcodes color chunk size handling to `778` bytes for compatibility in load/save paths.

## Timing and Playback Semantics
- Playback uses `FlcHeader.speed` as frame delay basis in UI timer logic.
- For unit animations, save path can update:
  - `FlcHeader.speed`
  - `FlicAnimHeader.anim_time = anim_length * delay`
- For files with missing/zero Civ3 animation metadata:
  - Tool falls back to single-direction behavior (`num_anims = 1`, `anim_length = frameCount`).
  - This is treated as leaderhead-style fallback in UI behavior.

## Save/Edit Semantics Used by Tool
- Save is not a full re-encode/repack of all frame chunks.
- Tool copies original file and patches:
  - headers
  - color chunks at recorded positions (`m_arColorChunkPos`)
- This is useful context when comparing output fidelity versus tools that fully re-encode frames.

## Practical Guidance for C3XConfigManager
- Keep FLC preview decoder focused on the Civ3-relevant chunk set:
  - `COLOR_256`, `DELTA_FLC`, `BYTE_RUN`, `BLACK`, `FLI_COPY`
- Preserve indexed-palette semantics through rendering; do not treat source as true-color assets.
- Continue treating index `255` as transparency key in preview path.
- Treat smoke/shadow ramp entries as special-case display behavior if visual parity with Civ3/Civ3FlcEdit is desired.
- Avoid assuming all files cleanly provide full Civ3 direction metadata; robust fallback is necessary.

## Scope Notes
- Civ3FlcEdit has UI constraints (for example 240x240-oriented preview constants) that are tool-specific, not strict FLC-format limits.
- Use this document for parser/preview behavior, not as a universal FLC spec.
