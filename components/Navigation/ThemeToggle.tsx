"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.scss";

type Theme = "light" | "dark";

/** localStorage key — kept in sync with the pre-paint script in app/layout.tsx. */
const STORAGE_KEY = "bgmtl-theme";

/**
 * Pure-CSS sun/moon dark-mode toggle (box-shadow icon). The first-paint theme is
 * set by the inline bootstrap script in `app/layout.tsx`; this component reflects
 * and flips it. The visual state is driven by `data-mode` (not `data-theme`) to
 * avoid re-triggering the global `[data-theme="dark"]` block on this element.
 */
export const ThemeToggle = () => {
	const [theme, setTheme] = useState<Theme>("light");

	// Adopt whatever the bootstrap script already applied to <html>. Both the
	// server and the first client render default to "light", so there is no
	// hydration mismatch; the glyph corrects itself right after mount.
	useEffect(() => {
		if (document.documentElement.dataset.theme === "dark") setTheme("dark");
	}, []);

	const apply = (next: Theme) => {
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// Storage can be blocked (private mode) — theme still applies this session.
		}
		setTheme(next);
	};

	const toggle = () => {
		const next: Theme = theme === "dark" ? "light" : "dark";
		// Soft cross-fade via the View Transitions already enabled site-wide.
		if (typeof document !== "undefined" && document.startViewTransition) {
			document.startViewTransition(() => apply(next));
		} else {
			apply(next);
		}
	};

	const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

	return (
		<button
			type="button"
			onClick={toggle}
			className={styles.themeToggle}
			data-mode={theme}
			aria-label={label}
			title={label}
		/>
	);
};
