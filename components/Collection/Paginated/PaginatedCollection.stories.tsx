import type { Meta, StoryObj } from "@storybook/nextjs";
import { PrimaryCard } from "@/components/Cards";
import { paginationVariants } from "../../Pagination/Pagination";
import { PaginatedCollection } from ".";

const meta: Meta<typeof PaginatedCollection> = {
  title: "Components/Collection/Paginated",
  component: PaginatedCollection,
  parameters: {
    backgrounds: {
      default: "Mid",
    },
  },
  argTypes: {
    items: {
      control: false,
    },
    labels: {
      control: false,
    },
    paginationVariant: {
      control: {
        type: "radio",
      },
      options: Object.values(paginationVariants),
    },
    colWidth: {
      control: false,
    },
  },
  args: {
    numberOfPaginationToDisplay: 6,
    items: [...Array(20).keys()].map((index) => ({
      id: `${index + 1}`,
      content: (
        <PrimaryCard
          key={`id-${index}`}
          image={[
            {
              src: "https://assets.sunwingtravelgroup.com/image/upload/c_lfill,g_auto,q_auto,f_auto,w_400,h_225/sunwing-prod/HotelImages/VRAOVA/16x9/001",
              alt: "",
            },
          ]}
          heading={{ heading: `Negril, Jamaica ${index + 1}`, as: "h3", size: "h3" }}
          link={{ url: "#", target: "_blank", name: "Explore now" }}
        />
      ),
    })),
  },
};

export default meta;

type Story = StoryObj<typeof PaginatedCollection>;

export const Pag3: Story = {
  render: (args) => {
    return <PaginatedCollection {...args} />;
  },
  args: {
    cardsPerPage: 3,
    paginationVariant: "default",
  },
  name: "Paginated (3)",
};

export const Example: Story = {
  render: (args) => {
    return <PaginatedCollection {...args} />;
  },
  args: {
    cardsPerPage: 4,
    paginationVariant: "extended",
  },
  name: "Paginated (4)",
};
