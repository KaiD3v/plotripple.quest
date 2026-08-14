import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { htmlLangFromPathname } from "@/i18n/config";
import {
  DISABLE_GOOGLE_TAGS_HEADER,
  isPrivacyPath,
} from "@/lib/google-tags-route";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-html-lang",
    htmlLangFromPathname(request.nextUrl.pathname),
  );
  if (isPrivacyPath(request.nextUrl.pathname)) {
    requestHeaders.set(DISABLE_GOOGLE_TAGS_HEADER, "1");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
