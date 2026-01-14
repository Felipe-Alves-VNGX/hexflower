import { getRegistry, saveRegistry, HEX_size } from "./utils.js";

const FLAG_SCOPE = "world";
const FLAG_STATE = "hex_flower_state";

export class HexFlowerEngine {
    
    /**
     * Executes a roll on a specific Hex Flower.
     * @param {string} flowerId - The ID of the Hex Flower to roll on.
     * @param {object} options - Optional parameters.
     * @param {number} [options.forcedTotal] - Force a specific roll total (for testing/overrides).
     * @returns {Promise<object>} - The result object containing roll details and new state.
     */
    static async roll(flowerId, options = {}) {
        const registry = getRegistry();
        const entry = registry[flowerId];

        if (!entry) {
            console.error(`Hex Flower Engine | Flower ID "${flowerId}" not found.`);
            return null;
        }

        // 1. Roll Logic
        let roll, total;
        if (options.forcedTotal !== undefined) {
             total = options.forcedTotal;
             roll = { total: total, result: "Forced" }; // Mock roll object
        } else {
             roll = await new Roll("2d6").evaluate();
             if (game.modules.get("dice-so-nice")?.active && game.settings.get("hexflower", "enable3dDice")) {
                 await game.dice3d.showForRoll(roll, game.user, true);
             }
             total = roll.total;
        }

        // 2. Determine Direction from Rules
        const rules = entry.navigationRules || [];
        // Find rule matching the total. current implementation assumes non-overlapping ranges or takes first match.
        // Default to SAME if no rule matches?
        let rule = rules.find(r => total >= r.min && total <= r.max);
        const dir = rule ? rule.dir : "SAME";

        // 3. Calculate Movement
        const state = game.user.getFlag(FLAG_SCOPE, FLAG_STATE) || {};
        const currentCoord = state[flowerId] || {q:0, r:0};

        const deltas = {
            "N": {q:0, r:-1}, "NE": {q:1, r:-1}, "SE": {q:1, r:0},
            "S": {q:0, r:1}, "SW": {q:-1, r:1}, "NW": {q:-1, r:0},
            "SAME": {q:0, r:0}
        };
        const d = deltas[dir] || deltas["SAME"];
        
        let nextQ = currentCoord.q + d.q;
        let nextR = currentCoord.r + d.r;

        // 4. Resolve Target & Edge Behavior
        const cells = entry.data.cells || [];
        let targetCell = cells.find(c => c.coord.q === nextQ && c.coord.r === nextR);
        let note = "";

        if (!targetCell) {
             const strategy = entry.edgeBehavior || "stop";
             
             if (strategy === "stop") {
                 TargetFallback: {
                     targetCell = cells.find(c => c.coord.q === currentCoord.q && c.coord.r === currentCoord.r);
                     note = "(Blocked)";
                 }
             } else if (strategy === "wrap") {
                 // Antipodal: (-q, -r)
                 let wrapQ = -nextQ;
                 let wrapR = -nextR;
                 targetCell = cells.find(c => c.coord.q === wrapQ && c.coord.r === wrapR);
                 note = "(Wrapped)";
                 
                 if (!targetCell) {
                     // Fallback if wrapped cell doesn't exist
                     targetCell = cells.find(c => c.coord.q === currentCoord.q && c.coord.r === currentCoord.r);
                     note = "(Blocked/Invalid Wrap)";
                 }
             } else if (strategy === "reflect") {
                 const opposites = { "N": "S", "NE": "SW", "SE": "NW", "S": "N", "SW": "NE", "NW": "SE", "SAME": "SAME" };
                 const opDir = opposites[dir] || "SAME";
                 const opD = deltas[opDir];
                 const opQ = currentCoord.q + opD.q;
                 const opR = currentCoord.r + opD.r;
                 
                 targetCell = cells.find(c => c.coord.q === opQ && c.coord.r === opR);
                 note = "(Reflected)";

                 if (!targetCell) {
                     targetCell = cells.find(c => c.coord.q === currentCoord.q && c.coord.r === currentCoord.r);
                     note = "(Trapped)";
                 }
             } else if (strategy.startsWith("rotate")) {
                 // s = -q - r
                 const s = -nextQ - nextR;
                 let rotQ, rotR;
                 if (strategy === "rotateCW") {
                     rotQ = -nextR; 
                     rotR = -s;
                 } else { // CCW
                     rotQ = -s;
                     rotR = -nextQ;
                 }
                 targetCell = cells.find(c => c.coord.q === rotQ && c.coord.r === rotR);
                 note = `(${strategy === 'rotateCW' ? 'Rotated CW' : 'Rotated CCW'})`;
                 
                 if (!targetCell) {
                     targetCell = cells.find(c => c.coord.q === currentCoord.q && c.coord.r === currentCoord.r);
                     note = "(Blocked Rotation)";
                 }
             }
        }

        // Safety fallback
        if (!targetCell) {
            targetCell = { coord: currentCoord, title: "Unknown" }; 
        }

        // 5. Update State
        state[flowerId] = targetCell.coord;
        await game.user.setFlag(FLAG_SCOPE, FLAG_STATE, state);

        // 6. Return Result
        const result = {
            total,
            dir,
            currentCoord,
            newCoord: targetCell.coord,
            rollObject: roll,
            targetCell,
            note
        };

        // 7. Log to Journal
        await this.logToJournal(entry, result);

        return result;
    }

