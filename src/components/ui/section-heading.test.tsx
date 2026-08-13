import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDictionary } from "@/i18n/get-dictionary";

describe("SectionHeading", () => {
  it("hides decorative numerals from the accessibility tree", () => {
    const html = renderToStaticMarkup(
      <SectionHeading index="I" stepLabel={getDictionary("en").workshop.stepRecord}>
        Consequence generator
      </SectionHeading>,
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>I<\/span>/);
    expect(html).not.toMatch(/<p[^>]*>\s*I\s*<\/p>/);
    expect(html).toContain("sr-only");
    expect(html).toContain("Step 1: Record the decision");
  });

  it("localizes the hidden workshop step in Portuguese", () => {
    const html = renderToStaticMarkup(
      <SectionHeading
        index="II"
        stepLabel={getDictionary("pt-br").workshop.stepReview}
        tone="folio"
      >
        Consequências
      </SectionHeading>,
    );

    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>II<\/span>/);
    expect(html).toContain("Etapa 2: Analise as consequências");
  });
});
