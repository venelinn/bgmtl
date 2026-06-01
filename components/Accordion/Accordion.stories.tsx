import type { Meta, StoryObj } from "@storybook/nextjs";
import { Accordion } from ".";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  argTypes: {
    className: {
      control: false,
    },
    heading: {
      control: false,
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: (args) => {
    return (
      <Accordion {...args}>
        <p>
          Additional information or directions go here. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet
          lacus accumsan et viverra justo commodo.
        </p>
      </Accordion>
    );
  },
  name: "Accordion",
  args: {
    heading: {
      as: "h3",
      size: "h4",
      children: "First Accordion",
    },
    isOpen: false,
    variant: "faq",
    size: "default",
  },
};

export const Navigation: Story = {
  render: (args) => {
    return (
      <Accordion {...args}>
        <p>
          Additional information or directions go here. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet
          lacus accumsan et viverra justo commodo.
        </p>
      </Accordion>
    );
  },
  name: "in Nav",
  args: {
    heading: {
      as: "div",
      size: "div",
      children: "Nav menu 1",
    },
    isOpen: false,
    size: "sm",
  },
};
