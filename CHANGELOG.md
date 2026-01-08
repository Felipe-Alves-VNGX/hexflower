# Changelog

All notable changes to this project will be documented in this file.

## [1.0.18] - 2026-01-08

### Fixed

- **UI Regression**: Fixed `Hex Flower Viewer` layout breakage where the hex grid was rendered too small due to a missing container tag after adding the Roll button.

## [1.0.17] - 2026-01-08

### Added

- **Phase 4: Gameplay Integration**
  - **Token Integration**: Ability to assign a "Party Actor" to the Hex Flower. The token physically appears in the Viewer on the current hex.
  - **Roll Button**: Added a dedicated "Roll Navigation" button in the Viewer to trigger standard navigation from the current party location.
  - **Manual Move Confirmation**: Clicking a hex in the Viewer now prompts a confirmation dialog ("Move here?") instead of immediately rolling, allowing for manual adjustments/teleportation.

## [1.0.11] - 2026-01-07

### Added

- **Phase 2: Core Experience Upgrade & Integrations**
  - **Custom Navigation Rules**: Added a new "Settings" tab in the Manager to customize the 2d6 navigation table rules.
  - **Edge Behaviors**: Added configuration for what happens when navigating off-element (Stop, Wrap, Reflect, Loop).
  - **Dice So Nice Integration**: 3D dice are now shown during navigation events.
  - **Tile Placement**: Added a button in the Navigator to place the current hex as a Tile on the scene.
    - Supports "Ghost" placement preview.
    - Integrated with **Tagger** (auto-tags tiles).
    - Integrated with **Monk's Active Tile Triggers** (basic "On Enter" setup).

### Fixed

- Fixed runtime error `dist/module.js` not found by configuring Vite to output ESM correctly and updating `module.json`.
- Fixed missing Type Definitions by ensuring all dependencies are installed.

## [1.0.8] - 2026-01-06

- Initial migration to Vite + TypeScript build pipeline.
