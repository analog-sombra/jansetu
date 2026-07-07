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
	AdminCategorySummary,
	AdminDepartmentSummary,
	AdminSubcategoryDirectorySummary,
	createAdminCategoryAction,
	createAdminSubcategoryAction,
	deleteAdminCategoryAction,
	deleteAdminSubcategoryAction,
	getAdminCategorySubcategoryDirectoryAction,
	getAdminDepartmentOfficerDirectoryAction,
	updateAdminCategoryAction,
	updateAdminSubcategoryAction,
} from "@/actions/admin";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { CustomMultiSelect } from "@/components/inputfields/multiselect";
import {
	categoryValidationSchema,
	type categoryValidationForm,
} from "@/schema/categoryValidationSchema";
import {
	subcategoryValidationSchema,
	type subcategoryValidationForm,
} from "@/schema/subcategoryValidationSchema";
import { onFormError } from "@/utils/method";

const { Title, Text } = Typography;

const categoryColumnHelper = createColumnHelper<AdminCategorySummary>();
const subcategoryColumnHelper = createColumnHelper<AdminSubcategoryDirectorySummary>();

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

export default function AdminCategoryPage() {
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [categories, setCategories] = useState<AdminCategorySummary[]>([]);
	const [departments, setDepartments] = useState<AdminDepartmentSummary[]>([]);
	const [subcategories, setSubcategories] = useState<AdminSubcategoryDirectorySummary[]>([]);

	const [categorySorting, setCategorySorting] = useState<SortingState>([]);
	const [subcategorySorting, setSubcategorySorting] = useState<SortingState>([]);
	const [subcategorySearch, setSubcategorySearch] = useState("");
	const [subcategoryCategoryFilter, setSubcategoryCategoryFilter] = useState<number | undefined>();
	const [subcategoryPagination, setSubcategoryPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const [isCategoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
	const [isSubcategoryDrawerOpen, setSubcategoryDrawerOpen] = useState(false);
	const [submittingCategory, setSubmittingCategory] = useState(false);
	const [submittingSubcategory, setSubmittingSubcategory] = useState(false);
	const [editingCategory, setEditingCategory] = useState<AdminCategorySummary | null>(null);
	const [editingSubcategory, setEditingSubcategory] = useState<AdminSubcategoryDirectorySummary | null>(null);
	const [deletingCategory, setDeletingCategory] = useState<AdminCategorySummary | null>(null);
	const [deletingSubcategory, setDeletingSubcategory] = useState<AdminSubcategoryDirectorySummary | null>(null);

	const categoryMethods = useForm<categoryValidationForm>({
		defaultValues: {
			name: "",
			departmentId: "",
		},
		resolver: valibotResolver(categoryValidationSchema) as Resolver<categoryValidationForm>,
	});

	const subcategoryMethods = useForm<subcategoryValidationForm>({
		defaultValues: {
			name: "",
			categoryId: "",
		},
		resolver: valibotResolver(subcategoryValidationSchema) as Resolver<subcategoryValidationForm>,
	});

	const handleEditCategory = useCallback((category: AdminCategorySummary) => {
		setEditingCategory(category);
		categoryMethods.reset({
			name: category.name,
			departmentId: String(category.department.id),
		});
		setCategoryDrawerOpen(true);
	}, [categoryMethods]);

	const handleEditSubcategory = useCallback((subcategory: AdminSubcategoryDirectorySummary) => {
		setEditingSubcategory(subcategory);
		subcategoryMethods.reset({
			name: subcategory.name,
			categoryId: String(subcategory.category.id),
		});
		setSubcategoryDrawerOpen(true);
	}, [subcategoryMethods]);

	const categoryColumns = useMemo(
		() => [
			categoryColumnHelper.accessor("id", {
				header: "ID",
				cell: (info) => `#${info.getValue()}`,
				sortingFn: "basic",
			}),
			categoryColumnHelper.accessor("name", {
				header: "Category",
				sortingFn: "alphanumeric",
			}),
			categoryColumnHelper.accessor("subcategoriesCount", {
				header: "Subcategories",
				sortingFn: "basic",
			}),
			categoryColumnHelper.accessor("createdAt", {
				header: "Created",
				cell: (info) => formatDate(info.getValue()),
				sortingFn: "datetime",
			}),
			categoryColumnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (info) => (
					<Space size="small">
						<Button
							size="small"
							type="link"
							onClick={() => handleEditCategory(info.row.original)}
						>
							Edit
						</Button>
						<Button
							size="small"
							type="link"
							danger
							onClick={() => setDeletingCategory(info.row.original)}
						>
							Delete
						</Button>
					</Space>
				),
			}),
		],
		[handleEditCategory],
	);

	const subcategoryColumns = useMemo(
		() => [
			subcategoryColumnHelper.accessor("id", {
				header: "ID",
				cell: (info) => `#${info.getValue()}`,
				sortingFn: "basic",
			}),
			subcategoryColumnHelper.accessor("name", {
				header: "Subcategory",
				sortingFn: "alphanumeric",
			}),
			subcategoryColumnHelper.accessor((row) => row.category.name, {
				id: "category",
				header: "Category",
				sortingFn: "alphanumeric",
			}),
			subcategoryColumnHelper.accessor("createdAt", {
				header: "Created",
				cell: (info) => formatDate(info.getValue()),
				sortingFn: "datetime",
			}),
			subcategoryColumnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (info) => (
					<Space size="small">
						<Button
							size="small"
							type="link"
							onClick={() => handleEditSubcategory(info.row.original)}
						>
							Edit
						</Button>
						<Button
							size="small"
							type="link"
							danger
							onClick={() => setDeletingSubcategory(info.row.original)}
						>
							Delete
						</Button>
					</Space>
				),
			}),
		],
		[handleEditSubcategory],
	);

	const filteredSubcategories = useMemo(() => {
		const searchTerm = subcategorySearch.trim().toLowerCase();

		return subcategories.filter((subcategory) => {
			const matchesCategory =
				subcategoryCategoryFilter === undefined ||
				subcategory.category.id === subcategoryCategoryFilter;

			if (!matchesCategory) {
				return false;
			}

			if (!searchTerm) {
				return true;
			}

			const searchableFields = [
				subcategory.name,
				subcategory.category.name,
			];

			return searchableFields.some((value) => value.toLowerCase().includes(searchTerm));
		});
	}, [subcategoryCategoryFilter, subcategorySearch, subcategories]);

	const categoryTable = useReactTable({
		data: categories,
		columns: categoryColumns,
		state: { sorting: categorySorting },
		onSortingChange: setCategorySorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const subcategoryTable = useReactTable({
		data: filteredSubcategories,
		columns: subcategoryColumns,
		state: {
			sorting: subcategorySorting,
			pagination: subcategoryPagination,
		},
		onSortingChange: setSubcategorySorting,
		onPaginationChange: setSubcategoryPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	useEffect(() => {
		setSubcategoryPagination((current) => ({
			...current,
			pageIndex: 0,
		}));
	}, [subcategoryCategoryFilter, subcategorySearch]);

	useEffect(() => {
		let disposed = false;

		async function loadData() {
			const [categoryResult, departmentResult] = await Promise.all([
				getAdminCategorySubcategoryDirectoryAction(),
				getAdminDepartmentOfficerDirectoryAction(),
			]);

			if (disposed) {
				return;
			}

			if (!categoryResult.ok) {
				setErrorMessage(categoryResult.error ?? "Unable to load directory data.");
				setLoading(false);
				return;
			}

			if (!departmentResult.ok) {
				setErrorMessage(departmentResult.error ?? "Unable to load departments.");
				setLoading(false);
				return;
			}

			setCategories(categoryResult.categories);
			setSubcategories(categoryResult.subcategories);
			setDepartments(departmentResult.departments);
			setErrorMessage(null);
			setLoading(false);
		}

		void loadData();

		return () => {
			disposed = true;
		};
	}, []);

	async function onSubmitCategory(values: categoryValidationForm) {
		setSubmittingCategory(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		const result = editingCategory
			? await updateAdminCategoryAction({
				id: editingCategory.id,
				name: values.name,
				departmentId: Number(values.departmentId),
			})
			: await createAdminCategoryAction({
				name: values.name,
				departmentId: Number(values.departmentId),
			});

		setSubmittingCategory(false);

		if (!result.ok) {
			setErrorMessage(result.error ?? `Unable to ${editingCategory ? "update" : "create"} category.`);
			return;
		}

		if (editingCategory) {
			setCategories((current) =>
				current.map((cat) => (cat.id === result.category.id ? result.category : cat)),
			);
			setSuccessMessage("Category updated successfully.");
		} else {
			setCategories((current) => [...current, result.category]);
			setSuccessMessage("Category created successfully.");
		}

		setCategoryDrawerOpen(false);
		setEditingCategory(null);
		categoryMethods.reset();
	}

	async function onSubmitSubcategory(values: subcategoryValidationForm) {
		setSubmittingSubcategory(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		const result = editingSubcategory
			? await updateAdminSubcategoryAction({
				id: editingSubcategory.id,
				name: values.name,
				categoryId: Number(values.categoryId),
			})
			: await createAdminSubcategoryAction({
				name: values.name,
				categoryId: Number(values.categoryId),
			});

		setSubmittingSubcategory(false);

		if (!result.ok) {
			setErrorMessage(result.error ?? `Unable to ${editingSubcategory ? "update" : "create"} subcategory.`);
			return;
		}

		if (editingSubcategory) {
			const oldCategoryId = editingSubcategory.category.id;
			const newCategoryId = result.subcategory.category.id;

			setSubcategories((current) =>
				current.map((sub) => (sub.id === result.subcategory.id ? result.subcategory : sub)),
			);

			if (oldCategoryId !== newCategoryId) {
				setCategories((current) =>
					current.map((category) => {
						if (category.id === oldCategoryId) {
							return { ...category, subcategoriesCount: category.subcategoriesCount - 1 };
						}
						if (category.id === newCategoryId) {
							return { ...category, subcategoriesCount: category.subcategoriesCount + 1 };
						}
						return category;
					}),
				);
			}

			setSuccessMessage("Subcategory updated successfully.");
		} else {
			setSubcategories((current) => [...current, result.subcategory]);
			setCategories((current) =>
				current.map((category) => {
					if (category.id !== result.subcategory.category.id) {
						return category;
					}

					return {
						...category,
						subcategoriesCount: category.subcategoriesCount + 1,
					};
				}),
			);
			setSuccessMessage("Subcategory created successfully.");
		}

		setSubcategoryDrawerOpen(false);
		setEditingSubcategory(null);
		subcategoryMethods.reset();
	}

	async function handleDeleteCategory() {
		if (!deletingCategory) return;

		setErrorMessage(null);
		setSuccessMessage(null);

		const result = await deleteAdminCategoryAction({ id: deletingCategory.id });

		if (!result.ok) {
			setErrorMessage(result.error ?? "Unable to delete category.");
			setDeletingCategory(null);
			return;
		}

		setCategories((current) => current.filter((cat) => cat.id !== deletingCategory.id));
		setSubcategories((current) => current.filter((sub) => sub.category.id !== deletingCategory.id));
		setSuccessMessage("Category deleted successfully.");
		setDeletingCategory(null);
	}

	async function handleDeleteSubcategory() {
		if (!deletingSubcategory) return;

		setErrorMessage(null);
		setSuccessMessage(null);

		const result = await deleteAdminSubcategoryAction({ id: deletingSubcategory.id });

		if (!result.ok) {
			setErrorMessage(result.error ?? "Unable to delete subcategory.");
			setDeletingSubcategory(null);
			return;
		}

		setSubcategories((current) => current.filter((sub) => sub.id !== deletingSubcategory.id));
		setCategories((current) =>
			current.map((category) => {
				if (category.id !== deletingSubcategory.category.id) {
					return category;
				}
				return {
					...category,
					subcategoriesCount: category.subcategoriesCount - 1,
				};
			}),
		);
		setSuccessMessage("Subcategory deleted successfully.");
		setDeletingSubcategory(null);
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
						Category & Subcategory Directory
					</Title>
					<Text type="secondary">
						Manage categories and subcategories from one screen.
					</Text>
				</div>

				<Space>
					<Button type="primary" onClick={() => setCategoryDrawerOpen(true)}>
						Create Category
					</Button>
					<Button onClick={() => setSubcategoryDrawerOpen(true)}>Create Subcategory</Button>
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

			<Card title="Categories" style={{ marginBottom: 16 }}>
				<TanstackTable
					table={categoryTable}
					loading={loading}
					emptyLabel="No categories found"
				/>
			</Card>

			<Card title="Subcategories">
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
						placeholder="Search subcategories by name or category"
						value={subcategorySearch}
						onChange={(event) => setSubcategorySearch(event.target.value)}
						allowClear
						style={{ flex: "1 1 320px" }}
					/>
					<Select
						placeholder="Filter by category"
						allowClear
						value={subcategoryCategoryFilter}
						onChange={(value) => setSubcategoryCategoryFilter(value)}
						options={categories.map((category) => ({
							label: category.name,
							value: category.id,
						}))}
						style={{ minWidth: 220 }}
					/>
				</div>

				<TanstackTable
					table={subcategoryTable}
					loading={loading}
					emptyLabel="No subcategories found"
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
						Showing {filteredSubcategories.length === 0 ? 0 : subcategoryPagination.pageIndex * subcategoryPagination.pageSize + 1}
						-
						{Math.min(
							(subcategoryPagination.pageIndex + 1) * subcategoryPagination.pageSize,
							filteredSubcategories.length,
						)} of {filteredSubcategories.length} subcategories
					</Text>

					<Space wrap>
						<Select
							value={subcategoryPagination.pageSize}
							onChange={(value) =>
								setSubcategoryPagination({
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
							onClick={() => subcategoryTable.previousPage()}
							disabled={!subcategoryTable.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Text>
							Page {subcategoryTable.getState().pagination.pageIndex + 1} of {Math.max(subcategoryTable.getPageCount(), 1)}
						</Text>
						<Button onClick={() => subcategoryTable.nextPage()} disabled={!subcategoryTable.getCanNextPage()}>
							Next
						</Button>
					</Space>
				</div>
			</Card>

			<Drawer
				title={editingCategory ? "Edit Category" : "Create Category"}
				open={isCategoryDrawerOpen}
				onClose={() => {
					setCategoryDrawerOpen(false);
					setEditingCategory(null);
				categoryMethods.reset();
			}}
			size={420}
			destroyOnClose
		>
			<FormProvider {...categoryMethods}>
				<form onSubmit={categoryMethods.handleSubmit(onSubmitCategory, onFormError)}>
					<div className="mb-4">
						<CustomTextInput<categoryValidationForm>
							name="name"
							title="Category Name"
							placeholder="Enter category name"
							required
							maxlength={80}
						/>
					</div>

					<div className="mb-4">
						<CustomMultiSelect<categoryValidationForm>
							name="departmentId"
							title="Department"
							placeholder="Select department"
							required
							options={departments.map((dept) => ({
								label: dept.name,
								value: String(dept.id),
							}))}
						/>
					</div>

					<Button
						type="primary"
						htmlType="submit"
						loading={submittingCategory}
						block
					>
						{editingCategory ? "Update Category" : "Create Category"}
					</Button>
				</form>
			</FormProvider>
		</Drawer>

		<Drawer
			title={editingSubcategory ? "Edit Subcategory" : "Create Subcategory"}
			open={isSubcategoryDrawerOpen}
			onClose={() => {
				setSubcategoryDrawerOpen(false);
				setEditingSubcategory(null);
				subcategoryMethods.reset();
			}}
			size={460}
			destroyOnClose
		>
			<FormProvider {...subcategoryMethods}>
				<form onSubmit={subcategoryMethods.handleSubmit(onSubmitSubcategory, onFormError)}>
					<div className="mb-4">
						<CustomTextInput<subcategoryValidationForm>
							name="name"
							title="Subcategory Name"
							placeholder="Enter subcategory name"
							required
							maxlength={80}
						/>
					</div>

					<div className="mb-4">
						<CustomMultiSelect<subcategoryValidationForm>
							name="categoryId"
							title="Category"
							placeholder="Select category"
							required
							options={categories.map((category) => ({
								label: category.name,
								value: String(category.id),
							}))}
						/>
					</div>

					<Button
						type="primary"
						htmlType="submit"
						loading={submittingSubcategory}
						block
					>
						{editingSubcategory ? "Update Subcategory" : "Create Subcategory"}
					</Button>
				</form>
			</FormProvider>
		</Drawer>

			<Modal
				title="Delete Category"
				open={!!deletingCategory}
				onOk={handleDeleteCategory}
				onCancel={() => setDeletingCategory(null)}
				okText="Delete"
				okButtonProps={{ danger: true }}
			>
				<p>
					Are you sure you want to delete the category <strong>{deletingCategory?.name}</strong>?
					This will also delete all its subcategories.
				</p>
			</Modal>

			<Modal
				title="Delete Subcategory"
				open={!!deletingSubcategory}
				onOk={handleDeleteSubcategory}
				onCancel={() => setDeletingSubcategory(null)}
				okText="Delete"
				okButtonProps={{ danger: true }}
			>
				<p>
					Are you sure you want to delete the subcategory <strong>{deletingSubcategory?.name}</strong>?
				</p>
			</Modal>
		</div>
	);
}
