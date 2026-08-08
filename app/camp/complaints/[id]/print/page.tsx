"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Skeleton, Alert } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import {
  getCampComplaintDetailAction,
  type CampComplaintDetail,
} from "@/actions/camp";

// const STATUS_COLORS: Record<string, string> = {
//   PENDING: "orange",
//   IN_PROGRESS: "blue",
//   WORK_IN_PROGRESS: "cyan",
//   QUERY_RAISED: "volcano",
//   RESOLVED: "green",
//   REJECTED: "red",
//   ESCALATED: "purple",
//   AUTO_CLOSED: "default",
// };

function ComplaintInfoBlock({ complaint }: { complaint: CampComplaintDetail }) {
  const formatReceiptDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  return (
    <div
      style={{
        padding: "8px 6px",
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 1.4,
        maxWidth: "120mm",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 8,
          borderBottom: "1px solid #000",
          paddingBottom: 6,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: "bold" }}>
          COMPLAINT RECEIPT
        </div>
        <div style={{ fontSize: 9, marginTop: 2 }}>Status Report</div>
      </div>

      {/* Complaint ID and Date */}
      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
          }}
        >
          <span>Receipt #:</span>
          <span style={{ fontWeight: "bold" }}>{complaint.id}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            marginTop: 2,
          }}
        >
          <span>Date/Time:</span>
          <span style={{ fontWeight: "bold" }}>
            {formatReceiptDate(new Date(complaint.createdAt))}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            marginTop: 2,
          }}
        >
          <span>Status:</span>
          <span style={{ fontWeight: "bold" }}>
            {complaint.status.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px dotted #000",
          marginBottom: 6,
          paddingBottom: 6,
        }}
      />

      {/* Citizen Information */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: "bold", marginBottom: 3 }}>
          CITIZEN DETAILS
        </div>
        <div style={{ fontSize: 9, lineHeight: 1.5 }}>
          <div>Name: {complaint.citizen.name}</div>
          <div>Mobile: {complaint.citizen.mobile}</div>
          <div>Voter ID: {complaint.citizen.voterId || "-"}</div>
          <div style={{ marginTop: 2 }}>
            Address: {complaint.citizen.address || "-"}
          </div>
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px dotted #000",
          marginBottom: 6,
          paddingBottom: 6,
        }}
      />

      {/* Complaint Category */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: "bold", marginBottom: 3 }}>
          COMPLAINT CATEGORY
        </div>
        <div style={{ fontSize: 9, lineHeight: 1.5 }}>
          <div>Category: {complaint.category}</div>
          <div>Subcategory: {complaint.subcategory || "-"}</div>
          <div>Locality: {complaint.locality || "-"}</div>
          <div>Sublocality: {complaint.sublocality || "-"}</div>
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px dotted #000",
          marginBottom: 6,
          paddingBottom: 6,
        }}
      />

      {/* Complaint Details */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: "bold", marginBottom: 3 }}>
          COMPLAINT DETAILS
        </div>
        <div style={{ fontSize: 9 }}>
          <div style={{ marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Location:</span>
          </div>
          <div style={{ marginBottom: 3, lineHeight: 1.4 }}>
            {complaint.complaintAddress?.trim() || "-"}
          </div>
          <div style={{ marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Coordinates:</span>
          </div>
          <div style={{ fontSize: 8, marginBottom: 3 }}>
            {complaint.lat}, {complaint.lng}
          </div>
          <div style={{ marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Affected Citizens:</span>{" "}
            {complaint.cluster
              ? complaint.cluster.totalAffectedCitizensCount
              : complaint.affectedCitizensCount}
          </div>
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px dotted #000",
          marginBottom: 6,
          paddingBottom: 6,
        }}
      />

      {/* Description */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: "bold", marginBottom: 3 }}>
          DESCRIPTION
        </div>
        <div
          style={{
            fontSize: 8,
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {complaint.description}
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px solid #000",
          marginBottom: 6,
          paddingBottom: 6,
        }}
      />

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: 8 }}>
        <div>Thank you for your complaint</div>
        <div style={{ marginTop: 2 }}>Status will be updated regularly</div>
      </div>
    </div>
  );
}

export default function PrintComplaintPage() {
  const params = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<CampComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const complaintId = Number(params.id);

  useEffect(() => {
    async function loadComplaint() {
      if (!Number.isInteger(complaintId) || complaintId <= 0) {
        setError("Invalid complaint selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const result = await getCampComplaintDetailAction(complaintId);

      if (!result.ok) {
        setComplaint(null);
        setError(result.error);
        setLoading(false);
        return;
      }

      setComplaint(result.complaint);
      setLoading(false);
    }

    void loadComplaint();
  }, [complaintId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        maxWidth: "210mm",
        margin: "0 auto",
        padding: "10px",
        background: "#fff",
      }}
    >
      {/* Print Controls - Hidden in Print */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          justifyContent: "center",
        }}
        className="no-print"
      >
        <Button
          icon={<PrinterOutlined />}
          size="large"
          onClick={handlePrint}
          style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}
        >
          Print / Download PDF
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {loading && (
        <Card style={{ borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 12 }} />
        </Card>
      )}

      {!loading && complaint && (
        <div
          id="print-content"
          style={{
            background: "white",
          }}
        >
          {/* Style for print */}
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 5mm;
              }
              
              * {
                margin: 0;
                padding: 0;
              }
              
              html, body {
                margin: 0;
                padding: 0;
                background: white;
              }
              
              .no-print {
                display: none !important;
              }
              
              #print-content {
                background: white;
                margin: 0;
                padding: 0;
                page-break-after: avoid;
              }
              
              .complaint-copy {
                page-break-after: avoid;
                page-break-inside: avoid;
              }
            }
          `}</style>

          {/* USER COPY */}
          <div className="complaint-copy" style={{ marginBottom: 4 }}>
            <ComplaintInfoBlock complaint={complaint} />
          </div>

          {/* Divider */}
          <div
            style={{
              textAlign: "center",
              fontSize: 9,
              margin: "8px 0",
              color: "#999",
              fontFamily: "monospace",
            }}
          >
            ✂ ✂ ✂ FOLD HERE FOR CITIZEN COPY ✂ ✂ ✂
          </div>

          {/* DEPARTMENT COPY */}
          <div className="complaint-copy">
            <ComplaintInfoBlock complaint={complaint} />
          </div>
        </div>
      )}
    </div>
  );
}
