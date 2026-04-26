"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";

import {
  ConstituencyCaseRow,
  ConstituencySummaryRow,
  DepartmentPendingCase,
  getTodayTask,
} from "@/app/report/meeting-calendar/task-data";

const { Title, Text, Paragraph } = Typography;

const departmentColumns: TableColumnsType<DepartmentPendingCase> = [
  {
    title: "Complaint #",
    dataIndex: "complaintId",
    key: "complaintId",
    render: (value) => <Text strong>#{value}</Text>,
  },
  { title: "Category", dataIndex: "category", key: "category" },
  { title: "Area", dataIndex: "area", key: "area" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (value) => <Tag color="orange">{value}</Tag>,
  },
  {
    title: "Officer Intervention",
    dataIndex: "officerIntervention",
    key: "officerIntervention",
  },
];

const constituencySummaryColumns: TableColumnsType<ConstituencySummaryRow> = [
  { title: "Category", dataIndex: "category", key: "category" },
  { title: "Resolved", dataIndex: "resolved", key: "resolved" },
  { title: "In Progress", dataIndex: "inProgress", key: "inProgress" },
  { title: "Latest Action", dataIndex: "latestAction", key: "latestAction" },
];

const constituencyCaseColumns: TableColumnsType<ConstituencyCaseRow> = [
  {
    title: "Complaint #",
    dataIndex: "complaintId",
    key: "complaintId",
    render: (value) => <Text strong>#{value}</Text>,
  },
  { title: "Category", dataIndex: "category", key: "category" },
  { title: "Area", dataIndex: "area", key: "area" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (value) => (
      <Tag color={value === "Resolved" ? "green" : "blue"}>{value}</Tag>
    ),
  },
  { title: "Officer", dataIndex: "officer", key: "officer" },
  { title: "Updated On", dataIndex: "updatedOn", key: "updatedOn" },
  { title: "Details", dataIndex: "details", key: "details" },
];

export default function MeetingCalendarTaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();

  const task = useMemo(() => getTodayTask(params.taskId), [params.taskId]);

  if (!task) {
    return (
      <Alert
        type="error"
        showIcon
        message="Task not found"
        description="The selected dashboard task could not be found."
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Button onClick={() => router.push("/report/meeting-calendar")}>Back to Dashboard</Button>
      </div>

      <Card style={{ borderRadius: 8, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
              {task.meetingType}
            </Title>
            <Text type="secondary">Today&apos;s task detail view</Text>
          </div>
          <Tag color="blue" style={{ alignSelf: "flex-start", fontWeight: 600 }}>
            {task.time}
          </Tag>
        </div>

        <Descriptions
          bordered
          size="small"
          column={1}
          style={{ marginTop: 16 }}
          items={[
            { label: "Whom To Meet", children: task.person },
            { label: "Address", children: task.address },
            { label: "Purpose", children: task.purpose },
          ]}
        />
      </Card>

      {task.citizen && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="Citizen Details" style={{ borderRadius: 8 }}>
              <Descriptions
                column={1}
                size="small"
                items={[
                  { label: "Name", children: task.person },
                  { label: "Mobile", children: task.citizen.mobile },
                  { label: "Area", children: task.citizen.area },
                  { label: "Profile", children: task.citizen.details },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title="Citizen Concern" style={{ borderRadius: 8 }}>
              <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                {task.citizen.concern}
              </Paragraph>
            </Card>
          </Col>
        </Row>
      )}

      {task.departmentVisit && (
        <Card title="Department Pending Cases" style={{ borderRadius: 8 }}>
          <Paragraph type="secondary">
            Department: {task.departmentVisit.department}
          </Paragraph>
          <Paragraph>{task.departmentVisit.interventionSummary}</Paragraph>
          <Table
            rowKey="key"
            columns={departmentColumns}
            dataSource={task.departmentVisit.pendingCases}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {task.constituencyVisit && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Grouped Report Summary" style={{ borderRadius: 8 }}>
            <Paragraph type="secondary">
              Area covered: {task.constituencyVisit.areaCovered}
            </Paragraph>
            <Table
              rowKey="key"
              columns={constituencySummaryColumns}
              dataSource={task.constituencyVisit.groupedSummary}
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="Resolved in Past 1 Month" style={{ borderRadius: 8 }}>
            <Table
              rowKey="key"
              columns={constituencyCaseColumns}
              dataSource={task.constituencyVisit.resolvedCases}
              pagination={false}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>

          <Card title="In Progress Cases" style={{ borderRadius: 8 }}>
            <Table
              rowKey="key"
              columns={constituencyCaseColumns}
              dataSource={task.constituencyVisit.inProgressCases}
              pagination={false}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </div>
      )}

      {task.personalMeet && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="Context" style={{ borderRadius: 8 }}>
              <Paragraph style={{ marginBottom: 0 }}>
                {task.personalMeet.relationContext}
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card title="Briefing Notes" style={{ borderRadius: 8 }}>
              {task.personalMeet.briefingNotes.map((note) => (
                <Paragraph key={note} style={{ marginBottom: 8 }}>
                  {note}
                </Paragraph>
              ))}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
