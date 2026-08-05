import {
  InferInput,
  email,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  string,
  trim,
} from "valibot";

const officerValidationSchema = object({
  name: pipe(
    string(),
    trim(),
    minLength(2, "Officer name must be at least 2 characters"),
    maxLength(80, "Officer name must be at most 80 characters"),
  ),
  designation: pipe(
    string(),
    trim(),
    minLength(2, "Designation must be at least 2 characters"),
    maxLength(80, "Designation must be at most 80 characters"),
  ),
  email: optional(
    pipe(
      string(),
      trim(),
      email("Please enter a valid email address"),
      maxLength(120, "Email must be at most 120 characters"),
    )
  ),
  phone: pipe(
    string(),
    trim(),
    minLength(8, "Phone must be at least 8 characters"),
    maxLength(20, "Phone must be at most 20 characters"),
  ),
  departmentId: pipe(
    string(),
    trim(),
    minLength(1, "Department is required"),
  ),
});

type officerValidationForm = InferInput<typeof officerValidationSchema>;

export { officerValidationSchema, type officerValidationForm };
