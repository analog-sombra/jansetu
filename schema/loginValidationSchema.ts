import {
  InferInput,
  maxLength,
  minLength,
  object,
  pipe,
  regex,
  string,
  trim,
} from "valibot";

const loginValidationSchema = object({
  mobile: pipe(
    string(),
    minLength(10, "Mobile number must be at least 10 characters"),
    maxLength(10, "Mobile number must be at most 10 characters"),
    regex(/^[\d]+$/, "Mobile number must contain only digits"),
    trim(),
  ),
  otp: string(), // Optional at first step, validated at runtime in page
});

type loginValidationForm = InferInput<typeof loginValidationSchema>;
export { loginValidationSchema, type loginValidationForm };
