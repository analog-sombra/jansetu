export type DemoComplaint = {
  id: number;
  category: string;
  subcategory: string;
  description: string;
  area: string;
  status: "PENDING" | "IN_PROGRESS" | "QUERY_RAISED" | "RESOLVED" | "REJECTED" | "ESCALATED" | "AUTO_CLOSED";
  lat: number;
  lng: number;
  createdAt: string;
  assignments: Array<{
    id: number;
    officer: { name: string; department: { name: string } };
  }>;
};

export type PriorityCluster = {
  key: string;
  area: string;
  category: string;
  subcategory: string;
  complaintIds: number[];
  pendingCount: number;
  escalatedCount: number;
  newestAt: string;
  priorityScore: number;
};

const STATUS_ROTATION: DemoComplaint["status"][] = [
  "PENDING",
  "IN_PROGRESS",
  "QUERY_RAISED",
  "RESOLVED",
  "ESCALATED",
  "PENDING",
  "IN_PROGRESS",
  "AUTO_CLOSED",
];

const AREA_BASE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Rajouri Garden": { lat: 28.6425, lng: 77.1167 },
  "Raghubir Nagar": { lat: 28.6494, lng: 77.1102 },
  "Tagore Garden": { lat: 28.6478, lng: 77.1076 },
  "Subhash Nagar": { lat: 28.6419, lng: 77.1031 },
  "Mansarovar Garden": { lat: 28.6402, lng: 77.1244 },
  Mayapuri: { lat: 28.6378, lng: 77.1289 },
  "Ramesh Nagar": { lat: 28.6457, lng: 77.0961 },
};

const OFFICERS_BY_CATEGORY: Record<string, { name: string; department: string }> = {
  ROAD: { name: "Rohit Verma", department: "PWD" },
  WATER: { name: "Anil Kumar", department: "Delhi Jal Board" },
  SANITATION: { name: "Meena Sharma", department: "Sanitation" },
  ELECTRICITY: { name: "Pooja Singh", department: "BSES" },
  HEALTH: { name: "Dr. Nisha Batra", department: "Health" },
  PUBLIC_SAFETY: { name: "Inspector Arjun", department: "Police Coordination" },
};

const CLUSTER_SEEDS = [
  {
    area: "Rajouri Garden",
    category: "ROAD",
    subcategory: "POTHOLE",
    description: "Repeated pothole stretch causing two-wheeler skids.",
  },
  {
    area: "Tagore Garden",
    category: "SANITATION",
    subcategory: "GARBAGE_NOT_COLLECTED",
    description: "Garbage piles not cleared from lane corner for multiple days.",
  },
  {
    area: "Raghubir Nagar",
    category: "WATER",
    subcategory: "WATER_LEAKAGE",
    description: "Underground water leakage near pipeline junction.",
  },
  {
    area: "Subhash Nagar",
    category: "ELECTRICITY",
    subcategory: "POWER_CUT",
    description: "Frequent evening power outages in residential block.",
  },
  {
    area: "Mansarovar Garden",
    category: "PUBLIC_SAFETY",
    subcategory: "TRAFFIC_VIOLATION",
    description: "Chronic wrong-side driving near market crossing.",
  },
  {
    area: "Mayapuri",
    category: "HEALTH",
    subcategory: "HOSPITAL_ISSUE",
    description: "Primary health center queue and service delays.",
  },
];

const SINGLE_SEEDS = [
  {
    area: "Ramesh Nagar",
    category: "ROAD",
    subcategory: "ROAD_DAMAGE",
    description: "Damaged road patch near school gate.",
    status: "PENDING" as const,
  },
  {
    area: "Rajouri Garden",
    category: "WATER",
    subcategory: "LOW_PRESSURE",
    description: "Low morning water pressure in D-block houses.",
    status: "IN_PROGRESS" as const,
  },
  {
    area: "Tagore Garden",
    category: "ELECTRICITY",
    subcategory: "DAMAGED_WIRE",
    description: "Exposed cable hanging close to balcony level.",
    status: "ESCALATED" as const,
  },
  {
    area: "Subhash Nagar",
    category: "SANITATION",
    subcategory: "DRAIN_CLOGGED",
    description: "Drain blockage causing waterlogging after rain.",
    status: "QUERY_RAISED" as const,
  },
  {
    area: "Mansarovar Garden",
    category: "HEALTH",
    subcategory: "AMBULANCE_SERVICE",
    description: "Delayed ambulance pickup for emergency call.",
    status: "RESOLVED" as const,
  },
  {
    area: "Mayapuri",
    category: "PUBLIC_SAFETY",
    subcategory: "SECURITY_CONCERN",
    description: "Poor street lighting creating unsafe night pockets.",
    status: "REJECTED" as const,
  },
  {
    area: "Raghubir Nagar",
    category: "ROAD",
    subcategory: "MISSING_SIGNAGE",
    description: "Missing caution signage near sharp school turn.",
    status: "AUTO_CLOSED" as const,
  },
  {
    area: "Rajouri Garden",
    category: "SANITATION",
    subcategory: "SWEEPING_NOT_DONE",
    description: "Street sweeping skipped for several mornings.",
    status: "IN_PROGRESS" as const,
  },
  {
    area: "Tagore Garden",
    category: "WATER",
    subcategory: "NO_WATER_SUPPLY",
    description: "No supply for 12+ hours in inner lane properties.",
    status: "PENDING" as const,
  },
  {
    area: "Subhash Nagar",
    category: "PUBLIC_SAFETY",
    subcategory: "UNSAFE_AREA",
    description: "Dark corner near park repeatedly reported unsafe.",
    status: "IN_PROGRESS" as const,
  },
  {
    area: "Ramesh Nagar",
    category: "ELECTRICITY",
    subcategory: "BROKEN_POLE",
    description: "Tilted electricity pole near bus stop.",
    status: "PENDING" as const,
  },
  {
    area: "Mansarovar Garden",
    category: "ROAD",
    subcategory: "ROAD_DEBRIS",
    description: "Construction debris blocking a service lane.",
    status: "QUERY_RAISED" as const,
  },
];

