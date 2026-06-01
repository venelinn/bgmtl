import type { Metadata } from "next";
import { raleway } from "@/utils/fonts";
import "@/styles/globals.scss";

// This is the root layout. It does not know the language.
// We will set the 'lang' attribute on the client in the provider.

export const metadata: Metadata = {
  title: "National Capital Region Bulgarian Community | Bulgarian Community | bgottawa-gatineau.ca",
  description: "National Capital Region Bulgarian Community | Bulgarian Community",
  icons: {
    apple: [{ url: "/static/favicons/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/static/favicons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/static/favicons/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
  },
  manifest: "/static/favicons/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // We can't set a dynamic 'lang' here, so we'll let the
    // client provider do it. 'suppressHydrationWarning' is
    // recommended when you modify the <html> tag on the client.
    <html lang="en" suppressHydrationWarning>
      <body className={raleway.className}>
        {/*
          We do NOT wrap with ClientLayout here.
          The [lang]/layout.tsx will do that.
        */}
        {children}
      </body>
    </html>
  );
}
