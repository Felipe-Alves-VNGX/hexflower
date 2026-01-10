import { HexFlowerManager } from "./apps/manager.js";
import { HexFlowerNavigator } from "./apps/navigator.js";
import { HexFlowerSetup } from "./setup.js";

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

    // Hidden Setting for Welcome/Setup Versioning
    game.settings.register("hexflower", "welcomeVersion", {
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    // Expose API
    game.hexFlower = {
        HexFlowerManager,
        HexFlowerNavigator,
        openManager: () => new HexFlowerManager().render(true),
        openNavigator: () => new HexFlowerNavigator().render(true)
    };
    
    // Log
    console.log("Hex Flower Engine | Initialized");
});

Hooks.on("ready", () => {
    HexFlowerSetup.check();
});


