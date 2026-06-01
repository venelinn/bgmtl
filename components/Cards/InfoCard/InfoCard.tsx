import clsx from "clsx";
import Link from "next/link";
import { Heading, type HeadingProps } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import { renderRichTextContent } from "@/utils/RichText";
import styles from "./InfoCard.module.scss";

export const InfoCardVariants = {
  default: "default",
  horizontal: "horizontal",
  horizontalNoIcon: "horizontalNoIcon",
} as const;

export type InfoCardVariant = keyof typeof InfoCardVariants;

export type InfoCardProps = {
  icon?: string;
  heading?: HeadingProps;
  link?: {
    url?: string;
    name?: string;
    target?: string;
    type?: string;
  };
  className?: string;
  classNames?: {
    cardIcon?: string;
    cardImage?: string;
    cardContent?: string;
    cardHeading?: string;
  };
  variant?: keyof typeof InfoCardVariants;
  content?: React.ReactNode;
  linkSrOnly?: boolean;
};

export const InfoCard = ({
  icon,
  heading,
  variant,
  content,
  link,
  className,
  classNames,
  linkSrOnly = false,
}: InfoCardProps) => {
  const normalizedVariant: keyof typeof InfoCardVariants = variant ?? "default";

  return (
    <div
      className={clsx(styles.info, className, {
        [styles[normalizedVariant]]: normalizedVariant,
        [styles.defaultHeaderSize]: heading?.as === "h2",
      })}
    >
      <div className={clsx(styles.infoContent, classNames?.cardContent)}>
        {icon && <Icon name={icon} className={clsx(styles.infoIcon, classNames?.cardIcon)} />}
        {heading && (
          <Heading as={heading?.as} size={heading?.size} className={clsx(styles.infoHeading, classNames?.cardHeading)}>
            {heading?.heading}
          </Heading>
        )}
        {Array.isArray(content) && content.length > 0 ? (
          <ul>
            {content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : content ? (
          <div className={styles?.infoDesc}>
            {typeof content === "string" ? content : renderRichTextContent(content as object)}
          </div>
        ) : null}
      </div>

      {!!link && (
        <div className={styles.infoFooter}>
          <Link
            href={link?.url || "#"}
            target={link?.target}
            className={clsx(styles.cardLink, linkSrOnly && styles.linkSrOnly)}
          >
            <span>{link?.name}</span>
          </Link>
        </div>
      )}
    </div>
  );
};
