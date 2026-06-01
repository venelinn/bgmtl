import { draftMode } from "next/headers";
import Footer from "@/components/Footer/Footer";
import Navigation from "@/components/Navigation/Navigation";
import { getFooter, getHeader, getNavigationLinks, getPages } from "@/utils/content";
import { getMessages } from "@/utils/getMessages";
import { getContentfulLocale } from "@/utils/localization";
import { ClientLayout } from "../ClientLayout";

/**
 * This is the main layout for all localized pages (e.g., /en/about, /fr/about).
 * It replaces your old `pages/_app.tsx`.
 *
 * It's a Server Component, so we can fetch data directly in it.
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
  );
}
