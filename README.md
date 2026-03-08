# C3X Config Manager

Electron app for managing C3X configuration files with a scoped model:

- `Global Scope`: writes `custom.c3x_config.ini` and `user.*` config files in the C3X folder.
- `Scenario Scope`: writes `scenario.*` config files in the selected scenario folder.

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
