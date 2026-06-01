import type { MappedTable, MappedTableRow, TableEntry } from "@/types/table";

/**
 * Maps a raw Contentful Table entry into a clean, typed structure for UI consumption.
 *
 * Handles:
 * - Normalizing headers into string[]
 * - Mapping rows based on rowType ('text' | 'download')
 * - Extracting download links safely
 * - Defensive undefined checks throughout
 *
 * @param entry - Raw Contentful table entry
 * @returns MappedTable with normalized structure, or null if entry is invalid
 */
export function mapTableEntry(entry: TableEntry | null | undefined): MappedTable | null {
  if (!entry?.sys?.id || !entry?.fields) {
    return null;
  }

  const { id } = entry.sys;
  const { title, headers, rows } = entry.fields;

  // Normalize headers: ensure we have a string array, default to empty
  const normalizedHeaders = ensureStringArray(headers);

  // Map rows with defensive handling
  const mappedRows = (Array.isArray(rows) ? rows : [])
    .map((row) => mapTableRow(row, id))
    .filter((row): row is MappedTableRow => row !== null);

  return {
    id,
    title,
    headers: normalizedHeaders,
    rows: mappedRows,
  };
}

/**
 * Maps a single raw Contentful TableRow entry into a typed MappedTableRow.
 *
 * @param row - Raw Contentful table row entry
 * @param parentId - Parent table ID for context
 * @returns MappedTableRow (text or download variant) or null if invalid
 */
function mapTableRow(row: any, parentId: string): MappedTableRow | null {
  if (!row?.sys?.id || !row?.fields) {
    return null;
  }

  const { id } = row.sys;
  const { rowType, cells, downloadLink } = row.fields;

  // Validate rowType
  if (rowType !== "text" && rowType !== "download") {
    console.warn(`[mapTableRow] Invalid rowType: ${rowType} (expected 'text' | 'download')`);
    return null;
  }

  if (rowType === "text") {
    const normalizedCells = ensureStringArray(cells);
    if (normalizedCells.length === 0) {
      console.warn(`[mapTableRow] Text row ${id} has no cells`);
      return null;
    }

    return {
      id,
      type: "text",
      cells: normalizedCells,
    };
  }

  // rowType === 'download'
  const link = extractLinkFromDownloadRef(downloadLink);
  if (!link) {
    console.warn(`[mapTableRow] Download row ${id} missing or invalid downloadLink`);
    return null;
  }

  return {
    id,
    type: "download",
    link,
  };
}

/**
 * Safely extracts a link object from a Contentful reference.
 *
 * @param ref - Raw Contentful reference object
 * @returns Link object or null if invalid
 */
function extractLinkFromDownloadRef(ref: any): { url: string; label?: string; target?: string } | null {
  if (!ref?.fields?.url) {
    return null;
  }

  return {
    url: ref.fields.url,
    label: ref.fields.label,
    target: ref.fields.target,
  };
}

/**
 * Ensures a value is a non-empty string array.
 * Filters out falsy/non-string items.
 *
 * @param value - Any value that might be an array or string
 * @returns String array (possibly empty)
 */
function ensureStringArray(value: any): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
