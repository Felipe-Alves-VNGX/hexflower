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

## [1.0.9] - 2026-01-07

### Infrastructure

- **Project Restructuring**: Consolidated codebase into `src/` directory.
- **Build System**: Implemented Vite + TypeScript build pipeline.
- **Cleanup**: Removed legacy `init.js`, `manager.js`, `navigator.js` from root.

## [1.0.8] - 2026-01-06

### Infrastructure

- Initial migration to Vite + TypeScript build pipeline attempts.

## [1.0.3] - 2026-01-05

### Added

- **Visual Hex Editor**: Initial implementation of the visual editor for Hex Flowers.
- **Manager UI**: Basic listing and CRUD operations for flowers.

## [1.0.1] - 2026-01-02

### Fixed

- **Persistence**: Fixed data persistence issues for created Hex Flowers.
- **Edge Logic**: Improved edge wrapping logic to be deterministic (antipodal).

## [1.0.0] - 2026-01-01

- Initial Release
