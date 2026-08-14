import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";

describe("privacy policy copy", () => {
  it("explains the Google CMP and consent choices in English without legal guarantees", () => {
    const privacy = getDictionary("en").privacy;
    const ads = privacy.sections.find((section) => section.title === "Analytics and ads");

    expect(privacy.draftNotice).toContain("not a substitute for legal review");
    expect(ads?.body).toContain("Google");
    expect(ads?.body).toContain("CMP");
    expect(ads?.body).toMatch(/consent/i);
    expect(ads?.body).toMatch(/refuse|do not consent/i);
    expect(ads?.body).toContain("Privacy and cookie settings");
    expect(ads?.body).toMatch(/cookie|local storage/i);
    expect(ads?.body).toMatch(/narrative text/i);
    expect(ads?.body).not.toMatch(/compliant with GDPR|we retain for \d+ days/i);
  });

  it("explains the Google CMP and consent choices in Portuguese without legal guarantees", () => {
    const privacy = getDictionary("pt-br").privacy;
    const ads = privacy.sections.find((section) => section.title === "Analytics e anúncios");

    expect(privacy.draftNotice).toContain("não substitui revisão jurídica");
    expect(ads?.body).toContain("Google");
    expect(ads?.body).toContain("CMP");
    expect(ads?.body).toMatch(/consentimento/i);
    expect(ads?.body).toMatch(/recusar/i);
    expect(ads?.body).toContain("Privacy and cookie settings");
    expect(ads?.body).toMatch(/cookies|armazenamento local/i);
    expect(ads?.body).toMatch(/texto narrativo/i);
    expect(ads?.body).not.toMatch(/estamos em conformidade|retenção de \d+ dias/i);
  });

  it("preserves Gemini, Upstash, and local chronicle disclosures", () => {
    const en = getDictionary("en").privacy.sections.map((section) => section.body).join(" ");
    const pt = getDictionary("pt-br").privacy.sections.map((section) => section.body).join(" ");

    expect(en).toContain("Gemini");
    expect(en).toContain("Upstash");
    expect(en).toMatch(/browser on this device/i);
    expect(pt).toContain("Gemini");
    expect(pt).toContain("Upstash");
    expect(pt).toMatch(/neste navegador/i);
  });
});
