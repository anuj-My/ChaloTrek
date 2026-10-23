"use server";

import { refresh } from "next/cache";

import { getMyOrganizer } from "@/features/organizers/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

import { couponActiveSchema, couponIdSchema, couponSchema } from "./schema";

const UNIQUE_VIOLATION = "23505";

// RLS limits every write to the organizer's own coupons and treks.

export async function createCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Set up your organizer profile first." };

  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({ ...parsed.data, organizer_id: organizer.id });
  if (error?.code === UNIQUE_VIOLATION) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { code: "You already have a coupon with this code" } };
  }
  if (error) {
    console.error("createCoupon failed:", error);
    return { error: "Couldn't add the coupon. Please try again." };
  }

  refresh();
  return { ok: true };
}

// Pauses a coupon (it stops working on new bookings) or turns it back on.
export async function setCouponActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = couponActiveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("coupons")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.coupon_id);
  if (error) {
    console.error("setCouponActive failed:", error);
    return { error: "Couldn't change the coupon. Please try again." };
  }

  refresh();
  return { ok: true };
}

// Bookings that used it keep their discount.
export async function deleteCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = couponIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", parsed.data.coupon_id);
  if (error) {
    console.error("deleteCoupon failed:", error);
    return { error: "Couldn't delete the coupon. Please try again." };
  }

  refresh();
  return { ok: true };
}
