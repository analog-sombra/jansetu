export type TodayTaskMeetingType =
  | "Citizen Meet"
  | "Department Visit"
  | "Constituency Visit"
  | "Personal Meet";

export type TodayTaskRow = {
  key: string;
  time: string;
  meetingType: TodayTaskMeetingType;
  address: string;
  person: string;
  purpose: string;
};

export type DepartmentPendingCase = {
  key: string;
  complaintId: number;
  category: string;
  area: string;
  status: string;
  officerIntervention: string;
};

export type ConstituencySummaryRow = {
  key: string;
  category: string;
  resolved: number;
  inProgress: number;
  latestAction: string;
};

export type ConstituencyCaseRow = {
  key: string;
  complaintId: number;
  category: string;
  area: string;
  status: "Resolved" | "In Progress";
  officer: string;
  updatedOn: string;
  details: string;
};

export type TodayTaskDetail = TodayTaskRow & {
  citizen?: {
    mobile: string;
    area: string;
    details: string;
    concern: string;
  };
  departmentVisit?: {
    department: string;
    interventionSummary: string;
    pendingCases: DepartmentPendingCase[];
  };
  constituencyVisit?: {
    areaCovered: string;
    groupedSummary: ConstituencySummaryRow[];
    resolvedCases: ConstituencyCaseRow[];
    inProgressCases: ConstituencyCaseRow[];
  };
  personalMeet?: {
    relationContext: string;
    briefingNotes: string[];
  };
};

