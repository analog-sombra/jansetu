"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ROLE } from "@prisma/client";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  attachComplaintToMlaPaClusterAction,
  createMlaPaComplaintClusterAction,
  detachComplaintFromMlaPaClusterAction,
  getMlaPaComplaintClustersAction,
  type MlaPaClusterComplaintItem,
  type MlaPaClusterSummary,
  type MlaPaComplaintClusterCandidate,
} from "@/actions/mla-pa";
import { useLanguage } from "@/components/provider/language_provider";

const { Title, Text } = Typography;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN");
}

function complaintLabel(item: MlaPaComplaintClusterCandidate): string {
  return `#${item.id} | ${item.category}${item.subcategory ? ` / ${item.subcategory}` : ""} | ${item.area ?? "-"} | ${item.status.replaceAll("_", " ")}`;
}

export default function MlaPaClusterComplaintsClient({
  userRole,
}: {
  userRole: ROLE;
}) {
  const { t } = useLanguage();
  const [clusters, setClusters] = useState<MlaPaClusterSummary[]>([]);
  const [complaints, setComplaints] = useState<MlaPaComplaintClusterCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [clusterName, setClusterName] = useState("");
  const [createComplaintIds, setCreateComplaintIds] = useState<number[]>([]);
  const [creatingCluster, setCreatingCluster] = useState(false);

  const [selectedClusterId, setSelectedClusterId] = useState<string>("");
  const [attachComplaintId, setAttachComplaintId] = useState<number | undefined>();
  const [attaching, setAttaching] = useState(false);

  const [detachingKey, setDetachingKey] = useState<string>("");

  const applyLoadResult = useCallback(
    (result: Awaited<ReturnType<typeof getMlaPaComplaintClustersAction>>) => {
      if (!result.ok) {
        setError(result.error ?? t("mlaCluster.loadError"));
        return;
      }

      setError("");
      setClusters(result.clusters);
      setComplaints(result.complaints);

      setSelectedClusterId((previousClusterId) => {
        if (!previousClusterId && result.clusters.length > 0) {
          return result.clusters[0].clusterId;
        }

        if (
          previousClusterId &&
          !result.clusters.some((item) => item.clusterId === previousClusterId)
        ) {
          return result.clusters[0]?.clusterId ?? "";
        }

        return previousClusterId;
      });
    },
    [t],
  );

  async function loadData() {
    setLoading(true);
    const result = await getMlaPaComplaintClustersAction();
    setLoading(false);
    applyLoadResult(result);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const result = await getMlaPaComplaintClustersAction();

      if (cancelled) {
        return;
      }

      applyLoadResult(result);
      setLoading(false);
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [applyLoadResult]);

  const selectedCluster = useMemo(
    () => clusters.find((item) => item.clusterId === selectedClusterId) ?? null,
    [clusters, selectedClusterId],
  );

  const complaintOptions = useMemo(
    () =>
      complaints.map((item) => ({
        value: item.id,
        label: complaintLabel(item),
      })),
    [complaints],
  );

  async function onCreateCluster() {
    setCreatingCluster(true);
    const result = await createMlaPaComplaintClusterAction({
      title: clusterName,
      complaintIds: createComplaintIds,
    });
    setCreatingCluster(false);

    if (!result.ok) {
      setError(result.error);
      setMessage("");
      return;
    }

    setError("");
    setMessage(t("mlaCluster.createSuccess"));
    setClusterName("");
    setCreateComplaintIds([]);
    await loadData();
    setSelectedClusterId(result.clusterId);
  }

  async function onAttachComplaint() {
    if (!selectedClusterId || !attachComplaintId) {
      return;
    }

    setAttaching(true);
    const result = await attachComplaintToMlaPaClusterAction({
      clusterId: selectedClusterId,
      complaintId: attachComplaintId,
    });
    setAttaching(false);

    if (!result.ok) {
      setError(result.error);
      setMessage("");
      return;
    }

    setError("");
    setMessage(t("mlaCluster.attachSuccess"));
    setAttachComplaintId(undefined);
    await loadData();
  }

  async function onDetachComplaint(clusterId: string, complaintId: number) {
    const key = `${clusterId}-${complaintId}`;
    setDetachingKey(key);
    const result = await detachComplaintFromMlaPaClusterAction({
      clusterId,
      complaintId,
    });
    setDetachingKey("");

    if (!result.ok) {
      setError(result.error);
      setMessage("");
      return;
    }

    setError("");
    setMessage(t("mlaCluster.detachSuccess"));
    await loadData();
  }

  const clusterColumns: TableColumnsType<MlaPaClusterSummary> = [
    {
      title: t("mlaCluster.clusterId"),
      dataIndex: "clusterId",
      key: "clusterId",
      width: 260,
      render: (value: string) => <Text style={{ fontSize: 12 }}>{value}</Text>,
    },
    {
      title: t("mlaCluster.category"),
      key: "title",
      render: (_, row) =>
        `${row.category}${row.subcategory ? ` / ${row.subcategory}` : ""}`,
    },
    {
      title: t("mlaCluster.department"),
      dataIndex: "departmentName",
      key: "departmentName",
    },
    {
      title: t("mlaCluster.complaintsCount"),
      dataIndex: "complaintsCount",
      key: "complaintsCount",
      width: 110,
    },
    {
      title: t("mlaCluster.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatDate(value),
      width: 120,
    },
    {
      title: t("mlaCluster.action"),
      key: "action",
      width: 110,
      render: (_, row) => (
        <Button size="small" onClick={() => setSelectedClusterId(row.clusterId)}>
          {t("mlaCluster.view")}
        </Button>
      ),
    },
  ];

  const clusterComplaintColumns: TableColumnsType<MlaPaClusterComplaintItem> = [
    {
      title: t("mlaCluster.complaint"),
      dataIndex: "complaintId",
      key: "complaintId",
      width: 90,
      render: (value: number) => <Text strong>#{value}</Text>,
    },
    {
      title: t("mlaCluster.category"),
      key: "category",
      render: (_, row) =>
        `${row.category}${row.subcategory ? ` / ${row.subcategory}` : ""}`,
    },
    {
      title: t("mlaCluster.area"),
      dataIndex: "area",
      key: "area",
      render: (value: string | null) => value || "-",
    },
    {
      title: t("mlaCluster.status"),
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag>{value.replaceAll("_", " ")}</Tag>,
      width: 140,
    },
    {
      title: t("mlaCluster.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatDate(value),
      width: 120,
    },
    {
      title: t("mlaCluster.action"),
      key: "action",
      width: 120,
      render: (_, row) => {
        const key = `${selectedClusterId}-${row.complaintId}`;
        return (
          <Button
            size="small"
            danger
            loading={detachingKey === key}
            onClick={() => void onDetachComplaint(selectedClusterId, row.complaintId)}
          >
            {t("mlaCluster.detach")}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ marginBottom: 0, color: "#1a3c6e" }}>
          {t("mlaCluster.title")}
        </Title>
        <Text type="secondary">{t("mlaCluster.subtitle")}</Text>
      </div>

      {error ? (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} />
      ) : null}
      {message ? (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={message}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={12}>
          <Card title={t("mlaCluster.createTitle")}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <div>
                <Text>{t("mlaCluster.clusterNameLabel")}</Text>
                <Input
                  value={clusterName}
                  onChange={(event) => setClusterName(event.target.value)}
                  placeholder={t("mlaCluster.clusterNamePlaceholder")}
                />
              </div>

              <div>
                <Text>{t("mlaCluster.selectComplaints")}</Text>
                <Select
                  mode="multiple"
                  value={createComplaintIds}
                  onChange={(values) => setCreateComplaintIds(values as number[])}
                  style={{ width: "100%" }}
                  placeholder={t("mlaCluster.selectComplaintsPlaceholder")}
                  options={complaintOptions}
                  optionFilterProp="label"
                  showSearch
                />
              </div>

              <Button
                type="primary"
                loading={creatingCluster}
                onClick={() => void onCreateCluster()}
                style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
              >
                {t("mlaCluster.createButton")}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title={t("mlaCluster.attachTitle")}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <div>
                <Text>{t("mlaCluster.selectCluster")}</Text>
                <Select
                  value={selectedClusterId || undefined}
                  onChange={setSelectedClusterId}
                  style={{ width: "100%" }}
                  placeholder={t("mlaCluster.selectClusterPlaceholder")}
                  options={clusters.map((item) => ({
                    value: item.clusterId,
                    label: `${item.title} (#${item.complaintsCount})`,
                  }))}
                />
              </div>

              <div>
                <Text>{t("mlaCluster.selectComplaint")}</Text>
                <Select
                  value={attachComplaintId}
                  onChange={(value) => setAttachComplaintId(value)}
                  style={{ width: "100%" }}
                  placeholder={t("mlaCluster.selectComplaintPlaceholder")}
                  options={complaintOptions}
                  optionFilterProp="label"
                  showSearch
                />
              </div>

              <Space>
                <Button onClick={() => void loadData()}>{t("mlaCluster.refresh")}</Button>
                <Button
                  type="primary"
                  loading={attaching}
                  onClick={() => void onAttachComplaint()}
                  disabled={!selectedClusterId || !attachComplaintId}
                  style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
                >
                  {t("mlaCluster.attachButton")}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t("mlaCluster.clustersTitle")} style={{ marginBottom: 16 }}>
        <Table
          rowKey="clusterId"
          loading={loading}
          columns={clusterColumns}
          dataSource={clusters}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: t("mlaCluster.noClusters") }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Card
        title={`${t("mlaCluster.complaintsInCluster")}${selectedCluster ? `: ${selectedCluster.title}` : ""}`}
      >
        <Table
          rowKey="complaintId"
          columns={clusterComplaintColumns}
          dataSource={selectedCluster?.complaints ?? []}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: t("mlaCluster.noComplaints") }}
          scroll={{ x: 820 }}
        />
      </Card>

      {userRole === "CAMP_HEAD" ? (
        <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          {t("mlaCluster.campHeadNote")}
        </Text>
      ) : null}
    </div>
  );
}
