# agents.md

## Scope
This folder contains an Electron app (`C3X Config Manager`) for managing C3X config files in a UI.

## Ground Truth From C3X Parsing
Behavior is based on `injected_code.c`:

1. Base config (`*.c3x_config.ini`)
- Files loaded in order: `default.c3x_config.ini`, then `scenario.c3x_config.ini` (if found), then `custom.c3x_config.ini`.
- This is cumulative key override, not full replacement.
- Effective precedence is `custom > scenario > default`.

2. District config (`*.districts_config.txt`)
- Files attempted in order: `default`, `user`, `scenario`.
- Each call uses `drop_existing_configs = 1`, so each successful file fully resets all previous district definitions.
- Effective precedence is full replacement: `scenario` if present, else `user`, else `default`.

3. Wonder district config (`*.districts_wonders_config.txt`)
- Same replacement behavior as districts.
- Effective precedence: `scenario` > `user` > `default`.

4. Natural wonder config (`*.districts_natural_wonders_config.txt`)
- Same replacement behavior as districts.
- Effective precedence: `scenario` > `user` > `default`.

5. Tile animation config (`*.tile_animations.txt`)
- Same replacement behavior as districts.
- Effective precedence: `scenario` > `user` > `default`.
- Natural wonder animation entries are appended at runtime after load.

## App File Mapping
Global scope writes:
- Base: `custom.c3x_config.ini`
- Districts: `user.districts_config.txt`
- Wonders: `user.districts_wonders_config.txt`
- Natural Wonders: `user.districts_natural_wonders_config.txt`
- Animations: `user.tile_animations.txt`

Scenario scope writes:
- Base: `scenario.c3x_config.ini`
- Districts: `scenario.districts_config.txt`
- Wonders: `scenario.districts_wonders_config.txt`
- Natural Wonders: `scenario.districts_natural_wonders_config.txt`
- Animations: `scenario.tile_animations.txt`

## Editing Guidelines
- Preserve parser compatibility:
  - Base config lines must remain `key = value` with simple token values.
  - Sectioned files use `#District`, `#Wonder`, or `#Animation` markers and `key = value` lines.
- Do not attempt to reinterpret Civ3 internals in this app. This app is a file manager.
- Keep the current scope abstraction intact (global vs scenario), but surface base-config precedence caveat clearly (`custom` can override scenario).

## Future Enhancements
- Add schema-driven editors for known keys with enums and validation.
- Add scenario discovery by reading Civ3 scenario folders.
- Add diff view against effective defaults.
