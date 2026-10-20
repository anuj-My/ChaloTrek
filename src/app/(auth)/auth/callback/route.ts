import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

// Google login and email links come back here with a one-time code, which is
// swapped for a session cookie. The swap needs the code-verifier cookie set
// when the login started, so it only works in the same browser.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("Auth callback failed:", error.code ?? error.status, error.message);
  } else {
    console.error("Auth callback failed: no code in URL", searchParams.get("error_description") ?? "");
  }

  const failed = new URL("/login", request.url);
  failed.searchParams.set("error", "callback");
  failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
