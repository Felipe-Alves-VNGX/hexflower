import { generateSVG, getRegistry, saveRegistry, HEX_size } from "../utils.js";
import { HexFlowerEngine } from "../engine.js";
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
            roll: HexFlowerNavigator.prototype._onRoll,
            back: HexFlowerNavigator.prototype._onBack,
            placeTile: HexFlowerNavigator.prototype._onPlaceTile
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

        // Info Panel Logic
        const infoPanel = this.element.querySelector("#hex-flower-info");
        
        // Helper to update panel
        const updatePanel = (data) => {
             let info = `<h3 style="border-bottom:1px solid #555; padding-bottom:5px;">${data.emoji || ''} ${data.title || data.name || 'Hex'}</h3>`;
             info += `<div style="margin-top:10px;">`;
             if (data.description) info += `<p>${data.description}</p>`;
             if (data.bioma) info += `<p><strong>Type:</strong> ${data.bioma}</p>`;
             info += `<p style="color:#777; font-size:0.9em; margin-top:10px;">Coordinates: (${data.coord.q}, ${data.coord.r})</p>`;
             info += `</div>`;
             infoPanel.innerHTML = info;
        };

        const resetPanel = () => {
             infoPanel.innerHTML = `<div class="hex-details-placeholder">Hover/Click a Hex for details</div>`;
        };

        this.element.querySelectorAll(".hex-cell").forEach(el => {
            el.addEventListener("mouseenter", ev => {
                const data = JSON.parse(ev.currentTarget.dataset.cell);
                updatePanel(data);
            });
            
            el.addEventListener("mouseleave", () => {
                // Optional: Reset on mouseleave? Or keep last viewed? 
                // User might prefer keeping it if they want to read it.
                // But "hover" implies transient. Let's keep it transient or make it sticky on click?
                // For now, let's just NOT reset on leave to allow reading, 
                // OR reset if that's the expected 'tooltip' behavior replacement.
                // Given it's a "Details Box", usually sticky on click is best, hover is preview.
                // But the requested flow is "Navigator".
                // Let's reset for now to match old behavior, but maybe check if we clicked.
                resetPanel();
            });

            // Click also updates (and teleports)
            el.addEventListener("click", ev => {
                 const data = JSON.parse(ev.currentTarget.dataset.cell);
                 updatePanel(data);
                 this._onHexClick(ev); 
            });
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

    async _onBack(event, target) {
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

    async _onRoll(event, target) {
        console.log("Hex Flower Navigator | _onRoll triggered", this);
        if (!this.selectedId) {
            console.warn("Hex Flower Navigator | No flower selected.");
            return;
        }

        try {
            const result = await HexFlowerEngine.roll(this.selectedId);
            console.log("Hex Flower Navigator | Roll Result:", result);
            
            if (result) {
               const title = result.targetCell?.title || 'Unknown Hex';
               const note = result.note || '';
               const dir = result.dir || '?';
               const total = result.total || 0;

               await ChatMessage.create({
                    content: `<b>Hex Flower Navigation</b><br>Rolled <strong>${total}</strong> (${dir})<br>Moved to: <strong>${title}</strong> ${note}`
                });
            }
        } catch (err) {
            console.error("Hex Flower Navigator | Roll Error:", err);
            ui.notifications.error("Error rolling Hex Flower. Check console.");
        }
    }
    
    async _onPlaceTile(event, target) {
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
