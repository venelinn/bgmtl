"use client";

import cx from "clsx";
import styles from "./Navigation.module.scss";

export function Hamburger({ isOpen, toggle }: { isOpen?: boolean; toggle?: () => void }) {
  return (
    <button
      className={cx(styles.hamburger, { [styles["is-nav-active"]]: isOpen })}
      type="button"
      aria-label="Toggle menu"
      onClick={toggle}
    >
      <div className={styles.hamburger__lines}>
        <span></span>
      </div>
    </button>
  );
}
