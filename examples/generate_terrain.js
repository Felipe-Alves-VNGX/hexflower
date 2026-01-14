const fs = require('fs');
const path = require('path');

// Configuration
const FLOWER_NAME = "Procedural Terrain V2";
const VERSION = "1.2.0";
const RADIUS = 4; // Diameter 9

// Dimension Scales (1-7)
const SCALES = {
    TEMP: ["Freezing", "Cold", "Chilly", "Temperate", "Warm", "Hot", "Scorching"], // q
    ARIDITY: ["Saturated", "Wet", "Humid", "Balanced", "Dry", "Arid", "Parched"], // r
    ALT: ["Abyssal", "Deep", "Shallow", "Coastal", "Lowland", "Highland", "Mountainous"] // s
};

// Utilities
function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Clamp value to 1-7 range based on coordinate input
// Input coords range roughly from -4 to +4. 
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

    let titleList = [];
    let descList = [];
    let color = "#cccccc";
    let emoji = "❓";
    let type = "Land"; 
    
    // Mechanics Defaults
    let movementCost = 1;
    let supplies = "Normal";
    let encounterTags = ["generic"];

    // --- LOGIC ---

    // Ocean/Water (Low Altitude 1-3)
    if (altLvl <= 3) {
        type = "Oceanic";
        movementCost = 1; // Ship movement
        supplies = "Abundant (Fish)";
        
        if (altLvl === 1) { // Abyssal
            titleList = ["Abyssal Trench", "Dark Depths", "Midnight Zone", "Crushing Deep"];
            descList = ["Dark, crushing depths with no light.", "The pressure here is immense.", "Bioluminescent creatures are the only light."];
            color = "#000033";
            emoji = "🦑";
            encounterTags = ["sea_monster", "undead_aquatic"];
        } else if (altLvl === 2) { // Deep
            titleList = ["Open Ocean", "High Seas", "Deep Blue", "Endless Waves"];
            descList = ["Vast expanse of deep blue water.", "Land is nowhere in sight.", "Rolling waves rock the vessel."];
            color = "#00008B";
            emoji = "🌊";
            encounterTags = ["sharks", "storms", "pirates"];
            
            if (tempLvl <= 2) { 
                titleList = ["Frigid Waters", "Iceberg Alley", "Frosted Sea"];
                descList = ["Icebergs float in freezing waters.", "The water threatens to freeze."];
                emoji = "🧊"; color="#ADD8E6"; 
                movementCost = 1.5; // Ice
            }
        } else { // Shallow (3)
            titleList = ["Shallow Seas", "Coral Reefs", "Sunlit Shoals", "Coastal Waters"];
            descList = ["Clear waters teeming with life.", "You can see the sandy bottom.", "Colorful fish dart among rocks."];
            color = "#00CED1";
            emoji = "🐠";
            encounterTags = ["merfolk", "aquatic_beasts"];
            if (tempLvl >= 6) { 
                titleList = ["Tropical Lagoon", "Crystal Bay", "Warm Shallows"]; 
                emoji = "🏝️"; 
            }
        }
    } 
    // Coastal / Transitional (Altitude 4)
    else if (altLvl === 4) {
        type = "Transitional";
        titleList = ["Coastal Plains", "Shoreline", "Estuary"];
        descList = ["Where land meets sea.", "Salty air and sandy ground.", "Gulls cry overhead."];
        color = "#9ACD32";
        emoji = "🏖️";
        encounterTags = ["bandits", "crabs", "merchants"];
        
        if (aridLvl >= 6) { 
            titleList = ["Sandy Beach", "Dunes", "Rocky Coast"]; 
            color = "#F4A460"; 
        }
        if (aridLvl <= 2) { 
            titleList = ["Mangrove Swamp", "Tidal Marsh", "Boggy Coast"]; 
            descList = ["Thick, wet vegetation along the water.", "Difficult to traverse mud."]; 
            color="#2F4F4F"; 
            emoji="🐊"; 
            movementCost = 2; // Difficult
        }
        if (tempLvl <= 2) { 
            titleList = ["Rocky Fjords", "Icy Cliffs", "Glacial Coast"]; 
            descList = ["Cold, jagged cliffs dropping into the sea.", "Snow covers the black rocks."]; 
            color="#708090"; 
            emoji="🧗"; 
            movementCost = 1.5;
        }
    }
    // Land (Altitude 5-7)
    else {
        type = "Terrestrial";
        
        // High Mountains (7)
        if (altLvl === 7) {
            titleList = ["High Peaks", "Jagged Summits", "Cloud Piercers"];
            descList = ["Oxygen is thin, terrain is rugged.", "The world looks small from here.", "Treacherous paths among the clouds."];
            color = "#A9A9A9";
            emoji = "🏔️";
            movementCost = 3; // Very Difficult
            encounterTags = ["dragons", "giants", "eagles"];
            
            if (tempLvl <= 3) { 
                titleList = ["Snow-Capped Mountains", "Glacial Peaks", "Eternal Snows"]; 
                color="white"; 
            }
            if (tempLvl >= 6) { 
                titleList = ["Volcanic Peaks", "Smoking Caldera", "Fire Mountain"]; 
                descList = ["Active geothermal activity.", "Ash rains from the sky."]; 
                color="#8B0000"; 
                emoji="🌋"; 
                encounterTags = ["fire_elementals", "dragons"];
            }
        }
        // Highlands (6)
        else if (altLvl === 6) {
           titleList = ["Highlands", "Rolling Hills", "Plateau", "Upper Reaches"];
           descList = ["Rolling hills and higher elevation plateaus.", "Windy and exposed terrain.", "Grasslands broken by rocky outcrops."];
           color = "#8FBC8F";
           emoji = "⛰️";
           movementCost = 1.5;
           encounterTags = ["hill_giants", "wolves", "goats"];
        }
        // Lowlands (5) - Most variety
        else {
             titleList = ["Plains", "Grasslands", "Fields", "Meadows"];
             descList = ["Flat or gently rolling land.", "Tall grasses sway in the wind.", "Open terrain with good visibility."];
             color = "#90EE90";
             emoji = "🌱";
             encounterTags = ["herds", "bandits", "predators"];
        }

        // Apply Temperature & Aridity Modifiers to Land (Level 5-7 primarily)
        if (altLvl >= 5) {
            // DESERTS (Dry + Hot)
            if (aridLvl >= 6 && tempLvl >= 5) {
                titleList = ["Sand Desert", "Arid Wastes", "Sun-baked Scrubland"];
                descList = ["Arid wasteland with little vegetation.", "Heat shimmers in the distance.", "Water is scarce here."];
                color = "#EDC9AF";
                emoji = "🏜️";
                supplies = "Scarce";
                encounterTags = ["scorpions", "nomads", "undead"];
                if (tempLvl === 7) { 
                    titleList = ["Scorching Dunes", "Glasslands", "Infernal Wastes"]; 
                    color="#FF4500"; 
                }
            }
            // TUNDRA/ICE (Cold)
            else if (tempLvl <= 2) {
                titleList = ["Tundra", "Permafrost", "Frozen Steppe"];
                descList = ["Frozen ground, minimal tree cover.", "The ground is hard as iron.", "Bitter winds bite exposed skin."];
                color = "#E0FFFF";
                emoji = "❄️";
                supplies = "Scarce";
                encounterTags = ["wolves", "yetis", "winter_spirits"];
                
                if (aridLvl <= 2) { 
                    titleList = ["Snowy Forest", "Taiga", "Boreal Forest"]; 
                    descList = ["Conifers covered in thick snow.", "Silence reigns in the white woods."]; 
                    emoji="🌲"; 
                    movementCost = 1.2;
                }
            }
            // RAINFOREST (Wet + Hot)
            else if (aridLvl <= 2 && tempLvl >= 5) {
                titleList = ["Tropical Rainforest", "Jungle", "Green Hell"];
                descList = ["Dense, lush canopy and high humidity.", "The air is thick with insects.", "Massive trees block the sunlight."];
                color = "#006400";
                emoji = "🐆";
                movementCost = 2;
                encounterTags = ["dinosaurs", "plants", "insects"];
            }
            // SWAMP (Wet + Temperate)
            else if (aridLvl <= 2 && tempLvl >= 3 && tempLvl <= 4) {
                 titleList = ["Wetlands", "Swamp", "Bog", "Marsh"];
                 descList = ["Boggy ground, difficult terrain.", "Stagnant water hides dangers.", "Mist clings to the surface."];
                 color = "#556B2F";
                 emoji = "🐸";
                 movementCost = 2.5;
                 encounterTags = ["oozes", "lizardfolk", "hags"];
            }
             // FOREST (Temperate + Balanced/Humid)
            else if (aridLvl <= 3 && tempLvl >= 3 && tempLvl <= 5) {
                titleList = ["Deciduous Forest", "Woodlands", "Old Growth Forest", "Sylvan Woods"];
                descList = ["Trees stretch in every direction.", "Sunlight dapples the forest floor.", "A well-worn path winds through the trees."];
                color = "#228B22";
                emoji = "🌳";
                movementCost = 1.2;
                supplies = "Abundant";
                encounterTags = ["elves", "bears", "fey"];
            }
        }
    }

    // Pick Randoms
    const title = randPick(titleList.length ? titleList : [`Generic ${type}`]);
    let desc = descList.length ? randPick(descList) : "";

    // Fallback Description generator if generic
    if (desc === "") {
        desc = `${temp} temperature, ${aridity} conditions at ${alt} altitude.`;
    }

    return { 
        title, 
        description: desc, 
        emoji, 
        color, 
        type,
        mechanics: {
            movementCost,
            supplies,
            encounterTags
        }
    };
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
            mechanics: biome.mechanics,
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
console.log(`Generated Terrain Hex Flower V2 with ${cells.length} hexes at ${outputPath}`);
