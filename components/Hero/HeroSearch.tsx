"use client";

import clsx from "clsx";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { parseLinkAppearance } from "@/utils/linkHelpers";
import styles from "./HeroSearch.module.scss";

export type HeroSearchCategory = { slug: string; label: string };

export type HeroSearchSuggestion = {
  kind: "category" | "listing" | "event" | "news";
  label: string;
  /** What the query is matched against (label plus extras like venue/address). */
  text: string;
  href: string;
};

// Group order in the dropdown, with each group's icon and row cap.
const GROUPS = [
  { kind: "category", icon: "Tag", max: 3 },
  { kind: "listing", icon: "MapPin", max: 4 },
  { kind: "event", icon: "Calendar", max: 3 },
  { kind: "news", icon: "Newspaper", max: 3 },
] as const;

// Categories listed when the box is focused before anything is typed.
const MAX_BROWSE_CATEGORIES = 10;

// Case- and accent-insensitive match ("Montréal" ~ "montreal"); Cyrillic intact.
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export type HeroSearchButton = {
  id: string;
  href: string;
  label: string;
  fields: Record<string, unknown>;
};

export type HeroSearchProps = {
  /** Locale-prefixed directory path the search submits to, e.g. "/en/community". */
  directoryPath: string;
  placeholder?: string;
  buttonLabel?: string;
  quickLinksLabel?: string;
  categories?: HeroSearchCategory[];
  buttons?: HeroSearchButton[];
  /** Site-wide autocomplete index (directory, events, news). */
  suggestions?: HeroSearchSuggestion[];
};

/**
 * Extended-hero search block: a GET form into the community directory (which
 * reads `?q=`) with a site-wide autocomplete (categories, listings, events,
 * news — picking one navigates to it; Enter without a pick searches the
 * directory), quick category chips (`/community/<slug>`) and up to two CTA
 * buttons. Every label is editable on the Hero entry; empty ones fall back to
 * the `Hero` messages.
 */
export const HeroSearch = ({
  directoryPath,
  placeholder,
  buttonLabel,
  quickLinksLabel,
  categories = [],
  buttons = [],
  suggestions = [],
}: HeroSearchProps) => {
  const t = useTranslations("Hero");
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Matches grouped in GROUPS order; `flat` is the same rows for keyboard nav.
  // An empty query browses: just the directory categories.
  const browsing = query.trim() === "";
  const groups = useMemo(() => {
    const q = fold(query.trim());
    if (!q) {
      const rows = suggestions.filter((s) => s.kind === "category").slice(0, MAX_BROWSE_CATEGORIES);
      return rows.length ? [{ ...GROUPS[0], rows }] : [];
    }
    return GROUPS.map((g) => ({
      ...g,
      rows: suggestions.filter((s) => s.kind === g.kind && fold(s.text).includes(q)).slice(0, g.max),
    })).filter((g) => g.rows.length > 0);
  }, [query, suggestions]);
  const flat = groups.flatMap((g) => g.rows);

  const showList = open && flat.length > 0;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const pick = (i: number) => {
    const row = flat[i];
    if (!row) return;
    setOpen(false);
    setActiveIndex(-1);
    router.push(row.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // -1 returns the highlight to the input (no option selected).
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && showList && activeIndex >= 0) {
      // Otherwise Enter submits the form to the directory as before.
      e.preventDefault();
      pick(activeIndex);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  let rowIndex = 0;

  return (
    <div className={styles.search}>
      <div className={styles.search__panel}>
        <Form action={directoryPath} className={styles.search__form} role="search">
          <Icon name="Search" className={styles.search__icon} size={20} strokeWidth="1.5" />
          <input
            type="search"
            name="q"
            className={styles.search__input}
            placeholder={placeholder || t("searchPlaceholder")}
            aria-label={t("searchAriaLabel")}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={showList}
            aria-controls={showList ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          />
          {query && (
            <button
              type="button"
              className={styles.search__clear}
              onClick={() => setQuery("")}
              aria-label={t("clear")}
            >
              <Icon name="X" size={18} strokeWidth="1.5" />
            </button>
          )}
          <Button
            type="submit"
            variant="primary"
            label={buttonLabel || t("searchButton")}
            className={styles.search__submit}
          />

          {showList && (
            <ul
              id={listId}
              role="listbox"
              className={clsx(styles.search__suggest, browsing && styles["search__suggest--browse"])}
            >
              {groups.map((group) => (
                <li key={group.kind} role="presentation">
                  <span className={styles.search__suggestHeading}>{t(`suggest.${group.kind}`)}</span>
                  <ul role="group" aria-label={t(`suggest.${group.kind}`)} className={styles.search__suggestGroup}>
                    {group.rows.map((row) => {
                      const index = rowIndex++;
                      return (
                        <li
                          key={row.href}
                          id={optionId(index)}
                          role="option"
                          aria-selected={index === activeIndex}
                          className={clsx(
                            styles.search__suggestOption,
                            index === activeIndex && styles["search__suggestOption--active"],
                          )}
                          // Keep focus on the input so the click lands before blur closes the list.
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => pick(index)}
                        >
                          <Icon name={group.icon} className={styles.search__suggestIcon} size={16} strokeWidth="1.5" />
                          <span>{row.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Form>

        {categories.length > 0 && (
          <nav className={styles.search__quick} aria-label={quickLinksLabel || t("quickLinksLabel")}>
            <span className={styles.search__quickLabel}>{quickLinksLabel || t("quickLinksLabel")}</span>
            <ul className={styles.search__chips}>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`${directoryPath}/${category.slug}`} className={styles.search__chip}>
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {buttons.length > 0 && (
        <div className={styles.search__actions}>
          {buttons.map((button) => {
            const { buttonVariant } = parseLinkAppearance(button.fields);
            const isExternal = button.href.startsWith("http");
            return (
              <Button
                key={button.id}
                variant={buttonVariant}
                className={clsx(styles.search__action, styles[`search__action--${buttonVariant}`])}
                label={button.label}
                icon={(button.fields.iconName as string) || undefined}
                href={isExternal ? undefined : button.href}
                isExternal={isExternal}
                externalHref={isExternal ? button.href : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
