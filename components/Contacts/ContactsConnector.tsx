import { getFooter } from "@/utils/content";
import { getContentfulLocale, getLocalePrefix } from "@/utils/localization";
import { extractMenuColumns, getSocialLinks } from "@/utils/menuHelpers";
import { Contacts } from "./Contacts";

type ContactsConnectorProps = {
  message?: string;
  errorMessage?: string;
  /** Short locale ("bg" | "en" | "fr") — set on every mapped Contentful entry. */
  locale?: string;
};

/** Contentful `contacts` block: adds the locale prefix and the footer's social links. */
export const ContactsConnector = async ({ message, errorMessage, locale = "bg" }: ContactsConnectorProps) => {
  const footer = (await getFooter(getContentfulLocale(locale))) as { menuLinks?: unknown[] } | null;
  const channels = getSocialLinks(extractMenuColumns((footer?.menuLinks ?? []) as never, locale, "footer"));

  return (
    <Contacts
      message={message}
      errorMessage={errorMessage}
      localePrefix={getLocalePrefix(locale)}
      channels={channels}
    />
  );
};
