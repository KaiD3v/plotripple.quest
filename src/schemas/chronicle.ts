import { z } from "zod";
import { locales } from "@/i18n/config";
import { categories, consequenceTimeframes, intensities, settings, tones } from "@/types/generator";
import {
  chronicleNodeStatuses,
  chronicleNodeTypes,
  type ChronicleGraph,
} from "@/types/chronicle";
import { normalizeChronicleNodeStatus } from "@/lib/chronicle/node-status";

export const CHRONICLE_GRAPH_VERSION = 1 as const;

const nodeIdSchema = z.string().trim().min(1).max(160);

const chronicleNodeStatusSchema = z.preprocess(
  (value) => normalizeChronicleNodeStatus(value),
  z.enum(chronicleNodeStatuses).optional(),
);

export const chronicleNodeSchema = z.object({
  id: nodeIdSchema,
  type: z.enum(chronicleNodeTypes),
  title: z.string().trim().min(1).max(1000),
  description: z.string().trim().max(4000),
  parentId: nodeIdSchema.nullable(),
  depth: z.number().int().min(0).max(50),
  timeframe: z.enum(consequenceTimeframes).optional(),
  category: z.enum(categories).optional(),
  trigger: z.string().trim().min(1).max(400).optional(),
  affectedParties: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  status: chronicleNodeStatusSchema,
});

export const chronicleNarrativeContextSchema = z.object({
  tone: z.enum(tones).optional(),
  intensity: z.enum(intensities).optional(),
  setting: z.enum(settings).optional(),
  locale: z.enum(locales).optional(),
});

export const chronicleGraphSchema = z
  .object({
    version: z.literal(CHRONICLE_GRAPH_VERSION),
    id: z.string().trim().min(1).max(80).optional(),
    title: z.string().trim().min(1).max(160),
    nodes: z.array(chronicleNodeSchema).min(1),
    context: chronicleNarrativeContextSchema.optional(),
  })
  .superRefine((graph, ctx) => {
    const ids = graph.nodes.map((node) => node.id);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate node ids",
        path: ["nodes"],
      });
    }

    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const roots = graph.nodes.filter((node) => node.parentId === null);

    if (roots.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Chronicle must have a root node",
        path: ["nodes"],
      });
    }

    graph.nodes.forEach((node, index) => {
      if (node.parentId === node.id) {
        ctx.addIssue({
          code: "custom",
          message: "Self-referential parentId is not allowed",
          path: ["nodes", index, "parentId"],
        });
      }
      if (node.parentId === null) {
        if (node.depth !== 0) {
          ctx.addIssue({
            code: "custom",
            message: "Root nodes must have depth 0",
            path: ["nodes", index, "depth"],
          });
        }
        return;
      }
      const parent = byId.get(node.parentId);
      if (!parent) {
        ctx.addIssue({
          code: "custom",
          message: "parentId must exist among nodes",
          path: ["nodes", index, "parentId"],
        });
        return;
      }
      if (node.depth !== parent.depth + 1) {
        ctx.addIssue({
          code: "custom",
          message: "depth must be parent depth + 1",
          path: ["nodes", index, "depth"],
        });
      }
    });
  });

export function parseChronicleGraph(value: unknown): ChronicleGraph {
  return chronicleGraphSchema.parse(value);
}

export function safeParseChronicleGraph(value: unknown) {
  return chronicleGraphSchema.safeParse(value);
}
