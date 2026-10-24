import type { z } from "zod";

// What a form's Server Action returns to useActionState.
export type FormState = {
  ok?: boolean;
  // Shown instead of the form's usual success text, when it depends on the result.
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string | undefined>;
};

// First error message per field, from a failed zod parse.
export function fieldErrors(error: z.ZodError): FormState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    errors[issue.path.join(".")] ??= issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors: errors };
}
