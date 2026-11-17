import type { Meta, StoryObj } from "@storybook/nextjs";
import { Cell, Row } from "@/components/Grid";
import { GuideCard } from ".";

const meta: Meta<typeof GuideCard> = {
  title: "Components/Cards/Guide",
  component: GuideCard,
  args: {
    icon: "HeartPulse",
    eyebrow: "Здраве",
    tone: 2,
    heading: { heading: "Здравна карта RAMQ", as: "h3", size: "h4" },
    content:
      "Регистрирайте се в RAMQ веднага след пристигане. По правило покритието започва след период на изчакване до 3 месеца.",
    link: {
      url: "https://www.ramq.gouv.qc.ca/en/citizens/health-insurance/register/newcomer-adult",
      name: "Регистрация в RAMQ",
    },
  },
};

export default meta;

type Story = StoryObj<typeof GuideCard>;

export const GuideCardStory: Story = {
  render: (args) => (
    <Row cols={3}>
      <Cell>
        <GuideCard {...args} />
      </Cell>
      <Cell>
        <GuideCard {...args} icon="Languages" eyebrow="Език" />
      </Cell>
      <Cell>
        <GuideCard {...args} link={undefined} />
      </Cell>
    </Row>
  ),
};
