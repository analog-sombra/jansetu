import {
  custom,
  InferInput,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  regex,
  string,
  trim,
} from "valibot";

export const campComplaintValidationSchema = object({
  mobile: pipe(
    string(),
    trim(),
    regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  ),
  name: optional(pipe(string(), trim(), maxLength(120, "Name must be at most 120 characters"))),
  address: optional(
    pipe(string(), trim(), maxLength(500, "Address must be at most 500 characters")),
  ),
  aadhaar: optional(
    pipe(
      string(),
      trim(),
      regex(/^(|\d{12})$/, "Aadhaar must be exactly 12 digits"),
    ),
  ),
  voterId: optional(
    pipe(string(), trim(), maxLength(30, "Voter ID must be at most 30 characters")),
  ),
  categoryId: custom(
    (v): boolean => {
      const num = typeof v === "string" ? Number(v) : (v as number);
      return !isNaN(num) && num > 0;
    },
    "Please select a category",
  ),
  subcategoryId: custom(
    (v): boolean => {
      const num = typeof v === "string" ? Number(v) : (v as number);
      return !isNaN(num) && num > 0;
    },
    "Please select a sub-category",
  ),
  description: pipe(
    string(),
    trim(),
    minLength(20, "Description must be at least 20 characters"),
    maxLength(1000, "Description must be at most 1000 characters"),
  ),
  complaintAddress: pipe(
    string(),
    trim(),
    minLength(10, "Address must be at least 10 characters"),
    maxLength(500, "Address must be at most 500 characters"),
  ),
  affectedCitizensCount: pipe(
    string(),
    trim(),
    regex(/^[1-9]\d*$/, "Affected citizens count must be a positive number"),
  ),
  sublocalityId: custom(
    (v): boolean => {
      const num = typeof v === "string" ? Number(v) : (v as number);
      return !isNaN(num) && num > 0;
    },
    "Please select a sublocality",
  ),
  lat: pipe(
    string(),
    trim(),
    regex(/^-?\d{1,2}(\.\d+)?$/, "Please enter a valid latitude"),
  ),
  lng: pipe(
    string(),
    trim(),
    regex(/^-?\d{1,3}(\.\d+)?$/, "Please enter a valid longitude"),
  ),
});

export type campComplaintValidationForm = InferInput<
  typeof campComplaintValidationSchema
>;
