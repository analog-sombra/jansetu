import { ComplaintStatus, NotificationChannel } from "@prisma/client";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { raiseQuerySchema } from "@/lib/validators";
import { logNotification } from "@/services/notification-service";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const complaintId = Number(id);
  if (!Number.isInteger(complaintId)) {
    return NextResponse.json({ error: "Invalid complaint id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = raiseQuerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query payload" }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { user: true },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  await prisma.complaint.update({
    where: { id: complaintId },
    data: { status: ComplaintStatus.QUERY_RAISED },
  });

  const sanitizedMessage = sanitizeHtml(parsed.data.message);

  await prisma.auditLog.create({
    data: {
      actorUserId: session.userId,
      complaintId,
      action: "ADMIN_QUERY_TO_CITIZEN",
      meta: { message: sanitizedMessage },
    },
  });

  await logNotification({
    userId: complaint.userId,
    channel: NotificationChannel.SMS,
    recipient: complaint.user.mobile,
    message: `Query for complaint #${complaintId}: ${sanitizedMessage}`,
  });

  return NextResponse.json({ ok: true });
}
