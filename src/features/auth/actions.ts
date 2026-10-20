"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/safe-next-path";
import { siteConfig } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

import { emailSchema } from "./schema";

export type LoginState = {
  step: "email" | "sent";
  email?: string;
  error?: string;
};

async function callbackUrl(next: string) {
  const origin = (await headers()).get("origin") ?? siteConfig.url;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

// Emails a one-time login link (Supabase's default Magic Link template). The
// link comes back to /auth/callback and must be opened in the same browser.
// The submit button's `intent` is "send", or "restart" to go back to the email field.
export async function loginWithEmail(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (formData.get("intent") === "restart") return { step: "email" };

  const next = safeNextPath(formData.get("next")?.toString());
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { step: "email", error: email.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    // New emails get an account automatically, so sign-up and login are one flow.
    options: { shouldCreateUser: true, emailRedirectTo: await callbackUrl(next) },
  });
  if (error) {
    return {
      step: "email",
      email: email.data,
      error:
        error.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : "Couldn't send the email. Please try again.",
    };
  }
  return { step: "sent", email: email.data };
}

export async function loginWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error || !data.url) {
    redirect(`/login?error=google&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
