import { CollectionConnector } from "./Collection/";
import { ContactsConnector } from "./Contacts";
import { DirectoryConnector } from "./Directory/DirectoryConnector";
import { EventsConnector } from "./Events";
import { HeroConnector } from "./Hero";
import { ImageContentConnector } from "./ImageContent";
import { ParagraphConnector } from "./Paragraph";
import { SectionConnector } from "./Section";

// Map components which are dynamically resolved by content type in the CMS
export const componentMap = {
  hero: HeroConnector,
  imageContent: ImageContentConnector,
  contacts: ContactsConnector,
  collection: CollectionConnector,
  communityDirectory: DirectoryConnector,
  section: SectionConnector,
  paragraph: ParagraphConnector,
  events: EventsConnector,
};
