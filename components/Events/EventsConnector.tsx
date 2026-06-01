"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Select } from "@/components/Forms/Select";
import { Pagination } from "@/components/Pagination/Pagination";
import type { EventItem, EventsConnectorProps, EventType } from "@/types/events";
import { Heading } from "../Headings";
import { Event } from "./Event";
import styles from "./Events.module.scss";

const DEFAULT_PER_PAGE = 10;

const renderEvents = (
  events: EventItem[] | undefined,
  type: EventType,
  locale: string,
  t: (key: string) => string,
  fallbackImage?: string,
) => {
  if (!events || events.length === 0) {
    return <p>{t("Events.noEventsAvailable")}</p>;
  }

  return events.map((event) => (
    <Event key={event.id} type={type} event={event} locale={locale} fallbackImage={fallbackImage} />
  ));
};

export const EventsConnector = ({
  events = [],
  locale,
  fallbackImage,
  eventsPerPage = DEFAULT_PER_PAGE,
}: EventsConnectorProps) => {
  const t = useTranslations();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { upcomingEvents, pastEvents, years } = useMemo(() => {
    const currentDate = new Date();

    const upcoming: EventItem[] = [];
    const past: EventItem[] = [];
    const yearSet = new Set<number>();

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      if (eventDate > currentDate) {
        upcoming.push(event);
      } else {
        past.push(event);
        yearSet.add(eventDate.getFullYear());
      }
    });

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const years = Array.from(yearSet).sort((a, b) => b - a);

    return { upcomingEvents: upcoming, pastEvents: past, years };
  }, [events]);

  const filteredPastEvents = useMemo(() => {
    if (selectedYear === "all") return pastEvents;
    const year = Number.parseInt(selectedYear, 10);
    return pastEvents.filter((e) => new Date(e.date).getFullYear() === year);
  }, [pastEvents, selectedYear]);

  const paginatedPastEvents = useMemo(() => {
    const start = (currentPage - 1) * eventsPerPage;
    return filteredPastEvents.slice(start, start + eventsPerPage);
  }, [filteredPastEvents, currentPage, eventsPerPage]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.events}>
      {upcomingEvents.length > 0 && (
        <div data-type="upcoming">
          <Heading as="h2" size="sb" className="mt-4">
            {t("Events.upcomingEvents")}
          </Heading>
          {renderEvents(upcomingEvents, "upcoming", locale, t, fallbackImage)}
        </div>
      )}

      <div data-type="past">
        <div className={styles.events__header}>
          <Heading as="h2" size="sb" className="pt-8">
            {t("Events.pastEvents")}
          </Heading>
          {pastEvents.length > 0 && (
            <div className={styles.events__yearFilter}>
              <Select
                value={selectedYear}
                inputSize="sm"
                theme="dark"
                onChange={handleYearChange}
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
        {renderEvents(paginatedPastEvents, "past", locale, t, fallbackImage)}

        {filteredPastEvents.length > eventsPerPage && (
          <Pagination
            totalItems={filteredPastEvents.length}
            currentPageIndex={currentPage}
            handleSlideTo={handlePageChange}
            pageSize={eventsPerPage}
            variant="extended"
            labels={{
              first: t("Pagination.first"),
              back: t("Pagination.back"),
              next: t("Pagination.next"),
              last: t("Pagination.last"),
              of: t("Pagination.of"),
            }}
          />
        )}
      </div>
    </div>
  );
};
