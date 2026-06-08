import type { Meta, StoryObj } from "@storybook/nextjs";
import { DirectoryCard } from "./DirectoryCard";

const meta: Meta<typeof DirectoryCard> = {
  title: "Components/Directory/DirectoryCard",
  component: DirectoryCard,
  args: {
    tags: ["Cultural Centres", "Schools"],
    title: "Zornica Cultural Centre",
    address: "7448 Kingsley Suite 501, CSL Montreal, QC H4W 1P2",
    phone: "514-369-0589",
    email: "info@zornica.com",
    website: "https://www.zornica.com",
  },
};

export default meta;
type Story = StoryObj<typeof DirectoryCard>;

export const Default: Story = {};

export const NoteOnly: Story = {
  args: {
    tags: ["Associations"],
    title: "Association des Bulgares du Québec",
    address: undefined,
    phone: undefined,
    email: undefined,
    website: undefined,
    note: "Sample placeholder entry — replace with real Contentful data.",
  },
};