    /**
     * Logs the roll result to a specific Journal Page for the flower.
     * @param {object} flowerEntry - The Registry Entry for the flower.
     * @param {object} result - The result object from roll().
     */
    static async logToJournal(flowerEntry, result) {
        if (!game.user.isGM) return; // Only GM logs to avoid spam/perms issues? Or allow players?
        // Usually only GM writes to journals. Let's restrict to GM for now.
        
        const journalName = "Hex Flower Journal";
        let journal = game.journal.getName(journalName);
        
        // Ensure Journal Exists
        if (!journal) {
            const folderName = "Hex Flower Engine";
            let folder = game.folders.find(f => f.name === folderName && f.type === "JournalEntry");
            if (!folder) {
                folder = await Folder.create({ name: folderName, type: "JournalEntry", color: "#00e6cc" });
            }
            
            journal = await JournalEntry.create({
                name: journalName,
                folder: folder.id
            });
        }

        // Generate Content

        const timestamp = new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const cellName = result.targetCell.title || "Hex";
        const icon = result.targetCell.emoji || "";
        const note = result.note ? `<span style="color:coral">${result.note}</span>` : "";
        
        const newLogEntry = `
            <div style="border-bottom: 1px dashed #555; padding: 4px 0; font-size: 0.9em;">
                <strong>${timestamp}</strong> - Rolled <strong>${result.total}</strong> (${result.dir}) <br>
                &emsp; <i class="fas fa-arrow-right"></i> ${icon} <strong>${cellName}</strong> ${note}
            </div>
        `;

        // Find or Create Page
        // We use the Flower Name as the Page Name.
        // NOTE: If multiple flowers have same name, this might conflict. Ideally use ID, but ID is ugly for users.
        const pageName = flowerEntry.name || "Unnamed Flower";
        let page = journal.pages.find(p => p.name === pageName);

        if (!page) {
            // Create new Text Page
            await journal.createEmbeddedDocuments("JournalEntryPage", [{
                name: pageName,
                type: "text",
                text: { content: `<h2>${pageName} History</h2>${newLogEntry}`, format: 1 }
            }]);
        } else {
            // Append to existing
            // Need to get current content. 
            // V10+ Data Model access
            const currentContent = page.text.content;
            await page.update({
                text: { content: currentContent + newLogEntry }
            });
        }
    }
}
