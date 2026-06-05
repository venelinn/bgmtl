import type { HeadingProps } from "@/components/Headings";
import type { SectionProps } from "@/components/Section";

type RichTextContent = Record<string, unknown> | string;

export type EventImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type EventAddress = {
  lat: number;
  lon: number;
};

export type EventVenueLogo = {
  logo?: EventImage[];
};

export type EventItem = {
  id: string;
  date: string;
  venue?: string;
  heading: HeadingProps;
  cover?: EventImage[];
  venueLogo?: EventVenueLogo;
  doorsOpen?: string;
  address?: EventAddress;
  gallery?: string;
  content?: RichTextContent;
  excerpt?: RichTextContent;
  price?: string; // e.g. "From $49"
  [key: string]: unknown;
};

export type EventType = "upcoming" | "past";

export type EventsProps = {
  id?: string;
  events?: EventItem[];
  columns?: number | string;
  layout?: string;
  heading?: SectionProps["heading"];
  locale: string;
  onlyUpcoming?: boolean;
};

export type EventProps = {
  event: EventItem;
  type: EventType;
  locale: string;
  /** Fallback image URL when event cover is missing (from site config). */
  fallbackImage?: string;
};

export type EventsConnectorProps = EventsProps & { fallbackImage?: string; eventsPerPage?: number };
