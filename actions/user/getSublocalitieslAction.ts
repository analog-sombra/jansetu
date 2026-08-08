"use server";

import prisma from "@/lib/prisma";

export type SubLocalityWithLocality = {
  id: number;
  name: string;
  localityId: number;
  locality: {
    id: number;
    name: string;
  };
  latitude: number | null;
  longitude: number | null;
};

export type GetSublocalitieslResult = {
  ok: true;
  sublocalities: SubLocalityWithLocality[];
};

export async function getSublocalitieslAction(localityId?: number): Promise<GetSublocalitieslResult> {
  try {
    const sublocalities = await prisma.sublocality.findMany({
      where: {
        status: true,
        ...(localityId ? { localityId } : {}),
      },
      orderBy: [{ locality: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        localityId: true,
        latitude: true,
        longitude: true,
        locality: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ok: true,
      sublocalities,
    };
  } catch {
    return {
      ok: true,
      sublocalities: [],
    };
  }
}
