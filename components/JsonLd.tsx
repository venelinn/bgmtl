/**
 * Renders a JSON-LD structured-data block. Server-rendered into the HTML so
 * crawlers (Google) see it on first paint — keep this in a server component.
 *
 * `data` is any schema.org object (e.g. an Event built by buildEventJsonLd).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			// Schema is built from our own data; JSON.stringify escapes it safely.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	)
}