function createAssignment(category: string, assignmentId: number) {
  const officer = OFFICERS_BY_CATEGORY[category];
  if (!officer) return [];
  return [
    {
      id: assignmentId,
      officer: {
        name: officer.name,
        department: { name: officer.department },
      },
    },
  ];
}

function getCoords(area: string, offset: number) {
  const base = AREA_BASE_COORDS[area] ?? { lat: 28.64, lng: 77.11 };
  const tweak = offset * 0.00045;
  return {
    lat: Number((base.lat + tweak).toFixed(6)),
    lng: Number((base.lng - tweak).toFixed(6)),
  };
}

function generateDemoComplaints() {
  const complaints: DemoComplaint[] = [];
  let id = 5001;

  CLUSTER_SEEDS.forEach((seed, clusterIndex) => {
    for (let i = 0; i < 8; i += 1) {
      const status = STATUS_ROTATION[(clusterIndex + i) % STATUS_ROTATION.length];
      const { lat, lng } = getCoords(seed.area, i + clusterIndex);
      complaints.push({
        id,
        area: seed.area,
        category: seed.category,
        subcategory: seed.subcategory,
        description: `${seed.description} Repeated report ${i + 1}.`,
        status,
        lat,
        lng,
        createdAt: new Date(Date.UTC(2026, 3, (i % 20) + 1, 8 + (i % 6), 15)).toISOString(),
        assignments:
          status === "PENDING" || status === "AUTO_CLOSED"
            ? []
            : createAssignment(seed.category, id + 7000),
      });
      id += 1;
    }
  });

  SINGLE_SEEDS.forEach((seed, singleIndex) => {
    const { lat, lng } = getCoords(seed.area, singleIndex + 3);
    complaints.push({
      id,
      area: seed.area,
      category: seed.category,
      subcategory: seed.subcategory,
      description: `${seed.description} Single complaint sample ${singleIndex + 1}.`,
      status: seed.status,
      lat,
      lng,
      createdAt: new Date(Date.UTC(2026, 2, 20 + (singleIndex % 9), 9, 30)).toISOString(),
      assignments:
        seed.status === "PENDING" || seed.status === "AUTO_CLOSED"
          ? []
          : createAssignment(seed.category, id + 8000),
    });
    id += 1;
  });

  return complaints;
}

export const DEMO_COMPLAINTS: DemoComplaint[] = generateDemoComplaints();

export function buildPriorityClusters(rows: DemoComplaint[]): PriorityCluster[] {
  const groups = new Map<string, PriorityCluster>();

  for (const row of rows) {
    const key = `${row.area}__${row.category}__${row.subcategory}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        area: row.area,
        category: row.category,
        subcategory: row.subcategory,
        complaintIds: [row.id],
        pendingCount: row.status === "PENDING" || row.status === "IN_PROGRESS" ? 1 : 0,
        escalatedCount: row.status === "ESCALATED" ? 1 : 0,
        newestAt: row.createdAt,
        priorityScore: 0,
      });
      continue;
    }

    existing.complaintIds.push(row.id);
    if (row.status === "PENDING" || row.status === "IN_PROGRESS") {
      existing.pendingCount += 1;
    }
    if (row.status === "ESCALATED") {
      existing.escalatedCount += 1;
    }
    if (new Date(row.createdAt).getTime() > new Date(existing.newestAt).getTime()) {
      existing.newestAt = row.createdAt;
    }
  }

  return [...groups.values()]
    .filter((group) => group.complaintIds.length >= 2)
    .map((group) => ({
      ...group,
      priorityScore:
        group.complaintIds.length * 10 +
        group.pendingCount * 3 +
        group.escalatedCount * 6,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getClusterKey(input: {
  area: string;
  category: string;
  subcategory: string;
}) {
  return `${input.area}__${input.category}__${input.subcategory}`;
}
