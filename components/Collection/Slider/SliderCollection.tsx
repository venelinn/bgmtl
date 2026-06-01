"use client"
import clsx from "clsx"
import Link from "next/link"
import { type ReactNode, useRef, useState } from "react"
import { A11y, Controller, Keyboard, Pagination, Zoom } from "swiper/modules"
import { Swiper, type SwiperRef, SwiperSlide } from "swiper/react"
import type { Swiper as SwiperCore } from "swiper/types"
import { Cell, Row } from "@/components/Grid"
import { Icon } from "@/components/Icon"
import type { NavigationType, PaginationType } from "./SliderCollection.const"
import { getDefaultBreakpoints } from "./utils/getDefaultBreakpoints"

import "swiper/css"
import "swiper/css/a11y"
import "swiper/css/keyboard"
import "swiper/css/zoom"
import "swiper/css/pagination"
import styles from "./SliderCollection.module.scss"

const defaultLabels = {
	firstSlideMessage: "This is the first slide",
	lastSlideMessage: "This is the last slide",
	prevSlideMessage: "Previous slide",
	nextSlideMessage: "Next slide",
	paginationBulletMessage: "Go to slide {{index}}",
	slideLabelMessage: "{{index}} of {{slidesLength}}",
}

type LabelsProps = typeof defaultLabels

export type SlideProps = {
	id: string
	view: (props: { theme?: "light" | "dark" }) => ReactNode
}

type Breakpoints = {
	[key: string]: {
		slidesPerView: number
		spaceBetween: number
	}
}

export type SliderCollectionProps = {
	id: string
	slides: SlideProps[]
	labels?: Partial<LabelsProps>
	className?: string
	theme?: "light" | "dark"
	slidesPerView?: 1 | 2 | 3 | 4
	breakpoints?: Breakpoints
	navigationType: NavigationType
	paginationType: PaginationType
	link?: any
}

const SliderCollection = ({
	id,
	slides,
	link,
	theme,
	labels: providedLabels,
	className,
	slidesPerView = 3,
	breakpoints = getDefaultBreakpoints(slidesPerView),
	navigationType,
	paginationType,
}: SliderCollectionProps) => {
	const labels = { ...defaultLabels, ...providedLabels }
	const swiper = useRef<SwiperCore | null>(null)
	const [isBeginning, setIsBeginning] = useState(true)
	const [isEnd, setIsEnd] = useState(false)
	const keyboardRef = useRef<SwiperRef | null>(null)

	const enableKeyboardControl = () => {
		keyboardRef.current?.swiper?.keyboard?.enable?.()
	}

	const disableKeyboardControl = () => {
		keyboardRef.current?.swiper?.keyboard?.disable?.()
	}

	const renderSlideView = (
		view: SlideProps["view"],
		theme?: "light" | "dark",
	) => (typeof view === "function" ? view({ theme }) : view)

	return (
		<>
			{slides.length > 1 ? (
				<div
					className={clsx(
						styles.sliderContainer,
						styles.paddingForNavigationButton,
						navigationType && styles[navigationType],
						className,
					)}
					onMouseEnter={enableKeyboardControl}
					onMouseLeave={disableKeyboardControl}
					onFocus={enableKeyboardControl}
					onBlur={disableKeyboardControl}
					data-theme={theme}
				>
					<>
						<button
							key="navigationButtonPrev"
							className={clsx(
								styles.navigationButton,
								styles.navigationButtonPrev,
							)}
							type="button"
							aria-label={labels.prevSlideMessage}
							aria-disabled={isBeginning}
							onClick={() => swiper.current?.slidePrev()}
							disabled={isBeginning}
						>
							<Icon
								name="chevron-left"
								className={styles.navigationButtonIcon}
							/>
						</button>
						<button
							id={id}
							key="navigationButtonNext"
							className={clsx(
								styles.navigationButton,
								styles.navigationButtonNext,
							)}
							type="button"
							aria-label={labels.nextSlideMessage}
							aria-disabled={isEnd}
							disabled={isEnd}
							onClick={() => swiper.current?.slideNext()}
						>
							<Icon
								name="chevron-right"
								className={styles.navigationButtonIcon}
							/>
						</button>
					</>
					<div>
						<Swiper
							key={id}
							onSwiper={(instance) => {
								swiper.current = instance
								setIsBeginning(instance.isBeginning)
								setIsEnd(instance.isEnd)
							}}
							onSlideChange={(instance) => {
								setIsBeginning(instance.isBeginning)
								setIsEnd(instance.isEnd)
							}}
							ref={keyboardRef}
							className={clsx(styles.swiper, styles.swiperPadding)}
							modules={[A11y, Controller, Keyboard, Pagination, Zoom]}
							pagination={{
								el: `.swiper-pagination-${id}`,
								dynamicBullets: true,
								dynamicMainBullets: 3,
								clickable: true,
								type: "bullets",
							}}
							a11y={{
								firstSlideMessage: labels.firstSlideMessage,
								lastSlideMessage: labels.lastSlideMessage,
								prevSlideMessage: labels.prevSlideMessage,
								nextSlideMessage: labels.nextSlideMessage,
								paginationBulletMessage: labels.paginationBulletMessage,
								slideLabelMessage: labels.slideLabelMessage,
							}}
							keyboard={{ enabled: false }}
							centeredSlides={false}
							grabCursor={true}
							slidesPerView={slidesPerView}
							breakpoints={breakpoints}
						>
							{slides.map((slide, index) => (
								<SwiperSlide
									key={slide.id || index}
									className={styles.swiperSlide}
								>
									{renderSlideView(slide.view)}
								</SwiperSlide>
							))}
						</Swiper>
					</div>
					<div
						className={clsx(
							"swiper-pagination",
							`swiper-pagination-${id}`,
							styles.pagination,
							paginationType && styles[paginationType],
						)}
					/>
				</div>
			) : (
				<>
					<Row cols={3}>
						<Cell>
							{slides.map((slide) => renderSlideView(slide.view, theme))}
						</Cell>
					</Row>
					{!!link && (
						<Link
							// icon="arrow-right-micro"
							href={link.href}
							className={styles.cardLink}
						>
							{link?.children}
						</Link>
					)}
				</>
			)}
		</>
	)
}

export { SliderCollection }
