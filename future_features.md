# Future Features & Roadmap

This document outlines planned upgrades and feature requests for the Hex Flower module, categorized by domain.

## 🛠️ Manager (Functionality & UX)

### 1. Visual Hex Editor

**Current State**: Users must edit raw JSON to define cells, coordinates, and properties.
**Proposed**: A full WYSIWYG editor.

- **Interactive Grid**: Click a hex on a visual grid to select it.
- **Property Panel**: Edit properties (Name, Icon, Description) via form inputs instead of JSON.
- **Drag-and-Drop**: Drag rules or biomes onto hexes.
- **Connection Visualizer**: Draw lines or arrows to visualize navigation rules (e.g., specific edge overrides).

### 2. Built-in Templates

**Current State**: New flowers start empty or require importing a full JSON string.
**Proposed**: A library of presets.

- **Weather Engine**: Standard verified weather hex flower.
- **Dungeon Generator**: Random room generation logic.
- **Social Encounter**: NPC mood/reaction tracking.
- **Custom User Templates**: Allow users to save their own flowers as templates.

### 3. Procedural Generation

**Proposed**: One-click generation of playable flowers.

- **Algorithms**: Perlin noise for biomes, random walks for paths.
- **Parameters**: Size (radius), Biome types (e.g., "Forest", "Desert"), Complexity.

### 4. Advanced Validation (Schema)

**Proposed**: Prevent "Invalid JSON" runtime errors.

- **Schema**: Define a strict Zod or JSON Schema for the flower data.
- **Linting**: Highlight errors in the editor (e.g., "Missing coordinate", "Duplicate hex").

---

## 🎨 Visual (Aesthetics & Immersion)

### 5. Immersive "App" Implementation

**Current State**: Standard Foundry VTT grey Dialog window.
**Proposed**: Custom styling to match game themes.

- **Themes**: "Fantasy Parchment", "Sci-Fi Datapad", "Horror Grimoire".
- **Sound FX**: Subtle sounds when moving between hexes or opening the flower.
- **Animations**: Fade-ins, slide transitions for the navigator.

### 6. Token & Actor Integration

**Current State**: Current hex is highlighted with a border.
**Proposed**: Treat the flower as a board.

- **Avatar**: Render an Actor's token image on the active hex.
- **Movement Animation**: Animate the token moving from Hex A to Hex B upon navigation.
- **Multiple Tokens**: Track multiple parties or entities on the same flower simultaneously.

### 7. Rich Tooltips & Hover States

**Current State**: Basic text info.
**Proposed**: Full HTML rendering.

- **Journal Links**: Drag and drop Journal Entries into hexes to link them automatically.
- **Roll Tables**: Execute a RollTable directly from a hex's context menu.
- **Images**: Show a background image or landscape art in the tooltip.

---

## ⚙️ Tech (Code Quality & Modernization)

### 8. Project Structure Cleanup (CRITICAL)

**Issue**: Duplicate logic files exist in root (`/`) and `/scripts`.
**Action**:

- Consolidate all logic into `/scripts`.
- Remove root-level `manager.js` and `navigator.js`.
- Update `module.json` to point to the correct entry points.

### 9. Modern Build Pipeline (Vite + TypeScript)

**Proposed**: Move to a compilation step.

- **TypeScript**: Add type safety for Foundry VTT API and internal logic.
- **Vite**: Fast HMR (Hot Module Replacement) during development.
- **Minification**: Smaller distribution files.

### 10. Foundry ApplicationV2

**Proposed**: Refactor UI classes.

- Use `foundry.applications.api.ApplicationV2`.
- Better separation of data (State) and view (HTML/Handlebars).
- Reactive data updates (auto-refresh UI when flags change).
