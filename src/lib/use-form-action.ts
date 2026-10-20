"use client";

import { startTransition, useActionState } from "react";

import type { FormState } from "@/lib/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

// useActionState for <form onSubmit>. Passing the action to <form action>
// makes React clear every field after submit, so a validation error would
// wipe what the user typed. The clicked button's name/value is still sent.
export function useFormAction(action: Action) {
  const [state, formAction, pending] = useActionState(action, {});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return [state, onSubmit, pending] as const;
}
