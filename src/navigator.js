/**
 * Hex Flower Navigator
 * Reads Hex Flowers stored in the World Registry.
 */

const FLAG_SCOPE = "world";
const FLAG_REGISTRY = "hex_flower_registry";
const FLAG_STATE = "hex_flower_state";

// -------------------------------------------------------------
// Helper: Get Display Name
// -------------------------------------------------------------
export function getCellName(cell) {
    return cell.bioma || cell.stage || cell.title || cell.name || cell.encounter_type || "Hex";
}

// -------------------------------------------------------------
// Helper: Get Description / Details
// -------------------------------------------------------------
export function getCellDescription(cell) {
    return cell.description || cell.summary || "";
}

// -------------------------------------------------------------
// Helper: Render Object to HTML
// -------------------------------------------------------------
export function renderProperties(obj, excludeKeys = []) {
    let html = "";

    const formatValue = (v) => {
        if (v && typeof v === 'object') {
            if (v.banda) return v.banda;
            if (v.banda_terrestre || v.banda_marinha) {
                return [v.banda_terrestre, v.banda_marinha].filter(b => b).join("/");
            }
            if (v.name) return v.name;
            if (v.title) return v.title;

            const values = Object.values(v);
            if (values.every(val => typeof val !== 'object')) {
                return values.join(", ");
            }
            return "[Detail]";
        }
        return v;
    };

    for (const [key, value] of Object.entries(obj)) {
        if (excludeKeys.includes(key)) continue;

        let displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

        if (typeof value === 'object' && value !== null) {
            const subProps = Object.entries(value).map(([k, v]) => {
                return `${k}: ${formatValue(v)}`;
            }).join(" | ");

            html += `<b>${displayKey}:</b> <span style="font-size: 0.9em; color: #ccc;">${subProps}</span><br/>`;
        } else {
            html += `<b>${displayKey}:</b> ${value}<br/>`;
        }
    }
    return html;
}

// -------------------------------------------------------------
// 2) Rendering Logic (Hex Math)
// -------------------------------------------------------------
const HEX_SIZE = 35;
const SQRT3 = Math.sqrt(3);

function cubeToPixel(q, r, size) {
    const x = size * (SQRT3 * q + (SQRT3 / 2) * r);
    const y = size * (3 / 2) * r;
    return { x, y };
}

function hexCorners(cx, cy, size) {
    let points = "";
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        const x = cx + size * Math.cos(angle_rad);
        const y = cy + size * Math.sin(angle_rad);
        points += `${x},${y} `;
    }
    return points;
}

// -------------------------------------------------------------
// 3) Generator Function
// -------------------------------------------------------------
export function generateHexSVG(data, currentCoord) {
    const cells = data.cells || [];
    if (!cells.length) return "<p>No Data (Check Manager)</p>";

    // Calc bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    cells.forEach(cell => {
        const { x, y } = cubeToPixel(cell.coord.q, cell.coord.r, HEX_SIZE);
        minX = Math.min(minX, x - HEX_SIZE);
        maxX = Math.max(maxX, x + HEX_SIZE);
        minY = Math.min(minY, y - HEX_SIZE);
        maxY = Math.max(maxY, y + HEX_SIZE);
    });

    const width = maxX - minX + 20;
    const height = maxY - minY + 20;

    let svg = `<svg width="100%" height="100%" viewBox="${minX - 10} ${minY - 10} ${width} ${height}" 
               preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" 
               style="max-height: 85vh;">`;

    cells.forEach(cell => {
        const { x, y } = cubeToPixel(cell.coord.q, cell.coord.r, HEX_SIZE);

        let name = getCellName(cell);
        if (name.length > 15) name = name.substring(0, 13) + "…";

        let isCurrent = false;
        if (currentCoord) {
            if (cell.coord.q === currentCoord.q && cell.coord.r === currentCoord.r) {
                isCurrent = true;
            }
        }

        const border = isCurrent ? "#00FFFF" : "#333";
        const width = isCurrent ? 4 : 1.5;
        const zIndexStyle = isCurrent ? "z-index: 10;" : "";

        const dataJson = JSON.stringify(cell).replace(/"/g, '&quot;');

        svg += `
        <g class="hex-flower-cell" data-cell="${dataJson}" style="cursor: pointer; opacity: 1; ${zIndexStyle}">
            <polygon points="${hexCorners(x, y, HEX_SIZE)}" 
                     fill="${cell.color || '#cccccc'}" 
                     stroke="${border}" stroke-width="${width}" />
            <text x="${x}" y="${y - 5}" text-anchor="middle" dominant-baseline="central" 
                  font-size="14" style="pointer-events:none;">${cell.emoji || ''}</text>
            <text x="${x}" y="${y + 12}" text-anchor="middle" dominant-baseline="middle" 
                  font-size="8" fill="black" font-weight="bold" style="pointer-events:none;">${name}</text>
        </g>`;
    });

    svg += `</svg>`;
    return svg;
}

