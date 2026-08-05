"use server";

import prisma from "@/lib/prisma";
import { COMPLAINTSTATUS } from "@prisma/client";
import { requireCampUser } from "./_shared";
import { GetCitizenComplaintSummaryResult } from "./types";

const CLOSED_STATUSES: COMPLAINTSTATUS[] = [
  COMPLAINTSTATUS.CLOSED,
  COMPLAINTSTATUS.AUTO_CLOSED,
  COMPLAINTSTATUS.REJECTED,
];

export async function getCitizenComplaintSummaryAction(
  mobileInput: string,
): Promise<GetCitizenComplaintSummaryResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
  }

  const mobile = mobileInput.trim();

  if (!/^\d{10}$/.test(mobile)) {
    return {
      ok: false,
      error: "Please enter a valid 10-digit mobile number.",
    };
  }

  const citizen = await prisma.user.findUnique({
    where: { mobile },
    select: {
      id: true,
      role: true,
    },
  });

  if (!citizen || citizen.role !== "CITIZEN") {
    return {
      ok: true,
      found: false,
      summary: {
        total: 0,
        resolved: 0,
        pending: 0,
        closed: 0,
      },
    };
  }

  const complaints = await prisma.complaint.findMany({
    where: { userId: citizen.id },
    select: { status: true },
  });

  const total = complaints.length;
  const resolved = complaints.filter(
    (item) => item.status === COMPLAINTSTATUS.RESOLVED,
  ).length;
  const closed = complaints.filter((item) =>
    CLOSED_STATUSES.includes(item.status),
  ).length;
  const pending = Math.max(0, total - resolved - closed);

  return {
    ok: true,
    found: true,
    summary: {
      total,
      resolved,
      pending,
      closed,
    },
  };
}
