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

const registerValidationSchema = object({
  name: pipe(
    string(),
    trim(),
    minLength(3, "Name must be at least 3 characters"),
    maxLength(120, "Name must be at most 120 characters"),
  ),
  address: pipe(
    string(),
    trim(),
    minLength(10, "Address must be at least 10 characters"),
    maxLength(500, "Address must be at most 500 characters"),
  ),
  aadhaar: optional(
    pipe(
      string(),
      trim(),
      regex(/^(|\d{12})$/, "Aadhaar must be exactly 12 digits"),
    ),
  ),
  voterId: pipe(
    string(),
    trim(),
    minLength(3, "Voter ID must be at least 3 characters"),
    maxLength(30, "Voter ID must be at most 30 characters"),
  ),
});

type registerValidationForm = InferInput<typeof registerValidationSchema>;

export { registerValidationSchema, type registerValidationForm };