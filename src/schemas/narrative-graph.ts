import { z } from "zod";
import { locales } from "@/i18n/config";
import { categories, consequenceTimeframes } from "@/types/generator";
import { narrativeStatuses, type NarrativeGraph } from "@/types/narrative-graph";

export const NARRATIVE_GRAPH_VERSION = 1 as const;

const nodeIdSchema = z.string().trim().min(1).max(160);
const edgeIdSchema = z.string().trim().min(1).max(200);
const timestampSchema = z.string().trim().min(1).max(40);

export const decisionNodeSchema = z.object({
  id: nodeIdSchema,
  kind: z.literal("decision"),
  label: z.string().trim().min(1).max(1000),
  summary: z.string().trim().min(1).max(800).optional(),
});

export const consequenceNodeSchema = z.object({
  id: nodeIdSchema,
  kind: z.literal("consequence"),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1200),
  timeframe: z.enum(consequenceTimeframes),
  category: z.enum(categories),
  trigger: z.string().trim().min(1).max(400),
  affectedParties: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  status: z.enum(narrativeStatuses),
});

export const followUpNodeSchema = z.object({
  id: nodeIdSchema,
  kind: z.literal("follow_up"),
  title: z.string().trim().min(1).max(120),
  note: z.string().trim().min(1).max(1200),
  status: z.enum(narrativeStatuses),
  timeframe: z.enum(consequenceTimeframes).optional(),
});

export const narrativeNodeSchema = z.discriminatedUnion("kind", [
  decisionNodeSchema,
  consequenceNodeSchema,
  followUpNodeSchema,
]);

export const narrativeEdgeSchema = z.object({
  id: edgeIdSchema,
  source: nodeIdSchema,
  target: nodeIdSchema,
});

export const narrativeGraphSchema = z
  .object({
    id: nodeIdSchema,
    version: z.literal(NARRATIVE_GRAPH_VERSION),
    locale: z.enum(locales),
    title: z.string().trim().min(1).max(160),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    rootNodeId: nodeIdSchema,
    nodes: z.array(narrativeNodeSchema).min(1),
    edges: z.array(narrativeEdgeSchema),
  })
  .superRefine((graph, ctx) => {
    const nodeIds = graph.nodes.map((node) => node.id);
    const uniqueNodeIds = new Set(nodeIds);

    if (uniqueNodeIds.size !== nodeIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate node ids",
        path: ["nodes"],
      });
    }

    const edgeIds = graph.edges.map((edge) => edge.id);
    if (new Set(edgeIds).size !== edgeIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate edge ids",
        path: ["edges"],
      });
    }

    if (!uniqueNodeIds.has(graph.rootNodeId)) {
      ctx.addIssue({
        code: "custom",
        message: "rootNodeId must exist among nodes",
        path: ["rootNodeId"],
      });
    }

    const root = graph.nodes.find((node) => node.id === graph.rootNodeId);
    if (root && root.kind !== "decision") {
      ctx.addIssue({
        code: "custom",
        message: "rootNodeId must point to a decision node",
        path: ["rootNodeId"],
      });
    }

    graph.edges.forEach((edge, index) => {
      if (edge.source === edge.target) {
        ctx.addIssue({
          code: "custom",
          message: "Self-referential edges are not allowed",
          path: ["edges", index],
        });
      }
      if (!uniqueNodeIds.has(edge.source)) {
        ctx.addIssue({
          code: "custom",
          message: "Edge source must exist among nodes",
          path: ["edges", index, "source"],
        });
      }
      if (!uniqueNodeIds.has(edge.target)) {
        ctx.addIssue({
          code: "custom",
          message: "Edge target must exist among nodes",
          path: ["edges", index, "target"],
        });
      }
    });
  });

export type NarrativeGraphParsed = z.infer<typeof narrativeGraphSchema>;

export function parseNarrativeGraph(value: unknown): NarrativeGraph {
  return narrativeGraphSchema.parse(value);
}

export function safeParseNarrativeGraph(value: unknown) {
  return narrativeGraphSchema.safeParse(value);
}
