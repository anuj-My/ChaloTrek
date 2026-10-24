import Link from "next/link";

import { TrekCard } from "@/components/shared/TrekCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { todayInIndia } from "@/lib/format";

import { listLiveDestinations } from "@/features/destinations/queries";

import { listPublicTreks, type PublicTrekListing } from "../queries";
import { REGIONS } from "../schema";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DIFFICULTIES = ["easy", "moderate", "difficult", "challenging"] as const;

const LENGTHS = {
  short: { label: "Weekend (1–3 days)", min: 1, max: 3 },
  week: { label: "4–7 days", min: 4, max: 7 },
  long: { label: "8+ days", min: 8, max: Infinity },
} as const;

const BUDGETS = [5000, 10000, 15000, 20000];

const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

// The next 12 months as ["2026-10", "October 2026"], starting this month.
function upcomingMonths(today: string) {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 + i, 1));
    return [d.toISOString().slice(0, 7), monthLabel.format(d)] as const;
  });
}

type Filters = { region?: string; month?: string; difficulty?: string; length?: string; budget?: string };

function matches(trek: PublicTrekListing, f: Filters) {
  if (f.region && trek.region !== f.region) return false;
  if (f.difficulty && trek.difficulty !== f.difficulty) return false;
  const length = f.length && LENGTHS[f.length as keyof typeof LENGTHS];
  if (length && (trek.duration_days < length.min || trek.duration_days > length.max)) return false;
  // Month and budget need a batch you can book that fits both.
  if (f.month || f.budget) {
    const maxPaise = f.budget ? Number(f.budget) * 100 : Infinity;
    return trek.bookable.some(
      (b) => (!f.month || b.start_date.startsWith(f.month)) && b.price_paise <= maxPaise,
    );
  }
  return true;
}

// Every live trek across organizers, filtered by the query string. The
// filters are a plain GET form, so they work without JavaScript and the URL
// can be shared.
export async function ExploreTreks({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pick = (key: string) => (typeof params[key] === "string" && params[key]) || undefined;
  const filters: Filters = {
    region: pick("region"),
    month: pick("month"),
    difficulty: pick("difficulty"),
    length: pick("length"),
    budget: pick("budget"),
  };
  const filtered = Object.values(filters).some(Boolean);

  const [allTreks, destinations] = await Promise.all([listPublicTreks(), listLiveDestinations()]);
  const treks = allTreks.filter((trek) => matches(trek, filters));
  const months = upcomingMonths(todayInIndia());

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="type-1">Explore treks</h1>
        <p className="lead max-w-2xl">
          Compare treks from verified organizers, with real dates, prices and seats left.
        </p>
      </div>

      {destinations.length > 0 && (
        <nav aria-label="Compare a trek" className="space-y-2">
          <p className="text-sm font-medium">Compare organizers for a trek</p>
          <ul className="flex flex-wrap gap-2">
            {destinations.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/treks/${d.slug}`}
                  className="inline-block rounded-full border px-3 py-1 text-sm hover:bg-muted"
                >
                  {d.name}
                  <span className="text-muted-foreground"> · {d.organizers}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <form method="get" className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3 lg:grid-cols-6">
        <Filter name="region" label="Region" value={filters.region} options={REGIONS.map((r) => [r, r])} />
        <Filter name="month" label="Month" value={filters.month} options={months} />
        <Filter
          name="difficulty"
          label="Difficulty"
          value={filters.difficulty}
          options={DIFFICULTIES.map((d) => [d, d[0].toUpperCase() + d.slice(1)])}
        />
        <Filter
          name="length"
          label="Length"
          value={filters.length}
          options={Object.entries(LENGTHS).map(([key, l]) => [key, l.label])}
        />
        <Filter
          name="budget"
          label="Budget"
          value={filters.budget}
          options={BUDGETS.map((b) => [String(b), `Up to ₹${b.toLocaleString("en-IN")}`])}
        />
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            Search
          </Button>
          {filtered && (
            <Link href="/treks" className={buttonVariants({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {treks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No treks match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another month or region, or{" "}
            <Link href="/treks" className="underline underline-offset-4">
              see every trek
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {treks.length} {treks.length === 1 ? "trek" : "treks"}
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {treks.map((trek) => (
              <li key={trek.id}>
                <TrekCard
                  trek={trek}
                  href={`/o/${trek.organizers.slug}/${trek.slug}`}
                  organizer={trek.organizers}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Filter({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <NativeSelect name={name} defaultValue={value ?? ""} className="w-full">
        <NativeSelectOption value="">Any</NativeSelectOption>
        {options.map(([optionValue, optionLabel]) => (
          <NativeSelectOption key={optionValue} value={optionValue}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
