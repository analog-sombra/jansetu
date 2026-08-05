"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useCallback, useEffect, useMemo, useState } from "react";
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
	Modal,
	Select,
	Space,
	Spin,
	Typography,
	Input as AntInput,
} from "antd";
import { FormProvider, Resolver, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
	AdminDepartmentSummary,
	AdminOfficerDirectorySummary,
	createAdminDepartmentAction,
	updateAdminDepartmentAction,
	deleteAdminDepartmentAction,
	createAdminOfficerAction,
	updateAdminOfficerAction,
	deleteAdminOfficerAction,
	getAdminDepartmentOfficerDirectoryAction,
} from "@/actions/admin";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { CustomMultiSelect } from "@/components/inputfields/multiselect";
import {
	departmentValidationSchema,
	type departmentValidationForm,
} from "@/schema/departmentValidationSchema";
import {
	officerValidationSchema,
	type officerValidationForm,
} from "@/schema/officerValidationSchema";
import { onFormError } from "@/utils/method";

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
											padding: "8px 6px",
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
										padding: "8px 6px",
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
	const [editingDepartment, setEditingDepartment] = useState<AdminDepartmentSummary | null>(null);
	const [editingOfficer, setEditingOfficer] = useState<AdminOfficerDirectorySummary | null>(null);
	const [deletingDepartment, setDeletingDepartment] = useState<AdminDepartmentSummary | null>(null);
	const [deletingOfficer, setDeletingOfficer] = useState<AdminOfficerDirectorySummary | null>(null);

	const departmentMethods = useForm<departmentValidationForm>({
		defaultValues: {
			name: "",
		},
		resolver: valibotResolver(departmentValidationSchema) as Resolver<departmentValidationForm>,
	});

	const officerMethods = useForm<officerValidationForm>({
		defaultValues: {
			name: "",
			designation: "",
			email: "",
			phone: "",
			departmentId: "",
		},
		resolver: valibotResolver(officerValidationSchema) as Resolver<officerValidationForm>,
	});

	const handleEditDepartment = useCallback((department: AdminDepartmentSummary) => {
		setEditingDepartment(department);
		departmentMethods.reset({ name: department.name });
		setDepartmentDrawerOpen(true);
	}, [departmentMethods]);

	const handleEditOfficer = useCallback((officer: AdminOfficerDirectorySummary) => {
		setEditingOfficer(officer);
		officerMethods.reset({
			name: officer.name,
			designation: officer.designation,
			email: officer.email ?? undefined,
			phone: officer.phone,
			departmentId: String(officer.department.id),
		});
		setOfficerDrawerOpen(true);
	}, [officerMethods]);

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
			departmentColumnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (info) => (
					<Space size="small">
						<Button
							size="small"
							type="link"
							onClick={() => handleEditDepartment(info.row.original)}
						>
							Edit
						</Button>
						<Button
							size="small"
							type="link"
							danger
							onClick={() => setDeletingDepartment(info.row.original)}
						>
							Delete
						</Button>
					</Space>
				),
			}),
		],
		[handleEditDepartment],
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
			officerColumnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (info) => (
					<Space size="small">
						<Button
							size="small"
							type="link"
							onClick={() => handleEditOfficer(info.row.original)}
						>
							Edit
						</Button>
						<Button
							size="small"
							type="link"
							danger
							onClick={() => setDeletingOfficer(info.row.original)}
						>
							Delete
						</Button>
					</Space>
				),
			}),
		],
		[handleEditOfficer],
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

			return searchableFields.some((value) => value?.toLowerCase().includes(searchTerm));
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

	async function onCreateDepartment(values: departmentValidationForm) {
		setSubmittingDepartment(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		const result = editingDepartment
			? await updateAdminDepartmentAction({ id: editingDepartment.id, ...values })
			: await createAdminDepartmentAction(values);

		setSubmittingDepartment(false);

		if (!result.ok) {
			setErrorMessage(result.error ?? `Unable to ${editingDepartment ? "update" : "create"} department.`);
			return;
		}

		if (editingDepartment) {
			setDepartments((current) =>
				current.map((dept) => (dept.id === result.department.id ? result.department : dept)),
			);
			setSuccessMessage("Department updated successfully.");
		} else {
			setDepartments((current) => [...current, result.department]);
			setSuccessMessage("Department created successfully.");
		}

		setDepartmentDrawerOpen(false);
		setEditingDepartment(null);
		departmentMethods.reset();
	}

	async function onCreateOfficer(values: officerValidationForm) {
		setSubmittingOfficer(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		const result = editingOfficer
			? await updateAdminOfficerAction({ 
				id: editingOfficer.id, 
				name: values.name,
				designation: values.designation,
				email: values.email || undefined,
				phone: values.phone,
				departmentId: Number(values.departmentId),
			})
			: await createAdminOfficerAction({
				name: values.name,
				designation: values.designation,
				email: values.email || undefined,
				phone: values.phone,
				departmentId: Number(values.departmentId),
			});

		setSubmittingOfficer(false);

		if (!result.ok) {
			setErrorMessage(result.error ?? `Unable to ${editingOfficer ? "update" : "create"} officer.`);
			return;
		}

		if (editingOfficer) {
			setOfficers((current) =>
				current.map((officer) => (officer.id === result.officer.id ? result.officer : officer)),
			);
			setSuccessMessage("Officer updated successfully.");
		} else {
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
		}

		setOfficerDrawerOpen(false);
		setEditingOfficer(null);
		officerMethods.reset();
	}

	async function handleDeleteDepartment() {
		if (!deletingDepartment) return;

		setErrorMessage(null);
		setSuccessMessage(null);

		const result = await deleteAdminDepartmentAction({ id: deletingDepartment.id });

		if (!result.ok) {
			setErrorMessage(result.error ?? "Unable to delete department.");
			setDeletingDepartment(null);
			return;
		}

		setDepartments((current) => current.filter((dept) => dept.id !== deletingDepartment.id));
		setSuccessMessage("Department deleted successfully.");
		setDeletingDepartment(null);
	}

	async function handleDeleteOfficer() {
		if (!deletingOfficer) return;

		setErrorMessage(null);
		setSuccessMessage(null);

		const result = await deleteAdminOfficerAction({ id: deletingOfficer.id });

		if (!result.ok) {
			setErrorMessage(result.error ?? "Unable to delete officer.");
			setDeletingOfficer(null);
			return;
		}

		setOfficers((current) => current.filter((officer) => officer.id !== deletingOfficer.id));
		setDepartments((current) =>
			current.map((department) => {
				if (department.id !== deletingOfficer.department.id) {
					return department;
				}
				return {
					...department,
					officersCount: department.officersCount - 1,
				};
			}),
		);
		setSuccessMessage("Officer deleted successfully.");
		setDeletingOfficer(null);
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
					title={errorMessage}
					style={{ marginBottom: 16 }}
					closable
					onClose={() => setErrorMessage(null)}
				/>
			)}

			{successMessage && (
				<Alert
					type="success"
					showIcon
					title={successMessage}
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
					<AntInput
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
			title={editingDepartment ? "Edit Department" : "Create Department"}
			open={isDepartmentDrawerOpen}
			onClose={() => {
				setDepartmentDrawerOpen(false);
				setEditingDepartment(null);
				departmentMethods.reset();
			}}
			size={420}
			destroyOnHidden
		>
			<FormProvider {...departmentMethods}>
				<form onSubmit={departmentMethods.handleSubmit(onCreateDepartment, onFormError)}>
					<div className="mb-4">
						<CustomTextInput<departmentValidationForm>
							name="name"
							title="Department Name"
							placeholder="Enter department name"
							required
							maxlength={80}
						/>
					</div>

					<Button
						type="primary"
						htmlType="submit"
						loading={submittingDepartment}
						block
					>
						{editingDepartment ? "Update Department" : "Create Department"}
					</Button>
				</form>
			</FormProvider>
		</Drawer>

		<Drawer
				title={editingOfficer ? "Edit Officer" : "Create Officer"}
				open={isOfficerDrawerOpen}
				onClose={() => {
					setOfficerDrawerOpen(false);
					setEditingOfficer(null);
				officerMethods.reset();
			}}
			size={460}
			destroyOnHidden
		>
			<FormProvider {...officerMethods}>
				<form onSubmit={officerMethods.handleSubmit(onCreateOfficer, onFormError)}>
					<div className="mb-4">
						<CustomTextInput<officerValidationForm>
							name="name"
							title="Officer Name"
							placeholder="Enter officer name"
							required
							maxlength={80}
						/>
					</div>

					<div className="mb-4">
						<CustomTextInput<officerValidationForm>
							name="designation"
							title="Designation"
							placeholder="Enter designation"
							required
							maxlength={80}
						/>
					</div>

					<div className="mb-4">
						<CustomTextInput<officerValidationForm>
							name="email"
							title="Email"
							placeholder="officer@example.com"
						maxlength={120}
					/>
				</div>

				<div className="mb-4">
					<CustomTextInput<officerValidationForm>
						name="phone"
						title="Phone"
						placeholder="Enter phone number"
						required
						maxlength={20}
					/>
				</div>

				<div className="mb-4">
					<CustomMultiSelect<officerValidationForm>
						name="departmentId"
						title="Department"
						placeholder="Select department"
						required
						options={departments.map((department) => ({
							label: department.name,
							value: String(department.id),
						}))}
					/>
				</div>

					<Button
						type="primary"
						htmlType="submit"
						loading={submittingOfficer}
						block
					>
						{editingOfficer ? "Update Officer" : "Create Officer"}
					</Button>
				</form>
			</FormProvider>
		</Drawer>

		<Modal
			title="Delete Department"
			open={!!deletingDepartment}
			onOk={handleDeleteDepartment}
			onCancel={() => setDeletingDepartment(null)}
			okText="Delete"
			okType="danger"
			cancelText="Cancel"
		>
			<p>
				Are you sure you want to delete the department <strong>{deletingDepartment?.name}</strong>?
			</p>
			<p style={{ color: "#ff4d4f", marginBottom: 0 }}>This action cannot be undone.</p>
		</Modal>

			<Modal
				title="Delete Officer"
				open={!!deletingOfficer}
				onOk={handleDeleteOfficer}
				onCancel={() => setDeletingOfficer(null)}
				okText="Delete"
				okType="danger"
				cancelText="Cancel"
			>
				<p>
					Are you sure you want to delete the officer <strong>{deletingOfficer?.name}</strong>?
				</p>
				<p style={{ color: "#ff4d4f", marginBottom: 0 }}>This action cannot be undone.</p>
			</Modal>
		</div>
	);
}
