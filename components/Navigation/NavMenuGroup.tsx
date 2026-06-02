"use client";

import cx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MenuColumn } from "@/utils/menuHelpers";
import styles from "./Navigation.module.scss";

type NavMenuGroupProps = {
  column: MenuColumn;
  pathname: string | null;
  /** Mobile drawer: submenu always visible, no flyout toggle. */
  inline?: boolean;
};

export function NavMenuGroup({ column, pathname, inline = false }: NavMenuGroupProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLLIElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (inline || !open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [inline, open, close]);

  useEffect(() => {
    if (inline || !open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [inline, open, close]);

  const title = (
    <>
      {column.title} <span className={styles.nav__title__chevron} aria-hidden />
    </>
  );

  return (
    <li
      ref={anchorRef}
      className={cx(styles.nav__anchor, !inline && open && styles["nav__anchor--open"])}
      anchor-name="--about-anchor"
    >
      {inline ? (
        <span className={styles.nav__title}>{title}</span>
      ) : (
        <button
          type="button"
          className={styles.nav__title}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          {title}
        </button>
      )}
      <ul id={menuId} className={styles.nav__sublist} role={inline ? undefined : "menu"}>
        {column.links.map((link) => {
          const isActive = link.url === "/" ? pathname === "/" : pathname?.startsWith(link.url);
          return (
            <li key={link.id} role={inline ? undefined : "none"}>
              <Link
                href={link.url}
                target={link.target}
                role={inline ? undefined : "menuitem"}
                className={cx(styles.nav__sublink, isActive && styles["nav__sublink--active"])}
                onClick={close}
              >
                {link.title} {link.icon && link.icon}
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
