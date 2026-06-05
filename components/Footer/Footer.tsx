"use client";
import cx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Section } from "@/components/Section";
import { Social } from "@/components/Social";
import { inferIconFromUrl } from "@/utils/linkHelpers";
import { extractMenuColumns } from "@/utils/menuHelpers";
import { Heading } from "../Headings";
import styles from "./Footer.module.scss";

type FooterLink = {
  slug: string;
  pageName: string;
};

type FooterProps = {
  links?: FooterLink[];
  pageLocale: string;
  data?: any;
};

export default function Footer({ data, pageLocale }: FooterProps) {
  /**
   * Extract menu columns in footer mode:
   * The footer data structure has containers (About, Follow Us) with nested items.
   * Footer mode flattens these into: {role: "About us", links: [Mission, History, Charter, Directors]}
   * This creates the two-column footer layout with grouped items.
   */
  const pathname = usePathname();
  const menuColumns = extractMenuColumns(data?.menuLinks ?? [], pageLocale, "footer");
  return (
    <Section
      classNames={{
        main: styles.main,
        inner: styles.inner,
      }}
      size="full"
    >
      <div className={styles.footer}>
        {/* FOOTER MENU COLUMNS: Maps MenuColumn objects to HTML structure */}
        <div className={styles.footer__columns}>
          {menuColumns.length > 0 &&
            menuColumns.map((column) => {
              const titleLower = column.titleID?.toLowerCase() ?? "";
              const hasSocialTitle =
                titleLower === "social" ||
                titleLower.includes("social") ||
                titleLower === "follow us" ||
                titleLower === "connect with us";
              const isSocialColumn = hasSocialTitle && column.links.length > 0;
              const socialItems = column.links.map((l) => ({
                id: l.id,
                name: l.title,
                iconName: l.icon ?? inferIconFromUrl(l.url) ?? "Link",
                url: l.url,
                external: l.target === "_blank",
              }));
              if (isSocialColumn) {
                return (
                  <div key={column.id} className={cx(styles.footer__column, styles.footer__column__social)}>
                    <Heading as="h3" size="h4" className={styles.footer__column__title}>
                      {column.title}
                    </Heading>
                    <Social items={socialItems} />
                  </div>
                );
              }

              return (
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
              );
            })}
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
        </div>
      </div>
    </Section>
  );
}
