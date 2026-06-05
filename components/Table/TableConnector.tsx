import { TableView } from "./Table";

export const TableConnector = (props) => {
  if (!props) return null;

  return <TableView {...props} />;
};
