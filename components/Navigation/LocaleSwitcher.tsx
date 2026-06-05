"use client"

import cx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { localeFlags, localeNames, localization } from "@/utils/localization"
import styles from "./LocaleSwitcher.module.scss"

type LocaleSwitcherProps = {
	pageLocale: string
	/** Leading glyph on each dropdown row: per-country flag or a generic globe. */
	rowIcon?: "flag" | "globe"
	/** Render the locales as a plain always-visible list instead of a dropdown
	 * (used inside the mobile menu sheet). */
	inline?: boolean
}

export const LocaleSwitcher = ({
	pageLocale,
	rowIcon = "flag",
	inline = false,
}: LocaleSwitcherProps) => {
	const pathname = usePathname() // ✅ replaces router.asPath
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	const close = useCallback(() => setOpen(false), [])
	const toggle = useCallback(() => setOpen((v) => !v), [])

	// Leading glyph for a row. `flag` uses flag-icons (`fi fi-<country>` classes,
	// loaded globally via styles/globals.scss); `globe` uses a single Lucide
	// icon. Decorative either way — the language is named in text.
	const leadFor = (lang: string) =>
		rowIcon === "globe" ? (
			<Icon name="Globe" className={styles.languages__lead} aria-hidden />
		) : (
			<span
				className={cx(
					"fi",
					`fi-${localeFlags[lang] ?? lang}`,
					styles.languages__lead,
					styles.languages__flag,
				)}
				aria-hidden
			/>
		)

	// Close the menu whenever the route changes (a language pick navigates).
	// biome-ignore lint/correctness/useExhaustiveDependencies: route change should dismiss
	useEffect(close, [pathname, close])

	// Drive the native popover from React state. `popover="auto"` gives us
	// click-outside + Esc dismissal for free; CSS anchor positioning (see
	// `.languages__menu`) handles placement.
	useEffect(() => {
		const el = menuRef.current
		if (!el) return
		if (open && !el.matches(":popover-open")) el.showPopover()
		else if (!open && el.matches(":popover-open")) el.hidePopover()
	}, [open])

	// Mirror native dismissals (backdrop click / Esc) back into React state.
	useEffect(() => {
		const el = menuRef.current
		if (!el) return
		const onToggle = (e: Event) => {
			const evt = e as Event & { newState?: string }
			if (evt.newState === "closed") setOpen(false)
		}
		el.addEventListener("toggle", onToggle)
		return () => el.removeEventListener("toggle", onToggle)
	}, [])

	// One locale row, shared by the dropdown and the inline (mobile) list.
	const renderLink = (lang: string, role?: string) => {
		const isActive = pageLocale === lang
		const safePath = pathname ?? "/"
		// Swap the leading /xx/ locale prefix for the chosen language.
		const newPath = `/${lang}${safePath.replace(/^\/[a-z]{2}(\/|$)/, "/")}`

		return (
			<Link
				href={newPath}
				key={lang}
				role={role}
				aria-current={isActive ? "true" : undefined}
				className={cx(
					styles.languages__item,
					isActive && styles["languages__item--active"],
				)}
				onClick={close}
			>
				{leadFor(lang)}
				<span className={styles.languages__name}>
					{localeNames[lang] ?? lang}
				</span>
				<span className={styles.languages__code}>{lang.toUpperCase()}</span>
			</Link>
		)
	}

	// Mobile menu: a plain always-visible list, no trigger / dropdown.
	if (inline) {
		return (
			<ul className={styles.languages__list} aria-label="Select language">
				{localization.locales.map((lang) => (
					<li key={lang}>{renderLink(lang)}</li>
				))}
			</ul>
		)
	}

	return (
		<div className={styles.languages}>
			<Button
				variant="link"
				size="sm"
				icon="Globe"
				iconAfter="ChevronDown"
				label={pageLocale.toUpperCase()}
				onClick={toggle}
				className={cx(
					styles.languages__trigger,
					open && styles["languages__trigger--open"],
				)}
			/>
			<div
				ref={menuRef}
				popover="auto"
				role="menu"
				aria-label="Select language"
				className={styles.languages__menu}
			>
				{localization.locales.map((lang) => renderLink(lang, "menuitem"))}
			</div>
		</div>
	)
}
