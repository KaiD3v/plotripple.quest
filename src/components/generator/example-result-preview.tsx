import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/analytics";
import { getExampleResult } from "@/components/generator/example-result";
import { TimeframeMark } from "@/components/generator/timeframe-mark";

export function ExampleResultPreview({
  locale,
  dictionary,
  onUseExample,
}: {
  locale: Locale;
  dictionary: Dictionary;
  onUseExample: (decision: string) => void;
}) {
  const example = getExampleResult(locale);

  return (
    <div className="example-folio" aria-labelledby="example-result-label">
      <p id="example-result-label" className="example-folio-kicker">
        {dictionary.example.label}
      </p>

      <div>
        <p className="example-folio-caption">{dictionary.example.decisionLabel}</p>
        <p className="example-folio-quote mt-1">“{example.decision}”</p>
      </div>

      <div>
        <p className="example-folio-caption">{dictionary.example.summaryLabel}</p>
        <p className="example-folio-summary mt-1">{example.summary}</p>
      </div>

      <ul className="example-ripple-list">
        {example.consequences.map((consequence) => (
          <li key={consequence.timeframe} className="example-ripple-item">
            <TimeframeMark timeframe={consequence.timeframe} />
            <p className="example-ripple-timeframe">
              {dictionary.result.timeframes[consequence.timeframe]}
            </p>
            <p className="example-ripple-title">{consequence.title}</p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="example-use-btn mt-1 inline-flex min-h-11 items-center px-3 text-sm"
        onClick={() => {
          trackEvent("example_selected", { locale });
          onUseExample(example.decision);
        }}
      >
        {dictionary.example.useExample}
      </button>
    </div>
  );
}
