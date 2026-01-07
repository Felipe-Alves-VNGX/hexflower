import { openManager } from "../manager.js";

/**
 * Adds context menu options to the User Directory.
 */
Hooks.on("getUserDirectoryEntryContext", (html, options) => {
    options.push({
        name: "HEXFLOWER.OpenManager",
        icon: '<i class="fas fa-seedling"></i>',
        condition: game.user.isGM,
        callback: (li) => {
            openManager();
        }
    });
});
