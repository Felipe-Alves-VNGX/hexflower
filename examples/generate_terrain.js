const fs = require('fs');
const path = require('path');

// Configuration
const FLOWER_NAME = "Procedural Terrain";
const VERSION = "1.0.0";
const RADIUS = 4; // Diameter 9

// Dimension Scales (1-7)
const SCALES = {
    TEMP: ["Freezing", "Cold", "Chilly", "Temperate", "Warm", "Hot", "Scorching"], // q
    ARIDITY: ["Saturated", "Wet", "Humid", "Balanced", "Dry", "Arid", "Parched"], // r
    ALT: ["Abyssal", "Deep", "Shallow", "Coastal", "Lowland", "Highland", "Mountainous"] // s
};

// Helper: Clamp value to 1-7 range based on coordinate input
// Input coords range roughly from -4 to +4. 
// We want roughly: -4,-3 -> 1; -2 -> 2; -1 -> 3; 0 -> 4; 1 -> 5; 2 -> 6; 3,4 -> 7
function mapCoordToLevel(val) {
    if (val <= -3) return 1;
    if (val === -2) return 2;
    if (val === -1) return 3;
    if (val === 0) return 4;
    if (val === 1) return 5;
    if (val === 2) return 6;
    if (val >= 3) return 7;
    return 4; // Fallback
}

// Helper: Determine Biome based on dimensions
function getBiomeData(tempLvl, aridLvl, altLvl) {
    // Levels are 1-7
    const temp = SCALES.TEMP[tempLvl - 1];
    const aridity = SCALES.ARIDITY[aridLvl - 1];
    const alt = SCALES.ALT[altLvl - 1];

    let title = "";
    let desc = "";
    let color = "#cccccc";
    let emoji = "❓";
    let type = "Land"; // Land, Ocean, Transitional

    // Ocean/Water (Low Altitude 1-3)
    if (altLvl <= 3) {
        type = "Oceanic";
        if (altLvl === 1) { // Abyssal
            title = "Abyssal Trench";
            desc = "Dark, crushing depths with no light.";
            color = "#000033";
            emoji = "🦑";
        } else if (altLvl === 2) { // Deep
            title = "Open Ocean";
            desc = "Vast expanse of deep blue water.";
            color = "#00008B";
            emoji = "🌊";
            if (tempLvl <= 2) { title = "Icy Ocean"; desc = "Icebergs float in freezing waters."; emoji = "🧊"; color="#ADD8E6"; }
        } else { // Shallow (3)
            title = "Shallow Seas / Reefs";
            desc = "Clear waters teeming with life.";
            color = "#00CED1";
            emoji = "🐠";
            if (tempLvl >= 6) { title = "Tropical Lagoon"; emoji = "🏝️"; }
        }
    } 
    // Coastal / Transitional (Altitude 4)
    else if (altLvl === 4) {
        type = "Transitional";
        title = "Coastal Plains";
        desc = "Where land meets sea.";
        color = "#9ACD32";
        emoji = "🏖️";
        
        if (aridLvl >= 6) { title = "Sandy Beach"; color = "#F4A460"; }
        if (aridLvl <= 2) { title = "Mangrove Swamp"; desc = "Thick, wet vegetation along the water."; color="#2F4F4F"; emoji="🐊"; }
        if (tempLvl <= 2) { title = "Rocky Fjords"; desc = "Cold, jagged cliffs."; color="#708090"; emoji="🧗"; }
    }
    // Land (Altitude 5-7)
    else {
        type = "Terrestrial";
        
        // High Mountains (7)
        if (altLvl === 7) {
            title = "High Peaks";
            desc = "Oxygen is thin, terrain is rugged.";
            color = "#A9A9A9";
            emoji = "🏔️";
            if (tempLvl <= 3) { title = "Snow-Capped Mountains"; color="white"; }
            if (tempLvl >= 6) { title = "Volcanic Peaks"; desc = "Active geothermal activity."; color="#8B0000"; emoji="🌋"; }
        }
        // Highlands (6)
        else if (altLvl === 6) {
           title = "Highlands";
           desc = "Rolling hills and higher elevation plateaus.";
           color = "#8FBC8F";
           emoji = "⛰️";
        }
        // Lowlands (5) - Most variety
        else {
             title = "Plains";
             desc = "Flat or gently rolling land.";
             color = "#90EE90";
             emoji = "🌱";
        }

        // Apply Temperature & Aridity Modifiers to Land (Level 5-7 primarily, but refined below)
        if (altLvl >= 5) {
            // DESERTS (Dry + Hot)
            if (aridLvl >= 6 && tempLvl >= 5) {
                title = "Desert";
                desc = "Arid wasteland with little vegetation.";
                color = "#EDC9AF";
                emoji = "🏜️";
                if (tempLvl === 7) { title = "Scorching Dunes"; color="#FF4500"; }
            }
            // TUNDRA/ICE (Cold)
            else if (tempLvl <= 2) {
                title = "Tundra";
                desc = "Frozen ground, minimal tree cover.";
                color = "#E0FFFF";
                emoji = "❄️";
                if (aridLvl <= 2) { title = "Snowy Forest"; desc= "Conifers covered in snow."; emoji="🌲"; }
            }
            // RAINFOREST (Wet + Hot)
            else if (aridLvl <= 2 && tempLvl >= 5) {
                title = "Tropical Rainforest";
                desc = "Dense, lush canopy and high humidity.";
                color = "#006400";
                emoji = "🐆";
            }
            // SWAMP (Wet + Temperate)
            else if (aridLvl <= 2 && tempLvl >= 3 && tempLvl <= 4) {
                 title = "Wetlands";
                 desc = "Boggy ground, difficult terrain.";
                 color = "#556B2F";
                 emoji = "🐸";
            }
        }
    }

    // Fallback Description generator if generic
    if (desc === "") {
        desc = `${temp} temperature, ${aridity} conditions at ${alt} altitude.`;
    }

    return { title, description: desc, emoji, color, type };
}

// Generate Cells
const cells = [];
for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = -RADIUS; r <= RADIUS; r++) {
        const s = -q - r;
        if (Math.abs(s) > RADIUS) continue; // Hex bounds

        // Cube Coords q,r,s map to Dimensions
        const tempLvl = mapCoordToLevel(q);
        const aridLvl = mapCoordToLevel(r);
        const altLvl = mapCoordToLevel(s);

        const biome = getBiomeData(tempLvl, aridLvl, altLvl);

        cells.push({
            coord: { q, r, s },
            title: biome.title,
            description: biome.description,
            emoji: biome.emoji,
            color: biome.color,
            bioma: `${biome.type} (${SCALES.TEMP[tempLvl-1]}, ${SCALES.ARIDITY[aridLvl-1]}, ${SCALES.ALT[altLvl-1]})`,
            debug: { temp: tempLvl, arid: aridLvl, alt: altLvl }
        });
    }
}

const output = {
    name: FLOWER_NAME,
    version: VERSION,
    edgeBehavior: "wrap", // Default generic behavior
    activeHex: { q: 0, r: 0, s: 0 },
    navigationRules: [
        { min: 2, max: 2, dir: "N" },
        { min: 3, max: 4, dir: "NE" },
        { min: 5, max: 6, dir: "SE" },
        { min: 7, "max": 7, "dir": "SAME" },
        { min: 8, max: 9, dir: "S" },
        { min: 10, max: 11, dir: "SW" },
        { min: 12, max: 12, dir: "NW" }
    ],
    cells: cells
};

// Write to file
const outputPath = path.join(__dirname, 'terrain.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Generated Terrain Hex Flower with ${cells.length} hexes at ${outputPath}`);
