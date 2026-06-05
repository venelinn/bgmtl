import { ImageContent } from "./ImageContent";

export const ImageContentConnector = (props) => {
  return (
    <ImageContent
      animationID={props?.animationID}
      heading={props?.heading}
      image={props?.image[0]}
      content={props?.content}
      fullHeight={props?.fullHeight}
      id={props?.id}
      isContentFirst={props?.isContentFirst}
      variant={props?.variant}
    />
  );
};
