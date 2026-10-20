import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "magiclink", "signup", "invite", "recovery", "email_change", "email",
];

// Logs in from a link carrying a hashed one-time token. Unlike /auth/callback
// this works in any browser. Used by `npm run dev:login`, and later by custom
// email templates once we have our own SMTP.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("Auth confirm failed:", error.code ?? error.status, error.message);
  }

  const failed = new URL("/login", request.url);
  failed.searchParams.set("error", "callback");
  failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
