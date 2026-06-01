import type { Meta, StoryObj } from "@storybook/nextjs";
import { Cell, Row } from "@/components/Grid";
import { InfoCard } from ".";

const meta: Meta<typeof InfoCard> = {
  title: "Components/Cards/Info",
  component: InfoCard,
  args: {},
  argTypes: {
    link: {
      options: ["none", "sample"],
      mapping: {
        none: false,
        sample: {
          href: "http://dream-boats.com",
          children: "View details",
        },
      },
      control: {
        type: "radio",
      },
    },
    content: {
      options: ["none", "default", "list"],
      mapping: {
        none: null,
        default: "Lorem ipsum dolor sit amet consectetur. Habitasse sed gravida tempor nisi. Facilisis vestibulum.",
        list: ["With hundreds of flight deals", "Seat Sale", "Explore now", "Hundreds of flight deals"],
      },
      control: {
        type: "radio",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InfoCard>;

export const InfoCardStory: Story = {
  render: (args) => {
    return (
      <Row cols={3}>
        <Cell>
          <InfoCard {...args} />
        </Cell>
      </Row>
    );
  },
  name: "Single",
  parameters: {
    viewport: {
      defaultViewport: "iphone14",
    },
  },
  args: {
    heading: { heading: "Lorem ipsum dolor sit amet consectetur.", as: "h3", size: "h3" },
    link: { url: "http://dream-boats.com", name: "View details" },
    variant: "default",
    icon: "Gem",
    content: "Lorem ipsum dolor sit amet consectetur. Habitasse sed gravida tempor nisi. Facilisis vestibulum.",
  },
};

export const InfoCardStoryPrice: Story = {
  render: (args) => {
    return (
      <Row cols={3}>
        <Cell>
          <InfoCard {...args} />
        </Cell>
      </Row>
    );
  },
  name: "With price",
  parameters: {
    viewport: {
      defaultViewport: "iphone14",
    },
  },
  args: {
    heading: { heading: "Lorem ipsum dolor sit amet consectetur.", as: "h3", size: "h3" },
    link: { url: "http://dream-boats.com", name: "View details" },
    variant: "default",
    icon: "Gem",
    content: "Lorem ipsum dolor sit amet consectetur. Habitasse sed gravida tempor nisi. Facilisis vestibulum.",
  },
};

export const InfoCardHorizontalStory: Story = {
  render: (args) => {
    return (
      <Row cols={2}>
        <Cell>
          <InfoCard {...args} />
        </Cell>
      </Row>
    );
  },
  name: "Horizontal",
  parameters: {
    viewport: null,
  },
  args: {
    heading: { heading: "Lorem ipsum dolor sit amet consectetur.", as: "h3", size: "h3" },
    content: "default",
    link: { url: "http://dream-boats.com", name: "View details" },
    variant: "horizontal",
    icon: "Gem",
  },
};

export const InfoCardHorizontalNoIconStory: Story = {
  render: (args) => {
    return (
      <Row cols={3}>
        <Cell>
          <InfoCard {...args} content="Lorem ipsum dolor sit amet." />
        </Cell>
      </Row>
    );
  },
  name: "Horizontal No Icon",
  parameters: {
    viewport: null,
  },
  args: {
    heading: { heading: "Lorem ipsum dolor sit amet consectetur.", as: "h3", size: "h3" },
    content: "default",
    link: { url: "http://dream-boats.com", name: "View details" },
    variant: "horizontalNoIcon",
  },
};

export const InfoCardInGrid: Story = {
  render: (args) => {
    return (
      <>
        <style>{`
					.custom-grid-container {
						--_card-height: 100%;
					}
				`}</style>
        <Row cols={3} className="custom-grid-container">
          <Cell>
            <InfoCard {...args} />
          </Cell>
          <Cell>
            <InfoCard {...args} heading={{ heading: "Lorem ipsum", as: "h3", size: "h3" }} content={null} />
          </Cell>
          <Cell>
            <InfoCard {...args} />
          </Cell>
        </Row>
      </>
    );
  },
  name: "in Grid",
  parameters: {
    viewport: null,
  },
  args: {
    heading: { heading: "Lorem ipsum dolor sit amet consectetur.", as: "h3", size: "h3" },
    content: "default",
    link: { url: "http://dream-boats.com", name: "View details" },
    variant: "horizontal",
    icon: "Gem",
  },
};
