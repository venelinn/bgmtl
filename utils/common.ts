export const PAGE_TYPE = "page";
export const PAGE_TYPES = [PAGE_TYPE] as const;

export const IS_DEV = process.env.NODE_ENV === "development";

/** Normalize slug to always start with a slash */
export function normalizeSlug(slug: string) {
  return "/" + slug.replace(/^\/+|\/+$/g, "");
}

/** Convert a string into a URL-safe slug */
function transliterateCyrillic(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sht",
    ъ: "a",
    ь: "",
    ю: "yu",
    я: "ya",
  };

  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
}

export function slugify(value: string) {
  const latin = transliterateCyrillic(value);
  const slug = latin
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "event";
}

export function getEventPermalink(options: { locale?: string; title?: string; venue?: string }) {
  const { locale, title, venue } = options;
  const localePrefix = locale && locale !== "bg" ? `/${locale}` : "";
  const slug = slugify(String(title || venue || "event"));
  return `${localePrefix}/events/${slug}`;
}

export function getNewsPermalink(options: { locale?: string; title?: string }) {
  const { locale, title } = options;
  const localePrefix = locale && locale !== "bg" ? `/${locale}` : "";
  const slug = slugify(String(title || "news"));
  return `${localePrefix}/news/${slug}`;
}

export interface CloudinaryImage {
  src: string;
  width: number;
  height: number;
}

export interface ImageData {
  url?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

export function getOptimizedImage(image?: CloudinaryImage | ImageData, width = 500, quality: string | number = "auto") {
  if (!image) return { url: "", width: 0, height: 0 };

  const src = "src" in image ? image.src : image.url;
  if (!src) return { url: "", width: 0, height: 0 };

  // Ensure HTTPS (Next.js remotePatterns requires https)
  const secureSrc = src.replace(/^http:\/\//i, "https://");

  const imgWidth = image.width || width;
  const imgHeight = image.height || width; // fallback
  const aspectRatio = imgWidth / imgHeight;
  const newHeight = Math.round(width / aspectRatio);

  // Only apply Cloudinary transformations if it's a Cloudinary URL
  const isCloudinaryUrl = secureSrc.includes("res.cloudinary.com") && secureSrc.includes("/upload/");
  const optimizedUrl = isCloudinaryUrl ? secureSrc.replace("/upload/", `/upload/w_${width},q_${quality}/`) : secureSrc;

  return {
    src: optimizedUrl,
    width,
    height: newHeight,
  };
}
/** Generate optimized Cloudinary image URL */
export function getOptimizedImageURL(image: CloudinaryImage, width = 500, quality: string | number = "auto"): string {
  if (typeof image.src === "string") {
    // Force HTTPS
    const secureSrc = image.src.replace(/^http:\/\//i, "https://");
    return secureSrc.replace("/upload/", `/upload/w_${width},q_${quality}/`);
  }
  return image.src;
}

/** Generate a Cloudinary URL sized for Facebook/OG sharing (1200×630, cropped to fill). */
export function getOgImageUrl(src: string): string {
  const secureSrc = src.replace(/^http:\/\//i, "https://");
  const isCloudinary = secureSrc.includes("res.cloudinary.com") && secureSrc.includes("/upload/");
  if (isCloudinary) {
    return secureSrc.replace("/upload/", "/upload/c_fill,w_1200,h_630,g_auto,f_jpg,q_80/");
  }
  return secureSrc;
}

/** Prevent WebP conversion for SVGs on Cloudinary */
export function getCloudinaryAsSvg(url: string): string {
  if (url.includes(".svg")) {
    return url.replace("/f_auto", "");
  }
  return url;
}
