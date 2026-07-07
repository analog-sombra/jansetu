import { object, pipe, string, trim, minLength, maxLength } from "valibot";

export const adminQueryValidationSchema = object({
  message: pipe(
    string(),
    trim(),
    minLength(10, "Query message must be at least 10 characters"),
    maxLength(500, "Query message must not exceed 500 characters"),
  ),
});

export type adminQueryValidationForm = {
  message: string;
};
