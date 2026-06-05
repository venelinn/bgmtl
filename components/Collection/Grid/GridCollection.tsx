"use client";
import gsap from "gsap";
import { type ReactNode, useEffect, useRef } from "react";
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

export const GridCollection = ({ items, itemsPerRow = 2 }: GridCollectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;

    const cells = Array.from(containerRef.current.querySelectorAll<HTMLElement>("[data-anim-item]"));

    gsap.fromTo(
      cells,
      { opacity: 0, y: 20 }, // initial state
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power4.out",
        scrollTrigger: {
          trigger: containerRef.current, // trigger the animation when the container enters the viewport
          start: "top 80%",
          toggleActions: "play none none none",
        },
      },
    );
  }, []);
  return (
    <Row cols={itemsPerRow} className={styles.wrapper} ref={containerRef}>
      {items.map((item) => (
        <Cell key={item.id} data-anim-item>
          {item.content}
        </Cell>
      ))}
    </Row>
  );
};
