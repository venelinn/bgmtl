"use client";
import cx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { Social } from "@/components/Social";
import { useSubscribe } from "@/components/Subscribe/useSubscribe";
import { getCloudinaryAsSvg } from "@/utils/common";
import { inferIconFromUrl } from "@/utils/linkHelpers";
import { getLocalePrefix } from "@/utils/localization";
import { extractMenuColumns, type MenuColumn } from "@/utils/menuHelpers";
import { Heading } from "../Headings";
import styles from "./Footer.module.scss";

type FooterLink = {
  slug: string;
  pageName: string;
};

type FooterLogo = { src: string; alt?: string; width?: number; height?: number };

type FooterProps = {
  links?: FooterLink[];
  pageLocale: string;
  data?: any;
  /** Site logo (the header's), shown in the brand column. */
  logo?: FooterLogo;
};

// "Social" / "Follow us" / "Connect with us" columns render as icons in the
// brand column instead of as a link list (see docs/footer-social-icons.md).
const isSocialColumn = (column: MenuColumn) => {
  const title = column.titleID?.toLowerCase() ?? "";
  const social =
    title === "social" || title.includes("social") || title === "follow us" || title === "connect with us";
  return social && column.links.length > 0;
};

export default function Footer({ data, pageLocale, logo }: FooterProps) {
  /**
   * Extract menu columns in footer mode:
   * The footer data structure has containers (About, Follow Us) with nested items.
   * Footer mode flattens these into: {role: "About us", links: [Mission, History, Charter, Directors]}
   */
  const pathname = usePathname();
  const t = useTranslations("Footer");
  const tJoin = useTranslations("Join");
  const { email, setEmail, status, errorMessage, handleSubmit } = useSubscribe();
  const menuColumns = extractMenuColumns(data?.menuLinks ?? [], pageLocale, "footer");
  const linkColumns = menuColumns.filter((column) => !isSocialColumn(column));
  const socialItems = menuColumns.filter(isSocialColumn).flatMap((column) =>
    column.links.map((l) => ({
      id: l.id,
      name: l.title,
      iconName: l.icon ?? inferIconFromUrl(l.url) ?? "Link",
      url: l.url,
      external: l.target === "_blank",
    })),
  );
  const description = typeof data?.description === "string" ? data.description.trim() : "";

  return (
    <Section
      classNames={{
        main: styles.main,
        inner: styles.inner,
      }}
      size="full"
    >
      <div className={styles.footer}>
        <div className={styles.footer__columns}>
          {/* Brand: logo, blurb (Contentful footer.description) and social icons */}
          <div className={cx(styles.footer__column, styles.footer__brand)}>
            {logo?.src && (
              <Link href={getLocalePrefix(pageLocale) || "/"} className={styles.footer__logo} aria-label={t("homeAriaLabel")}>
                <Image
                  src={getCloudinaryAsSvg(logo.src)}
                  alt={logo.alt || "Logo"}
                  width={logo.width || 160}
                  height={logo.height || 40}
                />
              </Link>
            )}
            {description && <p className={styles.footer__description}>{description}</p>}
            {socialItems.length > 0 && <Social items={socialItems} />}
          </div>

          {linkColumns.map((column) => (
            <div key={column.id} className={styles.footer__column}>
              <Heading as="h3" size="h4" className={styles.footer__column__title}>
                {column.title}
              </Heading>
              <ul className={styles.footer__columnLinks}>
                {column.links.map((link) => {
                  const isActive = link.url === "/" ? pathname === "/" : pathname?.startsWith(link.url);
                  return (
                    <li key={link.id}>
                      <Link
                        href={link.url}
                        target={link.target}
                        data-text={link.title}
                        className={cx(styles.link, "link", isActive && styles.link__active)}
                      >
                        {link.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Newsletter widget — same /api/subscribe flow as the Join section */}
          <div className={cx(styles.footer__column, styles.footer__newsletter)}>
            <Heading as="h3" size="h4" className={styles.footer__column__title}>
              {t("newsletterTitle")}
            </Heading>
            <p className={styles.footer__newsletterText}>{t("newsletterText")}</p>
            <form className={styles.footer__form} onSubmit={handleSubmit}>
              <input
                className={styles.footer__input}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tJoin("emailPlaceholder")}
                aria-label={tJoin("emailPlaceholder")}
              />
              <Button
                type="submit"
                variant="danger"
                size="sm"
                className={styles.footer__submit}
                disabled={status === "loading"}
                label={status === "loading" ? tJoin("subscribing") : t("newsletterButton")}
              />
            </form>
            <output className={styles.footer__status} aria-live="polite">
              {status === "success" && tJoin("successMessage")}
              {status === "error" && errorMessage}
              {status !== "success" && status !== "error" && t("newsletterNote")}
            </output>
          </div>
        </div>

        <div className={styles.footer__bottom}>
          <div className={styles.footer__fineprint}>
            <span>
              {new Date().getFullYear()} &copy; {data?.fineprint} / {data?.copyright} / Crafted by{" "}
              <a
                href="https://venelin.ca"
                className="link"
                data-text="Venelin.ca"
                target="_blank"
                rel="noopener noreferrer"
              >
                Venelin.ca
              </a>
            </span>
          </div>
          <nav className={styles.footer__nav} aria-label={t("privacy")}>
            <Link href={`${getLocalePrefix(pageLocale)}/privacy`} className="link">
              <span className="link__text">{t("privacy")}</span>
            </Link>
          </nav>
        </div>
      </div>
    </Section>
  );
}
