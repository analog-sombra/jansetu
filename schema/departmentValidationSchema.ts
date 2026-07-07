import {
  InferInput,
  maxLength,
  minLength,
  number,
  object,
  pipe,
  string,
  trim,
} from "valibot";

const departmentValidationSchema = object({
  name: pipe(
    string(),
    trim(),
    minLength(2, "Department name must be at least 2 characters"),
    maxLength(80, "Department name must be at most 80 characters"),
  ),
});

type departmentValidationForm = InferInput<typeof departmentValidationSchema>;

export { departmentValidationSchema, type departmentValidationForm };
