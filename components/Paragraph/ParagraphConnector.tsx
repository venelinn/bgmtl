import { Heading, type HeadingProps } from "@/components/Headings";
import { renderRichTextContent } from "@/utils/RichText";

type ParagraphConnectorProps = {
  heading?: HeadingProps;
  description?: string;
  alignment?: boolean;
  content?: unknown;
};

export const ParagraphConnector = (props: ParagraphConnectorProps) => {
  if (!props) return null;
  const { heading, description, alignment, content } = props;
  return (
    <>
      {heading && (
        <Heading as={heading.as} size={heading.size} center={alignment} highlight={heading?.highlight}>
          {heading.heading}
        </Heading>
      )}
      {description && description}
      {content ? <>{renderRichTextContent(content as object)}</> : null}
    </>
  );
};
