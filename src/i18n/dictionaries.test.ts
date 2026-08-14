import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("dictionaries", () => {
  it("keeps the same keys in English and Brazilian Portuguese", () => {
    const enKeys = leafKeys(getDictionary("en")).sort();
    const ptKeys = leafKeys(getDictionary("pt-br")).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it("localizes the generator customization toggle", () => {
    const en = getDictionary("en").generator;
    const pt = getDictionary("pt-br").generator;

    expect(en.customizeResult).toBe("Customize result");
    expect(en.hideCustomization).toBe("Hide customization");
    expect(en.currentSettings).toBe("Current settings:");
    expect(pt.customizeResult).toBe("Personalizar resultado");
    expect(pt.hideCustomization).toBe("Ocultar personalização");
    expect(pt.currentSettings).toBe("Configuração atual:");
  });

  it("localizes the example result preview chrome", () => {
    const en = getDictionary("en").example;
    const pt = getDictionary("pt-br").example;

    expect(en.label).toBe("Example result");
    expect(en.decisionLabel).toBe("Decision");
    expect(en.summaryLabel).toBe("Summary");
    expect(en.useExample).toBe("Use this example");
    expect(pt.label).toBe("Exemplo de resultado");
    expect(pt.decisionLabel).toBe("Decisão");
    expect(pt.summaryLabel).toBe("Resumo");
    expect(pt.useExample).toBe("Usar este exemplo");
  });
});
