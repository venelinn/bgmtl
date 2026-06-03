import { GridCollection } from "@/components/Collection";
import { Event } from "@/components/Events/Event";
import type { EventItem } from "@/types/events";
import { getFallbackImageUrl, getListingsData } from "@/utils/content";
import { HomeEventsHeader } from "./HomeEventsHeader";

type HomeEventsConnectorProps = {
  locale: string;
  limit?: number;
  preview?: boolean;
};

/**
 * Homepage events teaser: a flat list of events (no Upcoming/Past sub-headings)
 * under a single "Events" header with an inline "View all events" link.
 * The dedicated /events page keeps the grouped Upcoming/Past layout.
 */
export async function HomeEventsConnector({ locale, limit = 3, preview = false }: HomeEventsConnectorProps) {
  const { sections, siteConfig } = await getListingsData(["events"], locale, { limit, preview });
  const section = sections.find((s) => s.type === "events");
  if (!section?.cards.length) return null;

  const fallbackImage = getFallbackImageUrl(siteConfig?.fallbackEvents) ?? undefined;
  const today = new Date();
  const cards = section.cards as unknown as EventItem[];

  const items = cards.map((event) => ({
    id: event.id,
    content: (
      <Event
        key={event.id}
        event={event}
        type={new Date(event.date) > today ? "upcoming" : "past"}
        locale={locale}
        fallbackImage={fallbackImage}
      />
    ),
  }));

  return (
    <section>
      <HomeEventsHeader href={`/${locale}/events`} showViewAll={section.hasMore} />
      <GridCollection items={items} itemsPerRow={1} />
    </section>
  );
}
