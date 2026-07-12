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

const complaintValidationSchema = object({
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
  area: pipe(
    string(),
    trim(),
    minLength(1, "Area is required"),
    maxLength(100, "Area must be at most 100 characters"),
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
