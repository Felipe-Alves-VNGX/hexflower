import { openManager } from "./manager.js";
import { openNavigator } from "./navigator.js";
import "./user-context.js";

/**
 * Validates that basic Foundry VTT globals exist.
 */

class HexFlowerManagerShim extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hex-flower-manager-shim",
            title: "Hex Flower Manager",
            template: "modules/hexflower/templates/empty.html", // Placeholder
            width: 450,
            height: "auto",
        });
    }

    /** @override */
    render(force, options) {
        // Delegate to the existing Dialog logic
        openManager();
        // Return this to satisfy the caller, but we don't open a standard FormApp window
        return this;
    }
}

Hooks.on("init", () => {
    // Register Settings Menu
    game.settings.registerMenu("hexflower", "manager", {
        name: "HEXFLOWER.ManagerTitle",
        label: "HEXFLOWER.OpenManager",
        hint: "HEXFLOWER.ManagerHint",
        icon: "fas fa-seedling",
        type: HexFlowerManagerShim,
        restricted: true
    });

    // Expose API
    game.hexFlower = {
        openManager,
        openNavigator
    };
    
    // Log
    console.log("Hex Flower Engine | Initialized");
});

Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find((c) => c.name === "token");
    if (tokenControls) {
        tokenControls.tools.push({
            name: "navigator",
            title: "HEXFLOWER.NavigatorTitle",
            icon: "fas fa-compass", // Standard icon for consistency, or use "hex-flower-control-icon" if preferred
            visible: true,
            onClick: () => openNavigator(),
            button: true
        });
    }
});
