import type { ReactNode } from "react";
import { Cell, Row, type RowProps } from "@/components/Grid";
import styles from "./GridCollection.module.scss";

export interface GridCollectionItem {
  id: string;
  content: ReactNode;
}
export type GridCollectionProps = {
  id?: string;
  items: GridCollectionItem[];
  itemsPerRow?: RowProps["cols"];
  cardsWidth?: string;
};

// Entrance is a plain CSS fade-in-up (see .module.scss). It replaces the previous
// GSAP + ScrollTrigger reveal: nothing here depended on JS animation, and the
// scroll gate broke the filterable directory — sections mounted already in the
// viewport stayed stuck at opacity 0 because no scroll ever fired their trigger.
// CSS animates each card as it enters the DOM, so filtered results always show.
export const GridCollection = ({ items, itemsPerRow = 2 }: GridCollectionProps) => (
  <Row cols={itemsPerRow} className={styles.wrapper}>
    {items.map((item) => (
      <Cell key={item.id} className={styles.cell}>
        {item.content}
      </Cell>
    ))}
  </Row>
);
