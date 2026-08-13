import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Editorial } from "@/components/generator/editorial";
import { getDictionary } from "@/i18n/get-dictionary";

describe("Editorial", () => {
  it("reads as a numbered manual instead of stacked action cards", () => {
    const dictionary = getDictionary("en");
    const html = renderToStaticMarkup(<Editorial dictionary={dictionary} />);

    expect(html).toContain("<ol");
    expect(html).toContain("01");
    expect(html).toContain(dictionary.editorial.items[0]?.title ?? "");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
  });
});
