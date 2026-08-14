import type { Locale } from "@/i18n/config";
import { mapGeneratedConsequencesToChronicleGraph } from "@/lib/chronicle/map-generated-consequences";
import { chronicleGraphToNarrativeGraph } from "@/lib/chronicle/narrative-bridge";
import type { GenerationResult } from "@/types/generator";
import type { NarrativeGraph } from "@/types/narrative-graph";

export const DEFAULT_GRAPH_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export type GenerationToGraphInput = {
  result: GenerationResult;
  locale: Locale;
  decision: string;
  graphId?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
};

function djb2(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) + hash + input.charCodeAt(index);
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
}

export function stableGraphId(
  locale: Locale,
  decision: string,
  summary: string,
): string {
  return `gen-${djb2(`${locale}|${decision}|${summary}`)}`;
}

export function decisionNodeId(graphId: string): string {
  return `${graphId}:origin`;
}

export function consequenceNodeId(graphId: string, index: number): string {
  return `${graphId}:c:${index}`;
}

export function causeEdgeId(
  graphId: string,
  sourceId: string,
  targetId: string,
): string {
  return `${sourceId}->${targetId}`;
}

export function generationResultToNarrativeGraph(
  input: GenerationToGraphInput,
): NarrativeGraph {
  const mapped = mapGeneratedConsequencesToChronicleGraph(input.result, {
    decision: input.decision,
    title: input.title,
    graphId:
      input.graphId ??
      stableGraphId(input.locale, input.decision, input.result.summary),
  });

  if (!mapped.ok) {
    throw new Error(mapped.code);
  }

  const narrative = chronicleGraphToNarrativeGraph(mapped.graph, input.locale);
  const createdAt = input.createdAt ?? DEFAULT_GRAPH_TIMESTAMP;
  const updatedAt = input.updatedAt ?? createdAt;

  return {
    ...narrative,
    id: input.graphId ?? narrative.id,
    createdAt,
    updatedAt,
  };
}
