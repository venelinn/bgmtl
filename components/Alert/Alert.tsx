import cx from "clsx"
import type { ReactNode } from "react"
import { Icon } from "@/components/Icon"
import styles from "./Alert.module.scss"

export type AlertProps = {
	variant?: "info" | "warning"
	/** Lucide icon name; defaults per variant. */
	icon?: string
	title?: string
	children: ReactNode
	className?: string
}

const DEFAULT_ICON: Record<NonNullable<AlertProps["variant"]>, string> = {
	info: "Info",
	warning: "TriangleAlert",
}

/** Inline notice box (not a live region): an icon, optional title and text. */
export function Alert({ variant = "info", icon, title, children, className }: AlertProps) {
	return (
		<div role="note" className={cx(styles.alert, className)} data-variant={variant}>
			<Icon name={icon ?? DEFAULT_ICON[variant]} size={20} className={styles.alert__icon} />
			<div className={styles.alert__body}>
				{title && <strong className={styles.alert__title}>{title}</strong>}
				<div className={styles.alert__text}>{children}</div>
			</div>
		</div>
	)
}