// -------------------------------------------------------------
// 5) Navigation & Game Logic
// -------------------------------------------------------------
const DIRECTION_PRESETS = {
    "N": { dq: 0, dr: -1, ds: 1 },
    "NE": { dq: 1, dr: -1, ds: 0 },
    "SE": { dq: 1, dr: 0, ds: -1 },
    "S": { dq: 0, dr: 1, ds: -1 },
    "SW": { dq: -1, dr: 1, ds: 0 },
    "NW": { dq: -1, dr: 0, ds: 1 },
    "SAME": { dq: 0, dr: 0, ds: 0 }
};

const DEFAULT_RULES = [
    { min: 12, max: 12, dir: "N" },
    { min: 10, max: 11, dir: "NE" },
    { min: 8, max: 9, dir: "SE" },
    { min: 7, max: 7, dir: "SAME" },
    { min: 5, max: 6, dir: "S" },
    { min: 3, max: 4, dir: "SW" },
    { min: 2, max: 2, dir: "NW" }
];

export async function handleHexClick(startCell, allCells, dialogApp, settings, flowerId) {
    const rules = settings.navigationRules || DEFAULT_RULES;
    const edgeBehavior = settings.edgeBehavior || "stop";

    // 1. Roll 2d6
    const roll = await new Roll("2d6").evaluate(); // Foundry V12 await
    const total = roll.total;

    // Dice So Nice
    if (game.modules.get("dice-so-nice")?.active) {
        game.dice3d.showForRoll(roll, game.user, true);
    }

    // 2. Find Direction
    let entry = rules.find(d => total >= d.min && total <= d.max);
    if (!entry) {
        ui.notifications.warn(`No rule for roll ${total}, staying put.`);
        entry = { dir: "SAME" };
    }
    
    // Map Dir String to Deltas
    const deltas = DIRECTION_PRESETS[entry.dir] || { dq: 0, dr: 0 };

    // 3. Calculate New Coord
    const newQ = startCell.coord.q + deltas.dq;
    const newR = startCell.coord.r + deltas.dr;

    // 4. Find Target Hex & Apply Edge Behavior
    let targetCell = allCells.find(c => c.coord.q === newQ && c.coord.r === newR);
    let edgeMsg = "";

    if (!targetCell) {
        // Out of Bounds Logic
        if (entry.dir === "SAME") {
             targetCell = startCell;
        } else if (edgeBehavior === "wrap" || edgeBehavior === "loop") {
            // Antipodal wrap: (-q, -r)
            // Assuming 0,0 center. 
            targetCell = allCells.find(c => c.coord.q === -newQ && c.coord.r === -newR);
            if (targetCell) edgeMsg = "(Wrapped)";
            else targetCell = startCell; // Fallback if no antipodal
        } else if (edgeBehavior === "reflect") {
            // "Bounce" - stay put for now, or go back. 
            // Going back one step is: -dq, -dr
            const bounceQ = startCell.coord.q;
            const bounceR = startCell.coord.r;
            targetCell = startCell; // Simplest "Bounce off wall"
            edgeMsg = "(Reflected)";
        } else {
            // "stop"
            targetCell = startCell;
            edgeMsg = "(Blocked)";
        }
    }
    
    // Final Safe Check
    if (!targetCell) targetCell = startCell;
    const moved = targetCell !== startCell;

    // 5. Create Message
    const startName = getCellName(startCell);
    const targetName = getCellName(targetCell);

    let msg = `<h3>Hex Flower Navigation</h3>`;
    msg += `<b>Start:</b> ${startCell.emoji} ${startName}<br/>`;
    msg += `<b>Roll:</b> ${total} (${entry.dir})<br/>`;
    msg += `<b>Result:</b> ${targetCell.emoji} ${targetName} ${moved ? "" : "(Stayed)"} ${edgeMsg}`;

    ChatMessage.create({
        content: msg,
        whisper: ChatMessage.getWhisperRecipients("GM")
    });

    // 6. Log to Journal
    await logToJournal(startCell, total, entry.dir, targetCell, flowerId);

    // 7. Save State (Foundry Flags)
    const allStates = game.user.getFlag(FLAG_SCOPE, FLAG_STATE) || {};
    allStates[flowerId] = targetCell.coord;
    await game.user.setFlag(FLAG_SCOPE, FLAG_STATE, allStates);

    // 8. Visual Update
    const $el = dialogApp.element || $(dialogApp); 
    if ($el && $el.length) {
        const newSVG = generateHexSVG({ cells: allCells }, targetCell.coord);
        
        // Re-inject and Re-bind (simplest way to update state)
        // Ideally we would separate "Render" from "Listeners", but reusing the logic in openNavigator is okay.
        // We will call refresh logic here.
        const $container = $el.find("#hex-flower-container");
        $container.html(newSVG);
        $container.append(`<div id="hex-flower-info" class="hex-flower-tooltip" style="display:none;"></div>`); // Re-add tooltip container
        
        attachListeners($el, allCells, dialogApp, settings, flowerId);
        
        // Update "Place Tile" button context to current cell
        $el.find("#btn-place-tile").off('click').click(() => {
            activateTilePlacement(targetCell);
        });
    }

    ui.notifications.info(`Rolled ${total} (${entry.dir}) -> ${getCellName(targetCell)} ${edgeMsg}`);
}

