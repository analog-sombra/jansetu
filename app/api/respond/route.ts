import {
  AssignmentStatus,
  ComplaintStatus,
  NotificationChannel,
} from "@prisma/client";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import { respondSchema } from "@/lib/validators";
import { logNotification } from "@/services/notification-service";

function mapStatuses(type: string) {
  if (type === "RESOLVED") {
    return {
      complaint: ComplaintStatus.RESOLVED,
      assignment: AssignmentStatus.RESOLVED,
    };
  }

  if (type === "QUERY") {
    return {
      complaint: ComplaintStatus.QUERY_RAISED,
      assignment: AssignmentStatus.QUERY,
    };
  }

  if (type === "WORK_IN_PROGESS") {
    return {
      complaint: "WORK_IN_PROGESS" as ComplaintStatus,
      assignment: AssignmentStatus.IN_PROGRESS,
    };
  }

  return {
    complaint: ComplaintStatus.REJECTED,
    assignment: AssignmentStatus.REJECTED,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response payload" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { token: parsed.data.token },
    include: {
      complaint: { include: { user: true } },
      officer: true,
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const statuses = mapStatuses(parsed.data.type);
  const plannedCompletionDate =
    parsed.data.type === "WORK_IN_PROGESS"
      ? new Date(parsed.data.plannedCompletionDate as string)
      : parsed.data.type === "RESOLVED" || parsed.data.type === "REJECTED"
        ? null
        : undefined;

  const response = await prisma.response.create({
    data: {
      assignmentId: assignment.id,
      type: parsed.data.type as never,
      message: sanitizeHtml(parsed.data.message),
      proofUrl: parsed.data.proofUrl ? sanitizeHtml(parsed.data.proofUrl) : null,
    },
  });

  await prisma.assignment.update({
    where: { id: assignment.id },
    data: { status: statuses.assignment },
  });

  await prisma.complaint.update({
    where: { id: assignment.complaintId },
    data: {
      status: statuses.complaint as never,
      ...(plannedCompletionDate !== undefined
        ? { plannedCompletionDate }
        : {}),
    } as never,
  });

  await prisma.auditLog.create({
    data: {
      complaintId: assignment.complaintId,
      action: `OFFICER_RESPONSE_${parsed.data.type}`,
      meta: {
        assignmentId: assignment.id,
        officerId: assignment.officerId,
        plannedCompletionDate:
          plannedCompletionDate instanceof Date
            ? plannedCompletionDate.toISOString()
            : null,
      },
    },
  });

  await logNotification({
    userId: assignment.complaint.userId,
    assignmentId: assignment.id,
    channel: NotificationChannel.SMS,
    recipient: assignment.complaint.user.mobile,
    message:
      parsed.data.type === "WORK_IN_PROGESS" &&
      plannedCompletionDate instanceof Date
        ? `Update on complaint #${assignment.complaintId}: WORK IN PROGESS till ${plannedCompletionDate.toLocaleDateString("en-IN")}`
        : `Update on complaint #${assignment.complaintId}: ${parsed.data.type}`,
  });

  return NextResponse.json({ ok: true, response });
}
