import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsDetail } from "@/components/News/NewsDetail";
import { buildMetadata } from "@/components/MetaData";
import type { NewsItem } from "@/types/news";
import { slugify } from "@/utils/common";
import { getAllNews, getAllNewsBulgarian, getFallbackImageUrl, getSiteConfig } from "@/utils/content";
import { localization } from "@/utils/localization";

// No numeric `revalidate`: Contentful data is cached indefinitely under the
// "contentful" tag (utils/contentful-cache.ts) and busted on publish via the
// webhook. A numeric revalidate here would re-enable traffic-driven polling.

type Params = Promise<{ lang: string; slug?: string[] }>;

const getHeadingText = (heading: NewsItem["heading"]) => {
  if (typeof heading === "string") return heading;
  if (heading && typeof heading === "object" && "heading" in heading && typeof heading.heading === "string") {
    return heading.heading;
  }
  return "";
};

export async function generateStaticParams() {
  const locales = localization.locales;
  const allParams: Array<{ lang: string; slug: string[] }> = [];

  try {
    const bulgarianNews = (await getAllNewsBulgarian()) as NewsItem[];

    for (const locale of locales) {
      bulgarianNews.forEach((item) => {
        const headingText = getHeadingText(item.heading);
        const newsSlug = slugify(headingText || "news");
        allParams.push({
          lang: locale,
          slug: [newsSlug],
        });
      });
    }
  } catch {
    // news content type may not exist yet
  }

  return allParams;
}

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { lang, slug = [] } = await props.params;
  const last = slug[slug.length - 1] || "";

  try {
    const newsItems = (await getAllNews(lang)) as NewsItem[];
    const news =
      newsItems.find((item) => {
        const bgHeading = (item as { bgHeading?: string }).bgHeading || getHeadingText(item.heading);
        return slugify(String(bgHeading || "news")) === last;
      }) || null;

    if (!news) {
      return { title: "News Not Found" };
    }

    const title = getHeadingText(news.heading);
    const coverUrl = news.cover?.[0]?.src ?? null;

    return buildMetadata({
      pageTitle: title || "News",
      pageDescription: title || "News article",
      image: coverUrl,
      type: "article",
      path: `news/${last}`,
      locale: lang,
    });
  } catch {
    return { title: "News Not Found" };
  }
}

export default async function NewsPage(props: { params: Params }) {
  const { lang, slug = [] } = await props.params;

  if (!localization.locales.includes(lang)) return notFound();

  const last = slug[slug.length - 1] || "";

  try {
    const newsItems = (await getAllNews(lang)) as NewsItem[];
    const news =
      newsItems.find((item) => {
        const bgHeading = (item as { bgHeading?: string }).bgHeading || getHeadingText(item.heading);
        return slugify(String(bgHeading || "news")) === last;
      }) || null;

    if (!news) return notFound();

    const siteConfig = await getSiteConfig(lang, false);
    const heroFallbackImage = getFallbackImageUrl(siteConfig?.fallbackNews) ?? undefined;

    return <NewsDetail news={news} locale={lang} heroFallbackImage={heroFallbackImage} />;
  } catch {
    return notFound();
  }
}
