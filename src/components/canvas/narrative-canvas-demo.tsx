"use client";

import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { FixtureSwitcher } from "@/components/canvas/fixture-switcher";
import { NarrativeCanvas } from "@/components/canvas/narrative-canvas";
import type { FixtureId } from "@/lib/canvas/fixtures";
import type { NarrativeGraph } from "@/types/narrative-graph";

export function NarrativeCanvasDemo({
  graph,
  locale,
  dictionary,
  fixtureId,
  unknownFixture = false,
  initialSelectedId = null,
}: {
  graph: NarrativeGraph;
  locale: Locale;
  dictionary: Dictionary;
  fixtureId: FixtureId;
  unknownFixture?: boolean;
  initialSelectedId?: string | null;
}) {
  return (
    <NarrativeCanvas
      graph={graph}
      dictionary={dictionary}
      chrome={{
        eyebrow: dictionary.canvas.eyebrow,
        title: dictionary.canvas.title,
        helper: dictionary.canvas.helper,
        status: unknownFixture ? dictionary.canvas.unknownFixture : undefined,
      }}
      headerExtra={
        <FixtureSwitcher
          locale={locale}
          dictionary={dictionary}
          current={fixtureId}
        />
      }
      initialSelectedId={initialSelectedId}
    />
  );
}
