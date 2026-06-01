import type { Meta, StoryObj } from "@storybook/nextjs";
import { PrimaryCard } from "@/components/Cards";
import { GridCollection, type GridCollectionProps } from ".";

const meta = {
  title: "Components/Collection/Grid ",
  component: GridCollection,
  parameters: {
    docs: {
      source: {
        code: "none",
      },
    },
  },
} satisfies Meta<typeof GridCollection>;

export default meta;

type StoryArgs = GridCollectionProps & {
  numberOfTestEntries?: number;
};

const generateItems = (n: number) =>
  [...Array(n).keys()].map((i) => ({
    id: `item-${i + 1}`,
    content: (
      <PrimaryCard
        key={`id-${i}`}
        image={[
          {
            src: "https://assets.sunwingtravelgroup.com/image/upload/c_lfill,g_auto,q_auto,f_auto,w_400,h_225/sunwing-prod/HotelImages/VRAOVA/16x9/001",
            alt: "",
          },
        ]}
        heading={{ heading: `Negril, Jamaica ${i + 1}`, as: "h3", size: "h3" }}
        // subheader="Sunscapes Beach Sands Hotel and Spa"
        // stars={4.5}
        // labels={{ allInc: "All inclusive" }}
        link={{ url: "#", target: "_blank", name: "Explore now" }}
      />
    ),
  }));

export const Example: StoryObj<StoryArgs> = {
  render: ({ numberOfTestEntries = 5, ...args }) => {
    return <GridCollection {...args} items={generateItems(numberOfTestEntries)} />;
  },
  args: {
    numberOfTestEntries: 6,
    itemsPerRow: 3,
  },
  name: "Grid (3)",
  argTypes: {
    numberOfTestEntries: {
      control: { type: "number", min: 1, max: 20 },
    },
    items: {
      control: false,
    },
  },
};
