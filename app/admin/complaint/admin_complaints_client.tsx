"use client";

import Link from "next/link";
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
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
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
      <table
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortingState = header.column.getIsSorted();
                const sortingLabel =
                  sortingState === "asc"
                    ? " ▲"
                    : sortingState === "desc"
                      ? " ▼"
                      : "";

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
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [localityFilter, setLocalityFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{
    status?: string;
    category?: string;
    locality?: string;
  }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const statusOptions = useMemo(
    () => Array.from(new Set(initialComplaints.map((complaint) => complaint.status))),
    [initialComplaints],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(initialComplaints.map((complaint) => complaint.category))),
    [initialComplaints],
  );

  function applyFilters() {
    setAppliedFilter({
      status: statusFilter,
      category: categoryFilter,
      locality: localityFilter.trim() || undefined,
    });
  }

  const filteredComplaints = useMemo(() => {
    return initialComplaints.filter((complaint) => {
      if (appliedFilter.status && complaint.status !== appliedFilter.status) {
        return false;
      }
      if (
        appliedFilter.category &&
        complaint.category !== appliedFilter.category
      ) {
        return false;
      }
      if (
        appliedFilter.locality &&
        !(complaint.area ?? "")
          .toLowerCase()
          .includes(appliedFilter.locality.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter, initialComplaints]);

  const analytics = useMemo(() => {
    let resolved = 0;
    let pending = 0;
    const uniqueLocalities = new Set<string>();

    for (const complaint of filteredComplaints) {
      if (complaint.status === "RESOLVED") {
        resolved += 1;
      }
      if (complaint.status === "PENDING" || complaint.status === "IN_PROGRESS") {
        pending += 1;
      }
      if (complaint.area?.trim()) {
        uniqueLocalities.add(complaint.area.trim().toLowerCase());
      }
    }

    const resolutionRate =
      filteredComplaints.length > 0
        ? (resolved / filteredComplaints.length) * 100
        : 0;

    return {
      resolved,
      pending,
      resolutionRate,
      localitiesCount: uniqueLocalities.size,
    };
  }, [filteredComplaints]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [appliedFilter]);

  const columns = useMemo(
    () => [
      complaintColumnHelper.accessor("id", {
        header: t("admin.table.refNo"),
        cell: (info) => <Text strong>#{info.getValue()}</Text>,
        sortingFn: "basic",
      }),
      complaintColumnHelper.display({
        id: "actions",
        header: t("admin.table.action"),
        cell: (info) => (
          <Link href={`/admin/complaint/${info.row.original.id}`}>
            <Button type="link" size="small" style={{ padding: 0 }}>
              {t("admin.table.view")}
            </Button>
          </Link>
        ),
      }),
      complaintColumnHelper.accessor("citizenName", {
        header: t("camp.user.name"),
        cell: (info) => (
          <Tooltip title={info.row.original.citizenMobile}>
            <Text style={{ color: "#1a3c6e", cursor: "pointer" }}>
              {info.getValue()}
            </Text>
          </Tooltip>
        ),
        sortingFn: "alphanumeric",
      }),
      complaintColumnHelper.accessor("category", {
        header: t("admin.table.category"),
        sortingFn: "alphanumeric",
      }),
      complaintColumnHelper.display({
        id: "department",
        header: t("admin.table.department"),
        cell: (info) => {
          const departmentName = info.row.original.departmentName || "-";
          const officerText =
            info.row.original.officerNames && info.row.original.officerNames.length > 0
              ? info.row.original.officerNames.join(", ")
              : t("admin.table.unassigned");

          return (
            <Tooltip title={officerText}>
              <Text style={{ color: "#1a3c6e", cursor: "pointer" }}>
                {departmentName}
              </Text>
            </Tooltip>
          );
        },
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
    ],
    [t],
  );

  const table = useReactTable({
    data: filteredComplaints,
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #1a3c6e", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.stats.total")}
                </Text>
              }
              value={filteredComplaints.length}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #2e7d32", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.stats.resolved")}
                </Text>
              }
              value={analytics.resolved}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #e07b00", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("dashboard.stats.pending")}
                </Text>
              }
              value={analytics.pending}
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #0277bd", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.table.area")}
                </Text>
              }
              value={analytics.localitiesCount}
              styles={{ content: { color: "#0277bd", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        style={{ marginBottom: 20, borderRadius: 6 }}
        title={
          <Text strong style={{ color: "#1a3c6e", fontSize: 13 }}>
            {t("admin.filter.title")}
          </Text>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={6}>
            <Select
              placeholder={t("admin.filter.allStatus")}
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusOptions.map((status) => ({
                value: status,
                label: status.replaceAll("_", " "),
              }))}
            />
          </Col>
          <Col xs={24} sm={7}>
            <Select
              placeholder={t("admin.filter.allCategories")}
              allowClear
              style={{ width: "100%" }}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={categoryOptions.map((category) => ({
                value: category,
                label: category,
              }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Input
              placeholder={t("admin.filter.area")}
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              prefix={<span style={{ color: "#bbb" }}>#</span>}
              allowClear
              onPressEnter={applyFilters}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Button
              type="primary"
              block
              onClick={applyFilters}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                fontWeight: 700,
              }}
            >
              {t("admin.filter.apply")}
            </Button>
          </Col>
        </Row>
      </Card>

      {initialError && (
        <Alert
          type="error"
          title={initialError}
          showIcon
          style={{ marginBottom: 16 }}
        />
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
            Showing{" "}
            {filteredComplaints.length === 0
              ? 0
              : pagination.pageIndex * pagination.pageSize + 1}
            -
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              filteredComplaints.length,
            )}{" "}
            of {filteredComplaints.length} complaints
          </Text>

          <Space wrap>
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Text>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(table.getPageCount(), 1)}
            </Text>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
