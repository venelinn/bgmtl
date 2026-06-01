import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { componentMap } from "@/components";
import { EventsCalendarConnector } from "@/components/Calendar";
import { ListingsConnector } from "@/components/Listings";
import { buildMetadata } from "@/components/MetaData";
import { SectionConnector } from "@/components/Section";
import { Sidebar } from "@/components/Sidebar";
import { getSliderSectionProps } from "@/components/Slider/SliderConnector";
import SubscribeForm from "@/components/Subscribe/Subscribe";
import { DonateWidget, MembershipConnector } from "@/components/Widgets";
import type { SliderConnectorProps } from "@/types/slider";
import type { WidgetType } from "@/types/widgets";
import { IS_DEV } from "@/utils/common";
import { getPageBySlug, getPagePaths } from "@/utils/content";
import { getContentfulLocale, localization } from "@/utils/localization";

// No numeric `revalidate`: Contentful data is cached indefinitely under the
// "contentful" tag (utils/contentful-cache.ts) and busted on publish via the
// webhook. A numeric revalidate here would re-enable traffic-driven polling.

export async function generateStaticParams() {
  const params: { lang: string; slug?: string[] }[] = [];

  for (const locale of localization.locales) {
    const contentfulLocale = getContentfulLocale(locale);
    const paths = await getPagePaths(contentfulLocale);

    for (const p of paths) {
      params.push({ lang: locale, slug: p.params.slug });
    }

    params.push({ lang: locale });
  }

  return params;
}

type Section = {
  id: string;
  type: string;
  [key: string]: unknown;
};
type MappedChild = { id?: string; type?: string; [key: string]: unknown };
type SectionWithChildren = Section & {
  components?: MappedChild[];
  items?: MappedChild[];
  content?: MappedChild[];
};

export async function generateMetadata(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { lang, slug = [] } = await props.params;

  if (!localization.locales.includes(lang)) return {};

  const path = slug.length > 0 ? slug.join("/") : "/";
  const contentfulLocale = getContentfulLocale(lang);
  const pageData = await getPageBySlug(path, contentfulLocale, isEnabled);

  const meta = (pageData as any)?.metaData;

  return buildMetadata({
    pageTitle: meta?.pageTitle ?? null,
    pageDescription: meta?.pageDescription ?? null,
    keywords: meta?.keywords ?? null,
    path,
    locale: lang,
  });
}

