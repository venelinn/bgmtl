// Contentful raw entry shapes
export interface TableRowEntryFields {
  rowType: "text" | "download";
  cells?: string[];
  downloadLink?: {
    fields?: {
      url?: string;
      label?: string;
      target?: string;
    };
  };
}

export interface TableRowEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: TableRowEntryFields;
}

export interface TableEntryFields {
  title?: string;
  headers?: string[];
  rows?: TableRowEntry[];
}

export interface TableEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: TableEntryFields;
}

// Mapped/normalized shapes for UI consumption
export type MappedTableRowText = {
  id: string;
  type: "text";
  cells: string[];
};

export interface TableLink {
  url: string;
  label?: string;
  target?: string;
}

export type MappedTableRowDownload = {
  id: string;
  type: "download";
  link: TableLink;
};

export type MappedTableRow = MappedTableRowText | MappedTableRowDownload;

export interface MappedTable {
  id: string;
  title?: string;
  headers: string[];
  rows: MappedTableRow[];
}