export const TODAY_TASKS: TodayTaskDetail[] = [
  {
    key: "task-1",
    time: "09:00 AM",
    meetingType: "Citizen Meet",
    address: "Rajouri Garden Main Market, Ward 11",
    person: "Mrs. Kavita Sharma",
    purpose: "Discuss repeated drainage overflow and seek immediate inspection schedule.",
    citizen: {
      mobile: "+91 98110 22451",
      area: "Ward 11, Rajouri Garden Main Market",
      details: "Market association volunteer representing 18 nearby shopkeepers.",
      concern: "Open drain overflow, foul smell, and mosquito breeding near the loading bay.",
    },
  },
  {
    key: "task-2",
    time: "09:45 AM",
    meetingType: "Department Visit",
    address: "Water Supply Office, Ward 14",
    person: "Executive Engineer R. Khan",
    purpose: "Review overdue water complaints that need field officer intervention and escalation.",
    departmentVisit: {
      department: "Water Supply",
      interventionSummary: "Three unresolved complaints need site inspection approval, tanker deployment, and valve recalibration.",
      pendingCases: [
        {
          key: "dep-2-1",
          complaintId: 4102,
          category: "Low Pressure",
          area: "Ward 14 Low Zone",
          status: "Pending Inspection",
          officerIntervention: "Approve pressure audit and assign zonal field team.",
        },
        {
          key: "dep-2-2",
          complaintId: 4117,
          category: "Pipeline Leakage",
          area: "Azad Chowk",
          status: "Escalated",
          officerIntervention: "Sanction emergency repair slot and road cutting permission.",
        },
        {
          key: "dep-2-3",
          complaintId: 4130,
          category: "No Water Supply",
          area: "Railway Colony",
          status: "Pending Department Action",
          officerIntervention: "Authorize temporary tanker support for two days.",
        },
      ],
    },
  },
  {
    key: "task-3",
    time: "10:30 AM",
    meetingType: "Constituency Visit",
    address: "Tagore Garden Extension Park",
    person: "Residents Welfare Group",
    purpose: "Field review of the last one month grievance work and current in-progress cases across the pocket.",
    constituencyVisit: {
      areaCovered: "Tagore Garden Extension and adjoining market roads",
      groupedSummary: [
        {
          key: "const-3-s1",
          category: "Roads",
          resolved: 6,
          inProgress: 2,
          latestAction: "Main lane resurfacing completed this week.",
        },
        {
          key: "const-3-s2",
          category: "Water",
          resolved: 4,
          inProgress: 1,
          latestAction: "Two leak points sealed and pressure normalized.",
        },
        {
          key: "const-3-s3",
          category: "Sanitation",
          resolved: 5,
          inProgress: 2,
          latestAction: "Dump point removed and alternate pickup route assigned.",
        },
      ],
      resolvedCases: [
        {
          key: "const-3-r1",
          complaintId: 5201,
          category: "Roads",
          area: "Park Access Lane",
          status: "Resolved",
          officer: "Officer 4",
          updatedOn: "2026-04-09",
          details: "Pothole cluster filled and top surface compacted.",
        },
        {
          key: "const-3-r2",
          complaintId: 5209,
          category: "Water",
          area: "Block C",
          status: "Resolved",
          officer: "Officer 7",
          updatedOn: "2026-04-13",
          details: "Valve issue rectified and pressure restored for evening cycle.",
        },
        {
          key: "const-3-r3",
          complaintId: 5220,
          category: "Sanitation",
          area: "Extension Market",
          status: "Resolved",
          officer: "Officer 2",
          updatedOn: "2026-04-18",
          details: "Overflowing bins cleared and daily pickup restarted.",
        },
      ],
      inProgressCases: [
        {
          key: "const-3-p1",
          complaintId: 5234,
          category: "Roads",
          area: "Inner Service Road",
          status: "In Progress",
          officer: "Officer 9",
          updatedOn: "2026-04-24",
          details: "Tender approved; patchwork team expected on Monday.",
        },
        {
          key: "const-3-p2",
          complaintId: 5241,
          category: "Sanitation",
          area: "Community Bin Point",
          status: "In Progress",
          officer: "Officer 5",
          updatedOn: "2026-04-25",
          details: "Secondary container placement pending depot dispatch.",
        },
      ],
    },
  },
  {
    key: "task-4",
    time: "11:15 AM",
    meetingType: "Personal Meet",
    address: "Office Chamber, Jan Setu Kendra",
    person: "Mr. Deepak Arora",
    purpose: "Internal coordination meeting on volunteer outreach and grievance camp planning.",
    personalMeet: {
      relationContext: "Core volunteer coordinator for monthly grievance camps.",
      briefingNotes: [
        "Review booth-wise turnout in last two outreach camps.",
        "Finalize volunteer roster for Ward 8 and Ward 11 support desks.",
        "Prepare handoff note for high-priority escalations.",
      ],
    },
  },
  {
    key: "task-5",
    time: "12:00 PM",
    meetingType: "Citizen Meet",
    address: "Shivaji Enclave Community Hall",
    person: "Ms. Renu Batra",
    purpose: "Understand repeated complaints around broken streetlights and safety concerns at night.",
    citizen: {
      mobile: "+91 98990 11832",
      area: "Shivaji Enclave",
      details: "School committee member coordinating complaints from three blocks.",
      concern: "Six streetlights are non-functional near the school stretch and park boundary.",
    },
  },
  {
    key: "task-6",
    time: "01:15 PM",
    meetingType: "Department Visit",
    address: "PWD Zonal Office, Ward 3",
    person: "Assistant Engineer P. Singh",
    purpose: "Push action on road cut and pavement complaints stuck at approval stage.",
    departmentVisit: {
      department: "Public Works Department",
      interventionSummary: "Pending files need engineering sign-off, contractor mobilization, and one joint inspection.",
      pendingCases: [
        {
          key: "dep-6-1",
          complaintId: 4351,
          category: "Road Cut Restoration",
          area: "Ward 3 Main Corridor",
          status: "Approval Pending",
          officerIntervention: "Escalate contractor start date and confirm material availability.",
        },
        {
          key: "dep-6-2",
          complaintId: 4368,
          category: "Footpath Damage",
          area: "Krishna Gali",
          status: "Joint Inspection Required",
          officerIntervention: "Schedule field inspection with JE and residents committee.",
        },
      ],
    },
  },
  {
    key: "task-7",
    time: "02:00 PM",
    meetingType: "Constituency Visit",
    address: "Mansarovar Garden Main Lane",
    person: "Local shopkeepers association",
    purpose: "Review one-month performance of sanitation and road repairs, and inspect active in-progress items.",
    constituencyVisit: {
      areaCovered: "Mansarovar Garden market lane and service roads",
      groupedSummary: [
        {
          key: "const-7-s1",
          category: "Sanitation",
          resolved: 7,
          inProgress: 1,
          latestAction: "Morning pickup cycle stabilized for the full market belt.",
        },
        {
          key: "const-7-s2",
          category: "Roads",
          resolved: 3,
          inProgress: 2,
          latestAction: "Damaged curb stones replaced near parking entry.",
        },
      ],
      resolvedCases: [
        {
          key: "const-7-r1",
          complaintId: 5311,
          category: "Sanitation",
          area: "Vegetable Market",
          status: "Resolved",
          officer: "Officer 6",
          updatedOn: "2026-04-05",
          details: "Overflow point removed and collection route increased to twice daily.",
        },
        {
          key: "const-7-r2",
          complaintId: 5322,
          category: "Roads",
          area: "Main Lane Entry",
          status: "Resolved",
          officer: "Officer 3",
          updatedOn: "2026-04-11",
          details: "Broken paving repaired and pedestrian access reopened.",
        },
      ],
      inProgressCases: [
        {
          key: "const-7-p1",
          complaintId: 5338,
          category: "Roads",
          area: "Back Service Road",
          status: "In Progress",
          officer: "Officer 11",
          updatedOn: "2026-04-23",
          details: "Patchwork started; final rolling pending because of rain interruption.",
        },
        {
          key: "const-7-p2",
          complaintId: 5344,
          category: "Sanitation",
          area: "Wholesale Corner",
          status: "In Progress",
          officer: "Officer 8",
          updatedOn: "2026-04-24",
          details: "Additional bins approved and depot transfer expected tomorrow.",
        },
      ],
    },
  },
  {
    key: "task-8",
    time: "03:10 PM",
    meetingType: "Citizen Meet",
    address: "Ward 8 Public Help Desk",
    person: "Mr. Imran Ali",
    purpose: "Take feedback on pending sewer choke complaints and agree next action timeline.",
    citizen: {
      mobile: "+91 98111 00973",
      area: "Ward 8 Public Help Desk",
      details: "Resident representative from lane committee near bus depot.",
      concern: "Recurring sewer choke after every weekend due to overloaded outlet line.",
    },
  },
  {
    key: "task-9",
    time: "04:00 PM",
    meetingType: "Personal Meet",
    address: "Residence Office, Subhash Nagar Border",
    person: "Dr. Neha Sethi",
    purpose: "Brief consultation on medical camp coordination and resident grievance consolidation.",
    personalMeet: {
      relationContext: "Community health organizer supporting ward-level civic outreach.",
      briefingNotes: [
        "Collect patient queue feedback from last health camp.",
        "Identify complaint clusters near dispensary access roads.",
        "Map volunteer availability for next fortnight.",
      ],
    },
  },
  {
    key: "task-10",
    time: "05:00 PM",
    meetingType: "Department Visit",
    address: "Sanitation Depot, Ward 6",
    person: "Sanitary Inspector M. Yadav",
    purpose: "Review backlog of missed pickups and push deployment for stagnant garbage complaints.",
    departmentVisit: {
      department: "Sanitation",
      interventionSummary: "Two chronic complaint pockets need extra vehicle coverage and route reassignment this week.",
      pendingCases: [
        {
          key: "dep-10-1",
          complaintId: 4480,
          category: "Missed Garbage Pickup",
          area: "Ward 6 Depot Road",
          status: "Backlog",
          officerIntervention: "Approve second-shift vehicle for three-day clearance drive.",
        },
        {
          key: "dep-10-2",
          complaintId: 4486,
          category: "Dump Point Overflow",
          area: "Old Market Pocket",
          status: "Pending Route Change",
          officerIntervention: "Authorize route adjustment and assign backup supervisor.",
        },
        {
          key: "dep-10-3",
          complaintId: 4492,
          category: "Sweeping Delay",
          area: "Subhash Nagar Border",
          status: "Under Review",
          officerIntervention: "Confirm attendance issue and replace absent staff for one week.",
        },
      ],
    },
  },
];

export function getTodayTask(taskId: string) {
  return TODAY_TASKS.find((task) => task.key === taskId) ?? null;
}
