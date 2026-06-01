import type { HeadingProps } from "@/components/Headings";

type RichTextContent = Record<string, unknown> | string;

export type NewsImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type NewsItem = {
  id: string;
  date: string;
  heading: HeadingProps;
  cover?: NewsImage[];
  content?: RichTextContent;
  excerpt?: RichTextContent;
  [key: string]: unknown;
};

export type NewsProps = {
  news: NewsItem;
  locale: string;
  /** Fallback image URL when news cover is missing (from site config). */
  fallbackImage?: string;
};

export type NewsConnectorProps = {
  id?: string;
  news?: NewsItem[];
  locale: string;
};
