"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/site-config";
import { cleanSourceTag, MARKETPLACE_TAG } from "@/lib/source-tag";

const SUGGESTIONS = ["insta-bio", "insta-story", "reel", "whatsapp", "facebook"];

// Builds chalotrek.in/o/<slug>?src=<tag> to copy.
export function TrackedLinkBuilder({ organizerSlug }: { organizerSlug: string }) {
  const [raw, setRaw] = useState("insta-bio");
  const [copied, setCopied] = useState(false);
  const tag = cleanSourceTag(raw);
  const reserved = tag === MARKETPLACE_TAG;
  const link = tag && !reserved ? `${siteConfig.url}/o/${organizerSlug}?src=${tag}` : null;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Button key={s} type="button" size="sm" variant={s === tag ? "default" : "outline"} onClick={() => setRaw(s)}>
            {s}
          </Button>
        ))}
      </div>
      <div className="space-y-1">
        <label htmlFor="tracked-tag" className="text-sm font-medium">
          Tag
        </label>
        <Input
          id="tracked-tag"
          value={raw}
          onChange={(e) => setRaw(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          maxLength={40}
          className="max-w-xs"
          aria-invalid={!!raw && !link}
        />
        {raw && !tag && (
          <p className="text-sm text-destructive">Use letters, numbers, hyphens and underscores only.</p>
        )}
        {reserved && <p className="text-sm text-destructive">This tag is reserved for Chalo Trek&apos;s own pages.</p>}
      </div>
      {link && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-sm break-all select-all">{link}</code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Tags work on any of your links: add <code>?src=tag</code> to a trek&apos;s link too.
      </p>
    </div>
  );
}
