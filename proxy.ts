import { type NextRequest, NextResponse } from "next/server";
import { localization } from "./utils/localization";

const { locales, defaultLocale } = localization;

/**
 * This is the i18n proxy for Next.js 16.
 * It intercepts requests and rewrites them to the default locale
 * if no locale is present.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = new URL(request.url);
  // console.log("🌀 Incoming path:", pathname);

  // 1. Check if the path is for a static file (e.g., /logo.svg)
  // If so, do nothing and let the request continue.
  const publicFile = /\.(.*)$/;
  const ignoredPrefixes = [
    "/_next",
    "/api",
    "/static",
    "/.well-known",
    "/auth", // <-- whitelist auth
  ];

  if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix)) || publicFile.test(pathname)) {
    return NextResponse.next();
  }

  // 1a. Old WordPress "ugly permalink" for the (now-removed) membership page:
  // /?page_id=482. Handled here rather than via a next.config redirect because
  // a query-based redirect to "/" re-forwards the query and loops. We redirect
  // to a clean, query-free home URL. Repoint if a membership page is added.
  if (pathname === "/" && url.searchParams.get("page_id") === "482") {
    const home = new URL(url.origin);
    return NextResponse.redirect(home, 301);
  }

  // 1b. Casino/gambling spam injected into the old hacked WordPress site.
  // These were never real pages — return 410 Gone so Google de-indexes them
  // fast (don't redirect: that would pass leftover spam signals into the site).
  const GONE_PATHS = new Set([
    "/lepreuve-volatile-accumulez-gains-et-reflexes-sur",
    "/bc-vao-khong-gian-nh-cao-mcw-casino-ni-chin-thng",
    "/padajici-kulika-nahoda-a-vysoke-vyhry-kompletni",
    "/about-us/bulgarianfoundation@yahoo.ca",
  ]);
  if (GONE_PATHS.has(pathname.replace(/\/+$/, ""))) {
    return new NextResponse("410 Gone", { status: 410 });
  }

  // 2. Check if the path already has a locale prefix (e.g., /fr/about)
  const hasLocale = localization.locales.some(
    (locale) => url.pathname === `/${locale}` || url.pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) return NextResponse.next();

  // Rewrite missing locale to default
  url.pathname = `/${localization.defaultLocale}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT those that never need locale rewriting.
     * Every match invokes the edge function (billed), so we exclude here rather
     * than relying only on the early-returns in the body:
     * - api, _next/static, _next/image, favicon.ico — framework/asset routes
     * - robots.txt, sitemap.xml — static SEO files
     * - any path ending in a common static-asset extension (css/js/fonts/images)
     *   Extensionless content paths still match; the dotted spam paths handled
     *   in the body end in `.ca`, which is intentionally absent from this list.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|woff|woff2|ttf|otf|map|json)$).*)",
  ],
};
