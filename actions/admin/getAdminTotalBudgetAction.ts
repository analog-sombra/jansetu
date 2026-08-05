"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";

type TotalBudgetDelegate = {
  findMany: (args: {
    orderBy: { createdAt: "desc" };
    select: {
      id: true;
      scope: true;
      purpose: true;
      amount: true;
      createdAt: true;
    };
  }) => Promise<
    Array<{
      id: number;
      scope: string;
      purpose: string;
      amount: unknown;
      createdAt: Date;
    }>
  >;
  aggregate: (args: {
    _sum: {
      amount: true;
    };
  }) => Promise<{
    _sum: {
      amount: unknown;
    };
  }>;
};

function getTotalBudgetDelegate(): TotalBudgetDelegate | null {
  const prismaWithDelegates = prisma as unknown as {
    totalBudget?: TotalBudgetDelegate;
    total_budget?: TotalBudgetDelegate;
  };

  return prismaWithDelegates.totalBudget ?? prismaWithDelegates.total_budget ?? null;
}

export type GetAdminTotalBudgetResult =
  | {
      ok: true;
      budgets: Array<{
        id: number;
        scope: string;
        purpose: string;
        amount: number;
        createdAt: string;
      }>;
      summary: {
        totalAllotted: number;
        totalApproved: number;
        totalUtilized: number;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function getAdminTotalBudgetAction(): Promise<GetAdminTotalBudgetResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
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

    const [budgets, budgetAggregate, workAggregate] = await Promise.all([
      totalBudget.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        scope: true,
        purpose: true,
        amount: true,
        createdAt: true,
      },
      }),
      totalBudget.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.work.aggregate({
        _sum: {
          approved_budget: true,
          utilized_budget: true,
        },
      }),
    ]);

    return {
      ok: true,
      budgets: budgets.map((item) => ({
        id: item.id,
        scope: item.scope,
        purpose: item.purpose,
        amount: Number(item.amount),
        createdAt: item.createdAt.toISOString(),
      })),
      summary: {
        totalAllotted: Number(budgetAggregate._sum.amount ?? 0),
        totalApproved: Number(workAggregate._sum.approved_budget ?? 0),
        totalUtilized: Number(workAggregate._sum.utilized_budget ?? 0),
      },
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch MLA budget.",
    };
  }
}
