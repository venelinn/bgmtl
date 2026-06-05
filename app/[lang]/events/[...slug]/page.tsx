import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/Events/EventDetail";
import { buildMetadata } from "@/components/MetaData";
import type { EventItem } from "@/types/events";
import { slugify, getOgImageUrl } from "@/utils/common";
import { getFallbackImageUrl, getAllEvents, getAllEventsBulgarian, getSiteConfig } from "@/utils/content";
import { localization } from "@/utils/localization";

// No numeric `revalidate`: Contentful data is cached indefinitely under the
// "contentful" tag (utils/contentful-cache.ts) and busted on publish via the
// webhook. A numeric revalidate here would re-enable traffic-driven polling.

type Params = Promise<{ lang: string; slug?: string[] }>;

const getHeadingText = (heading: EventItem["heading"], venue?: string) => {
  if (typeof heading === "string") return heading;
  if (heading && typeof heading === "object" && "heading" in heading && typeof heading.heading === "string") {
    return heading.heading;
  }
  return venue || "";
};

export async function generateStaticParams() {
  const locales = localization.locales;
  const allParams: Array<{ lang: string; slug: string[] }> = [];

  // Always fetch Bulgarian events for slug generation (consistent URLs across all locales)
  const bulgarianEvents = (await getAllEventsBulgarian()) as EventItem[];

  for (const locale of locales) {
    bulgarianEvents.forEach((event) => {
      const headingText = getHeadingText(event.heading, event.venue);
      const eventSlug = slugify(headingText || "event");
      allParams.push({
        lang: locale,
        slug: [eventSlug],
      });
    });
  }

  return allParams;
}

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { lang, slug = [] } = await props.params;
  const last = slug[slug.length - 1] || "";
  const events = (await getAllEvents(lang)) as EventItem[];
  const event =
    events.find((item) => {
      const bgHeading = (item as any).bgHeading || getHeadingText(item.heading, item.venue);
      return slugify(String(bgHeading || "event")) === last;
    }) || null;

  if (!event) {
    return { title: "Event Not Found" };
  }

  const title = getHeadingText(event.heading, event.venue);
  const coverUrl = event.cover?.[0]?.src ?? null;
  const ogImage = coverUrl ? getOgImageUrl(coverUrl) : null;

  return buildMetadata({
    pageTitle: title,
    pageDescription: `Event at ${event.venue}`,
    image: ogImage,
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: event.cover?.[0]?.alt || title,
    type: "article",
    path: `events/${last}`,
    locale: lang,
  });
}

export default async function EventPage(props: { params: Params }) {
  const { lang, slug = [] } = await props.params;

  if (!localization.locales.includes(lang)) return notFound();

  const last = slug[slug.length - 1] || "";
  const events = (await getAllEvents(lang)) as EventItem[];
  const event =
    events.find((item) => {
      const bgHeading = (item as any).bgHeading || getHeadingText(item.heading, item.venue);
      return slugify(String(bgHeading || "event")) === last;
    }) || null;

  if (!event) return notFound();

  const siteConfig = await getSiteConfig(lang, false);
  const heroFallbackImage = getFallbackImageUrl(siteConfig?.fallbackEvent) ?? undefined;

  return <EventDetail event={event} locale={lang} heroFallbackImage={heroFallbackImage} />;
}
