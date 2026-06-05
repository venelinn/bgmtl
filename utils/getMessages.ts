import type { AbstractIntlMessages } from "next-intl";
import bg from "../messages/bg.json";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

type Locale = "en" | "bg" | "fr";

const messages: Record<Locale, AbstractIntlMessages> = { en, bg, fr };

export const getMessages = (locale: Locale | string): AbstractIntlMessages => {
  return messages[locale as Locale] || messages.bg;
};
