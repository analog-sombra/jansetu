import { prisma } from "@/lib/prisma";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function findDuplicateComplaints(input: {
  category: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
}) {
  const radiusMeters = input.radiusMeters ?? 300;

  const candidates = await prisma.complaint.findMany({
    where: {
      category: input.category,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      status: true,
      createdAt: true,
    },
  });

  return candidates
    .map((c) => ({
      ...c,
      distanceMeters: distanceInMeters(input.lat, input.lng, c.lat, c.lng),
    }))
    .filter((c) => c.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
