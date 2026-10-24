"use client";

import { useState } from "react";

import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { addDays, formatDate, formatDateRange, formatRupees } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";

import { createBatch, updateBatch } from "../actions";
import { MAX_REPEATS, REPEAT_OPTIONS, repeatDates } from "../schema";

type Batch = {
  id: string;
  start_date: string;
  end_date: string;
  price_paise: number;
  deposit_paise: number | null;
  total_seats: number;
};

type Props = {
  trekId: string;
  durationDays: number;
  batch?: Batch;
  // When adding: the trek's other batches, to copy price, deposit and seats from.
  templates?: Batch[];
};

// Adds a batch when `batch` is missing, otherwise edits it. Picking a start
// date fills in the end date from the trek's length until it's set by hand.
// A new batch starts from the latest existing one's price and seats, and can
// repeat every week or two.
export function BatchForm({ trekId, durationDays, batch, templates = [] }: Props) {
  const [state, onSubmit, pending] = useFormAction(batch ? updateBatch : createBatch);
  const [start, setStart] = useState(batch?.start_date ?? "");
  const [end, setEnd] = useState(batch?.end_date ?? "");
  const [endEdited, setEndEdited] = useState(!!batch);
  const errors = state.fieldErrors ?? {};
  const shownEnd = endEdited || !start ? end : addDays(start, durationDays - 1);
  const idPrefix = batch ? `batch-${batch.id}` : "new-batch";
  const [templateId, setTemplateId] = useState(templates.at(-1)?.id ?? "");
  const template = batch ?? templates.find((t) => t.id === templateId);
  const [repeat, setRepeat] = useState<(typeof REPEAT_OPTIONS)[number]["value"]>("once");
  const [repeatCount, setRepeatCount] = useState(4);
  const repeatDays = REPEAT_OPTIONS.find((o) => o.value === repeat)?.days ?? 0;
  const planned = start && shownEnd && repeatDays ? repeatDates(start, shownEnd, repeatDays, repeatCount) : [];

  // After adding a batch, clear the form for the next one. Remounting the
  // fields (via `fieldsKey`) also clears the uncontrolled price/seat inputs.
  const [handled, setHandled] = useState(state);
  const [fieldsKey, setFieldsKey] = useState(0);
  if (state !== handled) {
    setHandled(state);
    if (state.ok && !batch) {
      setStart("");
      setEnd("");
      setEndEdited(false);
      setRepeat("once");
      setFieldsKey((k) => k + 1);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="trek_id" value={trekId} />
      {batch && <input type="hidden" name="batch_id" value={batch.id} />}

      {!batch && templates.length > 0 && (
        <FormField label="Copy price and seats from" htmlFor="new-batch-template">
          <NativeSelect
            id="new-batch-template"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              // Remount the uncontrolled inputs so they pick up the new defaults.
              setFieldsKey((k) => k + 1);
            }}
            className="w-full"
          >
            <NativeSelectOption value="">Nothing, start blank</NativeSelectOption>
            {templates.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {formatDateRange(t.start_date, t.end_date)} · {formatRupees(t.price_paise)} · {t.total_seats} seats
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      )}

      <div key={fieldsKey} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" htmlFor={`${idPrefix}-start`} error={errors.start_date}>
          <Input id={`${idPrefix}-start`} name="start_date" type="date" value={start} onChange={(e) => setStart(e.target.value)} required aria-invalid={!!errors.start_date} />
        </FormField>
        <FormField label="End date" htmlFor={`${idPrefix}-end`} error={errors.end_date}>
          <Input
            id={`${idPrefix}-end`}
            name="end_date"
            type="date"
            value={shownEnd}
            min={start || undefined}
            onChange={(e) => {
              setEndEdited(true);
              setEnd(e.target.value);
            }}
            required
            aria-invalid={!!errors.end_date}
          />
        </FormField>
        <FormField label="Price per person (₹)" htmlFor={`${idPrefix}-price`} error={errors.price}>
          <Input id={`${idPrefix}-price`} name="price" type="number" inputMode="numeric" min={100} defaultValue={template ? template.price_paise / 100 : ""} placeholder="8000" required aria-invalid={!!errors.price} />
        </FormField>
        <FormField label="Deposit per person (₹)" htmlFor={`${idPrefix}-deposit`} error={errors.deposit} hint="Optional. Leave empty to take full payment upfront.">
          <Input id={`${idPrefix}-deposit`} name="deposit" type="number" inputMode="numeric" min={100} defaultValue={template?.deposit_paise ? template.deposit_paise / 100 : ""} aria-invalid={!!errors.deposit} />
        </FormField>
        <FormField label="Total seats" htmlFor={`${idPrefix}-seats`} error={errors.total_seats}>
          <Input id={`${idPrefix}-seats`} name="total_seats" type="number" inputMode="numeric" min={1} max={200} defaultValue={template?.total_seats ?? ""} placeholder="20" required aria-invalid={!!errors.total_seats} />
        </FormField>
      </div>

      {!batch && (
        <div className="space-y-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Repeat" htmlFor="new-batch-repeat">
              <NativeSelect
                id="new-batch-repeat"
                name="repeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as typeof repeat)}
                className="w-full"
              >
                {REPEAT_OPTIONS.map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            {repeat !== "once" && (
              <FormField label="Number of batches" htmlFor="new-batch-count" error={errors.repeat_count}>
                <NativeSelect
                  id="new-batch-count"
                  name="repeat_count"
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Number(e.target.value))}
                  className="w-full"
                >
                  {Array.from({ length: MAX_REPEATS - 1 }, (_, i) => (
                    <NativeSelectOption key={i + 2} value={i + 2}>
                      {i + 2} batches
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
            )}
          </div>
          {planned.length > 1 && (
            <p className="text-sm text-muted-foreground">
              Adds {planned.length} batches, starting {planned.map((d) => formatDate(d.start_date)).join(", ")}. Dates
              that already have a batch are skipped.
            </p>
          )}
        </div>
      )}

      <FormAlert state={state} success={batch ? "Saved." : "Batch added."} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : batch ? "Save batch" : planned.length > 1 ? `Add ${planned.length} batches` : "Add batch"}
      </Button>
    </form>
  );
}
