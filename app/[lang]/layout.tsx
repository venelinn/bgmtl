// MUST stay above every component import. Global styles have to enter the CSS
// bundle before any CSS Module, or the cascade inverts and globals start
// winning against component styles. The previous root layout had no component
// imports, so this ordering used to be accidental rather than stated.
import "@/styles/globals.scss";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Footer from "@/components/Footer/Footer";
import Navigation from "@/components/Navigation/Navigation";
import { VIEW_TRANSITIONS_ENABLED } from "@/utils/common";
import { getFooter, getHeader, getNavigationLinks, getPages } from "@/utils/content";
import { raleway } from "@/utils/fonts";
import { getMessages } from "@/utils/getMessages";
import { getContentfulLocale, localization } from "@/utils/localization";
import { ClientLayout } from "../ClientLayout";

export const metadata: Metadata = {
  title: "National Capital Region Bulgarian Community | Bulgarian Community | bgmtl.com",
  description: "National Capital Region Bulgarian Community | Bulgarian Community",
  icons: {
    apple: [{ url: "/static/favicons/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/static/favicons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/static/favicons/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
  },
  manifest: "/static/favicons/site.webmanifest",
};

/**
 * The locales this layout prerenders.
 */
export function generateStaticParams() {
  return localization.locales.map((lang) => ({ lang }));
}

/**
 * The root layout — `<html>` and `<body>` live here, under `[lang]`, rather
 * than in an `app/layout.tsx` above it.
 *
 * That is deliberate. A root layout above `[lang]` has no route params, so it
 * could not know the language and hardcoded `lang="en"`, leaving a `useEffect`
 * in `ClientLayout` to correct it after hydration. Crawlers read the SERVED
 * markup, so every Bulgarian and French page declared itself English — and
 * `bg` is the *default* locale, so the primary language was the one being
 * mislabelled.
 *
 * Here `lang` is a route param, so the served markup carries the right language
 * with no client correction and no request-time read. `proxy.ts` rewrites
 * locale-less paths to `/{defaultLocale}`, so every request reaches this
 * segment.
 *
 * Nothing added here may call `headers()` or `cookies()`: a request-time read
 * in this layout would opt every route in the app into dynamic rendering and
 * cost the site its Netlify Durable cache hits.
 */
export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang } = await params;
  const contentfulLocale = getContentfulLocale(lang);

  // These fetches are independent — run them concurrently rather than serially.
  // (All are cached under the "contentful" tag, so this trims cold-start latency,
  // not API-call count.) `draftMode()` is independent too.
  const [pages, header, footer, { isEnabled }] = await Promise.all([
    getPages(contentfulLocale),
    getHeader(contentfulLocale),
    getFooter(contentfulLocale),
    draftMode(),
  ]);

  const navLinks = await getNavigationLinks(pages, lang); // Use 'lang' (e.g., 'en')

  // Filter links for their location
  const footerLinks = navLinks.filter((link) => link.location === "footer");

  // Only the active locale's messages cross to the client (see ClientLayout).
  const messages = getMessages(lang);

  return (
    <html
      lang={lang}
      data-vt={VIEW_TRANSITIONS_ENABLED ? undefined : "off"}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={raleway.className}>
        {/*
          Homepage load choreography gate. Runs before first paint so the
          intro's initial hidden state (see `html[data-home-intro]` in
          globals.scss) is applied without a flash. Sets the flag only on a
          homepage ("/", "/bg", "/en", …), once per browser session, and never
          when the user prefers reduced motion. The attribute is removed after
          the sequence so it doesn't linger on the DOM.

          Both of these must stay raw inline <script>. `next/script` with
          `beforeInteractive` looks like the right tool but Next injects it via
          its own runtime queue, which runs during hydration — i.e. after first
          paint — reintroducing exactly the flash they exist to prevent.
        */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint gate, must be inline + synchronous
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!/^\\/(?:[a-z]{2})?\\/?$/.test(location.pathname))return;if(sessionStorage.getItem('homeIntroPlayed'))return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.dataset.homeIntro='1';sessionStorage.setItem('homeIntroPlayed','1');setTimeout(function(){d.removeAttribute('data-home-intro')},2400);}catch(e){}})();`,
          }}
        />
        {/*
          Theme bootstrap. Runs before first paint so the saved/preferred theme
          is on <html> before any CSS resolves — prevents a flash of light mode.
          Reads localStorage('bgmtl-theme'); falls back to the OS preference.
          The ThemeToggle (header) reads and updates this same attribute + key.
        */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint gate, must be inline + synchronous
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('bgmtl-theme');var t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        <ClientLayout lang={lang} messages={messages}>
          {isEnabled && (
            <div className="bg-yellow-400 text-black text-center text-xs py-1 sticky top-0 z-50 font-bold uppercase tracking-widest flex items-center justify-center gap-4">
              <span>Preview Mode Active (Draft Content)</span>
              <a href={`/api/exit-preview?path=/${lang}`} className="underline hover:no-underline font-normal normal-case">
                Exit preview
              </a>
            </div>
          )}
          <Navigation pageLocale={lang} data={header} />
          <main className="page">
            <div className="content-grid">
              {children}
            </div>
          </main>
          <div className="content-grid">
            <Footer pageLocale={lang} links={footerLinks} data={footer} />
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
