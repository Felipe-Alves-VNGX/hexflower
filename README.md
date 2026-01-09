# Hex Flower Engine for Foundry VTT

A Foundry VTT module that converts Hex Flower macros into a fully integrated module.
Features a Manager for creating/editing Hex Flowers and a Navigator for using them in-game.

## Installation

### Installation via Manifest URL (Recommended)

1.  Open Foundry VTT and go to the **Add-on Modules** tab.
2.  Click **Install Module**.
3.  In the **Manifest URL** field, paste:
    `https://github.com/Felipe-Alves-VNGX/hexflower/releases/latest/download/module.json`
4.  Click **Install**.

### Manual Install (Development)

1.  Clone this repository or download the source code.
2.  Install dependencies: `npm install`
3.  Build the project: `npm run build`
4.  Link the folder to your Foundry VTT `Data/modules/` directory.

#### Symlink (PowerShell)

```powershell
New-Item -ItemType Junction -Path "C:\Path\To\FoundryVTT\Data\modules\hex-flower-engine" -Target "C:\Users\felipe.alves\Documents\Estudo\hexflower"
```

## Usage

1.  **Enable Module**: Launch a World and enable "Hex Flower Engine" in "Manage Modules".
2.  **Manager**: Go to **Module Settings** and open the **Hex Flower Manager** to create/import flowers.
3.  **Navigator**: Open the **Scene Controls** (left sidebar), click the **Hexagon** icon, and select the **Navigator** tool.
