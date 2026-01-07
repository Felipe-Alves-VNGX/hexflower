import { generateHexSVG, handleHexClick, getCellName, getCellDescription, renderProperties } from "./navigator.js";

const FLAG_SCOPE = "world";
const FLAG_REGISTRY = "hex_flower_registry";
const FLAG_STATE = "hex_flower_state";

export class HexFlowerNavigatorSidebar extends SidebarTab {
    constructor(options) {
        super(options);
        this._selectedFlowerId = null;
    }

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hex-flower-navigator",
            template: "modules/hexflower/templates/sidebar-navigator.html",
            title: "Hex Flower Navigator",
            icon: "fas fa-compass",
            scrollContainer: null
        });
    }

    /** @override */
    async getData(options = {}) {
        const data = await super.getData(options);
        
        const registry = game.user.getFlag(FLAG_SCOPE, FLAG_REGISTRY) || {};
        const ids = Object.keys(registry);
        
        // Default to first if none selected, or keep selection
        if (!this._selectedFlowerId && ids.length > 0) {
            this._selectedFlowerId = ids[0];
        } else if (this._selectedFlowerId && !ids.includes(this._selectedFlowerId)) {
             this._selectedFlowerId = ids.length > 0 ? ids[0] : null;
        }

        const flowers = ids.map(id => ({
            id: id,
            name: registry[id].name,
            active: id === this._selectedFlowerId
        }));

        let svg = "<p style='text-align:center; color:#888;'>No Hex Flowers Found</p>";
        
        if (this._selectedFlowerId) {
            const flowerData = registry[this._selectedFlowerId].data;
            const allStates = game.user.getFlag(FLAG_SCOPE, FLAG_STATE) || {};
            const savedCoord = allStates[this._selectedFlowerId] || null;
            svg = generateHexSVG(flowerData, savedCoord);
        }

        return {
            flowers,
            svg
        };
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Flower Selection
        html.find(".hex-flower-select").change(ev => {
            this._selectedFlowerId = ev.target.value;
            this.render();
        });

        // Refresh
        html.find(".hex-flower-refresh").click(() => {
            this.render();
        });

        // Hex Interaction
        if (this._selectedFlowerId) {
            const registry = game.user.getFlag(FLAG_SCOPE, FLAG_REGISTRY) || {};
            const flowerData = registry[this._selectedFlowerId]?.data;

            if (flowerData) {
                const $tooltip = html.find("#hex-flower-info");

                html.find(".hex-flower-cell").hover(
                    function () {
                        const dataStr = $(this).attr("data-cell");
                        const cell = JSON.parse(dataStr);
                        const name = getCellName(cell);
                        const desc = getCellDescription(cell);

                        let info = `<h4>${cell.emoji} ${name}</h4>`;
                        info += `<b>Coord:</b> (${cell.coord.q}, ${cell.coord.r}, ${cell.coord.s})<br/>`;

                        if (desc) info += `<i>${desc}</i><br/><hr style="margin:4px 0; border-color:#555;"/>`;

                        const exclude = ["bioma", "stage", "title", "name", "encounter_type", "description", "summary", "emoji", "color", "coord", "x", "y"];
                        info += renderProperties(cell, exclude);

                        $tooltip.html(info).show();
                    },
                    function () { $tooltip.hide(); }
                );

                html.find(".hex-flower-cell").click(async (ev) => {
                    const dataStr = $(ev.currentTarget).attr("data-cell");
                    const startCell = JSON.parse(dataStr);

                    // We pass 'this' as the container app. handleHexClick handles $(this) fallback if needed,
                    // but since 'this' is a SidebarTab which is an Application, it has an .element property.
                    await handleHexClick(startCell, flowerData.cells, this, flowerData, this._selectedFlowerId);
                });
            }
        }
    }
}
