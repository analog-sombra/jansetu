"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";

import { useLanguage } from "@/components/language-provider";
import {
  getLocalizedCategory,
  getLocalizedSubcategory,
} from "@/lib/complaint-i18n";

import {
  buildPriorityClusters,
  DEMO_COMPLAINTS,
  getClusterKey,
} from "../demo-data";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

export default function QueueDemoViewPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();

  const complaintId = Number(params.id);
  const complaint = DEMO_COMPLAINTS.find((item) => item.id === complaintId);

  if (!Number.isInteger(complaintId) || !complaint) {
    return <Alert type="error" showIcon title="Complaint not found" />;
  }

  const clusters = buildPriorityClusters(DEMO_COMPLAINTS);
  const cluster = clusters.find(
    (item) => item.key === getClusterKey(complaint),
  );

  const relatedCases = cluster
    ? DEMO_COMPLAINTS.filter(
        (item) =>
          cluster.complaintIds.includes(item.id) && item.id !== complaint.id,
      )
    : [];

  const relatedColumns: TableColumnsType<(typeof relatedCases)[number]> = [
    {
      title: "Complaint",
      dataIndex: "id",
      key: "id",
      render: (id: number) => (
        <Link href={`/admin/queue-demo/${id}`}>
          <Text strong style={{ color: "#1a3c6e" }}>
            #{id}
          </Text>
        </Link>
      ),
    },
    {
      title: t("admin.table.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? "default"}>
          {status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Text type="secondary">
          Admin Portal &gt; Queue &gt; Complaint #{complaint.id}
        </Text>
      </div>

      <Card
        style={{ borderRadius: 6, marginBottom: 18 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0, color: "#1a3c6e" }}>
              Complaint #{complaint.id}
            </Title>
            <Tag color={STATUS_COLORS[complaint.status] ?? "default"}>
              {complaint.status.replaceAll("_", " ")}
            </Tag>
            {cluster && (
              <Tag color="red" style={{ fontWeight: 700 }}>
                PRIORITY CLUSTER
              </Tag>
            )}
          </Space>
        }
      >
        <div className="flex gap-4 flex-wrap">
          <div className="bg-gray-100 rounded-md p-3 flex-1 min-w-55">
            <h1 className="text-sm font-normal">Category</h1>
            <p className="text-xs font-semibold text-gray-500">
              {getLocalizedCategory(complaint.category, t)}
            </p>
          </div>
          <div className="bg-gray-100 rounded-md p-3 flex-1 min-w-55">
            <h1 className="text-sm font-normal">Sub-Category</h1>
            <p className="text-xs font-semibold text-gray-500">
              {getLocalizedSubcategory(complaint.subcategory, t)}
            </p>
          </div>
        </div>

        <div className="h-4" />

        <div className="flex gap-4 flex-wrap">
          <div className="bg-gray-100 rounded-md p-3 flex-1 min-w-55">
            <h1 className="text-sm font-normal">{t("admin.table.area")}</h1>
            <p className="text-xs font-semibold text-gray-500">
              {complaint.area}
            </p>
          </div>
          <div className="bg-gray-100 rounded-md p-3 flex-1 min-w-55">
            <h1 className="text-sm font-normal">Coordinates</h1>
            <p className="text-xs font-semibold text-gray-500">
              {complaint.lat}, {complaint.lng}
            </p>
            <a
              href={`https://www.google.com/maps?layer=c&cbll=${complaint.lat},${complaint.lng}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block", marginTop: 8 }}
            >
              <Button
                size="small"
                style={{ borderColor: "#1a3c6e", color: "#1a3c6e", fontSize: 11 }}
              >
                Open in Google Maps
              </Button>
            </a>
          </div>
        </div>

        <div className="h-4" />

        <div className="flex gap-4 flex-wrap">
          <div className="bg-gray-100 rounded-md p-3 flex-1 min-w-55">
            <h1 className="text-sm font-normal">Created On</h1>
            <p className="text-xs font-semibold text-gray-500">
              {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-100 rounded-md p-3 flex-1 min-w-55">
            <h1 className="text-sm font-normal">{t("admin.table.officer")}</h1>
            <p className="text-xs font-semibold text-gray-500">
              {complaint.assignments[0]?.officer.name ?? t("admin.table.unassigned")}
            </p>
          </div>
        </div>

        <div className="h-4" />

        <div className="bg-gray-100 rounded-md p-3">
          <h1 className="text-sm font-normal">Description</h1>
          <p
            className="text-xs font-semibold text-gray-500"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {complaint.description}
          </p>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Priority & Cluster Insight" style={{ borderRadius: 6 }}>
            {cluster ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Cluster Key">
                  {cluster.key}
                </Descriptions.Item>
                <Descriptions.Item label="Cluster Volume">
                  {cluster.complaintIds.length} complaints
                </Descriptions.Item>
                <Descriptions.Item label="Pending/Active">
                  {cluster.pendingCount}
                </Descriptions.Item>
                <Descriptions.Item label="Escalated">
                  {cluster.escalatedCount}
                </Descriptions.Item>
                <Descriptions.Item label="Priority Score">
                  <Tag color={cluster.priorityScore >= 40 ? "red" : "volcano"}>
                    {cluster.priorityScore}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert
                type="success"
                showIcon
                title="No priority cluster"
                description="This complaint currently does not match any repeat cluster."
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Assignment Snapshot" style={{ borderRadius: 6 }}>
            {complaint.assignments.length > 0 ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label={t("admin.table.officer")}>
                  {complaint.assignments[0].officer.name}
                </Descriptions.Item>
                <Descriptions.Item label={t("admin.table.department")}>
                  {complaint.assignments[0].officer.department.name}
                </Descriptions.Item>
                <Descriptions.Item label="Escalation Risk">
                  <Tag
                    color={complaint.status === "ESCALATED" ? "red" : "blue"}
                  >
                    {complaint.status === "ESCALATED" ? "High" : "Monitor"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert
                type="info"
                showIcon
                title="Unassigned"
                description="No officer assigned yet in this record."
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="Related Cluster Complaints" style={{ borderRadius: 6 }}>
        <Table
          rowKey="id"
          columns={relatedColumns}
          dataSource={relatedCases}
          pagination={{
            pageSize: 8,
            showTotal: (total) => `${total} related cases`,
          }}
          locale={{
            emptyText: (
              <Text type="secondary">
                No related complaints in same cluster.
              </Text>
            ),
          }}
        />
      </Card>
    </div>
  );
}
