import type { InfoCardVariant } from "@/components/Cards";
import type {
  CardsPerPage,
  CollectionConnectorProps,
  CollectionVariant,
  ItemsPerRow,
} from "@/components/Collection/CollectionConnector";
import type { HeadingSizeValue, HeadingTag } from "@/components/Headings";
import type { PaginationProps } from "@/components/Pagination";
import type { CardVariantType } from "@/types/card";

type ContentfulEntry = {
  sys?: { id?: string; contentType?: { sys?: { id?: string } } };
  fields?: Record<string, unknown>;
};

/** Extract heading text from Contentful heading ref (resolved entry has fields.heading or heading) */
function getHeadingText(headingRef: unknown): string {
  if (!headingRef || typeof headingRef !== "object") return "";
  const obj = headingRef as Record<string, unknown>;
  return (obj.heading as string) ?? (obj.fields as { heading?: string })?.heading ?? (obj.title as string) ?? "";
}

/** Transform a Contentful card entry to CollectionConnector card shape */
function contentfulCardToCollectionCard(entry: ContentfulEntry): Record<string, unknown> {
  const fields = entry?.fields ?? {};
  const contentType = entry?.sys?.contentType?.sys?.id;

  // News entries: simpler shape, add type for CollectionConnector
  if (contentType === "news") {
    const headingText = getHeadingText(fields.heading) || (fields.title as string) || "";
    const headingRef = fields.heading as { fields?: { as?: string; size?: string } } | undefined;
    const rawAs = (headingRef?.fields?.as as string) ?? "h3";
    const rawSize = (headingRef?.fields?.size as string) ?? "h3";
    const as = (rawAs === "h6" ? "h5" : rawAs) as HeadingTag;
    const size = (rawSize === "h6" ? "h5" : rawSize) as HeadingSizeValue;
    return {
      ...fields,
      id: (entry.sys?.id as string) ?? "",
      type: "news",
      heading: headingText ? { heading: headingText, as, size } : undefined,
      cover: fields.cover,
      date: fields.date,
      excerpt: fields.excerpt,
      content: fields.content,
    };
  }

  const headingText = getHeadingText(fields.heading) || (fields.title as string) || "";
  const headingRef = fields.heading as { fields?: { as?: string; size?: string } } | undefined;
  const rawAs = (headingRef?.fields?.as as string) ?? "h3";
  const rawSize = (headingRef?.fields?.size as string) ?? "h3";
  const as = (rawAs === "h6" ? "h5" : rawAs) as HeadingTag;
  const size = (rawSize === "h6" ? "h5" : rawSize) as HeadingSizeValue;

  const infoCardVariant = fields.infoCardVariants as InfoCardVariant | undefined;

  return {
    ...fields,
    id: (entry.sys?.id as string) ?? "",
    image: fields.image,
    images: fields.images ?? (fields.image ? [fields.image] : []),
    heading: headingText ? { heading: headingText, as, size } : undefined,
    infoCardVariant: infoCardVariant ?? undefined,
  };
}

/** Transform Contentful collection entry to CollectionConnector props */
export function contentfulCollectionToConnectorProps(entry: ContentfulEntry): CollectionConnectorProps | null {
  const fields = entry?.fields ?? {};
  const cardsRaw = (fields.cards ?? fields.members ?? []) as ContentfulEntry[];
  const cards = cardsRaw
    .filter((c) => c && (c.fields || c.sys))
    .map((c) => contentfulCardToCollectionCard(c)) as CollectionConnectorProps["cards"];

  if (!cards?.length) return null;

  const variant = (fields.variant as CollectionVariant) ?? "grid";
  const cardVariant = (fields.cardVariant as CardVariantType) ?? "boat";

  const props: CollectionConnectorProps = {
    cards,
    cardVariant,
    ...(variant === "grid" && {
      variant: "grid",
      itemsPerRow: (fields.itemsPerRow as ItemsPerRow) ?? 2,
      cardsWidth: fields.cardsWidth as string | undefined,
    }),
    ...(variant === "paginated" && {
      variant: "paginated",
      cardsPerPage: (fields.cardsPerPage as CardsPerPage) ?? 3,
      itemsPerRow: (fields.itemsPerRow as ItemsPerRow) ?? undefined,
      itemsPerPage: (fields.itemsPerPage as number) ?? undefined,
      paginationVariant: (fields.paginationVariant as PaginationProps["variant"]) ?? "default",
      numberOfPaginationToDisplay: (fields.numberOfPaginationToDisplay as number) ?? 5,
      totalCardsPerPage: fields.totalCardsPerPage as number | undefined,
      autoFit: fields.autoFit as boolean | undefined,
      colWidth: fields.colWidth as string | undefined,
    }),
    ...(variant === "slider" && {
      variant: "slider",
      itemsPerRow: (fields.itemsPerRow as ItemsPerRow) ?? 2,
      isOffset: fields.isOffset as boolean | undefined,
    }),
  };

  return props;
}
