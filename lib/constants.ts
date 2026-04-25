export const AUTH_COOKIE = "jansetu_session";

export const COMPLAINT_CATEGORIES = [
  "Road",
  "Water",
  "Electricity",
  "Sanitation",
  "Health",
  "Public Safety",
  "Other",
] as const;

export const SUBCATEGORIES: Record<string, string[]> = {
  Road: [
    "Pothole",
    "Road Damage",
    "Missing Signage",
    "Streetlight Not Working",
    "Road Debris",
    "Accident Site",
    "Other",
  ],
  Water: [
    "No Water Supply",
    "Low Pressure",
    "Water Leakage",
    "Water Quality Issue",
    "Pipeline Damage",
    "Water Contamination",
    "Other",
  ],
  Electricity: [
    "Power Cut",
    "Power Fluctuation",
    "Broken Pole",
    "Damaged Wire",
    "Illegal Connection",
    "Meter Issue",
    "Other",
  ],
  Sanitation: [
    "Garbage Not Collected",
    "Open Defecation",
    "Dirty Public Area",
    "Drain Clogged",
    "Sweeping Not Done",
    "Public Toilet Issue",
    "Other",
  ],
  Health: [
    "Disease Outbreak",
    "Lack of Vaccination",
    "Hospital Issue",
    "Ambulance Service",
    "Health Center Issue",
    "Medical Staff Issue",
    "Other",
  ],
  "Public Safety": [
    "Crime Report",
    "Unsafe Area",
    "Traffic Violation",
    "Police Response Issue",
    "Security Concern",
    "Fire Risk",
    "Other",
  ],
  Other: ["General Complaint"],
};

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
