# Analytics

PlotRipple sends custom GA4 events through `trackEvent` in `src/lib/analytics.ts`. Events fire only in the browser, and only when `window.gtag` exists. Consent Mode is unchanged: Google tags start with storage denied, and this module never grants consent, updates consent, or sends narrative text.

Each user action emits exactly one event. Parameters are categorical only. Decisions, generated text, titles, descriptions, chronicle IDs, and personal data are never sent. Unknown keys are dropped by the allowlist before `gtag`.

## Funnel

| Event | When it fires | Parameters |
| --- | --- | --- |
| `generator_view` | The generator workshop mounts or the locale on that workshop changes. | `locale` |
| `example_selected` | The user applies the localized example decision. | `locale` |
| `advanced_options_opened` | The user opens narrative customization. Closing it does not fire again. | `locale` |
| `generator_submit` | The form passes validation and a generate request starts. | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count` |
| `generator_success` | The generate request returns a usable result. **Primary conversion.** | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count`, `duration_bucket` |
| `generator_validation_error` | Submit is blocked by client-side validation. | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count` |
| `generator_error` | Generate fails for a reason other than the shared daily limit. | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count`, `error_code`, `duration_bucket` |
| `generator_rate_limited` | Generate is rejected because the shared daily AI limit was reached. | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count`, `error_code`, `duration_bucket` |
| `result_copy` | The user copies the result and the clipboard write succeeds. Failures do not emit. | `locale` |
| `result_regenerate` | The user chooses “Generate again”. Tracked once, in the workshop, with the current presets. | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count` |
| `canvas_opened` | The user opens the Chronicle Map. **Secondary conversion.** | `locale`, `result_count`, `source` (`result` or `history`) |
| `history_opened` | The user reviews a legacy local history entry in the result panel. Opening the map from history is `canvas_opened` with `source: "history"`, not this event. | `locale`, `tone`, `intensity`, `setting`, `timeframe`, `result_count` |
| `language_changed` | The user switches language to a different locale. | `language`, `locale` |

## Allowed parameters

Only these keys survive `allowedParams`:

- `locale`
- `tone`
- `intensity`
- `setting`
- `timeframe`
- `result_count`
- `error_code`
- `duration_bucket`
- `language`
- `source` (`result` from the generated result, `history` from Recent on this device)

`duration_bucket` is one of `0-2s`, `2-5s`, `5-10s`, or `10s+`. It never includes the exact duration.

## Conversions and key events

Mark these as key events in GA4:

- **Primary conversion:** `generator_success` — a game master received narrative consequences.
- **Secondary conversion:** `canvas_opened` — they continued into the Chronicle Map.

Do not mark the rest as conversions. They are funnel and quality signals (`generator_submit`, `example_selected`, `result_copy`, `result_regenerate`, `history_opened`) or diagnostics (`generator_validation_error`, `generator_error`, `generator_rate_limited`, `generator_view`, `advanced_options_opened`, `language_changed`).

## What is never sent

- Player decisions, summaries, consequence titles, or other narrative text
- Chronicle IDs or storage keys
- Copied clipboard contents
- Emails, names, or other personal data
- Consent grants or first-party consent cookies
