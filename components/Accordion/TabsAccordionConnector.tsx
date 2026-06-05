import type { HeadingProps } from "@/components/Headings";
import { renderRichTextContent } from "@/utils/RichText";
import { Accordion, type AccordionProps } from "./Accordion";
import styles from "./Accordion.module.scss";

type MenuLinks = {
  id: string;
  url: string;
  title: string;
  target?: string;
  icon: string | null;
};

type AccordionItem = {
  id: string;
  title: string;
  key?: string;
  heading?: HeadingProps;
  content?: unknown; // Rich text from Contentful
  isOpen?: boolean;
  disabled?: boolean;
  menuLinks?: MenuLinks[];
};

type TabsAccordionConnectorProps = {
  title?: string;
  type?: "accordion" | "tabs";
  heading?: HeadingProps;
  description?: string;
  items?: AccordionItem[];
  variant?: AccordionProps["variant"];
};

export const TabsAccordionConnector = (props: TabsAccordionConnectorProps) => {
  const { items = [], variant, type } = props;

  if (!items?.length) {
    console.warn("⚠️ TabsAccordionConnector: No items found");
    return null;
  }

  return (
    <div className={styles.tabsWrapper} data-type={type}>
      {items.map((item, i) => (
        <Accordion
          index={i + 1}
          key={item.id}
          type={type}
          links={item.menuLinks}
          heading={{
            children: item.heading?.heading || item.title,
            as: item.heading?.as || "h3",
            size: item.heading?.size || "h3",
          }}
          isOpen={item.isOpen}
          disabled={item.disabled}
          variant={variant}
        >
          {item.content ? <>{renderRichTextContent(item.content as object)}</> : null}
        </Accordion>
      ))}
    </div>
  );
};
