import type { FormState } from "@/lib/form-state";

// Form-level result under a form: the error, or a success message once saved.
export function FormAlert({ state, success }: { state: FormState; success?: string }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.ok && (state.message || success)) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {state.message ?? success}
      </p>
    );
  }
  return null;
}
