import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComingSoonTools } from "@/components/generator/coming-soon-tools";
import { getDictionary } from "@/i18n/get-dictionary";

describe("ComingSoonTools", () => {
  it("renders non-interactive coming soon cards", () => {
    const html = renderToStaticMarkup(
      <ComingSoonTools dictionary={getDictionary("en")} />,
    );
    expect(html).toContain("Coming soon");
    expect(html).toContain("Rumor Generator");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(html).toContain("<article");
    expect(html).toContain("unwritten-page");
  });

  it("keeps localized Portuguese labels", () => {
    const html = renderToStaticMarkup(
      <ComingSoonTools dictionary={getDictionary("pt-br")} />,
    );
    expect(html).toContain("Em breve");
    expect(html).not.toContain("<button");
  });
});
