"use client";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Row, type RowProps } from "@/components/Grid";
import { Pagination, type PaginationProps } from "@/components/Pagination";
import type { SectionProps } from "@/components/Section";
import { useBreakpoints } from "@/hooks/useBreakpoints";
import styles from "./PaginatedCollection.module.scss";

const defaultLabels = {
  first: "First",
  last: "Last",
  back: "Prev",
  next: "Next",
  of: "of",
} as const;

export type PaginatedCollectionItem = {
  id: string;
  content: ReactNode;
};

export type PaginatedCollectionProps = {
  labels?: Partial<Record<keyof typeof defaultLabels, string>>;
  cardsPerPage?: RowProps["cols"];
  /** When provided, forces this many columns (overrides responsive breakpoints). Use for consistent layout e.g. 1 per row. */
  itemsPerRow?: RowProps["cols"];
  /** Number of items per page. Default 10 when itemsPerRow is set (e.g. 1), otherwise derived from cols. */
  itemsPerPage?: number;
  items: PaginatedCollectionItem[];
  numberOfPaginationToDisplay?: number;
  colWidth?: RowProps["minWidth"];
  paginationVariant?: PaginationProps["variant"];
  // When provided, number of rows per page. PageSize = (cardsPerPage || responsive cols) * rows
  rows?: number;
  // When provided, use this as total cards per page instead of rows*cols. Works with `autoFit`.
  totalCardsPerPage?: number;
  // If true and `totalCardsPerPage` is provided, compute columns to fit container width.
  autoFit?: boolean;
  onCardHover?: (id: string | null) => void;
  headingVariant?: SectionProps["headingVariant"];
};

export const PaginatedCollection = ({
  labels: providedLabels,
  cardsPerPage = 3,
  itemsPerRow: itemsPerRowProp,
  itemsPerPage: itemsPerPageProp,
  items,
  colWidth = "300px",
  paginationVariant = "default",
  numberOfPaginationToDisplay = 5,
  rows,
  totalCardsPerPage,
  autoFit = false,
  onCardHover,
}: PaginatedCollectionProps) => {
  const t = useTranslations("Pagination");
  const labels = {
    ...defaultLabels,
    first: t("first"),
    last: t("last"),
    back: t("back"),
    next: t("next"),
    of: t("of"),
    ...providedLabels,
  };
  const { isXs, isSm, isMd } = useBreakpoints();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [displayedEntries, setDisplayedEntries] = useState<PaginatedCollectionItem[][]>([]);
  const [visibleRange, setVisibleRange] = useState<{
    start: number;
    end: number;
  }>({
    start: 1,
    end: numberOfPaginationToDisplay,
  });

  const currentIndexRef = useRef(0);

  const effectiveVisibleCount = useMemo(
    () => (isXs ? 3 : numberOfPaginationToDisplay),
    [isXs, numberOfPaginationToDisplay],
  );

  const safeCurrentPage = Math.min(currentPage, displayedEntries.length || 1);

  const getCardsPerPage = useCallback((): Exclude<RowProps["cols"], undefined> => {
    if (itemsPerRowProp != null) return itemsPerRowProp as Exclude<RowProps["cols"], undefined>;
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 3;
    return cardsPerPage as Exclude<RowProps["cols"], undefined>;
  }, [itemsPerRowProp, isXs, isSm, isMd, cardsPerPage]);

  const parseColWidth = useCallback((w: RowProps["minWidth"]) => {
    if (!w) return 220;
    const num = parseInt(String(w), 10);
    return Number.isFinite(num) && num > 0 ? num : 220;
  }, []);

  const computed = useMemo(() => {
    const defaultCols = getCardsPerPage();
    // compute max columns that fit in container for autoFit mode
    const colWidthPx = parseColWidth(colWidth);
    const maxColsFromContainer = containerWidth ? Math.max(1, Math.floor(containerWidth / colWidthPx)) : defaultCols;

    let cols: number = defaultCols;
    let pageSize: number;

    if (itemsPerPageProp != null && itemsPerPageProp > 0) {
      pageSize = itemsPerPageProp;
      cols = defaultCols;
    } else if (rows && rows > 0) {
      cols = defaultCols;
      pageSize = cols * rows;
    } else if (totalCardsPerPage && totalCardsPerPage > 0) {
      pageSize = totalCardsPerPage;
      if (autoFit) {
        cols = Math.min(maxColsFromContainer, totalCardsPerPage, 6);
      } else {
        cols = Math.min(defaultCols, 6);
      }
    } else if (itemsPerRowProp != null) {
      // itemsPerRow set, default to 10 items per page
      cols = defaultCols;
      pageSize = 10;
    } else {
      cols = defaultCols;
      pageSize = cols;
    }

    // clamp cols to 1..6
    cols = Math.max(1, Math.min(6, Math.floor(cols)));
    pageSize = Math.max(1, Math.floor(pageSize));

    return { cols: cols as RowProps["cols"], pageSize };
  }, [
    getCardsPerPage,
    itemsPerPageProp,
    itemsPerRowProp,
    rows,
    totalCardsPerPage,
    autoFit,
    containerWidth,
    colWidth,
    parseColWidth,
  ]);

  const setupPaginatedEntries = useCallback(() => {
    const cards = computed.pageSize;
    const chunked: PaginatedCollectionItem[][] = [];

    for (let i = 0; i < items.length; i += cards) {
      chunked.push(items.slice(i, i + cards));
    }

    setDisplayedEntries(chunked);

    // Restore correct page containing previously visible index
    const currentIndex = currentIndexRef.current;
    const newPage = Math.floor(currentIndex / cards) + 1;
    if (newPage > chunked.length) {
      setCurrentPage(1);
    } else {
      setCurrentPage(newPage);
    }
  }, [items, computed.pageSize]);

  const updateVisibleRange = useCallback((currentIndex: number, totalPages: number, count: number) => {
    let start = currentIndex - Math.floor(count / 2);
    start = Math.max(start, 1);
    let end = start + (count - 1);
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - (count - 1), 1);
    }
    return { start, end };
  }, []);

  useEffect(() => {
    // Update current index before resize
    const cards = computed.pageSize;
    currentIndexRef.current = (currentPage - 1) * cards;
    setupPaginatedEntries();
  }, [setupPaginatedEntries, computed.pageSize, currentPage]);

  // measure container width for autoFit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => setContainerWidth(el.clientWidth || null);

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => measure());
      ro.observe(el);
      measure();
      return () => ro.disconnect();
    }

    // fallback
    measure();
    const handler = () => measure();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    setVisibleRange(updateVisibleRange(currentPage, displayedEntries.length, effectiveVisibleCount));
  }, [currentPage, displayedEntries.length, effectiveVisibleCount, updateVisibleRange]);

  const totalPaginatedEntries = displayedEntries.length;

  return (
    <div className={styles.paginationWrapper} ref={containerRef}>
      {totalPaginatedEntries > 0 && (
        <Row cols={computed.cols} minWidth={colWidth}>
          {displayedEntries[currentPage - 1]?.map((item) => (
            <Cell
              key={item.id}
              asCard
              onMouseEnter={() => onCardHover?.(item.id)}
              onMouseLeave={() => onCardHover?.(null)}
            >
              {item.content}
            </Cell>
          ))}
        </Row>
      )}

      {totalPaginatedEntries > 1 && (
        <Pagination
          totalItems={items.length}
          currentPageIndex={safeCurrentPage}
          handleSlideTo={setCurrentPage}
          variant={paginationVariant}
          visibleRange={visibleRange}
          labels={labels}
          pageSize={computed.pageSize}
        />
      )}
    </div>
  );
};
