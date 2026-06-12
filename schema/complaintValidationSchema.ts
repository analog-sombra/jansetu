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

const complaintValidationSchema = object({
  category: pipe(
    string(),
    trim(),
    minLength(1, "Please select a category"),
  ),
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

type complaintValidationForm = InferInput<typeof complaintValidationSchema>;

export { complaintValidationSchema, type complaintValidationForm };
