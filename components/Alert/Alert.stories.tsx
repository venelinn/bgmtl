import type { Meta, StoryObj } from "@storybook/nextjs"
import { Alert } from "."

const meta: Meta<typeof Alert> = {
	title: "Components/Alert",
	component: Alert,
	args: {
		title: "Информацията се променя",
		children: "Правилата се променят, затова проверявайте актуалната информация на официалните сайтове.",
	},
}

export default meta

type Story = StoryObj<typeof Alert>

export const Info: Story = {}

export const Warning: Story = { args: { variant: "warning" } }
