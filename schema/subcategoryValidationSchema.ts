import {
  InferInput,
  maxLength,
  minLength,
  object,
  pipe,
  string,
  trim,
} from "valibot";

const subcategoryValidationSchema = object({
  name: pipe(
    string(),
    trim(),
    minLength(2, "Subcategory name must be at least 2 characters"),
    maxLength(80, "Subcategory name must be at most 80 characters"),
  ),
  categoryId: pipe(
    string(),
    trim(),
    minLength(1, "Category is required"),
  ),
});

type subcategoryValidationForm = InferInput<typeof subcategoryValidationSchema>;

export { subcategoryValidationSchema, type subcategoryValidationForm };
