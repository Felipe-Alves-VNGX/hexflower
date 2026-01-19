import z from 'zod';

export const HexCoordSchema = z.object({
    q: z.number(),
    r: z.number(),
    s: z.number()
});

// Schema for wild-card jumps (per-hex navigation overrides)
const WildCardJumpSchema = z.object({
    roll: z.number().int().min(2).max(12), // 2d6 result
    targetCoord: HexCoordSchema
});

export const HexCellSchema = z.object({
    coord: HexCoordSchema,
    bioma: z.string().optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    encounter_type: z.string().optional(),
    color: z.string().optional(),
    emoji: z.string().optional(),
    
    // --- NEW FIELDS FOR MINIGAME SUPPORT ---
    // Terminal event detection (Class II, III, V)
    isTerminal: z.boolean().optional(),
    terminalType: z.string().optional(), // e.g., "win", "loss", "neutral"
    
    // Event hooks (execute macros on enter/exit)
    onEnter: z.string().optional(), // Macro ID
    onExit: z.string().optional(),  // Macro ID
    
    // Wild-card jumps (non-standard navigation from this hex)
    wildCardJump: WildCardJumpSchema.optional(),
    
    // Per-hex edge behavior override
    customEdgeBehavior: z.enum(["stop", "wrap", "reflect", "rotateCW", "rotateCCW"]).optional()
}).catchall(z.any()); // Allow extra properties for flexibility

const RuleSchema = z.object({
    min: z.number(),
    max: z.number(),
    dir: z.string() // "N", "NE", "SE", "S", "SW", "NW", "SAME"
});

// Schema for situational navigation rule sets
const SituationalRuleSetSchema = z.object({
    id: z.string(), // Unique identifier (e.g., "guilty", "innocent")
    name: z.string(), // Human-readable name
    description: z.string().optional(), // Optional description
    rules: z.array(RuleSchema)
});

// Schema for turn counter (Class VI - Limited Walk)
const TurnSchema = z.object({
    current: z.number().int().default(0),
    limit: z.number().int().optional() // If set, game ends after this many turns
});

// Schema for game points system
const GamePointsSchema = z.object({
    name: z.string(), // e.g., "Luck", "Influence", "Resources"
    current: z.number().int(),
    max: z.number().int().optional() // Optional maximum
});

export const HexFlowerSchema = z.object({
    version: z.string().optional(),
    name: z.string().optional(),
    cells: z.array(HexCellSchema),
    navigationRules: z.array(RuleSchema).optional(),
    edgeBehavior: z.enum(["stop", "wrap", "reflect", "rotateCW", "rotateCCW"]).optional(),
    activeHex: HexCoordSchema.optional(),
    partyActorId: z.string().optional(),
    
    // --- NEW FIELDS FOR ADVANCED HFGE SUPPORT ---
    // Hex Flower Class (I-VI) - helps UI provide appropriate tools
    hexClass: z.enum(["I", "II", "III", "IV", "V", "VI"]).optional(),
    
    // Turn counter for Limited Walk (Class VI) and "End the Never-Ending Story"
    turn: TurnSchema.optional(),
    
    // Situational Navigation Hexes (dynamic rule sets)
    situationalRules: z.array(SituationalRuleSetSchema).optional(),
    activeRuleSet: z.string().optional(), // ID of the currently active rule set
    
    // Game Points system (player agency)
    gamePoints: GamePointsSchema.optional(),
    
    // Metadata for Class IV (Competing HFs)
    linkedFlowerId: z.string().optional(), // ID of a competing/paired flower
    
    // Custom tags for organization
    tags: z.array(z.string()).optional()
});
