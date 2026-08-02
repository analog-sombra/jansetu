"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type GetAvailableWorksResult =
  | {
      ok: true;
      works: Array<{
        id: number;
        title: string;
        description: string;
        departmentId: number;
        status: string;
        departmentName: string;
      }>;
    }
  | {
      ok: false;
      error: string;
    };

export async function getAvailableWorksAction(): Promise<GetAvailableWorksResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: "Please login again to continue.",
      };
    }

    // Fetch all works regardless of status to show available options
    const works = await prisma.work.findMany({
      include: {
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (works.length === 0) {
      return {
        ok: true,
        works: [],
      };
    }

    const formattedWorks = works
      .map((work) => {
        if (!work.department) {
          console.warn(
            "[getAvailableWorksAction] Work missing department:",
            work.id,
          );
          return null;
        }

        return {
          id: work.id,
          title: work.title,
          description: work.description,
          departmentId: work.departmentId,
          status: work.status,
          departmentName: work.department.name,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);

    return {
      ok: true,
      works: formattedWorks,
    };
  } catch (error) {
    console.error(
      "[getAvailableWorksAction] Error fetching available works:",
      error,
    );
    return {
      ok: false,
      error: `Failed to fetch available works: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
