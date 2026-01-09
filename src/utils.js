export const HEX_size = 35;
const SQRT3 = Math.sqrt(3);

export function cubeToPixel(q, r, size) {
    const x = size * (SQRT3 * q + (SQRT3 / 2) * r);
    const y = size * (3 / 2) * r;
    return { x, y };
}

export function hexCorners(cx, cy, size) {
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

export function generateSVG(cells, options = {}) {
    const { 
        selectedCoord, 
        currentCoord, 
        partyTokenImg, 
        size = HEX_size,
        interactive = true
    } = options;

    if (!cells || !cells.length) {
        return `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#555;">No Hexes</div>`;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    cells.forEach(cell => {
        const { x, y } = cubeToPixel(cell.coord.q, cell.coord.r, size);
        minX = Math.min(minX, x - size);
        maxX = Math.max(maxX, x + size);
        minY = Math.min(minY, y - size);
        maxY = Math.max(maxY, y + size);
    });

    const width = maxX - minX + 20;
    const height = maxY - minY + 20;

    let svg = `<svg width="100%" height="100%" viewBox="${minX - 10} ${minY - 10} ${width} ${height}" 
               preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;

    cells.forEach(cell => {
        const { x, y } = cubeToPixel(cell.coord.q, cell.coord.r, size);
        let name = cell.title || cell.name || "Hex";
        // if (name.length > 10) name = name.substring(0, 8) + "…";
        
        // Selection / Current Logic
        const isSelected = selectedCoord && cell.coord.q === selectedCoord.q && cell.coord.r === selectedCoord.r;
        const isCurrent = currentCoord && cell.coord.q === currentCoord.q && cell.coord.r === currentCoord.r;

        let stroke = "#333";
        let strokeWidth = 1;
        let zIndex = 1;

        if (isSelected) {
            stroke = "#00FFFF";
            strokeWidth = 3;
            zIndex = 10;
        } else if (isCurrent) {
            stroke = "#00FF00"; // Green for current
            strokeWidth = 3;
            zIndex = 10;
        }

        const fill = cell.color || "#cccccc";
        
        let dataAttrs = `data-q="${cell.coord.q}" data-r="${cell.coord.r}"`;
        if (options.dataJson) {
             const json = JSON.stringify(cell).replace(/"/g, '&quot;');
             dataAttrs += ` data-cell="${json}"`;
        }

        svg += `
        <g class="hex-cell" ${dataAttrs} style="cursor: pointer;">
            <polygon points="${hexCorners(x, y, size)}" 
                     fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
            <text x="${x}" y="${y - 5}" text-anchor="middle" dominant-baseline="central" 
                  font-size="${size/2.5}" style="pointer-events:none;">${cell.emoji || ''}</text>
            <text x="${x}" y="${y + size/2}" text-anchor="middle" dominant-baseline="middle" 
                  font-size="${size/4}" fill="#000" style="pointer-events:none; font-weight: bold;">
                  ${name.substring(0, 12)}
            </text>
            ${isCurrent && partyTokenImg ? `<image href="${partyTokenImg}" x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" style="pointer-events:none;" />` : ""}
        </g>`;
    });

    svg += `</svg>`;
    return svg;
}

export function getRegistry() {
    // Legacy support: module uses "world" scope or "hexflower" scope?
    // Original code used "world" scope for user flags. Checking implementation plan.
    // Plan: Maintain "world" scope for compatibility.
    // However, `game.user.getFlag("world", ...)` usage in original code was:
    // `game.user.getFlag("world", "hex_flower_registry")`
    return game.user.getFlag("world", "hex_flower_registry") || {};
}

export async function saveRegistry(registry) {
    await game.user.setFlag("world", "hex_flower_registry", registry);
}

export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
