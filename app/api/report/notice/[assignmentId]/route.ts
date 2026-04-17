import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireReport } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ assignmentId: string }> }
) {
  const session = await requireReport();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assignmentId } = await ctx.params;
  const parsedId = Number(assignmentId);
  if (!Number.isInteger(parsedId)) {
    return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: parsedId },
    include: {
      officer: { include: { department: true } },
      complaint: true,
      notifications: true,
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const reminderCount = assignment.notifications.length;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const blue = rgb(0.1, 0.24, 0.43);
  const saffron = rgb(1, 0.6, 0.2);
  const green = rgb(0.08, 0.53, 0.03);

  page.drawRectangle({ x: 0, y: 790, width: 595.28, height: 51.89, color: blue });
  page.drawRectangle({ x: 0, y: 786, width: 595.28, height: 4, color: saffron });
  page.drawRectangle({ x: 0, y: 782, width: 595.28, height: 4, color: green });

  page.drawText("OFFICE OF THE MLA", { x: 40, y: 816, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Official Notice - Delayed Grievance Resolution", {
    x: 40,
    y: 798,
    size: 11,
    font,
    color: rgb(0.9, 0.95, 1),
  });

  let y = 740;
  const lines = [
    `Notice Date: ${new Date().toLocaleDateString("en-IN")}`,
    `Ticket ID: #${assignment.complaintId}`,
    `Department: ${assignment.officer.department.name}`,
    `Officer Name: ${assignment.officer.name}`,
    `Date of First Report: ${assignment.complaint.createdAt.toLocaleString("en-IN")}`,
    `Resolution Link Reminders Sent: ${reminderCount}`,
    `SLA Due Date: ${assignment.dueDate.toLocaleString("en-IN")}`,
    `Coordinates (LAT/LONG): ${assignment.complaint.lat}, ${assignment.complaint.lng}`,
    `Area: ${assignment.complaint.area ?? "N/A"}`,
  ];

  for (const line of lines) {
    page.drawText(line, { x: 45, y, size: 11, font });
    y -= 20;
  }

  y -= 12;
  page.drawText("Subject:", { x: 45, y, size: 12, font: bold, color: blue });
  page.drawText("Immediate Action Required on Negligence in Public Grievance Handling", {
    x: 95,
    y,
    size: 11,
    font,
  });

  y -= 28;
  const bodyLines = [
    "This is to formally notify that the above-referenced grievance remains delayed despite repeated reminders.",
    "The complaint has direct constituency impact and has been escalated for administrative accountability review.",
    "You are directed to complete action and submit photographic proof through the official resolution link immediately.",
    "Failure to comply will be recorded in departmental performance review and submitted to higher authorities.",
  ];

  for (const line of bodyLines) {
    page.drawText(line, { x: 45, y, size: 10.5, font });
    y -= 17;
  }

  y -= 24;
  page.drawText("Issued by:", { x: 45, y, size: 11, font: bold });
  y -= 17;
  page.drawText("MLA Strategic Monitoring Cell", { x: 45, y, size: 11, font });
  y -= 14;
  page.drawText(`Authorized User: ${session.mobile}`, { x: 45, y, size: 10, font });

  page.drawRectangle({ x: 40, y: 85, width: 515, height: 1, color: rgb(0.75, 0.75, 0.75) });
  page.drawText("JanSetu Strategic Accountability Notice", {
    x: 45,
    y: 70,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=notice-ticket-${assignment.complaintId}.pdf`,
    },
  });
}
