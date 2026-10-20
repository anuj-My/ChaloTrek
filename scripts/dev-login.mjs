// Prints a one-time login link for local testing, without sending an email.
//   npm run dev:login -- you@example.com [/next-path]
// Creates the user if they don't exist. Needs SUPABASE_SECRET_KEY in .env.local.
import { createClient } from "@supabase/supabase-js";

const [email, next = "/dashboard"] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npm run dev:login -- you@example.com [/next-path]");
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: secretKey } = process.env;
if (!url || !secretKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  // Usually means the user doesn't exist yet.
  await supabase.auth.admin.createUser({ email, email_confirm: true });
  ({ data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email }));
}
if (error) {
  console.error("Couldn't create a login link:", error.message);
  process.exit(1);
}

const link = new URL("http://localhost:3000/auth/confirm");
link.searchParams.set("token_hash", data.properties.hashed_token);
link.searchParams.set("type", "magiclink");
link.searchParams.set("next", next);
console.log(`\nLogin link for ${email} (works once, expires in 1 hour):\n\n${link}\n`);
