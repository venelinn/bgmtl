"use client";

import clsx from "clsx";
import Form from "next/form";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { parseLinkAppearance } from "@/utils/linkHelpers";
import styles from "./HeroSearch.module.scss";

export type HeroSearchCategory = { slug: string; label: string };

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
};

/**
 * Extended-hero search block: a GET form into the community directory (which
 * reads `?q=`), quick category chips (`/community/<slug>`) and up to two CTA
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
}: HeroSearchProps) => {
  const t = useTranslations("Hero");

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
          />
          <Button
            type="submit"
            variant="primary"
            label={buttonLabel || t("searchButton")}
            className={styles.search__submit}
          />
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
