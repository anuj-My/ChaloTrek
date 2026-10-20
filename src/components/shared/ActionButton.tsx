"use client";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";
import { useFormAction } from "@/lib/use-form-action";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  // Hidden fields sent with the click, e.g. { batch_id, status: "closed" }.
  fields: Record<string, string>;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  // Asks before running, for things that are hard to undo.
  confirm?: string;
};

// A single button that runs a Server Action, with its error shown beside it.
export function ActionButton({ action, fields, children, variant = "outline", confirm }: Props) {
  const [state, onSubmit, pending] = useFormAction(action);

  return (
    <form
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) return event.preventDefault();
        onSubmit(event);
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {children}
      </Button>
      {state.error && (
        <span role="alert" className="text-xs text-destructive">
          {state.error}
        </span>
      )}
    </form>
  );
}
