import { NextRequest, NextResponse } from "next/server";

import { hasValidPinSession, PIN_SESSION_COOKIE } from "@/lib/pinAuth";

const PUBLIC_PATHS = new Set(["/access", "/api/access"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(PIN_SESSION_COOKIE)?.value;

  if (await hasValidPinSession(sessionToken)) {
    return NextResponse.next();
  }

  const accessUrl = new URL("/access", request.url);
  accessUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
