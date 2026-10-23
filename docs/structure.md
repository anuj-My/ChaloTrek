# Folder structure

```
src/
├─ app/                      # routes only, keep page.tsx thin
│  ├─ (marketing)/           # landing page, later SEO trek pages
│  ├─ (auth)/login/
│  ├─ o/[organizer]/[trek]/  # public booking link (dynamic, live seats)
│  ├─ (trekker)/my-bookings/
│  ├─ (organizer)/dashboard/ # organizer dashboard
│  ├─ (admin)/admin/         # admin panel
│  └─ api/webhooks/razorpay/ # bookings are confirmed here, never from the browser
├─ features/<area>/          # organizers, treks, batches, bookings, payments, auth, marketing
├─ components/
│  ├─ ui/                    # shadcn only, add via `npx shadcn add`
│  └─ shared/                # our own components used by more than one feature
├─ lib/                      # env, site-config, utils, supabase clients, later razorpay + email
└─ proxy.ts                  # refreshes the Supabase session (Next 16 name for middleware)
supabase/migrations/         # SQL schema + RLS policies
```

## Rules

- **Pages are thin.** `app/**/page.tsx` sets `metadata`, reads `params`, and renders one component from `features/`. No data fetching or markup beyond that.
- **Features are business areas, not pages.** One feature is used by several routes (e.g. `bookings` by the booking page, dashboard and admin).
- **Inside a feature**, add files as needed:
  - `components/` UI for this area
  - `queries.ts` reads (server only, `import "server-only"`)
  - `actions.ts` Server Actions (`"use server"`), always validate input with `schema.ts`
  - `schema.ts` zod schemas shared by forms and actions
  - `types.ts`
- **`features/marketing`** uses the section layout: `sections/<section>/<Section>.tsx`, composed in `Home.tsx`.
- **Features may import from `components/` and `lib/`**, and from another feature's `queries.ts`/`types.ts`, or its server-only side-effect helpers (e.g. `bookings/waitlist.ts`, called from batch actions when seats free up). Keep UI components inside their own feature.
- **Supabase clients:** `lib/supabase/server.ts` in Server Components and actions, `client.ts` in Client Components, `admin.ts` (bypasses RLS) only in trusted server code like webhooks.
- **Cache Components is on.** Request-time data (`params`, `cookies()`, DB reads) needs a `<Suspense>`/`loading.tsx` boundary or `"use cache"`.

## Database changes

1. Add a new file `supabase/migrations/<YYYYMMDDHHMMSS>_<what>.sql`. Never edit a migration that has already been run.
2. Run it in Supabase → SQL Editor (only the new file).
3. `npm run db:types` to regenerate `src/lib/supabase/database.types.ts` (needs `SUPABASE_ACCESS_TOKEN` in `.env.local`).

Money is integer paise. Computed columns (like `batches.seats_left`) must take one unnamed row argument, or the type generator leaves them out of `Row`.
