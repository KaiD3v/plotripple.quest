import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { htmlLangFromPathname } from "@/i18n/config";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-html-lang",
    htmlLangFromPathname(request.nextUrl.pathname),
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
