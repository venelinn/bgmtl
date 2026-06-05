import { Contacts } from "./Contacts";

export const ContactsConnector = (props) => {
  return <Contacts message={props?.message} errorMessage={props?.errorMessage} />;
};
