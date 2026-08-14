import { appendFollowUpsToChronicleGraph } from "@/lib/chronicle/append-follow-ups";
import { canExpandChronicleNode } from "@/lib/chronicle/can-expand";
import { buildExpandRippleRequest } from "@/lib/chronicle/expand-context";
import {
  saveStoredChronicle,
  type SaveStoredChronicleResult,
} from "@/lib/chronicle/library-repository";
import { persistChronicle } from "@/lib/chronicle/session-repository";
import { followUpGenerationResultSchema } from "@/schemas/follow-up";
import type { Locale } from "@/i18n/config";
import type { ApiErrorBody } from "@/types/generator";
import type { ChronicleGraph, ChronicleMapResult } from "@/types/chronicle";

export type ExploreRippleFailure =
  | ChronicleMapResult
  | { ok: false; code: "AI_UNAVAILABLE" | "INVALID_AI_RESPONSE" | "RATE_LIMITED" | "network" | "VALIDATION_ERROR" | "INTERNAL_ERROR" };

export type ExploreRippleResult =
  | { ok: true; graph: ChronicleGraph }
  | ExploreRippleFailure;

export async function exploreRippleOnChronicle(options: {
  graph: ChronicleGraph;
  parentNodeId: string;
  locale: Locale;
  fetchImpl?: typeof fetch;
  persist?: typeof persistChronicle;
  saveLibrary?: (graph: ChronicleGraph) => SaveStoredChronicleResult;
}): Promise<ExploreRippleResult> {
  const gate = canExpandChronicleNode(options.graph, options.parentNodeId);
  if (!gate.ok) {
    return gate;
  }

  const payload = buildExpandRippleRequest(
    options.graph,
    options.parentNodeId,
    options.locale,
  );
  if (!payload.ok) {
    return payload;
  }

  try {
    const response = await (options.fetchImpl ?? fetch)("/api/expand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload.request),
    });

    const body = (await response.json()) as
      | { followUps?: unknown }
      | ApiErrorBody;

    if (!response.ok || (body && typeof body === "object" && "error" in body)) {
      const code =
        body && typeof body === "object" && "error" in body
          ? body.error.code
          : "INTERNAL_ERROR";
      if (
        code === "AI_UNAVAILABLE" ||
        code === "INVALID_AI_RESPONSE" ||
        code === "RATE_LIMITED" ||
        code === "VALIDATION_ERROR"
      ) {
        return { ok: false, code };
      }
      return { ok: false, code: "INTERNAL_ERROR" };
    }

    const parsed = followUpGenerationResultSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, code: "INVALID_AI_RESPONSE" };
    }

    const appended = appendFollowUpsToChronicleGraph({
      graph: options.graph,
      parentNodeId: options.parentNodeId,
      generatedFollowUps: parsed.data.followUps,
    });
    if (!appended.ok) {
      return appended;
    }

    const persist = options.persist ?? persistChronicle;
    if (!persist(appended.graph)) {
      return { ok: false, code: "CHRONICLE_UNAVAILABLE" };
    }

    const saveLibrary = options.saveLibrary ?? saveStoredChronicle;
    saveLibrary(appended.graph);

    return appended;
  } catch {
    return { ok: false, code: "network" };
  }
}
