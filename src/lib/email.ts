import "server-only";

import { siteConfig } from "@/lib/site-config";

// Sends transactional email through Resend's HTTP API. Without RESEND_API_KEY
// (local dev, or before the Resend account exists) emails are logged instead.
// Sending never throws: a failed email is logged and must not break a booking.

export type EmailContent = {
  heading: string;
  paragraphs: string[];
  rows?: [label: string, value: string][];
  buttons?: { label: string; url: string }[];
};

export type Email = {
  to: string;
  subject: string;
  replyTo?: string | null;
  content: EmailContent;
};

export async function sendEmail({ to, subject, replyTo, content }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const { html, text } = renderEmail(content);

  if (!apiKey) {
    console.info(`[email not sent: RESEND_API_KEY is not set]\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  const body = JSON.stringify({
    from: process.env.EMAIL_FROM || `${siteConfig.name} <bookings@chalotrek.in>`,
    to: [to],
    subject,
    html,
    text,
    ...(replyTo && { reply_to: replyTo }),
  });
  const post = () =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body,
    });

  try {
    let response = await post();
    // Resend allows a few requests a second; batches of emails can hit that.
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await post();
    }
    if (!response.ok) {
      console.error(`sendEmail failed (${response.status}) to ${to}:`, await response.text());
    }
  } catch (error) {
    console.error(`sendEmail failed to ${to}:`, error);
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// One plain layout for every email, with inline styles since email clients
// ignore stylesheets. The text version is for clients that don't show HTML.
function renderEmail({ heading, paragraphs, rows = [], buttons = [] }: EmailContent) {
  const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f8fcfe;${font};color:#152839">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;font-family:Newsreader,Georgia,serif">${escapeHtml(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${escapeHtml(p)}</p>`).join("\n")}
${
  rows.length
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:8px 0;border-top:1px solid #dbe7ec;color:#546673;vertical-align:top;width:40%">${escapeHtml(label)}</td><td style="padding:8px 0;border-top:1px solid #dbe7ec;white-space:pre-line">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}</table>`
    : ""
}
${
  buttons.length
    ? `<p style="margin:20px 0 0">${buttons
        .map(
          // The first button is the main action; any others are outlined.
          (b, i) =>
            `<a href="${escapeHtml(b.url)}" style="display:inline-block;margin:0 8px 8px 0;${i === 0 ? "background:#0975a2;color:#ffffff" : "border:1px solid #cfdee4;color:#152839"};text-decoration:none;padding:10px 18px;border-radius:999px;font-size:15px">${escapeHtml(b.label)}</a>`,
        )
        .join("")}</p>`
    : ""
}
</div>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#546673;text-align:center">${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.url.replace("https://", ""))}</p>
</body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...rows.map(([label, value]) => `${label}: ${value.replaceAll("\n", ", ")}`),
    ...(buttons.length ? ["", ...buttons.map((b) => `${b.label}: ${b.url}`)] : []),
  ].join("\n");

  return { html, text };
}
