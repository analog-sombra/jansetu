"use client";

import { Tag } from "antd";

type Props = {
  status: string;
};

const statusColors: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

export function StatusBadge({ status }: Props) {
  return (
    <Tag color={statusColors[status] ?? "default"} style={{ fontWeight: 600, fontSize: 11 }}>
      {status.replaceAll("_", " ")}
    </Tag>
  );
}
