import { z } from 'zod';

export const HexCoordSchema = z.object({
    q: z.number(),
    r: z.number(),
    s: z.number()
});

export const HexCellSchema = z.object({
    coord: HexCoordSchema,
    bioma: z.string().optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    encounter_type: z.string().optional(),
    color: z.string().optional(),
    emoji: z.string().optional()
}).catchall(z.any()); // Allow extra properties for flexibility

const RuleSchema = z.object({
    min: z.number(),
    max: z.number(),
    dir: z.string() // "N", "NE", "SE", "S", "SW", "NW", "SAME"
});

export const HexFlowerSchema = z.object({
    version: z.string().optional(),
    name: z.string().optional(),
    cells: z.array(HexCellSchema),
    navigationRules: z.array(RuleSchema).optional(),
    edgeBehavior: z.enum(["stop", "wrap", "reflect", "loop"]).optional()
});
