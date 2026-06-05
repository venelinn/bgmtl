import { Icon } from "@/components/Icon";
import styles from "./Social.module.scss";

interface SocialItem {
  id: string;
  name: string;
  iconName: string;
  url: string;
  external: boolean;
}

interface SocialProps {
  items: SocialItem[];
}

export const Social = ({ items }: SocialProps) => {
  return (
    <div className={styles.social}>
      {items.map((item) => {
        return (
          <a
            href={item.url}
            key={item.id}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            title={item.name}
          >
            <Icon size="1.3em" name={item.iconName} />
          </a>
        );
      })}
    </div>
  );
};
