export * from "./Hero";
// HeroConnector is server-only (next/headers, Contentful fetch) — import it from
// "./Hero/HeroConnector" directly so client graphs pulling in Hero don't bundle it.
