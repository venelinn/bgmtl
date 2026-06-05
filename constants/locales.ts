export const SUPPORTED_LOCALES = ["fr-CA", "en-US"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  "fr-CA": "Français",
  "en-US": "English (US)",
};
