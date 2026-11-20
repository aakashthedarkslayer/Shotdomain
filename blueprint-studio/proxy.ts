import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "./lib/session";

// Redirect signed-out visitors to /login. API routes check auth themselves
// (and are excluded here so large uploads are not buffered by the proxy).
export async function proxy(request: NextRequest) {
  const ok = await verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value).catch(() => false);
  if (ok) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
