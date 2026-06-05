export const sliderNavigationType = {
	display: "display",
	hide: "hide",
	desktopOnly: "desktopOnly",
} as const

export const sliderPaginationType = {
	display: "display",
	hide: "hide",
	desktopOnly: "desktopOnly",
} as const

export type NavigationType = keyof typeof sliderNavigationType
export type PaginationType = keyof typeof sliderPaginationType
