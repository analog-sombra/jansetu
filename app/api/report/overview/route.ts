import { NextResponse } from "next/server";
import { requireReport } from "@/lib/auth";
import { buildReportOverview } from "@/lib/report-analytics";

export async function GET() {
  const session = await requireReport();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overview = await buildReportOverview();
  return NextResponse.json({ ok: true, overview });
}
