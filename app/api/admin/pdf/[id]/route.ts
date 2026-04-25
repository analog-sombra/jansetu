import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
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

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      user: true,
      assignments: {
        include: {
          officer: { include: { department: true } },
          responses: true,
        },
      },
      media: true,
    },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = [
    "JANSETU COMPLAINT SUMMARY",
    `Complaint ID: ${complaint.id}`,
    `Citizen: ${complaint.user.name ?? "Unknown"} (${complaint.user.mobile})`,
    `Category: ${complaint.category}`,
    `Subcategory: ${complaint.subcategory ?? "N/A"}`,
    `Status: ${complaint.status}`,
    `Target Completion Date: ${(complaint as { plannedCompletionDate?: Date | null }).plannedCompletionDate ? (complaint as { plannedCompletionDate?: Date | null }).plannedCompletionDate?.toLocaleDateString("en-IN") : "N/A"}`,
    `Area: ${complaint.area ?? "N/A"}`,
    `Coordinates: ${complaint.lat}, ${complaint.lng}`,
    `Assignments: ${complaint.assignments.length}`,
    `Media Files: ${complaint.media.length}`,
    `Description: ${complaint.description}`,
  ];

  let y = 800;
  page.drawText(lines[0], { x: 50, y, size: 18, font: boldFont });
  y -= 35;

  for (const line of lines.slice(1)) {
    page.drawText(line.slice(0, 110), { x: 50, y, size: 11, font });
    y -= 20;
    if (y < 60) {
      break;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const body = Buffer.from(pdfBytes);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="complaint-${complaint.id}.pdf"`,
    },
  });
}
