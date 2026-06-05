import cx from "clsx"
import Image from "next/image"
import { forwardRef } from "react"
import type React from "react"
import { renderRichTextContent } from "@/utils/RichText"
import { Heading, type HeadingProps } from "../Headings"
import styles from "./Section.module.scss"
import { Icon } from "../Icon"

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
	/** Section background variant. Renamed from `theme` to avoid colliding with
	 * the global `[data-theme="dark"]` used for app-wide dark mode. */
	tone?: "surface" | "muted" | "highlight" | "transparent"
	as?: (typeof SectionAsElement)[keyof typeof SectionAsElement]
	padding?: (typeof SectionPadding)[keyof typeof SectionPadding]
	paddingControl?: keyof typeof SectionPaddingControl | null
	actions?: React.ReactNode
	"data-title-position"?: string
	"data-js"?: string
	"data-slider"?: string
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
	{
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
		actions,
		tone,
		"data-title-position": dataTitlePosition,
		"data-js": dataJs,
		"data-slider": dataSlider,
		as = "section",
	},
	ref,
) {
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
			ref={ref}
			id={id}
			className={classes}
			data-anim={animationID || undefined}
			data-full={height}
			data-tone={tone}
			data-size={size}
			data-padding={padding}
			data-title-position={dataTitlePosition}
			data-js={dataJs}
			data-slider={dataSlider}
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
						<div className={styles.titleBlock}>
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
									{heading?.icon && (
										<Icon
											name={heading.icon}
											strokeWidth="2"
											className={styles.section__icon}
										/>
									)}
									<span className={styles.section__heading__text}>
										{heading?.heading}
									</span>
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
						{actions && (
							<div className={styles.section__actions}>{actions}</div>
						)}
					</div>
				)}
				{children}
			</div>
		</Tag>
	)
})
