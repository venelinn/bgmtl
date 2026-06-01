import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { EventsCalendarConnector } from "@/components/Calendar";
import { EventsConnector } from "@/components/Events";
import { Hero } from "@/components/Hero";
import { buildMetadata } from "@/components/MetaData";
import { Sidebar } from "@/components/Sidebar";
import SubscribeForm from "@/components/Subscribe/Subscribe";
import { DonateWidget } from "@/components/Widgets";
import { getAllEvents, getFallbackImageUrl, getSiteConfig } from "@/utils/content";
import { getMessages } from "@/utils/getMessages";
import { localization } from "@/utils/localization";

// No numeric `revalidate`: Contentful data is cached indefinitely under the
// "contentful" tag (utils/contentful-cache.ts) and busted on publish via the
// webhook. A numeric revalidate here would re-enable traffic-driven polling.

type Params = Promise<{ lang: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { lang } = await props.params;
  const messages = getMessages(lang) as { Events?: { sectionTitle?: string } };
  const title = messages.Events?.sectionTitle ?? "Events";

  return buildMetadata({
    pageTitle: title,
    path: "events",
    locale: lang,
  });
}

export default async function EventsPage(props: { params: Params }) {
  const { lang } = await props.params;
  const { isEnabled } = await draftMode();

  if (!localization.locales.includes(lang)) return notFound();

  const [events, siteConfig] = await Promise.all([
    getAllEvents(lang, isEnabled),
    getSiteConfig(lang, isEnabled),
  ]);

  const fallbackImage = getFallbackImageUrl(siteConfig?.fallbackEvents) ?? undefined;
  const heroImages = siteConfig?.eventsHero as { src?: string; url?: string; alt?: string; width?: number; height?: number }[] | undefined;
  const eventsPerPage = siteConfig?.eventsPerPage ?? 10;
  const messages = getMessages(lang) as { Events?: { sectionTitle?: string } };
  const title = messages.Events?.sectionTitle ?? "Events";

  return (
    <>
      {heroImages && heroImages.length > 0 && (
        <Hero
          images={heroImages}
          size="fixed"
          imageAlignment="top"
          height="quarter"
          heading={{ heading: title, size: "hero", as: "h1" }}
        />
      )}
      <div className="page__with-sidebar" data-has-sidebar>
        <div className="page__main">
          <EventsConnector
            events={events}
            locale={lang}
            fallbackImage={fallbackImage}
            eventsPerPage={eventsPerPage}
          />
        </div>
        <Sidebar>
          <EventsCalendarConnector locale={lang} />
          <DonateWidget />
          <SubscribeForm />
        </Sidebar>
      </div>
    </>
  );
}