async function logToJournal(startCell, rollVal, direction, endCell, flowerId) {
    const JOURNAL_NAME = "Hex Flower History";
    let journal = game.journal.getName(JOURNAL_NAME);

    if (!journal) {
        journal = await JournalEntry.create({ name: JOURNAL_NAME });
    }

    const targetName = getCellName(endCell);
    const exclude = ["bioma", "stage", "title", "name", "encounter_type", "emoji", "color", "coord", "x", "y"];
    const propertiesHtml = renderProperties(endCell, exclude);

    const timestamp = new Date().toLocaleString();
    const newContent = `
    <p>
    <strong>[${timestamp}] Move (${flowerId}):</strong><br/>
    ${startCell.emoji} ${getCellName(startCell)} 
    --> <strong>[${rollVal}: ${direction}]</strong> --> 
    ${endCell.emoji} ${targetName}<br/>
    <div style="font-size: 0.9em; border-left: 2px solid #ccc; padding-left: 5px; margin-top: 5px;">
        ${propertiesHtml}
    </div>
    </p>
    <hr/>
    `;

    // Append to first page or create
    let page = journal.pages.contents[0];
    if (!page) {
        await journal.createEmbeddedDocuments("JournalEntryPage", [{
            name: "Log",
            type: "text",
            text: { content: newContent }
        }]);
    } else {
        const currentText = page.text.content;
        await page.update({ "text.content": newContent + currentText });
    }
}

