import type { Locale } from "@/i18n/config";
import {
  DEFAULT_FIXTURE_ID,
  getFixture,
  isFixtureId,
  type FixtureId,
} from "@/lib/canvas/fixtures";
import type { NarrativeGraph } from "@/types/narrative-graph";

export type ResolvedFixture = {
  id: FixtureId;
  graph: NarrativeGraph;
  unknown: boolean;
};

export function parseFixtureParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function resolveFixture(
  locale: Locale,
  raw: string | string[] | undefined,
): ResolvedFixture {
  const requested = parseFixtureParam(raw);
  if (requested && isFixtureId(requested)) {
    return {
      id: requested,
      graph: getFixture(requested, locale),
      unknown: false,
    };
  }

  return {
    id: DEFAULT_FIXTURE_ID,
    graph: getFixture(DEFAULT_FIXTURE_ID, locale),
    unknown: Boolean(requested),
  };
}
