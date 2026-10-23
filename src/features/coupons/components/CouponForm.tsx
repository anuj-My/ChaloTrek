"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useFormAction } from "@/lib/use-form-action";

import { createCoupon } from "../actions";

// Adds a coupon. Clears itself after each one is added.
export function CouponForm({ treks }: { treks: { id: string; name: string }[] }) {
  const [state, onSubmit, pending] = useFormAction(createCoupon);
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [fieldsKey, setFieldsKey] = useState(0);
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.ok) setFieldsKey((k) => k + 1);
  }
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div key={fieldsKey} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Code" htmlFor="coupon-code" error={errors.code} hint="What trekkers type, e.g. EARLYBIRD">
          <Input
            id="coupon-code"
            name="code"
            required
            maxLength={20}
            autoCapitalize="characters"
            className="uppercase"
            aria-invalid={!!errors.code}
          />
        </FormField>
        <FormField
          label="Discount"
          htmlFor="coupon-value"
          error={errors.value}
          hint={kind === "percent" ? "Off the booking total." : "Off per person."}
        >
          <div className="flex gap-2">
            <NativeSelect
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as "percent" | "amount")}
              aria-label="Discount type"
            >
              <NativeSelectOption value="percent">% off</NativeSelectOption>
              <NativeSelectOption value="amount">₹ off</NativeSelectOption>
            </NativeSelect>
            <Input
              id="coupon-value"
              name="value"
              type="number"
              inputMode="numeric"
              min={1}
              max={kind === "percent" ? 90 : 100000}
              required
              className="w-28"
              aria-invalid={!!errors.value}
            />
          </div>
        </FormField>
        <FormField label="Trek" htmlFor="coupon-trek" error={errors.trek_id}>
          <NativeSelect id="coupon-trek" name="trek_id" defaultValue="">
            <NativeSelectOption value="">All my treks</NativeSelectOption>
            {treks.map((trek) => (
              <NativeSelectOption key={trek.id} value={trek.id}>
                {trek.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Max uses (optional)" htmlFor="coupon-uses" error={errors.max_uses} hint="Bookings, not people.">
          <Input
            id="coupon-uses"
            name="max_uses"
            type="number"
            inputMode="numeric"
            min={1}
            className="w-28"
            aria-invalid={!!errors.max_uses}
          />
        </FormField>
        <FormField label="Last day (optional)" htmlFor="coupon-until" error={errors.valid_until}>
          <Input id="coupon-until" name="valid_until" type="date" className="w-44" aria-invalid={!!errors.valid_until} />
        </FormField>
      </div>
      <FormAlert state={state} success="Coupon added." />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add coupon"}
      </Button>
    </form>
  );
}