// -------------------------------------------------------------
// Interactive Tile Placement
// -------------------------------------------------------------
function activateTilePlacement(cell) {
    ui.notifications.info(`Click on the map to place tile for: ${getCellName(cell)} (Right-click to cancel)`);
    
    // Ghost Tile Logic
    // We can't easily make a "Ghost" without a proper PlaceableObject, but we can capture the cursor.
    // For simplicity: We will just listen for the click.
    
    const handler = (event) => {
        // Transform screen coords to canvas coords
        const transform = canvas.stage.worldTransform;
        // In Foundry V12, interaction logic might differ slightly, but standard PIXI interaction:
        // We use canvas.app.renderer.plugins.interaction.mouse.global usually, or event.data.getLocalPosition
        
        // Better: use `canvas.mousePosition`
        const pos = canvas.mousePosition;

        // Create Tile
        createTileAt(pos.x, pos.y, cell);

        // Cleanup
        canvas.stage.off('mousedown', handler);
        canvas.stage.off('rightdown', cancelHandler);
        ui.notifications.info("Tile placed.");
    };

    const cancelHandler = () => {
        canvas.stage.off('mousedown', handler);
        canvas.stage.off('rightdown', cancelHandler);
        ui.notifications.info("Placement cancelled.");
    };

    // Delay slightly to avoid immediate click registration
    setTimeout(() => {
        canvas.stage.on('mousedown', handler);
        canvas.stage.on('rightdown', cancelHandler);
    }, 200);
}

async function createTileAt(x, y, cell) {
    // Determine Image: Default to a generic hex icon since we don't have dynamic images yet?
    // User requested "option to place the hex as tile".
    // If the cell has an image property, use it.
    
    // Creating a text tile or a simple shape is hard. We need an image path.
    // Fallback: 'icons/svg/d20.svg' or check cell.image
    
    const imgPath = cell.image || "icons/svg/item-bag.svg"; 
    
    const tileData = {
        x: x - 50, // Center approx
        y: y - 50,
        width: 100,
        height: 100,
        texture: { src: imgPath }, // V12 syntax might require texture: { src: ... } or just img: ... check API
    };
    
    // V10+ uses `texture: { src: ... }` ? No, standard TileData is `texture: { src }` in V12? 
    // Let's use generic `img` if older, or map correctly.
    // Actually `texture: { src: path }` is V10+.
    
    // Add Tagger tags
    const flags = {};
    if (game.modules.get("tagger")?.active) {
        flags.tagger = {
            tags: ["hexflower", `hex-${cell.coord.q}-${cell.coord.r}`, getCellName(cell)]
        };
    }
    
    // Add Monk's Active Tile Triggers (Basic)
    if (game.modules.get("monks-active-tiles")?.active) {
        flags["monks-active-tiles"] = {
            active: true,
            record: true,
            actions: [{
                action: "notify",
                data: {
                    message: `Entered: ${getCellName(cell)}\n${getCellDescription(cell)}`,
                    type: "info"
                }
            }],
            triggers: [{
                id: "enter",
                name: "On Enter"
            }]
        };
    }

    await canvas.scene.createEmbeddedDocuments("Tile", [{
        ...tileData,
        flags: flags
    }]);
}

// -------------------------------------------------------------
// 4) Execute / Export
// -------------------------------------------------------------
function attachListeners($el, cells, dialogApp, settings, flowerId) {
    const $tooltip = $el.find("#hex-flower-info");

    $el.find(".hex-flower-cell").hover(
        function () {
            const dataStr = $(this).attr("data-cell");
            const cell = JSON.parse(dataStr);
            const name = getCellName(cell);
            const desc = getCellDescription(cell);

            let info = `<h4>${cell.emoji} ${name}</h4>`;
            
            // Image Support
            if (cell.image) {
                info += `<img src="${cell.image}" style="max-width:100%; border-radius:4px; margin-bottom:8px; border:1px solid #444;">`;
            }

            info += `<b>Coord:</b> (${cell.coord.q}, ${cell.coord.r}, ${cell.coord.s})<br/>`;

            if (desc) info += `<div class="hex-desc">${desc}</div><hr style="margin:4px 0; border-color:#555;"/>`;

            const exclude = ["bioma", "stage", "title", "name", "encounter_type", "description", "summary", "emoji", "color", "coord", "x", "y", "image"];
            info += renderProperties(cell, exclude);

            $tooltip.html(info).show();
        },
        function () { $tooltip.hide(); }
    );

    $el.find(".hex-flower-cell").click(async function () {
        const dataStr = $(this).attr("data-cell");
        const startCell = JSON.parse(dataStr);
        await handleHexClick(startCell, cells, dialogApp, settings, flowerId);
    });
}

