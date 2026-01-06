/**
 * Hex Flower Navigator
 * Reads Hex Flowers stored in the World Registry (via hex_flower_manager.js).
 * now supports GENERIC schemas (biomes, foreshadowing, factions, etc.)
 */

const FLAG_SCOPE = "world";
const FLAG_REGISTRY = "hex_flower_registry";
const FLAG_STATE = "hex_flower_state";

// -------------------------------------------------------------
// Helper: Get Display Name
// -------------------------------------------------------------
function getCellName(cell) {
    // Try common keys for a "Title"
    return cell.bioma || cell.stage || cell.title || cell.name || cell.encounter_type || "Hex";
}

// -------------------------------------------------------------
// Helper: Get Description / Details
// -------------------------------------------------------------
function getCellDescription(cell) {
    // Try common keys for a longer description
    return cell.description || cell.summary || "";
}

// -------------------------------------------------------------
// Helper: Render Object to HTML (Recursive-ish)
// -------------------------------------------------------------
function renderProperties(obj, excludeKeys = []) {
    let html = "";

    // Helper to format a single value (leaf or object)
    const formatValue = (v) => {
        if (v && typeof v === 'object') {
            // Check for descriptive keys (the "hidro" logic user requested)
            if (v.banda) return v.banda;
            if (v.banda_terrestre || v.banda_marinha) {
                return [v.banda_terrestre, v.banda_marinha].filter(b => b).join("/");
            }
            if (v.name) return v.name;
            if (v.title) return v.title;

            // If just a raw object, try to join its values if they are simple
            const values = Object.values(v);
            if (values.every(val => typeof val !== 'object')) {
                return values.join(", ");
            }
            return "[Detail]"; // Fallback for very complex objects to avoid huge blobs
        }
        return v;
    };

    for (const [key, value] of Object.entries(obj)) {
        if (excludeKeys.includes(key)) continue;

        let displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

        if (typeof value === 'object' && value !== null) {
            // Nested object (like tags)
            // Map each key: value in the sub-object
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
function generateHexSVG(data, currentCoord) {
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

    // SVG Header
    let svg = `<svg width="100%" height="100%" viewBox="${minX - 10} ${minY - 10} ${width} ${height}" 
               preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" 
               style="max-height: 85vh;">`;

    // Hexes
    cells.forEach(cell => {
        const { x, y } = cubeToPixel(cell.coord.q, cell.coord.r, HEX_SIZE);

        let name = getCellName(cell);
        if (name.length > 15) name = name.substring(0, 13) + "…";

        // Check if this is the "Current" hex
        let isCurrent = false;
        if (currentCoord) {
            if (cell.coord.q === currentCoord.q && cell.coord.r === currentCoord.r) {
                isCurrent = true;
            }
        }

        const border = isCurrent ? "#00FFFF" : "#333";
        const width = isCurrent ? 4 : 1.5;
        const zIndexStyle = isCurrent ? "z-index: 10;" : "";

        // Store data attributes for tooltip
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
const DIRECTION_TABLE = [
    { min: 12, max: 12, dir: "N", dq: 0, dr: -1, ds: 1 },
    { min: 10, max: 11, dir: "NE", dq: 1, dr: -1, ds: 0 },
    { min: 8, max: 9, dir: "SE", dq: 1, dr: 0, ds: -1 },
    { min: 7, max: 7, dir: "SAME", dq: 0, dr: 0, ds: 0 }, // Stay
    { min: 5, max: 6, dir: "S", dq: 0, dr: 1, ds: -1 },
    { min: 3, max: 4, dir: "SW", dq: -1, dr: 1, ds: 0 },
    { min: 2, max: 2, dir: "NW", dq: -1, dr: 0, ds: 1 }
];

async function handleHexClick(startCell, allCells, dialogApp, hexData, flowerId) {
    // 1. Roll 2d6
    const roll = new Roll("2d6");
    await roll.evaluate();
    const total = roll.total;

    // 2. Find Direction
    let entry = DIRECTION_TABLE.find(d => total >= d.min && total <= d.max);
    if (!entry) entry = { dir: "UNKNOWN", dq: 0, dr: 0 };

    // 3. Calculate New Coord
    const newQ = startCell.coord.q + entry.dq;
    const newR = startCell.coord.r + entry.dr;
    // const newS = startCell.coord.s + entry.ds;

    // 4. Find Target Hex
    const targetCell = allCells.find(c => c.coord.q === newQ && c.coord.r === newR) || startCell;
    const moved = targetCell !== startCell;

    // 5. Create Message
    const startName = getCellName(startCell);
    const targetName = getCellName(targetCell);

    let msg = `<h3>Hex Flower Navigation</h3>`;
    msg += `<b>Start:</b> ${startCell.emoji} ${startName}<br/>`;
    msg += `<b>Roll:</b> ${total} (${entry.dir})<br/>`;
    msg += `<b>Result:</b> ${targetCell.emoji} ${targetName} ${moved ? "" : "(Stayed)"}`;

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
    if (dialogApp && dialogApp.element) {
        const newSVG = generateHexSVG(hexData, targetCell.coord);
        const $container = dialogApp.element.find("#hex-flower-container");
        $container.html(newSVG);

        // Re-attach listeners
        const $tooltip = dialogApp.element.find("#hex-flower-info");
        $container.find(".hex-flower-cell").hover(
            function () {
                const dataStr = $(this).attr("data-cell");
                const cell = JSON.parse(dataStr);
                const name = getCellName(cell);
                const desc = getCellDescription(cell);

                let info = `<h4>${cell.emoji} ${name}</h4>`;
                info += `<b>Coord:</b> (${cell.coord.q}, ${cell.coord.r}, ${cell.coord.s})<br/>`;

                if (desc) info += `<i>${desc}</i><br/><hr style="margin:4px 0; border-color:#555;"/>`;

                // Generic Properties
                // Exclude known visuals/coords
                const exclude = ["bioma", "stage", "title", "name", "encounter_type", "description", "summary", "emoji", "color", "coord", "x", "y"];
                info += renderProperties(cell, exclude);

                $tooltip.html(info).show();
            },
            function () { $tooltip.hide(); }
        );

        $container.find(".hex-flower-cell").click(async function () {
            const dataStr = $(this).attr("data-cell");
            const nextStartCell = JSON.parse(dataStr);
            await handleHexClick(nextStartCell, hexData.cells, dialogApp, hexData, flowerId);
        });
    }

    ui.notifications.info(`Rolled ${total} (${entry.dir}) -> ${getCellName(targetCell)}`);
}

async function logToJournal(startCell, rollVal, direction, endCell, flowerId) {
    const JOURNAL_NAME = "Hex Flower History";
    let journal = game.journal.getName(JOURNAL_NAME);

    if (!journal) {
        journal = await JournalEntry.create({ name: JOURNAL_NAME });
    }

    const targetName = getCellName(endCell);

    // Generic Details for Log
    const exclude = ["bioma", "stage", "title", "name", "encounter_type", "emoji", "color", "coord", "x", "y"];
    // We keep description/summary in the generic loop or handle explicitly
    // Let's just dump everything relevant
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
// 4) Execute
// -------------------------------------------------------------
async function main() {
    const registry = game.user.getFlag(FLAG_SCOPE, FLAG_REGISTRY) || {};
    const ids = Object.keys(registry);

    if (ids.length === 0) {
        return ui.notifications.warn("No Hex Flowers found. Run 'Hex Flower Manager' to create one!");
    }

    // Capture selection function to reuse
    const pickFlower = async () => {
        // Selector Logic
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
        const flowerData = registry[selectedId].data;
        const flowerName = registry[selectedId].name;
        const allStates = game.user.getFlag(FLAG_SCOPE, FLAG_STATE) || {};
        const savedCoord = allStates[selectedId] || null;

        // Render
        const backBtn = ids.length > 1 ? `<button id="hex-flower-back" style="flex: 0 0 auto; width: auto; margin-right: 5px;"><i class="fas fa-arrow-left"></i></button>` : "";

        const content = `
        <style>
            .hex-flower-tooltip {
                position: absolute;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 4px;
                font-size: 13px;
                max-width: 300px;
                pointer-events: none;
                z-index: 1000;
                border: 1px solid #444;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            }
            .hex-flower-tooltip h4 {
                margin: 0 0 5px 0;
                border-bottom: 1px solid #777;
                padding-bottom: 3px;
            }
            .hex-flower-cell:hover polygon {
                stroke: white;
                stroke-width: 3;
            }
        </style>
        <div style="display:flex; align-items:center; margin-bottom: 5px;">
            ${backBtn}
            <h3 style="margin:0;">${flowerName}</h3>
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
                // Back Button
                html.find("#hex-flower-back").click(async () => {
                    d.close();
                    const newId = await pickFlower();
                    if (newId) runViewer(newId);
                });

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

                        // Generic Properties
                        const exclude = ["bioma", "stage", "title", "name", "encounter_type", "description", "summary", "emoji", "color", "coord", "x", "y"];
                        info += renderProperties(cell, exclude);

                        $tooltip.html(info).show();
                    },
                    function () { $tooltip.hide(); }
                );

                html.find(".hex-flower-cell").click(async function () {
                    const dataStr = $(this).attr("data-cell");
                    const startCell = JSON.parse(dataStr);

                    await handleHexClick(startCell, flowerData.cells, d, flowerData, selectedId);
                });
            }
        }, {
            width: 800,
            height: 700,
            resizable: true
        });

        d.render(true);
    };

    // Initial Run
    const startId = await pickFlower();
    if (startId) runViewer(startId);
}

main();