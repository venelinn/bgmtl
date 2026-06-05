import cx from "clsx";
import { Icon, type IconProps } from "@/components/Icon";
import styles from "./Heading.module.scss";

export interface HeadingProps {
  uppercase?: boolean;
  as?: HeadingTag;
  size?: HeadingSizeValue;
  className?: string;
  children?: React.ReactNode;
  heading?: React.ReactNode;
  center?: boolean;
  animationID?: string;
  isHidden?: boolean;
  highlight?: boolean;
  icon?: string;
  iconStyle?: "normal" | "circle" | "scale";
  iconWidth?: IconProps["strokeWidth"];
}

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "div";

export const HeadingAsElement: HeadingTag[] = ["h1", "h2", "h3", "h4", "h5", "div"];

export type HeadingSizeValue = HeadingTag | "hero" | "base" | "caption" | "sb";

const HeadingSizeRaw: HeadingTag[] = ["h1", "h2", "h3", "h4", "h5"];
export const HeadingSize: HeadingSizeValue[] = [...HeadingSizeRaw, "hero", "base", "caption", "sb"];

export const Heading = ({
  uppercase = false,
  as = "h2",
  size = "h2",
  className = undefined,
  children = undefined,
  center = false,
  animationID = undefined,
  isHidden = false,
  highlight = false,
  icon,
  iconStyle = "normal",
  iconWidth,
  ...props
}: HeadingProps) => {
  const Tag = as as HeadingTag;
  const classes = cx(
    styles.heading,
    highlight && styles["heading--highlight"],
    className && className,
    center && styles["heading--center"],
    uppercase && styles["heading--uppercase"],
    size && styles[`heading--${size}`],
  );
  return (
    <Tag className={classes} data-anim={animationID} {...props}>
      {icon && (
        <Icon
          name={icon}
          strokeWidth={iconWidth}
          className={cx(styles.heading__icon, styles[`heading__icon--${iconStyle}`])}
        />
      )}
      {children}
    </Tag>
  );
};
