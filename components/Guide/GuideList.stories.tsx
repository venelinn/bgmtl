import type { Meta, StoryObj } from "@storybook/nextjs"
import { GuideCard } from "@/components/Cards"
import { GuideList } from "."

const cards = [
	{ id: "a", topic: "Здраве", icon: "HeartPulse", title: "Здравна карта RAMQ" },
	{ id: "b", topic: "Език", icon: "Languages", title: "Безплатни курсове по френски" },
	{ id: "c", topic: "Жилище", icon: "House", title: "Наем на жилище" },
	{ id: "d", topic: "Език", icon: "GraduationCap", title: "Признаване на дипломи" },
]

const meta: Meta<typeof GuideList> = {
	title: "Components/Guide/GuideList",
	component: GuideList,
	args: {
		items: cards.map((card) => ({
			id: card.id,
			topic: card.topic,
			content: (
				<GuideCard
					icon={card.icon}
					eyebrow={card.topic}
					heading={{ heading: card.title, as: "h3", size: "h4" }}
					content="Кратко описание на стъпката."
					link={{ url: "https://www.quebec.ca", name: "Научете повече" }}
				/>
			),
		})),
	},
}

export default meta

export const Default: StoryObj<typeof GuideList> = {}
