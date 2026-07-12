import {
  InferInput,
  minLength,
  object,
  pipe,
  string,
  maxLength,
} from "valibot";

const rejectComplaintValidationSchema = object({
  message: pipe(
    string(),
    minLength(5, "Rejection reason must be at least 5 characters"),
    maxLength(500, "Rejection reason must be at most 500 characters"),
  ),
});

type rejectComplaintValidationForm = InferInput<typeof rejectComplaintValidationSchema>;

export { rejectComplaintValidationSchema, type rejectComplaintValidationForm };
