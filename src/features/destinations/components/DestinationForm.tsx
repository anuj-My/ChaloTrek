"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { REGIONS } from "@/features/treks/schema";
import { useFormAction } from "@/lib/use-form-action";

import { createDestination, updateDestination } from "../actions";

type Destination = { id: string; name: string; region: string; summary: string | null };

// Adds a destination when `destination` is missing, otherwise edits it.
export function DestinationForm({ destination }: { destination?: Destination }) {
  const [state, onSubmit, pending] = useFormAction(destination ? updateDestination : createDestination);
  const [fieldsKey, setFieldsKey] = useState(0);
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.ok && !destination) setFieldsKey((k) => k + 1);
  }
  const errors = state.fieldErrors ?? {};
  const id = (field: string) => `${destination?.id ?? "new"}-${field}`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {destination && <input type="hidden" name="destination_id" value={destination.id} />}
      <div key={fieldsKey} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Trek name"
            htmlFor={id("name")}
            error={errors.name}
            hint={destination ? undefined : "The page address comes from this, e.g. /treks/kedarkantha."}
          >
            <Input id={id("name")} name="name" defaultValue={destination?.name} required aria-invalid={!!errors.name} />
          </FormField>
          <FormField label="Region" htmlFor={id("region")} error={errors.region}>
            <NativeSelect id={id("region")} name="region" className="w-full" defaultValue={destination?.region ?? ""} required>
              <NativeSelectOption value="" disabled>
                Pick a region
              </NativeSelectOption>
              {REGIONS.map((region) => (
                <NativeSelectOption key={region} value={region}>
                  {region}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        <FormField
          label="About this trek (optional)"
          htmlFor={id("summary")}
          error={errors.summary}
          hint="Shown at the top of the comparison page: best season, altitude, what it's known for."
        >
          <Textarea id={id("summary")} name="summary" rows={3} defaultValue={destination?.summary ?? ""} />
        </FormField>
      </div>
      <FormAlert state={state} success={destination ? "Saved." : "Added."} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : destination ? "Save" : "Add trek"}
      </Button>
    </form>
  );
}
