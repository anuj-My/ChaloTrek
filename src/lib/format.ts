// Display helpers. Money is stored as integer paise, dates as "YYYY-MM-DD".

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// 800000 → "₹8,000"
export function formatRupees(paise: number) {
  return rupees.format(paise / 100);
}

const dayMonth = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Date-only strings are parsed as UTC midnight, so format them in UTC too.
const parse = (date: string) => new Date(`${date}T00:00:00Z`);

// ("2026-12-12", "2026-12-17") → "12 Dec – 17 Dec 2026"
export function formatDateRange(start: string, end: string) {
  return `${dayMonth.format(parse(start))} – ${dayMonthYear.format(parse(end))}`;
}

// Today's date in India as "YYYY-MM-DD". Call only at request time (actions,
// or after another request-time read), since it reads the clock.
export function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

// ("2026-12-12", 5) → "2026-12-17"
export function addDays(date: string, days: number) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "2026-12-12" → "12 Dec 2026"
export function formatDate(date: string) {
  return dayMonthYear.format(parse(date));
}

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

// "2026-10-22T10:15:00Z" → "22 Oct, 3:45 pm" (India time)
export function formatDateTime(timestamp: string) {
  return dateTime.format(new Date(timestamp));
}
