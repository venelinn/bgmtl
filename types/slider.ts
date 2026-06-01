import type { ReactNode } from "react";
import type { HeadingProps } from "@/components/Headings";
import type { SectionProps } from "@/components/Section";
import type { CardProps } from "./card";

export type SliderItemImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type SliderItemHeading = {
  heading: string;
  as?: HeadingProps["as"];
  size?: HeadingProps["size"];
};

export type SliderItemName = {
  fullName: string;
  position?: string;
};

export type SliderItemLink = {
  url?: string;
  href?: string;
  label?: string;
  target?: string;
};

export type SliderItemData = {
  id: string;
  heading?: SliderItemHeading;
  date?: string;
  excerpt?: string;
  content?: unknown;
  sliderItemImage?: SliderItemImage[];
  image?: SliderItemImage | SliderItemImage[];
  images?: SliderItemImage[];
  name?: SliderItemName;
  link?: SliderItemLink;
  [key: string]: unknown;
};

export type SliderLink = {
  url: string;
  title?: string;
};

export type SliderItemType = {
  id?: string;
  variant?: CardProps["variant"];
  content?: ReactNode;
  heading?: SliderItemHeading;
  sliderItemImage?: SliderItemImage[];
  name?: SliderItemName;
  link?: SliderItemLink;
  [key: string]: unknown;
};

export type SliderProps = {
  items: SliderItemType[];
  variant?: CardProps["variant"];
  itemsPerRow?: 1 | 2 | 3 | 4;
  instanceId?: string; // Unique ID for each slider instance
  heading?: HeadingProps;
  link?: SliderLink;
  description?: string;
  size?: SectionProps["size"];
  isOffset?: boolean;
  __sectionProps?: Partial<SectionProps>;
};

export type SliderConnectorProps = {
  items?: SliderItemType[];
  variant?: CardProps["variant"];
  itemsPerRow?: 1 | 2 | 3 | 4;
  heading?: HeadingProps;
  description?: string;
  link?: SliderLink;
  isOffset?: boolean;
};
