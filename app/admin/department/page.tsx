"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useMemo, useState } from "react";
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
import {
	Alert,
	Button,
	Card,
	Drawer,
	Empty,
	Form,
	Input,
	Select,
	Space,
	Spin,
	Typography,
} from "antd";
import {
	AdminDepartmentSummary,
	AdminOfficerDirectorySummary,
	createAdminDepartmentAction,
	createAdminOfficerAction,
	getAdminDepartmentOfficerDirectoryAction,
} from "@/actions/admin";

const { Title, Text } = Typography;

const departmentColumnHelper = createColumnHelper<AdminDepartmentSummary>();
const officerColumnHelper = createColumnHelper<AdminOfficerDirectorySummary>();

function formatDate(dateValue: string): string {
	return new Date(dateValue).toLocaleDateString("en-IN");
}

type TableProps<TData> = {
	table: TanstackDataTable<TData>;
	loading: boolean;
	emptyLabel: string;
};

function TanstackTable<TData>({ table, loading, emptyLabel }: TableProps<TData>) {
	if (loading) {
		return (
			<div style={{ display: "flex", justifyContent: "center", padding: 28 }}>
				<Spin size="large" />
			</div>
		);
	}

	if (table.getRowModel().rows.length === 0) {
		return <Empty description={emptyLabel} />;
	}

	return (
		<div style={{ overflowX: "auto" }}>
			<table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
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

export default function AdminDepartmentPage() {
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [departments, setDepartments] = useState<AdminDepartmentSummary[]>([]);
	const [officers, setOfficers] = useState<AdminOfficerDirectorySummary[]>([]);

	const [departmentSorting, setDepartmentSorting] = useState<SortingState>([]);
	const [officerSorting, setOfficerSorting] = useState<SortingState>([]);
	const [officerSearch, setOfficerSearch] = useState("");
	const [officerDepartmentFilter, setOfficerDepartmentFilter] = useState<number | undefined>();
	const [officerPagination, setOfficerPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const [isDepartmentDrawerOpen, setDepartmentDrawerOpen] = useState(false);
	const [isOfficerDrawerOpen, setOfficerDrawerOpen] = useState(false);
	const [submittingDepartment, setSubmittingDepartment] = useState(false);
	const [submittingOfficer, setSubmittingOfficer] = useState(false);

	const [departmentForm] = Form.useForm<{ name: string }>();
	const [officerForm] = Form.useForm<{
		name: string;
		designation: string;
		email: string;
		phone: string;
		departmentId: number;
	}>();

	const departmentColumns = useMemo(
		() => [
			departmentColumnHelper.accessor("id", {
				header: "ID",
				cell: (info) => `#${info.getValue()}`,
				sortingFn: "basic",
			}),
			departmentColumnHelper.accessor("name", {
				header: "Department",
				sortingFn: "alphanumeric",
			}),
			departmentColumnHelper.accessor("officersCount", {
				header: "Officers",
				sortingFn: "basic",
			}),
			departmentColumnHelper.accessor("createdAt", {
				header: "Created",
				cell: (info) => formatDate(info.getValue()),
				sortingFn: "datetime",
			}),
		],
		[],
	);

	const officerColumns = useMemo(
		() => [
			officerColumnHelper.accessor("id", {
				header: "ID",
				cell: (info) => `#${info.getValue()}`,
				sortingFn: "basic",
			}),
			officerColumnHelper.accessor("name", {
				header: "Officer",
				sortingFn: "alphanumeric",
			}),
			officerColumnHelper.accessor("designation", {
				header: "Designation",
				sortingFn: "alphanumeric",
			}),
			officerColumnHelper.accessor("email", {
				header: "Email",
				sortingFn: "alphanumeric",
			}),
			officerColumnHelper.accessor("phone", {
				header: "Phone",
			}),
			officerColumnHelper.accessor((row) => row.department.name, {
				id: "department",
				header: "Department",
				sortingFn: "alphanumeric",
			}),
			officerColumnHelper.accessor("createdAt", {
				header: "Created",
				cell: (info) => formatDate(info.getValue()),
				sortingFn: "datetime",
			}),
		],
		[],
	);

	const filteredOfficers = useMemo(() => {
		const searchTerm = officerSearch.trim().toLowerCase();

		return officers.filter((officer) => {
			const matchesDepartment =
				officerDepartmentFilter === undefined ||
				officer.department.id === officerDepartmentFilter;

			if (!matchesDepartment) {
				return false;
			}

			if (!searchTerm) {
				return true;
			}

			const searchableFields = [
				officer.name,
				officer.designation,
				officer.email,
				officer.phone,
				officer.department.name,
			];

			return searchableFields.some((value) => value.toLowerCase().includes(searchTerm));
		});
	}, [officerDepartmentFilter, officerSearch, officers]);

	const departmentTable = useReactTable({
		data: departments,
		columns: departmentColumns,
		state: { sorting: departmentSorting },
		onSortingChange: setDepartmentSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const officerTable = useReactTable({
		data: filteredOfficers,
		columns: officerColumns,
		state: {
			sorting: officerSorting,
			pagination: officerPagination,
		},
		onSortingChange: setOfficerSorting,
		onPaginationChange: setOfficerPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	useEffect(() => {
		setOfficerPagination((current) => ({
			...current,
			pageIndex: 0,
		}));
	}, [officerDepartmentFilter, officerSearch]);

	useEffect(() => {
		let disposed = false;

		async function loadData() {
			const result = await getAdminDepartmentOfficerDirectoryAction();

			if (disposed) {
				return;
			}

			if (!result.ok) {
				setErrorMessage(result.error ?? "Unable to load directory data.");
				setLoading(false);
				return;
			}

			setDepartments(result.departments);
			setOfficers(result.officers);
			setErrorMessage(null);
			setLoading(false);
		}

		void loadData();

		return () => {
			disposed = true;
		};
	}, []);

	async function onCreateDepartment(values: { name: string }) {
		setSubmittingDepartment(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		const result = await createAdminDepartmentAction(values);

		setSubmittingDepartment(false);

		if (!result.ok) {
			setErrorMessage(result.error ?? "Unable to create department.");
			return;
		}

		setDepartments((current) => [...current, result.department]);
		setSuccessMessage("Department created successfully.");
		setDepartmentDrawerOpen(false);
		departmentForm.resetFields();
	}

	async function onCreateOfficer(values: {
		name: string;
		designation: string;
		email: string;
		phone: string;
		departmentId: number;
	}) {
		setSubmittingOfficer(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		const result = await createAdminOfficerAction(values);

		setSubmittingOfficer(false);

		if (!result.ok) {
			setErrorMessage(result.error ?? "Unable to create officer.");
			return;
		}

		setOfficers((current) => [...current, result.officer]);
		setDepartments((current) =>
			current.map((department) => {
				if (department.id !== result.officer.department.id) {
					return department;
				}

				return {
					...department,
					officersCount: department.officersCount + 1,
				};
			}),
		);

		setSuccessMessage("Officer created successfully.");
		setOfficerDrawerOpen(false);
		officerForm.resetFields();
	}

	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 16,
					flexWrap: "wrap",
					marginBottom: 20,
				}}
			>
				<div>
					<Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
						Department & Officer Directory
					</Title>
					<Text type="secondary">
						Manage departments and officers from one screen.
					</Text>
				</div>

				<Space>
					<Button type="primary" onClick={() => setDepartmentDrawerOpen(true)}>
						Create Department
					</Button>
					<Button onClick={() => setOfficerDrawerOpen(true)}>Create Officer</Button>
				</Space>
			</div>

			{errorMessage && (
				<Alert
					type="error"
					showIcon
					message={errorMessage}
					style={{ marginBottom: 16 }}
					closable
					onClose={() => setErrorMessage(null)}
				/>
			)}

			{successMessage && (
				<Alert
					type="success"
					showIcon
					message={successMessage}
					style={{ marginBottom: 16 }}
					closable
					onClose={() => setSuccessMessage(null)}
				/>
			)}

			<Card title="Departments" style={{ marginBottom: 16 }}>
				<TanstackTable
					table={departmentTable}
					loading={loading}
					emptyLabel="No departments found"
				/>
			</Card>

			<Card title="Officers">
				<div
					style={{
						display: "flex",
						gap: 12,
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<Input
						placeholder="Search officers by name, email, phone, designation"
						value={officerSearch}
						onChange={(event) => setOfficerSearch(event.target.value)}
						allowClear
						style={{ flex: "1 1 320px" }}
					/>
					<Select
						placeholder="Filter by department"
						allowClear
						value={officerDepartmentFilter}
						onChange={(value) => setOfficerDepartmentFilter(value)}
						options={departments.map((department) => ({
							label: department.name,
							value: department.id,
						}))}
						style={{ minWidth: 220 }}
					/>
				</div>

				<TanstackTable
					table={officerTable}
					loading={loading}
					emptyLabel="No officers found"
				/>

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
						Showing {filteredOfficers.length === 0 ? 0 : officerPagination.pageIndex * officerPagination.pageSize + 1}
						-
						{Math.min(
							(officerPagination.pageIndex + 1) * officerPagination.pageSize,
							filteredOfficers.length,
						)} of {filteredOfficers.length} officers
					</Text>

					<Space wrap>
						<Select
							value={officerPagination.pageSize}
							onChange={(value) =>
								setOfficerPagination({
									pageIndex: 0,
									pageSize: value,
								})
							}
							options={[
								{ label: "10 / page", value: 10 },
								{ label: "20 / page", value: 20 },
								{ label: "50 / page", value: 50 },
							]}
							style={{ width: 120 }}
						/>
						<Button
							onClick={() => officerTable.previousPage()}
							disabled={!officerTable.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Text>
							Page {officerTable.getState().pagination.pageIndex + 1} of {Math.max(officerTable.getPageCount(), 1)}
						</Text>
						<Button onClick={() => officerTable.nextPage()} disabled={!officerTable.getCanNextPage()}>
							Next
						</Button>
					</Space>
				</div>
			</Card>

			<Drawer
				title="Create Department"
				open={isDepartmentDrawerOpen}
				onClose={() => setDepartmentDrawerOpen(false)}
				size={420}
				destroyOnHidden
			>
				<Form form={departmentForm} layout="vertical" onFinish={onCreateDepartment}>
					<Form.Item
						label="Department Name"
						name="name"
						rules={[
							{ required: true, message: "Please enter department name." },
							{ min: 2, message: "Department name must be at least 2 characters." },
						]}
					>
						<Input placeholder="Enter department name" maxLength={80} />
					</Form.Item>

					<Button type="primary" htmlType="submit" loading={submittingDepartment} block>
						Create Department
					</Button>
				</Form>
			</Drawer>

			<Drawer
				title="Create Officer"
				open={isOfficerDrawerOpen}
				onClose={() => setOfficerDrawerOpen(false)}
				size={460}
				destroyOnHidden
			>
				<Form form={officerForm} layout="vertical" onFinish={onCreateOfficer}>
					<Form.Item
						label="Officer Name"
						name="name"
						rules={[
							{ required: true, message: "Please enter officer name." },
							{ min: 2, message: "Officer name must be at least 2 characters." },
						]}
					>
						<Input placeholder="Enter officer name" maxLength={80} />
					</Form.Item>

					<Form.Item
						label="Designation"
						name="designation"
						rules={[
							{ required: true, message: "Please enter designation." },
							{ min: 2, message: "Designation must be at least 2 characters." },
						]}
					>
						<Input placeholder="Enter designation" maxLength={80} />
					</Form.Item>

					<Form.Item
						label="Email"
						name="email"
						rules={[
							{ required: true, message: "Please enter email." },
							{ type: "email", message: "Please enter a valid email." },
						]}
					>
						<Input placeholder="officer@example.com" maxLength={120} />
					</Form.Item>

					<Form.Item
						label="Phone"
						name="phone"
						rules={[
							{ required: true, message: "Please enter phone." },
							{ min: 8, message: "Phone must be at least 8 characters." },
						]}
					>
						<Input placeholder="Enter phone number" maxLength={20} />
					</Form.Item>

					<Form.Item
						label="Department"
						name="departmentId"
						rules={[{ required: true, message: "Please select department." }]}
					>
						<Select
							placeholder="Select department"
							options={departments.map((department) => ({
								label: department.name,
								value: department.id,
							}))}
						/>
					</Form.Item>

					<Button type="primary" htmlType="submit" loading={submittingOfficer} block>
						Create Officer
					</Button>
				</Form>
			</Drawer>
		</div>
	);
}
