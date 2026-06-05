// utils/fonts.js
import { Raleway } from "next/font/google"

export const raleway = Raleway({
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	subsets: ["latin", "cyrillic"],
	display: "swap",
	style: "normal",
})
