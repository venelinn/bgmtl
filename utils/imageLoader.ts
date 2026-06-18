/**
 * Custom next/image loader.
 *
 * Why: with the default loader, every <Image> is fetched, optimized and served
 * by Netlify's image CDN — that bandwidth + compute is billed to us. Contentful
 * and Cloudinary both expose their own (free-to-us) image CDNs with on-the-fly
 * transforms, so we point the browser straight at them and Netlify never touches
 * the bytes. Unknown hosts are returned untouched (served from origin, still
 * off-Netlify).
 *
 * Set via `images.loaderFile` in next.config.js. Runs on both server and client,
 * so keep it a plain, dependency-free pure function.
 */

type LoaderArgs = {
	src: string;
	width: number;
	quality?: number;
};

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
	const q = quality || 75;

	// Protocol-relative Contentful URLs ("//images.ctfassets.net/...") arrive as-is.
	const normalized = src.startsWith("//") ? `https:${src}` : src;

	// Contentful Images API: ?w=&q=&fm=webp&fit=fill — append to existing query.
	if (normalized.includes("ctfassets.net")) {
		const [base, existing] = normalized.split("?");
		const params = new URLSearchParams(existing);
		params.set("w", String(width));
		params.set("q", String(q));
		params.set("fm", "webp");
		return `${base}?${params.toString()}`;
	}

	// Cloudinary: inject a transform segment right after `/upload/`. Cloudinary
	// chains transforms, so this stays correct even if the URL already carries
	// one (e.g. from getOptimizedImage).
	if (normalized.includes("res.cloudinary.com") && normalized.includes("/upload/")) {
		return normalized.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
	}

	// Unknown host (YouTube thumbs, Instagram CDN, Unsplash, …): serve from origin.
	return normalized;
}
