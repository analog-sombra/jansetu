import {
  custom,
  InferInput,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  string,
  trim,
  union,
  literal,
} from "valibot";

const meetingValidationSchema = object({
  assignedToUserId: pipe(
    string(),
    trim(),
    minLength(1, "Please select an assigned user"),
  ),
  campHeadUserId: optional(pipe(string(), trim())),
  type: pipe(
    string(),
    trim(),
    minLength(1, "Please select a meeting type"),
  ),
  invitationSubtype: optional(pipe(string(), trim())),
  giftToCarry: optional(pipe(
    string(),
    trim(),
    maxLength(500, "Gift details must be at most 500 characters"),
  )),
  selfDraftedLetter: optional(pipe(
    string(),
    trim(),
    minLength(20, "Letter must be at least 20 characters"),
    maxLength(2000, "Letter must be at most 2000 characters"),
  )),
  purpose: optional(pipe(
    string(),
    trim(),
    maxLength(1000, "Purpose must be at most 1000 characters"),
  )),
  meetingDateTime: optional(string()),
  meetingPlace: optional(pipe(
    string(),
    trim(),
    maxLength(500, "Meeting place must be at most 500 characters"),
  )),
  preferredDateTime: optional(string()),
  priority: optional(string()),
  citizenName: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Citizen name must be at most 100 characters"),
  )),
  citizenMobile: optional(
    pipe(
      string(),
      trim(),
      custom((v): boolean => {
        return /^\d{10}$/.test(v as string);
      }, "Citizen mobile must be a valid 10-digit number"),
    )
  ),
  citizenArea: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Area must be at most 100 characters"),
  )),
  citizenDetails: optional(pipe(
    string(),
    trim(),
    maxLength(500, "Citizen details must be at most 500 characters"),
  )),
  contactName: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Contact name must be at most 100 characters"),
  )),
  contactMobile: optional(
    pipe(
      string(),
      trim(),
      custom((v): boolean => {
        if (!v) return true;
        return /^\d{10}$/.test(v as string);
      }, "Contact mobile must be a valid 10-digit number"),
    )
  ),
  contactDesignation: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Designation must be at most 100 characters"),
  )),
  contactDepartment: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Department must be at most 100 characters"),
  )),
  partyMeetDetails: optional(pipe(
    string(),
    trim(),
    maxLength(500, "Party meet details must be at most 500 characters"),
  )),
  selectedStaffNames: optional(string()),
  // Marriage invitation fields
  husbandName: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Husband name must be at most 100 characters"),
  )),
  wifeName: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Wife name must be at most 100 characters"),
  )),
  // Birthday invitation fields
  personName: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Person name must be at most 100 characters"),
  )),
  // Funeral invitation fields
  deceasedName: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Deceased name must be at most 100 characters"),
  )),
  relationWithDeceased: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Relation must be at most 100 characters"),
  )),
  dateOfDeath: optional(string()),
  // Letter recipient field (used for all invitation types)
  letterTo: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Letter recipient must be at most 100 characters"),
  )),
  // Birthday relation field
  relationWith: optional(pipe(
    string(),
    trim(),
    maxLength(100, "Relation must be at most 100 characters"),
  )),
});

export type MeetingFormValues = InferInput<typeof meetingValidationSchema>;
export default meetingValidationSchema;
