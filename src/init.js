import { HexFlowerManager } from "./apps/manager.js";
import { HexFlowerNavigator } from "./apps/navigator.js";
import { HexFlowerSetup } from "./setup.js";
import { HexFlowerEngine } from "./engine.js";

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

    // 3D Dice Setting
    game.settings.register("hexflower", "enable3dDice", {
        name: "Enable 3D Dice",
        hint: "If Dice So Nice is active, show 3D dice animations for navigation rolls.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
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
        openNavigator: () => new HexFlowerNavigator().render(true),
        engine: HexFlowerEngine,
        roll: (flowerId, options) => HexFlowerEngine.roll(flowerId, options)
    };
    
    // Log
    console.log("Hex Flower Engine | Initialized");
});

Hooks.on("ready", () => {
    HexFlowerSetup.check();
});


