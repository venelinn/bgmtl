import type { SliderCollectionProps } from "../SliderCollection"

export const getDefaultBreakpoints = (
	slidesPerView?: number,
): SliderCollectionProps["breakpoints"] => {
	const defaultSpacing = 16 // fetch from tokens?

	switch (slidesPerView) {
		case 2:
			return {
				0: { slidesPerView: 1.1, spaceBetween: defaultSpacing },
				576: { slidesPerView: 2, spaceBetween: defaultSpacing },
				769: { slidesPerView: 2, spaceBetween: defaultSpacing },
			}
		case 3:
			return {
				0: { slidesPerView: 1.1, spaceBetween: defaultSpacing },
				576: { slidesPerView: 2, spaceBetween: defaultSpacing },
				769: { slidesPerView: 3, spaceBetween: defaultSpacing },
			}
		case 4:
			return {
				0: { slidesPerView: 1.1, spaceBetween: defaultSpacing },
				576: { slidesPerView: 2, spaceBetween: defaultSpacing },
				769: { slidesPerView: 4, spaceBetween: defaultSpacing },
			}
		default:
			return {
				0: { slidesPerView: 1.1, spaceBetween: defaultSpacing },
				576: { slidesPerView: 1, spaceBetween: defaultSpacing },
				769: { slidesPerView: 1, spaceBetween: defaultSpacing },
			}
	}
}
