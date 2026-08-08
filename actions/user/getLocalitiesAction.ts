"use server";

import prisma from "@/lib/prisma";

export type LocalityWithWard = {
  id: number;
  name: string;
  wardId: number;
  ward: {
    id: number;
    name: string;
  };
};

export type GetLocalitiesResult = {
  ok: true;
  localities: LocalityWithWard[];
};

export async function getLocalitiesAction(): Promise<GetLocalitiesResult> {
  try {
    const localities = await prisma.locality.findMany({
      where: {
        status: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        wardId: true,
        ward: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ok: true,
      localities,
    };
  } catch {
    return {
      ok: true,
      localities: [],
    };
  }
}
