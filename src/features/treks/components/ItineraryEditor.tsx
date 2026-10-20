"use client";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ItineraryDay } from "../schema";

// Day-by-day rows, submitted as one hidden JSON field named "itinerary".
export function ItineraryEditor({ initial, error }: { initial: ItineraryDay[]; error?: string }) {
  const [days, setDays] = useState<ItineraryDay[]>(initial);

  const update = (index: number, patch: Partial<ItineraryDay>) =>
    setDays((all) => all.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  const move = (index: number, by: -1 | 1) =>
    setDays((all) => {
      const next = [...all];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  return (
    <div className="space-y-3">
      <input type="hidden" name="itinerary" value={JSON.stringify(days)} />
      {days.length === 0 && (
        <p className="text-sm text-muted-foreground">No days yet. Add what happens on each day.</p>
      )}
      <ol className="space-y-3">
        {days.map((day, index) => (
          <li key={index} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-sm font-medium">Day {index + 1}</span>
              <Input
                aria-label={`Day ${index + 1} title`}
                value={day.title}
                onChange={(e) => update(index, { title: e.target.value })}
                placeholder="Dehradun to Sankri"
              />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUpIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={index === days.length - 1} onClick={() => move(index, 1)}>
                <ArrowDownIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove day ${index + 1}`} onClick={() => setDays((all) => all.filter((_, i) => i !== index))}>
                <Trash2Icon />
              </Button>
            </div>
            <Textarea
              aria-label={`Day ${index + 1} description`}
              rows={2}
              value={day.description}
              onChange={(e) => update(index, { description: e.target.value })}
              placeholder="210 km drive, about 8 hours. Overnight in a guesthouse."
            />
          </li>
        ))}
      </ol>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="button" variant="outline" size="sm" onClick={() => setDays((all) => [...all, { title: "", description: "" }])}>
        Add day
      </Button>
    </div>
  );
}
