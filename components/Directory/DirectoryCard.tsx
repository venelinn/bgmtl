import Link from "next/link";
import { Heading } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import styles from "./DirectoryCard.module.scss";

export type DirectoryCardProps = {
  /** Category labels — rendered as the small rust uppercase chips. */
  tags?: string[];
  title?: React.ReactNode;
  address?: string;
  phone?: string;
  email?: string;
  /** Full URL; rendered as an external link in the footer. */
  website?: string;
  /** Free-text note (e.g. placeholder/sample), rendered in a soft box. */
  note?: React.ReactNode;
};

// Normalize a raw phone string into a `tel:` target (strip spaces, dashes, parens).
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// A label-less external display of a URL (drop protocol + trailing slash).
const prettyUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const DirectoryCard = ({ tags, title, address, phone, email, website, note }: DirectoryCardProps) => {
  return (
    <article className={styles.card}>
      {tags && tags.length > 0 && (
        <div className={styles.card__tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.card__tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {title && (
        <Heading as="h3" size="h4" className={styles.card__title}>
          {title}
        </Heading>
      )}

      {(address || phone || email) && (
        <ul className={styles.card__details}>
          {address && (
            <li className={styles.card__detail}>
              <Icon name="MapPin" className={styles.card__detailIcon} size={16} strokeWidth="1.5" />
              <span>{address}</span>
            </li>
          )}
          {phone && (
            <li className={styles.card__detail}>
              <Icon name="Phone" className={styles.card__detailIcon} size={16} strokeWidth="1.5" />
              <Link href={telHref(phone)} className={styles.card__detailLink}>
                {phone}
              </Link>
            </li>
          )}
          {email && (
            <li className={styles.card__detail}>
              <Icon name="Mail" className={styles.card__detailIcon} size={16} strokeWidth="1.5" />
              <Link href={`mailto:${email}`} className={styles.card__detailLink}>
                {email}
              </Link>
            </li>
          )}
        </ul>
      )}

      {note && <div className={styles.card__note}>{note}</div>}

      {website && (
        <div className={styles.card__footer}>
          <Link href={website} target="_blank" rel="noopener noreferrer" className={styles.card__link}>
            <Icon name="Globe" className={styles.card__linkIcon} size={16} strokeWidth="1.5" />
            <span>{prettyUrl(website)}</span>
          </Link>
        </div>
      )}
    </article>
  );
};

export default DirectoryCard;
