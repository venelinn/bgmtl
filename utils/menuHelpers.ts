/**
 * Menu Processing Utilities for Header and Footer Navigation
 *
 * This module converts Contentful menu data into structured MenuColumn arrays
 * with different rendering strategies for header vs. footer.
 *
 * Header Mode:
 *   - Home, Sponsors: Plain links (no title wrapper)
 *   - About: Grouped section with nested items
 *
 * Footer Mode:
 *   - About us, Follow us: Grouped sections with nested items
 *   - All containers are flattened into title + links columns
 *
 * Supports bilingual URLs: Bulgarian (default, no /bg/ prefix) and English (with /en/ prefix)
 */

import type { LinkItem } from "./linkHelpers";
import { contentfulItemToLink } from "./linkHelpers";

export type { LinkItem } from "./linkHelpers";

export type MenuColumn = {
  id: string;
  title: string;
  titleID?: string;
  links: LinkItem[];
};

/**
 * Processes a single menu item based on mode (header vs footer).
 *
 * Nested Items (has menuItems array):
 *   - Flattens nested items to links and creates a column with title
 *
 * Leaf Items:
 *   - Header mode: Creates column with single link (title comes from link.title)
 *   - Footer mode: Creates column placeholder (empty, used in footer grouping)
 *
 * @param item - Menu item to process
 * @param locale - Current locale
 * @param mode - "header" or "footer" rendering strategy
 * @returns MenuColumn or null if item should be skipped
 */
const processMenuItem = (item: any, locale?: string, mode: "header" | "footer" = "footer"): MenuColumn | null => {
  const hasNestedItems = item?.menuItems && Array.isArray(item.menuItems) && item.menuItems.length > 0;
  // Extract heading text from pageName reference if it exists, otherwise use displayTitle/title/name
  const title = item?.pageName?.heading || item?.displayTitle || item?.title || item?.name;

  if (hasNestedItems) {
    // Recursively flatten nested items by converting them to links
    const links = item.menuItems.map((nestedItem: any) => contentfulItemToLink(nestedItem, locale)).filter(Boolean);

    if (links.length > 0) {
      return {
        id: item.id,
        title,
        links,
      };
    }
  }

  // Base case: leaf item without nested items
  if (mode === "header") {
    // In header mode, show links for link and page items
    const link = contentfulItemToLink(item, locale);
    if (link) {
      return {
        id: item.id,
        title: link.title,
        links: [link],
      };
    }
  } else {
    // In footer mode, convert leaf link/page items to columns with a single link
    if (item?.type === "link" || item?.type === "page") {
      const link = contentfulItemToLink(item, locale);
      return {
        id: item.id,
        title,
        links: link ? [link] : [],
      };
    } else if (item?.type === "headerMenu") {
      return {
        id: item.id,
        title,
        links: [],
      };
    }
  }

  return null;
};

/**
 * Processes a menu container (columnList) with different strategies per mode.
 *
 * Footer Mode:
 *   - Treats the container itself as a single column
 *   - Maps all nested items to links within that column
 *   - Example: "About" container → {title: "About", links: [Mission, History, Charter, Directors]}
 *
 * Header Mode:
 *   - Iterates through each item in the container
 *   - Allows mixed rendering: some items as plain links, others as groups
 *   - Example: header container → [Home link, About group, Sponsors link]
 *
 * @param columnList - Menu container with optional nested menuItems
 * @param locale - Current locale
 * @param mode - "header" or "footer" rendering strategy
 * @returns Array of MenuColumn objects
 */
export const processMenu = (columnList: any, locale?: string, mode: "header" | "footer" = "footer"): MenuColumn[] => {
  const menuData: MenuColumn[] = [];

  // If this container has menuItems, iterate through each one
  if (columnList?.menuItems && Array.isArray(columnList.menuItems)) {
    // For footer mode: treat the container itself as a column with nested items as links
    if (mode === "footer") {
      const links = columnList.menuItems
        .map((nestedItem: any) => contentfulItemToLink(nestedItem, locale))
        .filter(Boolean);
      if (links.length > 0) {
        menuData.push({
          id: columnList.id,
          titleID: columnList.title,
          title: columnList.displayTitle || columnList.title || columnList.name,
          links,
        });
      }
    } else {
      // For header mode: iterate through each item
      columnList.menuItems.forEach((item: any) => {
        const column = processMenuItem(item, locale, mode);
        if (column) {
          menuData.push(column);
        }
      });
    }
    return menuData;
  }

  // Otherwise, process the item itself as a single column
  const column = processMenuItem(columnList, locale, mode);
  if (column) {
    menuData.push(column);
  }

  return menuData;
};

/**
 * Main export: Processes all menuLinks and returns structured columns for rendering.
 * Orchestrates the menu processing pipeline:
 *   1. Iterates through each menu list
 *   2. Calls processMenu() for each list with specified mode
 *   3. Collects and returns all resulting columns
 *
 * @param menuLinks - Array of toplevel menu containers from Contentful
 * @param locale - Current locale
 * @param mode - "header" or "footer" rendering strategy
 * @returns Array of MenuColumn objects ready for component rendering
 */
export const extractMenuColumns = (
  menuLinks: any[],
  locale?: string,
  mode: "header" | "footer" = "footer",
): MenuColumn[] => {
  const columns: MenuColumn[] = [];

  menuLinks?.forEach((list: any) => {
    const menuItems = processMenu(list, locale, mode);
    if (menuItems?.length > 0) {
      columns.push(...menuItems);
    }
  });

  return columns;
};
