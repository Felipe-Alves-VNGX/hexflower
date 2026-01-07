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

function showEditDialog(id, registry) {
    const isNew = !id;
    const entry = isNew ? { name: "", data: { cells: [] } } : registry[id];
    // Pretty print json
    const jsonString = JSON.stringify(entry.data, null, 2);

    const content = `
    <div class="hex-edit-layout">
        <!-- Left: Input -->
        <div class="hex-edit-left">
            <div style="margin-bottom: 10px;">
                <label class="hex-label">Flower Name</label>
                <input type="text" class="hex-input" name="name" value="${entry.name}" placeholder="e.g. My Weather Engine"/>
            </div>
            <div style="flex:1; display:flex; flex-direction:column;">
                <label class="hex-label">JSON Data</label>
                <textarea class="hex-input" id="hex-json-input" name="json">${jsonString}</textarea>
                <p style="font-size:10px; color:#777; margin: 3px 0 0 0;">Paste complete JSON (must have "cells" array).</p>
            </div>
        </div>

        <!-- Right: Preview -->
        <div class="hex-edit-right">
            <div class="hex-preview-header">
                Real-Time Preview
            </div>
            <div class="hex-preview-content" id="hex-preview-container">
                <!-- SVG injected here -->
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

                    try {
                        const parsedData = JSON.parse(jsonRaw);
                        if (!parsedData.cells || !Array.isArray(parsedData.cells)) {
                            return ui.notifications.error("Invalid JSON: Root must contain a 'cells' array.");
                        }

                        // Save
                        const newId = id || generateId();
                        registry[newId] = {
                            name: name || "Unnamed Flower",
                            data: parsedData
                        };

                        await saveRegistry(registry);
                        ui.notifications.info(`Saved "${registry[newId].name}".`);

                        // Re-open manager
                        Object.values(ui.windows).forEach(w => w.close());
                        openManager(); // Go back to list

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

            // Init
            updatePreview();

            // Listener
            $textarea.on("input", updatePreview);
        }
    }, { width: 900, height: 740, resizable: true });

    d.render(true);
}
