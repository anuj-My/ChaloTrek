"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginWithEmail, loginWithGoogle, type LoginState } from "../actions";

const URL_ERRORS: Record<string, string> = {
  google: "Couldn't start Google login. Please try again.",
  callback: "That login link didn't work. It may have expired, so please try again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const urlError = URL_ERRORS[searchParams.get("error") ?? ""];

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginWithEmail,
    { step: "email" },
  );
  const error = state.error ?? (state.step === "email" ? urlError : undefined);

  if (state.step === "sent") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={state.email} />
        <p className="text-sm text-muted-foreground">
          We emailed a login link to{" "}
          <span className="font-medium text-foreground">{state.email}</span>. Open it{" "}
          <span className="font-medium text-foreground">in this browser</span> to log in.
        </p>
        <p className="text-sm text-muted-foreground">
          Can&apos;t find it? Check your spam folder.
        </p>
        <div className="flex justify-between">
          <Button type="submit" name="intent" value="restart" variant="link" className="px-0" disabled={pending}>
            Use a different email
          </Button>
          <Button type="submit" name="intent" value="send" variant="link" className="px-0" disabled={pending}>
            {pending ? "Sending…" : "Resend link"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.email}
            required
            autoFocus
          />
        </div>
        <FormMessage error={error} />
        <Button type="submit" name="intent" value="send" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Email me a login link"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={loginWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>
    </div>
  );
}

function FormMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  );
}
