import clsx from "clsx"
import Link from "next/link"
import { Icon } from "@/components/Icon"
import type { FormElementSize } from "@/types/forms"
import styles from "./Button.module.scss"

export const BUTTON_VARIANTS = [
	"primary",
	"success",
	"secondary",
	"toggle",
	"request",
	"danger",
	"warning",
	"link",
] as const

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]
type IconPosition = "left" | "right" | undefined

export interface ButtonProps {
	label?: string
	href?: string
	isExternal?: boolean
	externalHref?: string
	type?: "button" | "submit" | "reset"
	onClick?: () => void
	disabled?: boolean
	className?: string
	variant?: ButtonVariant
	outlined?: boolean
	size?: FormElementSize
	icon?: string
	iconSize?: number | string
	iconAfter?: string
	iconPosition?: IconPosition
	isRounded?: boolean
	animated?: boolean
	textReveal?: boolean
}

import React from "react"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			label,
			href,
			isExternal = false,
			externalHref,
			type = "button",
			onClick,
			disabled = false,
			className = "",
			variant = "secondary",
			outlined = false,
			size = "md",
			icon,
			iconPosition,
			iconSize,
			iconAfter,
			animated = false,
			isRounded = true,
			textReveal = false,
		},
		ref,
	) => {
		const classes = clsx(
			styles.btn,
			className,
			isRounded && styles["is-rounded"],
			animated && styles.animated,
			disabled && styles["is-disabled"],
			isExternal && styles["is-external"],
			variant && styles[`btn--${variant}`],
			iconPosition && styles[`btn--icon-${iconPosition}`],
			size && styles[`btn--${size}`],
			outlined && styles["is-outlined"],
			textReveal && styles["text-reveal"],
			{
				[styles["icon-only"]]: !label,
			},
		)

		const renderContent = () => {
			if (!icon && !iconAfter) return <>{label}</> // no icons at all

			const position = icon && !iconPosition ? "left" : iconPosition

			const iconComp = icon ? (
				<Icon
					name={icon}
					strokeWidth="1.8"
					size={iconSize}
					className={styles.icon}
				/>
			) : null

			const iconAfterComp = iconAfter ? (
				<Icon
					name={iconAfter}
					strokeWidth="1.8"
					size={iconSize}
					className={styles.icon}
				/>
			) : null

			return (
				<>
					{position === "left" && iconComp}
					{label && <span className={styles.button__text}>{label}</span>}
					{position === "right" && iconComp}
					{iconAfterComp}
				</>
			)
		}

		if (href) {
			return (
				<Link className={classes} href={href} onClick={onClick}>
					{renderContent()}
				</Link>
			)
		}

		if (label && isExternal && externalHref) {
			return (
				<a
					className={classes}
					target="_blank"
					rel="noopener noreferrer"
					href={externalHref}
				>
					{renderContent()}
				</a>
			)
		}

		if (label) {
			return (
				<button
					ref={ref}
					type={type}
					className={classes}
					onClick={onClick}
					disabled={disabled}
				>
					{renderContent()}
				</button>
			)
		}

		if (!label && icon) {
			return (
				<button
					ref={ref}
					type={type}
					className={classes}
					onClick={onClick}
					disabled={disabled}
				>
					{renderContent()}
				</button>
			)
		}

		return null
	},
)

Button.displayName = "Button"

export default Button
export { Button }
