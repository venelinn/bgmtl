import cx from "clsx"
import Image from "next/image"
import type React from "react"
import { renderRichTextContent } from "@/utils/RichText"
import { Heading, type HeadingProps } from "../Headings"
import styles from "./Section.module.scss"

const SectionAsElement = {
	section: "section",
	header: "header",
	footer: "footer",
} as const

const SectionPadding = {
	none: "none",
	xsmall: "xsmall",
	small: "small",
	medium: "medium",
	large: "large",
} as const

const SectionPaddingControl = {
	removeTop: "removeTop",
	removeBottom: "removeBottom",
} as const

export type SectionClassNames = {
	main?: string
	inner?: string
	image?: string
	imageImg?: string
	heading?: string
	description?: string
}

export type SectionImage = {
	src: string
	alt?: string
}

export type SectionProps = {
	id?: string
	children?: React.ReactNode
	className?: string
	classNames?: SectionClassNames
	image?: SectionImage | undefined
	animationID?: string | null
	heading?: HeadingProps
	size?: "fixed" | "full" | "full-max" | "breakout" | "small"
	height?: "full" | "half" | "quarter" | "two-thirds"
	description?: string | undefined
	imageAlignment?: "top" | "bottom" | undefined
	headingVariant?: "horizontal" | "vertical"
	theme?: "light" | "dark" | "highlight" | "transparent"
	as?: (typeof SectionAsElement)[keyof typeof SectionAsElement]
	padding?: (typeof SectionPadding)[keyof typeof SectionPadding]
	paddingControl?: keyof typeof SectionPaddingControl | null
	[key: string]: unknown
}

export const Section = ({
	id = "",
	children = null,
	className = "",
	classNames = {},
	image = undefined,
	animationID = null,
	heading = {},
	headingVariant = "horizontal",
	size = "fixed",
	height = undefined,
	description = undefined,
	imageAlignment = undefined,
	padding = "medium",
	paddingControl,
	as = "section",
	...props
}: SectionProps) => {
	const Tag: React.ElementType = as || "section"
	const classes = cx(
		styles.section,
		classNames?.main,
		paddingControl ? styles[`section--${paddingControl}`] : null,
		padding && styles[`section--padding-${padding}`],
		className,
		{
			"full-width": size === "full",
			"full-max": size === "full-max",
			breakout: size === "breakout",
			[styles[`section--${height}-height`]]: height,
			[styles[`section--small`]]: size === "small",
			[styles[padding]]: styles[padding],
			rel: Boolean(image),
		},
	)

	return (
		<Tag
			id={id}
			className={classes}
			data-anim={animationID || undefined}
			data-full={height}
			data-theme={props.theme}
			data-size={size}
			data-padding={props.padding}
			{...props}
		>
			{image && (
				<div
					className={cx(
						styles.section__image,
						"section-image",
						classNames?.image,
					)}
					data-anim="section-img-wrap"
				>
					<Image
						src={image.src}
						alt={image.alt || ""}
						fill
						data-anim="section-img"
						className={cx(styles.section__image__img, classNames?.imageImg, {
							[styles[`hero-${imageAlignment}`]]: Boolean(imageAlignment),
						})}
					/>
				</div>
			)}
			<div className={cx(styles.section__inner, classNames?.inner)}>
				{heading?.heading && (
					<div className={styles.section__header} data-variant={headingVariant}>
						{heading?.heading && (
							<Heading
								as={heading?.as}
								size={heading?.size}
								uppercase={heading?.uppercase}
								animationID="section-title"
								center={heading?.center}
								highlight={heading?.highlight}
								className={cx(styles.section__heading, classNames?.heading)}
							>
								{heading?.heading}
							</Heading>
						)}
						{description && (
							<div
								className={cx(
									styles.section__description,
									classNames?.description,
								)}
							>
								{renderRichTextContent(description)}
							</div>
						)}
					</div>
				)}
				{children}
			</div>
		</Tag>
	)
}
