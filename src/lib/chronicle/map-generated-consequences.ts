import { z } from "zod";
import { safeParseChronicleGraph } from "@/schemas/chronicle";
import { categories, consequenceTimeframes } from "@/types/generator";
import type {
  ChronicleMapResult,
  ChronicleNarrativeContext,
  ChronicleNode,
} from "@/types/chronicle";

const looseConsequenceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  timeframe: z.enum(consequenceTimeframes).optional(),
  category: z.enum(categories).optional(),
  trigger: z.string().optional(),
  affectedParties: z.array(z.unknown()).optional(),
});

const looseResultSchema = z.object({
  summary: z.unknown().optional(),
  consequences: z.unknown().optional(),
  decision: z.unknown().optional(),
  eventDescription: z.unknown().optional(),
  title: z.unknown().optional(),
});

export type GeneratedChronicleContext = {
  decision?: string;
  title?: string;
  graphId?: string;
  tone?: ChronicleNarrativeContext["tone"];
  intensity?: ChronicleNarrativeContext["intensity"];
  setting?: ChronicleNarrativeContext["setting"];
  locale?: ChronicleNarrativeContext["locale"];
};

function djb2(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) + hash + input.charCodeAt(index);
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function affectedPartiesFrom(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const parties = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  return parties.length > 0 ? parties : undefined;
}

export function mapGeneratedConsequencesToChronicleGraph(
  result: unknown,
  context: GeneratedChronicleContext = {},
): ChronicleMapResult {
  if (result !== undefined && result !== null && typeof result !== "object") {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  const parsed = looseResultSchema.safeParse(result ?? {});
  if (!parsed.success) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  const source = parsed.data;
  const decision =
    asText(context.decision) ||
    asText(source.decision) ||
    asText(source.eventDescription);
  const summary = asText(source.summary);
  const title =
    asText(context.title) || asText(source.title) || summary || decision;

  const rawConsequences = Array.isArray(source.consequences)
    ? source.consequences
    : [];
  const consequences = rawConsequences.flatMap((item, index) => {
    const parsedItem = looseConsequenceSchema.safeParse(item);
    if (!parsedItem.success) {
      return [];
    }
    const titleText = asText(parsedItem.data.title);
    const descriptionText = asText(parsedItem.data.description);
    if (!titleText && !descriptionText) {
      return [];
    }
    return [
      {
        index,
        title: titleText || clip(descriptionText, 120),
        description: descriptionText || titleText,
        timeframe: parsedItem.data.timeframe,
        category: parsedItem.data.category,
        trigger: asText(parsedItem.data.trigger) || undefined,
        affectedParties: affectedPartiesFrom(parsedItem.data.affectedParties),
      },
    ];
  });

  if (!decision && consequences.length === 0) {
    return { ok: false, code: "CHRONICLE_EMPTY" };
  }

  if (consequences.length === 0) {
    return { ok: false, code: "CHRONICLE_EMPTY" };
  }

  const seed = `${decision}|${summary}|${consequences
    .map((item) => item.title)
    .join("|")}`;
  const graphId = (asText(context.graphId) || `chr-${djb2(seed)}`).slice(0, 80);
  const originId = `${graphId}:origin`;
  const originTitle = clip(
    decision || summary || title || consequences[0]?.title || "",
    1000,
  );
  const originDescription =
    summary || (!decision ? consequences[0]?.description || "" : "");

  if (!originTitle) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  const origin: ChronicleNode = {
    id: originId,
    type: "origin",
    title: originTitle,
    description: originDescription,
    parentId: null,
    depth: 0,
  };

  const nodes: ChronicleNode[] = [
    origin,
    ...consequences.map((item) => ({
      id: `${graphId}:c:${item.index}`,
      type: "consequence" as const,
      title: clip(item.title, 200),
      description: item.description,
      parentId: originId,
      depth: 1,
      timeframe: item.timeframe,
      category: item.category,
      trigger: item.trigger,
      affectedParties: item.affectedParties,
      status: "pending" as const,
    })),
  ];

  const narrativeContext = {
    tone: context.tone,
    intensity: context.intensity,
    setting: context.setting,
    locale: context.locale,
  };
  const hasContext = Object.values(narrativeContext).some(Boolean);

  const graph = {
    version: 1 as const,
    id: graphId,
    title: clip(title || originTitle, 160),
    nodes,
    context: hasContext ? narrativeContext : undefined,
  };

  const validated = safeParseChronicleGraph(graph);
  if (!validated.success) {
    return { ok: false, code: "CHRONICLE_INVALID" };
  }

  return { ok: true, graph: validated.data };
}
