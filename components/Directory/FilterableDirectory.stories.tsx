import type { Meta, StoryObj } from "@storybook/nextjs";
import { type DirectoryCategory, type DirectoryItem, FilterableDirectory } from "./FilterableDirectory";

const categories: DirectoryCategory[] = [
  { slug: "association", label: "Associations", order: 1 },
  { slug: "cultural-center", label: "Cultural Centres", order: 2 },
  { slug: "school", label: "Schools", order: 3 },
  { slug: "church", label: "Churches", order: 4 },
  { slug: "plumber", label: "Plumbers", order: 5 },
];

const items: DirectoryItem[] = [
  {
    id: "zornica",
    categorySlugs: ["cultural-center", "school"], // multi-tag example
    title: "Zornica Cultural Centre",
    address: "7448 Kingsley Suite 501, CSL Montreal, QC H4W 1P2",
    phone: "514-369-0589",
    website: "https://www.zornica.com",
  },
  {
    id: "st-ivan-rilsky",
    categorySlugs: ["church"],
    title: "St. Ivan Rilsky Church",
    address: "1191 Blvd. Sauve Ouest, Montreal, QC H2C 1Z8",
    phone: "514-956-7835",
    website: "https://www.stivanrilsky.org",
  },
  {
    id: "assoc-qc",
    categorySlugs: ["association"],
    title: "Association des Bulgares du Québec",
    email: "info@example.org",
    note: "Sample association entry.",
  },
  {
    id: "school-mtl",
    categorySlugs: ["school"],
    title: "Bulgarian School Montreal",
    note: "Sample school entry.",
  },
  {
    id: "plumber-mtl",
    categorySlugs: ["plumber"],
    title: "Ivan’s Plumbing",
    phone: "514-555-0123",
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
    itemsPerRow: 2,
  },
};

export default meta;
type Story = StoryObj<typeof FilterableDirectory>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
