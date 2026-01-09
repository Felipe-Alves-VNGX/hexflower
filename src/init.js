import { HexFlowerManager } from "./apps/manager.js";
import { HexFlowerNavigator } from "./apps/navigator.js";

Hooks.on("init", () => {
    // Register Settings Menu
    game.settings.registerMenu("hexflower", "manager", {
        name: "Hex Flower Manager",
        label: "Open Manager",
        hint: "Create, import, and delete Hex Flowers.",
        icon: "fas fa-seedling",
        type: HexFlowerManager,
        restricted: true
    });

    // Expose API
    game.hexFlower = {
        HexFlowerManager,
        HexFlowerNavigator,
        openManager: () => new HexFlowerManager().render(true),
        openNavigator: () => new HexFlowerNavigator().render(true)
    };
    
    // Log
    console.log("Hex Flower Engine | Initialized (v1.1.0-beta.1)");
});


