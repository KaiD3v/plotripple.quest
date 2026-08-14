import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ADVANCED_OPTIONS_ID,
  PRESET_SUMMARY_ID,
} from "@/components/generator/preset-summary";
import { GeneratorForm } from "@/components/generator/generator-form";
import { getDictionary } from "@/i18n/get-dictionary";

const values = {
  eventDescription: "short",
  tone: "mysterious" as const,
  intensity: "moderate" as const,
  setting: "fantasy" as const,
  timeframe: "mixed" as const,
  count: 3 as const,
  locale: "en" as const,
};

describe("GeneratorForm", () => {
  it("associates a visible validation error with the textarea", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={values}
        errors={{ eventDescription: dictionary.generator.validation.tooShort }}
        pending={false}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(html).toContain(dictionary.generator.timeframeHint);
    expect(html).toContain(dictionary.generator.validation.tooShort);
    expect(html).toContain('id="event-error"');
    expect(html).toContain("event-error");
    expect(html).toContain('aria-invalid="true"');
  });

  it("exposes a perceptible loading state and disables submit", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={values}
        errors={{}}
        pending
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(html).toContain(dictionary.generator.generating);
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("aria-live");
  });

  it("keeps semantic radios and a non-color selected state", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={values}
        errors={{}}
        pending={false}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(html).toContain('type="radio"');
    expect(html).toContain('name="tone"');
    expect(html).toContain("narrative-plate");
    expect(html).toContain("is-selected");
    expect(html).toContain("workshop-blotter");
  });

  it("does not render a captcha widget or third-party bot script host", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={values}
        errors={{}}
        pending={false}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    const captchaVendor = ["turn", "stile"].join("");
    const edgeVendor = ["cloud", "flare"].join("");
    expect(html.toLowerCase()).not.toContain(captchaVendor);
    expect(html.toLowerCase()).not.toContain(edgeVendor);
    expect(html).not.toContain(
      ["challenges.", edgeVendor, ".com"].join(""),
    );
  });

  it("starts with customization collapsed and a five-row decision field", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={values}
        errors={{}}
        pending={false}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(html).toContain('rows="5"');
    expect(html).toContain("resize-y");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(`aria-controls="${ADVANCED_OPTIONS_ID}"`);
    expect(html).toContain(`aria-describedby="${PRESET_SUMMARY_ID}"`);
    expect(html).toMatch(
      new RegExp(`id="${ADVANCED_OPTIONS_ID}"[^>]*hidden`),
    );
    expect(html).not.toMatch(
      new RegExp(`id="${PRESET_SUMMARY_ID}"[^>]*aria-live`),
    );
    expect(html).toContain(dictionary.generator.customizeResult);
    expect(html).toContain(dictionary.generator.currentSettings);
    expect(html).not.toContain(dictionary.generator.hideCustomization);
    expect(html).toContain(
      "Mysterious · Moderate · Fantasy · Mixed · 3 consequences",
    );
  });

  it("localizes the collapsed summary and toggle in Brazilian Portuguese", () => {
    const dictionary = getDictionary("pt-br");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={{ ...values, locale: "pt-br" }}
        errors={{}}
        pending={false}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(html).toContain(dictionary.generator.customizeResult);
    expect(html).toContain(dictionary.generator.currentSettings);
    expect(html).toContain(
      "Misterioso · Moderada · Fantasia · Misto · 3 consequências",
    );
    expect(html).toContain(dictionary.generator.submit);
  });

  it("keeps option groups disabled while generation is pending", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(
      <GeneratorForm
        dictionary={dictionary}
        values={values}
        errors={{}}
        pending
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(html).toContain("<fieldset");
    expect(html).toMatch(/<fieldset[^>]*disabled/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
    expect(html).not.toMatch(/<textarea[^>]*disabled/);
  });
});
