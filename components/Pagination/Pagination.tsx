import clsx from "clsx";
import type React from "react";
import { useMemo } from "react";
import { Icon } from "@/components/Icon";
import styles from "./Pagination.module.scss";

export const paginationVariants = {
  default: "default",
  extended: "extended",
  noControls: "no-controls",
} as const;

export interface PaginationProps {
  totalItems: number;
  currentPageIndex: number;
  handleSlideTo: (page: number) => void;
  variant?: (typeof paginationVariants)[keyof typeof paginationVariants];
  visibleRange?: { start: number; end: number };
  labels?: PaginationLabels;
  theme?: "light" | "dark";
  pageSize?: number;
}

export interface PaginationLabels {
  first?: string;
  back?: string;
  next?: string;
  last?: string;
  of?: string;
}

const defaultLabels = {
  first: "First",
  back: "Back",
  last: "Last",
  next: "Next",
  of: "of",
};

export const Pagination = ({
  labels: providedLabels,
  variant = paginationVariants.default,
  totalItems,
  currentPageIndex,
  visibleRange: providedVisibleRange = { start: 1, end: 4 },
  handleSlideTo,
  theme = "light",
  pageSize = 10,
}: PaginationProps) => {
  const labels = {
    ...defaultLabels,
    ...providedLabels,
  };

  const visibleRange = useMemo(() => {
    if (variant === paginationVariants.noControls && providedVisibleRange) {
      return providedVisibleRange;
    }

    const rangeSize = providedVisibleRange.end - providedVisibleRange.start + 1;
    const half = Math.floor(rangeSize / 2);

    let start = Math.max(1, currentPageIndex - half);
    let end = start + rangeSize - 1;

    if (end > totalItems) {
      end = totalItems;
      start = Math.max(1, end - rangeSize + 1);
    }

    if (start < 1) {
      start = 1;
      end = rangeSize;
    }

    return { start, end };
  }, [providedVisibleRange, currentPageIndex, totalItems, variant]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const items = Array.from({ length: totalPages }, (_, i) => ({
    key: i + 1,
    label: i + 1,
  }));

  const isFirst = currentPageIndex === 1;
  const isLast = currentPageIndex === totalPages;

  const showNav = variant !== paginationVariants.noControls;
  const showExt = variant === paginationVariants.extended;

  return (
    <nav className={styles.pagination} data-variant={variant} data-theme={theme}>
      {showExt && (
        <PaginationNavButton className={styles.text} onClick={() => handleSlideTo(1)} disabled={isFirst}>
          <Icon name="ends-start-micro" className={styles.btnIcon} />
          <span className={styles.text__label}>{labels.first}</span>
        </PaginationNavButton>
      )}

      {showNav && (
        <PaginationNavButton
          className={styles.text}
          onClick={() => handleSlideTo(currentPageIndex - 1)}
          disabled={isFirst}
        >
          <Icon
            name={variant !== paginationVariants.extended && isFirst ? "nope" : "chevron-left-micro"}
            className={styles.btnIcon}
          />{" "}
          <span className={styles.text__label}>{labels.back}</span>
        </PaginationNavButton>
      )}

      <ul className={styles.paginationList}>
        <NumberedButtons
          items={items.slice(visibleRange.start - 1, visibleRange.end)}
          currentPageIndex={currentPageIndex}
          handleSlideTo={handleSlideTo}
        />
        <li className={styles.paginationList__Mobile}>
          {currentPageIndex} {labels.of} {totalPages}
        </li>
      </ul>

      {showNav && (
        <PaginationNavButton
          className={styles.text}
          onClick={() => handleSlideTo(currentPageIndex + 1)}
          disabled={isLast}
        >
          <span className={styles.text__label}>{labels.next}</span>
          <Icon
            name={variant !== paginationVariants.extended && isLast ? "nope" : "chevron-right-micro"}
            className={styles.btnIcon}
          />
        </PaginationNavButton>
      )}

      {showExt && (
        <PaginationNavButton className={styles.text} onClick={() => handleSlideTo(totalPages)} disabled={isLast}>
          <span className={styles.text__label}>{labels.last}</span>
          <Icon name="ends-end-micro" className={styles.btnIcon} />
        </PaginationNavButton>
      )}
    </nav>
  );
};

const PaginationNavButton = ({
  children,
  onClick,
  disabled,
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    className={clsx(styles.paginationBtn, className)}
    type="button"
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);
const NumberedButtons = ({
  items,
  currentPageIndex,
  handleSlideTo,
}: {
  items: { key: number; label: number }[];
  currentPageIndex: number;
  handleSlideTo: (page: number) => void;
}) =>
  items.map((p) => {
    const isActive = currentPageIndex === p.key;
    return (
      <li key={p.key}>
        <button
          className={clsx(styles.paginationBtn, {
            [styles.active]: isActive,
          })}
          type="button"
          onClick={() => handleSlideTo(p.key)}
        >
          {p.label}
        </button>
      </li>
    );
  });
