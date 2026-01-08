/**
 * Hex Flower Manager
 * Use this module to Import, Edit, or Delete Hex Flowers stored in the World.
 */
import { HexFlowerSchema } from './schema.js';

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

function generateManagerSVG(cells, selectedCoord) {
    if (!cells || !cells.length) return `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#555;">No Hexes (Add one to start)</div>`;

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
        let name = cell.title || cell.name || "Hex";
        if (name.length > 8) name = name.substring(0, 6) + "…";

        const isSelected = selectedCoord && cell.coord.q === selectedCoord.q && cell.coord.r === selectedCoord.r;
        const stroke = isSelected ? "#00FFFF" : "#333";
        const strokeWidth = isSelected ? 3 : 1;
        const fill = cell.color || "#ccc";
        const zIndex = isSelected ? 10 : 1;

        // data-q/r for click detection
        svg += `
        <g class="manager-hex" data-q="${cell.coord.q}" data-r="${cell.coord.r}" style="cursor: pointer; z-index: ${zIndex}">
            <polygon points="${hexCorners(x, y, HEX_SIZE)}" 
                     fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" 
                  font-size="8" fill="#000" style="pointer-events:none; font-weight: bold;">${name}</text>
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

// -------------------------------------------------------------
// Visual Editor Dialog
// -------------------------------------------------------------
function showEditDialog(id, registry) {
    const isNew = !id;
    const originalEntry = isNew ? { name: "", data: { cells: [] } } : registry[id];

    // Local Draft State
    let draftEntry = {
        name: originalEntry.name || "Unnamed Flower",
        data: originalEntry.data ? JSON.parse(JSON.stringify(originalEntry.data)) : { cells: [] },
        edgeBehavior: originalEntry.edgeBehavior || "stop",
        navigationRules: originalEntry.navigationRules ? JSON.parse(JSON.stringify(originalEntry.navigationRules)) : JSON.parse(JSON.stringify(DEFAULT_RULES)),
        partyActorId: originalEntry.partyActorId || ""
    };
    
    // Ensure cells exist
    if (!draftEntry.data.cells) draftEntry.data.cells = [];

    // UI State
    let selectedHexIndex = draftEntry.data.cells.length > 0 ? 0 : -1;

    // Helper: Find first available neighbor or spot
    const findNewHexCoord = () => {
        if (draftEntry.data.cells.length === 0) return { q: 0, r: 0, s: 0 };
        
        // Try to find a free neighbor of the selected hex (or last hex)
        const baseIndex = selectedHexIndex >= 0 ? selectedHexIndex : draftEntry.data.cells.length - 1;
        const base = draftEntry.data.cells[baseIndex].coord;
        
        const neighbors = [
            {q:0, r:-1, s:1}, {q:1, r:-1, s:0}, {q:1, r:0, s:-1},
            {q:0, r:1, s:-1}, {q:-1, r:1, s:0}, {q:-1, r:0, s:1}
        ];
        
        for (let n of neighbors) {
            const tryQ = base.q + n.q;
            const tryR = base.r + n.r;
            const exists = draftEntry.data.cells.some(c => c.coord.q === tryQ && c.coord.r === tryR);
            if (!exists) return { q: tryQ, r: tryR, s: -tryQ-tryR };
        }
        return null; // All neighbors taken? Should search spiral. For now, random far one?
    };

    const renderRulesTable = (rules) => {
        let rows = rules.map((r, i) => `
            <tr>
                   <td><input type="number" class="rule-min hex-input-small" data-idx="${i}" value="${r.min}" style="width:40px"></td>
                   <td><input type="number" class="rule-max hex-input-small" data-idx="${i}" value="${r.max}" style="width:40px"></td>
                   <td>
                       <select class="rule-dir hex-input-small" data-idx="${i}">
                           ${Object.keys(DIRECTION_PRESETS).map(d => `<option value="${d}" ${r.dir === d ? "selected":""}>${d}</option>`).join("")}
                       </select>
                   </td>
                   <td><button class="rule-del hex-btn danger" data-idx="${i}"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join("");
        return `<table style="width:100%; border-collapse:collapse;">
                    <thead><tr style="text-align:left; color:#888;"><th>Min</th><th>Max</th><th>Dir</th><th></th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <button id="add-rule" class="hex-btn"><i class="fas fa-plus"></i> Add Rule</button>`;
    };
    
    // Main Render Function
    const getDialogContent = () => {
        const selectedCell = selectedHexIndex >= 0 ? draftEntry.data.cells[selectedHexIndex] : null;

        // Props Panel
        let propsHtml = `<div class="hex-empty-props">Select a Hex to edit properties</div>`;
        if (selectedCell) {
            propsHtml = `
            <div class="props-form">
                <div class="form-group"><label>Title</label><input type="text" id="prop-title" class="hex-input" value="${selectedCell.title || ''}"/></div>
                <div class="form-group"><label>Desc</label><textarea id="prop-desc" class="hex-input" rows="2">${selectedCell.description || ''}</textarea></div>
                <div class="form-group"><label>Type</label><input type="text" id="prop-type" class="hex-input" placeholder="e.g. Swamp" value="${selectedCell.bioma || ''}"/></div>
                <div class="form-group"><label>Subtitle</label><input type="text" id="prop-name" class="hex-input" placeholder="Name/Subtitle" value="${selectedCell.name || ''}"/></div>
                <div class="form-group"><label>Color</label><input type="color" id="prop-color" value="${selectedCell.color || '#cccccc'}" style="width:100%; height:30px; border:none;"/></div>
                <div class="form-group"><label>Icon/Emoji</label><input type="text" id="prop-emoji" class="hex-input" value="${selectedCell.emoji || ''}"/></div>
                <div class="form-group" style="display:flex; justify-content:space-between; color:#777; font-size:0.8em; padding-top:5px;">
                    <span>Q: ${selectedCell.coord.q}</span>
                    <span>R: ${selectedCell.coord.r}</span>
                    <button id="btn-del-hex" class="hex-btn danger small"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
            `;
        }

        const navRulesHtml = `
            <div style="padding:10px;">
                <div class="form-group">
                    <label>Edge Behavior:</label>
                    <select id="edge-behavior" class="hex-input">
                        <option value="stop" ${draftEntry.edgeBehavior === 'stop' ? 'selected' : ''}>Stop</option>
                        <option value="wrap" ${draftEntry.edgeBehavior === 'wrap' ? 'selected' : ''}>Wrap</option>
                        <option value="reflect" ${draftEntry.edgeBehavior === 'reflect' ? 'selected' : ''}>Reflect</option>
                        <option value="loop" ${draftEntry.edgeBehavior === 'loop' ? 'selected' : ''}>Loop</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Party Actor (Token):</label>
                    <select id="party-actor" class="hex-input">
                        <option value="">-- None --</option>
                        ${game.actors.map(a => `<option value="${a.id}" ${draftEntry.partyActorId === a.id ? 'selected' : ''}>${a.name}</option>`).join("")}
                    </select>
                </div>
                <h4 style="margin-top:10px; border-bottom:1px solid #444;">Navigation Rules (2d6)</h4>
                <div id="rules-container">${renderRulesTable(draftEntry.navigationRules)}</div>
            </div>
        `;

        const jsonHtml = `
            <div style="display:flex; flex-direction:column; height:100%; padding:10px;">
                <textarea id="full-json" style="flex:1; width:100%; font-family:monospace; background:#111; color:#0f0; border:1px solid #444;">${JSON.stringify({ data: draftEntry.data, navigationRules: draftEntry.navigationRules, edgeBehavior: draftEntry.edgeBehavior }, null, 2)}</textarea>
                <div style="margin-top:5px; display:flex; gap:5px;">
                    <button id="btn-import-json" class="hex-btn hex-btn-main"><i class="fas fa-file-import"></i> Parse & Apply JSON</button>
                    <button id="btn-copy-json" class="hex-btn"><i class="fas fa-copy"></i> Copy to Clipboard</button>
                </div>
            </div>
        `;

        return `
        <div class="hex-editor-container" style="height: 650px; display:flex; flex-direction:column;">
            <div style="display:flex; align-items:center; gap:10px; padding-bottom:10px; border-bottom:1px solid #444;">
                 <label>Name:</label>
                 <input type="text" class="hex-input" id="flower-name" value="${draftEntry.name}" style="flex:1;"/>
            </div>

            <nav class="sheet-tabs tabs" data-group="primary" style="margin-top:5px;">
                <a class="item" data-tab="visual"><i class="fas fa-th"></i> Visual Editor</a>
                <a class="item" data-tab="rules"><i class="fas fa-balance-scale"></i> Rules</a>
                <a class="item" data-tab="json"><i class="fas fa-code"></i> Data (JSON)</a>
            </nav>

            <section class="content" style="flex:1; overflow:hidden; position:relative;">
                <!-- VISUAL TAB -->
                <div class="tab" data-tab="visual" style="height:100%; display:flex; gap:10px; padding-top:10px;">
                    <!-- Left: Grid -->
                    <div class="hex-grid-pane" style="flex:1; display:flex; flex-direction:column;">
                        <div class="toolbar" style="margin-bottom:5px;">
                            <button id="btn-add-hex" class="hex-btn"><i class="fas fa-plus"></i> Add Hex</button>
                        </div>
                        <div class="svg-container" style="flex:1; background: #222; border-radius: 4px; overflow: hidden; border:1px solid #333;">
                            ${generateManagerSVG(draftEntry.data.cells, selectedCell ? selectedCell.coord : null)}
                        </div>
                    </div>
                    <!-- Right: Props -->
                    <div class="hex-props-pane" style="width: 250px; background: #1a1a1a; padding: 10px; border-left: 1px solid #444;">
                        ${propsHtml}
                    </div>
                </div>

                <!-- RULES TAB -->
                <div class="tab" data-tab="rules" style="height:100%; overflow-y:auto;">
                    ${navRulesHtml}
                </div>

                <!-- JSON TAB -->
                <div class="tab" data-tab="json" style="height:100%;">
                    ${jsonHtml}
                </div>
            </section>
        </div>
        `;
    };

    // Unique ID for this editor instance to avoid DOM conflicts
    const editorWrapperId = `hex-editor-${generateId()}`;

    const d = new Dialog({
        title: isNew ? "Create Hex Flower" : `Edit: ${originalEntry.name}`,
        content: `<div id="${editorWrapperId}" class="hex-editor-wrapper" style="height:100%;">Loading Editor...</div>`,
        buttons: {
            save: {
                label: "<i class='fas fa-save'></i> Save",
                callback: async () => {
                    // Validation
                    const toValidate = {
                        version: "1.0.0",
                        name: draftEntry.name,
                        cells: draftEntry.data.cells,
                        navigationRules: draftEntry.navigationRules,
                        edgeBehavior: draftEntry.edgeBehavior,
                        partyActorId: draftEntry.partyActorId
                    };

                    const result = HexFlowerSchema.safeParse(toValidate);
                    if (!result.success) {
                        console.error(result.error);
                        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                        ui.notifications.error("Validation Failed: " + errors);
                        throw new Error("Validation Failed");
                    }

                    // Save
                    const saveId = id || generateId();
                    registry[saveId] = {
                        name: draftEntry.name,
                        data: { cells: draftEntry.data.cells },
                        edgeBehavior: draftEntry.edgeBehavior,
                        navigationRules: draftEntry.navigationRules,
                        partyActorId: draftEntry.partyActorId
                    };

                    await saveRegistry(registry);
                    ui.notifications.info(`Saved ${draftEntry.name}`);
                    Object.values(ui.windows).forEach(w => { if(w !== d && w.title === "Hex Flower Manager") w.close(); });
                    openManager();
                }
            },
            cancel: { label: "Cancel" }
        },
        render: (html) => {
            html.closest(".app").addClass("hex-flower-dialog");

            // Main Re-renderer
            const refresh = () => {
                // Capture current state
                const activeTab = html.find('.sheet-tabs .item.active').data('tab') || 'visual';
                const newContent = getDialogContent();
                
                // Target the specific wrapper to avoid any ambiguity
                const wrapper = html.find(`#${editorWrapperId}`);
                if (wrapper.length) {
                    wrapper.html(newContent);
                } else {
                    // Fallback should rarely happen if ID is correct
                    html.html(newContent);
                }

                // Initialize Tabs Manually
                // 1. Set Active Classes
                html.find('.sheet-tabs .item').removeClass('active');
                html.find(`.sheet-tabs .item[data-tab="${activeTab}"]`).addClass('active');
                
                html.find('.tab').removeClass('active').hide();
                html.find(`.tab[data-tab="${activeTab}"]`).addClass('active').show();

                bindListeners();
            };

            const bindListeners = () => {
                // Manual Tab Switching
                html.find('.sheet-tabs .item').click(ev => {
                    ev.preventDefault();
                    // Scope to this specific dialog to prevent cross-talk
                    const container = $(ev.currentTarget).closest(`#${editorWrapperId}`);
                    const targetTab = ev.currentTarget.dataset.tab;

                    // UI Updates
                    container.find('.sheet-tabs .item').removeClass('active');
                    $(ev.currentTarget).addClass('active');

                    container.find('.tab').removeClass('active').hide();
                    container.find(`.tab[data-tab="${targetTab}"]`).addClass('active').show();
                });

                // Name
                html.find("#flower-name").on("change", e => draftEntry.name = e.target.value);

                // Visual: Add Hex
                html.find("#btn-add-hex").click(() => {
                    const newCoord = findNewHexCoord();
                    if (newCoord) {
                        draftEntry.data.cells.push({ coord: newCoord, title: "New Hex" });
                        selectedHexIndex = draftEntry.data.cells.length - 1;
                        refresh();
                    } else {
                        ui.notifications.warn("Could not find a free spot nearby.");
                    }
                });

                // Visual: Hex Selection
                html.find(".manager-hex").click(e => {
                    const q = parseInt(e.currentTarget.dataset.q);
                    const r = parseInt(e.currentTarget.dataset.r);
                    selectedHexIndex = draftEntry.data.cells.findIndex(c => c.coord.q === q && c.coord.r === r);
                    refresh();
                });

                // Visual: Props
                if (selectedHexIndex >= 0) {
                    const updateProp = (field, val) => {
                        draftEntry.data.cells[selectedHexIndex][field] = val;
                        // Don't full refresh on text input lost focus, maybe just visual?
                        // For simplicity, we refresh on change.
                        // Ideally we update draft and only refresh SVG if needed.
                        refresh(); 
                    };
                    html.find("#prop-title").change(e => updateProp('title', e.target.value));
                    html.find("#prop-desc").change(e => { draftEntry.data.cells[selectedHexIndex].description = e.target.value; }); // No refresh needed visually
                    html.find("#prop-type").change(e => updateProp('bioma', e.target.value));
                    html.find("#prop-name").change(e => updateProp('name', e.target.value));
                    html.find("#prop-color").change(e => updateProp('color', e.target.value));
                    html.find("#prop-emoji").change(e => updateProp('emoji', e.target.value)); // Refresh for label
                    
                    html.find("#btn-del-hex").click(() => {
                        draftEntry.data.cells.splice(selectedHexIndex, 1);
                        selectedHexIndex = -1;
                        refresh();
                    });
                }

                // Rules Tab
                html.find("#edge-behavior").change(e => draftEntry.edgeBehavior = e.target.value);
                html.find("#party-actor").change(e => draftEntry.partyActorId = e.target.value);
                html.find(".rule-min").change(e => { draftEntry.navigationRules[e.target.dataset.idx].min = parseInt(e.target.value); });
                html.find(".rule-max").change(e => { draftEntry.navigationRules[e.target.dataset.idx].max = parseInt(e.target.value); });
                html.find(".rule-dir").change(e => { draftEntry.navigationRules[e.target.dataset.idx].dir = e.target.value; });
                html.find(".rule-del").click(e => {
                    draftEntry.navigationRules.splice(e.currentTarget.dataset.idx, 1);
                    refresh();
                });
                html.find("#add-rule").click(() => {
                    draftEntry.navigationRules.push({ min:0, max:0, dir:"SAME" });
                    refresh();
                });

                // JSON Tab
                html.find("#btn-copy-json").click(() => {
                    const val = html.find("#full-json").val();
                    // Copy to clipboard
                    // Navigator clipboard api requires https or localhost usually
                    navigator.clipboard.writeText(val).then(() => ui.notifications.info("Copied to clipboard"));
                });
                html.find("#btn-import-json").click(() => {
                    try {
                        const raw = html.find("#full-json").val();
                        const parsed = JSON.parse(raw);
                        // Handle structure variations
                        if (parsed.cells || parsed.data?.cells) {
                             if (parsed.data && parsed.data.cells) draftEntry.data = parsed.data;
                             else if (parsed.cells) draftEntry.data.cells = parsed.cells;
                             
                             if (parsed.navigationRules) draftEntry.navigationRules = parsed.navigationRules;
                             if (parsed.navigationRules) draftEntry.navigationRules = parsed.navigationRules;
                             if (parsed.edgeBehavior) draftEntry.edgeBehavior = parsed.edgeBehavior;
                             if (parsed.partyActorId) draftEntry.partyActorId = parsed.partyActorId;
                             if (parsed.name) draftEntry.name = parsed.name;
                             
                             selectedHexIndex = -1;
                             ui.notifications.info("Imported JSON data!");
                             refresh();
                        } else {
                            ui.notifications.warn("JSON must contain 'cells' or 'data.cells'");
                        }
                    } catch(e) {
                        ui.notifications.error("JSON Parse Error");
                    }
                });
            };

            refresh();
        }
    }, { width: 950, height: 750, resizable: true });
    
    d.render(true);
}
