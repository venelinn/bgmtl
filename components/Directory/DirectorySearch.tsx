"use client";

// Search box + optional autocomplete (ARIA combobox).
//
// Suggestions are computed by the parent (categories + listings that match the
// query) and passed in; this component owns only the open/active state and the
// keyboard interaction. With `enabled={false}` it renders a plain search input.

import clsx from "clsx";
import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import styles from "./FilterableDirectory.module.scss";

export type DirectorySearchLabels = {
  placeholder: string;
  searchAriaLabel: string;
  clear: string;
  categoriesHeading: string;
  listingsHeading: string;
};

export type DirectorySearchProps = {
  query: string;
  onQueryChange: (q: string) => void;
  enabled: boolean;
  categoryMatches: { slug: string; label: string }[];
  listingMatches: { id: string; label: string }[];
  onPickCategory: (slug: string) => void;
  onPickListing: (id: string) => void;
  labels: DirectorySearchLabels;
};

export const DirectorySearch = ({
  query,
  onQueryChange,
  enabled,
  categoryMatches,
  listingMatches,
  onPickCategory,
  onPickListing,
  labels,
}: DirectorySearchProps) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Flat list of selectable rows (categories first, then listings) for keyboard
  // navigation; the index maps back to the right section.
  const flat = [
    ...categoryMatches.map((c) => ({ kind: "category" as const, key: c.slug, label: c.label })),
    ...listingMatches.map((l) => ({ kind: "listing" as const, key: l.id, label: l.label })),
  ];

  const showList = enabled && open && query.trim() !== "" && flat.length > 0;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const pick = (i: number) => {
    const row = flat[i];
    if (!row) return;
    if (row.kind === "category") onPickCategory(row.key);
    else onPickListing(row.key);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      // -1 returns the highlight to the input (no option selected).
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (showList && activeIndex >= 0) {
        e.preventDefault();
        pick(activeIndex);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const renderOption = (label: string, icon: string, index: number) => (
    <li
      key={optionId(index)}
      id={optionId(index)}
      role="option"
      aria-selected={index === activeIndex}
      className={clsx(styles.directory__suggestOption, index === activeIndex && styles["directory__suggestOption--active"])}
      // Keep focus on the input so the click registers before blur closes the list.
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => pick(index)}
    >
      <Icon name={icon} className={styles.directory__suggestIcon} size={16} strokeWidth="1.5" />
      <span>{label}</span>
    </li>
  );

  return (
    <div className={styles.directory__search}>
      <Icon name="Search" className={styles.directory__searchIcon} size={20} strokeWidth="1.5" />
      <input
        type="search"
        className={styles.directory__searchInput}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={labels.placeholder}
        aria-label={labels.searchAriaLabel}
        role={enabled ? "combobox" : undefined}
        aria-expanded={enabled ? showList : undefined}
        aria-controls={enabled && showList ? listId : undefined}
        aria-autocomplete={enabled ? "list" : undefined}
        aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
      />
      {query && (
        <button
          type="button"
          className={styles.directory__clear}
          onClick={() => onQueryChange("")}
          aria-label={labels.clear}
        >
          <Icon name="X" strokeWidth="1.5" />
        </button>
      )}

      {showList && (
        <ul id={listId} role="listbox" className={styles.directory__suggest}>
          {categoryMatches.length > 0 && (
            <li role="presentation" className={styles.directory__suggestHeading}>
              {labels.categoriesHeading}
            </li>
          )}
          {categoryMatches.map((c, i) => renderOption(c.label, "Tag", i))}
          {listingMatches.length > 0 && (
            <li role="presentation" className={styles.directory__suggestHeading}>
              {labels.listingsHeading}
            </li>
          )}
          {listingMatches.map((l, j) => renderOption(l.label, "MapPin", categoryMatches.length + j))}
        </ul>
      )}
    </div>
  );
};

export default DirectorySearch;
