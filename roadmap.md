# Strategic Roadmap

This roadmap organizes the [Future Features](future_features.md) into a logical sequence, prioritizing codebase stability and core functionality before aesthetic and advanced enhancements.

## Phase 1: Foundation & Sanitation 🏗️ (Completed)

_Goal: Ensure a stable, maintainable codebase before adding complex features._

1.  **Project Structure Cleanup** (Tech) ✅
    - **Why**: Critical to prevent data loss and confusion. We must consolidate logic into one place.
    - **Action**: Remove root `manager.js`/`navigator.js`, standardize on `scripts/`, update `module.json`.
2.  **Modern Build Pipeline (Vite + TypeScript)** (Tech) ✅
    - **Why**: Essential for building the complex "Visual Hex Editor" UI without spaghetti code.
    - **Action**: Set up `package.json`, install Vite, generic type definitions.

## Phase 2: Core Experience Upgrade 🛠️ (Completed)

_Goal: Replace manual JSON editing with a proper user interface._

3.  **Visual Hex Editor** (Manager) ✅
    - **Why**: The current "paste JSON" workflow is a major friction point.
    - **Action**: Build the Grid View, Click-to-Edit, and Property Panel.
4.  **Advanced Validation** (Manager) ✅
    - **Why**: As we build the editor, we need to ensure the data produced is always valid.
    - **Action**: Implement Zod/Schema validation within the new editor.

## Phase 3: Visual Immersion & Polish 🎨 (Completed)

_Goal: Make the module feel like a premium part of the game world._

5.  **Immersive "App" Implementation** (Visual) ✅
    - **Why**: Replaces the generic grey windows with thematic UI.
    - **Action**: Create custom HTML/CSS shells for the Manager and Navigator.
6.  **Rich Tooltips** (Visual) ✅
    - **Why**: Adds depth to the hexagons without cluttering the map.
    - **Action**: Implement HTML rendering for Journals, Tables, and Images on hover.

## Phase 4: Gameplay Integration ♟️ (Completed)

_Goal: Connect the Hex Flower to the rest of the Foundry ecosystem._

7.  **Token & Actor Integration** (Visual) ✅
    - **Why**: Makes the flower an active game board rather than just a reference tool.
    - **Action**: Implement token actors and movement animations.
8.  **Automated Navigation Rules** (Manager) ✅
    - **Why**: "Game-ify" the usage.
    - **Action**: Visual connection of edges logic (e.g., visual arrows for edge wrapping).

## Phase 5: Content Expansion 📦 (Completed)

_Goal: Provide out-of-the-box value._

9.  **Built-in Templates** (Manager) ✅
    - **Action**: Create standard "Weather" and "Encounter" presets.
10. **Procedural Generation** (Manager) 🚧
    - **Action**: Implement generation algorithms for instant hex flowers.

## Ongoing: Technical Refinement ⚙️

- **ApplicationV2 Migration**: As we touch UI components in Phases 2 and 3, we will migrate them to `ApplicationV2`.
