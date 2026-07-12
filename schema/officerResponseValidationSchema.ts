import {
  InferInput,
  minLength,
  object,
  pipe,
  string,
  picklist,
  maxLength,
} from "valibot";

const officerResponseValidationSchema = object({
  type: picklist(["RESOLVED", "QUERY", "REJECTED", "WORK_IN_PROGESS"]),
  message: pipe(
    string(),
    minLength(10, "Response message must be at least 10 characters"),
    maxLength(500, "Response message must be at most 500 characters"),
  ),
  plannedCompletionDate: string(),
});

type officerResponseValidationForm = InferInput<typeof officerResponseValidationSchema>;

export { officerResponseValidationSchema, type officerResponseValidationForm };
