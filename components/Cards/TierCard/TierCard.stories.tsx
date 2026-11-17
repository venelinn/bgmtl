import type { Meta, StoryObj } from "@storybook/nextjs";
import { Cell, Row } from "@/components/Grid";
import { TierCard } from ".";

const benefits = (items: string[]) => ({
  nodeType: "document",
  data: {},
  content: [
    {
      nodeType: "unordered-list",
      data: {},
      content: items.map((value) => ({
        nodeType: "list-item",
        data: {},
        content: [{ nodeType: "paragraph", data: {}, content: [{ nodeType: "text", value, marks: [], data: {} }] }],
      })),
    },
  ],
});

const meta: Meta<typeof TierCard> = {
  title: "Components/Cards/Tier",
  component: TierCard,
  args: {
    icon: "Handshake",
    heading: { heading: "Партньор", as: "h3", size: "h4" },
    price: "500 $ / година",
    content: benefits(["Лого на страницата „Спонсори“", "Лого на плакатите на събитията", "Публикация във Facebook"]),
    link: { url: "/contacts?topic=partnership", name: "Свържете се" },
  },
};

export default meta;

type Story = StoryObj<typeof TierCard>;

export const Tiers: Story = {
  render: (args) => (
    <Row cols={3}>
      <Cell>
        <TierCard {...args} icon="Heart" heading={{ heading: "Приятел" }} price="250 $ / година" />
      </Cell>
      <Cell>
        <TierCard {...args} featured featuredLabel="Препоръчан" />
      </Cell>
      <Cell>
        <TierCard {...args} icon="Crown" heading={{ heading: "Главен спонсор" }} price="1000 $ / година" />
      </Cell>
    </Row>
  ),
};
