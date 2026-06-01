import type { Preview } from "@storybook/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { useEffect } from "react";
import { raleway } from "../utils/fonts";
import { getMessages } from "../utils/getMessages";
import "./styles.scss";

const ThemeAndLocaleDecorator = (Story: React.ComponentType<object>, context: Record<string, unknown>) => {
  const globals = context.globals as { theme?: string; locale?: string };
  const { theme = "light", locale = "en" } = globals;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  // Detect custom select support and set data attribute on <body>

  useEffect(() => {
    document.body.dataset.supportsCustomSelect = CSS.supports("appearance: base-select") ? "true" : "false";
  }, []); // ← Runs once

  const messages = getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <main className={raleway.className}>
        <Story />
      </main>
    </NextIntlClientProvider>
  );
};

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [ThemeAndLocaleDecorator],
  globalTypes: {
    locale: {
      description: "Internationalization locale",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "es", title: "Español" },
          { value: "fr", title: "Français" },
        ],
      },
    },
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
};

export default preview;
