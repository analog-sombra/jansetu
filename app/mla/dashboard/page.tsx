/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAdminReportDashboardAction,
  type AdminReportAreaStatus,
  type AdminReportOverview,
  type AdminReportPeriodKey,
  type AdminReportWardStatus,
} from "@/actions/admin";
import { useLanguage } from "@/components/provider/language_provider";

const { Title, Text, Paragraph } = Typography;

type PeriodKey = AdminReportPeriodKey;
type WardStatus = AdminReportWardStatus;
type AreaStatus = AdminReportAreaStatus;

const WARD_COLOR: Record<WardStatus, string> = {
  GREEN: "#2e7d32",
  AMBER: "#e07b00",
  RED: "#c62828",
};

const HEATMAP_CARD_BACKGROUND: Record<AreaStatus, string> = {
  GREEN: "linear-gradient(155deg, #e8f5e9 0%, #c8e6c9 100%)",
  AMBER: "linear-gradient(155deg, #fff4e5 0%, #ffe0b2 100%)",
  RED: "linear-gradient(155deg, #ffebee 0%, #ffcdd2 100%)",
};

const EMPTY_OVERVIEW: AdminReportOverview = {
  summary: {
    totalVotersAssisted: 0,
    resolvedThisPeriod: 0,
    pendingFollowUps: 0,
    satisfactionScore: 0,
  },
  trend: [],
  areaHeatmap: [],
  wards: [],
  serviceRecord: [],
  constituencySentiment: [
    { name: "Positive", value: 0, color: "#2e7d32" },
    { name: "Neutral", value: 100, color: "#faad14" },
    { name: "Negative", value: 0, color: "#c62828" },
  ],
  departmentReportCard: [],
  noticeTriggerList: [],
  proofGallery: [],
  systemicCrises: [],
};

const PROOF_PANEL_STYLE = {
  borderRadius: 8,
  minHeight: 140,
  padding: 14,
  color: "#fff",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
};

