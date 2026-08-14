import { NextResponse } from "next/server";
import type { EnvSource } from "@/lib/env";
import { getAdSenseClientId } from "@/lib/env";

export const ADS_TXT_CERTIFICATION_AUTHORITY_ID = "f08c47fec0942fa0";

export function buildAdsTxt(clientId: string): string {
  const publisherId = clientId.replace(/^ca-/, "");
  return `google.com, ${publisherId}, DIRECT, ${ADS_TXT_CERTIFICATION_AUTHORITY_ID}\n`;
}

export function adsTxtResponse(env: EnvSource = process.env): NextResponse {
  const clientId = getAdSenseClientId(env);
  if (!clientId) {
    return new NextResponse("", { status: 404 });
  }

  return new NextResponse(buildAdsTxt(clientId), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function GET(): NextResponse {
  return adsTxtResponse();
}
