import { Suspense } from "react";

import { Logo } from "@/components/shared/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./components/LoginForm";

export function Login() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <Logo preload className="h-16" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Log in or sign up</CardTitle>
          <CardDescription>New here? An account is created automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* LoginForm reads ?next= and ?error= from the URL at request time. */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
