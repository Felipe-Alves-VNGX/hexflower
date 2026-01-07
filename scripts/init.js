import { openManager } from "./manager.js";
import { openNavigator } from "./navigator.js";
import { HexFlowerNavigatorSidebar } from "./sidebar-navigator.js";

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
        name: "Hex Flower Manager",
        label: "Open Manager",
        hint: "Create, import, and delete Hex Flowers.",
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

Hooks.on("ready", () => {
    // Instantiate the Sidebar Tab
    ui.hexflower = new HexFlowerNavigatorSidebar();
    
    // Add to Sidebar tabs so it can be activated
    ui.sidebar.tabs.hexflower = ui.hexflower;
});

// Inject the Sidebar Icon
Hooks.on("renderSidebar", (app, html) => {
    const tabs = html.find("#sidebar-tabs");
    const tabLink = $(`<a class="item" data-tab="hexflower" data-tooltip="Hex Flower Navigator">
        <i class="fas fa-compass"></i>
    </a>`);

    // Insert before Settings (the last one usually)
    const settingsTab = tabs.find('[data-tab="settings"]');
    if (settingsTab.length) {
        settingsTab.before(tabLink);
    } else {
        tabs.append(tabLink);
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find((c) => c.name === "token");
    if (tokenControls) {
        tokenControls.tools.push({
            name: "navigator",
            title: "Hex Flower Navigator",
            icon: "fas fa-compass", 
            visible: true,
            onClick: () => {
                // Activate the sidebar tab
                ui.sidebar.activateTab("hexflower");
            },
            button: true
        });
    }
});
