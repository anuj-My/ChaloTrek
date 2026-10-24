"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { ActionButton } from "@/components/shared/ActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resizeImage } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";

import { addTrekPhotos, removeTrekPhoto, setCoverPhoto } from "../actions";
import { MAX_TREK_PHOTOS, TREK_PHOTOS_BUCKET, trekPhotoUrl } from "../photos";

type Props = { organizerId: string; trekId: string; photos: string[] };

// Uploads go straight from the browser to Supabase Storage (storage rules
// allow only this trek's folder), then a Server Action attaches the paths.
export function TrekPhotos({ organizerId, trekId, photos }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const remaining = MAX_TREK_PHOTOS - photos.length;
  const busy = !!progress || saving;

  async function upload(files: File[]) {
    setError(null);
    if (files.length > remaining) {
      setError(`You can add ${remaining} more photo${remaining === 1 ? "" : "s"} (up to ${MAX_TREK_PHOTOS}).`);
      return;
    }

    const supabase = createClient();
    const uploaded: string[] = [];
    const failed: string[] = [];
    for (const [i, file] of files.entries()) {
      setProgress(`Uploading ${i + 1} of ${files.length}…`);
      try {
        const blob = await resizeImage(file);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${organizerId}/${trekId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(TREK_PHOTOS_BUCKET)
          .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
        if (error) throw error;
        uploaded.push(path);
      } catch (e) {
        console.error("Photo upload failed:", e);
        failed.push(`${file.name} (${uploadErrorReason(e)})`);
      }
    }
    setProgress(null);

    if (uploaded.length) {
      startSaving(async () => {
        const result = await addTrekPhotos(trekId, uploaded);
        if (result.error) setError(result.error);
      });
    }
    if (failed.length) setError(`Couldn't upload ${failed.join(", ")}.`);
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-4">Photos</h2>
        <p className="text-sm text-muted-foreground">
          The first photo is the cover. Up to {MAX_TREK_PHOTOS} photos; they&apos;re resized for fast loading.
        </p>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((path, index) => (
            <li key={path} className="space-y-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={trekPhotoUrl(path)}
                  alt={`Trek photo ${index + 1}`}
                  fill
                  sizes="(min-width: 640px) 220px, 45vw"
                  className="object-cover"
                />
                {index === 0 && <Badge className="absolute top-2 left-2">Cover</Badge>}
              </div>
              <div className="flex flex-wrap gap-1">
                {index > 0 && (
                  <ActionButton action={setCoverPhoto} fields={{ trek_id: trekId, path }} variant="ghost">
                    Make cover
                  </ActionButton>
                )}
                <ActionButton
                  action={removeTrekPhoto}
                  fields={{ trek_id: trekId, path }}
                  variant="ghost"
                  confirm="Remove this photo?"
                >
                  Remove
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        // No HEIC here: leaving it out makes iPhones convert photos to JPEG.
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        aria-label="Choose photos"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow picking the same file again
          if (files.length) void upload(files);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={busy || remaining === 0} onClick={() => input.current?.click()}>
          {remaining === 0 ? "Photo limit reached" : "Add photos"}
        </Button>
        {(progress || saving) && (
          <span role="status" className="text-sm text-muted-foreground">
            {progress ?? "Saving…"}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

// A short, human reason for a failed upload, shown next to the file name.
function uploadErrorReason(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/bucket not found/i.test(message)) return "photo storage isn't set up yet";
  if (/row-level security|unauthorized|403/i.test(message)) return "not allowed; try logging in again";
  if (/payload too large|exceeded the maximum|413/i.test(message)) return "file too large";
  if (/decode|source image|InvalidStateError|EncodingError/i.test(message)) return "couldn't read this image";
  if (/fetch|network/i.test(message)) return "network problem, please retry";
  return message;
}
