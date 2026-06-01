"use client";

import cx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import useNavigationContext from "@/context/navigationContext";
import useElementSize from "@/hooks/useElementSize";
import { getCloudinaryAsSvg } from "@/utils/common";
import { extractMenuColumns } from "@/utils/menuHelpers";
import { Hamburger } from "./Hamburger";
import { LocaleSwitcher } from "./LocaleSwitcher";
import styles from "./Navigation.module.scss";

type NavigationInnerProps = {
  pageLocale: string;
  data?: any;
};

export function NavigationInner({ pageLocale, data }: NavigationInnerProps) {
  const { setRef, sticky, stuck, fixed, isOpen, toggle } = (useNavigationContext() as any) || {};
  const { logoLink, logo, menuLinks } = data;
  const [navigationRef, { height }]: any = useElementSize() as any;
  const pathname = usePathname();

  const menuColumns = extractMenuColumns(menuLinks ?? [], pageLocale, "header");

  useEffect(() => {
    document.body.classList.toggle(styles.fixedNav, fixed);
    return () => document.body.classList.remove(styles.fixedNav);
  }, [fixed]);

  return (
    <header data-header className={cx(styles.navigation, "full-width", { [styles["is-open"]]: isOpen })}>
      <style jsx global>{`
        :root {
          --navigation-height: ${height}px;
        }
      `}</style>
      <div className={styles.navigation__inner} data-anim="navigation">
        <div className={styles.navigation__logo}>
          <Link href={logoLink?.slug || "/"} className={styles.logo} aria-label={logo[0].alt || "Home"}>
            <Image
              src={getCloudinaryAsSvg(logo[0].src)}
              alt={logo[0].alt || "Logo"}
              width={logo[0].width}
              height={logo[0].height}
            />
          </Link>
        </div>
        <div className={styles.navigation__right}>
          <div
            className={styles.navigation__menu}
            ref={(el) => {
              navigationRef?.(el);
              setRef?.(el);
            }}
          >
            <ul className={styles.nav}>
              {menuColumns.length > 0 &&
                menuColumns.map((column) => {
                  /**
                   * Header rendering logic:
                   * - Single-link columns (Home, Sponsors) → render as plain links
                   * - Multi-link columns (About us) → render as titled group with nested list
                   * This creates the header structure: plain link, grouped section, plain link
                   */
                  if (column.links.length === 1) {
                    const link = column.links[0];
                    const isActive = link.url === "/" ? pathname === "/" : pathname?.startsWith(link.url);
                    return (
                      <li key={column.id}>
                        <Link
                          href={link.url}
                          target={link.target}
                          data-text={link.title}
                          className={cx(styles.link, styles.link__main, "link", isActive && styles.link__active)}
                        >
                          {link.title} {link.icon && link.icon}
                        </Link>
                      </li>
                    );
                  }
                  // Multi-link column: render with title
                  return (
                    <li key={column.id} className={styles.nav__anchor} anchor-name="--about-anchor">
                      <span className={styles.nav__title}>
                        {column.title} <span className={styles.nav__title__chevron} />
                      </span>
                      <ul className={styles.nav__sublist}>
                        {column.links.map((link) => {
                          const isActive = link.url === "/" ? pathname === "/" : pathname?.startsWith(link.url);
                          return (
                            <li key={link.id}>
                              <Link
                                href={link.url}
                                target={link.target}
                                data-text={link.title}
                                className={cx(styles.link, "link", isActive && styles.link__active)}
                              >
                                {link.title} {link.icon && link.icon}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
            </ul>
          </div>
          <LocaleSwitcher pageLocale={pageLocale} />
        </div>

        <Hamburger isOpen={isOpen} toggle={toggle} />
      </div>
    </header>
  );
}
