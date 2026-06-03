"use client"

// Reusable, column-driven data table.
//
// Headless engine: @tanstack/react-table (column model, client sorting +
// pagination + row expansion). Chrome: the shared `DataTable` primitives
// (themed <table>, sticky header, StateRow) — same parts the moderation queue
// uses. Footer: the shared `Pagination` component so paging matches the app.
//
// Client-side by default: sorting + pagination operate on the rows already
// in `data`. Flip `manual` and lift `sorting` / `pagination` state to the
// parent for server-side paging (and SSR — see DataGrid.stories.tsx notes).
//
// Pass `renderSubRow` to make rows expandable: an expander column is added and
// each open row reveals an inline panel beneath it (replaces detail modals).

import { Fragment, useMemo, useState, type ReactNode } from "react"
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ExpandedState,
	type OnChangeFn,
	type PaginationState,
	type RowData,
	type SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/Button"
import { DataTable } from "@/components/DataTable"
import { Icon } from "@/components/Icon"
import { Pagination, type PaginationLabels } from "@/components/Pagination"
import styles from "./DataGrid.module.scss"

// Per-column alignment, read by both the header and body cells.
declare module "@tanstack/react-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		align?: "left" | "center" | "right"
		/** Fixed column width (e.g. "2.75rem" or 44) applied to header + cells. */
		width?: string | number
	}
}

export interface DataGridLabels {
	/** Builds the sortable-header button's accessible label, e.g. `(c) => `Sort by ${c}``. */
	sortBy?: (column: string) => string
	/** Forwarded to the `Pagination` footer. */
	pagination?: PaginationLabels
}

export interface DataGridProps<TData> {
	data: TData[]
	// biome-ignore lint/suspicious/noExplicitAny: columns hold heterogeneous accessor value types.
	columns: ColumnDef<TData, any>[]
	/** Stable row id (e.g. a record's primary key); falls back to row index. */
	getRowId?: (row: TData) => string
	onRowClick?: (row: TData) => void
	/** Accessible label for an interactive row (required when `onRowClick`/`renderSubRow` is set). */
	rowAriaLabel?: (row: TData) => string
	/**
	 * Render an inline panel beneath an expanded row. Providing this adds an
	 * expander column and makes rows toggle open on click/Enter/Space.
	 */
	renderSubRow?: (row: TData) => ReactNode
	/** Gate which rows can expand (default: all, when `renderSubRow` is set). */
	getRowCanExpand?: (row: TData) => boolean
	/** Render the paginated footer + chunk rows into pages. */
	enablePagination?: boolean
	pageSize?: number
	/** Pin the header while the body scrolls. */
	stickyHeader?: boolean
	/** Drop the standalone card chrome (table already sits in a bordered shell). */
	embedded?: boolean
	isLoading?: boolean
	loadingLabel?: ReactNode
	emptyLabel?: ReactNode
	labels?: DataGridLabels
	// ── server-side (manual) escape hatch ──
	/** Treat sorting + pagination as parent-controlled (server does the work). */
	manual?: boolean
	/** Total rows on the server — drives the footer page count in `manual` mode. */
	rowCount?: number
	sorting?: SortingState
	onSortingChange?: OnChangeFn<SortingState>
	pagination?: PaginationState
	onPaginationChange?: OnChangeFn<PaginationState>
}

