"use client";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/lib/use-form-action";

import { submitKyc } from "../actions";
import type { OrganizerKyc } from "../queries";

export function KycForm({ kyc, locked }: { kyc: OrganizerKyc; locked: boolean }) {
  const [state, onSubmit, pending] = useFormAction(submitKyc);
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset disabled={locked || pending} className="space-y-5">
        <FormField
          label="Legal name"
          htmlFor="legal_name"
          error={errors.legal_name}
          hint="As on your PAN card or business registration."
        >
          <Input
            id="legal_name"
            name="legal_name"
            defaultValue={kyc?.legal_name ?? ""}
            required
            aria-invalid={!!errors.legal_name}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="PAN" htmlFor="pan" error={errors.pan}>
            <Input
              id="pan"
              name="pan"
              defaultValue={kyc?.pan ?? ""}
              placeholder="ABCDE1234F"
              className="uppercase"
              maxLength={10}
              required
              aria-invalid={!!errors.pan}
            />
          </FormField>
          <FormField label="GSTIN" htmlFor="gstin" error={errors.gstin} hint="Optional">
            <Input
              id="gstin"
              name="gstin"
              defaultValue={kyc?.gstin ?? ""}
              className="uppercase"
              maxLength={15}
              aria-invalid={!!errors.gstin}
            />
          </FormField>
        </div>

        <FormField
          label="Tourism registration number"
          htmlFor="tourism_reg_no"
          error={errors.tourism_reg_no}
          hint="Your adventure tour operator registration with Uttarakhand or Himachal tourism."
        >
          <Input
            id="tourism_reg_no"
            name="tourism_reg_no"
            defaultValue={kyc?.tourism_reg_no ?? ""}
            required
            aria-invalid={!!errors.tourism_reg_no}
          />
        </FormField>
      </fieldset>

      {locked ? (
        <p className="text-sm text-muted-foreground">
          Your KYC is approved and locked. Contact us if something needs to change.
        </p>
      ) : (
        <>
          <FormAlert state={state} success="Submitted. We'll review it shortly." />
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : kyc?.submitted_at ? "Resubmit for review" : "Submit for review"}
          </Button>
        </>
      )}
    </form>
  );
}
