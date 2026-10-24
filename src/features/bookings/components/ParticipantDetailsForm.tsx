"use client";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/use-form-action";

import { saveParticipantDetails } from "../actions";
import type { ParticipantByToken } from "../queries";
import { GENDERS } from "../schema";

type Props = { token: string; participant: ParticipantByToken };

// The co-traveller's own details, pre-filled when they come back to edit.
export function ParticipantDetailsForm({ token, participant: p }: Props) {
  const [state, onSubmit, pending] = useFormAction(saveParticipantDetails);
  const errors = state.fieldErrors ?? {};
  const filled = p.age !== null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Age" htmlFor="age" error={errors.age}>
          <Input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min={5}
            max={90}
            defaultValue={p.age ?? ""}
            required
            aria-invalid={!!errors.age}
          />
        </FormField>
        <FormField label="Gender" htmlFor="gender" error={errors.gender}>
          <NativeSelect
            id="gender"
            name="gender"
            defaultValue={p.gender ?? ""}
            required
            className="w-full"
            aria-invalid={!!errors.gender}
          >
            <NativeSelectOption value="" disabled>
              Select
            </NativeSelectOption>
            {GENDERS.map((g) => (
              <NativeSelectOption key={g.value} value={g.value}>
                {g.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField label="Your phone" htmlFor="phone" error={errors.phone} hint="Optional">
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={p.phone ?? ""}
          aria-invalid={!!errors.phone}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Emergency contact name" htmlFor="emergency_contact_name" error={errors.emergency_contact_name}>
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={p.emergency_contact_name ?? ""}
            required
            aria-invalid={!!errors.emergency_contact_name}
          />
        </FormField>
        <FormField
          label="Emergency contact phone"
          htmlFor="emergency_contact_phone"
          error={errors.emergency_contact_phone}
        >
          <Input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            type="tel"
            inputMode="tel"
            defaultValue={p.emergency_contact_phone ?? ""}
            required
            aria-invalid={!!errors.emergency_contact_phone}
          />
        </FormField>
      </div>
      <FormField
        label="Medical conditions"
        htmlFor="medical_notes"
        error={errors.medical_notes}
        hint="Optional. Asthma, allergies, recent injuries, medicines. Shared only with the organizer."
      >
        <Textarea
          id="medical_notes"
          name="medical_notes"
          rows={3}
          defaultValue={p.medical_notes ?? ""}
          aria-invalid={!!errors.medical_notes}
        />
      </FormField>
      <FormAlert state={state} success="Saved. Thanks, the organizer has your details." />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : filled ? "Save changes" : "Save my details"}
      </Button>
    </form>
  );
}
