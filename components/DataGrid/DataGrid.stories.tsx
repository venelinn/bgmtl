import type { Meta, StoryObj } from "@storybook/nextjs"
import type { ColumnDef } from "@tanstack/react-table"
import { DataGrid } from "./DataGrid"

interface DemoRow {
	id: string
	name: string
	city: string
	amount: number
	status: "paid" | "failed" | "refunded"
}

const rows: DemoRow[] = Array.from({ length: 42 }, (_, i) => ({
	id: `row-${i + 1}`,
	name: `Boat ${i + 1}`,
	city: ["Miami", "San Diego", "Newport", "Seattle"][i % 4],
	amount: 100 + ((i * 37) % 900),
	status: (["paid", "failed", "refunded"] as const)[i % 3],
}))

const columns: ColumnDef<DemoRow>[] = [
	{ accessorKey: "name", header: "Boat" },
	{ accessorKey: "city", header: "Location" },
	{
		accessorKey: "amount",
		header: "Amount",
		meta: { align: "right" },
		cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`,
	},
	{ accessorKey: "status", header: "Status", enableSorting: false },
]

const meta = {
	title: "Components/DataGrid",
	component: DataGrid<DemoRow>,
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component:
					"Column-driven table on @tanstack/react-table, rendered through the shared DataTable primitives + Pagination footer. Client-side sorting/paging by default; pass `manual` + controlled `sorting`/`pagination` for server-side paging and SSR.",
			},
		},
	},
} satisfies Meta<typeof DataGrid<DemoRow>>

export default meta

type Story = StoryObj<typeof meta>

export const ClientPaginated: Story = {
	args: {
		data: rows,
		columns,
		pageSize: 10,
		getRowId: (row) => row.id,
		emptyLabel: "No rows",
	},
}

export const Expandable: Story = {
	args: {
		data: rows,
		columns,
		pageSize: 10,
		getRowId: (row) => row.id,
		rowAriaLabel: (row) => `Toggle details for ${row.name}`,
		renderSubRow: (row) => (
			<p>{`${row.name} — ${row.city}, $${row.amount.toFixed(2)} (${row.status})`}</p>
		),
	},
}

export const RowClick: Story = {
	args: {
		data: rows,
		columns,
		pageSize: 10,
		getRowId: (row) => row.id,
		onRowClick: (row) => alert(`Clicked ${row.name}`),
		rowAriaLabel: (row) => `View ${row.name}`,
	},
}

export const Empty: Story = {
	args: {
		data: [],
		columns,
		emptyLabel: "No transactions yet",
	},
}

export const Loading: Story = {
	args: {
		data: [],
		columns,
		isLoading: true,
		loadingLabel: "Loading…",
	},
}
