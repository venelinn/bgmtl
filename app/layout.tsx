import type { Metadata } from "next";
import { VIEW_TRANSITIONS_ENABLED } from "@/utils/common";
import { raleway } from "@/utils/fonts";
import "@/styles/globals.scss";

// This is the root layout. It does not know the language.
// We will set the 'lang' attribute on the client in the provider.

export const metadata: Metadata = {
  title: "National Capital Region Bulgarian Community | Bulgarian Community | bgmtl.com",
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
    <html
      lang="en"
      data-vt={VIEW_TRANSITIONS_ENABLED ? undefined : "off"}
			data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={raleway.className}>
        {/*
          Homepage load choreography gate. Runs before first paint so the
          intro's initial hidden state (see `html[data-home-intro]` in
          globals.scss) is applied without a flash. Sets the flag only on a
          homepage ("/", "/bg", "/en", …), once per browser session, and never
          when the user prefers reduced motion. The attribute is removed after
          the sequence so it doesn't linger on the DOM.
        */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint gate, must be inline + synchronous
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!/^\\/(?:[a-z]{2})?\\/?$/.test(location.pathname))return;if(sessionStorage.getItem('homeIntroPlayed'))return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.dataset.homeIntro='1';sessionStorage.setItem('homeIntroPlayed','1');setTimeout(function(){d.removeAttribute('data-home-intro')},2400);}catch(e){}})();`,
          }}
        />
        {/*
          Theme bootstrap. Runs before first paint so the saved/preferred theme
          is on <html> before any CSS resolves — prevents a flash of light mode.
          Reads localStorage('bgmtl-theme'); falls back to the OS preference.
          The ThemeToggle (header) reads and updates this same attribute + key.
        */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint gate, must be inline + synchronous
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('bgmtl-theme');var t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        {/*
          We do NOT wrap with ClientLayout here.
          The [lang]/layout.tsx will do that.
        */}
        {children}
      </body>
    </html>
  );
}
