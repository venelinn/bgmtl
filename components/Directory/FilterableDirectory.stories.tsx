import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  type DirectoryCategory,
  type DirectoryGroup,
  type DirectoryItem,
  FilterableDirectory,
} from "./FilterableDirectory";

const groups: DirectoryGroup[] = [
  { slug: "community", label: "Community", order: 1 },
  { slug: "faith", label: "Faith", order: 2 },
  { slug: "services", label: "Services", order: 3 },
];

const categories: DirectoryCategory[] = [
  { slug: "association", label: "Associations", order: 1, groupSlug: "community" },
  { slug: "cultural-center", label: "Cultural Centres", order: 2, groupSlug: "community" },
  { slug: "school", label: "Schools", order: 3, groupSlug: "community" },
  { slug: "church", label: "Churches", order: 1, groupSlug: "faith" },
  { slug: "plumber", label: "Plumbers", order: 1, groupSlug: "services" },
];

/** Minimal Contentful rich-text doc (a bulleted list, like the real card data). */
const richList = (lines: string[]) => ({
  nodeType: "document",
  data: {},
  content: [
    {
      nodeType: "unordered-list",
      data: {},
      content: lines.map((value) => ({
        nodeType: "list-item",
        data: {},
        content: [{ nodeType: "paragraph", data: {}, content: [{ nodeType: "text", value, marks: [], data: {} }] }],
      })),
    },
  ],
});

const items: DirectoryItem[] = [
  {
    id: "zornica",
    categorySlug: "cultural-center",
    title: "Zornica Cultural Centre",
    content: richList(["7448 Kingsley Suite 501, CSL Montreal, QC H4W 1P2", "514-369-0589"]),
    link: { url: "https://www.zornica.com", name: "www.zornica.com", target: "_blank" },
  },
  {
    id: "st-ivan-rilsky",
    categorySlug: "church",
    title: "St. Ivan Rilsky Church",
    content: richList(["1191 Blvd. Sauve Ouest, Montreal, QC H2C 1Z8", "514-956-7835"]),
    link: { url: "https://www.stivanrilsky.org", name: "www.stivanrilsky.org", target: "_blank" },
  },
  {
    id: "assoc-qc",
    categorySlug: "association",
    title: "Association des Bulgares du Québec",
    note: "Sample association entry.",
  },
  {
    id: "school-mtl",
    categorySlug: "school",
    title: "Bulgarian School Montreal",
    note: "Sample school entry.",
  },
  {
    id: "plumber-mtl",
    categorySlug: "plumber",
    title: "Ivan’s Plumbing",
    note: "Sample services entry.",
  },
];

const meta: Meta<typeof FilterableDirectory> = {
  title: "Components/Directory/FilterableDirectory",
  component: FilterableDirectory,
  args: {
    heading: { heading: "BG Community in Montreal", as: "h2", size: "h2" },
    intro: "Find Bulgarian associations, churches, schools and more across Montreal.",
    items,
    categories,
    groups,
    itemsPerRow: 2,
  },
};

export default meta;
type Story = StoryObj<typeof FilterableDirectory>;

export const Default: Story = {};

export const NoGroups: Story = {
  args: {
    groups: undefined,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