export function DataGrid<TData>({
	data,
	columns,
	getRowId,
	onRowClick,
	rowAriaLabel,
	renderSubRow,
	getRowCanExpand,
	enablePagination = true,
	pageSize = 10,
	stickyHeader,
	embedded,
	isLoading,
	loadingLabel,
	emptyLabel,
	labels,
	manual = false,
	rowCount,
	sorting: controlledSorting,
	onSortingChange,
	pagination: controlledPagination,
	onPaginationChange,
}: DataGridProps<TData>) {
	const [internalSorting, setInternalSorting] = useState<SortingState>([])
	const [internalPagination, setInternalPagination] = useState<PaginationState>(
		{ pageIndex: 0, pageSize },
	)
	const [expanded, setExpanded] = useState<ExpandedState>({})

	const sorting = controlledSorting ?? internalSorting
	const pagination = controlledPagination ?? internalPagination
	const expandable = !!renderSubRow

	// When expandable, append a narrow expander column (chevron indicator).
	const tableColumns = useMemo<DataGridProps<TData>["columns"]>(() => {
		if (!renderSubRow) return columns
		return [
			{
				id: "_expander",
				header: "",
				enableSorting: false,
				meta: { align: "center", width: 32 },
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="sm"
						icon={row.getIsExpanded() ? "ChevronDown" : "ChevronRight"}
						aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
						aria-hidden
					/>
				),
			},
			...columns,
		]
	}, [columns, renderSubRow])

	const table = useReactTable<TData>({
		data,
		columns: tableColumns,
		state: { sorting, pagination, expanded },
		onSortingChange: onSortingChange ?? setInternalSorting,
		onPaginationChange: onPaginationChange ?? setInternalPagination,
		onExpandedChange: setExpanded,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: manual ? undefined : getSortedRowModel(),
		getPaginationRowModel:
			manual || !enablePagination ? undefined : getPaginationRowModel(),
		getExpandedRowModel: expandable ? getExpandedRowModel() : undefined,
		getRowCanExpand: expandable
			? (row) => (getRowCanExpand ? getRowCanExpand(row.original) : true)
			: undefined,
		manualSorting: manual,
		manualPagination: manual,
		rowCount: manual ? rowCount : undefined,
		getRowId: getRowId ? (row) => getRowId(row) : undefined,
	})

	const rows = table.getRowModel().rows
	const colCount = table.getAllLeafColumns().length

	const totalItems = manual
		? (rowCount ?? 0)
		: table.getPrePaginationRowModel().rows.length
	const showFooter = enablePagination && totalItems > pagination.pageSize

	return (
		<div className={styles.dataGrid}>
			<div className={styles.dataGrid__scroll}>
				<DataTable embedded={embedded} stickyHeader={stickyHeader}>
					<DataTable.Head>
						{table.getFlatHeaders().map((header) => {
							const canSort = header.column.getCanSort()
							const sorted = header.column.getIsSorted()
							const headerNode = flexRender(
								header.column.columnDef.header,
								header.getContext(),
							)
							const headerLabel =
								typeof header.column.columnDef.header === "string"
									? header.column.columnDef.header
									: String(header.column.id)
							const align = header.column.columnDef.meta?.align
							return (
								<DataTable.HeadCell
									key={header.id}
									align={align}
									width={header.column.columnDef.meta?.width}
									aria-sort={
										!canSort
											? undefined
											: sorted === "asc"
												? "ascending"
												: sorted === "desc"
													? "descending"
													: "none"
									}
									className={canSort ? styles.dataGrid__sortHead : undefined}
								>
									{canSort ? (
										<Button
											variant="link"
											size="sm"
											iconSize={12}
											label={headerNode}
											iconAfter={
												sorted === "asc"
													? "ChevronUp"
													: sorted === "desc"
														? "ChevronDown"
														: "ChevronsUpDown"
											}
											aria-label={labels?.sortBy?.(headerLabel)}
											htmlButtonProps={{
												onClick: (e) =>
													header.column.getToggleSortingHandler()?.(e),
											}}
										/>
									) : (
										headerNode
									)}
								</DataTable.HeadCell>
							)
						})}
					</DataTable.Head>
					<DataTable.Body>
						{isLoading && rows.length === 0 ? (
							<DataTable.StateRow colSpan={colCount}>
								{loadingLabel}
							</DataTable.StateRow>
						) : rows.length === 0 ? (
							<DataTable.StateRow colSpan={colCount}>
								{emptyLabel}
							</DataTable.StateRow>
						) : (
							rows.map((row) => {
								const interactive = expandable || !!onRowClick
								const activate = () => {
									if (expandable) row.toggleExpanded()
									else onRowClick?.(row.original)
								}
								return (
									<Fragment key={row.id}>
										<DataTable.Row
											interactive={interactive}
											tabIndex={interactive ? 0 : undefined}
											aria-label={rowAriaLabel?.(row.original)}
											aria-expanded={
												expandable ? row.getIsExpanded() : undefined
											}
											onClick={interactive ? activate : undefined}
											onKeyDown={
												interactive
													? (e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault()
																activate()
															}
														}
													: undefined
											}
										>
											{row.getVisibleCells().map((cell) => (
												<DataTable.Cell
													key={cell.id}
													align={cell.column.columnDef.meta?.align}
													width={cell.column.columnDef.meta?.width}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</DataTable.Cell>
											))}
										</DataTable.Row>
										{expandable && row.getIsExpanded() && (
											<tr className={styles.dataGrid__subRow}>
												<td
													colSpan={colCount}
													className={styles.dataGrid__subCell}
												>
													{renderSubRow?.(row.original)}
												</td>
											</tr>
										)}
									</Fragment>
								)
							})
						)}
					</DataTable.Body>
				</DataTable>
			</div>

			{showFooter && (
				<div className={styles.dataGrid__footer}>
					<Pagination
						totalItems={totalItems}
						currentPageIndex={pagination.pageIndex + 1}
						handleSlideTo={(page) => table.setPageIndex(page - 1)}
						pageSize={pagination.pageSize}
						labels={labels?.pagination}
					/>
				</div>
			)}
		</div>
	)
}
