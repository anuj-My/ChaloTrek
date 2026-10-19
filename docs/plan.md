# Trek Booking Platform: Full Plan

> Brand: **Chalo Trek** (chalotrek.in)
> Region: Himachal Pradesh & Uttarakhand to start
> Date written: Oct 2026

---

## 1. The idea in one line

A **free booking and payment tool for Instagram trek organizers**. Once enough organizers use it, it becomes a **public marketplace** where trekkers can compare batches and book in one place.

**Why this order:**
Trekias (trekias.com) already compares treks, but nobody can book there, and it earns nothing. A marketplace that starts by chasing customers runs into two problems:
1. **Chicken-and-egg:** customers won't come with no listings, and organizers won't list with no customers.
2. **Booking around you:** a customer finds a trek on your site, then DMs the organizer and pays on UPI to skip your fee.

If organizers *use your tool to run their own business*, both problems shrink. They send their own customers to your booking page, and every batch they add becomes a listing for the marketplace later.

---

## 2. Who it's for

| User | Their pain today | What you give them |
|---|---|---|
| **Organizer** (small Instagram trek company, 2–10 people) | Bookings run on WhatsApp + Google Sheets + UPI screenshots. Manual seat counting, chasing payments, collecting IDs/medical forms by hand. | A booking link for their Instagram bio, online payments, automatic seat tracking, a participant list, confirmations. |
| **Trekker** (18–35, metro city, weekend or 4–7 day treks) | DMs 5 organizers, waits for replies, can't compare, worries about getting scammed when paying a stranger on UPI. | Clear prices, real seat availability, verified organizers, safe payment, a receipt, a clear refund policy. |

---

## 3. Phases (start to finish)

### Phase 0: Validate before coding (Weeks 1–2), cost ≈ ₹0

Goal: prove organizers want this before spending money or time.

- [ ] Make a list of **50 organizers** on Instagram (search `#kedarkanthatrek`, `#himachaltrek`, `#trekkingindia`, `#weekendtrek`, plus reels about Triund, Kedarkantha, Hampta Pass, Brahmatal, Kheerganga).
- [ ] DM them and try to get **10–15 on a 15-minute call**. Questions to ask:
  1. How do you take bookings and payments right now?
  2. How many bookings a month in peak season? Off-season?
  3. What's the most annoying part of managing a batch?
  4. How often do people cancel or not pay? How do you handle refunds?
  5. Are you registered with Uttarakhand/Himachal tourism? GST registered?
  6. Would you use a free booking page that takes payment online, with a 3–5% fee per booking?
  7. What would make you *not* use it?
- [ ] Also ask **10–20 trekkers** (friends, Reddit r/IndiaTravel, trek WhatsApp groups) how they pick an organizer and what scares them about paying.

**Go / no-go:**
- ✅ Go if **5+ organizers** say "yes, I'd try it," and ideally 2–3 say "set it up for my next batch."
- ❌ If most say "WhatsApp is fine," change the angle (e.g. a lead-generation marketplace instead of a booking tool) before building.

---

### Phase 1: Run it by hand (Weeks 3–4), cost ≈ ₹1,000–5,000

Goal: run real bookings with no code, to learn the actual workflow.

- [ ] Pick **3–5 organizers** from Phase 0.
- [ ] For their next batch, handle bookings with:
  - A simple landing page (Carrd/Notion/Google Sites) for each batch
  - A **Razorpay Payment Page** or payment link for collecting money
  - A Google Form for participant details (name, age, emergency contact, medical info, ID)
- [ ] Track everything: how many people booked, where they came from, what questions they asked, and what broke.
- [ ] Register the business (see Section 7) so Razorpay can activate.

You'll learn the refund/cancellation edge cases, which fields organizers actually need, and whether trekkers trust paying online.

---

### Phase 2: Build the MVP (Weeks 5–10), cost ≈ ₹2,000–5,000/month

Goal: replace the manual setup with your own product.

**MVP features (only these):**

*Organizer side*
- [ ] Sign up + KYC (business name, PAN, bank account, GST if any, tourism registration number)
- [ ] Create a trek (name, region, difficulty, days, altitude, itinerary, inclusions/exclusions, photos)
- [ ] Create batches (dates, price, total seats, deposit amount or full payment)
- [ ] Shareable booking link: `chalotrek.in/o/himalayan-hikers/kedarkantha-dec-12`
- [ ] Dashboard: bookings for each batch, seats left, amount collected, participant list (export to Excel)
- [ ] Choose a cancellation policy (pick from 3 standard templates)

