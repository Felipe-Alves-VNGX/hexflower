import { generateSVG, getRegistry, saveRegistry, HEX_size } from "../utils.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const FLAG_SCOPE = "world"; // Keeping scope for compatibility
const FLAG_STATE = "hex_flower_state";

export class HexFlowerNavigator extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.selectedId = null;
        // Hook for reactivity
        this._hookId = null;
    }

    static DEFAULT_OPTIONS = {
        id: "hex-flower-navigator",
        title: "Hex Flower Navigator",
        tag: "div",
        classes: ["hex-flower-navigator"],
        window: {
            resizable: true,
            width: 800,
            height: 700,
            icon: "fas fa-compass"
        },
        actions: {
            roll: HexFlowerNavigator._onRoll,
            back: HexFlowerNavigator._onBack,
            placeTile: HexFlowerNavigator._onPlaceTile
        }
    };

    static PARTS = {
        main: { template: "modules/hexflower/templates/navigator.hbs" }
    };

    /* ------------------------------------------- */
    /*  Lifecycle                                  */
    /* ------------------------------------------- */

    async _prepareContext(options) {
        const registry = getRegistry();
        const flowers = Object.keys(registry);
        
        if (flowers.length === 0) {
            return { title: "No Hex Flowers Found", hasMultiple: false }; 
        }

        // Auto-select first if none selected
        if (!this.selectedId && flowers.length > 0) {
            this.selectedId = flowers[0];
        }

        const entry = registry[this.selectedId];
        const state = await this._getState();
        const currentCoord = state[this.selectedId] || null;

        // Image
        let partyTokenImg = null;
        if (entry.partyActorId) {
            const actor = game.actors.get(entry.partyActorId);
            partyTokenImg = actor?.prototypeToken?.texture?.src || "icons/svg/mystery-man.svg";
        }

        const svg = generateSVG(entry.data?.cells || [], {
            currentCoord,
            partyTokenImg,
            size: 35,
            dataJson: true
        });

        return {
            title: entry.name,
            svg,
            hasMultiple: flowers.length > 1
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Tooltip logic
        const tooltip = this.element.querySelector("#hex-flower-info");
        this.element.querySelectorAll(".hex-cell").forEach(el => {
            el.addEventListener("mouseenter", ev => {
                const data = JSON.parse(ev.currentTarget.dataset.cell);
                // Formatting
                let info = `<h4>${data.emoji || ''} ${data.title || data.name || 'Hex'}</h4>`;
                // Add more details if needed
                if (data.description) info += `<i>${data.description}</i><br>`;
                info += `Coord: (${data.coord.q}, ${data.coord.r})`;
                
                tooltip.innerHTML = info;
                tooltip.style.display = "block";
            });
            el.addEventListener("mouseleave", () => tooltip.style.display = "none");
            
            // Click to teleport (GM only?) or confirm
            el.addEventListener("click", ev => this._onHexClick(ev));
        });

        // Register Hook if not already
        if (!this._hookId) {
            this._hookId = Hooks.on("updateUser", (user, changes) => {
                 if (user.id === game.user.id && changes.flags?.[FLAG_SCOPE]?.[FLAG_STATE]) {
                     this.render();
                 }
            });
        }
    }

    async close(options) {
        if (this._hookId) {
            Hooks.off("updateUser", this._hookId);
            this._hookId = null;
        }
        return super.close(options);
    }

    /* ------------------------------------------- */
    /*  Actions                                    */
    /* ------------------------------------------- */

    async _onHexClick(event) {
        const data = JSON.parse(event.currentTarget.dataset.cell);
        
        const confirm = await Dialog.confirm({
            title: "Teleport Party",
            content: `<p>Move party to <strong>${data.title || 'Hex'}</strong>?</p>`
        });
        
        if (confirm) {
            await this._updateState(data.coord);
            // No need to render manually, hook handles it? 
            // setFlag updates user -> trigger hook -> render
        }
    }

    static async _onBack(event, target) {
        // Show selection dialog? Or just cycle?
        // For simplicity: Cycle to next or show simple prompt.
        // Implementing simple cycle for now or re-query
        const registry = getRegistry();
        const ids = Object.keys(registry);
        if (ids.length <= 1) return;

        // Simple prompt to pick
        let options = ids.map(id => `<option value="${id}" ${this.selectedId === id ? "selected":""}>${registry[id].name}</option>`).join("");
        const newId = await new Promise(resolve => {
            new Dialog({
                title: "Select Flower",
                content: `<select id="flower-pick">${options}</select>`,
                buttons: {
                    ok: { label: "Go", callback: html => resolve(html.find("#flower-pick").val()) }
                }
            }).render(true);
        });

        if (newId) {
            this.selectedId = newId;
            this.render();
        }
    }

    static async _onRoll(event, target) {
        const registry = getRegistry();
        const entry = registry[this.selectedId];
        if (!entry) return;

        // Game Logic
        // 1. Roll
        const roll = await new Roll("2d6").evaluate();
        if (game.modules.get("dice-so-nice")?.active) {
            game.dice3d.showForRoll(roll, game.user, true);
        }
        const total = roll.total;

        // 2. Rules
        const rules = entry.navigationRules || [];
        // Default rules if empty?
        // ... (Assume rules exist or use defaults handled in Editor/Data)
        
        let rule = rules.find(r => total >= r.min && total <= r.max);
        const dir = rule ? rule.dir : "SAME";
        
        // 3. Move
        const state = await this._getState();
        const currentCoord = state[this.selectedId] || {q:0, r:0}; // Default 0,0
        
        // Direction Deltas
        const deltas = {
            "N": {q:0, r:-1}, "NE": {q:1, r:-1}, "SE": {q:1, r:0},
            "S": {q:0, r:1}, "SW": {q:-1, r:1}, "NW": {q:-1, r:0},
            "SAME": {q:0, r:0}
        };
        const d = deltas[dir] || deltas["SAME"];
        
        const nextQ = currentCoord.q + d.q;
        const nextR = currentCoord.r + d.r;
        
        // 4. Resolve Target (Edge Behavior)
        const cells = entry.data.cells;
        let target = cells.find(c => c.coord.q === nextQ && c.coord.r === nextR);
        let note = "";

        if (!target) {
            // Edge Behavior
            const strategy = entry.edgeBehavior || "stop";
            if (strategy === "stop") {
                target = cells.find(c => c.coord.q === currentCoord.q && c.coord.r === currentCoord.r);
                note = "(Blocked)";
            } else if (strategy === "wrap") {
                // Antipodal? or simple wrap? user code had antipodal.
                target = cells.find(c => c.coord.q === -nextQ && c.coord.r === -nextR);
                note = "(Wrapped)";
                if (!target) target = cells.find(c => c.coord.q === currentCoord.q && c.coord.r === currentCoord.r); // Fallback
            }
        }
        
        if (!target) return; // Should not happen if defaults exist
        
        // 5. Update
        await this._updateState(target.coord);
        
        // 6. Chat
        ChatMessage.create({
            content: `<b>Hex Flower Navigation</b><br>Rolled ${total} (${dir})<br>Moved to: ${target.title || 'Hex'} ${note}`
        });
    }
    
    static async _onPlaceTile(event, target) {
        ui.notifications.info("Tile placement not fully re-implemented in beta.");
    }

    /* Helper: State Management */
    async _getState() {
        return game.user.getFlag(FLAG_SCOPE, FLAG_STATE) || {};
    }

    async _updateState(newCoord) {
        const state = await this._getState();
        state[this.selectedId] = newCoord;
        await game.user.setFlag(FLAG_SCOPE, FLAG_STATE, state);
    }
}
