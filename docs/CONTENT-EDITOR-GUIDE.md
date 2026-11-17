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
- **Highlight in menu** – Shows the page as a red pill in the header menu
- **Menu Icon** – Optional icon next to the page in the header menu. Type a [Lucide](https://lucide.dev/icons) icon name, e.g. `CalendarDays` (used on Events), `Users`, `BookOpen`.

Every page except the homepage gets a **breadcrumb** ("Начало / <Page Name>") automatically — nothing to set.

**Page Name** is also the label in the menu, footer and breadcrumb. Give it its **own** Heading entry. Don't reuse the heading of the page's first section: if that heading gets an accent, the menu label is cut to its first half.

**Page header:** if the page's **first Section** has a heading set to **h1**, that heading and the section's description are shown as the page header: a pale band with breadcrumb, large title and intro, like Contacts. Examples: Помощ, Спонсори, Мисия.

---

### Hero

**What it is:** A large banner at the top of a page (image, title, short text).

**When to use:** For the main landing area of a page, like the homepage or a key section.

**Extended (homepage search):** turn on **Extended** to show the search under the title. As visitors type, it suggests directory categories, listings, events and news from the whole site; clicking into the empty box lists the categories with the most listings. Pressing Enter searches the directory. Then you can set:
- **Search Placeholder**, **Search Button Label**, **Quick Links Label** – texts (per language; empty = site default, e.g. "Търсете обекти, събития, новини…"). If you set a placeholder, mention that it searches the whole site.
- **Quick Categories** – up to 6 directory categories shown as chips. Categories without listings are hidden automatically (their page would be empty).
- **Buttons** – up to 2 **Link** entries shown as buttons under the search. Link **Variant** `primary` or `secondary` = dark glass button. An **Icon Name** on the Link adds an icon.
- **Height** – `two-thirds` works well for the homepage.

---

### Section

**What it is:** A container that groups other content (paragraphs, collections, etc.) and controls layout and spacing.

**What you set:**
- **Heading** – Optional title for the section
- **Components** – The items inside (paragraphs, collections, etc.)
- **Layout** – Size, padding, background style

**When to use:** When you want to group several blocks (e.g. a heading, some text, and a grid of cards) with consistent styling.

---

### Heading

**What it is:** The title used by pages, sections, paragraphs and cards.

**What you set:**
- **Heading** – The text (per language)
- **Accent** – Optional. Text shown **after** the heading in red italics, only in page headers. Example: heading "Станете", accent "спонсор" → "Станете *спонсор*". Leave empty for a plain title.
- **As / Size** – The HTML level (h1–h4) and the visual size

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

**Card style (Card Variant):**
- **primary** – Image cards (default)
- **info** – Icon + heading + text. Set a card's **Variant** to **featured** to colour it in the Bulgarian flag colours. The featured cards take white, green and red in order, with the icon on the left (used on Спонсори).
- **member** – People / team members
- **guide** – Help-page cards. The card's **Role** is the category (e.g. "Здраве"). It sets the card's colour and its filter chip. Add an **Icon** (a Lucide name) and a **Link** to the official page. The page adds the "check the official sites" box and the filter chips automatically.
- **tier** – Price cards (sponsorship packages). **Heading** = tier name, **Role** = price with period ("500 $ / година"), **Content** = a bullet list of benefits, **Link** = the button. Set **Variant** to **featured** on one tier to highlight it with the "Препоръчан" badge.

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
- **Tags** – Up to 2 (Театър и комедия, Музика и парти, Семейно, Традиции, Култура и изкуство, Спорт, Среща на общността, Гостуване, Безплатен вход). Shown as badges on the event card and as filter chips on `/events`.
- **Events with several dates:** create **one event entry per date** (copy the first entry, then change **Date** and **Doors open**). Use the **same Bulgarian heading text** on every date. The site groups them automatically: the earliest date keeps the normal URL (`/events/bocelli`), later dates get the date added (`/events/bocelli-2026-12-14`), and each page shows an **Other dates** row linking to the rest. Give each entry a unique ID and publish it. Venue, ticket link and cover can differ per date.

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

- **Description** – One or two sentences under the logo (per language).

The Footer uses the same structure: **Menu Links** with Link, Page, or Header Menu items. Footer items are grouped into columns (e.g. "About us" with links, "Follow us" with social links).

### Supported Menu Item Types

When adding items to Header or Footer menus, you can only select:

- **Link** – For external URLs or custom links
- **Header Menu** – For dropdown groups with nested items
- **Page** – For internal site pages

**Display Title** (on Header Menu items) is localized, so you can have different labels per language.

---

## Special pages

- **Community** (`/community`) – The **Community Directory** block's **Heading** and **Intro** are shown as the page header (light band with breadcrumb and title, like Contacts). Listings appear automatically from **Directory Entry** entries.
- **Contacts** (`/contacts`) – The page holds the **Contacts** block directly (no hero). Success / error texts can be set on that block. The form's subject can be preselected with a link: `/contacts?topic=event` (event), `?topic=directory` (directory listing), also `general`, `partnership`, `other`. Add `#contact-form` to scroll to the form. Site buttons such as "Предложи събитие" and "Добави профил" already use these links.
- **Privacy** (`/privacy`) – One **Paragraph** with the whole policy. Paragraph text can use **H2/H3 headings** (any paragraph, not just this one).
- **Events on several dates** (e.g. the monthly bazaar) – On the event, add the other days to **Additional dates** (`YYYY-MM-DD`, e.g. `2027-01-31`). They get the same time, place and text as the main Date. Lists show the event once, at its next date, with "+N дати". The calendar and the detail page show every date. If one date has a different time or place, copy the event for that date and keep the same Bulgarian title.
- **Events** (`/events`) – Built automatically from all events; not a Contentful page layout. **Events per page** in Site Configuration sets the archive page size (rounded to rows of 3).
- **News** (`/news`) – Built automatically from all published news, newest first. The `news` page entry only supplies the SEO texts (Meta Data). The homepage shows news from the last 60 days only.
- **Help** (`/help`) – One section with a **guide** collection. To add a topic, create a Card with a Heading, Role (one of the existing categories: Документи, Здраве, Семейство и образование, Език и работа, Жилище и транспорт, За българите), Content, Icon and Link, then add it to the "Help: guide cards" collection. The first 3 cards also appear on the homepage, so reorder the cards to change them. Some cards quote figures (minimum wage, fees); check them about once a year.
- **Sponsors** (`/sponsors`) – A "why" section with 3 **featured info** cards (flag colours) and a **tier** collection with the yearly packages. Change prices and benefits on the cards "Sponsors tier: …". The buttons open the contact form on the Partnership topic.

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
| Heading    | Title text; optional red **Accent** in page headers |
| Events     | Event entries (auto split into Upcoming/Past)|
| News       | News articles                                |

---

## Tips

- **Order matters** – Sections and menu items appear in the order you add them.
- **Header vs Footer** – Edit Header and Footer separately in Contentful; they appear on every page.
- **Sections can nest** – A Section can contain Paragraphs and Collections inside it.
- **Bulgarian headings** – For Events and News, the Bulgarian heading is used for the URL. Keep it consistent.
- **Upcoming vs Past** – Events are split automatically by today’s date. No need to move them manually.
