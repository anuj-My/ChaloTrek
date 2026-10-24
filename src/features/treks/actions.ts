"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { notifyNewBatches } from "@/features/alerts/notify";
import { getMyOrganizer } from "@/features/organizers/queries";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { requestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

import { isOwnTrekPhotoPath, MAX_TREK_PHOTOS, TREK_PHOTOS_BUCKET } from "./photos";
import { addTrekPhotosSchema, trekPhotoSchema, trekSchema, trekStatusSchema } from "./schema";

const UNIQUE_VIOLATION = "23505";
const SLUG_TAKEN: FormState = {
  error: "Please fix the highlighted fields.",
  fieldErrors: { slug: "You already have a trek with this link." },
};

export async function createTrek(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const parsed = trekSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treks")
    .insert({ ...parsed.data, organizer_id: organizer.id })
    .select("id")
    .single();
  if (error?.code === UNIQUE_VIOLATION) return SLUG_TAKEN;
  if (error) {
    console.error("createTrek failed:", error);
    return { error: "Couldn't create the trek. Please try again." };
  }

  redirect(`/dashboard/treks/${data.id}`);
}

export async function updateTrek(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const trekId = formData.get("trek_id")?.toString() ?? "";
  const parsed = trekSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("treks")
    .select("slug, status")
    .eq("id", trekId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();
  if (!current) return { error: "Trek not found." };

  // The booking link is shared once published, so the slug stays fixed then.
  const values =
    current.status === "draft" ? parsed.data : { ...parsed.data, slug: current.slug };

  const { error } = await supabase.from("treks").update(values).eq("id", trekId);
  if (error?.code === UNIQUE_VIOLATION) return SLUG_TAKEN;
  if (error) {
    console.error("updateTrek failed:", error);
    return { error: "Couldn't save the trek. Please try again." };
  }

  refresh();
  return { ok: true };
}

export async function setTrekStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const organizer = await getMyOrganizer();
  if (!organizer) return { error: "Create your organizer profile first." };

  const parsed = trekStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("treks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.trek_id)
    .eq("organizer_id", organizer.id);
  if (error) {
    console.error("setTrekStatus failed:", error);
    return { error: "Couldn't change the status. Please try again." };
  }

  // Its batches are public now, so tell anyone following its destination.
  if (parsed.data.status === "published") {
    const origin = await requestOrigin();
    after(() => notifyNewBatches(parsed.data.trek_id, origin));
  }
  refresh();
  return { ok: true };
}

async function getOwnTrekPhotos(trekId: string) {
  const organizer = await getMyOrganizer();
  if (!organizer) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("treks")
    .select("id, photos")
    .eq("id", trekId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();
  return data && { organizer, trek: data, supabase };
}

// Called by the uploader after files are in storage: attaches their paths to
// the trek. Paths are checked so only files from this trek's folder get in.
export async function addTrekPhotos(trekId: string, paths: string[]): Promise<FormState> {
  // Arguments come straight from the browser, so check their shape too.
  const input = addTrekPhotosSchema.safeParse({ trekId, paths });
  if (!input.success) return { error: "Some photos couldn't be added." };

  const own = await getOwnTrekPhotos(trekId);
  if (!own) return { error: "Trek not found." };
  if (!paths.every((path) => isOwnTrekPhotoPath(path, own.organizer.id, trekId))) {
    return { error: "Some photos couldn't be added." };
  }
  const photos = [...new Set([...own.trek.photos, ...paths])];
  if (photos.length > MAX_TREK_PHOTOS) {
    return { error: `A trek can have up to ${MAX_TREK_PHOTOS} photos.` };
  }

  const { error } = await own.supabase.from("treks").update({ photos }).eq("id", trekId);
  if (error) {
    console.error("addTrekPhotos failed:", error);
    return { error: "Couldn't save the photos. Please try again." };
  }
  refresh();
  return { ok: true };
}

export async function removeTrekPhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = trekPhotoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };
  const { trek_id, path } = parsed.data;

  const own = await getOwnTrekPhotos(trek_id);
  if (!own) return { error: "Trek not found." };

  const { error } = await own.supabase
    .from("treks")
    .update({ photos: own.trek.photos.filter((p) => p !== path) })
    .eq("id", trek_id);
  if (error) {
    console.error("removeTrekPhoto failed:", error);
    return { error: "Couldn't remove the photo. Please try again." };
  }
  // The trek no longer shows it, so a failed file delete only leaves an orphan.
  if (isOwnTrekPhotoPath(path, own.organizer.id, trek_id)) {
    const { error: storageError } = await own.supabase.storage.from(TREK_PHOTOS_BUCKET).remove([path]);
    if (storageError) console.error("removeTrekPhoto storage cleanup failed:", storageError);
  }
  refresh();
  return { ok: true };
}

export async function setCoverPhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = trekPhotoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something went wrong. Please refresh and try again." };
  const { trek_id, path } = parsed.data;

  const own = await getOwnTrekPhotos(trek_id);
  if (!own || !own.trek.photos.includes(path)) return { error: "Photo not found." };

  const photos = [path, ...own.trek.photos.filter((p) => p !== path)];
  const { error } = await own.supabase.from("treks").update({ photos }).eq("id", trek_id);
  if (error) {
    console.error("setCoverPhoto failed:", error);
    return { error: "Couldn't change the cover. Please try again." };
  }
  refresh();
  return { ok: true };
}