*Trekker side*
- [ ] Booking page: trek details, batch dates, seats left, price
- [ ] Book: number of people, participant details, pay (UPI/card/netbanking via Razorpay)
- [ ] Confirmation email + WhatsApp message with booking ID
- [ ] "My bookings" page (login with email OTP or Google)

*Admin (you)*
- [ ] Approve organizers (manual KYC check)
- [ ] See all bookings and payments
- [ ] Issue refunds

**Leave out of the MVP:** reviews, public search, chat, coupons, mobile app, multi-language, AI anything.

---

### Phase 3: Grow organizers (Months 3–6)

Goal: **30–50 active organizers**, **200+ bookings/month** in peak season.

- [ ] Onboard organizers personally (DM → call → set up their first batch for them)
- [ ] Referral: an organizer who brings another organizer gets 1 month at 0% fee
- [ ] Add features organizers ask for most (likely: deposit + balance reminders, WhatsApp group auto-invite, waitlist, coupon codes)
- [ ] Collect **verified reviews** (only people who actually booked can review)

---

### Phase 4: Open the public marketplace (Months 6–12)

Goal: become the place trekkers go to compare and book.

- [ ] Public search: by trek, region, month, price, difficulty, duration
- [ ] Trek comparison pages (e.g. "Kedarkantha: 14 organizers, ₹6,500–₹14,000, batches this month"). This is what Trekias does, but with live seats and a Book button
- [ ] SEO pages for every popular trek ("Kedarkantha trek December 2026 price"). This will become your biggest free source of traffic
- [ ] "Verified organizer" badge (tourism registration + KYC + reviews)
- [ ] Your own Instagram/YouTube content: trek guides, price comparisons, "which organizer for Hampta Pass"

**Pricing at this stage:**
- Booking via the organizer's own link → **3–5%**
- Booking that came from *your* marketplace → **8–12%** (you brought the customer)
- Optional paid "Featured" listing: ₹999–2,999/month

---

## 4. Tech stack

Picked to be **cheap, fast to build alone, and easy to grow**.

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | **Next.js (App Router) + TypeScript** | One codebase for pages + API, great SEO (needed for Phase 4), huge community |
| UI | **Tailwind CSS + shadcn/ui** | Looks good fast, no designer needed |
| Database | **Supabase (PostgreSQL)** | Free tier, built-in auth, file storage, row-level security |
| Auth | **Supabase Auth**: email OTP + Google login | Free. Add phone OTP later via MSG91 (needs DLT registration) |
| Payments | **Razorpay** + **Razorpay Route** | Most common in India, UPI support, Route sends money straight to the organizer's bank account and only your commission to you |
| Images | **Supabase Storage** (or Cloudinary free tier) | Trek photos, organizer logos |
| Email | **Resend** (free 3,000/month) | Booking confirmations |
| WhatsApp | **Interakt / AiSensy / Gupshup** (WhatsApp Business API) | Confirmations + reminders. Add in Phase 3, not day one |
| Hosting | **Vercel** | Deploys straight from GitHub. Hobby plan is non-commercial, so move to Pro when you start charging |
| Analytics | **PostHog** (free tier) or Google Analytics | See where users drop off |
| Error tracking | **Sentry** (free tier) | Know when payments break |
| Domain | `.in` or `.com` from Namecheap/GoDaddy/Hostinger | |

### Core database tables

```
organizers      id, name, slug, owner_user_id, phone, email, pan, gstin,
                tourism_reg_no, razorpay_account_id, kyc_status, created_at

treks           id, organizer_id, name, slug, region, difficulty, days,
                max_altitude_m, itinerary (json), inclusions, exclusions,
                photos, cancellation_policy_id

batches         id, trek_id, start_date, end_date, price, total_seats,
                seats_booked, deposit_amount, status (open/full/cancelled)

bookings        id, batch_id, user_id, num_people, total_amount, paid_amount,
                status (pending/confirmed/cancelled/refunded), source
                (organizer_link / marketplace), created_at

participants    id, booking_id, name, age, gender, phone, emergency_contact,
                medical_notes, id_proof_url

payments        id, booking_id, razorpay_order_id, razorpay_payment_id,
                amount, platform_fee, status, created_at

refunds         id, payment_id, amount, reason, status

reviews         id, booking_id, organizer_id, rating, text   (Phase 3)
```

