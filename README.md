# Hex Flower Engine for Foundry VTT

A Foundry VTT module that converts Hex Flower macros into a fully integrated module.
Features a Manager for creating/editing Hex Flowers and a Navigator for using them in-game.

## Installation

### Development / Manual Install

1.  Locate your Foundry VTT **User Data** folder.
    - _Common Windows Path_: `%LocalAppData%\FoundryVTT\Data`
    - _You can check this path in Foundry's Configuration tab on the main setup screen._
2.  Navigate to `Data/modules`.
3.  Create a folder named `hex-flower-engine` (this **MUST** match the `id` in `module.json`).
4.  Copy the contents of this project into that folder.
    - You should end up with: `.../Data/modules/hex-flower-engine/module.json`

### Symlink (Advanced)

If you want to develop without copying files every time, you can create a symbolic link (shortcut) from your repository to the Foundry modules folder.

**PowerShell (Run as Administrator):**

```powershell
New-Item -ItemType Junction -Path "C:\Path\To\FoundryVTT\Data\modules\hex-flower-engine" -Target "C:\Users\felipe.alves\Documents\Estudo\hexflower"
```

## Usage

1.  **Enable Module**: Launch a World and enable "Hex Flower Engine" in "Manage Modules".
2.  **Manager**: Go to **Module Settings** and open the **Hex Flower Manager** to create/import flowers.
3.  **Navigator**: Open the **Scene Controls** (left sidebar), click the **Hexagon** icon, and select the **Navigator** tool.
