# 🌸 Hex Flower Engine

### _The Ultimate Hex Flower Tool for Foundry VTT_

![Foundry v12](https://img.shields.io/badge/Foundry-v12-orange)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.30-green)

A robust, fully integrated module that brings the power of **Hex Flower Game Engines** to Foundry VTT. Create, manage, and play through procedural hex-crawls, weather systems, and AI behaviors with ease.

---

## ✨ Features

### 🎨 Visual Editor

- **Drag-and-Drop Creation**: Build your flowers intuitively.
- **Split-Screen Layout**: Edit visual layout and properties side-by-side.
- **Live Preview**: See changes instantly as you design.
- **Advanced Metadata**: Support for **Tags** and custom **JSON Properties**.

### 🧭 Navigator

- **Immersive Play**: Dedicated window for running the game.
- **Persistent Details**: Click any hex to see full details in a persistent side panel.
- **Smart Rolls**: Integrated 2d6 rolling with automatic movement.

### ⚙️ Powerful Rules

- **Custom Navigation**: Define your own 2d6 probability mappings (e.g., standard Bell Curve or custom biases).
- **Edge Behaviors**:
  - **Stop**: Block movement at edges.
  - **Wrap**: Warp to the other side (Cylinder/Torus).
  - **Reflect**: Bounce back.
  - **Loop**: Custom looping logic.

### 🔗 Integrations

- **Dice So Nice**: Visual 3D dice rolls.
- **Tiles & Tagger**: Place hexes as tiles on the scene.

### 🎮 API & Macros

The module exposes a powerful API for macros and developers, allowing automated rolling and custom integrations.

- **`game.hexFlower.roll(flowerId)`**: Roll on a specific Hex Flower programmatically.
- **`game.hexFlower.engine`**: Access the core engine logic.

[Review the full API Documentation here](docs/API.md).

---

## 📦 Installation

### Recommended (Manifest URL)

1.  Open Foundry VTT and go to the **Add-on Modules** tab.
2.  Click **Install Module**.
3.  Paste the following URL:
    ```
    https://github.com/Felipe-Alves-VNGX/hexflower/releases/latest/download/module.json
    ```
4.  Click **Install**.

### Manual (Development)

1.  Clone this repository.
2.  `npm install`
3.  `npm run build`
4.  Symlink to your Foundry `Data/modules/` folder.

---

## 🚀 Upgrade Guide to v1.0.30

> [!NOTE]  
> If you are upgrading from < v1.0.18, please note the new layout changes! Since v1.0.30, the Navigator uses a persistent side panel instead of toolcovers.

---

## 🎮 Usage

1.  **Enable Module**: Manage Modules -> Enable "Hex Flower Engine".
2.  **Create**: Go to Module Settings -> **Hex Flower Manager**.
3.  **Play**: Sidebar -> **Hexagon Icon** -> **Navigator**.

---

<p align="center">Made with ❤️ by Felipe Alves</p>