export default async function Page(props: { params: Promise<{ lang: string; slug?: string[] }> }) {
  // 1. Await dynamic APIs first in Next.js 16
  const { isEnabled } = await draftMode();
  const { lang, slug = [] } = await props.params;

  // 3️⃣ Validate locale
  if (!localization.locales.includes(lang)) return notFound();

  // 2. Build the path
  const path = slug.length > 0 ? slug.join("/") : "/";
  const contentfulLocale = getContentfulLocale(lang);

  // 3. Fetch data with the preview flag
  const pageData = await getPageBySlug(path, contentfulLocale, isEnabled);

  if (!pageData) return notFound();

  const page = pageData as {
    sections?: Section[];
    sidebar?: boolean;
    widgets?: WidgetType[];
    listings?: ("events" | "news")[];
  };

  // Determine if sidebar should be shown
  const listings = Array.isArray(page.listings) ? page.listings : [];
  const hasSidebarContent = page.sidebar === true || listings.length > 0;
  const widgets = Array.isArray(page.widgets) ? page.widgets : [];
  const shouldShowSidebar = hasSidebarContent;

  const firstSection = page.sections?.[0];
  const firstSectionChildren =
    firstSection?.type === "section"
      ? (Array.isArray((firstSection as SectionWithChildren).components) &&
          (firstSection as SectionWithChildren).components) ||
        (Array.isArray((firstSection as SectionWithChildren).items) && (firstSection as SectionWithChildren).items) ||
        (Array.isArray((firstSection as SectionWithChildren).content) &&
          (firstSection as SectionWithChildren).content) ||
        []
      : [];

  const hasHeroAsFirstSection = firstSection?.type === "hero" || firstSectionChildren?.[0]?.type === "hero";

  // Separate hero section from other sections
  const heroSection = hasHeroAsFirstSection ? page.sections?.[0] : null;
  const otherSections = hasHeroAsFirstSection ? page.sections?.slice(1) : page.sections;

  const mainContent = (
    <>
      {listings.length > 0 && <ListingsConnector listings={listings} locale={lang} limit={3} preview={isEnabled} />}
      {otherSections?.length ? (
        otherSections.map((section) => {
          const Component = componentMap[section.type];
          if (!Component) return null;

          if (section.type === "section") {
            const sec = section as SectionWithChildren;
            const childrenArray: MappedChild[] =
              (Array.isArray(sec.components) && sec.components) ||
              (Array.isArray(sec.items) && sec.items) ||
              (Array.isArray(sec.content) && sec.content) ||
              [];

            let computedSectionProps: Record<string, unknown> = {};

            if (childrenArray[0]?.type === "slider") {
              computedSectionProps = getSliderSectionProps(childrenArray[0] as SliderConnectorProps);
            }

            const renderedChildren = childrenArray.map((child: MappedChild) => {
              const Child = child?.type
                ? (componentMap as Record<string, React.ComponentType<Record<string, unknown>>>)[child.type]
                : null;
              if (!Child) return null;

              return <Child key={child.id} {...child} />;
            });

            return (
              <SectionConnector key={section.id} {...section} sectionProps={computedSectionProps}>
                {renderedChildren}
              </SectionConnector>
            );
          }

          return <Component key={section.id} {...section} />;
        })
      ) : !heroSection ? (
        <EmptyState />
      ) : null}
    </>
  );

  return (
    <>
      {/* 💡 Optional: Add a visual indicator for editors when Preview is on */}
      {/* Render Hero section first, full width */}
      {heroSection &&
        (() => {
          const Component = componentMap[heroSection.type];
          if (!Component) return null;

          if (heroSection.type === "section") {
            const sec = heroSection as SectionWithChildren;
            const childrenArray: MappedChild[] =
              (Array.isArray(sec.components) && sec.components) ||
              (Array.isArray(sec.items) && sec.items) ||
              (Array.isArray(sec.content) && sec.content) ||
              [];

            let computedSectionProps: Record<string, unknown> = {};

            if (childrenArray[0]?.type === "slider") {
              computedSectionProps = getSliderSectionProps(childrenArray[0] as SliderConnectorProps);
            }

            const renderedChildren = childrenArray.map((child: MappedChild) => {
              const Child = child?.type
                ? (componentMap as Record<string, React.ComponentType<Record<string, unknown>>>)[child.type]
                : null;
              if (!Child) return null;

              return <Child key={child.id} {...child} />;
            });

            return (
              <SectionConnector key={heroSection.id} {...sec} sectionProps={computedSectionProps}>
                {renderedChildren}
              </SectionConnector>
            );
          }

          return <Component key={heroSection.id} {...heroSection} />;
        })()}

      {/* Main content with sidebar */}
      {shouldShowSidebar ? (
        <div className="page__with-sidebar" data-has-sidebar>
          <div className="page__main">{mainContent}</div>
          <Sidebar>
            {widgets.map((widget, index) => {
              switch (widget) {
                case "calendar":
                  return <EventsCalendarConnector key={`${widget}-${index}`} locale={lang} />;
                case "donate":
                  return <DonateWidget key={`${widget}-${index}`} />;
                case "membership":
                  return <MembershipConnector key={`${widget}-${index}`} locale={lang} preview={isEnabled} />;
                case "subscribe":
                  return <SubscribeForm key={`${widget}-${index}`} />;
                default:
                  return null;
              }
            })}
          </Sidebar>
        </div>
      ) : (
        mainContent
      )}
    </>
  );
}

function EmptyState() {
  return IS_DEV ? (
    <div className="flex items-center justify-center w-full py-32">
      <div className="border-4 border-gray-400 rounded p-16 border-dashed flex flex-col gap-2 items-center">
        <span className="text-2xl">Empty page! Add sections.</span>
        <span>(this message does not appear in production)</span>
      </div>
    </div>
  ) : null;
}
