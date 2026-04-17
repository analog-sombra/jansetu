import {
  AssignmentStatus,
  ComplaintStatus,
  NotificationChannel,
  ResponseType,
} from "@prisma/client";
import { subHours, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { logNotification } from "@/services/notification-service";

export async function runEscalationJobs() {
  const now = new Date();

  const reminderCutoff = subHours(now, 48);
  const reminderAssignments = await prisma.assignment.findMany({
    where: {
      createdAt: { lte: reminderCutoff },
      status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS] },
    },
    include: { officer: true, complaint: true },
  });

  for (const assignment of reminderAssignments) {
    await logNotification({
      assignmentId: assignment.id,
      channel: NotificationChannel.EMAIL,
      recipient: assignment.officer.email,
      message: `Reminder: Complaint #${assignment.complaintId} is pending action for over 48 hours.`,
    });

    await prisma.auditLog.create({
      data: {
        complaintId: assignment.complaintId,
        action: "REMINDER_SENT_48H",
        meta: { assignmentId: assignment.id },
      },
    });
  }

  const escalationCutoff = subDays(now, 7);
  const escalationAssignments = await prisma.assignment.findMany({
    where: {
      createdAt: { lte: escalationCutoff },
      status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS, AssignmentStatus.QUERY] },
    },
    include: { complaint: true },
  });

  for (const assignment of escalationAssignments) {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: AssignmentStatus.ESCALATED },
    });

    await prisma.complaint.update({
      where: { id: assignment.complaintId },
      data: { status: ComplaintStatus.ESCALATED },
    });

    await prisma.auditLog.create({
      data: {
        complaintId: assignment.complaintId,
        action: "AUTO_ESCALATED_7D",
        meta: { assignmentId: assignment.id },
      },
    });
  }

  const staleQueryCutoff = subDays(now, 7);
  const queryComplaints = await prisma.complaint.findMany({
    where: {
      status: ComplaintStatus.QUERY_RAISED,
      updatedAt: { lte: staleQueryCutoff },
    },
    include: { user: true },
  });

  for (const complaint of queryComplaints) {
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: { status: ComplaintStatus.AUTO_CLOSED },
    });

    await prisma.auditLog.create({
      data: {
        complaintId: complaint.id,
        actorUserId: complaint.userId,
        action: "AUTO_CLOSED_NO_CITIZEN_RESPONSE",
      },
    });

    await logNotification({
      userId: complaint.userId,
      channel: NotificationChannel.SMS,
      recipient: complaint.user.mobile,
      message: `Complaint #${complaint.id} was auto-closed due to no response in 7 days.`,
    });
  }

  const resolvedAssignments = await prisma.assignment.findMany({
    where: {
      status: AssignmentStatus.RESOLVED,
      responses: {
        some: {
          type: ResponseType.RESOLVED,
        },
      },
    },
    include: {
      complaint: {
        include: { user: true },
      },
    },
  });

  for (const assignment of resolvedAssignments) {
    await logNotification({
      userId: assignment.complaint.userId,
      assignmentId: assignment.id,
      channel: NotificationChannel.SMS,
      recipient: assignment.complaint.user.mobile,
      message: `Please confirm resolution for complaint #${assignment.complaintId}.`,
    });

    await prisma.auditLog.create({
      data: {
        complaintId: assignment.complaintId,
        action: "CITIZEN_CONFIRMATION_REQUESTED",
        meta: { assignmentId: assignment.id },
      },
    });
  }

  return {
    reminders: reminderAssignments.length,
    escalations: escalationAssignments.length,
    autoClosed: queryComplaints.length,
    confirmationRequests: resolvedAssignments.length,
  };
}
