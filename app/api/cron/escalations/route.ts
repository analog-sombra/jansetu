import { NextRequest, NextResponse } from "next/server";
import { runEscalationJobs } from "@/services/escalation-service";

export async function POST(request: NextRequest) {
  const incomingSecret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || incomingSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runEscalationJobs();
  return NextResponse.json({ ok: true, result });
}