### Payment flow (Razorpay Route)

```
Trekker clicks "Pay ₹8,000"
  → Your server creates a Razorpay Order with a "transfer" rule:
        ₹7,600 → organizer's linked account
        ₹400   → stays with you (5% commission)
  → Trekker pays via UPI/card
  → Razorpay webhook → your server marks booking CONFIRMED,
    reduces seats, sends email/WhatsApp
  → Organizer receives money on Razorpay's settlement cycle
```

**Important:**
- Lock the seat for ~10 minutes while the person pays, so two people can't book the last seat.
- **Always confirm bookings from the webhook**, never from the browser redirect.
- You never hold the organizer's money yourself, which keeps you out of most payment-regulation trouble.

---

## 5. Money: what it costs to run

> Prices are approximate (late 2026, ~₹88 per USD). Check current pricing before paying for anything.

### One-time costs

| Item | Cost |
|---|---|
| Domain (.in or .com, 1 year) | ₹600 – ₹1,200 |
| Sole proprietorship setup + GST registration (via a CA) | ₹2,000 – ₹5,000 |
| Udyam (MSME) registration | Free |
| Terms of Service, Privacy Policy, Organizer Agreement, Refund Policy (lawyer review) | ₹5,000 – ₹15,000 |
| Logo / basic branding (Canva yourself, or freelancer) | ₹0 – ₹3,000 |
| **Total one-time** | **≈ ₹8,000 – ₹25,000** |

*(Converting to a Private Limited company later: ₹8,000–₹15,000 plus yearly compliance of ~₹15,000–₹30,000. Only do this when revenue is real or you raise money.)*

### Monthly costs by stage

| Item | Phase 0–1 (validate) | Phase 2 (MVP, few users) | Phase 3–4 (growing) |
|---|---|---|---|
| Vercel hosting | ₹0 | ₹0 → ₹1,800 (Pro, once commercial) | ₹1,800 |
| Supabase | ₹0 | ₹0 (free tier) | ₹2,200 (Pro) |
| Email (Resend) | ₹0 | ₹0 | ₹0 – ₹1,800 |
| WhatsApp API (provider + messages) | ₹0 | ₹0 | ₹1,500 – ₹4,000 |
| Domain (spread monthly) | ₹100 | ₹100 | ₹100 |
| Analytics / Sentry | ₹0 | ₹0 | ₹0 |
| CA for GST filing | ₹0 | ₹500 – ₹1,500 | ₹1,000 – ₹2,000 |
| Instagram ads / marketing (optional) | ₹0 | ₹0 – ₹5,000 | ₹5,000 – ₹20,000 |
| **Total / month** | **≈ ₹100** | **≈ ₹600 – ₹8,000** | **≈ ₹11,000 – ₹32,000** |

### Per-transaction costs

| Item | Cost |
|---|---|
| Razorpay payment gateway | ~2% per transaction (UPI may be lower; check current rates) + 18% GST on that fee |
| Razorpay Route transfer fee | Check the Razorpay pricing page (small % per transfer) |

**Decide early:** does the trekker pay the gateway fee as a "convenience fee," or do you/the organizer absorb it? Most Indian platforms show a small convenience fee to the trekker.

---

## 6. How you make money: the numbers

### Example booking
- Trek price: ₹8,000
- Your commission (5%): **₹400**
- Gateway (~2% + GST ≈ 2.4% of ₹8,000): −₹190 *(if you absorb it)*
- **Your net: ≈ ₹210 per booking** (≈ ₹400 if the trekker pays a convenience fee)

### Monthly revenue scenarios (peak season)

| Stage | Active organizers | Bookings/month | Avg ticket | Commission | Net revenue/month |
|---|---|---|---|---|---|
| Early | 10 | 80 | ₹7,000 | 5% | ≈ ₹15,000 – ₹28,000 |
| Growing | 40 | 400 | ₹8,000 | 5–8% | ≈ ₹1.2L – ₹2.5L |
| Strong | 150 | 2,000 | ₹9,000 | 6–10% | ≈ ₹8L – ₹15L |

