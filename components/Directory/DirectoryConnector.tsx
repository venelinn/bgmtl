import { draftMode } from "next/headers";
import type { HeadingProps } from "@/components/Headings";
import { getCommunityDirectory } from "@/utils/content";
import { getMessages } from "@/utils/getMessages";
import { FilterableDirectory } from "./FilterableDirectory";

type DirectoryConnectorProps = {
  id?: string;
  locale?: string;
  /** Which city's cards to show (matches each card's `city` field). */
  city?: string;
  /** Resolved `heading` reference entry (rendered via the shared Heading component). */
  heading?: HeadingProps;
  intro?: string;
  itemsPerRow?: number;
  autocomplete?: boolean;
};

/**
 * Server component for the `communityDirectory` section. Queries every card in
 * the section's `city`, plus the category/group taxonomy, and hands them to the
 * client FilterableDirectory. Reads draft mode so editors see previews.
 */
export async function DirectoryConnector(props: DirectoryConnectorProps) {
  const city = props.city;
  if (!city) return null;

  const locale = props.locale || "bg";
  const { isEnabled } = await draftMode();
  const data = await getCommunityDirectory(city, locale, isEnabled);
  if (!data.items.length) return null;

  const m = ((getMessages(locale) as Record<string, unknown>)?.Directory ?? {}) as Record<string, string>;
  const itemsPerRow = ([1, 2, 3, 4].includes(props.itemsPerRow as number) ? props.itemsPerRow : 2) as 1 | 2 | 3 | 4;

  return (
    <FilterableDirectory
      heading={props.heading}
      intro={props.intro}
      items={data.items}
      categories={data.categories}
      groups={data.groups}
      itemsPerRow={itemsPerRow}
      autocomplete={props.autocomplete !== false}
      labels={{
        all: m.all,
        searchPlaceholder: m.searchPlaceholder,
        searchAriaLabel: m.searchAriaLabel,
        groupAriaLabel: m.groupAriaLabel,
        categoryAriaLabel: m.categoryAriaLabel,
        clear: m.clear,
        noResults: m.noResults,
        suggestionsCategories: m.suggestionsCategories,
        suggestionsListings: m.suggestionsListings,
        resultsCount: m.resultsCount,
      }}
    />
  );
}

export default DirectoryConnector;
