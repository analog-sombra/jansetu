import {
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
  category: pipe(string(), trim(), minLength(1, "Please select a category")),
  subcategory: pipe(
    string(),
    trim(),
    minLength(1, "Please select a sub-category"),
  ),
  description: pipe(
    string(),
    trim(),
    minLength(20, "Description must be at least 20 characters"),
    maxLength(1000, "Description must be at most 1000 characters"),
  ),
  area: optional(
    pipe(
      string(),
      trim(),
      maxLength(100, "Area must be at most 100 characters"),
    ),
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
