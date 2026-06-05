import clsx from "clsx";
import { Icon } from "@/components/Icon";
import styles from "./Tag.module.scss";

export type TagProps = {
  className?: string;
  icon?: string;
  label: string;
};

export const Tag = ({ icon = "deal-solid", label, className }: TagProps) => {
  return (
    <>
      {label && (
        <span className={clsx(styles.tag, className)}>
          {icon && <Icon className={styles.tagIcon} name={icon} />}
          {label}
        </span>
      )}
    </>
  );
};
