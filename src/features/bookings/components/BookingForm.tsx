"use client";

import { useState, useTransition } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatRupees } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";

import { checkCoupon, type CouponCheck, startBooking } from "../actions";
import { GENDERS } from "../schema";
import { amountDueNowPaise, couponDiscountPaise } from "../status";

type Props = {
  batch: { id: string; price_paise: number; deposit_paise: number | null };
  maxPeople: number;
  defaultEmail: string | null;
};

// Number of people, contact details and one block of details per person.
// Participant fields are uncontrolled, so changing the count keeps what's typed.
export function BookingForm({ batch, maxPeople, defaultEmail }: Props) {
  const [state, onSubmit, pending] = useFormAction(startBooking);
  const [people, setPeople] = useState(1);
  const errors = state.fieldErrors ?? {};
  const [coupon, setCoupon] = useState<CouponCheck>({});
  const subtotal = batch.price_paise * people;
  const discount = coupon.coupon ? couponDiscountPaise(coupon.coupon, batch.price_paise, people) : 0;
  const total = subtotal - discount;
  const dueNow = amountDueNowPaise(batch, people, discount);

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <input type="hidden" name="batch_id" value={batch.id} />

      <section className="space-y-4">
        <h2 className="type-4">Who&apos;s going</h2>
        <FormField label="Number of people" htmlFor="num_people" hint={`Up to ${maxPeople} in one booking.`}>
          <NativeSelect id="num_people" name="num_people" value={people} onChange={(e) => setPeople(Number(e.target.value))}>
            {Array.from({ length: maxPeople }, (_, i) => (
              <NativeSelectOption key={i + 1} value={i + 1}>
                {i + 1} {i === 0 ? "person" : "people"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Your email" htmlFor="contact_email" error={errors.contact_email} hint="For the booking confirmation.">
            <Input id="contact_email" name="contact_email" type="email" defaultValue={defaultEmail ?? ""} required aria-invalid={!!errors.contact_email} />
          </FormField>
          <FormField label="Your phone" htmlFor="contact_phone" error={errors.contact_phone} hint="The organizer will contact you here.">
            <Input id="contact_phone" name="contact_phone" type="tel" inputMode="tel" placeholder="98765 43210" required aria-invalid={!!errors.contact_phone} />
          </FormField>
        </div>
      </section>

      {Array.from({ length: people }, (_, i) => (
        <ParticipantFields key={i} index={i} errors={errors} />
      ))}

      <section className="space-y-3 rounded-xl border p-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatRupees(batch.price_paise)} × {people} {people === 1 ? "person" : "people"}
          </span>
          <span>{formatRupees(subtotal)}</span>
        </div>
        <CouponField batchId={batch.id} result={coupon} onChange={setCoupon} discountPaise={discount} />
        {dueNow < total && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance, paid to the organizer later</span>
            <span>{formatRupees(total - dueNow)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-3 font-medium">
          <span>{dueNow < total ? "Deposit to pay now" : "To pay now"}</span>
          <span>{formatRupees(dueNow)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your {people === 1 ? "seat is" : "seats are"} held for 10 minutes while you pay.
        </p>
        <FormAlert state={state} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Holding your seats…" : "Continue to payment"}
        </Button>
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to the{" "}
          <a href="/terms" target="_blank" className="underline underline-offset-4">
            terms of service
          </a>{" "}
          and the{" "}
          <a href="/refund-policy" target="_blank" className="underline underline-offset-4">
            cancellation and refund policy
          </a>
          .
        </p>
      </section>
    </form>
  );
}

// "Have a coupon code?" — checks the code with the server and reports the
// result up, so the price summary can show the discount. The applied code
// goes in a hidden field; booking checks it again.
function CouponField({
  batchId,
  result,
  onChange,
  discountPaise,
}: {
  batchId: string;
  result: CouponCheck;
  onChange: (result: CouponCheck) => void;
  discountPaise: number;
}) {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const applied = result.coupon;

  if (applied) {
    return (
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Coupon {applied.code}{" "}
          <button
            type="button"
            className="underline underline-offset-4 hover:text-foreground"
            onClick={() => {
              onChange({});
              setCode("");
            }}
          >
            Remove
          </button>
        </span>
        <span>−{formatRupees(discountPaise)}</span>
        <input type="hidden" name="coupon_code" value={applied.code} />
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="text-sm underline underline-offset-4" onClick={() => setOpen(true)}>
        Have a coupon code?
      </button>
    );
  }

  const apply = () => startTransition(async () => onChange(await checkCoupon(batchId, code)));
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            // Enter applies the code instead of submitting the booking.
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Coupon code"
          aria-label="Coupon code"
          autoCapitalize="characters"
          maxLength={20}
          autoFocus
          className="w-44"
        />
        <Button type="button" variant="outline" onClick={apply} disabled={pending || !code.trim()}>
          {pending ? "Checking…" : "Apply"}
        </Button>
      </div>
      {result.error && <p className="text-sm text-destructive">{result.error}</p>}
    </div>
  );
}

// Everyone after the first can be left to fill in their own details from a
// link, so the person booking needs only their name.
function ParticipantFields({ index, errors }: { index: number; errors: Record<string, string | undefined> }) {
  const [selfFill, setSelfFill] = useState(false);
  const name = (field: string) => `participants.${index}.${field}`;
  const id = (field: string) => `p${index}-${field}`;
  const error = (field: string) => errors[name(field)];

  const fullName = (
    <FormField label="Full name" htmlFor={id("full_name")} error={error("full_name")} hint="As on their ID">
      <Input id={id("full_name")} name={name("full_name")} autoComplete={index === 0 ? "name" : "off"} required aria-invalid={!!error("full_name")} />
    </FormField>
  );
  const phone = (
    <FormField label="Phone" htmlFor={id("phone")} error={error("phone")} hint="Optional">
      <Input id={id("phone")} name={name("phone")} type="tel" inputMode="tel" aria-invalid={!!error("phone")} />
    </FormField>
  );

  return (
    <fieldset className="space-y-4">
      <legend className="type-4">Person {index + 1}</legend>
      {index > 0 && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name={name("self_fill")}
            checked={selfFill}
            onChange={(e) => setSelfFill(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            They&apos;ll fill in their own details
            <span className="block text-muted-foreground">
              You&apos;ll get a link to send them for their age, emergency contact and medical details.
            </span>
          </span>
        </label>
      )}
      {selfFill ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {fullName}
          {phone}
        </div>
      ) : (
        <ParticipantDetails index={index} errors={errors} fullName={fullName} phone={phone} />
      )}
    </fieldset>
  );
}

function ParticipantDetails({
  index,
  errors,
  fullName,
  phone,
}: {
  index: number;
  errors: Record<string, string | undefined>;
  fullName: React.ReactNode;
  phone: React.ReactNode;
}) {
  const name = (field: string) => `participants.${index}.${field}`;
  const id = (field: string) => `p${index}-${field}`;
  const error = (field: string) => errors[name(field)];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {fullName}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Age" htmlFor={id("age")} error={error("age")}>
            <Input id={id("age")} name={name("age")} type="number" inputMode="numeric" min={5} max={90} required aria-invalid={!!error("age")} />
          </FormField>
          <FormField label="Gender" htmlFor={id("gender")} error={error("gender")}>
            <NativeSelect id={id("gender")} name={name("gender")} defaultValue="" required className="w-full" aria-invalid={!!error("gender")}>
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
        {phone}
        <div className="hidden sm:block" />
        <FormField label="Emergency contact name" htmlFor={id("emergency_contact_name")} error={error("emergency_contact_name")}>
          <Input id={id("emergency_contact_name")} name={name("emergency_contact_name")} required aria-invalid={!!error("emergency_contact_name")} />
        </FormField>
        <FormField label="Emergency contact phone" htmlFor={id("emergency_contact_phone")} error={error("emergency_contact_phone")}>
          <Input id={id("emergency_contact_phone")} name={name("emergency_contact_phone")} type="tel" inputMode="tel" required aria-invalid={!!error("emergency_contact_phone")} />
        </FormField>
      </div>
      <FormField
        label="Medical conditions"
        htmlFor={id("medical_notes")}
        error={error("medical_notes")}
        hint="Optional. Asthma, allergies, recent injuries, medicines. Shared only with the organizer."
      >
        <Textarea id={id("medical_notes")} name={name("medical_notes")} rows={2} aria-invalid={!!error("medical_notes")} />
      </FormField>
    </>
  );
}