export async function openNavigator() {
    const registry = game.user.getFlag(FLAG_SCOPE, FLAG_REGISTRY) || {};
    const ids = Object.keys(registry);

    if (ids.length === 0) {
        return ui.notifications.warn("No Hex Flowers found. Run 'Hex Flower Manager' to create one!");
    }

    // Capture selection function to reuse
    const pickFlower = async () => {
        let selectedId = ids[0];
        if (ids.length > 1) {
            let options = "";
            ids.forEach(id => {
                options += `<option value="${id}">${registry[id].name}</option>`;
            });

            const selected = await Dialog.prompt({
                title: "Select Hex Flower",
                content: `<div class="form-group"><label>Choose:</label><select id="flower-select">${options}</select></div>`,
                callback: (html) => html.find("#flower-select").val()
            });
            if (!selected) return null;
            selectedId = selected;
        }
        return selectedId;
    };

    const runViewer = async (selectedId) => {
        if (!selectedId) return;

        // Load Data & State
        const entry = registry[selectedId];
        const flowerData = entry.data;
        const flowerName = entry.name;
        // Settings/Rules
        const settings = {
            navigationRules: entry.navigationRules,
            edgeBehavior: entry.edgeBehavior
        };

        const allStates = game.user.getFlag(FLAG_SCOPE, FLAG_STATE) || {};
        const savedCoord = allStates[selectedId] || null;

        const backBtn = ids.length > 1 ? `<button id="hex-flower-back" style="flex: 0 0 auto; width: auto; margin-right: 5px;"><i class="fas fa-arrow-left"></i></button>` : "";

        // UI Content
        const content = `
        <div style="display:flex; align-items:center; margin-bottom: 5px;">
            ${backBtn}
            <h3 style="margin:0;">${flowerName}</h3>
            <button id="btn-place-tile" style="margin-left:auto; width:auto;" title="Place current Hex as Tile"><i class="fas fa-map-marker-alt"></i></button>
        </div>
        <div style="width: 100%; height: 600px; position: relative; background: #222; overflow: hidden;" id="hex-flower-container">
            ${generateHexSVG(flowerData, savedCoord)}
            <div id="hex-flower-info" class="hex-flower-tooltip" style="display:none;"></div>
        </div>
        `;

        const d = new Dialog({
            title: `Hex Flower Viewer`,
            content: content,
            buttons: {},
            render: (html) => {
                html.closest(".app").addClass("hex-flower-dialog");

                html.find("#hex-flower-back").click(async () => {
                    d.close();
                    const newId = await pickFlower();
                    if (newId) runViewer(newId);
                });

                // Attach Tile Placement (Initial)
                // Need to find CURRENT cell to place. 
                // If savedCoord exists, find that cell. Else... we can't place yet? 
                
                let currentCell = null;
                if (savedCoord) {
                    currentCell = flowerData.cells.find(c => c.coord.q === savedCoord.q && c.coord.r === savedCoord.r);
                }
                
                html.find("#btn-place-tile").click(() => {
                    if (currentCell) activateTilePlacement(currentCell);
                    else ui.notifications.warn("No current hex active (navigate once to set start).");
                });

                // Attach Hex Listeners
                attachListeners(html, flowerData.cells, d, settings, selectedId);
            }
        }, {
            width: 800,
            height: 700,
            resizable: true
        });

        d.render(true);
    };

    const startId = await pickFlower();
    if (startId) runViewer(startId);
}
