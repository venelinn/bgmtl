import type { AbstractIntlMessages } from "next-intl";
import bg from "../messages/bg.json";
import en from "../messages/en.json";

type Locale = "en" | "bg";

const messages: Record<Locale, AbstractIntlMessages> = { en, bg };

export const getMessages = (locale: Locale | string): AbstractIntlMessages => {
  return messages[locale as Locale] || messages.bg;
};
