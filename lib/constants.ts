export const AUTH_COOKIE = "sevamesirsa_session";



export const RAJOURI_GARDEN_AREAS = [
  "Rajouri Garden",
  "Raghubir Nagar",
  "Tagore Garden",
  "Vishal Enclave",
  "Subhash Nagar",
  "Shivaji Enclave",
  "Mansarovar Garden",
  "Mayapuri",
  "Madipur",
  "Punjabi Bagh West",
  "Karampura",
  "Moti Nagar",
  "Ramesh Nagar",
  "Raja Garden",
  "Other",
] as const;

export const CATEGORY_DEPARTMENT_MAP: Record<string, string[]> = {
  Road: ["Public Works"],
  Water: ["Water Supply"],
  Electricity: ["Electricity"],
  Sanitation: ["Sanitation"],
  Health: ["Health"],
  "Public Safety": [],
  Other: [],
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  WORK_IN_PROGESS: "Work In Progess",
  QUERY_RAISED: "Query Raised",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  ESCALATED: "Escalated",
  AUTO_CLOSED: "Auto Closed",
};
    