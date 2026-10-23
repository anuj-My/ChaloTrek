// Structured data for search engines (schema.org JSON-LD). "<" is escaped so
// text from organizers can't close the script tag.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\u003c") }}
    />
  );
}
