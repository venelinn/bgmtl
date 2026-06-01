import type { PaginationProps } from "@/components/Pagination";
import { PaginatedCollection, type PaginatedCollectionProps } from "./PaginatedCollection";

type PaginatedCollectionConnectorProps = {
  id?: string;
  cardsPerPage?: 2 | 3 | 4;
  paginationVariant?: PaginationProps["variant"];
  numberOfPaginationToDisplay?: number;
  autoFit?: boolean;
  totalCardsPerPage?: number;
  items: PaginatedCollectionProps["items"];
};

export const PaginatedCollectionConnector = (props: PaginatedCollectionConnectorProps) => {
  const cards = props.items ?? [];

  if (!cards.length) return null;

  return <PaginatedCollection {...props} />;
};
