import type { Meta, StoryObj } from "@storybook/nextjs";
import { ImageContent } from "./ImageContent";

const meta: Meta<typeof ImageContent> = {
  title: "Components/Image Content",
  component: ImageContent,
  tags: ["autodocs"],
  argTypes: {
    isContentFirst: {
      control: "boolean",
      description: "Show content before image",
    },
    fullHeight: {
      control: "boolean",
      description: "Make the section full height",
    },
    animationID: {
      control: "text",
      description: "Animation ID for GSAP animations",
    },
  },
  args: {
    heading: {
      heading: "Discover Paradise on the Water",
      as: "h2",
      size: "h2",
    },
    content: {
      nodeType: "document",
      data: {},
      content: [
        {
          nodeType: "paragraph",
          data: {},
          content: [
            {
              nodeType: "text",
              value:
                "Experience the ultimate luxury with our premium boat rental service. Whether you're looking for a relaxing day on the water or an adventure-filled excursion, we have the perfect vessel for your needs.",
              marks: [],
              data: {},
            },
          ],
        },
      ],
    } as Record<string, unknown>,
    image: {
      src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop",
      alt: "Luxury yacht on crystal clear water",
      width: 1200,
      height: 800,
    },
    isContentFirst: false,
    fullHeight: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
