"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { trackEvent } from "@/lib/analytics";
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
import { NarrativeOption } from "@/components/generator/narrative-option";
import {
  ADVANCED_OPTIONS_ID,
  PRESET_SUMMARY_ID,
  formatPresetSummary,
} from "@/components/generator/preset-summary";
import { SectionHeading } from "@/components/ui/section-heading";

type FormErrors = {
  eventDescription?: string;
};

export function GeneratorForm({
  dictionary,
  values,
  errors,
  pending,
  onChange,
  onSubmit,
}: {
  dictionary: Dictionary;
  values: GeneratorInputParsed;
  errors: FormErrors;
  pending: boolean;
  onChange: (values: GeneratorInputParsed) => void;
  onSubmit: () => void;
}) {
  const [customizing, setCustomizing] = useState(false);
  const count = values.eventDescription.length;
  const countLabel = dictionary.generator.characterCount
    .replace("{count}", String(count))
    .replace("{max}", String(EVENT_DESCRIPTION_MAX));

  function toggleCustomization() {
    if (!customizing) {
      trackEvent("advanced_options_opened", { locale: values.locale });
    }
    setCustomizing((open) => !open);
  }

  return (
    <form
      className="workshop-blotter p-4 sm:p-5"
      aria-busy={pending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <SectionHeading index="I" stepLabel={dictionary.workshop.stepRecord}>
        {dictionary.generator.title}
      </SectionHeading>

      <div className="mt-5">
        <label
          htmlFor="event-description"
          className="block text-sm font-medium text-bone"
        >
          {dictionary.generator.eventLabel}
        </label>
        <p id="event-hint" className="mt-1 text-sm text-lichen">
          {dictionary.generator.eventHint}
        </p>
        <textarea
          id="event-description"
          name="eventDescription"
          required
          minLength={EVENT_DESCRIPTION_MIN}
          maxLength={EVENT_DESCRIPTION_MAX}
          rows={5}
          value={values.eventDescription}
          aria-describedby={
            errors.eventDescription
              ? "event-hint event-count event-error"
              : "event-hint event-count"
          }
          aria-invalid={errors.eventDescription ? true : undefined}
          className="ink-field decision-field mt-2 w-full resize-y px-3 py-3 text-base"
          placeholder={dictionary.generator.eventPlaceholder}
          onChange={(event) =>
            onChange({ ...values, eventDescription: event.target.value })
          }
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <p id="event-count" className="text-xs text-sage">
            {countLabel}
          </p>
          {errors.eventDescription ? (
            <p id="event-error" className="text-sm text-oxblood" role="alert">
              {errors.eventDescription}
            </p>
          ) : null}
        </div>
      </div>

      <p id={PRESET_SUMMARY_ID} className="preset-summary mt-4">
        <span className="preset-summary-label">
          {dictionary.generator.currentSettings}
        </span>{" "}
        {formatPresetSummary(dictionary, values)}
      </p>

      <button
        type="button"
        className="preset-toggle mt-2 inline-flex min-h-11 items-center"
        aria-expanded={customizing}
        aria-controls={ADVANCED_OPTIONS_ID}
        aria-describedby={PRESET_SUMMARY_ID}
        onClick={toggleCustomization}
      >
        {customizing
          ? dictionary.generator.hideCustomization
          : dictionary.generator.customizeResult}
      </button>

      <div id={ADVANCED_OPTIONS_ID} hidden={!customizing}>
        <OptionGroup
          legend={dictionary.generator.toneLabel}
          name="tone"
          value={values.tone}
          disabled={pending}
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
          disabled={pending}
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
          disabled={pending}
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
          disabled={pending}
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
          disabled={pending}
          options={resultCounts.map((countOption) => ({
            value: String(countOption),
            label: dictionary.generator.counts[String(countOption) as "3" | "5"],
          }))}
          onChange={(countValue) =>
            onChange({ ...values, count: Number(countValue) as ResultCount })
          }
        />
      </div>

      <div className="sr-only" aria-live="polite">
        {pending ? dictionary.generator.generating : ""}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`generate-btn mt-5${pending ? " is-busy" : ""}`}
      >
        <span className="generate-label">
          <span className={pending ? "invisible" : undefined} aria-hidden={pending || undefined}>
            {dictionary.generator.submit}
          </span>
          <span className={pending ? undefined : "invisible"} aria-hidden={pending ? undefined : true}>
            {dictionary.generator.generating}
          </span>
        </span>
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
  disabled,
  onChange,
}: {
  legend: string;
  hint?: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mt-5" disabled={disabled}>
      <legend className="text-sm font-medium text-bone">{legend}</legend>
      {hint ? <p className="mt-1 text-sm text-lichen">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <NarrativeOption
            key={option.value}
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            label={option.label}
            checked={option.value === value}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}
