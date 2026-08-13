"use client";

import { Loader2 } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  EVENT_DESCRIPTION_MAX,
  EVENT_DESCRIPTION_MIN,
  type GeneratorInputParsed,
} from "@/schemas/generator";
import {
  intensities,
  resultCounts,
  settings,
  timeframes,
  tones,
  type Intensity,
  type ResultCount,
  type Setting,
  type Timeframe,
  type Tone,
} from "@/types/generator";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

type FormErrors = {
  eventDescription?: string;
};

export function GeneratorForm({
  dictionary,
  values,
  errors,
  pending,
  turnstileSiteKey,
  onChange,
  onTurnstileToken,
  onSubmit,
}: {
  dictionary: Dictionary;
  values: Omit<GeneratorInputParsed, "turnstileToken">;
  errors: FormErrors;
  pending: boolean;
  turnstileSiteKey?: string;
  onChange: (values: Omit<GeneratorInputParsed, "turnstileToken">) => void;
  onTurnstileToken: (token: string) => void;
  onSubmit: () => void;
}) {
  const count = values.eventDescription.length;
  const countLabel = dictionary.generator.characterCount
    .replace("{count}", String(count))
    .replace("{max}", String(EVENT_DESCRIPTION_MAX));

  return (
    <form
      className="rounded-sm border border-moss/40 bg-canopy/60 p-4 sm:p-5"
      aria-busy={pending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <h2 className="font-display text-2xl text-gold">
        {dictionary.generator.title}
      </h2>

      <div className="mt-5">
        <label
          htmlFor="event-description"
          className="block text-sm font-medium text-mist"
        >
          {dictionary.generator.eventLabel}
        </label>
        <p id="event-hint" className="mt-1 text-sm text-mist-dim">
          {dictionary.generator.eventHint}
        </p>
        <textarea
          id="event-description"
          name="eventDescription"
          required
          minLength={EVENT_DESCRIPTION_MIN}
          maxLength={EVENT_DESCRIPTION_MAX}
          rows={7}
          value={values.eventDescription}
          aria-describedby={
            errors.eventDescription
              ? "event-hint event-count event-error"
              : "event-hint event-count"
          }
          aria-invalid={errors.eventDescription ? true : undefined}
          className="mt-2 w-full resize-y rounded-sm border border-moss/50 bg-void px-3 py-3 text-base text-mist"
          placeholder={dictionary.generator.eventPlaceholder}
          onChange={(event) =>
            onChange({ ...values, eventDescription: event.target.value })
          }
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <p id="event-count" className="text-xs text-mist-dim">
            {countLabel}
          </p>
          {errors.eventDescription ? (
            <p id="event-error" className="text-sm text-danger" role="alert">
              {errors.eventDescription}
            </p>
          ) : null}
        </div>
      </div>

      <OptionGroup
        legend={dictionary.generator.toneLabel}
        name="tone"
        value={values.tone}
        options={tones.map((tone) => ({
          value: tone,
          label: dictionary.generator.tones[tone],
        }))}
        onChange={(tone) => onChange({ ...values, tone: tone as Tone })}
      />

      <OptionGroup
        legend={dictionary.generator.intensityLabel}
        name="intensity"
        value={values.intensity}
        options={intensities.map((intensity) => ({
          value: intensity,
          label: dictionary.generator.intensities[intensity],
        }))}
        onChange={(intensity) =>
          onChange({ ...values, intensity: intensity as Intensity })
        }
      />

      <OptionGroup
        legend={dictionary.generator.settingLabel}
        name="setting"
        value={values.setting}
        options={settings.map((setting) => ({
          value: setting,
          label: dictionary.generator.settings[setting],
        }))}
        onChange={(setting) =>
          onChange({ ...values, setting: setting as Setting })
        }
      />

      <OptionGroup
        legend={dictionary.generator.timeframeLabel}
        hint={dictionary.generator.timeframeHint}
        name="timeframe"
        value={values.timeframe}
        options={timeframes.map((timeframe) => ({
          value: timeframe,
          label: dictionary.generator.timeframes[timeframe],
        }))}
        onChange={(timeframe) =>
          onChange({ ...values, timeframe: timeframe as Timeframe })
        }
      />

      <OptionGroup
        legend={dictionary.generator.countLabel}
        name="count"
        value={String(values.count)}
        options={resultCounts.map((countOption) => ({
          value: String(countOption),
          label: dictionary.generator.counts[String(countOption) as "3" | "5"],
        }))}
        onChange={(countValue) =>
          onChange({ ...values, count: Number(countValue) as ResultCount })
        }
      />

      {turnstileSiteKey ? (
        <div className="mt-5">
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onToken={onTurnstileToken}
          />
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {pending ? dictionary.generator.generating : ""}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 text-base font-medium text-void hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {dictionary.generator.generating}
          </>
        ) : (
          dictionary.generator.submit
        )}
      </button>
    </form>
  );
}

function OptionGroup({
  legend,
  hint,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  hint?: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium text-mist">{legend}</legend>
      {hint ? <p className="mt-1 text-sm text-mist-dim">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-3 text-sm ${
                checked
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-moss/50 text-mist-dim hover:border-gold-dim hover:text-mist"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                className="sr-only"
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
