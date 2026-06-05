import type { Meta, StoryObj } from "@storybook/nextjs";
import { PrimaryCard } from "@/components/Cards";
import { type SlideProps, SliderCollection, type SliderCollectionProps } from ".";

const meta: Meta<typeof SliderCollection> = {
  title: "Components/Collection/Slider",
  component: SliderCollection,
  parameters: {
    docs: {
      source: {
        code: "none",
      },
    },
  },
  argTypes: {
    slides: {
      control: false,
    },
    link: {
      options: ["none", "sample"],

      mapping: {
        none: undefined,

        sample: {
          text: "All last minute deals",
          url: "#",
          target: "_self",
        },
      },

      control: {
        type: "radio",
      },
    },
    id: {
      control: false,
    },
    tone: {
      control: false,
    },
    className: {
      control: false,
    },
    labels: {
      control: false,
    },
    breakpoints: {
      control: false,
    },
  },
  args: {
    paginationType: "display",
    navigationType: "display",
    id: "slider-1",
  },
} satisfies Meta<typeof SliderCollection>;

export default meta;

type StoryArgs = SliderCollectionProps & {
  numberOfTestEntries?: number;
};

const generateItems = (n: number): SlideProps[] =>
  [...Array(n).keys()].map((i) => ({
    id: `item-${i + 1}`,
    view: () => (
      <section>
        <PrimaryCard
          key={`id-${i}`}
          image={[
            {
              src: "https://assets.sunwingtravelgroup.com/image/upload/c_lfill,g_auto,q_auto,f_auto,w_400,h_225/sunwing-prod/HotelImages/VRAOVA/16x9/001",
              alt: "",
            },
          ]}
          heading={{ heading: `Negril, Jamaica ${i + 1}`, as: "h3", size: "h3" }}
          link={{
            url: "#",
            target: "_blank",
            name: "Explore now",
          }}
        />
      </section>
    ),
  }));

export const Example: StoryObj<StoryArgs> = {
  render: ({ numberOfTestEntries = 10, ...args }) => {
    return (
      <div style={{ margin: "2rem" }}>
        <SliderCollection {...args} slides={generateItems(numberOfTestEntries)} />
      </div>
    );
  },
  args: {
    numberOfTestEntries: 10,
  },
  name: "Default",
  argTypes: {
    numberOfTestEntries: {
      control: { type: "number", min: 1, max: 20 },
    },
    slides: {
      control: false,
    },
  },
  parameters: {
    backgrounds: {
      default: "Mid",
    },
  },
};

export const MultipleSliders: StoryObj<StoryArgs> = {
  render: ({ numberOfTestEntries = 10, ...args }) => {
    return (
      <div style={{ margin: "2rem" }}>
        <h2>Multiple Sliders</h2>
        <SliderCollection {...args} id="slider-1" slides={generateItems(numberOfTestEntries)} />
        <h2 style={{ marginTop: "4rem" }}>Second Slider</h2>
        <SliderCollection {...args} id="slider-2" slides={generateItems(5)} paginationType="hide" />
      </div>
    );
  },
  args: {
    numberOfTestEntries: 7,
  },
  name: "Multiple Sliders",
  argTypes: {
    numberOfTestEntries: {
      control: { type: "number", min: 1, max: 20 },
    },
    slides: {
      control: false,
    },
  },
  parameters: {
    backgrounds: {
      default: "Mid",
    },
  },
};
