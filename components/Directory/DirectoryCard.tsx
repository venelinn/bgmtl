import Link from "next/link";
import { Heading } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./DirectoryCard.module.scss";

export type DirectoryCardProps = {
  /** Category label — rendered as the small rust uppercase eyebrow. */
  tag?: string;
  title?: React.ReactNode;
  /** Card body — a Contentful rich-text document (lists, links, etc.). */
  content?: unknown;
  /** Free-text note (e.g. placeholder/sample), rendered in a soft box. */
  note?: React.ReactNode;
  link?: { url?: string; name?: string; target?: string };
};

export const DirectoryCard = ({ tag, title, content, note, link }: DirectoryCardProps) => {
  return (
    <article className={styles.card}>
      {tag && <span className={styles.card__tag}>{tag}</span>}

      {title && (
        <Heading as="h3" size="h4" className={styles.card__title}>
          {title}
        </Heading>
      )}

      {content ? <div className={styles.card__body}>{renderRichTextContent(content)}</div> : null}

      {note && <div className={styles.card__note}>{note}</div>}

      {link?.url && (
        <div className={styles.card__footer}>
          <Link href={link.url} target={link.target} className={styles.card__link}>
            <span>{link.name ?? link.url}</span>
            <Icon name="ExternalLink" className={styles.card__linkIcon} size={16} strokeWidth="1.5" />
          </Link>
        </div>
      )}
    </article>
  );
};

export default DirectoryCard;
