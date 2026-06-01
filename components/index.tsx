import { CollectionConnector } from "./Collection/";
import { ContactsConnector } from "./Contacts";
import { EventsConnector } from "./Events";
import { HeroConnector } from "./Hero";
import { ImageContentConnector } from "./ImageContent";
import { ParagraphConnector } from "./Paragraph";
import { SectionConnector } from "./Section";
import { TableConnector } from "./Table";

// Map components which are dynamically resolved by content type in the CMS
export const componentMap = {
  hero: HeroConnector,
  imageContent: ImageContentConnector,
  contacts: ContactsConnector,
  collection: CollectionConnector,
  section: SectionConnector,
  paragraph: ParagraphConnector,
  events: EventsConnector,
  table: TableConnector,
};
