import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GeneratorWorkshopLayout } from "@/components/generator/generator-workshop-layout";

describe("GeneratorWorkshopLayout", () => {
  it("places the result before history in DOM order for mobile", () => {
    const html = renderToStaticMarkup(
      <GeneratorWorkshopLayout
        form={<div id="form" />}
        result={<div id="result" />}
        history={<div id="history" />}
      />,
    );
    expect(html.indexOf('id="form"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="form"')).toBeLessThan(html.indexOf('id="result"'));
    expect(html.indexOf('id="result"')).toBeLessThan(html.indexOf('id="history"'));
    expect(html).toContain("order-1");
    expect(html).toContain("order-2");
    expect(html).toContain("order-3");
    expect(html).toContain("workshop-bench");
    expect(html).toContain("lg:grid-cols-[minmax(0,11fr)_minmax(0,14fr)]");
    expect(html).toContain("lg:sticky");
    expect(html).toContain("lg:items-start");
  });
});


