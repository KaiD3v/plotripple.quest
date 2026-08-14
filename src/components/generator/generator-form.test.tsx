import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
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
});
