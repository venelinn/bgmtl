# Content Editor Guide

> A simple guide for editors who manage the bgmtl website.  
> No technical knowledge required.

---

## How Content Works

Everything on the website is built from **pages**. Each page has a URL (like `/about` or `/events`) and is made up of **sections** stacked in order. You control what appears on each page by adding, removing, and reordering sections.

---

## The Big Picture

```
Page (e.g. "About Us")
  └── Sections (blocks you add in order)
        ├── Hero (banner at top)
        ├── Section (group of content)
        │     └── Paragraphs, Collections, etc.
        ├── Collection (grid of cards)
        └── ...
```

---

## Major Components

### Page

**What it is:** A single webpage with its own URL.

**What you set:**
- **Title** – Internal name (for your reference)
- **Page Name** – What visitors see
- **Slug** – The URL path (e.g. `about` → yoursite.com/about)
- **Sections** – The blocks that make up the page (in order)
- **Sidebar** – Whether to show a sidebar (calendar, donate, newsletter)
- **Listings** – Optional: show Events and/or News on this page

---

### Hero

**What it is:** A large banner at the top of a page (image, title, short text).

**When to use:** For the main landing area of a page, like the homepage or a key section.

---

### Section

**What it is:** A container that groups other content (paragraphs, collections, etc.) and controls layout and spacing.

**What you set:**
- **Heading** – Optional title for the section
- **Components** – The items inside (paragraphs, collections, etc.)
- **Layout** – Size, padding, background style

**When to use:** When you want to group several blocks (e.g. a heading, some text, and a grid of cards) with consistent styling.

---

### Paragraph

**What it is:** A block of text with an optional heading.

**What you set:**
- **Heading** – Optional title
- **Content** – Rich text (bold, links, etc.)

**When to use:** For simple text content: introductions, descriptions, announcements.

---

### Collection

**What it is:** A grid or list of cards (events, news, team members, info cards, etc.).

**What you set:**
- **Heading** – Optional title for the collection
- **Cards** – The items to display (events, news, members, etc.)
- **Layout** – Grid, paginated (with pages), or slider
- **Items per row** – How many cards per row (1–4)

**When to use:** To show events, news, team members, or any set of similar items in a structured layout.

---

### Events

**What it is:** A content type for events (concerts, meetings, galas, etc.).

**How it works:**
- Each event has a **date**. The site automatically splits events into **Upcoming** and **Past**.
- **Upcoming events** can show:
  - **Buy Ticket** – if you add a ticket URL
  - **Doors open at** – if you set a doors-open time
- **Past events** do not show Buy Ticket or Doors open.
- The URL of each event is based on its **Bulgarian heading** so it stays the same in all languages.

---

### News

**What it is:** A content type for news articles and updates.

**How it works:**
- Simpler than events: no past/upcoming split, no buy button.
- The URL of each news item is based on its **Bulgarian heading** so it stays the same in all languages.
- News can appear in Collections and in the optional **Listings** on pages.

---

## Managing Links in the Header and Footer

The **Header** (top navigation bar) and **Footer** (bottom of every page) are managed separately from pages. You edit them in the **Header** and **Footer** content types in Contentful.

### Header

**What you set:**
- **Logo** – The main logo image
- **Mobile Logo** – Logo for small screens (optional)
- **Logo Link** – Where the logo goes when clicked (e.g. homepage)
- **Menu Links** – The navigation items (Home, About, Events, etc.)

**How Menu Links work:**  
You add items to the **Menu Links** list. Each item can be one of three types:

| Type          | Use for                                      |
| ------------- | -------------------------------------------- |
| **Link**      | External URLs (e.g. Facebook) or any custom URL |
| **Page**      | Internal pages (About, Mission, Events, etc.) |
| **Header Menu** | A dropdown/group (e.g. "About us" with Mission, History, Charter inside) |

**Header Menu** lets you create dropdowns: add a Header Menu item, give it a **Display Title** (e.g. "About us"), then add **Menu Items** inside (Mission, History, etc.). Each nested item can be a Link or a Page.

### Footer

The Footer uses the same structure: **Menu Links** with Link, Page, or Header Menu items. Footer items are grouped into columns (e.g. "About us" with links, "Follow us" with social links).

### Supported Menu Item Types

When adding items to Header or Footer menus, you can only select:

- **Link** – For external URLs or custom links
- **Header Menu** – For dropdown groups with nested items
- **Page** – For internal site pages

**Display Title** (on Header Menu items) is localized, so you can have different labels per language.

---

## Flow: Adding Content

1. **Create a Page** (or open an existing one).
2. **Add Sections** in the order you want them to appear (top to bottom).
3. For each section, choose the type (Hero, Section, Collection, Paragraph, etc.).
4. Fill in the fields for each section.
5. For **Section** types, add **Components** inside (paragraphs, collections, etc.).
6. **Publish** the page.

---

## Listings (Events & News on a Page)

If you turn on **Listings** for a page, you can show:

- **Events** – A preview of upcoming/past events with a "View all" link to the full events page.
- **News** – A preview of recent news with a "View all" link to the full news page.

You can enable one or both. Each appears as its own block with a heading (e.g. "Events", "News").

---

## Quick Reference

| Component   | Purpose                                      |
| ----------- | -------------------------------------------- |
| Page       | A webpage; defines URL and sections          |
| Header     | Top navigation (logo, menu links)            |
| Footer     | Bottom of page (menu columns, copyright)     |
| Hero       | Large banner at top                          |
| Section    | Groups content; controls layout               |
| Paragraph  | Heading + text block                         |
| Collection | Grid/list of cards (events, news, members…)  |
| Events     | Event entries (auto split into Upcoming/Past)|
| News       | News articles                                |

---

## Tips

- **Order matters** – Sections and menu items appear in the order you add them.
- **Header vs Footer** – Edit Header and Footer separately in Contentful; they appear on every page.
- **Sections can nest** – A Section can contain Paragraphs and Collections inside it.
- **Bulgarian headings** – For Events and News, the Bulgarian heading is used for the URL. Keep it consistent.
- **Upcoming vs Past** – Events are split automatically by today’s date. No need to move them manually.
