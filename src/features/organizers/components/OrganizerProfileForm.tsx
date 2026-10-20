"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/use-form-action";

import { createOrganizer, updateOrganizer } from "../actions";
import type { MyOrganizer } from "../queries";
import { slugify } from "../schema";

type Props = { organizer?: MyOrganizer; defaultEmail?: string | null };

// Creates the profile when `organizer` is missing, otherwise edits it. The
// booking-link slug is chosen once at creation, since changing it would break
// links organizers have already shared.
export function OrganizerProfileForm({ organizer, defaultEmail }: Props) {
  const isNew = !organizer;
  const [state, onSubmit, pending] = useFormAction(isNew ? createOrganizer : updateOrganizer);
  const [name, setName] = useState(organizer?.name ?? "");
  const [slug, setSlug] = useState(organizer?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const errors = state.fieldErrors ?? {};
  const shownSlug = slugEdited ? slug : slugify(name);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormField label="Company name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Himalayan Hikers"
          required
          aria-invalid={!!errors.name}
        />
      </FormField>

      {isNew ? (
        <FormField
          label="Booking link"
          htmlFor="slug"
          error={errors.slug}
          hint={`chalotrek.in/o/${shownSlug || "your-company"}. You can't change this later.`}
        >
          <Input
            id="slug"
            name="slug"
            value={shownSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase());
            }}
            placeholder="himalayan-hikers"
            required
            aria-invalid={!!errors.slug}
          />
        </FormField>
      ) : (
        <FormField label="Booking link" htmlFor="slug" hint="Contact us if you need to change it.">
          <Input id="slug" value={`chalotrek.in/o/${organizer.slug}`} readOnly disabled />
        </FormField>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Phone" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={organizer?.phone ?? ""}
            placeholder="+91 98765 43210"
            required
            aria-invalid={!!errors.phone}
          />
        </FormField>
        <FormField label="Email for bookings" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={organizer?.email ?? defaultEmail ?? ""}
            required
            aria-invalid={!!errors.email}
          />
        </FormField>
      </div>

      <FormField
        label="Instagram handle"
        htmlFor="instagram_handle"
        error={errors.instagram_handle}
        hint="Optional"
      >
        <Input
          id="instagram_handle"
          name="instagram_handle"
          defaultValue={organizer?.instagram_handle ?? ""}
          placeholder="@himalayan.hikers"
          aria-invalid={!!errors.instagram_handle}
        />
      </FormField>

      <FormField
        label="About your company"
        htmlFor="bio"
        error={errors.bio}
        hint="Optional. Shown on your booking pages."
      >
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={organizer?.bio ?? ""}
          aria-invalid={!!errors.bio}
        />
      </FormField>

      <FormAlert state={state} success="Saved." />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : isNew ? "Create profile" : "Save changes"}
      </Button>
    </form>
  );
}
