"use client";
/* eslint-disable react-hooks/incompatible-library */

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	type PaginationState,
	type Table as TanstackDataTable,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { Alert, Button, Card, Empty, Space, Tag, Typography } from "antd";
import { AdminComplaintSummary } from "@/actions/admin";
import { useLanguage } from "@/components/provider/language_provider";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
	PENDING: "orange",
	IN_PROGRESS: "blue",
	WORK_IN_PROGRESS: "cyan",
	QUERY_RAISED: "volcano",
	RESOLVED: "green",
	CLOSED: "geekblue",
	REJECTED: "red",
	ESCALATED: "purple",
	AUTO_CLOSED: "default",
};

type TableProps<TData> = {
	table: TanstackDataTable<TData>;
	emptyLabel: string;
};

function TanstackTable<TData>({ table, emptyLabel }: TableProps<TData>) {
	if (table.getRowModel().rows.length === 0) {
		return <Empty description={emptyLabel} />;
	}

	return (
		<div style={{ overflowX: "auto" }}>
			<table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
							{headerGroup.headers.map((header) => {
								const canSort = header.column.getCanSort();
								const sortingState = header.column.getIsSorted();
								const sortingLabel =
									sortingState === "asc" ? " ▲" : sortingState === "desc" ? " ▼" : "";

								return (
									<th
										key={header.id}
										style={{
											textAlign: "left",
											fontSize: 13,
											color: "#4b5563",
											fontWeight: 700,
											padding: "12px 10px",
											whiteSpace: "nowrap",
											cursor: canSort ? "pointer" : "default",
										}}
										onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
									>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
										{sortingLabel}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
							{row.getVisibleCells().map((cell) => (
								<td
									key={cell.id}
									style={{
										padding: "12px 10px",
										fontSize: 13,
										color: "#111827",
										verticalAlign: "top",
									}}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

const complaintColumnHelper = createColumnHelper<AdminComplaintSummary>();

function formatDate(dateValue: string): string {
	return new Date(dateValue).toLocaleDateString("en-IN");
}

type AdminComplaintsClientProps = {
	initialComplaints: AdminComplaintSummary[];
	initialError?: string;
};

export default function AdminComplaintsClient({
	initialComplaints,
	initialError,
}: AdminComplaintsClientProps) {
	const { t } = useLanguage();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const columns = useMemo(
		() => [
			complaintColumnHelper.accessor("id", {
				header: t("admin.table.refNo"),
				cell: (info) => <Text strong>#{info.getValue()}</Text>,
				sortingFn: "basic",
			}),
			complaintColumnHelper.accessor("citizenName", {
				header: t("camp.user.name"),
				sortingFn: "alphanumeric",
			}),
			complaintColumnHelper.accessor("citizenMobile", {
				header: t("camp.user.mobile"),
				sortingFn: "alphanumeric",
			}),
			complaintColumnHelper.accessor("category", {
				header: t("admin.table.category"),
				sortingFn: "alphanumeric",
			}),
			complaintColumnHelper.accessor("subcategory", {
				header: t("newComplaint.subcategory"),
				cell: (info) => info.getValue() || "-",
				sortingFn: "alphanumeric",
			}),
			complaintColumnHelper.accessor("status", {
				header: t("admin.table.status"),
				cell: (info) => (
					<Tag color={STATUS_COLORS[info.getValue()] ?? "default"}>
						{info.getValue().replaceAll("_", " ")}
					</Tag>
				),
				sortingFn: "alphanumeric",
			}),
			complaintColumnHelper.accessor("area", {
				header: t("admin.table.area"),
				cell: (info) => info.getValue() || "-",
				sortingFn: "alphanumeric",
			}),
			complaintColumnHelper.accessor("affectedCitizensCount", {
				header: "Affected Citizens",
				cell: (info) => info.getValue(),
				sortingFn: "basic",
			}),
			complaintColumnHelper.accessor("createdAt", {
				header: t("dashboard.table.filedOn"),
				cell: (info) => formatDate(info.getValue()),
				sortingFn: "datetime",
			}),
			complaintColumnHelper.display({
				id: "actions",
				header: t("admin.table.action"),
				cell: (info) => (
					<Link href={`/mla-pa/complaint/${info.row.original.id}`}>
						{t("admin.table.view")}
					</Link>
				),
			}),
		],
		[t],
	);

	const table = useReactTable({
		data: initialComplaints,
		columns,
		state: {
			sorting,
			pagination,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 20,
					gap: 16,
					flexWrap: "wrap",
				}}
			>
				<div>
					<Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
						{t("admin.title")}
					</Title>
					<Text type="secondary">{t("admin.subtitle")}</Text>
				</div>
			</div>

			{initialError && (
				<Alert type="error" title={initialError} showIcon style={{ marginBottom: 16 }} />
			)}

			<Card>
				<TanstackTable table={table} emptyLabel="No complaints found" />

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 12,
						flexWrap: "wrap",
						marginTop: 16,
					}}
				>
					<Text type="secondary">
						Showing {initialComplaints.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
						-
						{Math.min(
							(pagination.pageIndex + 1) * pagination.pageSize,
							initialComplaints.length,
						)} of {initialComplaints.length} complaints
					</Text>

					<Space wrap>
						<Button
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Text>
							Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
						</Text>
						<Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
							Next
						</Button>
					</Space>
				</div>
			</Card>
		</div>
	);
}
