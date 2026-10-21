// Trek photo helpers shared by server and client code. treks.photos stores
// storage paths ("<organizer_id>/<trek_id>/<uuid>.webp" or .jpg), first one = cover.

import { env } from "@/lib/env";

export const TREK_PHOTOS_BUCKET = "trek-photos";
export const MAX_TREK_PHOTOS = 12;

export function trekPhotoUrl(path: string) {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${TREK_PHOTOS_BUCKET}/${path}`;
}

// The only paths an organizer may attach to a trek: files directly inside
// that trek's own folder, named the way the uploader names them.
export function isOwnTrekPhotoPath(path: string, organizerId: string, trekId: string) {
  const prefix = `${organizerId}/${trekId}/`;
  return path.startsWith(prefix) && /^[0-9a-f-]{36}\.(webp|jpg)$/.test(path.slice(prefix.length));
}
