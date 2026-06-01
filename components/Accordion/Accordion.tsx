import clsx from "clsx";
import Link from "next/link";
import { Heading, type HeadingProps } from "@/components/Headings";
import styles from "./Accordion.module.scss";

export interface AccordionProps {
  isOpen?: boolean;
  children: React.ReactNode;
  heading: HeadingProps;
  type?: "accordion" | "tabs";
  variant?: "faq" | "tab-default";
  size?: "default" | "sm";
  className?: string;
  customHeader?: React.ReactNode;
  disabled?: boolean;
  index?: number;
  links?: any[];
}

export const Accordion = ({
  index,
  isOpen = false,
  heading,
  children,
  type,
  variant,
  customHeader = null,
  size = "default",
  className,
  disabled,
  links,
}: AccordionProps) => {
  const inlineStyles = {
    ...(index && { "--n": index }),
  } as React.CSSProperties;
  return (
    <details
      className={clsx(
        styles.accordion,
        className,
        type && styles[type],
        variant && styles[variant],
        size && styles[size],
        disabled && styles.disabled,
      )}
      style={inlineStyles}
      open={isOpen}
      name={type === "tabs" ? "dbtabs" : undefined}
    >
      <summary className={styles.accordion__title}>
        {heading && (
          <div className={styles.accordion__title__text}>
            <Heading {...heading}>
              <span className={styles.accordion__title__text__inner} data-text={heading?.children}>
                {heading?.children}
              </span>
            </Heading>
            {customHeader && <div className={styles.accordion__customHeader}>{customHeader}</div>}
          </div>
        )}
        {type === "accordion" && <span className={styles.accordion__chevron} />}
      </summary>
      {children && <div className={styles.accordion__content}>{children}</div>}
      {links && (
        <ul className={styles.accordion__links}>
          {links.map((link) => (
            <li key={link.id}>
              <Link href={link.url} target={link.target} data-text={link.name} className="link">
                {link.name} {link.icon && link.icon}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
};
