import type { NextRequest } from "next/server";

import { safeNextPath } from "@/lib/safe-next-path";
import { cleanSourceTag, SOURCE_COOKIE, SOURCE_COOKIE_MAX_AGE } from "@/lib/source-tag";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// Logged-out visitors are sent to /login before these pages render. This is
// only a fast first check: pages and actions verify the user again, and RLS
// protects the data itself.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/my-bookings"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Remember where the visitor came from (?src=insta-bio), for booking sources.
  const sourceTag = cleanSourceTag(request.nextUrl.searchParams.get("src"));
  if (sourceTag) {
    response.cookies.set(SOURCE_COOKIE, sourceTag, { maxAge: SOURCE_COOKIE_MAX_AGE, path: "/", sameSite: "lax" });
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // If the callback URL isn't in Supabase's Redirect URLs list, Supabase sends
  // the login code to the Site URL (the homepage) instead. Finish the login.
  const code = request.nextUrl.searchParams.get("code");
  if (pathname === "/" && code) {
    const url = new URL("/auth/callback", request.url);
    url.searchParams.set("code", code);
    return redirectWithCookies(url, response);
  }

  if (!userId && isProtected) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return redirectWithCookies(url, response);
  }

  if (userId && pathname === "/login") {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return redirectWithCookies(new URL(next, request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static files, images and the Razorpay webhook (it has no session).
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
