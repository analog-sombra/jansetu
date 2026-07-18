"use server";

import { ROLE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import {
  AdminMeetingCitizenLookupResult,
  AdminMeetingContactLookupResult,
} from "./types";

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "").slice(0, 10);
}

export async function lookupAdminMeetingCitizenByMobileAction(
  mobileInput: string,
): Promise<AdminMeetingCitizenLookupResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const mobile = normalizeMobile(mobileInput);
  if (!/^\d{10}$/.test(mobile)) {
    return { ok: false, error: "Please provide a valid 10-digit mobile number." };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        mobile,
        role: ROLE.CITIZEN,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
      },
    });

    if (!user) {
      return { ok: true, found: false };
    }

    return {
      ok: true,
      found: true,
      user,
    };
  } catch {
    return { ok: false, error: "Unable to lookup citizen." };
  }
}

export async function lookupAdminMeetingContactByMobileAction(
  mobileInput: string,
  departmentVisit: boolean,
): Promise<AdminMeetingContactLookupResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const mobile = normalizeMobile(mobileInput);
  if (!/^\d{10}$/.test(mobile)) {
    return { ok: false, error: "Please provide a valid 10-digit mobile number." };
  }

  try {
    if (departmentVisit) {
      const officer = await prisma.officer.findFirst({
        where: { phone: mobile },
        select: {
          name: true,
          designation: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!officer) {
        return { ok: true, found: false };
      }

      return {
        ok: true,
        found: true,
        contact: {
          name: officer.name,
          designation: officer.designation,
          department: officer.department.name,
        },
      };
    }

    const user = await prisma.user.findFirst({
      where: { mobile },
      select: {
        name: true,
      },
    });

    if (!user || !user.name) {
      return { ok: true, found: false };
    }

    return {
      ok: true,
      found: true,
      contact: {
        name: user.name,
        designation: null,
        department: null,
      },
    };
  } catch {
    return { ok: false, error: "Unable to lookup contact." };
  }
}
