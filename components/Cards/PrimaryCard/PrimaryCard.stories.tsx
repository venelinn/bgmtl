import type { Meta, StoryObj } from "@storybook/nextjs";
import { Cell, Row } from "@/components/Grid";
import { boatImagesMock } from "@/mockData/images";
import { PrimaryCard } from "./PrimaryCard";

const meta: Meta<typeof PrimaryCard> = {
  title: "Components/Cards/PrimaryCard",
  component: PrimaryCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    image: {
      options: ["none", "single", "multiple"],
      mapping: {
        none: false,
        single: [boatImagesMock[0]],
        multiple: boatImagesMock,
      },
      control: {
        type: "radio",
      },
    },
  },
  args: {
    id: "lagoon-56",
    heading: { heading: "Lagoon 56", as: "h3", size: "h3" },
    link: {
      url: "/boats/lagoon-56",
      name: "View Details",
    },
    image: [boatImagesMock[0]],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Row cols={3}>
      <Cell>
        <PrimaryCard {...args} />
      </Cell>
    </Row>
  ),
  name: "Single Image",
};

export const MultipleImages: Story = {
  render: (args) => (
    <Row cols={3}>
      <Cell>
        <PrimaryCard {...args} image={boatImagesMock} />
      </Cell>
    </Row>
  ),
  name: "With Slider (Multiple Images)",
};

export const PrimaryCardStory: Story = {
  render: (args) => (
    <Row cols={3}>
      <Cell>
        <PrimaryCard {...args} />
      </Cell>
      <Cell>
        <PrimaryCard {...args} image={[boatImagesMock[0]]} />
      </Cell>
      <Cell>
        <PrimaryCard {...args} image={[]} />
      </Cell>
    </Row>
  ),
  name: "In Grid",

  parameters: {
    viewport: null,
  },
};
