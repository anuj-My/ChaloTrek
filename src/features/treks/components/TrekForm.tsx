"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/features/organizers/schema";
import { useFormAction } from "@/lib/use-form-action";

import { createTrek, updateTrek } from "../actions";
import type { CancellationPolicy, MyTrek } from "../queries";
import { DIFFICULTIES, REGIONS } from "../schema";
import { ItineraryEditor } from "./ItineraryEditor";

type Props = { trek?: MyTrek; organizerSlug: string; policies: CancellationPolicy[] };

// Creates a trek when `trek` is missing, otherwise edits it. The link slug can
// change only while the trek is a draft, since published links get shared.
export function TrekForm({ trek, organizerSlug, policies }: Props) {
  const isNew = !trek;
  const [state, onSubmit, pending] = useFormAction(isNew ? createTrek : updateTrek);
  const [name, setName] = useState(trek?.name ?? "");
  const [slug, setSlug] = useState(trek?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const errors = state.fieldErrors ?? {};
  const itineraryError = Object.entries(errors).find(([key]) => key.startsWith("itinerary"))?.[1];
  const slugLocked = !!trek && trek.status !== "draft";
  const shownSlug = slugEdited ? slug : slugify(name);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {trek && <input type="hidden" name="trek_id" value={trek.id} />}

      <FormField label="Trek name" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kedarkantha" required aria-invalid={!!errors.name} />
      </FormField>

      <FormField
        label="Link"
        htmlFor="slug"
        error={errors.slug}
        hint={
          slugLocked
            ? "Fixed once published, so shared links keep working."
            : `chalotrek.in/o/${organizerSlug}/${shownSlug || "trek-name"}`
        }
      >
        {slugLocked ? (
          <>
            <input type="hidden" name="slug" value={trek.slug} />
            <Input id="slug" value={trek.slug} disabled readOnly />
          </>
        ) : (
          <Input
            id="slug"
            name="slug"
            value={shownSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase());
            }}
            required
            aria-invalid={!!errors.slug}
          />
        )}
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Region" htmlFor="region" error={errors.region}>
          <NativeSelect id="region" name="region" className="w-full" defaultValue={trek?.region ?? ""} required aria-invalid={!!errors.region}>
            <NativeSelectOption value="" disabled>Pick a region</NativeSelectOption>
            {REGIONS.map((region) => (
              <NativeSelectOption key={region} value={region}>{region}</NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Difficulty" htmlFor="difficulty" error={errors.difficulty}>
          <NativeSelect id="difficulty" name="difficulty" className="w-full" defaultValue={trek?.difficulty ?? ""} required aria-invalid={!!errors.difficulty}>
            <NativeSelectOption value="" disabled>Pick a difficulty</NativeSelectOption>
            {DIFFICULTIES.map((d) => (
              <NativeSelectOption key={d.value} value={d.value}>{d.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Duration (days)" htmlFor="duration_days" error={errors.duration_days}>
          <Input id="duration_days" name="duration_days" type="number" min={1} max={60} defaultValue={trek?.duration_days ?? ""} required aria-invalid={!!errors.duration_days} />
        </FormField>
        <FormField label="Max altitude (m)" htmlFor="max_altitude_m" error={errors.max_altitude_m} hint="Optional">
          <Input id="max_altitude_m" name="max_altitude_m" type="number" min={100} max={9000} defaultValue={trek?.max_altitude_m ?? ""} placeholder="3810" aria-invalid={!!errors.max_altitude_m} />
        </FormField>
      </div>

      <FormField label="Summary" htmlFor="summary" error={errors.summary} hint="A few lines on what makes this trek special.">
        <Textarea id="summary" name="summary" rows={4} defaultValue={trek?.summary ?? ""} aria-invalid={!!errors.summary} />
      </FormField>

      <div className="space-y-2">
        <p className="text-sm font-medium">Itinerary</p>
        <ItineraryEditor initial={trek?.itinerary ?? []} error={itineraryError} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Included" htmlFor="inclusions" error={errors.inclusions} hint="One item per line.">
          <Textarea id="inclusions" name="inclusions" rows={5} defaultValue={trek?.inclusions.join("\n") ?? ""} placeholder={"Meals during the trek\nTents and sleeping bags\nTrek leader and guides"} />
        </FormField>
        <FormField label="Not included" htmlFor="exclusions" error={errors.exclusions} hint="One item per line.">
          <Textarea id="exclusions" name="exclusions" rows={5} defaultValue={trek?.exclusions.join("\n") ?? ""} placeholder={"Travel to Dehradun\nPersonal expenses\nPorters for personal bags"} />
        </FormField>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Cancellation policy</legend>
        {policies.map((policy) => (
          <label key={policy.id} className="flex cursor-pointer gap-3 rounded-lg border p-3 has-checked:border-primary">
            <input
              type="radio"
              name="cancellation_policy_id"
              value={policy.id}
              defaultChecked={(trek?.cancellation_policy_id ?? 2) === policy.id}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">{policy.name}</span>
              <span className="block text-sm text-muted-foreground">{policy.description}</span>
            </span>
          </label>
        ))}
        {errors.cancellation_policy_id && <p className="text-sm text-destructive">{errors.cancellation_policy_id}</p>}
      </fieldset>

      <FormAlert state={state} success="Saved." />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : isNew ? "Create trek" : "Save changes"}
      </Button>
    </form>
  );
}
