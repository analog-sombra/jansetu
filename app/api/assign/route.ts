import { AssignmentStatus, ComplaintStatus, NotificationChannel } from "@prisma/client";
import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { CATEGORY_DEPARTMENT_MAP } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { assignSchema } from "@/lib/validators";
import { logNotification } from "@/services/notification-service";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid assignment payload" }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: parsed.data.complaintId },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const officer = await prisma.officer.findUnique({
    where: { id: parsed.data.officerId },
    include: { department: true },
  });

  if (!officer) {
    return NextResponse.json({ error: "Officer not found" }, { status: 404 });
  }

  const relatedDepartments = CATEGORY_DEPARTMENT_MAP[complaint.category] ?? [];
  if (relatedDepartments.length > 0 && !relatedDepartments.includes(officer.department.name)) {
    return NextResponse.json(
      {
        error: `Officer must belong to ${relatedDepartments.join(" or ")} for ${complaint.category} complaints`,
      },
      { status: 400 },
    );
  }

  const assignment = await prisma.assignment.create({
    data: {
      complaintId: complaint.id,
      officerId: officer.id,
      status: AssignmentStatus.ASSIGNED,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : addDays(new Date(), 7),
      token: randomUUID().replace(/-/g, ""),
    },
  });

  await prisma.complaint.update({
    where: { id: complaint.id },
    data: { status: ComplaintStatus.IN_PROGRESS },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.userId,
      complaintId: complaint.id,
      action: "ASSIGNMENT_CREATED",
      meta: {
        officerId: officer.id,
        department: officer.department.name,
      },
    },
  });

  const runtimeOrigin = new URL(request.url).origin;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || runtimeOrigin;
  const tokenLink = `${baseUrl}/officer/${assignment.token}`;

  await logNotification({
    assignmentId: assignment.id,
    channel: NotificationChannel.EMAIL,
    recipient: officer.email,
    message: `You have a new complaint assignment #${complaint.id}. Access link: ${tokenLink}`,
  });

  return NextResponse.json({
    ok: true,
    assignment,
    tokenLink,
  });
}
