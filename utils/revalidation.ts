import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { CONTENTFUL_TAG } from "@/utils/contentful-cache";
import { localization } from "@/utils/localization";

/**
 * On-demand revalidation logic, extracted so the route handler stays thin
 * and this can be unit-tested / reused (e.g. a future per-slug webhook).
 *
 * Guardrails (see memory.md → "On-demand revalidation"):
 * - The Contentful data cache is the primary lever: every fetch is cached
 *   indefinitely under CONTENTFUL_TAG (see utils/contentful-cache.ts), so a
 *   single revalidateTag on publish refetches everything once. Do NOT add a
 *   numeric `revalidate` to CMS routes — it re-enables traffic-driven polling.
 * - revalidatePath uses the "layout" type, not "page": "page" alone can leave a
 *   stale homepage / listings under app/[lang]/layout.tsx and Netlify's
 *   durable cache. Kept as a belt-and-suspenders HTML bust alongside the tag.
 * - The route handler must keep `export const runtime = "nodejs"` — that is a
 *   route-level export and cannot live here.
 */

/** Revalidation is only usable when the shared secret is configured. */
export function isRevalidationConfigured(): boolean {
  return Boolean(process.env.CONTENTFUL_REVALIDATE_SECRET);
}

/**
 * Accept either `Authorization: Bearer <secret>` or `x-revalidate-secret: <secret>`.
 * Returns false when the secret is unset so callers fail closed.
 */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CONTENTFUL_REVALIDATE_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  const headerSecret = req.headers.get("x-revalidate-secret")?.trim();

  return bearer === secret || headerSecret === secret;
}

/**
 * Invalidate the localized subtree for every locale and return the human-readable
 * paths that were revalidated (for the response body / logging).
 */
export function revalidateAllLocales(): string[] {
  const paths: string[] = [];

  // Primary: bust the Contentful data cache. Every cached fetch shares this
  // tag, so this one call invalidates all of them. The "max" profile arg is
  // required in Next 16+ (a bare one-arg call is deprecated).
  revalidateTag(CONTENTFUL_TAG, "max");
  paths.push(`tag:${CONTENTFUL_TAG}`);

  // Safety net: also clear the rendered localized HTML subtrees.
  for (const lang of localization.locales) {
    revalidatePath(`/${lang}`, "layout");
    paths.push(`/${lang} (layout)`);
  }

  // The sitemap is static (no time-based revalidate); its data cache is busted by
  // the tag above, but the rendered XML needs an explicit path revalidation.
  revalidatePath("/sitemap.xml");
  paths.push("/sitemap.xml");

  return paths;
}