export default function ReportDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [wardFilter, setWardFilter] = useState<string>("ALL");
  const [overview, setOverview] = useState<AdminReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      const result = await getAdminReportDashboardAction(period);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setOverview(null);
        setErrorMessage(result.error ?? "Unable to load dashboard report.");
        setLoading(false);
        return;
      }

      setOverview(result.overview);
      setErrorMessage(null);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const activeOverview = overview ?? EMPTY_OVERVIEW;

  const wardOptions = useMemo(
    () => [
      { label: t("report.filter.allWards"), value: "ALL" },
      ...activeOverview.wards.map((item) => ({
        label: item.ward,
        value: item.ward,
      })),
    ],
    [activeOverview.wards, t],
  );

  useEffect(() => {
    if (
      wardFilter !== "ALL" &&
      !activeOverview.wards.some((item) => item.ward === wardFilter)
    ) {
      setWardFilter("ALL");
    }
  }, [activeOverview.wards, wardFilter]);

  const filteredWards = useMemo(() => {
    if (wardFilter === "ALL") {
      return activeOverview.wards;
    }

    return activeOverview.wards.filter((item) => item.ward === wardFilter);
  }, [activeOverview.wards, wardFilter]);

  const topAffectedAreas = useMemo(
    () =>
      [...activeOverview.areaHeatmap].sort(
        (left, right) => right.complaints - left.complaints,
      ),
    [activeOverview.areaHeatmap],
  );

  const departmentColumns = useMemo(
    () => [
      {
        title: t("report.table.department"),
        dataIndex: "department",
        key: "department",
        render: (value: string) => <Text strong>{value}</Text>,
      },
      {
        title: t("report.table.issuesLogged"),
        dataIndex: "issuesLogged",
        key: "issuesLogged",
      },
      {
        title: t("report.table.avgResolution"),
        dataIndex: "avgResolutionDays",
        key: "avgResolutionDays",
        render: (value: number) => `${value} ${t("report.days")}`,
      },
      {
        title: t("report.table.slaBreach"),
        dataIndex: "slaBreachPercent",
        key: "slaBreachPercent",
        render: (value: number) => (
          <Tag color={value >= 20 ? "red" : value >= 10 ? "orange" : "green"}>
            {value}%
          </Tag>
        ),
      },
      {
        title: t("report.table.workDonePhotos"),
        dataIndex: "workDonePhotosUploaded",
        key: "workDonePhotosUploaded",
      },
    ],
    [t],
  );

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 4,
              height: 22,
              background: "#FF9933",
              borderRadius: 2,
            }}
          />
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            {t("report.title")}
          </Title>
        </div>
        <Text type="secondary" style={{ marginLeft: 14 }}>
          {t("report.subtitle")}
        </Text>
      </div>

      {errorMessage && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
          message={errorMessage}
        />
      )}

      <Card style={{ borderRadius: 6, marginBottom: 20 }}>
        <Space wrap style={{ width: "100%" }}>
          <div>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {t("report.filter.period")}
            </Text>
            <Select
              value={period}
              onChange={(value) => setPeriod(value as PeriodKey)}
              style={{ minWidth: 170 }}
              options={[
                { value: "7d", label: t("report.filter.last7") },
                { value: "30d", label: t("report.filter.last30") },
                { value: "90d", label: t("report.filter.last90") },
              ]}
            />
          </div>

          <div>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {t("report.filter.wardFocus")}
            </Text>
            <Select
              value={wardFilter}
              onChange={setWardFilter}
              style={{ minWidth: 220 }}
              options={wardOptions}
            />
          </div>

          <div style={{ marginLeft: "auto" }}>
            <Space>
              {loading ? <Spin size="small" /> : null}
              <Button disabled>{t("report.exportSummary")}</Button>
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #1a3c6e" }}>
            <Statistic
              title={t("report.totalVotersAssisted")}
              value={activeOverview.summary.totalVotersAssisted}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #2e7d32" }}>
            <Statistic
              title={t("report.resolvedThisPeriod")}
              value={activeOverview.summary.resolvedThisPeriod}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #e07b00" }}>
            <Statistic
              title={t("report.pendingFollowUps")}
              value={activeOverview.summary.pendingFollowUps}
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #722ed1" }}>
            <Statistic
              title={t("report.netScore")}
              value={activeOverview.summary.satisfactionScore}
              suffix="%"
              styles={{ content: { color: "#722ed1", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.healthMap")}
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card size="small" title={t("report.trendTitle")}>
              <div style={{ height: 280 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeOverview.trend}>
                      <defs>
                        <linearGradient
                          id="complaintsFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1a3c6e"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1a3c6e"
                            stopOpacity={0.04}
                          />
                        </linearGradient>
                        <linearGradient
                          id="resolvedFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2e7d32"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2e7d32"
                            stopOpacity={0.04}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="complaints"
                        stroke="#1a3c6e"
                        fill="url(#complaintsFill)"
                        strokeWidth={2}
                        name={t("report.complaints")}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stroke="#2e7d32"
                        fill="url(#resolvedFill)"
                        strokeWidth={2}
                        name={t("report.resolved")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 8,
                      background:
                        "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)",
                    }}
                  />
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card size="small" title={t("report.healthMap.wardPerformance")}>
              <div style={{ height: 280 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredWards}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="ward" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [
                          `${value ?? 0}%`,
                          t("report.resolutionRate"),
                        ]}
                      />
                      <Bar dataKey="resolutionRate" radius={[6, 6, 0, 0]}>
                        {filteredWards.map((entry) => (
                          <Cell
                            key={entry.ward}
                            fill={WARD_COLOR[entry.color]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 8,
                      background:
                        "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)",
                    }}
                  />
                )}
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title={t("report.rajouriGardenMapTitle")}>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                {t("report.rajouriGardenMapDesc")}
              </Paragraph>

              <Space wrap size={[8, 8]} style={{ marginBottom: 16 }}>
                <Tag color="red">{t("report.heatLegend.red")}</Tag>
                <Tag color="orange">{t("report.heatLegend.orange")}</Tag>
                <Tag color="green">{t("report.heatLegend.green")}</Tag>
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {activeOverview.areaHeatmap.map((item) => {
                      const resolutionRate =
                        item.complaints > 0
                          ? Math.round((item.resolved / item.complaints) * 100)
                          : 0;

                      return (
                        <div
                          key={item.area}
                          style={{
                            background: HEATMAP_CARD_BACKGROUND[item.color],
                            border: `1px solid ${WARD_COLOR[item.color]}22`,
                            borderRadius: 10,
                            padding: 14,
                            minHeight: 170,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
                              <Text
                                strong
                                style={{ color: "#1f2937", fontSize: 14 }}
                              >
                                {item.area}
                              </Text>
                              <Tag
                                color={
                                  item.color === "RED"
                                    ? "red"
                                    : item.color === "AMBER"
                                      ? "orange"
                                      : "green"
                                }
                              >
                                {item.escalation}
                              </Tag>
                            </div>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                display: "block",
                                marginTop: 6,
                              }}
                            >
                              {t("report.dominantIssue")}: {item.topIssue}
                            </Text>
                          </div>

                          <Space
                            orientation="vertical"
                            size={6}
                            style={{ width: "100%" }}
                          >
                            <Text>
                              <strong>{item.complaints}</strong>{" "}
                              {t("report.grievances")}
                            </Text>
                            <Progress
                              percent={resolutionRate}
                              strokeColor={WARD_COLOR[item.color]}
                              size="small"
                              format={() =>
                                `${resolutionRate}% ${t("report.resolved")}`
                              }
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {t("report.avgResolution")}:{" "}
                              {item.avgResolutionDays} {t("report.days")} |{" "}
                              {t("report.trend")}: {item.trend}
                            </Text>
                          </Space>
                        </div>
                      );
                    })}
                  </div>
                </Col>

                <Col xs={24} xl={8}>
                  <Card
                    size="small"
                    title={t("report.topAffectedAreas")}
                    style={{ height: "100%" }}
                  >
                    <Space
                      orientation="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {topAffectedAreas.slice(0, 5).map((item, index) => {
                        const resolutionRate =
                          item.complaints > 0
                            ? Math.round(
                                (item.resolved / item.complaints) * 100,
                              )
                            : 0;
                        return (
                          <div
                            key={`${item.area}-${index}`}
                            style={{
                              width: "100%",
                              paddingBottom: 12,
                              borderBottom:
                                index < 4
                                  ? "1px solid rgba(5, 5, 5, 0.06)"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                marginBottom: 6,
                              }}
                            >
                              <Text strong>
                                {index + 1}. {item.area}
                              </Text>
                              <Tag
                                color={
                                  item.color === "RED"
                                    ? "red"
                                    : item.color === "AMBER"
                                      ? "orange"
                                      : "green"
                                }
                              >
                                {item.severityScore}
                              </Tag>
                            </div>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                display: "block",
                                marginBottom: 6,
                              }}
                            >
                              {item.topIssue}
                            </Text>
                            <Progress
                              percent={Math.min(item.severityScore, 100)}
                              strokeColor={WARD_COLOR[item.color]}
                              size="small"
                              format={() =>
                                `${item.complaints} ${t("report.grievances")}`
                              }
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {t("report.resolutionRate")}: {resolutionRate}% |{" "}
                              {t("report.trend")}: {item.trend}
                            </Text>
                          </div>
                        );
                      })}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title={t("report.healthMap.masterCases")}>
              <Row gutter={[12, 12]}>
                {activeOverview.systemicCrises.map((item) => (
                  <Col xs={24} md={8} key={item.key}>
                    <Card
                      size="small"
                      style={{
                        borderLeft: "4px solid #c62828",
                        boxShadow: "0 0 0 1px rgba(198,40,40,0.08)",
                      }}
                    >
                      <Space
                        orientation="vertical"
                        size={4}
                        style={{ width: "100%" }}
                      >
                        <Text strong style={{ fontSize: 16 }}>
                          {item.icon} {item.category}
                        </Text>
                        <Text type="secondary">
                          {t("report.area")}: {item.area}
                        </Text>
                        <Text>
                          {t("report.activeCluster")}:{" "}
                          <strong>{item.activeCases}</strong>{" "}
                          {t("report.grievances")}
                        </Text>
                        <Tag color="red">{item.severity}</Tag>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.impact")}
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card size="small" title={t("report.serviceRecord")}>
              <div style={{ height: 300 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeOverview.serviceRecord}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="fixed"
                        stackId="services"
                        fill="#1a3c6e"
                        radius={[6, 6, 0, 0]}
                        name={t("report.resolved")}
                      />
                      <Bar
                        dataKey="backlog"
                        stackId="services"
                        fill="#e07b00"
                        radius={[6, 6, 0, 0]}
                        name={t("report.backlog")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 8,
                      background:
                        "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)",
                    }}
                  />
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card size="small" title={t("report.sentimentTitle")}>
              <div style={{ height: 300 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeOverview.constituencySentiment}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {activeOverview.constituencySentiment.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value ?? 0}%`,
                          t("report.netScore"),
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 8,
                      background:
                        "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)",
                    }}
                  />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.departmental")}
          </Text>
        }
      >
        <Table
          columns={departmentColumns}
          dataSource={activeOverview.departmentReportCard}
          rowKey="department"
          pagination={false}
          size="middle"
          scroll={{ x: 720 }}
        />

        <Divider />
        <Title level={5}>{t("report.noticeTriggers")}</Title>
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          {activeOverview.noticeTriggerList.map((item, index) => (
            <div
              key={item.assignmentId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                paddingBottom: 12,
                borderBottom:
                  index < activeOverview.noticeTriggerList.length - 1
                    ? "1px solid rgba(5, 5, 5, 0.06)"
                    : "none",
              }}
            >
              <div>
                <Space style={{ marginBottom: 4 }}>
                  <Text strong>
                    {t("report.ticket")} #{item.ticketId}
                  </Text>
                  <Tag color="red">
                    {item.daysOverdue} {t("report.daysOverdue")}
                  </Tag>
                </Space>
                <Text type="secondary">
                  {item.department} | {item.officerName} | {item.reminderCount}{" "}
                  reminders | {item.area}
                </Text>
              </div>
              <Button size="small" disabled>
                {t("report.previewAction")}
              </Button>
            </div>
          ))}
        </Space>
      </Card>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.proof")}
          </Text>
        }
      >
        <Row gutter={[12, 12]}>
          {activeOverview.proofGallery.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.complaintId}>
              <Card
                size="small"
                title={`#${item.complaintId} - ${item.category}`}
              >
                <Row gutter={10}>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("report.before")}
                    </Text>
                    <div
                      style={{
                        ...PROOF_PANEL_STYLE,
                        background: `linear-gradient(140deg, ${item.beforeTone}, #111827)`,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: 700 }}>
                        {item.beforeLabel}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                        {item.area}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("report.after")}
                    </Text>
                    <div
                      style={{
                        ...PROOF_PANEL_STYLE,
                        background: `linear-gradient(140deg, ${item.afterTone}, #0f172a)`,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: 700 }}>
                        {item.afterLabel}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                        {t("report.resolvedOn")}{" "}
                        {new Date(item.resolvedAt).toLocaleDateString("en-IN")}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 6 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.noticeHub")}
          </Text>
        }
      >
        <Row gutter={[16, 0]} align="middle" style={{ marginBottom: 14 }}>
          <Col flex="auto">
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t("report.noticeHubDesc")}
            </Paragraph>
          </Col>
          <Col>
            <Button type="primary" onClick={() => router.push("/mla/complaints-by-subcategory")}>
              {t("report.view") || "View"}
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {filteredWards.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.ward}>
              <Card size="small">
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  {item.ward}
                </Text>
                <Progress
                  percent={item.resolutionRate}
                  strokeColor={WARD_COLOR[item.color]}
                  size="small"
                  format={(value) => `${value}%`}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("report.avgResolution")}: {item.avgResolutionDays}{" "}
                  {t("report.days")} | {t("report.cases")}: {item.total}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
