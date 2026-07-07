import {
  InferInput,
  maxLength,
  minLength,
  object,
  pipe,
  string,
  trim,
} from "valibot";

const categoryValidationSchema = object({
  name: pipe(
    string(),
    trim(),
    minLength(2, "Category name must be at least 2 characters"),
    maxLength(80, "Category name must be at most 80 characters"),
  ),
  departmentId: pipe(
    string(),
    trim(),
    minLength(1, "Department is required"),
  ),
});

type categoryValidationForm = InferInput<typeof categoryValidationSchema>;

export { categoryValidationSchema, type categoryValidationForm };
