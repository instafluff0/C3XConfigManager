# Civ 3 | C3X Modern Configuration Manager

Electron app for managing C3X configuration files with two modes:

- `Standard Game`: writes `custom.c3x_config.ini` and `user.*` config files in the C3X folder.
- `Scenario`: writes `scenario.*` config files in the selected scenario folder.

## BIQ Decompression Runtime

BIQ decompression is done by `vendor/BIQDecompressor.jar`.
BIQ field extraction is done by bundled bridge classes under `vendor/biqbridge` with dependencies under `vendor/lib`.

The app will prefer a bundled Java runtime at:

- `vendor/jre/darwin/bin/java`
- `vendor/jre/linux/bin/java`
- `vendor/jre/win32/bin/javaw.exe` (or `java.exe`)

If no bundled runtime is found, it falls back to `java` on `PATH` (useful in development).

When packaging with `electron-builder`, the whole `vendor/` folder is copied into app resources.

## Run

1. `cd C3XConfigManager`
2. `npm install`
3. `npm start`

## Test

- `npm test`

## Notes

- Base config (`*.c3x_config.ini`) is layered by C3X as `default -> scenario -> custom`.
- Districts, wonders, natural wonders, and tile animations are full-replacement layers where scenario replaces user/default and user replaces default.
- This app keeps Civ 3 path as a managed setting for future integrations.
