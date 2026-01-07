/**
 * Hex Flower Manager
 * Use this module to Import, Edit, or Delete Hex Flowers stored in the World.
 */

const FLAG_SCOPE = "world";
const FLAG_REGISTRY = "hex_flower_registry";
const HEX_SIZE = 25; // Smaller for preview
const SQRT3 = Math.sqrt(3);

export async function getRegistry() {
    return game.user.getFlag(FLAG_SCOPE, FLAG_REGISTRY) || {};
}

async function saveRegistry(registry) {
    await game.user.setFlag(FLAG_SCOPE, FLAG_REGISTRY, registry);
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// -------------------------------------------------------------
// Rendering Helpers (Duplicated for Preview)
// -------------------------------------------------------------

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

function generateMiniSVG(data) {
    const cells = data.cells || [];
    if (!cells.length) return `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#555;">No Cells</div>`;

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
               preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

    cells.forEach(cell => {
        const { x, y } = cubeToPixel(cell.coord.q, cell.coord.r, HEX_SIZE);
        // Simplified rendering for preview
        svg += `
        <g>
            <polygon points="${hexCorners(x, y, HEX_SIZE)}" 
                     fill="${cell.color || '#cccccc'}" 
                     stroke="#333" stroke-width="1" />
            <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" 
                  font-size="10" style="pointer-events:none;">${cell.emoji || ''}</text>
        </g>`;
    });

    svg += `</svg>`;
    return svg;
}

// -------------------------------------------------------------
// UI Functions
// -------------------------------------------------------------

export async function openManager() {
    const registry = await getRegistry();
    const flowers = Object.entries(registry);

    let listHtml = "";
    if (flowers.length === 0) {
        listHtml = `<tr><td colspan="3" style="text-align:center; padding: 20px; color:#777;">No Hex Flowers found.<br/>Click Import to start!</td></tr>`;
    } else {
        flowers.forEach(([id, entry]) => {
            const name = entry.name || "Unnamed Flower";
            listHtml += `
            <tr>
                <td><strong>${name}</strong></td>
                <td style="text-align: center;">${entry.data.cells ? entry.data.cells.length : 0} hexes</td>
                <td style="text-align: right;">
                    <button class="hex-btn edit-flower" data-id="${id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="hex-btn danger delete-flower" data-id="${id}" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
    }

    const content = `
    <div class="hex-manager-container">
        <h3 style="border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 10px; color: #fff;">Hex Flower Manager</h3>
        <table class="hex-manager-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th style="text-align:center;">Size</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${listHtml}
            </tbody>
        </table>
        <button id="btn-import-flower" class="hex-btn hex-btn-main"><i class="fas fa-file-import"></i> Create / Import New Flower</button>
    </div>
    `;

    new Dialog({
        title: "Hex Flower Manager",
        content: content,
        buttons: {
            close: { label: "Close" }
        },
        render: (html) => {
            html.closest(".app").addClass("hex-flower-dialog");

            html.find("#btn-import-flower").click(() => {
                showEditDialog(null, registry);
            });

            html.find(".edit-flower").click((ev) => {
                const id = $(ev.currentTarget).data("id");
                showEditDialog(id, registry);
            });

            html.find(".delete-flower").click(async (ev) => {
                const id = $(ev.currentTarget).data("id");
                const confirm = await Dialog.confirm({
                    title: "Delete Hex Flower?",
                    content: `<p>Are you sure you want to delete <strong>${registry[id].name}</strong>?</p>`
                });
                if (confirm) {
                    delete registry[id];
                    await saveRegistry(registry);
                    // Refresh
                    Object.values(ui.windows).forEach(w => {
                        if (w.title === "Hex Flower Manager") w.close();
                    });
                    openManager();
                }
            });
        }
    }, { width: 450, height: "auto" }).render(true);
}

const DIRECTION_PRESETS = {
    "N": { dq: 0, dr: -1, ds: 1 },
    "NE": { dq: 1, dr: -1, ds: 0 },
    "SE": { dq: 1, dr: 0, ds: -1 },
    "S": { dq: 0, dr: 1, ds: -1 },
    "SW": { dq: -1, dr: 1, ds: 0 },
    "NW": { dq: -1, dr: 0, ds: 1 },
    "SAME": { dq: 0, dr: 0, ds: 0 } // Stay
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

function showEditDialog(id, registry) {
    const isNew = !id;
    const entry = isNew ? { name: "", data: { cells: [] } } : registry[id];
    
    // Default values if missing
    if (!entry.edgeBehavior) entry.edgeBehavior = "stop";
    if (!entry.navigationRules) entry.navigationRules = JSON.parse(JSON.stringify(DEFAULT_RULES));

    const jsonString = JSON.stringify(entry.data, null, 2);

    // Helpers to render rules rows
    const renderRulesRows = (rules) => {
        return rules.map((r, i) => `
            <tr class="rule-row">
                <td><input type="number" class="hex-input-small rule-min" value="${r.min}" style="width:40px"></td>
                <td style="text-align:center;">-</td>
                <td><input type="number" class="hex-input-small rule-max" value="${r.max}" style="width:40px"></td>
                <td>
                    <select class="hex-input-small rule-dir">
                        ${Object.keys(DIRECTION_PRESETS).map(d => `<option value="${d}" ${r.dir === d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                </td>
                <td><button type="button" class="hex-btn danger btn-del-rule"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    };

    const content = `
    <style>
        .hex-tabs { display: flex; border-bottom: 1px solid #444; margin-bottom: 10px; }
        .hex-tab { padding: 8px 15px; cursor: pointer; background: #222; border: 1px solid transparent; border-bottom: none; color: #ccc; }
        .hex-tab.active { background: #444; color: #fff; border-color: #555; font-weight: bold; }
        .hex-tab-content { display: none; height: 100%; overflow-y: auto; }
        .hex-tab-content.active { display: block; }
        .hex-input-small { background: #333; color: #fff; border: 1px solid #555; padding: 3px; border-radius: 3px; }
    </style>

    <div class="hex-edit-layout" style="flex-direction: column;">
        
        <div style="margin-bottom: 10px; display:flex; align-items:center; gap: 10px;">
            <label class="hex-label" style="min-width: 80px;">Name:</label>
            <input type="text" class="hex-input" name="name" value="${entry.name}" placeholder="e.g. My Weather Engine" style="flex:1;"/>
        </div>

        <div class="hex-tabs">
            <div class="hex-tab active" data-tab="data">Data (JSON)</div>
            <div class="hex-tab" data-tab="settings">Navigation Rules</div>
        </div>

        <div style="flex: 1; display:flex; overflow: hidden; min-height: 400px;">
            
            <!-- TAB: DATA -->
            <div class="hex-tab-content active" id="tab-data" style="width:100%;">
                <div style="display: flex; height: 100%; gap: 10px;">
                    <!-- JSON Input -->
                    <div style="flex:1; display:flex; flex-direction:column;">
                        <textarea class="hex-input" id="hex-json-input" name="json" style="flex:1; font-family: monospace;">${jsonString}</textarea>
                        <p style="font-size:10px; color:#777; margin: 3px 0 0 0;">Paste complete JSON (must have "cells" array).</p>
                    </div>
                    
                    <!-- Preview -->
                    <div class="hex-edit-right" style="flex:1; border-left: 1px solid #444; padding-left: 10px;">
                        <div class="hex-preview-header">Preview</div>
                        <div class="hex-preview-content" id="hex-preview-container"></div>
                    </div>
                </div>
            </div>

            <!-- TAB: SETTINGS -->
            <div class="hex-tab-content" id="tab-settings" style="width:100%; padding: 5px;">
                
                <div style="margin-bottom: 20px;">
                    <label class="hex-label">Edge Behavior</label>
                    <select id="edge-behavior" class="hex-input" style="width: 200px;">
                        <option value="stop" ${entry.edgeBehavior === 'stop' ? 'selected' : ''}>Stop (Stay in place)</option>
                        <option value="wrap" ${entry.edgeBehavior === 'wrap' ? 'selected' : ''}>Wrap (Teleport to opposite)</option>
                        <option value="reflect" ${entry.edgeBehavior === 'reflect' ? 'selected' : ''}>Reflect (Bounce back)</option>
                        <option value="loop" ${entry.edgeBehavior === 'loop' ? 'selected' : ''}>Loop (Connect edges)</option>
                    </select>
                    <p class="notes">What happens when a roll tries to move off the map?</p>
                </div>

                <label class="hex-label">Navigation Rules (2d6 Standard)</label>
                <div style="max-height: 300px; overflow-y: auto; background: #222; padding: 5px; border: 1px solid #444;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="text-align:left; color:#888;">
                                <th>Min</th><th></th><th>Max</th><th>Direction</th><th></th>
                            </tr>
                        </thead>
                        <tbody id="rules-tbody">
                            ${renderRulesRows(entry.navigationRules)}
                        </tbody>
                    </table>
                    <button type="button" id="btn-add-rule" class="hex-btn" style="margin-top: 5px; font-size: 0.8em;"><i class="fas fa-plus"></i> Add Rule</button>
                </div>

            </div>

        </div>
    </div>
    `;

    const d = new Dialog({
        title: isNew ? "Import Hex Flower" : "Edit Hex Flower",
        content: content,
        buttons: {
            save: {
                label: "<i class='fas fa-save'></i> Save",
                callback: async (html) => {
                    const name = html.find('[name="name"]').val();
                    const jsonRaw = html.find('[name="json"]').val();
                    
                    // Capture Settings
                    const edgeBehavior = html.find('#edge-behavior').val();
                    const rules = [];
                    html.find('.rule-row').each((i, el) => {
                        const min = parseInt($(el).find('.rule-min').val());
                        const max = parseInt($(el).find('.rule-max').val());
                        const dir = $(el).find('.rule-dir').val();
                        if (!isNaN(min) && !isNaN(max) && dir) {
                            rules.push({ min, max, dir });
                        }
                    });

                    try {
                        const parsedData = JSON.parse(jsonRaw);
                        if (!parsedData.cells || !Array.isArray(parsedData.cells)) {
                            return ui.notifications.error("Invalid JSON: Root must contain a 'cells' array.");
                        }

                        // Save
                        const newId = id || generateId();
                        registry[newId] = {
                            name: name || "Unnamed Flower",
                            data: parsedData,
                            edgeBehavior: edgeBehavior,
                            navigationRules: rules
                        };

                        await saveRegistry(registry);
                        ui.notifications.info(`Saved "${registry[newId].name}".`);

                        // Re-open manager
                        Object.values(ui.windows).forEach(w => w.close());
                        openManager();

                    } catch (e) {
                        ui.notifications.error("JSON Parse Error: " + e.message);
                        console.error(e);
                    }
                }
            },
            cancel: {
                label: "<i class='fas fa-arrow-left'></i> Back",
                callback: () => {
                    Object.values(ui.windows).forEach(w => w.close());
                    openManager();
                }
            }
        },
        render: (html) => {
            html.closest(".app").addClass("hex-flower-dialog");

            // TABS LOGIC
            html.find('.hex-tab').click(ev => {
                const target = $(ev.currentTarget).data('tab');
                html.find('.hex-tab').removeClass('active');
                $(ev.currentTarget).addClass('active');
                html.find('.hex-tab-content').removeClass('active');
                html.find(`#tab-${target}`).addClass('active');
            });

            // RULES LOGIC
            const $tbody = html.find('#rules-tbody');
            html.find('#btn-add-rule').click(() => {
                $tbody.append(`
                    <tr class="rule-row">
                        <td><input type="number" class="hex-input-small rule-min" value="0" style="width:40px"></td>
                        <td style="text-align:center;">-</td>
                        <td><input type="number" class="hex-input-small rule-max" value="0" style="width:40px"></td>
                        <td>
                            <select class="hex-input-small rule-dir">
                                ${Object.keys(DIRECTION_PRESETS).map(d => `<option value="${d}">${d}</option>`).join('')}
                            </select>
                        </td>
                        <td><button type="button" class="hex-btn danger btn-del-rule"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `);
            });

            html.on('click', '.btn-del-rule', (ev) => {
                $(ev.currentTarget).closest('tr').remove();
            });

            // DATA PREVIEW LOGIC
            const $textarea = html.find("#hex-json-input");
            const $preview = html.find("#hex-preview-container");

            const updatePreview = () => {
                const raw = $textarea.val();
                try {
                    const data = JSON.parse(raw);
                    const svg = generateMiniSVG(data);
                    $preview.html(svg);
                } catch (e) {
                    $preview.html(`<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#d44;">Invalid JSON</div>`);
                }
            };

            updatePreview();
            $textarea.on("input", updatePreview);
        }
    }, { width: 900, height: 740, resizable: true });

    d.render(true);
}
