import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireReport } from "@/lib/auth";
import { buildReportOverview } from "@/lib/report-analytics";

export async function GET() {
  const session = await requireReport();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overview = await buildReportOverview();

  const topObstructors = [...overview.departmentReportCard]
    .sort((a, b) => b.slaBreachPercent - a.slaBreachPercent)
    .slice(0, 3);

  const pdfDoc = await PDFDocument.create();
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const page2 = pdfDoc.addPage([595.28, 841.89]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const blue = rgb(0.1, 0.24, 0.43);
  const saffron = rgb(1, 0.6, 0.2);

  page1.drawRectangle({ x: 0, y: 780, width: 595.28, height: 61.89, color: blue });
  page1.drawText("JANSETU - MLA EXECUTIVE SUMMARY", {
    x: 35,
    y: 812,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page1.drawText("Strategic Constituency Oversight Snapshot", {
    x: 35,
    y: 792,
    size: 11,
    font,
    color: rgb(0.9, 0.95, 1),
  });

  let y = 748;
  page1.drawText("1) How many of our voters did we help this month?", {
    x: 35,
    y,
    size: 13,
    font: bold,
    color: blue,
  });
  y -= 24;
  page1.drawText(`Total Voters Assisted: ${overview.voterImpact.totalVotersAssisted}`, {
    x: 45,
    y,
    size: 12,
    font,
  });
  y -= 18;
  page1.drawText(
    `Constituency Sentiment Score: ${overview.voterImpact.constituencySentiment.score}%`,
    {
      x: 45,
      y,
      size: 12,
      font,
    }
  );
  y -= 24;

  page1.drawText("Service Record by Category", {
    x: 45,
    y,
    size: 12,
    font: bold,
  });
  y -= 16;

  for (const row of overview.voterImpact.serviceRecord) {
    page1.drawText(`- ${row.category}: ${row.fixed} issues fixed`, {
      x: 55,
      y,
      size: 11,
      font,
    });
    y -= 14;
  }

  y -= 10;
  page1.drawText("2) Which departments are sabotaging our work?", {
    x: 35,
    y,
    size: 13,
    font: bold,
    color: blue,
  });
  y -= 24;

  if (topObstructors.length === 0) {
    page1.drawText("No department data available.", { x: 45, y, size: 11, font });
    y -= 14;
  } else {
    for (const dept of topObstructors) {
      page1.drawText(
        `- ${dept.department}: SLA Breach ${dept.slaBreachPercent}% | Avg ${dept.avgResolutionDays} days`,
        {
          x: 45,
          y,
          size: 11,
          font,
        }
      );
      y -= 16;
    }
  }

  y -= 10;
  page1.drawText("Notice Trigger Cases", {
    x: 45,
    y,
    size: 12,
    font: bold,
  });
  y -= 16;
  for (const trigger of overview.noticeTriggerList.slice(0, 5)) {
    page1.drawText(
      `- Ticket #${trigger.ticketId} | ${trigger.officerName} | ${trigger.daysOverdue} days overdue`,
      {
        x: 55,
        y,
        size: 10,
        font,
      }
    );
    y -= 13;
    if (y < 100) {
      break;
    }
  }

  page1.drawRectangle({ x: 35, y: 60, width: 525, height: 1, color: saffron });
  page1.drawText(`Generated for ${session.mobile} on ${new Date().toLocaleString("en-IN")}`, {
    x: 35,
    y: 45,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  page2.drawRectangle({ x: 0, y: 780, width: 595.28, height: 61.89, color: blue });
  page2.drawText("3) What are the 3 major systemic crises we are currently solving?", {
    x: 35,
    y: 812,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y2 = 746;
  if (overview.systemicCrises.length === 0) {
    page2.drawText("No active systemic crisis clusters detected.", {
      x: 40,
      y: y2,
      size: 11,
      font,
    });
  } else {
    for (const [index, crisis] of overview.systemicCrises.entries()) {
      page2.drawText(
        `${index + 1}. ${crisis.category} | Area: ${crisis.area} | Active Cases: ${crisis.activeCases}`,
        {
          x: 40,
          y: y2,
          size: 12,
          font: bold,
          color: blue,
        }
      );
      y2 -= 20;
      page2.drawText(
        `Strategic Impact: concentrated grievance pressure in ${crisis.area} requires direct monitoring and coordinated response.`,
        {
          x: 50,
          y: y2,
          size: 10,
          font,
        }
      );
      y2 -= 30;
    }
  }

  y2 -= 8;
  page2.drawText("Top Ward Performance Snapshot", {
    x: 35,
    y: y2,
    size: 12,
    font: bold,
    color: blue,
  });
  y2 -= 18;

  for (const ward of overview.voterHealthMap.wards.slice(0, 6)) {
    page2.drawText(
      `- ${ward.ward}: ${ward.resolutionRate}% resolved | Avg ${ward.avgResolutionDays} days | ${ward.color}`,
      {
        x: 45,
        y: y2,
        size: 10,
        font,
      }
    );
    y2 -= 14;
  }

  page2.drawRectangle({ x: 35, y: 60, width: 525, height: 1, color: saffron });
  page2.drawText("Prepared for internal MLA strategic review", {
    x: 35,
    y: 45,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  const pdfBytes = await pdfDoc.save();
  const body = Buffer.from(pdfBytes);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=mla-executive-summary.pdf",
    },
  });
}
