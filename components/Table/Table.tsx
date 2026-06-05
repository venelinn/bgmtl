import { Button } from "@/components/Button";
import styles from "./Table.module.scss";

export type TableRow = {
  id?: string;
  cells?: string[];
  link?: {
    url?: string;
    name?: string;
    target?: string;
    iconName?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export interface TableProps {
  headers: string[];
  rows: TableRow[];
}

export const TableView = (props: TableProps) => {
  const { headers, rows } = props;
  return (
    <div>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className={styles.headerCell}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className={styles.bodyRow}>
              {row.cells?.map((cell) => (
                <td key={cell} className={styles.bodyCell}>
                  <strong>{cell}</strong>
                </td>
              ))}
              <td className={styles.bodyCell}>
                {(() => {
                  const attachment = row.link?.attachment as { file?: { url?: string } } | undefined;
                  const url =
                    (row.link?.url as string | undefined) ||
                    (attachment?.file?.url ? `https:${attachment.file.url}` : undefined);
                  const label = (row.link?.name as string) || "Download";

                  return url ? (
                    <Button
                      href={url}
                      outlined
                      variant="link"
                      size="sm"
                      iconSize="0.8em"
                      iconAfter={row.link?.iconName}
                      label={label}
                    />
                  ) : null;
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
