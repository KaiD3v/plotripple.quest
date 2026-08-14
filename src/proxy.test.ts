import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy", () => {
  it("sets x-html-lang for English routes", () => {
    const request = new NextRequest("https://plotripple.vercel.app/en");
    const response = proxy(request);
    expect(response.headers.get("x-middleware-request-x-html-lang")).toBe("en");
  });

  it("sets x-html-lang for Portuguese routes", () => {
    const request = new NextRequest("https://plotripple.vercel.app/pt-br");
    const response = proxy(request);
    expect(response.headers.get("x-middleware-request-x-html-lang")).toBe(
      "pt-BR",
    );
  });
});
