"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { InfoCard, MemberCard, PrimaryCard } from "@/components/Cards";
import { GridCollection } from "@/components/Collection";
import { EventsConnector } from "@/components/Events";
import { Event } from "@/components/Events/Event";
import { Select } from "@/components/Forms/Select";
import type { HeadingProps } from "@/components/Headings";
import { Heading } from "@/components/Headings";
import { News } from "@/components/News";
import type { PaginationProps } from "@/components/Pagination";
import type { SectionProps } from "@/components/Section";
import { SliderConnector } from "@/components/Slider";
import type { CardImage, CardImageRatio, CardVariantType } from "@/types/card";
import type { EventItem } from "@/types/events";
import type { NewsItem } from "@/types/news";
import type { PrimaryCardVariants } from "../Cards/PrimaryCard/PrimaryCard";
import eventsStyles from "../Events/Events.module.scss";
import { PaginatedCollection } from "./Paginated/PaginatedCollection";

function EventsPaginatedWithHeadings({
  eventCards,
  locale,
  fallbackImage,
  props: p,
}: {
  eventCards: EventItem[];
  locale: string;
  fallbackImage?: string;
  props: PaginatedCollectionConnectorProps;
}) {
  const t = useTranslations();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { upcoming, past, years } = useMemo(() => {
    const today = new Date();
    const up = eventCards
      .filter((e) => new Date(e.date) > today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pa = eventCards
      .filter((e) => new Date(e.date) <= today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const yearSet = new Set(pa.map((e) => new Date(e.date).getFullYear()));
    const yrs = Array.from(yearSet).sort((a, b) => b - a);
    return { upcoming: up, past: pa, years: yrs };
  }, [eventCards]);

  const filteredPast = useMemo(() => {
    if (selectedYear === "all") return past;
    const year = parseInt(selectedYear, 10);
    return past.filter((e) => new Date(e.date).getFullYear() === year);
  }, [past, selectedYear]);

  const toItems = (events: EventItem[], type: "upcoming" | "past") =>
    events.map((event) => ({
      id: event.id,
      content: <Event key={event.id} event={event} type={type} locale={locale} fallbackImage={fallbackImage} />,
    }));

  const upcomingItems = toItems(upcoming, "upcoming");
  const pastItems = toItems(filteredPast, "past");

  return (
    <div className={eventsStyles.events}>
      {upcomingItems.length > 0 && (
        <div data-type="upcoming">
          <Heading as="h2" size="sb">
            {t("Events.upcomingEvents")}
          </Heading>
          <PaginatedCollection
            cardsPerPage={p.cardsPerPage ?? 3}
            itemsPerRow={p.itemsPerRow}
            itemsPerPage={p.itemsPerPage}
            paginationVariant={p.paginationVariant ?? "default"}
            numberOfPaginationToDisplay={p.numberOfPaginationToDisplay ?? 5}
            items={upcomingItems}
            onCardHover={p.onCardHover}
            autoFit={p.autoFit}
            totalCardsPerPage={p.totalCardsPerPage}
          />
        </div>
      )}
      <div data-type="past">
        <div className={eventsStyles.events__header}>
          <Heading as="h2" size="sb">
            {t("Events.pastEvents")}
          </Heading>
          {past.length > 0 && (
            <div className={eventsStyles.events__yearFilter}>
              <Select
                value={selectedYear}
                inputSize="sm"
                tone="dark"
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label={t("Events.filterByYear")}
              >
                <option value="all">{t("Events.allYears")}</option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        {pastItems.length > 0 ? (
          <PaginatedCollection
            cardsPerPage={p.cardsPerPage ?? 3}
            itemsPerRow={p.itemsPerRow}
            itemsPerPage={p.itemsPerPage}
            paginationVariant={p.paginationVariant ?? "default"}
            numberOfPaginationToDisplay={p.numberOfPaginationToDisplay ?? 5}
            items={pastItems}
            onCardHover={p.onCardHover}
            autoFit={p.autoFit}
            totalCardsPerPage={p.totalCardsPerPage}
          />
        ) : (
          <p>{t("Events.noEventsAvailable")}</p>
        )}
      </div>
    </div>
  );
}

function EventsGridWithHeadings({
  eventCards,
  locale,
  fallbackImage,
  props: gridProps,
}: {
  eventCards: EventItem[];
  locale: string;
  fallbackImage?: string;
  props: GridCollectionConnectorProps;
}) {
  const t = useTranslations();
  const today = new Date();
  const upcoming = eventCards
    .filter((e) => new Date(e.date) > today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = eventCards
    .filter((e) => new Date(e.date) <= today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toItems = (events: EventItem[], type: "upcoming" | "past") =>
    events.map((event) => ({
      id: event.id,
      content: <Event key={event.id} event={event} type={type} locale={locale} fallbackImage={fallbackImage} />,
    }));

  const upcomingItems = toItems(upcoming, "upcoming");
  const pastItems = toItems(past, "past");

  return (
    <div className={eventsStyles.events}>
      {upcomingItems.length > 0 && (
        <div data-type="upcoming">
          <Heading as="h2" size="sb" className="mt-4">
            {t("Events.upcomingEvents")}
          </Heading>
          <GridCollection
            id={gridProps.id}
            items={upcomingItems}
            itemsPerRow={gridProps.itemsPerRow ?? 1}
            cardsWidth={gridProps.cardsWidth}
          />
        </div>
      )}
      <div data-type="past">
        <Heading as="h2" size="sb" className="pt-8">
          {t("Events.pastEvents")}
        </Heading>
        {pastItems.length > 0 ? (
          <GridCollection
            id={gridProps.id}
            items={pastItems}
            itemsPerRow={gridProps.itemsPerRow ?? 1}
            cardsWidth={gridProps.cardsWidth}
          />
        ) : (
          <p>{t("Events.noEventsAvailable")}</p>
        )}
      </div>
    </div>
  );
}

type RichTextContent = Record<string, unknown> | string;

type CollectionCard = {
  id: string;
  images?: Array<CardImage>;
  image?: CardImage;
  imageRatio?: CardImageRatio["imageRatio"];
  heading?: HeadingProps;
  headingVariant?: SectionProps["headingVariant"];
  header?: string;
  icon?: string;
  variant?: string;
  role?: string;
  labels?: {
    price?: React.ReactNode;
    from?: React.ReactNode;
    to?: React.ReactNode;
  };
  fromPrice?: string;
  toPrice?: string;
  priceMessage?: string;
  link?: {
    href: string;
    label?: string;
    target?: string;
  };
  content?: RichTextContent | React.ReactNode;
  [key: string]: unknown;
};

export type ItemsPerRow = 1 | 2 | 3 | 4;

export type CardsPerPage = 2 | 3 | 4;

type BaseCollectionConnectorProps = {
  id?: string;
  cards?: CollectionCard[];
  members?: CollectionCard[];
  cardVariant?: CardVariantType;
  locale?: string;
  /** Fallback image URL for event/news cards when cover is missing (from site config). */
  fallbackImage?: string;
};

type GridCollectionConnectorProps = BaseCollectionConnectorProps & {
  variant?: "grid";
  itemsPerRow?: ItemsPerRow;
  cardsWidth?: string;
};

type PaginatedCollectionConnectorProps = BaseCollectionConnectorProps & {
  variant: "paginated";
  cardsPerPage?: CardsPerPage;
  itemsPerRow?: ItemsPerRow;
  /** Number of items per page. Default 10 when itemsPerRow is set. */
  itemsPerPage?: number;
  paginationVariant?: PaginationProps["variant"];
  numberOfPaginationToDisplay?: number;
  totalCardsPerPage?: number;
  autoFit?: boolean;
  colWidth?: string;
  onCardHover?: (id: string | null) => void;
};

type SliderCollectionConnectorProps = BaseCollectionConnectorProps & {
  variant: "slider";
  itemsPerRow?: ItemsPerRow;
  isOffset?: boolean;
};

export type CollectionVariant = "grid" | "paginated" | "slider";

export type CollectionConnectorProps =
  | GridCollectionConnectorProps
  | PaginatedCollectionConnectorProps
  | SliderCollectionConnectorProps;

export const CollectionConnector = (props: CollectionConnectorProps) => {
  const cards = props.cards ?? [];
  if (!cards.length) return null;

  const cardVariant = props.cardVariant || "primary";
  const eventCards = cards.filter((item) => item.type === "event") as EventItem[];
  const newsCards = cards.filter((item) => item.type === "news") as NewsItem[];
  const locale = props.locale || "bg";

  const fallbackImage = props.fallbackImage;

  // Events with paginated variant: use PaginatedCollection with Upcoming/Past section headings
  if ((cardVariant === "event" || eventCards.length > 0) && props.variant === "paginated") {
    return (
      <EventsPaginatedWithHeadings
        eventCards={eventCards}
        locale={locale}
        fallbackImage={fallbackImage}
        props={props as PaginatedCollectionConnectorProps}
      />
    );
  }

  // Events with grid variant: use GridCollection with Upcoming/Past section headings
  if ((cardVariant === "event" || eventCards.length > 0) && props.variant === "grid") {
    return (
      <EventsGridWithHeadings
        eventCards={eventCards}
        locale={locale}
        fallbackImage={fallbackImage}
        props={props as GridCollectionConnectorProps}
      />
    );
  }

  // Events with slider/default: use EventsConnector (no itemsPerRow control)
  if (cardVariant === "event" || eventCards.length > 0) {
    return <EventsConnector id={props.id} events={eventCards} locale={locale} fallbackImage={fallbackImage} />;
  }

  // News cards: use mapItems with news variant (grid/paginated/slider)
  const effectiveCardVariant = cardVariant === "news" || newsCards.length > 0 ? "news" : cardVariant;

  const mapItems = (items: CollectionCard[]) =>
    items
      .map((item) => {
        // Render card based on variant
        const renderCard = () => {
          const variant = effectiveCardVariant === "news" && item.type === "news" ? "news" : effectiveCardVariant;
          switch (variant) {
            case "news":
              return <News key={item.id} news={item as NewsItem} locale={locale} fallbackImage={fallbackImage} />;
            case "member":
              return (
                <MemberCard
                  id={item.id}
                  heading={item.heading}
                  image={item.image || item.images?.[0]}
                  imageRatio={item.imageRatio}
                  content={typeof item.content === "string" ? item.content : (item.content as Record<string, unknown>)}
                  link={item.link}
                  role={item.role}
                />
              );

            case "info":
              return (
                <InfoCard
                  icon={item.icon as string}
                  heading={item.heading}
                  variant={
                    (["default", "horizontal", "horizontalNoIcon"] as const).includes(item.variant as never)
                      ? (item.variant as "default" | "horizontal" | "horizontalNoIcon")
                      : undefined
                  }
                  content={item.content as React.ReactNode}
                  link={item.link}
                />
              );

            case "primary":
            default:
              return (
                <PrimaryCard
                  id={item.id}
                  image={
                    item.images || (Array.isArray(item.image) ? item.image : item.image ? [item.image] : undefined)
                  }
                  variant={item.variant as keyof typeof PrimaryCardVariants}
                  content={item.content as React.ReactNode}
                  heading={item.heading}
                  link={item.link}
                />
              );
          }
        };

        const content = renderCard();

        return content
          ? {
              id: item.id,
              content,
            }
          : null;
      })
      .filter(Boolean) as Array<{ id: string; content: React.ReactNode }>;

  switch (props.variant) {
    case "slider":
      return (
        <SliderConnector
          items={mapItems(cards)}
          variant={effectiveCardVariant}
          itemsPerRow={props.itemsPerRow}
          isOffset={props.isOffset}
        />
      );
    case "paginated":
      return (
        <PaginatedCollection
          cardsPerPage={props.cardsPerPage || 3}
          itemsPerRow={props.itemsPerRow}
          itemsPerPage={props.itemsPerPage}
          paginationVariant={props.paginationVariant || "default"}
          numberOfPaginationToDisplay={props.numberOfPaginationToDisplay || 5}
          items={mapItems(cards)}
          onCardHover={props.onCardHover}
          autoFit={props?.autoFit}
          totalCardsPerPage={props?.totalCardsPerPage}
        />
      );

    case "grid":
    default:
      return (
        <GridCollection
          id={props.id}
          itemsPerRow={props.variant === "grid" ? props.itemsPerRow : undefined}
          cardsWidth={props.variant === "grid" ? props.cardsWidth : undefined}
          items={mapItems(cards)}
        />
      );
  }
};