**Seasonality warning:** treks peak around **Apr–Jun** and **Oct–Feb** (winter snow treks like Kedarkantha/Brahmatal). **Jul–Sep (monsoon)** is very slow in Uttarakhand/Himachal. Plan cash flow for 2–3 dead months, and look at adding Ladakh/Spiti (monsoon season) or weekend getaways/camping to fill the gap.

**Break-even:** at ~₹15,000/month running costs (excluding ads), you need about **50–70 bookings/month**, which is roughly 10–15 active organizers.

---

## 7. Legal & compliance checklist

- [ ] **Business registration:** sole proprietorship to start (needs PAN + bank current account), with GST registration
- [ ] **GST:** charge 18% GST on *your commission*. Tour operator GST (5%) is the organizer's responsibility. Have a CA confirm the exact treatment for your model
- [ ] **TCS/TDS for e-commerce operators:** marketplaces may have to collect TCS under GST (Sec 52) and deduct TDS under Income Tax (Sec 194-O). **Ask a CA before launch**
- [ ] **Terms of Service** that say clearly: *you are a technology platform, not the trek operator; the organizer is responsible for safety, permits and execution*
- [ ] **Organizer Agreement:** they confirm valid registration, insurance, trained leaders, first-aid, and accept the refund rules
- [ ] **Organizer verification:** collect PAN, bank, and **state adventure-tourism registration** (Uttarakhand and Himachal both have registration rules for adventure tour operators)
- [ ] **Privacy Policy** compliant with India's **DPDP Act**: you store IDs and medical info, so collect only what's needed and keep it secure
- [ ] **Refund/cancellation policy** shown on every booking page *before* payment
- [ ] Recommend or offer **trek insurance** to trekkers later (partnership opportunity)

---

## 8. Problems you will face (and what to do)

| Problem | What to do |
|---|---|
| Organizers and trekkers book around you on WhatsApp/UPI | Keep the fee low on organizer-link bookings; make the dashboard so useful that skipping it costs them time; offer trekkers protection (refund guarantee if the organizer cancels) only on platform bookings |
| Organizers don't update seats/prices | Seats update automatically on every booking; send weekly "update your batches" reminders; hide batches with stale data |
| Weather cancellations and refunds | Standard policies; organizer chooses refund or reschedule; you handle disputes by your written rules |
| Accident or death on a trek | Strong ToS, verified organizers only, require organizer insurance info; never market yourself as the operator |
| Fake or bad organizers | Manual KYC, registration check, verified reviews, remove organizers after repeated complaints |
| Monsoon dead season | Add Ladakh/Spiti, camping, weekend getaways; use the slow months to build features and SEO content |
| Big player copies you (Thrillophilia etc.) | Go deep where they're weak: small Instagram organizers, tools for organizers, community, cheaper fees |
| Slow organizer adoption | Set everything up for them, 0% fee for the first 2–3 months, go to them in person (Rishikesh, Manali, Dehradun) |

---

## 9. Timeline at a glance

| When | Milestone |
|---|---|
| Weeks 1–2 | 50 organizers contacted, 10–15 interviews, go/no-go |
| Weeks 3–4 | Business registered, 3–5 organizers running bookings by hand |
| Weeks 5–10 | MVP built and live with first organizers |
| Month 3 | 10 active organizers, first ₹ revenue |
| Month 6 | 30–50 organizers, reviews live, WhatsApp automation |
| Months 6–12 | Public marketplace + SEO trek pages, 100+ organizers |

**Target the winter season (Dec–Feb: Kedarkantha, Brahmatal, Dayara Bugyal) for the first real launch.** It's a high-volume, beginner-friendly peak.

---

## 10. Metrics to track

- **Organizers:** signed up → completed KYC → created first batch → got first booking → still active after 30 days
- **Bookings/month** and **GMV** (total booking value)
- **Booking source:** organizer link vs. marketplace (this decides which commission you earn)
- **Conversion rate:** booking page views → payments
- **Refund/cancellation rate**
- **Revenue/month** vs. **cost/month**

---

## 11. This week's to-do

1. [ ] Pick a working name + check that a `.in` domain is free
2. [ ] Make a spreadsheet of 50 Himachal/Uttarakhand organizers (Instagram handle, followers, treks, contact)
3. [ ] Send DMs, aim for 10 calls
4. [ ] Write down every answer, and look for the pain that comes up most
5. [ ] Talk to a CA about sole proprietorship + GST + marketplace TCS/TDS
