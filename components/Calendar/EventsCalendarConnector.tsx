import { getEventPermalink } from "@/utils/common";
import { getAllEvents } from "@/utils/content";
import type { HeadingProps } from "../Headings";
import { type CalendarEvent, EventCalendar } from "./EventCalendar";

interface EventsCalendarConnectorProps {
  locale: string;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  heading?: HeadingProps;
}

export async function EventsCalendarConnector({
  locale,
  heading,
  selectedDate,
  onDateSelect,
}: EventsCalendarConnectorProps) {
  const events = (await getAllEvents(locale)) as any[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map events to calendar events with permalinks and past/upcoming status
  const calendarEvents: CalendarEvent[] = events.map((event) => {
    const bulgarianHeading = (event as any).bgHeading || event.heading?.heading || "event";
    const permalink = getEventPermalink({ locale, title: bulgarianHeading });
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    // Normalize date to YYYY-MM-DD format to match calendar format
    const normalizedDate = event.date.includes("T") ? event.date.split("T")[0] : event.date;

    return {
      date: normalizedDate,
      title: event.heading?.heading || bulgarianHeading,
      permalink,
      isPastEvent: eventDate < today,
    };
  });

  return (
    <EventCalendar
      calendarEvents={calendarEvents}
      locale={locale}
      heading={heading}
      selectedDate={selectedDate}
      onDateSelect={onDateSelect}
    />
  );
}
