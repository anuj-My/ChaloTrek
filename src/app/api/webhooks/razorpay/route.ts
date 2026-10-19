// Razorpay sends payment events here. Bookings are confirmed only from this
// webhook, never from the browser redirect (see docs/plan.md, section 4).
export async function POST() {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
