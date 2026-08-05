"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";

type TotalBudgetDelegate = {
  create: (args: {
    data: { scope: string; purpose: string; amount: number };
    select: {
      id: true;
      scope: true;
      purpose: true;
      amount: true;
      createdAt: true;
    };
  }) => Promise<{
    id: number;
    scope: string;
    purpose: string;
    amount: unknown;
    createdAt: Date;
  }>;
};

function getTotalBudgetDelegate(): TotalBudgetDelegate | null {
  const prismaWithDelegates = prisma as unknown as {
    totalBudget?: TotalBudgetDelegate;
    total_budget?: TotalBudgetDelegate;
  };

  return prismaWithDelegates.totalBudget ?? prismaWithDelegates.total_budget ?? null;
}

export type UpsertAdminTotalBudgetResult =
  | {
      ok: true;
      budget: {
        id: number;
        scope: string;
        purpose: string;
        amount: number;
        createdAt: string;
      };
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function upsertAdminTotalBudgetAction(
  payload: { amount: number; purpose: string; scope?: string },
): Promise<UpsertAdminTotalBudgetResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const amount = Number(payload.amount);
  const purpose = (payload.purpose ?? "").trim();
  const scope = payload.scope?.trim() || "GLOBAL";

  if (!Number.isFinite(amount) || amount < 0) {
    return {
      ok: false,
      error: "Please enter a valid non-negative budget amount.",
    };
  }

  if (!purpose) {
    return {
      ok: false,
      error: "Please enter budget purpose.",
    };
  }

  // Prisma String in MySQL is typically VARCHAR(191) by default.
  if (purpose.length > 191) {
    return {
      ok: false,
      error: "Purpose is too long. Please keep it within 191 characters.",
    };
  }

  try {
    const totalBudget = getTotalBudgetDelegate();

    if (!totalBudget) {
      return {
        ok: false,
        error:
          "Budget table client is unavailable. Please restart dev server and run prisma generate/db push.",
      };
    }

    const saved = await totalBudget.create({
      data: {
        scope,
        purpose,
        amount,
      },
      select: {
        id: true,
        scope: true,
        purpose: true,
        amount: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      budget: {
        id: saved.id,
        scope: saved.scope,
        purpose: saved.purpose,
        amount: Number(saved.amount),
        createdAt: saved.createdAt.toISOString(),
      },
      message: "MLA budget added successfully.",
    };
  } catch (error) {
    console.error("[upsertAdminTotalBudgetAction] Failed to create budget:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Unable to save MLA budget. ${error.message}`
          : "Unable to save MLA budget.",
    };
  }
}
