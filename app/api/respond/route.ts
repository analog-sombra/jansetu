import {
  AssignmentStatus,
  ComplaintStatus,
  NotificationChannel,
  ResponseType,
} from "@prisma/client";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import { respondSchema } from "@/lib/validators";
import { logNotification } from "@/services/notification-service";

function mapStatuses(type: ResponseType) {
  if (type === ResponseType.RESOLVED) {
    return {
      complaint: ComplaintStatus.RESOLVED,
      assignment: AssignmentStatus.RESOLVED,
    };
  }

  if (type === ResponseType.QUERY) {
    return {
      complaint: ComplaintStatus.QUERY_RAISED,
      assignment: AssignmentStatus.QUERY,
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

  const response = await prisma.response.create({
    data: {
      assignmentId: assignment.id,
      type: parsed.data.type,
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
    data: { status: statuses.complaint },
  });

  await prisma.auditLog.create({
    data: {
      complaintId: assignment.complaintId,
      action: `OFFICER_RESPONSE_${parsed.data.type}`,
      meta: {
        assignmentId: assignment.id,
        officerId: assignment.officerId,
      },
    },
  });

  await logNotification({
    userId: assignment.complaint.userId,
    assignmentId: assignment.id,
    channel: NotificationChannel.SMS,
    recipient: assignment.complaint.user.mobile,
    message: `Update on complaint #${assignment.complaintId}: ${parsed.data.type}`,
  });

  return NextResponse.json({ ok: true, response });
}
