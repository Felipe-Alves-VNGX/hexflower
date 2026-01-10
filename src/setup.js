
export class HexFlowerSetup {
    static async check() {
        if (!game.user.isGM) return;

        const currentVersion = game.modules.get("hexflower").version;
        const lastVersion = game.settings.get("hexflower", "welcomeVersion");

        if (currentVersion !== lastVersion) {
            await this.deployContent();
            await game.settings.set("hexflower", "welcomeVersion", currentVersion);
            ui.notifications.info("Hex Flower Engine: Updated Content Deployed!");
        }
    }

    static async deployContent() {
        console.log("Hex Flower Engine | Deploying Content...");

        // 1. Journal Guide
        const journalFolder = await this.getOrCreateFolder("Hex Flower Engine", "JournalEntry");
        
        let content = "";
        try {
            const response = await fetch("modules/hexflower/templates/guide.html");
            if (response.ok) {
                content = await response.text();
            } else {
                console.error("Hex Flower Engine | Could not load guide template.");
                content = "<h1>Error Loading Guide</h1><p>Please check module installation.</p>";
            }
        } catch (e) {
            console.error(e);
            content = "<h1>Error Loading Guide</h1>";
        }

        await this.createOrUpdateJournal("Hex Flower Guide", content, journalFolder);

        // 2. Macros
        const macroFolder = await this.getOrCreateFolder("Hex Flower Engine", "Macro");
        
        await this.createOrUpdateMacro("Open Hex Navigator", "game.hexFlower.openNavigator();", macroFolder);
        await this.createOrUpdateMacro("Open Hex Manager", "game.hexFlower.openManager();", macroFolder);
        
        // Open the Guide
        const journal = game.journal.getName("Hex Flower Guide");
        if (journal) journal.sheet.render(true);
    }

    static async getOrCreateFolder(name, type) {
        let folder = game.folders.find(f => f.name === name && f.type === type);
        if (!folder) {
            folder = await Folder.create({ name, type, color: "#00e6cc" });
        }
        return folder;
    }

    static async createOrUpdateJournal(name, content, folder) {
        let entry = game.journal.find(j => j.name === name && j.folder?.id === folder.id);
        if (entry) {
            // Optional: Don't overwrite if user modified? 
            // For now, let's update a specific page or just leave it if it exists to avoid destroying user notes.
            // But if it's a "Guide", we might want to update it.
            // Let's create a new page if page doesn't exist?
            // Simpler: If exists, do nothing or notify? 
            // Let's overwrite ONLY if it's identical text (unlikely) or just skip.
            // Better: update the text to latest version.
            // Implementation: Find the first text page and update it.
            const page = entry.pages.contents[0];
            if (page) await page.update({text: {content: content}});
        } else {
            await JournalEntry.create({
                name,
                folder: folder.id,
                pages: [{
                    name: "Guide",
                    type: "text",
                    text: { content, format: 1 } // 1 = HTML
                }]
            });
        }
    }

    static async createOrUpdateMacro(name, command, folder) {
        let macro = game.macros.find(m => m.name === name && m.folder?.id === folder.id);
        if (!macro) {
            await Macro.create({
                name,
                type: "script",
                command,
                folder: folder.id,
                img: "icons/svg/dice-target.svg"
            });
        }
    }
}
