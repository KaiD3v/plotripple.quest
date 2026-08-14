import type { Locale } from "@/i18n/config";
import type { ConsequenceTimeframe } from "@/types/generator";

export type ExampleConsequence = {
  timeframe: ConsequenceTimeframe;
  title: string;
};

export type ExampleResultContent = {
  decision: string;
  summary: string;
  consequences: readonly [
    ExampleConsequence,
    ExampleConsequence,
    ExampleConsequence,
  ];
};

export const exampleResults = {
  en: {
    decision:
      "The party freed an ancient creature trapped beneath the temple to keep the city from being destroyed.",
    summary:
      "The city survived, but now it has to live with the entity that made its salvation possible.",
    consequences: [
      { timeframe: "immediate", title: "The temple loses its authority" },
      { timeframe: "next_session", title: "The creature demands the first payment" },
      {
        timeframe: "long_term",
        title: "The city begins to worship its forbidden savior",
      },
    ],
  },
  "pt-br": {
    decision:
      "O grupo libertou uma criatura antiga presa sob o templo para impedir que a cidade fosse destruída.",
    summary:
      "A cidade sobreviveu, mas agora precisa conviver com a entidade que tornou sua salvação possível.",
    consequences: [
      { timeframe: "immediate", title: "O templo perde sua autoridade" },
      { timeframe: "next_session", title: "A criatura exige o primeiro pagamento" },
      {
        timeframe: "long_term",
        title: "A cidade passa a cultuar sua salvadora proibida",
      },
    ],
  },
} as const satisfies Record<Locale, ExampleResultContent>;

export function getExampleResult(locale: Locale): ExampleResultContent {
  return exampleResults[locale];
}
