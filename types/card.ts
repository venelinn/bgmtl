import type { HeadingProps } from "@/components/Headings";

// Rich text content can be Contentful Document or plain string
type RichTextContent = Record<string, unknown> | string;

export interface CardImage {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

export type CardVariantType = "primary" | "member" | "info" | "event" | "news";

export interface CardVariant {
  variant?: CardVariantType;
}

export interface CardImageRatio {
  imageRatio?: "1/1" | "16/9" | "4/3" | "3/2" | "16/6";
}

export interface CardLink {
  url?: string;
  name?: string;
  target?: string;
  type?: string;
}

export interface CardProps {
  id?: string;
  heading?: HeadingProps;
  image?: CardImage;
  variant?: CardVariantType;
  imageRatio?: CardImageRatio["imageRatio"];
  content?: RichTextContent;
  description?: RichTextContent;
  link?: CardLink;
  role?: string;
}
