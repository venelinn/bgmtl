import type { Meta, StoryObj } from "@storybook/nextjs";
import Image from "next/image";
import { boatImagesMock } from "@/mockData/images";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "boat", "testimonial"],
      description: "Slider variant/style",
    },
    itemsPerRow: {
      control: "select",
      options: [1, 2, 3, 4],
      description: "Number of items visible per view",
    },
    instanceId: {
      control: "text",
      description: "Unique identifier for the slider instance",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create image slide content
const createImageSlide = (img: (typeof boatImagesMock)[0], idx: number) => ({
  id: `image-${idx}`,
  content: (
    <Image
      src={img.src}
      alt={img.alt ?? `Slide ${idx + 1}`}
      width={img.width ?? 500}
      height={img.height ?? 400}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ),
});

// Helper to create colored placeholder slides
const createPlaceholderSlide = (index: number, height = 300) => ({
  id: `slide-${index}`,
  content: (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        background: `linear-gradient(135deg, hsl(${index * 60}, 70%, 60%), hsl(${index * 60 + 30}, 70%, 50%))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        color: "white",
        fontSize: "24px",
        fontWeight: "bold",
      }}
    >
      Slide {index + 1}
    </div>
  ),
});

export const Default: Story = {
  args: {
    variant: "primary",
    itemsPerRow: 1,
    instanceId: "default-slider",
    items: boatImagesMock.map(createImageSlide),
  },
};

export const SingleSlide: Story = {
  args: {
    variant: "primary",
    itemsPerRow: 1,
    instanceId: "single-slider",
    items: [createImageSlide(boatImagesMock[0], 0)],
  },
};

export const TwoPerView: Story = {
  args: {
    variant: "primary",
    itemsPerRow: 2,
    instanceId: "two-per-view",
    items: Array.from({ length: 6 }, (_, i) => createPlaceholderSlide(i, 250)),
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const ThreePerView: Story = {
  args: {
    variant: "primary",
    itemsPerRow: 3,
    instanceId: "three-per-view",
    items: Array.from({ length: 6 }, (_, i) => createPlaceholderSlide(i, 300)),
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const FourPerView: Story = {
  args: {
    variant: "primary",
    itemsPerRow: 4,
    instanceId: "four-per-view",
    items: Array.from({ length: 8 }, (_, i) => createPlaceholderSlide(i, 200)),
  },
  parameters: {
    layout: "fullscreen",
  },
};
